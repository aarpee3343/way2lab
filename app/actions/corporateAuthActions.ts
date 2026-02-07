'use server';

import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { getCorpUser } from '@/lib/auth-corp';

const SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET);

function normalizeIdentifier(value: FormDataEntryValue | null) {
  return String(value || '').trim().toLowerCase();
}

async function resolveCorporateLoginUser(identifier: string) {
  const include = {
    corporate: {
      select: {
        id: true,
        companyName: true,
        isActive: true
      }
    }
  } as const;

  const directUser = await prisma.corporateUser.findFirst({
    where: { email: { equals: identifier, mode: 'insensitive' } },
    include
  });
  if (directUser) return { user: directUser, viaCorporateEmail: false };

  // Fallback: allow login with corporate master email by mapping to a valid corp user.
  const corp = await prisma.corporate.findFirst({
    where: { email: { equals: identifier, mode: 'insensitive' } },
    select: { id: true }
  });
  if (!corp) return null;

  const fallbackUser =
    (await prisma.corporateUser.findFirst({
      where: { corporateId: corp.id, role: 'SUPER_ADMIN', isActive: true },
      include
    })) ||
    (await prisma.corporateUser.findFirst({
      where: { corporateId: corp.id, isActive: true },
      include
    }));

  return fallbackUser ? { user: fallbackUser, viaCorporateEmail: true } : null;
}

export async function corporateLoginAction(formData: FormData) {
  const identifier = normalizeIdentifier(formData.get('email'));
  const password = String(formData.get('password') || '');

  try {
    if (!identifier || !password) {
      return { success: false, error: 'Invalid credentials' };
    }

    // 1. Find the Corporate User
    const resolved = await resolveCorporateLoginUser(identifier);

    // 2. Validate User & Corporate Status
    if (!resolved) {
      return { success: false, error: "Invalid credentials" };
    }
    const { user, viaCorporateEmail } = resolved;

    if (!user.isActive || !user.corporate.isActive) {
      return { success: false, error: "Account or Corporate is deactivated. Contact Support." };
    }

    // 3. Verify Password
    const passwordCandidates = Array.from(new Set([password, password.trim()])).filter(Boolean);
    let matchedPassword: string | null = null;
    let matchedByLegacyPlaintext = false;
    let matchedByCorporateMasterPassword = false;

    for (const candidate of passwordCandidates) {
      const ok = await bcrypt.compare(candidate, user.password).catch(() => false);
      if (ok) {
        matchedPassword = candidate;
        break;
      }
    }

    if (!matchedPassword) {
      const plainMatch = passwordCandidates.find((candidate) => candidate === user.password);
      if (plainMatch) {
        matchedPassword = plainMatch;
        matchedByLegacyPlaintext = true;
      }
    }

    // If login used the corporate master email, allow corporate master password too.
    // This also heals old records where corporate password changed but corporateUser did not.
    if (!matchedPassword && viaCorporateEmail) {
      const corpCredential = await prisma.corporate.findUnique({
        where: { id: user.corporateId },
        select: { password: true, isActive: true }
      });
      if (corpCredential?.isActive) {
        for (const candidate of passwordCandidates) {
          const ok = await bcrypt.compare(candidate, corpCredential.password).catch(() => false);
          if (ok) {
            matchedPassword = candidate;
            matchedByCorporateMasterPassword = true;
            break;
          }
        }
        if (!matchedPassword) {
          const plainMatch = passwordCandidates.find((candidate) => candidate === corpCredential.password);
          if (plainMatch) {
            matchedPassword = plainMatch;
            matchedByCorporateMasterPassword = true;
          }
        }
      }
    }

    if (!matchedPassword) {
      return { success: false, error: "Invalid credentials" };
    }

    // Backward compatibility: migrate any legacy plain-text password to bcrypt.
    if (matchedByLegacyPlaintext || matchedByCorporateMasterPassword) {
      await prisma.corporateUser.update({
        where: { id: user.id },
        data: { password: await bcrypt.hash(matchedPassword, 10) }
      });
    }

    // 4. Generate JWT Payload
    // We include corporateId and permissions so the UI can adapt instantly
    const tokenPayload = {
      userId: user.id,
      corporateId: user.corporateId,
      email: user.email,
      role: user.role, // SUPER_ADMIN, DEPT_HEAD, LOCATION_MANAGER
      maskContactInfo: user.maskContactInfo,
      canEdit: user.canEdit,
      accessDept: user.accessDept,
      accessLocation: user.accessLocation
    };

    // 5. Sign JWT
    const token = await new SignJWT(tokenPayload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h') // Corporate session lasts 24 hours
      .sign(SECRET_KEY);

    // 6. Set Cookie
    const cookieStore = await cookies();
    cookieStore.set('corp_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // 1 day
    });

    return { success: true };
  } catch (error) {
    console.error("Corp Login Error:", error);
    return { success: false, error: "An internal error occurred" };
  }
}

export async function getCorporateSubAdmins() {
  const session = await getCorpUser();
  if (!session?.corporateId) return [];

  return await prisma.corporateUser.findMany({
    where: { corporateId: session.corporateId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      canEdit: true,
      maskContactInfo: true,
      accessDept: true,
      accessLocation: true,
      isActive: true,
      createdAt: true
    }
  });
}

export async function toggleMaskingAction(userId: number, currentStatus: boolean) {
  try {
    const session = await getCorpUser();
    if (!session?.corporateId) {
      return { success: false, error: "Unauthorized" };
    }

    const canManage =
      session.role === 'SUPER_ADMIN' || session.canEdit === true;
    if (!canManage) {
      return { success: false, error: "Insufficient permissions" };
    }

    const result = await prisma.corporateUser.updateMany({
      where: { id: userId, corporateId: session.corporateId },
      data: { maskContactInfo: !currentStatus }
    });

    if (result.count === 0) {
      return { success: false, error: "User not found" };
    }
    
    // Refresh the users page so the UI updates
    revalidatePath('/corp-users');
    return { success: true };
  } catch (error) {
    return { success: false, error: "Update failed" };
  }
}

export async function getCorpSession() {
  const session = await getCorpUser();
  if (!session) return null;

  return {
    userId: session.userId,
    corporateId: session.corporateId,
    email: session.email,
    role: session.role,
    canEdit: session.canEdit,
    accessDept: session.accessDept,
    accessLocation: session.accessLocation,
    maskContactInfo: session.maskContactInfo
  };
}

// 7. Logout Action
export async function corporateLogoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete('corp_token');
  return { success: true };
}

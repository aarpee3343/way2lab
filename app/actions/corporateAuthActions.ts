'use server';

import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

const SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET);

export async function corporateLoginAction(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  try {
    // 1. Find the Corporate User
    const user = await prisma.corporateUser.findUnique({
      where: { email },
      include: {
        corporate: {
          select: {
            id: true,
            companyName: true,
            isActive: true
          }
        }
      }
    });

    // 2. Validate User & Corporate Status
    if (!user) {
      return { success: false, error: "Invalid credentials" };
    }

    if (!user.isActive || !user.corporate.isActive) {
      return { success: false, error: "Account or Corporate is deactivated. Contact Support." };
    }

    // 3. Verify Password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return { success: false, error: "Invalid credentials" };
    }

    // 4. Generate JWT Payload
    // We include corporateId and permissions so the UI can adapt instantly
    const tokenPayload = {
      userId: user.id,
      corporateId: user.corporateId,
      email: user.email,
      role: user.role, // CORP_ADMIN, DEPT_HEAD, etc.
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
      secure: process.env.NODE_SETTING === 'production',
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

export async function getCorporateSubAdmins(corporateId: number) {
  return await prisma.corporateUser.findMany({
    where: { corporateId },
    orderBy: { createdAt: 'desc' }
  });
}

export async function toggleMaskingAction(userId: number, currentStatus: boolean) {
  try {
    await prisma.corporateUser.update({
      where: { id: userId },
      data: { maskContactInfo: !currentStatus }
    });
    
    // Refresh the users page so the UI updates
    revalidatePath('/corporate/users');
    return { success: true };
  } catch (error) {
    return { success: false, error: "Update failed" };
  }
}

// 7. Logout Action
export async function corporateLogoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete('corp_token');
  return { success: true };
}
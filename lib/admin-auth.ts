import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import { prisma } from '@/lib/db';
import type { AdminRole } from '@prisma/client';

const ADMIN_TOKEN_COOKIE = 'admin_token';
const ADMIN_JWT_SECRET =
  process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET || '';

if (!ADMIN_JWT_SECRET) {
  console.warn('ADMIN_JWT_SECRET/JWT_SECRET missing. Admin auth will fail.');
}

export type AdminSession = {
  id: number;
  name: string;
  email: string;
  role: AdminRole;
};

const getSecret = () => new TextEncoder().encode(ADMIN_JWT_SECRET);

export async function issueAdminToken(session: AdminSession) {
  if (!ADMIN_JWT_SECRET) {
    throw new Error('Admin auth secret not configured');
  }

  return new SignJWT({
    adminId: session.id,
    role: session.role,
    email: session.email,
    name: session.name,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(getSecret());
}

export async function setAdminAuthCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24,
    path: '/',
  });
}

export async function clearAdminAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_TOKEN_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
}

export async function getAdminSession(): Promise<AdminSession | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_TOKEN_COOKIE)?.value;
    if (!token || !ADMIN_JWT_SECRET) return null;

    const { payload } = await jwtVerify(token, getSecret());
    const adminId = Number(payload.adminId);
    if (!adminId) return null;

    const admin = await prisma.admin.findUnique({
      where: { id: adminId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    if (!admin || !admin.isActive) return null;

    return {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
    };
  } catch (error) {
    return null;
  }
}

export async function requireAdmin(options?: { roles?: AdminRole[] }) {
  const session = await getAdminSession();
  if (!session) {
    throw new Error('UNAUTHORIZED');
  }

  if (options?.roles && !options.roles.includes(session.role)) {
    throw new Error('FORBIDDEN');
  }

  return session;
}

export { ADMIN_TOKEN_COOKIE };

'use server';

import bcrypt from 'bcryptjs';
import prisma from '@/lib/db';
import { issueAdminToken, setAdminAuthCookie } from '@/lib/admin-auth';

export async function adminLoginAction(identifier: string, pass: string) {
  try {
    const admin = await prisma.admin.findFirst({
      where: {
        OR: [{ email: identifier }, { phone: identifier }]
      }
    });

    if (!admin || !admin.isActive) {
      return { success: false, error: 'Invalid credentials' };
    }

    const isMatch = await bcrypt.compare(pass, admin.password);
    if (!isMatch) {
      return { success: false, error: 'Invalid credentials' };
    }

    const token = await issueAdminToken({
      id: admin.id,
      name: admin.name,
      email: admin.email,
      role: admin.role
    });

    await setAdminAuthCookie(token);

    await prisma.admin.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() }
    });

    return { success: true };
  } catch (error) {
    console.error('Login Error:', error);
    return { success: false, error: 'Login failed' };
  }
}

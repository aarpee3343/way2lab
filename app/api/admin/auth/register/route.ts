import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { issueAdminToken, setAdminAuthCookie } from '@/lib/admin-auth';

const ADMIN_OTP_PHONE = process.env.ADMIN_OTP_PHONE || '+919457590000';

export async function POST(req: Request) {
  try {
    const { name, email, phone, password, otp } = await req.json();

    if (!name || !email || !phone || !password || !otp) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    const otpRecord = await prisma.verificationCode.findUnique({
      where: { phone: ADMIN_OTP_PHONE }
    });

    if (!otpRecord || otpRecord.code !== otp) {
      return NextResponse.json({ success: false, message: 'Invalid OTP' }, { status: 400 });
    }

    if (new Date() > otpRecord.expiresAt) {
      return NextResponse.json({ success: false, message: 'OTP expired' }, { status: 400 });
    }

    const existing = await prisma.admin.findFirst({
      where: {
        OR: [{ email }, { phone }]
      }
    });

    if (existing) {
      return NextResponse.json(
        { success: false, message: 'Admin already exists with this email or phone' },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const admin = await prisma.admin.create({
      data: {
        name,
        email,
        phone,
        password: passwordHash,
        role: 'SUPER_ADMIN',
        isActive: true,
      }
    });

    await prisma.verificationCode.delete({
      where: { phone: ADMIN_OTP_PHONE }
    }).catch(() => undefined);

    const token = await issueAdminToken({
      id: admin.id,
      name: admin.name,
      email: admin.email,
      role: admin.role
    });

    await setAdminAuthCookie(token);

    return NextResponse.json({ success: true, adminId: admin.id });
  } catch (error) {
    console.error('Admin Register Error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

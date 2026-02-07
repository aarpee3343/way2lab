import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { sendEmail } from '@/lib/mailer';

const OTP_EXPIRY_MINUTES = 10;

function normalizeEmail(email: string) {
  return String(email || '').trim().toLowerCase();
}

export const runtime = 'nodejs';

async function resolveCorporateUser(email: string) {
  const directUser = await prisma.corporateUser.findFirst({
    where: { email: { equals: email, mode: 'insensitive' } },
    include: {
      corporate: { select: { companyName: true, isActive: true } }
    }
  });

  if (directUser) return directUser;

  const corp = await prisma.corporate.findFirst({
    where: { email: { equals: email, mode: 'insensitive' } },
    select: { id: true, companyName: true, isActive: true }
  });

  if (!corp) return null;

  const primaryUser =
    (await prisma.corporateUser.findFirst({
      where: { corporateId: corp.id, role: 'SUPER_ADMIN', isActive: true },
      include: {
        corporate: { select: { companyName: true, isActive: true } }
      }
    })) ||
    (await prisma.corporateUser.findFirst({
      where: { corporateId: corp.id, isActive: true },
      include: {
        corporate: { select: { companyName: true, isActive: true } }
      }
    }));

  return primaryUser;
}

export async function GET() {
  return NextResponse.json({ success: true });
}

export async function POST(req: Request) {
  try {
    const { action, email, code, newPassword } = await req.json();
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      return NextResponse.json(
        { success: false, message: 'Valid email required' },
        { status: 400 }
      );
    }

    if (action === 'SEND') {
      const user = await resolveCorporateUser(normalizedEmail);

      if (!user) {
        return NextResponse.json(
          { success: false, message: 'Corporate user not found' }
        );
      }

      if (!user.isActive || !user.corporate.isActive) {
        return NextResponse.json(
          { success: false, message: 'Account is deactivated. Contact support.' }
        );
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

      await prisma.emailVerificationCode.upsert({
        where: { email: normalizedEmail },
        update: { code: otp, expiresAt },
        create: { email: normalizedEmail, code: otp, expiresAt }
      });

      const emailRes = await sendEmail({
        to: normalizedEmail,
        subject: 'WayToLab Corporate Password Reset',
        template: 'corp_password_reset_otp',
        vars: { otp, companyName: user.corporate.companyName }
      });

      if (!emailRes.success) {
        return NextResponse.json(
          { success: false, message: emailRes.error || 'Email send failed' },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, message: 'OTP sent successfully' });
    }

    if (action === 'RESET') {
      if (!code) {
        return NextResponse.json(
          { success: false, message: 'OTP code required' },
          { status: 400 }
        );
      }

      if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
        return NextResponse.json(
          { success: false, message: 'Password must be at least 6 characters' },
          { status: 400 }
        );
      }

      const record = await prisma.emailVerificationCode.findUnique({
        where: { email: normalizedEmail }
      });

      if (!record) {
        return NextResponse.json(
          { success: false, message: 'OTP not found. Resend it.' },
          { status: 400 }
        );
      }

      if (record.code !== code) {
        return NextResponse.json(
          { success: false, message: 'Invalid OTP' },
          { status: 400 }
        );
      }

      if (new Date() > record.expiresAt) {
        return NextResponse.json(
          { success: false, message: 'OTP expired' },
          { status: 400 }
        );
      }

      const user = await resolveCorporateUser(normalizedEmail);

      if (!user) {
        return NextResponse.json(
          { success: false, message: 'Corporate user not found' }
        );
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await prisma.corporateUser.update({
        where: { id: user.id },
        data: { password: hashedPassword }
      });

      await prisma.emailVerificationCode.delete({ where: { email: normalizedEmail } }).catch(() => null);

      return NextResponse.json({ success: true, message: 'Password reset successful' });
    }

    return NextResponse.json(
      { success: false, message: 'Invalid Action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Corporate password reset error:', error);
    return NextResponse.json(
      { success: false, message: 'Server Error' },
      { status: 500 }
    );
  }
}

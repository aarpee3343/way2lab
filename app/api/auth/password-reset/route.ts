import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { sendSMS } from '@/lib/sms';

const OTP_EXPIRY_MINUTES = 10;

function normalizePhone(phone: string) {
  return String(phone || '').replace(/\D/g, '');
}

export async function POST(req: Request) {
  try {
    const { action, phone, code, newPassword } = await req.json();
    const normalizedPhone = normalizePhone(phone);

    if (!normalizedPhone || normalizedPhone.length !== 10) {
      return NextResponse.json(
        { success: false, message: 'Valid 10 digit phone number required' },
        { status: 400 }
      );
    }

    if (action === 'SEND') {
      const user = await prisma.customer.findUnique({
        where: { phone: normalizedPhone }
      });

      if (!user) {
        return NextResponse.json(
          { success: false, message: 'Account not found for this phone' },
          { status: 404 }
        );
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

      await prisma.verificationCode.upsert({
        where: { phone: normalizedPhone },
        update: { code: otp, expiresAt },
        create: { phone: normalizedPhone, code: otp, expiresAt }
      });

      const sent = await sendSMS(normalizedPhone, 'OTP', [otp]);
      if (!sent) {
        return NextResponse.json(
          { success: false, message: 'SMS Gateway Error' },
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

      const record = await prisma.verificationCode.findUnique({
        where: { phone: normalizedPhone }
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

      const user = await prisma.customer.findUnique({
        where: { phone: normalizedPhone }
      });

      if (!user) {
        return NextResponse.json(
          { success: false, message: 'Account not found for this phone' },
          { status: 404 }
        );
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await prisma.customer.update({
        where: { id: user.id },
        data: { password: hashedPassword }
      });

      await prisma.verificationCode.delete({ where: { phone: normalizedPhone } }).catch(() => null);

      return NextResponse.json({ success: true, message: 'Password reset successful' });
    }

    return NextResponse.json(
      { success: false, message: 'Invalid Action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json(
      { success: false, message: 'Server Error' },
      { status: 500 }
    );
  }
}

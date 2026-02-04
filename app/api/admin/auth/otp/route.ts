import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendSMS } from '@/lib/sms';

const ADMIN_OTP_PHONE = process.env.ADMIN_OTP_PHONE || '+919457590000';
const OTP_TTL_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 30 * 1000;

export async function POST(req: Request) {
  try {
    const { action, code } = await req.json();

    if (action === 'SEND') {
      const existing = await prisma.verificationCode.findUnique({
        where: { phone: ADMIN_OTP_PHONE }
      });

      if (existing && Date.now() - new Date(existing.createdAt).getTime() < RESEND_COOLDOWN_MS) {
        return NextResponse.json(
          { success: false, message: 'OTP already sent. Please wait before retrying.' },
          { status: 429 }
        );
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + OTP_TTL_MS);

      await prisma.verificationCode.upsert({
        where: { phone: ADMIN_OTP_PHONE },
        update: { code: otp, expiresAt, createdAt: new Date() },
        create: { phone: ADMIN_OTP_PHONE, code: otp, expiresAt }
      });

      const sent = await sendSMS(ADMIN_OTP_PHONE, 'OTP', [otp]);
      if (!sent) {
        return NextResponse.json(
          { success: false, message: 'SMS gateway error' },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, message: 'OTP sent' });
    }

    if (action === 'VERIFY') {
      const record = await prisma.verificationCode.findUnique({
        where: { phone: ADMIN_OTP_PHONE }
      });

      if (!record) {
        return NextResponse.json(
          { success: false, message: 'OTP not found. Resend it.' },
          { status: 400 }
        );
      }

      if (record.code !== code) {
        return NextResponse.json({ success: false, message: 'Invalid OTP' }, { status: 400 });
      }

      if (new Date() > record.expiresAt) {
        return NextResponse.json({ success: false, message: 'OTP expired' }, { status: 400 });
      }

      return NextResponse.json({ success: true, message: 'Verified' });
    }

    return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Admin OTP Error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

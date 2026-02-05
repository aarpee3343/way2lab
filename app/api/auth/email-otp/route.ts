import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendEmail } from '@/lib/mailer';

const OTP_EXPIRY_MINUTES = 10;

function normalizeEmail(email: string) {
  return String(email || '').trim().toLowerCase();
}

export async function POST(req: Request) {
  try {
    const { action, email, code } = await req.json();
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      return NextResponse.json({ success: false, message: 'Valid email required' }, { status: 400 });
    }

    if (action === 'SEND') {
      const domainPart = normalizedEmail.split('@')[1];
      const domain = domainPart.startsWith('@') ? domainPart : '@' + domainPart;

      const corporate = await prisma.corporate.findFirst({
        where: {
          domains: { has: domain },
          isActive: true
        },
        select: { id: true, companyName: true }
      });

      if (!corporate) {
        return NextResponse.json({
          success: true,
          requiresVerification: false
        });
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
        subject: 'WayToLab Email Verification Code',
        template: 'email_otp',
        vars: { otp }
      });

      if (!emailRes.success) {
        return NextResponse.json({ success: false, message: emailRes.error || 'Email send failed' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        requiresVerification: true
      });
    }

    if (action === 'VERIFY') {
      if (!code) {
        return NextResponse.json({ success: false, message: 'OTP code required' }, { status: 400 });
      }

      const record = await prisma.emailVerificationCode.findUnique({
        where: { email: normalizedEmail }
      });

      if (!record) {
        return NextResponse.json({ success: false, message: 'OTP not found. Resend it.' }, { status: 400 });
      }

      if (record.code !== code) {
        return NextResponse.json({ success: false, message: 'Invalid OTP' }, { status: 400 });
      }

      if (new Date() > record.expiresAt) {
        return NextResponse.json({ success: false, message: 'OTP Expired' }, { status: 400 });
      }

      return NextResponse.json({ success: true, message: 'Verified' });
    }

    return NextResponse.json({ success: false, message: 'Invalid Action' }, { status: 400 });
  } catch (error) {
    console.error('Email OTP API Error:', error);
    return NextResponse.json({ success: false, message: 'Server Error' }, { status: 500 });
  }
}

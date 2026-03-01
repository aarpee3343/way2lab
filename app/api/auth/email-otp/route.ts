import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendEmail } from '@/lib/mailer';
import { generateOtpCode, hashOtpCode, verifyOtpCode } from '@/lib/otp';
import { getRequestIp, rateLimit } from '@/lib/rate-limit';

const OTP_EXPIRY_MINUTES = 10;

function normalizeEmail(email: string) {
  return String(email || '').trim().toLowerCase();
}

export async function POST(req: Request) {
  try {
    const { action, email, code } = await req.json();
    const normalizedEmail = normalizeEmail(email);
    const ip = getRequestIp(req);

    const rl = await rateLimit({
      key: `auth:email-otp:${action}:${normalizedEmail || ip}`,
      limit: action === 'SEND' ? 5 : 20,
      windowSec: 60,
    });
    if (!rl.allowed) {
      return NextResponse.json({ success: false, message: 'Too many requests. Please try again shortly.' }, { status: 429 });
    }

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

      const otp = generateOtpCode();
      const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

      await prisma.emailVerificationCode.upsert({
        where: { email: normalizedEmail },
        update: { code: hashOtpCode(otp), expiresAt },
        create: { email: normalizedEmail, code: hashOtpCode(otp), expiresAt }
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

      if (!verifyOtpCode(record.code, code)) {
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

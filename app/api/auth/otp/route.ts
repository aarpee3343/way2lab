import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendSMS } from '@/lib/sms'; 
import { generateOtpCode, hashOtpCode, verifyOtpCode } from '@/lib/otp';
import { getRequestIp, rateLimit } from '@/lib/rate-limit';

export async function POST(req: Request) {
  try {
    const { action, phone, code } = await req.json();
    const ip = getRequestIp(req);

    const rl = await rateLimit({
      key: `auth:otp:${action}:${phone || ip}`,
      limit: action === 'SEND' ? 6 : 20,
      windowSec: 60,
    });
    if (!rl.allowed) {
      return NextResponse.json({ success: false, message: 'Too many requests. Please try again shortly.' }, { status: 429 });
    }

    // --- 1. SEND OTP ---
    if (action === 'SEND') {
      // Generate 6 digit OTP
      const otp = generateOtpCode();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

      // Save to DB (Update if exists, Create if not)
      await prisma.verificationCode.upsert({
        where: { phone },
        update: { code: hashOtpCode(otp), expiresAt },
        create: { phone, code: hashOtpCode(otp), expiresAt }
      });

      // ✅ USE THE NEW SMS UTILITY
      const sent = await sendSMS(phone, 'OTP', [otp]);

      if (!sent) {
        return NextResponse.json({ success: false, message: 'SMS Gateway Error' }, { status: 500 });
      }

      // Check if user exists (to help Frontend decide flow)
      const user = await prisma.customer.findFirst({
        where: { OR: [{ phone }, { email: phone }] }
      });

      return NextResponse.json({ 
        success: true, 
        message: 'OTP Sent Successfully', 
        isRegistered: !!user,
        loginMethod: user?.loginMethod || 'phone'
      });
    }

    // --- 2. VERIFY OTP ---
    if (action === 'VERIFY') {
      const record = await prisma.verificationCode.findUnique({ where: { phone } });

      if (!record) {
        return NextResponse.json({ success: false, message: 'OTP not found. Resend it.' }, { status: 400 });
      }

      if (!verifyOtpCode(record.code, code)) {
        return NextResponse.json({ success: false, message: 'Invalid OTP' }, { status: 400 });
      }

      if (new Date() > record.expiresAt) {
        return NextResponse.json({ success: false, message: 'OTP Expired' }, { status: 400 });
      }

      await prisma.verificationCode.delete({ where: { phone } }).catch(() => null);

      return NextResponse.json({ success: true, message: 'Verified' });
    }

    return NextResponse.json({ success: false, message: 'Invalid Action' }, { status: 400 });

  } catch (error) {
    console.error("OTP API Error:", error);
    return NextResponse.json({ success: false, message: 'Server Error' }, { status: 500 });
  }
}

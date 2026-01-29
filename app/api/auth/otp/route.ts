import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendSMS } from '@/lib/sms'; 

export async function POST(req: Request) {
  try {
    const { action, phone, code } = await req.json();

    // --- 1. SEND OTP ---
    if (action === 'SEND') {
      // Generate 6 digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

      // Save to DB (Update if exists, Create if not)
      await prisma.verificationCode.upsert({
        where: { phone },
        update: { code: otp, expiresAt },
        create: { phone, code: otp, expiresAt }
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

      if (record.code !== code) {
        return NextResponse.json({ success: false, message: 'Invalid OTP' }, { status: 400 });
      }

      if (new Date() > record.expiresAt) {
        return NextResponse.json({ success: false, message: 'OTP Expired' }, { status: 400 });
      }

      // Optional: Delete OTP after successful use to prevent reuse
      // await prisma.verificationCode.delete({ where: { phone } });

      return NextResponse.json({ success: true, message: 'Verified' });
    }

    return NextResponse.json({ success: false, message: 'Invalid Action' }, { status: 400 });

  } catch (error) {
    console.error("OTP API Error:", error);
    return NextResponse.json({ success: false, message: 'Server Error' }, { status: 500 });
  }
}
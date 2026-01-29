import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET ;

export async function POST(req: Request) {
  try {
    const { identifier, password, isOtpLogin, phone } = await req.json();

    let user;

    // SCENARIO A: OTP Login (Phone)
    if (isOtpLogin) {
      // We assume OTP was verified by the /api/auth/otp route before calling this
      user = await prisma.customer.findUnique({ where: { phone } });
    } 
    // SCENARIO B: Password Login (Email)
    else {
      user = await prisma.customer.findUnique({ where: { email: identifier } });
      if (user && user.password) {
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) user = null; // Invalid pass
      } else {
        user = null; // User not found or no password (google auth)
      }
    }

    if (!user) {
      return NextResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 });
    }

    if (!user.isActive) {
      return NextResponse.json({ success: false, message: 'Account suspended' }, { status: 403 });
    }

    // Generate Token
    const token = jwt.sign(
      { id: user.id, role: user.role, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return NextResponse.json({
      success: true,
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });

  } catch (error) {
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
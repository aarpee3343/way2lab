import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;

export async function POST(req: Request) {
  try {
    const { identifier, password, isOtpLogin, phone } = await req.json();

    let user;

    // SCENARIO A: OTP Login (Phone)
    if (isOtpLogin) {
      user = await prisma.customer.findUnique({ where: { phone } });
    } 
    // SCENARIO B: Password Login (Email)
    else {
      user = await prisma.customer.findUnique({ where: { email: identifier } });
      if (user && user.password) {
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) user = null; 
      } else {
        user = null;
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
      { id: user.id, role: user.role, email: user.email, name: user.name, corporateId: user.corporateId },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // ============================================================
    // NEW: Set HttpOnly Cookie
    // ============================================================
    
    // 1. Create the response object first
    const response = NextResponse.json({
      success: true,
      message: 'Logged in successfully',
      user: { id: user.id, name: user.name, email: user.email, role: user.role, corporateId: user.corporateId }
    });

    // 2. Attach the cookie
    response.cookies.set({
      name: 'token',
      value: token,
      httpOnly: true, // Javascript cannot read this (Critical for security)
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      sameSite: 'strict', // CSRF protection
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 7 days (must match jwt expiresIn)
    });

    return response;

  } catch (error) {
    console.error("Login Error:", error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

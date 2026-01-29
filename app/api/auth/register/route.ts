import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const { name, email, phone, password, gender, dob, googleId, loginMethod } = await req.json();

    // 1. Check if customer exists
    const existingCustomer = await prisma.customer.findFirst({
      where: {
        OR: [
          { email: email },
          { phone: phone }
        ]
      }
    });

    if (existingCustomer) {
      return NextResponse.json(
        { success: false, message: 'Account already exists with this email or phone.' },
        { status: 400 }
      );
    }

    // 2. Hash Password (if provided)
    // If Google login, we generate a random secure string if no password is sent
    const passToHash = password || Math.random().toString(36).slice(-10) + Date.now();
    const hashedPassword = await bcrypt.hash(passToHash, 10);

    // 3. Generate UHID
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    const uhid = `WTLC${randomSuffix}`;

    // 4. Create Customer
    const user = await prisma.customer.create({
      data: {
        name,
        email,
        phone,
        password: hashedPassword,
        uhid,
        gender: gender || 'Not Specified',
        dateOfBirth: dob ? new Date(dob) : null,
        isActive: true,
        role: 'USER',
        loginMethod: loginMethod || 'email', // 'email' or 'google'
        googleId: googleId || null
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Registration successful',
      user: { id: user.id, name: user.name, email: user.email }
    });

  } catch (error) {
    console.error("Register Error:", error);
    return NextResponse.json(
      { success: false, message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generateCustomerUHID } from '@/lib/utils/generators';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const {
      name,
      email,
      phone,
      password,
      gender,
      dob,
      googleId,
      loginMethod,
      phoneOtp,
      emailOtp
    } = await req.json();

    const normalizedEmail = email ? String(email).trim().toLowerCase() : '';

    if (!normalizedEmail && !phone) {
      return NextResponse.json(
        { success: false, message: 'Email or phone is required.' },
        { status: 400 }
      );
    }

    // 1. Check if customer exists
    const existingCustomer = await prisma.customer.findFirst({
      where: {
        OR: [
          ...(normalizedEmail ? [{ email: normalizedEmail }] : []),
          ...(phone ? [{ phone: phone }] : [])
        ]
      }
    });

    if (existingCustomer) {
      return NextResponse.json(
        { success: false, message: 'Account already exists with this email or phone.' },
        { status: 400 }
      );
    }

    // 2. Verify Phone OTP (required for registration)
    if (phone) {
      const record = await prisma.verificationCode.findUnique({
        where: { phone }
      });
      if (!record) {
        return NextResponse.json(
          { success: false, message: 'Phone OTP not found. Please resend OTP.' },
          { status: 400 }
        );
      }
      if (!phoneOtp || record.code !== phoneOtp) {
        return NextResponse.json(
          { success: false, message: 'Invalid phone OTP' },
          { status: 400 }
        );
      }
      if (new Date() > record.expiresAt) {
        return NextResponse.json(
          { success: false, message: 'Phone OTP expired' },
          { status: 400 }
        );
      }
    }

    // 3. Hash Password (if provided)
    // If Google login, we generate a random secure string if no password is sent
    const passToHash = password || Math.random().toString(36).slice(-10) + Date.now();
    const hashedPassword = await bcrypt.hash(passToHash, 10);

    // 4. Generate UHID (shared generator for all customer creation flows)
    const uhid = await generateCustomerUHID();

    // ---------------------------------------------------------
    // 5. Corporate Domain Auto-Mapping Logic
    // ---------------------------------------------------------
    let assignedCorporateId = null;

    if (normalizedEmail && normalizedEmail.includes('@')) {
      // Extract domain (e.g., 'john@acme.com' -> '@acme.com')
      // Ensure we format it with '@' prefix to match your Admin Domain Mapping format
      const domainPart = normalizedEmail.split('@')[1];
      const domain = domainPart.startsWith('@') ? domainPart : '@' + domainPart;

      // Find active corporate that claims this domain
      const corporate = await prisma.corporate.findFirst({
        where: {
          domains: { has: domain }, // Checks if the array contains this domain
          isActive: true
        }
      });

      if (corporate) {
        // Require email OTP verification before mapping to corporate
        const emailRecord = await prisma.emailVerificationCode.findUnique({
          where: { email: normalizedEmail }
        });
        if (!emailRecord) {
          return NextResponse.json(
            { success: false, message: 'Email OTP not found. Please verify your email.', code: 'EMAIL_OTP_REQUIRED' },
            { status: 400 }
          );
        }
        if (!emailOtp || emailRecord.code !== emailOtp) {
          return NextResponse.json(
            { success: false, message: 'Invalid email OTP', code: 'EMAIL_OTP_INVALID' },
            { status: 400 }
          );
        }
        if (new Date() > emailRecord.expiresAt) {
          return NextResponse.json(
            { success: false, message: 'Email OTP expired', code: 'EMAIL_OTP_EXPIRED' },
            { status: 400 }
          );
        }

        assignedCorporateId = corporate.id;
        console.log(`Auto-mapped user ${normalizedEmail} to Corporate: ${corporate.companyName}`);
      }
    }
    // ---------------------------------------------------------

    // 5. Create Customer
    const user = await prisma.customer.create({
      data: {
        name,
        email: normalizedEmail || null,
        phone,
        password: hashedPassword,
        uhid,
        gender: gender || 'Not Specified',
        dateOfBirth: dob ? new Date(dob) : null,
        isActive: true,
        role: 'USER',
        loginMethod: loginMethod || 'email', // 'email' or 'google'
        googleId: googleId || null,
        
        // Assign the found corporate ID (or null)
        corporateId: assignedCorporateId
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Registration successful',
      user: { id: user.id, name: user.name, email: user.email, corporateId: user.corporateId }
    });

  } catch (error) {
    console.error("Register Error:", error);
    return NextResponse.json(
      { success: false, message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

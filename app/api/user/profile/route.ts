import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function PUT(req: Request) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    const { name, email, phone, gender, dateOfBirth } = await req.json();
    const normalizedName = String(name || '').trim();
    const normalizedEmail = email ? String(email).trim().toLowerCase() : null;
    const normalizedPhone = phone ? String(phone).replace(/\D/g, '') : null;
    const normalizedGender = gender ? String(gender).trim() : null;

    if (!normalizedName) {
      return NextResponse.json({ success: false, message: 'Name is required' }, { status: 400 });
    }

    if (normalizedEmail && !/\S+@\S+\.\S+/.test(normalizedEmail)) {
      return NextResponse.json({ success: false, message: 'Email is invalid' }, { status: 400 });
    }

    if (normalizedPhone && !/^[0-9]{10}$/.test(normalizedPhone)) {
      return NextResponse.json({ success: false, message: 'Phone number must be 10 digits' }, { status: 400 });
    }

    const duplicateCustomer = await prisma.customer.findFirst({
      where: {
        id: { not: user.id },
        OR: [
          ...(normalizedEmail ? [{ email: normalizedEmail }] : []),
          ...(normalizedPhone ? [{ phone: normalizedPhone }] : [])
        ]
      },
      select: { id: true }
    });

    if (duplicateCustomer) {
      return NextResponse.json(
        {
          success: false,
          message: 'Another customer already uses this email or phone number'
        },
        { status: 409 }
      );
    }

    const updatedUser = await prisma.customer.update({
      where: { id: user.id },
      data: {
        name: normalizedName,
        email: normalizedEmail,
        phone: normalizedPhone,
        gender: normalizedGender,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null
      }
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: 'Profile updated'
    });
  } catch (error) {
    return NextResponse.json({ message: 'Error updating profile' }, { status: 500 });
  }
}

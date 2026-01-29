import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function PUT(req: Request) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    const { name, email, phone, gender, dateOfBirth } = await req.json();

    const updatedUser = await prisma.customer.update({
      where: { id: user.id },
      data: {
        name,
        email,
        phone,
        gender,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined
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
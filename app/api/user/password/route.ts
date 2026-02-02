import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { jwtVerify } from 'jose'; // Or 'jsonwebtoken' if you use that
import { cookies } from 'next/headers';

export async function PUT(req: Request) {
  try {
    // 1. Auth Check
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return new NextResponse('Unauthorized', { status: 401 });

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    const userId = Number(payload.id);

    // 2. Parse Body
    const { currentPassword, newPassword } = await req.json();

    // 3. Get User
    const user = await prisma.customer.findUnique({ where: { id: userId } });
    if (!user || !user.password) {
      return NextResponse.json({ message: 'User not found or social login used' }, { status: 404 });
    }

    // 4. Verify Current Password
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return NextResponse.json({ message: 'Incorrect current password' }, { status: 400 });
    }

    // 5. Hash New Password & Update
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.customer.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });

    return NextResponse.json({ success: true, message: 'Password updated' });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Internal Error' }, { status: 500 });
  }
}
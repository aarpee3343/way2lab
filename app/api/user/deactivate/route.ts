import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { jwtVerify } from 'jose';
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

    // 2. Soft Delete (Set isActive = false)
    await prisma.customer.update({
      where: { id: userId },
      data: { isActive: false }
    });

    return NextResponse.json({ success: true, message: 'Account deactivated' });

  } catch (error) {
    return NextResponse.json({ message: 'Internal Error' }, { status: 500 });
  }
}
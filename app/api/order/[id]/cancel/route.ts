import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    const orderId = Number(params.id);
    const order = await prisma.order.findUnique({ where: { id: orderId } });

    if (!order || order.userId !== user.id) return NextResponse.json({ message: 'Not found' }, { status: 404 });
    if (order.status !== 'PENDING') return NextResponse.json({ message: 'Cannot cancel processed orders' }, { status: 400 });

    await prisma.order.update({
      where: { id: orderId },
      data: { status: 'CANCELLED' }
    });

    return NextResponse.json({ success: true, message: 'Order cancelled' });
  } catch (error) {
    return NextResponse.json({ message: 'Error cancelling' }, { status: 500 });
  }
}
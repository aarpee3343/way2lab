import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    const orderId = Number(params.id);
    const { date, time, collectionType } = await req.json();

    const order = await prisma.order.findUnique({ where: { id: orderId } });

    if (!order || order.userId !== user.id) {
      return NextResponse.json({ message: 'Order not found' }, { status: 404 });
    }
    if (order.status !== 'PENDING') {
      return NextResponse.json({ message: 'Only pending orders can be rescheduled' }, { status: 400 });
    }
    if (new Date(date) < new Date()) {
       return NextResponse.json({ message: 'Select future date' }, { status: 400 });
    }

    await prisma.order.update({
      where: { id: orderId },
      data: {
        preferredDate: new Date(date),
        preferredTimeSlot: time,
        collectionType
      }
    });

    return NextResponse.json({ success: true, message: 'Order rescheduled' });
  } catch (error) {
    return NextResponse.json({ message: 'Error rescheduling' }, { status: 500 });
  }
}
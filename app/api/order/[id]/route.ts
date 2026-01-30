import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ message: "Missing Order ID" }, { status: 400 });
    }

    // 1. First, try to find by 'orderNumber' (String)
    // This works for your huge IDs like "2601000002"
    let order = await prisma.order.findUnique({
      where: { orderNumber: id },
      include: {
        items: true,
        lab: true,
        address: true,
        customer: true,
        coupon: true,
      }
    });

    // 2. If not found, try to find by internal 'id' (Integer)
    // We only do this if the number is small enough to be a valid DB ID (< 2.1 Billion)
    // to prevents the "Integer Overflow" 500 error.
    if (!order) {
      const numericId = parseInt(id);
      if (!isNaN(numericId) && numericId < 2147483647) {
        order = await prisma.order.findUnique({
          where: { id: numericId },
          include: {
            items: true,
            lab: true,
            address: true,
            customer: true,
            coupon: true,
          }
        });
      }
    }

    if (!order) {
      return NextResponse.json({ message: "Order not found" }, { status: 404 });
    }

    return NextResponse.json(order);

  } catch (error) {
    console.error("Order Fetch Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
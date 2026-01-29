export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const currentDate = new Date();
    const coupons = await prisma.coupon.findMany({
      where: {
        isActive: true,
        startDate: { lte: currentDate },
        OR: [{ expiryDate: null }, { expiryDate: { gte: currentDate } }]
      },
      orderBy: { discountValue: 'desc' }
    });

    const formatted = coupons.map((c) => ({
      id: c.id,
      code: c.code,
      description: c.description,
      discountType: c.discountType,
      discountVal: Number(c.discountValue),
      minCartVal: c.minOrderValue ? Number(c.minOrderValue) : 0,
      maxDiscount: c.maxDiscountAmount ? Number(c.maxDiscountAmount) : 0
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch coupons' }, { status: 500 });
  }
}
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function GET() {
  try {
    const currentDate = new Date();
    const user = await getAuthUser();
    let corporateId = user?.corporateId ?? null;

    if (user?.id && corporateId == null) {
      const dbUser = await prisma.customer.findUnique({
        where: { id: user.id },
        select: { corporateId: true }
      });
      corporateId = dbUser?.corporateId ?? null;
    }

    const baseWhere = {
      isActive: true,
      startDate: { lte: currentDate },
      AND: [{ OR: [{ expiryDate: null }, { expiryDate: { gte: currentDate } }] }]
    };

    const where = corporateId
      ? {
          ...baseWhere,
          AND: [
            ...(baseWhere.AND || []),
            {
              OR: [
                { corporateServices: { none: {} } },
                {
                  corporateServices: {
                    some: {
                      corporateId,
                      isActive: true,
                      validFrom: { lte: currentDate },
                      validTill: { gte: currentDate }
                    }
                  }
                }
              ]
            }
          ]
        }
      : {
          ...baseWhere,
          corporateServices: { none: {} }
        };

    const coupons = await prisma.coupon.findMany({
      where,
      orderBy: { discountValue: 'desc' }
    });

    const formatted = coupons.map((c) => ({
      id: c.id,
      code: c.code,
      description: c.description,
      discountType: c.discountType,
      discountVal: Number(c.discountValue),
      discountValue: Number(c.discountValue),
      minCartVal: c.minOrderValue ? Number(c.minOrderValue) : 0,
      minOrderValue: c.minOrderValue ? Number(c.minOrderValue) : 0,
      maxDiscount: c.maxDiscountAmount ? Number(c.maxDiscountAmount) : 0
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch coupons' }, { status: 500 });
  }
}

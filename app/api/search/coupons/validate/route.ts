import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { code, cartTotal } = await req.json();

    const coupon = await prisma.coupon.findUnique({
      where: { code },
      include: { corporateServices: true }
    });

    if (!coupon || !coupon.isActive) {
      return NextResponse.json({ valid: false, message: 'Invalid or inactive coupon' }, { status: 404 });
    }

    const now = new Date();
    if ((coupon.expiryDate && new Date(coupon.expiryDate) < now) || (new Date(coupon.startDate) > now)) {
      return NextResponse.json({ valid: false, message: 'Coupon is not valid at this time' }, { status: 400 });
    }

    if (coupon.corporateServices?.length) {
      const user = await getAuthUser(req);
      let corporateId = user?.corporateId ?? null;

      if (user?.id && corporateId == null) {
        const dbUser = await prisma.customer.findUnique({
          where: { id: user.id },
          select: { corporateId: true }
        });
        corporateId = dbUser?.corporateId ?? null;
      }

      if (!corporateId) {
        return NextResponse.json({ valid: false, message: 'Coupon not available for this account' }, { status: 403 });
      }

      const validService = coupon.corporateServices.some((service) => {
        return (
          service.corporateId === corporateId &&
          service.isActive &&
          service.validFrom <= now &&
          service.validTill >= now
        );
      });

      if (!validService) {
        return NextResponse.json({ valid: false, message: 'Coupon not available for this account' }, { status: 403 });
      }
    }

    const minOrderVal = coupon.minOrderValue ? Number(coupon.minOrderValue) : 0;
    if (cartTotal < minOrderVal) {
      return NextResponse.json({ valid: false, message: `Minimum order value of ₹${minOrderVal} required` }, { status: 400 });
    }

    const discountVal = Number(coupon.discountValue);
    const maxDiscount = coupon.maxDiscountAmount ? Number(coupon.maxDiscountAmount) : 0;
    
    let finalDiscount = 0;
    if (coupon.discountType === 'PERCENTAGE') {
      finalDiscount = (cartTotal * discountVal) / 100;
      if (maxDiscount > 0 && finalDiscount > maxDiscount) finalDiscount = maxDiscount;
    } else {
      finalDiscount = discountVal;
    }

    if (finalDiscount > cartTotal) finalDiscount = cartTotal;

    return NextResponse.json({
      valid: true,
      code: coupon.code,
      discountAmount: finalDiscount,
      type: coupon.discountType === 'PERCENTAGE' ? 'percentage' : 'fixed',
      message: 'Coupon applied successfully'
    });

  } catch (error) {
    return NextResponse.json({ error: 'Failed to validate coupon' }, { status: 500 });
  }
}

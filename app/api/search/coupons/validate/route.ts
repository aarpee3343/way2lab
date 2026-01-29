import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { code, cartTotal } = await req.json();

    const coupon = await prisma.coupon.findUnique({ where: { code } });

    if (!coupon || !coupon.isActive) {
      return NextResponse.json({ valid: false, message: 'Invalid or inactive coupon' }, { status: 404 });
    }

    const now = new Date();
    if ((coupon.expiryDate && new Date(coupon.expiryDate) < now) || (new Date(coupon.startDate) > now)) {
      return NextResponse.json({ valid: false, message: 'Coupon is not valid at this time' }, { status: 400 });
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
      message: 'Coupon applied successfully'
    });

  } catch (error) {
    return NextResponse.json({ error: 'Failed to validate coupon' }, { status: 500 });
  }
}
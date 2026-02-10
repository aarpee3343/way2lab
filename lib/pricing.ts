export function toMoney(value: number) {
  return Math.round(value * 100) / 100;
}

export function applyCouponDiscount(
  netAmount: number,
  coupon: { discountType: string; discountValue: number; minOrderValue: number; maxDiscountAmount: number }
) {
  if (netAmount <= 0 || netAmount < coupon.minOrderValue) return 0;

  let discount = 0;
  if (coupon.discountType === 'PERCENTAGE') {
    discount = (netAmount * coupon.discountValue) / 100;
    if (coupon.maxDiscountAmount > 0) {
      discount = Math.min(discount, coupon.maxDiscountAmount);
    }
  } else {
    discount = coupon.discountValue;
  }

  return Math.min(netAmount, toMoney(discount));
}

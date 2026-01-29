'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

// 1. Fetch Form Data (Labs, Tests, Packages)
export async function getCouponFormData() {
  const [labs, tests, packages] = await Promise.all([
    prisma.lab.findMany({ where: { activeStatus: true }, select: { id: true, labName: true, city: true } }),
    prisma.test.findMany({ where: { isActive: true }, select: { id: true, testName: true } }),
    prisma.package.findMany({ where: { isActive: true }, select: { id: true, packageName: true } })
  ]);
  return { labs, tests, packages };
}

// 2. Create Coupon
export async function createCouponAction(data: any) {
  try {
    // Basic Validation
    const existing = await prisma.coupon.findUnique({ where: { code: data.code } });
    if (existing) return { success: false, error: 'Coupon code already exists' };

    await prisma.coupon.create({
      data: {
        code: data.code,
        description: data.description,
        discountType: data.discountType,
        discountValue: parseFloat(data.discountValue),
        minOrderValue: parseFloat(data.minOrderValue || '0'),
        maxDiscountAmount: data.maxDiscountAmount ? parseFloat(data.maxDiscountAmount) : null,
        usageLimit: data.usageLimit ? parseInt(data.usageLimit) : null,
        userLimit: parseInt(data.userLimit || '1'),
        startDate: new Date(data.startDate),
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
        couponScope: data.couponScope,
        isActive: true,
        
        // Dynamic Connections
        labs: data.couponScope === 'LAB' && data.labIds.length > 0 
          ? { connect: data.labIds.map((id: string) => ({ id: parseInt(id) })) } 
          : undefined,
        tests: data.couponScope === 'TEST' && data.testIds.length > 0 
          ? { connect: data.testIds.map((id: string) => ({ id: parseInt(id) })) } 
          : undefined,
        packages: data.couponScope === 'PACKAGE' && data.packageIds.length > 0 
          ? { connect: data.packageIds.map((id: string) => ({ id: parseInt(id) })) } 
          : undefined,
      }
    });
  } catch (error: any) {
    console.error(error);
    return { success: false, error: error.message || 'Failed to create coupon' };
  }

  revalidatePath('/admin/coupons');
  return { success: true };
}

// 3. Get Stats & List
export async function getCouponStats() {
  const now = new Date();
  const [total, active, expired] = await Promise.all([
    prisma.coupon.count(),
    prisma.coupon.count({ where: { isActive: true, OR: [{ expiryDate: null }, { expiryDate: { gt: now } }] } }),
    prisma.coupon.count({ where: { expiryDate: { lte: now } } }),
  ]);
  return { total, active, expired, inactive: total - (active + expired) }; // Approximation
}

export async function getCoupons() {
  return await prisma.coupon.findMany({ 
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { orders: true } } // Track usage
    }
  });
}

// 4. Delete
export async function deleteCouponAction(id: number) {
  try {
    await prisma.coupon.delete({ where: { id } });
    revalidatePath('/admin/coupons');
    return { success: true };
  } catch (e) {
    return { success: false, error: "Cannot delete coupon. It might be linked to existing orders." };
  }
}
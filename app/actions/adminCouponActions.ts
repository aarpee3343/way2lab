'use server';

import { requireAdmin } from '@/lib/admin-auth';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

const parseIdList = (items: unknown): number[] => {
  if (!Array.isArray(items)) return [];

  return items
    .map((item) => Number.parseInt(String(item), 10))
    .filter((item) => Number.isInteger(item) && item > 0);
};

function buildCouponConnections(data: any) {
  const labIds = parseIdList(data.labIds);
  const testIds = parseIdList(data.testIds);
  const packageIds = parseIdList(data.packageIds);

  return {
    labIds,
    testIds,
    packageIds,
    createRelations: {
      labs: data.couponScope === 'LAB' ? { connect: labIds.map((id) => ({ id })) } : undefined,
      tests: data.couponScope === 'TEST' ? { connect: testIds.map((id) => ({ id })) } : undefined,
      packages: data.couponScope === 'PACKAGE' ? { connect: packageIds.map((id) => ({ id })) } : undefined
    },
    updateRelations: {
      labs: data.couponScope === 'LAB' ? { set: labIds.map((id) => ({ id })) } : { set: [] },
      tests: data.couponScope === 'TEST' ? { set: testIds.map((id) => ({ id })) } : { set: [] },
      packages: data.couponScope === 'PACKAGE' ? { set: packageIds.map((id) => ({ id })) } : { set: [] }
    }
  };
}

function parseCouponPayload(data: any) {
  const startDate = new Date(data.startDate);
  const expiryDate = data.expiryDate ? new Date(data.expiryDate) : null;

  if (!data.code?.trim()) {
    return { error: 'Coupon code is required' };
  }

  if (Number.isNaN(startDate.getTime())) {
    return { error: 'Enter a valid start date' };
  }

  if (expiryDate && Number.isNaN(expiryDate.getTime())) {
    return { error: 'Enter a valid expiry date' };
  }

  if (expiryDate && expiryDate <= startDate) {
    return { error: 'Expiry date must be later than the start date' };
  }

  const discountValue = Number.parseFloat(String(data.discountValue));
  const minOrderValue = Number.parseFloat(String(data.minOrderValue || '0'));
  const maxDiscountAmount = data.maxDiscountAmount ? Number.parseFloat(String(data.maxDiscountAmount)) : null;
  const usageLimit = data.usageLimit ? Number.parseInt(String(data.usageLimit), 10) : null;
  const userLimit = Number.parseInt(String(data.userLimit || '1'), 10);

  if (!Number.isFinite(discountValue) || discountValue <= 0) {
    return { error: 'Enter a valid discount value' };
  }

  if (!Number.isFinite(minOrderValue) || minOrderValue < 0) {
    return { error: 'Enter a valid minimum order value' };
  }

  if (maxDiscountAmount !== null && (!Number.isFinite(maxDiscountAmount) || maxDiscountAmount <= 0)) {
    return { error: 'Enter a valid max discount amount' };
  }

  if (usageLimit !== null && (!Number.isInteger(usageLimit) || usageLimit <= 0)) {
    return { error: 'Usage limit must be greater than 0' };
  }

  if (!Number.isInteger(userLimit) || userLimit <= 0) {
    return { error: 'Limit per user must be greater than 0' };
  }

  const { labIds, testIds, packageIds, createRelations, updateRelations } = buildCouponConnections(data);

  if (data.couponScope === 'LAB' && labIds.length === 0) {
    return { error: 'Select at least one lab for lab-scoped coupon' };
  }

  if (data.couponScope === 'TEST' && testIds.length === 0) {
    return { error: 'Select at least one test for test-scoped coupon' };
  }

  if (data.couponScope === 'PACKAGE' && packageIds.length === 0) {
    return { error: 'Select at least one package for package-scoped coupon' };
  }

  return {
    payload: {
      code: String(data.code).trim().toUpperCase(),
      description: data.description?.trim() || null,
      discountType: data.discountType,
      discountValue,
      minOrderValue,
      maxDiscountAmount,
      usageLimit,
      userLimit,
      startDate,
      expiryDate,
      couponScope: data.couponScope,
      createRelations,
      updateRelations
    }
  };
}

// 1. Fetch Form Data (Labs, Tests, Packages)
export async function getCouponFormData() {
  await requireAdmin({ roles: ['SUPER_ADMIN'] });
  const [labs, tests, packages] = await Promise.all([
    prisma.lab.findMany({ where: { activeStatus: true }, select: { id: true, labName: true, city: true } }),
    prisma.test.findMany({ where: { isActive: true }, select: { id: true, testName: true } }),
    prisma.package.findMany({ where: { isActive: true }, select: { id: true, packageName: true } })
  ]);
  return { labs, tests, packages };
}

// 2. Create Coupon
export async function createCouponAction(data: any) {
  await requireAdmin({ roles: ['SUPER_ADMIN'] });
  try {
    const parsed = parseCouponPayload(data);
    if ('error' in parsed) return { success: false, error: parsed.error };

    const existing = await prisma.coupon.findUnique({ where: { code: parsed.payload.code } });
    if (existing) return { success: false, error: 'Coupon code already exists' };

    await prisma.coupon.create({
      data: {
        code: parsed.payload.code,
        description: parsed.payload.description,
        discountType: parsed.payload.discountType,
        discountValue: parsed.payload.discountValue,
        minOrderValue: parsed.payload.minOrderValue,
        maxDiscountAmount: parsed.payload.maxDiscountAmount,
        usageLimit: parsed.payload.usageLimit,
        userLimit: parsed.payload.userLimit,
        startDate: parsed.payload.startDate,
        expiryDate: parsed.payload.expiryDate,
        couponScope: parsed.payload.couponScope,
        isActive: true,
        ...parsed.payload.createRelations
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
  await requireAdmin({ roles: ['SUPER_ADMIN'] });
  const now = new Date();
  const [total, active, expired, inactive] = await Promise.all([
    prisma.coupon.count(),
    prisma.coupon.count({
      where: {
        isActive: true,
        startDate: { lte: now },
        OR: [{ expiryDate: null }, { expiryDate: { gt: now } }]
      }
    }),
    prisma.coupon.count({ where: { expiryDate: { lte: now } } }),
    prisma.coupon.count({
      where: {
        isActive: false,
        OR: [{ expiryDate: null }, { expiryDate: { gt: now } }]
      }
    })
  ]);
  return { total, active, expired, inactive };
}

export async function getCoupons() {
  await requireAdmin({ roles: ['SUPER_ADMIN'] });
  return await prisma.coupon.findMany({ 
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { orders: true } } // Track usage
    }
  });
}

export async function getCouponById(id: number) {
  await requireAdmin({ roles: ['SUPER_ADMIN'] });

  const coupon = await prisma.coupon.findUnique({
    where: { id },
    include: {
      labs: { select: { id: true } },
      tests: { select: { id: true } },
      packages: { select: { id: true } },
      _count: { select: { orders: true } }
    }
  });

  if (!coupon) return null;

  return {
    id: coupon.id,
    code: coupon.code,
    description: coupon.description || '',
    couponScope: coupon.couponScope,
    discountType: coupon.discountType,
    discountValue: Number(coupon.discountValue),
    minOrderValue: Number(coupon.minOrderValue),
    maxDiscountAmount: coupon.maxDiscountAmount === null ? '' : String(Number(coupon.maxDiscountAmount)),
    usageLimit: coupon.usageLimit === null ? '' : String(coupon.usageLimit),
    userLimit: String(coupon.userLimit),
    startDate: coupon.startDate.toISOString(),
    expiryDate: coupon.expiryDate?.toISOString() || '',
    isActive: coupon.isActive,
    usedCount: coupon.usedCount,
    ordersCount: coupon._count.orders,
    labIds: coupon.labs.map((item) => String(item.id)),
    testIds: coupon.tests.map((item) => String(item.id)),
    packageIds: coupon.packages.map((item) => String(item.id))
  };
}

// 4. Delete
export async function deleteCouponAction(id: number) {
  await requireAdmin({ roles: ['SUPER_ADMIN'] });
  try {
    await prisma.coupon.delete({ where: { id } });
    revalidatePath('/admin/coupons');
    return { success: true };
  } catch (e) {
    return { success: false, error: "Cannot delete coupon. It might be linked to existing orders." };
  }
}

export async function updateCouponAction(id: number, data: any) {
  await requireAdmin({ roles: ['SUPER_ADMIN'] });

  try {
    const coupon = await prisma.coupon.findUnique({
      where: { id },
      select: { id: true, code: true }
    });

    if (!coupon) {
      return { success: false, error: 'Coupon not found' };
    }

    const parsed = parseCouponPayload({
      ...data,
      code: coupon.code,
      discountType: data.discountType || 'PERCENTAGE',
      discountValue: data.discountValue
    });
    if ('error' in parsed) return { success: false, error: parsed.error };

    await prisma.coupon.update({
      where: { id },
      data: {
        description: parsed.payload.description,
        couponScope: parsed.payload.couponScope,
        minOrderValue: parsed.payload.minOrderValue,
        maxDiscountAmount: parsed.payload.maxDiscountAmount,
        usageLimit: parsed.payload.usageLimit,
        userLimit: parsed.payload.userLimit,
        startDate: parsed.payload.startDate,
        expiryDate: parsed.payload.expiryDate,
        ...parsed.payload.updateRelations
      }
    });

    revalidatePath('/admin/coupons');
    revalidatePath(`/admin/coupons/${id}`);
    return { success: true };
  } catch (error: any) {
    console.error(error);
    return { success: false, error: error?.message || 'Failed to update coupon' };
  }
}

export async function toggleCouponActiveStatusAction(id: number, nextActive: boolean) {
  await requireAdmin({ roles: ['SUPER_ADMIN'] });

  try {
    const coupon = await prisma.coupon.findUnique({
      where: { id },
      select: { id: true, code: true }
    });

    if (!coupon) {
      return { success: false, error: 'Coupon not found' };
    }

    await prisma.coupon.update({
      where: { id },
      data: { isActive: nextActive }
    });

    revalidatePath('/admin/coupons');
    return {
      success: true,
      message: `Coupon ${nextActive ? 'resumed' : 'paused'} successfully`
    };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Failed to update coupon status' };
  }
}

export async function extendCouponValidityAction(id: number, expiryDate: string) {
  await requireAdmin({ roles: ['SUPER_ADMIN'] });

  try {
    const coupon = await prisma.coupon.findUnique({
      where: { id },
      select: { id: true, expiryDate: true }
    });

    if (!coupon) {
      return { success: false, error: 'Coupon not found' };
    }

    const nextExpiryDate = new Date(expiryDate);
    if (Number.isNaN(nextExpiryDate.getTime())) {
      return { success: false, error: 'Enter a valid expiry date' };
    }

    if (nextExpiryDate <= new Date()) {
      return { success: false, error: 'New expiry must be in the future' };
    }

    if (coupon.expiryDate && nextExpiryDate <= coupon.expiryDate) {
      return { success: false, error: 'New expiry must be later than the current expiry' };
    }

    await prisma.coupon.update({
      where: { id },
      data: { expiryDate: nextExpiryDate }
    });

    revalidatePath('/admin/coupons');
    return { success: true, message: 'Coupon validity extended successfully' };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Failed to extend coupon validity' };
  }
}

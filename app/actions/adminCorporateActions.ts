'use server';

import prisma from '@/lib/db';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';

// --- 1. GET DASHBOARD STATS ---
export async function getCorporateDashboardStats() {
  const [total, recent] = await Promise.all([
    prisma.corporate.count(),
    prisma.corporate.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { employees: true } } }
    })
  ]);

  return { total, recent };
}

export async function createCorporateAction(data: any) {
  try {
    const corporate = await prisma.corporate.create({
      data: {
        companyName: data.companyName,
        contactPerson: data.contactPerson,
        email: data.email,
        phone: data.phone,
        password: await bcrypt.hash(data.password, 10),
        address: data.address,
        city: data.city,
        state: data.state,
        pincode: data.pincode,
        panNumber: data.panNumber,
        gstin: data.gstin,
        employeeCount: parseInt(data.employeeCount || '0'),
      }
    });
    revalidatePath('/admin/corporates');
    return { success: true, corporateId: corporate.id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// --- 2. CREATE CORPORATE User---
export async function createCorporateUserAction(data: {
  corporateId: number;
  name: string;
  email: string;
  password: string;
  role: 'SUPER_ADMIN' | 'DEPT_HEAD' | 'LOCATION_MANAGER';
  canEdit: boolean;
  maskContactInfo: boolean;
  accessDept?: string;
  accessLocation?: string;
}) {
  try {
    // 1. Check if email already exists
    const existing = await prisma.corporateUser.findUnique({
      where: { email: data.email }
    });

    if (existing) return { success: false, error: "Email already registered to another user." };

    // 2. Hash Password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // 3. Create User with specific permissions
    await prisma.corporateUser.create({
      data: {
        corporateId: data.corporateId,
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: data.role,
        canEdit: data.canEdit,
        maskContactInfo: data.maskContactInfo,
        accessDept: data.accessDept || null,
        accessLocation: data.accessLocation || null,
      }
    });

    revalidatePath(`/admin/corporates/${data.corporateId}`); // Refresh Admin View
    revalidatePath('/corporate/users'); // Refresh Corporate View
    
    return { success: true };
  } catch (error: any) {
    console.error("Create Corporate User Error:", error);
    return { success: false, error: "Failed to create access user." };
  }
}

// --- 3. FETCH SINGLE CORPORATE DETAILS ---
export async function getCorporateDetails(id: number) {
  return prisma.corporate.findUnique({
    where: { id },
    include: {
      _count: { select: { employees: true } },
      employees: { take: 50, orderBy: { createdAt: 'desc' } },
      services: {
        include: { package: true, coupon: true },
        where: { isActive: true }
      }
    }
  });
}

// --- 4. MAP DOMAIN & UPDATE USERS ---
export async function mapDomainAction(corporateId: number, domain: string) {
  try {
    if (!domain.startsWith('@')) domain = '@' + domain;

    const corp = await prisma.corporate.findUnique({
      where: { id: corporateId }
    });

    const currentDomains = corp?.domains || [];
    if (currentDomains.includes(domain)) {
      return { success: false, error: 'Domain already mapped' };
    }

    await prisma.corporate.update({
      where: { id: corporateId },
      data: { domains: { push: domain } }
    });

    const updateCount = await prisma.customer.updateMany({
      where: {
        email: { endsWith: domain },
        corporateId: null
      },
      data: { corporateId }
    });

    revalidatePath(`/admin/corporates/${corporateId}`);
    return { success: true, count: updateCount.count };
  } catch (e) {
    return { success: false, error: 'Failed to map domain' };
  }
}

// --- 5. BULK UPLOAD EMPLOYEES ---
export async function uploadCorporateEmployees(
  corporateId: number,
  employees: any[]
) {
  try {
    let mapped = 0;
    let created = 0;

    for (const emp of employees) {
      if (!emp.phone && !emp.email) continue;

      const existing = await prisma.customer.findFirst({
        where: {
          OR: [{ phone: emp.phone }, { email: emp.email }]
        }
      });

      if (existing) {
        await prisma.customer.update({
          where: { id: existing.id },
          data: {
            corporateId,
            employeeId: emp.employeeId
          }
        });
        mapped++;
      } else {
        const hashedPassword = await bcrypt.hash('Welcome123', 10);

        await prisma.customer.create({
          data: {
            name: emp.name,
            email: emp.email,
            phone: emp.phone,
            password: hashedPassword,
            dateOfBirth: emp.dob ? new Date(emp.dob) : null,
            gender: emp.gender,
            employeeId: emp.employeeId,
            corporateId,
            isActive: true
          }
        });
        created++;
      }
    }

    revalidatePath(`/admin/corporates/${corporateId}`);
    return { success: true, stats: { mapped, created } };
  } catch (e) {
    console.error(e);
    return { success: false, error: 'Processing failed' };
  }
}

// --- 6. ASSIGN SERVICES (UPDATED WITH PAYMENT RULES) ---
export async function assignCorporateService(data: {
  corporateId: number;
  itemId: number;
  type: 'PACKAGE' | 'COUPON';
  validFrom: string;
  validTill: string;
  selfPaymentType: 'USER_PAYS' | 'CORPORATE_PAYS';
  familyPaymentType: 'USER_PAYS' | 'CORPORATE_PAYS';
  selfLimit: number;
  familyLimit: number;
}) {
  try {
    await prisma.corporateService.create({
      data: {
        corporateId: data.corporateId,
        packageId: data.type === 'PACKAGE' ? data.itemId : null,
        couponId: data.type === 'COUPON' ? data.itemId : null,
        validFrom: new Date(data.validFrom),
        validTill: new Date(data.validTill),

        // ✅ NEW RULES
        selfPaymentType: data.selfPaymentType,
        familyPaymentType: data.familyPaymentType,
        selfUsageLimit: data.selfLimit,
        familyUsageLimit: data.familyLimit
      }
    });

    // ✅ Auto-mark package as corporate-owned
    if (data.type === 'PACKAGE') {
      await prisma.package.update({
        where: { id: data.itemId },
        data: {
          isCorporate: true,
          corporateId: data.corporateId
        }
      });
    }

    revalidatePath(`/admin/corporates/${data.corporateId}`);
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: 'Failed to map service rules' };
  }
}

// --- 7. GET ALL PACKAGES & COUPONS ---
export async function getAdminInventory() {
  const [packages, coupons] = await Promise.all([
    prisma.package.findMany({
      where: { isActive: true },
      select: { id: true, packageName: true }
    }),
    prisma.coupon.findMany({
      where: { isActive: true },
      select: { id: true, code: true }
    })
  ]);

  return { packages, coupons };
}

export async function bulkUpdateEmployeeStatus(emails: string[], status: boolean) {
  try {
    await prisma.customer.updateMany({
      where: { email: { in: emails } },
      data: { isActive: status }
    });
    return { success: true };
  } catch (e) {
    return { success: false, error: "Failed to update statuses" };
  }
}


export async function getCorporateFinanceStats(corpId: number) {
  // Aggregate all orders where the corporate is responsible for payment
  const utilizationStats = await prisma.order.aggregate({
    where: { 
      userId: {
        in: await prisma.customer.findMany({
          where: { corporateId: corpId },
          select: { id: true }
        }).then(users => users.map(u => u.id))
      },
      // Filters for orders that were booked under 'CORPORATE_PAYS' logic
      paymentStatus: "CORPORATE_BILLING" 
    },
    _sum: { finalAmount: true },
    _count: { id: true }
  });

  const dues = utilizationStats._sum.finalAmount || 0;
  const totalBookings = utilizationStats._count.id || 0;

  return { dues, totalBookings };
}
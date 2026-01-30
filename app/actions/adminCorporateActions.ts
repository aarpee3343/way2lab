'use server';

import prisma from '@/lib/prisma';
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

// --- 2. CREATE CORPORATE ---
export async function createCorporateAction(data: any) {
  try {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    
    const corp = await prisma.corporate.create({
      data: {
        companyName: data.companyName,
        contactPerson: data.contactPerson || 'Admin',
        email: data.email,
        phone: data.phone,
        password: hashedPassword,
        address: data.address,
        city: data.city,
        state: data.state,
        pincode: data.pincode,
        panNumber: data.panNumber,
        gstin: data.gstin,
        employeeCount: Number(data.employeeCount) || 0
      }
    });

    return { success: true, corporateId: corp.id };
  } catch (error: any) {
    console.error(error);
    return { success: false, error: "Failed to create corporate. Email might be duplicate." };
  }
}

// --- 3. FETCH SINGLE CORPORATE DETAILS ---
export async function getCorporateDetails(id: number) {
  return await prisma.corporate.findUnique({
    where: { id },
    include: {
      _count: { select: { employees: true } },
      employees: { take: 50, orderBy: { createdAt: 'desc' } }, // Recent 50 employees
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

    // 1. Add domain to corporate
    const corp = await prisma.corporate.findUnique({ where: { id: corporateId } });
    const currentDomains = corp?.domains || [];
    if (currentDomains.includes(domain)) return { success: false, error: "Domain already mapped" };

    await prisma.corporate.update({
      where: { id: corporateId },
      data: { domains: { push: domain } }
    });

    // 2. Find existing users with this email domain and map them
    // Note: Prisma 'contains' is simplest here
    const updateCount = await prisma.customer.updateMany({
      where: { 
        email: { endsWith: domain },
        corporateId: null // Only update unmapped users
      },
      data: { corporateId }
    });

    revalidatePath(`/admin/corporates/${corporateId}`);
    return { success: true, count: updateCount.count };
  } catch (e) {
    return { success: false, error: "Failed to map domain" };
  }
}

// --- 5. BULK UPLOAD EMPLOYEES (Smart Check) ---
export async function uploadCorporateEmployees(corporateId: number, employees: any[]) {
  try {
    let mapped = 0;
    let created = 0;

    for (const emp of employees) {
      if (!emp.phone && !emp.email) continue;

      // Check existence
      const existing = await prisma.customer.findFirst({
        where: {
          OR: [
            { phone: emp.phone },
            { email: emp.email }
          ]
        }
      });

      if (existing) {
        // Map existing
        await prisma.customer.update({
          where: { id: existing.id },
          data: { corporateId, employeeId: emp.employeeId }
        });
        mapped++;
      } else {
        // Create new
        const hashedPassword = await bcrypt.hash("Welcome123", 10);
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
    return { success: false, error: "Processing failed" };
  }
}

// --- 6. ASSIGN SERVICES (Time Bound) ---
export async function assignCorporateService(data: any) {
  try {
    await prisma.corporateService.create({
      data: {
        corporateId: Number(data.corporateId),
        packageId: data.type === 'PACKAGE' ? Number(data.itemId) : null,
        couponId: data.type === 'COUPON' ? Number(data.itemId) : null,
        validFrom: new Date(data.validFrom),
        validTill: new Date(data.validTill),
      }
    });
    revalidatePath(`/admin/corporates/${data.corporateId}`);
    return { success: true };
  } catch (e) {
    return { success: false, error: "Failed to assign service" };
  }
}

// --- 7. GET ALL PACKAGES & COUPONS (For Dropdown) ---
export async function getAdminInventory() {
  const [packages, coupons] = await Promise.all([
    prisma.package.findMany({ where: { isActive: true }, select: { id: true, packageName: true } }),
    prisma.coupon.findMany({ where: { isActive: true }, select: { id: true, code: true } })
  ]);
  return { packages, coupons };
}
'use server';

import { requireAdmin } from '@/lib/admin-auth';

import prisma from '@/lib/db';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';
import { sendSMS } from '@/lib/sms';
import { getCorporateServiceEmployeeReport } from '@/lib/corporate-service-report';

const normalizeEmail = (value: unknown) => String(value || '').trim().toLowerCase();

// --- 1. GET DASHBOARD STATS ---
export async function getCorporateDashboardStats() {
  await requireAdmin({ roles: ['SUPER_ADMIN'] });
  const [total, active, archived, recent] = await Promise.all([
    prisma.corporate.count(),
    prisma.corporate.count({ where: { isActive: true } }),
    prisma.corporate.count({ where: { isActive: false } }),
    prisma.corporate.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        companyName: true,
        contactPerson: true,
        phone: true,
        city: true,
        isActive: true,
        _count: { select: { employees: true } }
      }
    })
  ]);

  return { total, active, archived, recent };
}

// --- 2. CREATE CORPORATE ---
export async function createCorporateAction(data: any) {
  await requireAdmin({ roles: ['SUPER_ADMIN'] });
  try {
    const normalizedEmail = normalizeEmail(data.email);
    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      return { success: false, error: 'Valid corporate email is required' };
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    const corporate = await prisma.$transaction(async (tx) => {
      const corp = await tx.corporate.create({
        data: {
          companyName: data.companyName,
          contactPerson: data.contactPerson,
          email: normalizedEmail,
          phone: data.phone,
          password: passwordHash,
          address: data.address,
          city: data.city,
          state: data.state,
          pincode: data.pincode,
          panNumber: data.panNumber,
          gstin: data.gstin,
          employeeCount: parseInt(data.employeeCount || '0'),
          domains: [],
          isActive: true,
        }
      });

      await tx.corporateUser.create({
        data: {
          corporateId: corp.id,
          name: data.contactPerson || data.companyName,
          email: normalizedEmail,
          password: passwordHash,
          role: 'SUPER_ADMIN',
          canEdit: true,
          maskContactInfo: false,
          isActive: true
        }
      });

      return corp;
    });

    revalidatePath('/admin/corporates');
    return { success: true, corporateId: corporate.id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// --- 3. FETCH SINGLE CORPORATE DETAILS ---
export async function getCorporateDetails(id: number) {
  await requireAdmin({ roles: ['SUPER_ADMIN'] });
  if (!id) return null;

  const corp = await prisma.corporate.findUnique({
    where: { id },
      select: {
        id: true,
        companyName: true,
        contactPerson: true,
        email: true,
        phone: true,
        address: true,
        city: true,
        state: true,
        pincode: true,
        panNumber: true,
        gstin: true,
        employeeCount: true,
        logoUrl: true,
        domains: true,
        isActive: true,
        createdAt: true,
      _count: { select: { employees: true } },
      employees: {
        take: 50,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          isActive: true
        }
      },
      services: {
        where: { isActive: true },
        select: {
          id: true,
          validFrom: true,
          validTill: true,
          selfUsageLimit: true,
          familyUsageLimit: true,
          selfPaymentType: true,
          familyPaymentType: true,
          package: {
            select: {
              id: true,
              packageName: true,
              price: true,
              discount: true,
              createdAt: true
            }
          },
          coupon: {
            select: {
              id: true,
              code: true
            }
          }
        }
      }
    }
  });

  if (!corp) return null;

  return {
    ...corp,
    createdAt: corp.createdAt.toISOString(),
    services: corp.services.map(s => ({
      ...s,
      validFrom: s.validFrom.toISOString(),
      validTill: s.validTill.toISOString(),
      package: s.package
        ? {
            ...s.package,
            price: Number(s.package.price),
            discount: s.package.discount !== null
              ? Number(s.package.discount)
              : null,
            createdAt: s.package.createdAt.toISOString()
          }
        : null
    }))
  };
}

// --- 3b. LIST CORPORATES (FILTER/SORT) ---
export async function getCorporatesList(params?: {
  status?: 'all' | 'active' | 'archived';
  search?: string;
}) {
  await requireAdmin({ roles: ['SUPER_ADMIN'] });
  const status = params?.status ?? 'all';
  const search = params?.search?.trim();

  const filters: any[] = [];
  if (status === 'active') filters.push({ isActive: true });
  if (status === 'archived') filters.push({ isActive: false });
  if (search) {
    filters.push({
      OR: [
        { companyName: { contains: search, mode: 'insensitive' } },
        { contactPerson: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } }
      ]
    });
  }

  const where = filters.length ? { AND: filters } : undefined;

  const corporates = await prisma.corporate.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      companyName: true,
      contactPerson: true,
      email: true,
      phone: true,
      city: true,
      state: true,
      isActive: true,
      createdAt: true,
      _count: {
        select: {
          employees: true,
          services: true,
          users: true
        }
      }
    }
  });

  return corporates.map(c => ({
    ...c,
    createdAt: c.createdAt.toISOString()
  }));
}

// --- 3c. LIST CORPORATE SERVICES ---
export async function getCorporateServices(params?: {
  status?: 'all' | 'active' | 'archived';
  search?: string;
}) {
  await requireAdmin({ roles: ['SUPER_ADMIN'] });
  const status = params?.status ?? 'all';
  const search = params?.search?.trim();

  const filters: any[] = [];
  if (status === 'active') filters.push({ isActive: true });
  if (status === 'archived') filters.push({ isActive: false });
  if (search) {
    filters.push({
      OR: [
        { corporate: { companyName: { contains: search, mode: 'insensitive' } } },
        { package: { packageName: { contains: search, mode: 'insensitive' } } },
        { coupon: { code: { contains: search, mode: 'insensitive' } } }
      ]
    });
  }

  const where = filters.length ? { AND: filters } : undefined;

  const services = await prisma.corporateService.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      corporate: { select: { id: true, companyName: true, isActive: true } },
      package: { select: { id: true, packageName: true, price: true } },
      coupon: { select: { id: true, code: true } }
    }
  });

  return services.map(s => ({
    ...s,
    validFrom: s.validFrom.toISOString(),
    validTill: s.validTill.toISOString(),
    createdAt: s.createdAt.toISOString(),
    package: s.package
      ? { ...s.package, price: Number(s.package.price) }
      : null
  }));
}

// --- 3d. ARCHIVE / RESTORE CORPORATE ---
export async function setCorporateActiveStatus(corporateId: number, makeActive: boolean) {
  await requireAdmin({ roles: ['SUPER_ADMIN'] });
  try {
    if (makeActive) {
      await prisma.corporate.update({
        where: { id: corporateId },
        data: { isActive: true }
      });
      await prisma.corporateUser.updateMany({
        where: { corporateId },
        data: { isActive: true }
      });

      revalidatePath('/admin/corporates');
      revalidatePath('/admin/corporates/list');
      revalidatePath(`/admin/corporates/${corporateId}`);
      return { success: true };
    }

    await prisma.$transaction(async (tx) => {
      await tx.corporate.update({
        where: { id: corporateId },
        data: { isActive: false }
      });

      await tx.corporateUser.updateMany({
        where: { corporateId },
        data: { isActive: false }
      });

      await tx.customer.updateMany({
        where: { corporateId },
        data: { corporateId: null, role: 'USER' }
      });

      await tx.corporateService.updateMany({
        where: { corporateId, isActive: true },
        data: { isActive: false }
      });

      await tx.package.updateMany({
        where: { corporateId },
        data: { isCorporate: false, corporateId: null, isActive: false }
      });
    });

    revalidatePath('/admin/corporates');
    revalidatePath('/admin/corporates/list');
    revalidatePath(`/admin/corporates/${corporateId}`);
    revalidatePath('/admin/corporates/services');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Archive failed' };
  }
}


// --- 4. MAP DOMAIN ---
export async function mapDomainAction(corporateId: number, domain: string) {
  await requireAdmin({ roles: ['SUPER_ADMIN'] });
  try {
    if (!domain.startsWith('@')) domain = '@' + domain;

  const corp = await prisma.corporate.findUnique({
    where: { id: corporateId }
  });

  if (!corp) {
    return { success: false, error: 'Corporate not found' };
  }
  if (!corp.isActive) {
    return { success: false, error: 'Corporate is archived' };
  }

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

// --- 5. BULK UPLOAD EMPLOYEES (OPTIMIZED) ---
export async function uploadCorporateEmployees(
  corporateId: number,
  employees: any[]
) {
  await requireAdmin({ roles: ['SUPER_ADMIN'] });
  try {
    const normalizeText = (value: any) => {
      if (value === null || value === undefined) return undefined;
      const trimmed = String(value).trim();
      return trimmed ? trimmed : undefined;
    };

    const parseDateOfBirth = (value: any) => {
      if (!value) return null;
      if (value instanceof Date) {
        return Number.isNaN(value.getTime()) ? null : value;
      }
      const raw = String(value).trim();
      if (!raw) return null;

      const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (isoMatch) {
        const year = Number(isoMatch[1]);
        const month = Number(isoMatch[2]);
        const day = Number(isoMatch[3]);
        const candidate = new Date(year, month - 1, day);
        if (
          candidate.getFullYear() === year &&
          candidate.getMonth() === month - 1 &&
          candidate.getDate() === day
        ) {
          return candidate;
        }
        return null;
      }

      const dmyMatch = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
      if (dmyMatch) {
        const day = Number(dmyMatch[1]);
        const month = Number(dmyMatch[2]);
        const year = Number(dmyMatch[3]);
        const candidate = new Date(year, month - 1, day);
        if (
          candidate.getFullYear() === year &&
          candidate.getMonth() === month - 1 &&
          candidate.getDate() === day
        ) {
          return candidate;
        }
        return null;
      }

      const fallback = new Date(raw);
      return Number.isNaN(fallback.getTime()) ? null : fallback;
    };

    const corp = await prisma.corporate.findUnique({
      where: { id: corporateId },
      select: { isActive: true }
    });
    if (!corp || !corp.isActive) {
      return { success: false, error: 'Corporate is archived' };
    }

    const cleanedEmployees = (employees || [])
      .map((emp: any) => ({
        name: normalizeText(emp.name),
        email: normalizeText(emp.email),
        phone: normalizeText(emp.phone),
        employeeId: normalizeText(emp.employeeId),
        department: normalizeText(emp.department),
        location: normalizeText(emp.location),
        dob: normalizeText(emp.dob),
        gender: normalizeText(emp.gender),
        uhid: normalizeText(emp.uhid)
      }))
      .filter((emp: any) => emp.email || emp.phone);

    const uniqueEmployees: any[] = [];
    const seenKeys = new Set<string>();
    for (const emp of cleanedEmployees) {
      const keys: string[] = [];
      if (emp.email) keys.push(`email:${emp.email}`);
      if (emp.phone) keys.push(`phone:${emp.phone}`);
      if (keys.some((k) => seenKeys.has(k))) continue;
      keys.forEach((k) => seenKeys.add(k));
      uniqueEmployees.push(emp);
    }

    const emails = uniqueEmployees.map(e => e.email).filter(Boolean) as string[];
    const phones = uniqueEmployees.map(e => e.phone).filter(Boolean) as string[];
    const orConditions: any[] = [];
    if (emails.length) orConditions.push({ email: { in: emails } });
    if (phones.length) orConditions.push({ phone: { in: phones } });

    const existingCustomers = orConditions.length
      ? await prisma.customer.findMany({
          where: { OR: orConditions },
          select: { id: true, email: true, phone: true, department: true, location: true }
        })
      : [];

    const existingByEmail = new Map<string, any>();
    const existingByPhone = new Map<string, any>();
    existingCustomers.forEach((c) => {
      if (c.email) existingByEmail.set(c.email, c);
      if (c.phone) existingByPhone.set(c.phone, c);
    });

    let nextUhidNumber = 100001;
    const needsGeneratedUhid = uniqueEmployees.some((e) => !e.uhid);
    if (needsGeneratedUhid) {
      const lastCustomer = await prisma.customer.findFirst({
        where: { uhid: { not: null } },
        orderBy: { id: 'desc' },
        select: { uhid: true }
      });
      if (lastCustomer?.uhid) {
        const match = lastCustomer.uhid.match(/\d+/);
        if (match) nextUhidNumber = parseInt(match[0], 10) + 1;
      }
    }

    const buildUhid = () => `WTL-${nextUhidNumber++}`;

    let mapped = 0;
    let created = 0;

    // OPTIMIZATION: Hash once, use for all new users
    const defaultPasswordHash = await bcrypt.hash('Welcome123', 10);

    const updates: Array<{ id: number; data: any }> = [];
    const creates: any[] = [];

    for (const emp of uniqueEmployees) {
      const existing =
        (emp.email && existingByEmail.get(emp.email)) ||
        (emp.phone && existingByPhone.get(emp.phone));

      if (existing) {
        updates.push({
          id: existing.id,
          data: {
            corporateId,
            employeeId: emp.employeeId,
            department: emp.department || existing.department,
            location: emp.location || existing.location
          }
        });
      } else {
        const loginMethod = emp.email ? 'email' : 'phone';
        creates.push({
          name: emp.name || null,
          email: emp.email || null,
          phone: emp.phone || null,
          password: defaultPasswordHash,
          dateOfBirth: parseDateOfBirth(emp.dob),
          gender: emp.gender,
          employeeId: emp.employeeId,
          department: emp.department,
          location: emp.location,
          corporateId,
          isActive: true,
          loginMethod,
          uhid: emp.uhid || buildUhid()
        });
      }
    }

    for (const update of updates) {
      await prisma.customer.update({ where: { id: update.id }, data: update.data });
      mapped++;
    }

    const batchSize = 500;
    for (let i = 0; i < creates.length; i += batchSize) {
      const batch = creates.slice(i, i + batchSize);
      const res = await prisma.customer.createMany({
        data: batch,
        skipDuplicates: true
      });
      created += res.count;
    }

    revalidatePath(`/admin/corporates/${corporateId}`);
    return { success: true, stats: { mapped, created } };
  } catch (e: any) {
    console.error("Upload Error:", e);
    return { success: false, error: 'Processing failed: ' + e.message };
  }
}

// --- GET INVENTORY (For Dropdown) ---
export async function getAdminInventory(searchQuery: string = '') {
  await requireAdmin({ roles: ['SUPER_ADMIN'] });
  try {
    const [packages, coupons] = await Promise.all([
        prisma.package.findMany({
        where: {
            // ✅ UPDATED LOGIC:
            // 1. Must be marked as a Corporate Package
            // 2. Must NOT be assigned to any corporate yet (fresh inventory)
            isCorporate: true,
            corporateId: null,

            // Apply search filter if typed
            AND: [
                searchQuery ? { packageName: { contains: searchQuery, mode: 'insensitive' } } : {}
            ]
        },
        select: { id: true, packageName: true, price: true }
        }),
        prisma.coupon.findMany({
            where: { isActive: true },
            select: { id: true, code: true }
        })
    ]);

    // Format for client
    const safePackages = packages.map(p => ({
        ...p,
        packageName: p.packageName, // No need for "(Ready for Corp)" suffix since ALL are corporate now
        price: Number(p.price)
    }));

    return { packages: safePackages, coupons };
  } catch (e) {
      console.error(e);
      return { packages: [], coupons: [] };
  }
}

// --- ASSIGN SERVICE (Activate & Link) ---
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
  reportVisibilityOverride?: 'USER_ONLY' | 'CORPORATE_ONLY' | 'BOTH' | null;
}) {
  await requireAdmin({ roles: ['SUPER_ADMIN'] });
  try {
    if (!data.validFrom || !data.validTill) {
      return { success: false, error: 'Please select valid dates' };
    }
    if (new Date(data.validTill) < new Date(data.validFrom)) {
      return { success: false, error: 'Valid till must be after valid from' };
    }
    const corp = await prisma.corporate.findUnique({
      where: { id: data.corporateId },
      select: { isActive: true, companyName: true }
    });
    if (!corp || !corp.isActive) {
      return { success: false, error: 'Corporate is archived' };
    }

    // 1. Create the Service Link
    await prisma.corporateService.create({
      data: {
        corporateId: data.corporateId,
        packageId: data.type === 'PACKAGE' ? Number(data.itemId) : null,
        couponId: data.type === 'COUPON' ? Number(data.itemId) : null,
        validFrom: new Date(data.validFrom),
        validTill: new Date(data.validTill),
        selfPaymentType: data.selfPaymentType,
        familyPaymentType: data.familyPaymentType,
        selfUsageLimit: Number(data.selfLimit),
        familyUsageLimit: Number(data.familyLimit),
        reportVisibilityOverride: data.reportVisibilityOverride || null,
        isActive: true
      }
    });

    // 2. LOGIC: If Package, Activate and Assign Ownership
    if (data.type === 'PACKAGE') {
      await prisma.package.update({
        where: { id: Number(data.itemId) },
        data: {
          isActive: true,       // ACTIVATE
          isCorporate: true,    // Ensure flag
          corporateId: data.corporateId, // LOCK to Corporate
          showOnHomepage: false // Hidden from public
        }
      });

      // Notify corporate employees about assignment
      try {
        const employees = await prisma.customer.findMany({
          where: {
            corporateId: data.corporateId,
            isActive: true,
            phone: { not: null }
          },
          select: { name: true, phone: true }
        });

        const corporateName = corp.companyName || 'your organization';
        const batchSize = 25;
        for (let i = 0; i < employees.length; i += batchSize) {
          const batch = employees.slice(i, i + batchSize);
          await Promise.allSettled(
            batch.map((emp) => {
              const mobile = String(emp.phone || '').trim();
              if (!mobile) return Promise.resolve();
              const customerName = emp.name || 'Employee';
              return sendSMS(mobile, 'corp_assigned', [customerName, corporateName]);
            })
          );
        }
      } catch (smsError) {
        console.warn('Failed to send corporate assignment SMS', smsError);
      }
    }

    revalidatePath(`/admin/corporates/${data.corporateId}`);
    revalidatePath('/admin/corporates/services');
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: 'Failed to assign service' };
  }
}



// --- 8. TOGGLE STATUS (Helper) ---
export async function updateCorporateEmployeeStatus(
  customerId: number,
  status: boolean,
  corporateId: number
) {
  await requireAdmin({ roles: ['SUPER_ADMIN'] });
  try {
    const result = await prisma.customer.updateMany({
      where: { id: customerId, corporateId },
      data: { isActive: status }
    });

    if (result.count === 0) {
      return { success: false, error: "Employee not found" };
    }

    return { success: true };
  } catch (e) {
    return { success: false, error: "Failed to update statuses" };
  }
}

// Legacy helper (kept for backward compatibility)
export async function bulkUpdateEmployeeStatus(emails: string[], status: boolean, corporateId?: number) {
  await requireAdmin({ roles: ['SUPER_ADMIN'] });
  try {
    const where: any = { email: { in: emails } };
    if (corporateId) where.corporateId = corporateId;

    await prisma.customer.updateMany({
      where,
      data: { isActive: status }
    });
    return { success: true };
  } catch (e) {
    return { success: false, error: "Failed to update statuses" };
  }
}


// --- 8. UPDATE CORPORATE DETAILS ---
export async function updateCorporateAction(id: number, data: any) {
  await requireAdmin({ roles: ['SUPER_ADMIN'] });
  try {
    const normalizedEmail = normalizeEmail(data.email);
    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      return { success: false, error: 'Valid corporate email is required' };
    }

    // Optional: If password is provided, hash it. If empty, remove it from update data.
    const updateData: any = {
      companyName: data.companyName,
      contactPerson: data.contactPerson,
      phone: data.phone,
      email: normalizedEmail,
      address: data.address,
      city: data.city,
      state: data.state,
      pincode: data.pincode,
      panNumber: data.panNumber,
      gstin: data.gstin,
      employeeCount: parseInt(data.employeeCount || '0'),
    };

    if (data.password && data.password.trim() !== "") {
      updateData.password = await bcrypt.hash(data.password, 10);
    }
    if ('logoUrl' in data) {
      updateData.logoUrl = data.logoUrl || null;
    }

    await prisma.$transaction(async (tx) => {
      const current = await tx.corporate.findUnique({
        where: { id },
        select: { email: true }
      });

      if (!current) {
        throw new Error('Corporate not found');
      }

      await tx.corporate.update({
        where: { id },
        data: updateData
      });

      // Keep primary corporate login in sync with corporate master credentials.
      if (normalizeEmail(current.email) !== normalizedEmail) {
        await tx.corporateUser.updateMany({
          where: {
            corporateId: id,
            email: { equals: current.email, mode: 'insensitive' }
          },
          data: { email: normalizedEmail }
        });
      }

      if (updateData.password) {
        await tx.corporateUser.updateMany({
          where: {
            corporateId: id,
            OR: [
              { role: 'SUPER_ADMIN' },
              { email: { equals: normalizedEmail, mode: 'insensitive' } }
            ]
          },
          data: { password: updateData.password }
        });
      }
    });

    revalidatePath(`/admin/corporates/${id}`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: "Update failed: " + error.message };
  }
}

// --- 9. DELETE CORPORATE ---
export async function archiveCorporateAction(id: number) {
  await requireAdmin({ roles: ['SUPER_ADMIN'] });
  return await setCorporateActiveStatus(id, false);
}

// Backward compatibility: "delete" now archives
export const deleteCorporateAction = archiveCorporateAction;

// --- 10. REMOVE SERVICE (Release Package) ---
export async function deleteCorporateServiceAction(serviceId: number) {
  await requireAdmin({ roles: ['SUPER_ADMIN'] });
  try {
    const service = await prisma.corporateService.findUnique({
      where: { id: serviceId },
      select: { corporateId: true, packageId: true }
    });

    if (!service) {
      return { success: false, error: "Service not found" };
    }

    // 1. Delete the Service Link
    await prisma.corporateService.delete({
      where: { id: serviceId }
    });

    // 2. If it was a Package, release it back to the general inventory
    if (service.packageId) {
      await prisma.package.update({
        where: { id: service.packageId },
        data: { 
          isCorporate: false, 
          corporateId: null, 
          isActive: false // Deactivate until assigned again
        }
      });
    }

    revalidatePath('/admin/corporates');
    revalidatePath('/admin/corporates/services');
    revalidatePath(`/admin/corporates/${service.corporateId}`);
    return { success: true };
  } catch (error: any) {
    console.error(error);
    return { success: false, error: "Failed to remove service" };
  }
}

// --- 10b. DEACTIVATE SERVICE (KEEP HISTORY) ---
export async function deactivateCorporateServiceAction(serviceId: number) {
  await requireAdmin({ roles: ['SUPER_ADMIN'] });
  try {
    const service = await prisma.corporateService.findUnique({
      where: { id: serviceId },
      select: { id: true, corporateId: true, packageId: true, isActive: true }
    });

    if (!service) {
      return { success: false, error: 'Service not found' };
    }
    if (!service.isActive) {
      return { success: true };
    }

    await prisma.$transaction(async (tx) => {
      await tx.corporateService.update({
        where: { id: serviceId },
        data: { isActive: false }
      });

      // Keep package ownership but disable active booking for this package.
      if (service.packageId) {
        await tx.package.update({
          where: { id: service.packageId },
          data: { isActive: false }
        });
      }
    });

    revalidatePath(`/admin/corporates/${service.corporateId}`);
    revalidatePath(`/admin/corporates/${service.corporateId}/services/${serviceId}`);
    revalidatePath('/admin/corporates/services');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to deactivate service' };
  }
}

// --- 10c. SERVICE EMPLOYEE REPORT ---
export async function getCorporateServiceEmployeeReportAction(data: {
  corporateId: number;
  serviceId: number;
  status?: 'ALL' | 'PENDING' | 'IN_PROCESS' | 'AVAILED';
  from?: string;
  to?: string;
}) {
  await requireAdmin({ roles: ['SUPER_ADMIN', 'ADMIN'] });
  return getCorporateServiceEmployeeReport({
    corporateId: Number(data.corporateId),
    serviceId: Number(data.serviceId),
    status: data.status,
    from: data.from,
    to: data.to
  });
}

// --- 11. ASSIGN PACKAGE TO SPECIFIC EMPLOYEES ---
export async function assignEmployeesToPackageAction(data: {
  corporateId: number;
  packageId: number;
  identifiers: string[]; // emails / employeeIds / phones
}) {
  await requireAdmin({ roles: ['SUPER_ADMIN'] });
  try {
    const corporateId = Number(data.corporateId);
    const packageId = Number(data.packageId);
    if (!corporateId || !packageId) {
      return { success: false, error: 'Invalid corporate or package' };
    }

    const cleaned = Array.from(new Set((data.identifiers || [])
      .map(i => String(i || '').trim())
      .filter(Boolean)));

    if (!cleaned.length) {
      return { success: false, error: 'No employee identifiers provided' };
    }

    const employees = await prisma.customer.findMany({
      where: {
        corporateId,
        OR: [
          { email: { in: cleaned } },
          { employeeId: { in: cleaned } },
          { phone: { in: cleaned } }
        ]
      },
      select: { id: true }
    });

    if (!employees.length) {
      return { success: false, error: 'No matching employees found' };
    }

    const existing = await prisma.employeePackage.findMany({
      where: {
        packageId,
        customerId: { in: employees.map(e => e.id) }
      },
      select: { customerId: true }
    });
    const existingSet = new Set(existing.map(e => e.customerId));

    const service = await prisma.corporateService.findFirst({
      where: { corporateId, packageId, isActive: true },
      select: { selfPaymentType: true }
    });

    const paidBy = service?.selfPaymentType || 'USER_PAYS';

    const toCreate = employees
      .filter(e => !existingSet.has(e.id))
      .map(e => ({
        customerId: e.id,
        packageId,
        paidBy
      }));

    if (toCreate.length) {
      await prisma.employeePackage.createMany({ data: toCreate });
    }

    revalidatePath(`/admin/corporates/${corporateId}`);
    return { success: true, assigned: toCreate.length, totalFound: employees.length };
  } catch (error: any) {
    console.error(error);
    return { success: false, error: error.message || 'Assignment failed' };
  }
}

// --- 12. CLEAR PACKAGE ASSIGNMENTS (Make available to all employees) ---
export async function clearPackageAssignmentsAction(data: {
  corporateId: number;
  packageId: number;
}) {
  await requireAdmin({ roles: ['SUPER_ADMIN'] });
  try {
    const corporateId = Number(data.corporateId);
    const packageId = Number(data.packageId);
    if (!corporateId || !packageId) {
      return { success: false, error: 'Invalid corporate or package' };
    }

    const result = await prisma.employeePackage.deleteMany({
      where: {
        packageId,
        customer: { corporateId }
      }
    });

    revalidatePath(`/admin/corporates/${corporateId}`);
    return { success: true, removed: result.count };
  } catch (error: any) {
    console.error(error);
    return { success: false, error: error.message || 'Failed to clear assignments' };
  }
}

// --- 13. CORPORATE MANAGEMENT DETAILS (PROFILE + SPOCS) ---
export async function getCorporateManagementDetailsAction(corporateId: number) {
  await requireAdmin({ roles: ['SUPER_ADMIN', 'ADMIN'] });
  if (!corporateId) return null;

  const corp = await prisma.corporate.findUnique({
    where: { id: corporateId },
    select: {
      id: true,
      companyName: true,
      contactPerson: true,
      email: true,
      phone: true,
      address: true,
      city: true,
      state: true,
      pincode: true,
      panNumber: true,
      gstin: true,
      employeeCount: true,
      isActive: true,
      users: {
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          canEdit: true,
          maskContactInfo: true,
          accessDept: true,
          accessLocation: true,
          isActive: true,
          createdAt: true
        }
      }
    }
  });

  if (!corp) return null;

  return {
    ...corp,
    users: corp.users.map((u) => ({ ...u, createdAt: u.createdAt.toISOString() }))
  };
}

// --- 14. CREATE CORPORATE SPOC/USER BY ADMIN ---
export async function createCorporateUserByAdminAction(data: {
  corporateId: number;
  name: string;
  email: string;
  password: string;
  role: 'SUPER_ADMIN' | 'DEPT_HEAD' | 'LOCATION_MANAGER';
  canEdit?: boolean;
  maskContactInfo?: boolean;
  accessDept?: string;
  accessLocation?: string;
}) {
  await requireAdmin({ roles: ['SUPER_ADMIN', 'ADMIN'] });
  try {
    const corporateId = Number(data.corporateId);
    if (!corporateId) return { success: false, error: 'Invalid corporate' };

    const normalizedEmail = normalizeEmail(data.email);
    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      return { success: false, error: 'Valid email is required' };
    }
    if (!data.password || String(data.password).length < 8) {
      return { success: false, error: 'Password must be at least 8 characters' };
    }

    await prisma.corporateUser.create({
      data: {
        corporateId,
        name: String(data.name || '').trim(),
        email: normalizedEmail,
        password: await bcrypt.hash(String(data.password), 10),
        role: data.role,
        canEdit: Boolean(data.canEdit),
        maskContactInfo: data.maskContactInfo !== false,
        accessDept: data.accessDept || null,
        accessLocation: data.accessLocation || null,
        isActive: true
      }
    });

    revalidatePath(`/admin/corporates/${corporateId}/management`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to create user' };
  }
}

// --- 15. TOGGLE CORPORATE USER STATUS BY ADMIN ---
export async function setCorporateUserActiveStatusByAdminAction(data: {
  corporateId: number;
  userId: number;
  isActive: boolean;
}) {
  await requireAdmin({ roles: ['SUPER_ADMIN', 'ADMIN'] });
  try {
    const corporateId = Number(data.corporateId);
    const userId = Number(data.userId);
    if (!corporateId || !userId) return { success: false, error: 'Invalid payload' };

    const updated = await prisma.corporateUser.updateMany({
      where: { id: userId, corporateId },
      data: { isActive: Boolean(data.isActive) }
    });

    if (updated.count === 0) {
      return { success: false, error: 'User not found' };
    }

    revalidatePath(`/admin/corporates/${corporateId}/management`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to update user status' };
  }
}

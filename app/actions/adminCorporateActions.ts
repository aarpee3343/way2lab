'use server';

import { requireAdmin } from '@/lib/admin-auth';

import prisma from '@/lib/db';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';

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
    const passwordHash = await bcrypt.hash(data.password, 10);

    const corporate = await prisma.$transaction(async (tx) => {
      const corp = await tx.corporate.create({
        data: {
          companyName: data.companyName,
          contactPerson: data.contactPerson,
          email: data.email,
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
          email: data.email,
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
    const corp = await prisma.corporate.findUnique({
      where: { id: corporateId },
      select: { isActive: true }
    });
    if (!corp || !corp.isActive) {
      return { success: false, error: 'Corporate is archived' };
    }

    let mapped = 0;
    let created = 0;
    
    // OPTIMIZATION: Hash once, use for all new users
    const defaultPasswordHash = await bcrypt.hash('Welcome123', 10);

    for (const emp of employees) {
      if (!emp.phone && !emp.email) continue; 

      const existing = await prisma.customer.findFirst({
        where: {
          OR: [
            { phone: emp.phone }, 
            { email: emp.email }
          ]
        }
      });

      if (existing) {
        await prisma.customer.update({
          where: { id: existing.id },
          data: {
            corporateId,
            employeeId: emp.employeeId,
            department: emp.department || existing.department,
            location: emp.location || existing.location
          }
        });
        mapped++;
      } else {
        await prisma.customer.create({
          data: {
            name: emp.name,
            email: emp.email,
            phone: emp.phone,
            password: defaultPasswordHash, // Used pre-hashed password
            dateOfBirth: emp.dob ? new Date(emp.dob) : null,
            gender: emp.gender,
            employeeId: emp.employeeId,
            department: emp.department,
            location: emp.location,
            corporateId,
            isActive: true,
            loginMethod: 'email'
          }
        });
        created++;
      }
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
      select: { isActive: true }
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
    // Optional: If password is provided, hash it. If empty, remove it from update data.
    const updateData: any = {
      companyName: data.companyName,
      contactPerson: data.contactPerson,
      phone: data.phone,
      email: data.email,
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

    await prisma.corporate.update({
      where: { id },
      data: updateData
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

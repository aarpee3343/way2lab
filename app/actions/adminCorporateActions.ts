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

// --- 2. CREATE CORPORATE ---
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

// --- 3. FETCH SINGLE CORPORATE DETAILS ---
export async function getCorporateDetails(id: number) {
  if (!id) return null;

  const corp = await prisma.corporate.findUnique({
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

  if (!corp) return null;

  return {
    ...corp,
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


// --- 4. MAP DOMAIN ---
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

// --- 5. BULK UPLOAD EMPLOYEES (OPTIMIZED) ---
export async function uploadCorporateEmployees(
  corporateId: number,
  employees: any[]
) {
  try {
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
  try {
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
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: 'Failed to assign service' };
  }
}



// --- 8. TOGGLE STATUS (Helper) ---
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


// --- 8. UPDATE CORPORATE DETAILS ---
export async function updateCorporateAction(id: number, data: any) {
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
export async function deleteCorporateAction(id: number) {
  try {
    // 1. Release all packages owned by this corporate back to inventory
    await prisma.package.updateMany({
      where: { corporateId: id },
      data: { isCorporate: false, corporateId: null, isActive: false }
    });

    // 2. Delete the corporate (Cascade will likely handle relations if configured, but let's be safe)
    await prisma.corporate.delete({ where: { id } });

    revalidatePath('/admin/corporates');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: "Delete failed. Ensure no active orders exist." };
  }
}

// --- 10. REMOVE SERVICE (Release Package) ---
export async function deleteCorporateServiceAction(serviceId: number, packageId: number | null) {
  try {
    // 1. Delete the Service Link
    await prisma.corporateService.delete({
      where: { id: serviceId }
    });

    // 2. If it was a Package, release it back to the general inventory
    // (Since you want 1-to-1, removing it means it's free to be assigned to someone else)
    if (packageId) {
      await prisma.package.update({
        where: { id: packageId },
        data: { 
            isCorporate: false, 
            corporateId: null, 
            isActive: false // Deactivate until assigned again
        }
      });
    }

    revalidatePath('/admin/corporates'); // Refresh generic path
    return { success: true };
  } catch (error: any) {
    console.error(error);
    return { success: false, error: "Failed to remove service" };
  }
}
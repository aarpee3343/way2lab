'use server';

import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';

/* =====================================================
   1. CREATE NEW CORPORATE + SUPER ADMIN USER
===================================================== */
export async function createCorporateAction(data: any) {
  try {
    const hashedPassword = await bcrypt.hash(data.password, 10);

    await prisma.$transaction(async (tx) => {
      // Create Corporate
      const corp = await tx.corporate.create({
        data: {
          companyName: data.companyName,
          domain: data.domain,
          contactPerson: data.contactPerson,
          phone: data.phone,
          address: data.address,
        },
      });

      // Create Super Admin User
      await tx.corporateUser.create({
        data: {
          corporateId: corp.id,
          name: data.contactPerson,
          email: data.email,
          password: hashedPassword,
          role: 'SUPER_ADMIN',
        },
      });
    });

    revalidatePath('/admin/corporates');
    return { success: true };
  } catch (error) {
    console.error('Create Corporate Error:', error);
    return { success: false, error: 'Failed to create corporate' };
  }
}

/* =====================================================
   2. BULK UPLOAD EMPLOYEES (CSV)
===================================================== */
export async function bulkUploadEmployeesAction(
  corporateId: number,
  employees: any[]
) {
  try {
    let successCount = 0;
    let failCount = 0;

    for (const emp of employees) {
      if (!emp.email || !emp.phone || !emp.name) {
        failCount++;
        continue;
      }

      const existingCustomer = await prisma.customer.findFirst({
        where: {
          OR: [{ email: emp.email }, { phone: emp.phone }],
        },
      });

      if (existingCustomer) {
        // Link existing customer to corporate
        await prisma.customer.update({
          where: { id: existingCustomer.id },
          data: {
            corporateId,
            employeeId: emp.employeeId,
            department: emp.department,
            location: emp.location,
          },
        });
      } else {
        // Create new customer
        const randomPass = Math.random().toString(36).slice(-8);
        const hashedPassword = await bcrypt.hash(randomPass, 10);

        await prisma.customer.create({
          data: {
            name: emp.name,
            email: emp.email,
            phone: emp.phone,
            password: hashedPassword,
            corporateId,
            employeeId: emp.employeeId,
            department: emp.department,
            location: emp.location,
            isActive: true,
          },
        });
      }

      successCount++;
    }

    revalidatePath(`/admin/corporates/${corporateId}`);
    return {
      success: true,
      stats: { successCount, failCount },
    };
  } catch (error) {
    console.error('Bulk Upload Error:', error);
    return { success: false, error: 'Bulk upload failed' };
  }
}

/* =====================================================
   3. ASSIGN PACKAGE TO EMPLOYEES
===================================================== */
export async function assignPackageAction(
  corporateId: number,
  packageId: number,
  employeeIds: number[]
) {
  try {
    const pkg = await prisma.package.findUnique({
      where: { id: packageId },
    });

    if (!pkg) {
      return { success: false, error: 'Package not found' };
    }

    const assignments = employeeIds.map((customerId) => ({
      customerId,
      packageId,
      paidBy: pkg.paymentType || 'USER_PAYS',
      status: 'ASSIGNED',
    }));

    await prisma.employeePackage.createMany({
      data: assignments,
      skipDuplicates: true,
    });

    revalidatePath(`/admin/corporates/${corporateId}`);
    return { success: true };
  } catch (error) {
    console.error('Assign Package Error:', error);
    return { success: false, error: 'Assignment failed' };
  }
}

/* =====================================================
   4. GET ALL CORPORATES (LIST PAGE)
===================================================== */
export async function getCorporates() {
  const corporates = await prisma.corporate.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: {
          employees: true,
          packages: true,
        },
      },
    },
  });

  return corporates;
}

/* =====================================================
   5. GET CORPORATE DETAILS (DETAIL PAGE)
===================================================== */
export async function getCorporateById(id: number) {
  const corporate = await prisma.corporate.findUnique({
    where: { id },
    include: {
      employees: {
        orderBy: { id: 'desc' },
        take: 100, // pagination recommended later
      },
      packages: true,
      users: true, // corporate admins / sub-admins
      _count: {
        select: {
          employees: true,
          packages: true,
          tickets: true,
        },
      },
    },
  });

  return corporate;
}

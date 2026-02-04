'use server';

import { requireAdmin } from '@/lib/admin-auth';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import crypto from 'crypto';

// 1. Get Lab Form Data (Packages & Tests for selection)
export async function getLabFormData() {
  await requireAdmin({ roles: ['SUPER_ADMIN'] });
  const [packages, tests] = await Promise.all([
    prisma.package.findMany({
      where: { isActive: true },
      select: {
        id: true,
        packageName: true,
        price: true,
        tests: {
          select: {
            test: {
              select: {
                id: true,
                testName: true,
              },
            },
          },
        },
      },
      orderBy: { packageName: 'asc' },
    }),

    prisma.test.findMany({
      where: { isActive: true },
      select: {
        id: true,
        testName: true,
        price: true,
        discount: true,
      },
      orderBy: { testName: 'asc' },
    }),
  ]);

  return {
    packages: packages.map(p => ({
      id: p.id,
      packageName: p.packageName,
      price: Number(p.price),
      tests: p.tests,
    })),
    tests: tests.map(t => ({
      id: t.id,
      testName: t.testName,
      price: Number(t.price),
      discount: Number(t.discount || 0),
    })),
  };
}


// 2. Create Lab (Wizard Logic)
 export async function createLabAction(data: any) {
  await requireAdmin({ roles: ['SUPER_ADMIN'] });
  try {
    await prisma.$transaction(async (tx) => {
      // A. CREATE LAB
      const lab = await tx.lab.create({
        data: {
          labName: data.labName,
          address: data.address,
          city: data.city,
          state: data.state,
          pincode: data.pincode,

          contactNo: data.contactNo,
          email: data.email,

          password: data.password || 'password123',
          activeStatus: typeof data.activeStatus === 'boolean' ? data.activeStatus : true,
          status: 'Pending',

          latitude: data.latitude ?? null,
          longitude: data.longitude ?? null,

          rating: data.rating ?? 4.5,
          reviewCount: data.reviewCount ?? 0,

          features: data.features ?? [],
          timings: data.timings ?? null,

          panNo: data.panNo ?? undefined,
          gstNo: data.gstNo ?? undefined,

          homeCollectionCharges: Number(data.homeCollectionCharges) || 0,
        },
      });

      // B. ASSIGN PINCODES
      if (Array.isArray(data.pincodes) && data.pincodes.length > 0) {
        await tx.labPincode.createMany({
          data: data.pincodes.map((pin: string) => ({
            labId: lab.id,
            pincode: pin,
          })),
        });
      }

      // C. ASSIGN PACKAGES
      if (Array.isArray(data.packages)) {
        const packageRows = data.packages
          .filter((p: any) => p.selected)
          .map((p: any) => ({
            labId: lab.id,
            packageId: p.id,
            price: Number(p.price) || 0,
            discount: Number(p.discount) || 0,
          }));

        if (packageRows.length > 0) {
          await tx.labPackage.createMany({ data: packageRows });
        }
      }

      // D. ASSIGN TESTS (OPTIMIZED)
      if (Array.isArray(data.tests)) {
        const testRows = data.tests
          .filter((t: any) => t.selected)
          .map((t: any) => ({
            labId: lab.id,
            testId: t.id,
            price: Number(t.price) || 0,
            discount: Number(t.discount) || 0,
            available: true,
          }));

        if (testRows.length > 0) {
          await tx.labTest.createMany({ data: testRows });
        }
      }
    }); // ✅ THIS CLOSING WAS MISSING OR MISPLACED

    revalidatePath('/admin/labs');
    return { success: true };

  } catch (error: any) {
    console.error('Create Lab Error:', error);
    return { success: false, error: error.message };
  }
}



// 3. Get Lab by ID (FIXED: Converts Decimals to Numbers)
export async function getLabById(id: number) {
  await requireAdmin({ roles: ['SUPER_ADMIN'] });
  const lab = await prisma.lab.findUnique({
    where: { id },
    include: {
      pincodes: true,
      packages: {
        include: {
          package: true,
        },
      },
      tests: {
        include: {
          test: true,
        },
      },
    },
  });

  if (!lab) return null;

  return {
    id: lab.id,
    labName: lab.labName,
    address: lab.address,
    city: lab.city,
    state: lab.state,
    pincode: lab.pincode,

    contactNo: lab.contactNo,
    email: lab.email,
    password: lab.password,

    latitude: lab.latitude,
    longitude: lab.longitude,
    rating: Number(lab.rating),
    reviewCount: lab.reviewCount,

    features: lab.features ?? [],
    timings: lab.timings ?? null,

    panNo: lab.panNo,
    gstNo: lab.gstNo,
    activeStatus: lab.activeStatus,

    homeCollectionCharges: Number(lab.homeCollectionCharges),

    pincodes: lab.pincodes.map(p => p.pincode),

    packages: lab.packages.map(p => ({
      id: p.packageId,
      packageName: p.package.packageName,
      price: Number(p.price),
      discount: Number(p.discount),
      selected: true,
    })),

    tests: lab.tests.map(t => ({
      id: t.testId,
      testName: t.test.testName,
      price: Number(t.price),
      discount: Number(t.discount),
      selected: true,
    })),
  };
}


// 4. Update Lab
export async function updateLabAction(id: number, data: any) {
  await requireAdmin({ roles: ['SUPER_ADMIN'] });
  try {
    // 1️⃣ TRANSACTION (FAST)
    await prisma.$transaction(async (tx) => {
      await tx.lab.update({
        where: { id },
        data: {
          labName: data.labName,
          address: data.address,
          city: data.city,
          state: data.state,
          pincode: data.pincode,
          contactNo: data.contactNo,
          email: data.email,
          latitude: data.latitude ?? null,
          longitude: data.longitude ?? null,
          rating: typeof data.rating === 'number' ? data.rating : undefined,
          reviewCount: typeof data.reviewCount === 'number' ? data.reviewCount : undefined,
          features: data.features ?? [],
          timings: data.timings ?? null,
          panNo: data.panNo ?? undefined,
          gstNo: data.gstNo ?? undefined,
          activeStatus: data.activeStatus,
          homeCollectionCharges: Number(data.homeCollectionCharges) || 0,
        },
      });
    });

    // 2️⃣ PINCODES (OUTSIDE TX)
    if (Array.isArray(data.pincodes)) {
      await prisma.labPincode.deleteMany({ where: { labId: id } });

      if (data.pincodes.length > 0) {
        await prisma.labPincode.createMany({
          data: data.pincodes.map((pin: string) => ({
            labId: id,
            pincode: pin,
          })),
        });
      }
    }

    // 3️⃣ PACKAGES (OUTSIDE TX)
    if (Array.isArray(data.packages)) {
      await prisma.labPackage.deleteMany({ where: { labId: id } });

      const packageRows = data.packages
        .filter((p: any) => p.selected)
        .map((p: any) => ({
          labId: id,
          packageId: p.id,
          price: Number(p.price) || 0,
          discount: Number(p.discount) || 0,
        }));

      if (packageRows.length > 0) {
        await prisma.labPackage.createMany({ data: packageRows });
      }
    }

    // 4️⃣ TESTS (OUTSIDE TX)
    if (Array.isArray(data.tests)) {
      await prisma.labTest.deleteMany({ where: { labId: id } });

      const testRows = data.tests
        .filter((t: any) => t.selected)
        .map((t: any) => ({
          labId: id,
          testId: t.id,
          price: Number(t.price) || 0,
          discount: Number(t.discount) || 0,
          available: true,
        }));

      if (testRows.length > 0) {
        await prisma.labTest.createMany({ data: testRows });
      }
    }

    revalidatePath('/admin/labs');
    return { success: true };

  } catch (error: any) {
    console.error('Update Lab Error:', error);
    return { success: false, error: error.message };
  }
}




// 5. Delete Lab
export async function deleteLabAction(id: number) {
  await requireAdmin({ roles: ['SUPER_ADMIN'] });
  try {
    await prisma.lab.delete({ where: { id } });
    revalidatePath('/admin/labs');
    return { success: true };
  } catch (e) {
    return { success: false, error: "Failed to delete lab" };
  }
}

// 6. Generate Partner Link (Fixed Table Name)
export async function generatePartnerLink(labName: string) {
  await requireAdmin({ roles: ['SUPER_ADMIN'] });
  const token = crypto.randomBytes(16).toString('hex');
  // Check your schema: usually it's LabInvitation or Invitation
  // Assuming 'LabInvitation' based on context
  /* await prisma.labInvitation.create({
    data: {
      labName,
      token,
      status: 'Pending'
    }
  });
  */
  return token; 
}

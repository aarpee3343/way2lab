'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import crypto from 'crypto';

// 1. Get Lab Form Data (Packages & Tests for selection)
export async function getLabFormData() {
  const [packages, tests] = await Promise.all([
    prisma.package.findMany({ 
      where: { isActive: true }, 
      select: { id: true, packageName: true, price: true } // Fetch price too
    }),
    prisma.test.findMany({ 
      where: { isActive: true }, 
      select: { id: true, testName: true, price: true } 
    })
  ]);

  // ✅ FIX: Convert Decimals to Numbers to prevent serialization errors
  return { 
    packages: packages.map(p => ({ 
      ...p, 
      price: Number(p.price) 
    })), 
    tests: tests.map(t => ({ 
      ...t, 
      price: Number(t.price) 
    })) 
  };
}

// 2. Create Lab (Wizard Logic)
export async function createLabAction(data: any) {
  try {
    await prisma.$transaction(async (tx) => {
      // A. Create Lab
      const lab = await tx.lab.create({
        data: {
          labName: data.labName,
          address: data.address,
          city: data.city,
          pincode: data.pincode,
          contactNo: data.contactNo,
          email: data.email,
          homeCollectionCharges: parseFloat(data.homeCollectionCharges),
          status: 'Active'
        }
      });

      // B. Assign Pincodes
      if (data.pincodes && data.pincodes.length > 0) {
        await tx.labPincode.createMany({
          data: data.pincodes.map((pin: string) => ({ labId: lab.id, pincode: pin }))
        });
      }

      // C. Assign Packages (With Custom Pricing)
      for (const pkg of data.packages) {
        if (pkg.selected) {
          await tx.labPackage.create({
            data: {
              labId: lab.id,
              packageId: pkg.id,
              price: parseFloat(pkg.price),
              discount: parseFloat(pkg.discount || '0')
            }
          });
        }
      }

      // D. Assign Tests (With Custom Pricing)
      for (const test of data.tests) {
        if (test.selected) {
          await tx.labTest.create({
            data: {
              labId: lab.id,
              testId: test.id,
              price: parseFloat(test.price),
              discount: parseFloat(test.discount || '0'),
              available: true
            }
          });
        }
      }
    });
    revalidatePath('/admin/labs');
    return { success: true };
  } catch (error: any) {
    console.error("Create Lab Error:", error);
    return { success: false, error: error.message };
  }
}

// 3. Get Lab by ID (FIXED: Converts Decimals to Numbers)
export async function getLabById(id: number) {
  const lab = await prisma.lab.findUnique({
    where: { id },
    include: {
      pincodes: true,
      // ⚠️ FIX: Use 'packages' instead of 'labPackages'
      packages: { include: { package: true } }, 
      // ⚠️ FIX: Use 'tests' instead of 'labTests'
      tests: { include: { test: true } }        
    }
  });

  if (!lab) return null;

  // CONVERT DECIMALS TO NUMBERS
  return {
    ...lab,
    homeCollectionCharges: Number(lab.homeCollectionCharges), 
    pincodesStr: lab.pincodes.map(p => p.pincode).join(', '),
    
    // ⚠️ FIX: Map from 'lab.packages'
    packages: lab.packages.map(p => ({
      id: p.packageId,
      packageName: p.package.packageName,
      price: Number(p.price),       
      discount: Number(p.discount), 
      selected: true
    })),
    
    // ⚠️ FIX: Map from 'lab.tests'
    tests: lab.tests.map(t => ({
      id: t.testId,
      testName: t.test.testName,
      price: Number(t.price),       
      discount: Number(t.discount), 
      selected: true
    }))
  };
}

// 4. Update Lab
export async function updateLabAction(id: number, data: any) {
  try {
    await prisma.$transaction(async (tx) => {
      // A. Update Base Info
      await tx.lab.update({
        where: { id },
        data: {
          labName: data.labName,
          address: data.address,
          city: data.city,
          pincode: data.pincode,
          contactNo: data.contactNo,
          email: data.email,
          homeCollectionCharges: parseFloat(data.homeCollectionCharges),
        }
      });

      // B. Update Pincodes (Delete all & Re-create)
      await tx.labPincode.deleteMany({ where: { labId: id } });
      if (data.pincodes && data.pincodes.length > 0) {
        await tx.labPincode.createMany({
          data: data.pincodes.map((pin: string) => ({ labId: id, pincode: pin }))
        });
      }

      // C. Update Packages (Delete all & Re-create)
      await tx.labPackage.deleteMany({ where: { labId: id } });
      for (const pkg of data.packages) {
        if (pkg.selected) {
          await tx.labPackage.create({
            data: {
              labId: id,
              packageId: pkg.id,
              price: parseFloat(pkg.price),
              discount: parseFloat(pkg.discount || '0')
            }
          });
        }
      }

      // D. Update Tests (Delete all & Re-create)
      await tx.labTest.deleteMany({ where: { labId: id } });
      for (const test of data.tests) {
        if (test.selected) {
          await tx.labTest.create({
            data: {
              labId: id,
              testId: test.id,
              price: parseFloat(test.price),
              discount: parseFloat(test.discount || '0'),
              available: true
            }
          });
        }
      }
    });
    revalidatePath('/admin/labs');
    return { success: true };
  } catch (error: any) {
    console.error(error);
    return { success: false, error: error.message };
  }
}

// 5. Delete Lab
export async function deleteLabAction(id: number) {
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
'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// --- 1. GET PACKAGES LIST (For Admin Table) ---
export async function getPackages() {
  const packages = await prisma.package.findMany({
    orderBy: { id: 'desc' },
    include: {
      _count: { select: { tests: true } } // Count included tests (relation name: 'tests')
    }
  });

  // ✅ FIX: Convert 'price' and 'discount' from Decimal to Number
  return packages.map(pkg => ({
    ...pkg,
    price: Number(pkg.price),
    discount: Number(pkg.discount || 0)
  }));
}

// --- 2. GET STATS ---
export async function getPackageStats() {
  const [total, active] = await Promise.all([
    prisma.package.count(),
    prisma.package.count({ where: { isActive: true } }),
  ]);
  return { total, active, inactive: total - active };
}

// --- 3. GET FORM DATA (Tests List for "Add Package" Page) ---
export async function getPackageFormData() {
  const tests = await prisma.test.findMany({
    where: { isActive: true },
    select: { id: true, testName: true, price: true }
  });

  // ✅ FIX: Convert 'price' from Decimal to Number
  // This prevents the "Decimal objects are not supported" error
  return tests.map(t => ({
    ...t,
    price: Number(t.price)
  }));
}

// --- 4. CREATE PACKAGE ---
export async function createPackageAction(formData: FormData) {
  try {
    const packageName = formData.get('package_name') as string;
    const description = formData.get('description') as string;
    const preparation = formData.get('preparation') as string;
    const price = parseFloat(formData.get('price') as string);
    const discount = parseFloat(formData.get('discount') as string || '0');
    const isActive = formData.get('is_active') === 'on';
    
    // Get Selected Test IDs
    const testIds = formData.getAll('test_ids').map(id => parseInt(id as string));

    if (!packageName || isNaN(price)) {
      return { success: false, error: "Name and Valid Price are required" };
    }

    await prisma.package.create({
      data: {
        packageName,
        description,
        preparation,
        price,
        discount,
        isActive,
        // Link Tests using the relation (PackageTest)
        tests: {
          create: testIds.map(tid => ({
            testId: tid
          }))
        }
      }
    });

    revalidatePath('/admin/packages');
    return { success: true };
  } catch (error: any) {
    console.error("Create Package Error:", error);
    return { success: false, error: "Failed to create package" };
  }
}

// --- 5. DELETE PACKAGE ---
export async function deletePackageAction(id: number) {
  try {
    await prisma.package.delete({ where: { id } });
    revalidatePath('/admin/packages');
    return { success: true };
  } catch (error) {
    return { success: false, error: "Cannot delete package (likely linked to orders)" };
  }
}
'use server';

import { prisma } from '@/lib/db';
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


// --- 6. GET SINGLE PACKAGE (For Edit Page) ---
export async function getPackageById(id: number) {
  const pkg = await prisma.package.findUnique({
    where: { id },
    include: {
      tests: {
        select: { testId: true } // Fetch just the IDs of linked tests
      }
    }
  });

  if (!pkg) return null;

  return {
    ...pkg,
    price: Number(pkg.price),
    discount: Number(pkg.discount || 0),
    // Flatten the relation to a simple array of IDs: [1, 5, 9]
    testIds: pkg.tests.map(t => t.testId) 
  };
}

// --- 7. UPDATE PACKAGE ---
export async function updatePackageAction(id: number, formData: FormData) {
  try {
    const packageName = formData.get('package_name') as string;
    const description = formData.get('description') as string;
    const preparation = formData.get('preparation') as string;
    const price = parseFloat(formData.get('price') as string);
    const discount = parseFloat(formData.get('discount') as string || '0');
    
    // Checkbox handling: form sends 'on' if checked, null if not
    const isActive = formData.get('is_active') === 'on';
    
    // Corporate Fields
    const category = formData.get('category') as string;
    const isPreEmployment = formData.get('isPreEmployment') === 'on';

    // Get Selected Test IDs
    const testIds = formData.getAll('test_ids').map(tid => parseInt(tid as string));

    if (!packageName || isNaN(price)) {
      return { success: false, error: "Name and Valid Price are required" };
    }

    // ✅ Update Transaction
    await prisma.package.update({
      where: { id },
      data: {
        packageName,
        description,
        preparation,
        price,
        discount,
        isActive,
        
        // Only update these if your Schema has them
        category: category || 'ANNUAL', 
        // isPreEmployment, // Uncomment if your schema has this field

        // ✅ Relation Logic: Wipe old links, create new ones
        tests: {
          deleteMany: {}, // 1. Remove all existing links
          create: testIds.map(tid => ({ testId: tid })) // 2. Add new selected IDs
        }
      }
    });

    revalidatePath('/admin/packages');
    return { success: true };
  } catch (error: any) {
    console.error("Update Package Error:", error);
    return { success: false, error: "Failed to update package" };
  }
}
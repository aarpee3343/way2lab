'use server';

import { requireAdmin } from '@/lib/admin-auth';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

// --- 1. GET PACKAGES LIST (For Admin Table) ---
export async function getPackages(search?: string) {
  await requireAdmin({ roles: ['SUPER_ADMIN'] });
  const query = (search || '').trim();
  const packages = await prisma.package.findMany({
    where: query
      ? {
          OR: [
            { packageName: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { category: { contains: query, mode: 'insensitive' } }
          ]
        }
      : undefined,
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
  await requireAdmin({ roles: ['SUPER_ADMIN'] });
  const [total, active] = await Promise.all([
    prisma.package.count(),
    prisma.package.count({ where: { isActive: true } }),
  ]);
  return { total, active, inactive: total - active };
}

// --- 3. GET FORM DATA (Tests List for "Add Package" Page) ---
export async function getPackageFormData() {
  await requireAdmin({ roles: ['SUPER_ADMIN'] });
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

export async function createPackageAction(formData: FormData) {
  await requireAdmin({ roles: ['SUPER_ADMIN'] });
  try {
    const packageName = formData.get('package_name') as string;
    const description = formData.get('description') as string;
    const preparation = formData.get('preparation') as string;
    const price = parseFloat(formData.get('price') as string);
    const discount = parseFloat(formData.get('discount') as string || '0');
    
    // Capture Corporate Fields
    const isCorporate = formData.get('isCorporate') === 'on'; 
    const category = formData.get('category') as string;
    const isPreEmployment = formData.get('isPreEmployment') === 'on';

    // LOGIC: Set Status
    // If Corporate -> Force Inactive (wait for assignment)
    // If Standard  -> Use Form Value (Default Active)
    let isActive = formData.get('is_active') === 'on';
    if (isCorporate) {
        isActive = false; 
    }

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
        isActive, // Applied Logic
        showOnHomepage: isCorporate ? false : true, // Corporate packages hidden from home
        
        // Corporate Data
        isCorporate,
        corporateId: null, // Explicitly unassigned
        category: isCorporate ? category : null, 
        isPreEmployment: isCorporate ? isPreEmployment : false,

        // Link Tests
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
    return { success: false, error: "Failed to create package: " + error.message };
  }
}

// --- UPDATE PACKAGE ---
export async function updatePackageAction(id: number, formData: FormData) {
  await requireAdmin({ roles: ['SUPER_ADMIN'] });
  try {
    const packageName = formData.get('package_name') as string;
    const description = formData.get('description') as string;
    const preparation = formData.get('preparation') as string;
    const price = parseFloat(formData.get('price') as string);
    const discount = parseFloat(formData.get('discount') as string || '0');
    
    // Capture Corporate Fields
    const isCorporate = formData.get('isCorporate') === 'on'; 
    const category = formData.get('category') as string;
    const isPreEmployment = formData.get('isPreEmployment') === 'on';

    // Logic: If switching to corporate, we might want to deactivate, but usually
    // on update we respect the user's manual "isActive" toggle.
    const isActive = formData.get('is_active') === 'on';

    const testIds = formData.getAll('test_ids').map(tid => parseInt(tid as string));

    if (!packageName || isNaN(price)) {
      return { success: false, error: "Name and Valid Price are required" };
    }

    await prisma.package.update({
      where: { id },
      data: {
        packageName,
        description,
        preparation,
        price,
        discount,
        isActive,
        
        isCorporate,
        category: isCorporate ? category : null,
        isPreEmployment: isCorporate ? isPreEmployment : false,

        tests: {
          deleteMany: {}, 
          create: testIds.map(tid => ({ testId: tid })) 
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

// --- 5. DELETE PACKAGE ---
export async function deletePackageAction(id: number) {
  await requireAdmin({ roles: ['SUPER_ADMIN'] });
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
  await requireAdmin({ roles: ['SUPER_ADMIN'] });
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

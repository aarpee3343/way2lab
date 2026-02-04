'use server';

import { requireAdmin } from '@/lib/admin-auth';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

// ==========================================
// 1. TESTS MANAGEMENT
// ==========================================

// ==========================================
// 3. BULK UPLOAD TESTS (CLEAN VERSION)
// ==========================================

export async function bulkCreateTestsAction(testsData: any[]) {
  await requireAdmin({ roles: ['SUPER_ADMIN'] });
  try {
    const toNumber = (value: unknown, fallback = 0) => {
      const raw = typeof value === 'string' ? value.replace(/,/g, '').trim() : value;
      const num = typeof raw === 'number' ? raw : parseFloat(String(raw ?? ''));
      return Number.isFinite(num) ? num : fallback;
    };

    const cleanOptional = (value: unknown) => {
      if (value === null || value === undefined) return null;
      const cleaned = String(value).replace(/\r?\n/g, ' ').trim();
      return cleaned.length > 0 ? cleaned : null;
    };

    const cleanRequired = (value: unknown) => {
      const cleaned = cleanOptional(value);
      return cleaned ?? '';
    };

    const formattedTests = testsData
      .map((t) => {
      // 1. Auto-generate Slug if missing (Clean & Readable)
      const testName = cleanRequired(t.testName);
      if (!testName) return null;
      const baseSlug = cleanOptional(t.slug) || testName;
      const slug = baseSlug
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');

      // 2. Direct Mapping (Types Converted)
      return {
        testName,
        slug: slug,
        category: cleanOptional(t.category),
        specialty: cleanOptional(t.specialty),
        description: cleanOptional(t.description),
        scheduleReporting: cleanOptional(t.scheduleReporting),
        preparation: cleanOptional(t.preparation),
        specialInstruction: cleanOptional(t.specialInstruction),
        
        // Type Conversions (CSV strings -> Prisma types)
        price: toNumber(t.price, 0),
        discount: toNumber(t.discount, 0),
        isActive: t.isActive == '1' || t.isActive === 'true' || t.isActive === true,
        showOnHomepage: t.showOnHomepage == '1' || t.showOnHomepage === 'true' || t.showOnHomepage === true,
      };
    })
    .filter((t): t is NonNullable<typeof t> => Boolean(t));

    // 3. Bulk Insert
    const result = await prisma.test.createMany({
      data: formattedTests,
      skipDuplicates: true, 
    });

    revalidatePath('/admin/tests');
    return { success: true, count: result.count };
  } catch (e: any) {
    console.error('Bulk Upload Error:', e);
    return { success: false, error: 'Failed to process CSV data. Check headers.' };
  }
}

export async function getTestStats() {
  await requireAdmin({ roles: ['SUPER_ADMIN'] });
  const [total, active, categories, specialties] = await Promise.all([
    prisma.test.count(),
    prisma.test.count({ where: { isActive: true } }),
    prisma.test.groupBy({ by: ['category'], _count: true }),
    prisma.test.groupBy({ by: ['specialty'], _count: true }),
  ]);
  
  return { total, active, categories: categories.length, specialties: specialties.length };
}

export async function getTests(search?: string) {
  await requireAdmin({ roles: ['SUPER_ADMIN'] });
  const query = (search || '').trim();
  return await prisma.test.findMany({
    where: query
      ? {
          OR: [
            { testName: { contains: query, mode: 'insensitive' } },
            { category: { contains: query, mode: 'insensitive' } },
            { specialty: { contains: query, mode: 'insensitive' } }
          ]
        }
      : undefined,
    orderBy: { id: 'desc' }
  });
}

export async function createTestAction(formData: FormData) {
  await requireAdmin({ roles: ['SUPER_ADMIN'] });
  const name = formData.get('test_name') as string;
  const price = parseFloat(formData.get('price') as string);
  const discount = parseFloat((formData.get('discount') as string) || '0');

  // Auto-generate slug if empty
  let slug = formData.get('slug') as string;
  if (!slug) {
    slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  }

  try {
    await prisma.test.create({
      data: {
        testName: name,
        slug,
        category: formData.get('category') as string,
        specialty: formData.get('specialty') as string,
        description: formData.get('description') as string,
        preparation: formData.get('preparation') as string,
        specialInstruction: formData.get('special_instruction') as string,
        scheduleReporting: formData.get('schedule_reporting') as string, // ✅ schema-aligned
        price,
        discount,
        showOnHomepage: formData.get('show_on_homepage') === 'on',
        isActive: formData.get('is_active') === 'on',
      }
    });

    // Optional but safe to keep
    revalidatePath('/admin/tests');

    // ✅ Let the caller handle redirect / toast
    return { success: true };
  } catch (e: any) {
    console.error('Create Test Error:', e);
    return { success: false, error: e.message };
  }
}


// ==========================================
// 2. PACKAGES MANAGEMENT
// ==========================================

export async function getPackageStats() {
  await requireAdmin({ roles: ['SUPER_ADMIN'] });
  const [total, active] = await Promise.all([
    prisma.package.count(),
    prisma.package.count({ where: { isActive: true } })
  ]);
  // Note: Complex relation counts (tests included) usually handled better in raw SQL or separate queries if performance hits
  return { total, active };
}

export async function getPackages(search?: string) {
  await requireAdmin({ roles: ['SUPER_ADMIN'] });
  const query = (search || '').trim();
  return await prisma.package.findMany({
    where: query
      ? {
          OR: [
            { packageName: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } }
          ]
        }
      : undefined,
    orderBy: { id: 'desc' },
    include: { _count: { select: { tests: true } } } // Count included tests
  });
}

// Get Data for "Add Package" form (Available Tests & Packages)
export async function getPackageFormData() {
  await requireAdmin({ roles: ['SUPER_ADMIN'] });
  const [tests, packages] = await Promise.all([
    prisma.test.findMany({ where: { isActive: true }, select: { id: true, testName: true, price: true } }),
    prisma.package.findMany({ where: { isActive: true }, select: { id: true, packageName: true, price: true } })
  ]);
  return { tests, packages };
}

export async function getTestById(id: number) {
  await requireAdmin({ roles: ['SUPER_ADMIN'] });
  const test = await prisma.test.findUnique({ where: { id } });
  
  if (!test) return null;

  return {
    ...test,
    price: Number(test.price),       // ✅ Convert Decimal
    discount: Number(test.discount)  // ✅ Convert Decimal
  };
}

// Update Test
export async function updateTestAction(id: number, data: any) {
  await requireAdmin({ roles: ['SUPER_ADMIN'] });
  try {
    const baseSlug = String(data.slug || '').trim();
    const slug = baseSlug
      ? baseSlug
      : String(data.testName || '')
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)+/g, '');

    await prisma.test.update({
      where: { id },
      data: {
        testName: data.testName,
        slug: slug || null,
        category: data.category,
        specialty: data.specialty,
        description: data.description,
        preparation: data.preparation,
        specialInstruction: data.specialInstruction,
        scheduleReporting: data.scheduleReporting,
        price: data.price,
        discount: data.discount,
        showOnHomepage: Boolean(data.showOnHomepage),
        isActive: Boolean(data.isActive)
      }
    });
    return { success: true };
  } catch (e) {
    return { success: false, error: 'Failed to update' };
  }
}

// Delete Test
export async function deleteTestAction(id: number) {
  await requireAdmin({ roles: ['SUPER_ADMIN'] });
  try {
    await prisma.test.delete({ where: { id } });
    return { success: true };
  } catch (e) {
    return { success: false, error: 'Failed to delete' };
  }
}

export async function createPackageAction(data: any) {
  await requireAdmin({ roles: ['SUPER_ADMIN'] });
  try {
    await prisma.package.create({
      data: {
        packageName: data.packageName,
        description: data.description,
        price: parseFloat(data.price),
        discount: parseFloat(data.discount),
        isActive: data.isActive,
        // Relations
        tests: {
          create: data.testIds.map((tid: number) => ({ testId: tid }))
        },
        relatedPackages: {
          create: data.relatedIds.map((pid: number) => ({ relatedPackageId: pid }))
        }
      }
    });
    return { success: true };
  } catch (e) {
    console.error(e);
    return { success: false, error: 'Failed to create package' };
  }
}

'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

// ==========================================
// 1. TESTS MANAGEMENT
// ==========================================

export async function getTestStats() {
  const [total, active, categories, specialties] = await Promise.all([
    prisma.test.count(),
    prisma.test.count({ where: { isActive: true } }),
    prisma.test.groupBy({ by: ['category'], _count: true }),
    prisma.test.groupBy({ by: ['specialty'], _count: true }),
  ]);
  
  return { total, active, categories: categories.length, specialties: specialties.length };
}

export async function getTests() {
  return await prisma.test.findMany({ orderBy: { id: 'desc' } });
}

export async function createTestAction(formData: FormData) {
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
  const [total, active] = await Promise.all([
    prisma.package.count(),
    prisma.package.count({ where: { isActive: true } })
  ]);
  // Note: Complex relation counts (tests included) usually handled better in raw SQL or separate queries if performance hits
  return { total, active };
}

export async function getPackages() {
  return await prisma.package.findMany({
    orderBy: { id: 'desc' },
    include: { _count: { select: { tests: true } } } // Count included tests
  });
}

// Get Data for "Add Package" form (Available Tests & Packages)
export async function getPackageFormData() {
  const [tests, packages] = await Promise.all([
    prisma.test.findMany({ where: { isActive: true }, select: { id: true, testName: true, price: true } }),
    prisma.package.findMany({ where: { isActive: true }, select: { id: true, packageName: true, price: true } })
  ]);
  return { tests, packages };
}

export async function getTestById(id: number) {
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
  try {
    await prisma.test.update({
      where: { id },
      data: {
        testName: data.testName,
        category: data.category,
        specialty: data.specialty,
        description: data.description,
        price: data.price,
        discount: data.discount,
        isActive: data.isActive
      }
    });
    return { success: true };
  } catch (e) {
    return { success: false, error: 'Failed to update' };
  }
}

// Delete Test
export async function deleteTestAction(id: number) {
  try {
    await prisma.test.delete({ where: { id } });
    return { success: true };
  } catch (e) {
    return { success: false, error: 'Failed to delete' };
  }
}

export async function createPackageAction(data: any) {
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
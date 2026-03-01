'use server';

import { requireAdmin } from '@/lib/admin-auth';
import prisma from '@/lib/db';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { ensureCustomerUHID, generateOrderNumber, generateCustomerUHID } from '@/lib/utils/generators';
import { OrderStatus, Prisma } from '@prisma/client';

type OnsiteField = {
  label: string;
  type: 'text' | 'number' | 'date' | 'select';
  required?: boolean;
  options?: string[];
};

const cleanFields = (fields: OnsiteField[]) =>
  (fields || [])
    .map((f) => ({
      label: String(f.label || '').trim(),
      type: (f.type || 'text') as OnsiteField['type'],
      required: Boolean(f.required),
      options: Array.isArray(f.options)
        ? f.options.map((o) => String(o || '').trim()).filter(Boolean)
        : []
    }))
    .filter((f) => f.label);

export async function getOnsiteCorporates() {
  await requireAdmin({ roles: ['SUPER_ADMIN'] });
  return prisma.corporate.findMany({
    where: { isActive: true },
    orderBy: { companyName: 'asc' },
    select: {
      id: true,
      companyName: true,
      contactPerson: true
    }
  });
}

export async function getOnsiteCorporatePackages(corporateId: number) {
  await requireAdmin({ roles: ['SUPER_ADMIN'] });
  if (!corporateId) return [];

  const services = await prisma.corporateService.findMany({
    where: { corporateId, isActive: true, packageId: { not: null } },
    include: {
      package: {
        select: {
          id: true,
          packageName: true,
          price: true,
          discount: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return services.map((s) => ({
    ...s,
    package: s.package
      ? {
          ...s.package,
          price: Number(s.package.price || 0),
          discount: s.package.discount !== null ? Number(s.package.discount) : null
        }
      : null
  }));
}

export async function searchOnsiteEmployees(corporateId: number, search?: string) {
  await requireAdmin({ roles: ['SUPER_ADMIN'] });
  if (!corporateId) return [];

  const trimmed = String(search || '').trim();
  const where: any = { corporateId, isActive: true };
  if (trimmed) {
    where.OR = [
      { name: { contains: trimmed, mode: 'insensitive' } },
      { email: { contains: trimmed, mode: 'insensitive' } },
      { phone: { contains: trimmed, mode: 'insensitive' } },
      { employeeId: { contains: trimmed, mode: 'insensitive' } }
    ];
  }

  return prisma.customer.findMany({
    where,
    take: 50,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      employeeId: true,
      isActive: true
    }
  });
}

export async function createOnsiteEmployee(data: {
  corporateId: number;
  name: string;
  phone?: string;
  email?: string;
  employeeId?: string;
  dateOfBirth?: string;
  gender?: string;
}) {
  await requireAdmin({ roles: ['SUPER_ADMIN'] });

  const corporateId = Number(data.corporateId);
  if (!corporateId) return { success: false, error: 'Invalid corporate' };

  const name = String(data.name || '').trim();
  const phone = String(data.phone || '').trim();
  const email = String(data.email || '').trim();
  const employeeId = String(data.employeeId || '').trim();
  const dateOfBirth = String(data.dateOfBirth || '').trim();
  const gender = String(data.gender || '').trim();

  if (!name) return { success: false, error: 'Name is required' };
  if (!phone && !email) return { success: false, error: 'Phone or email is required' };

  let parsedDob: Date | null = null;
  if (dateOfBirth) {
    const candidate = new Date(dateOfBirth);
    if (Number.isNaN(candidate.getTime())) {
      return { success: false, error: 'Invalid date of birth' };
    }
    parsedDob = candidate;
  }

  const existing = await prisma.customer.findFirst({
    where: {
      OR: [
        phone ? { phone } : undefined,
        email ? { email } : undefined
      ].filter(Boolean) as any
    },
    select: {
      id: true,
      name: true,
      employeeId: true,
      dateOfBirth: true,
      gender: true,
      uhid: true,
    }
  });

  if (existing) {
    const updateData: Prisma.CustomerUncheckedUpdateInput = {
      corporateId,
      name: existing.name || name,
      employeeId: employeeId || existing.employeeId || null,
      isActive: true
    };
    if (parsedDob) updateData.dateOfBirth = parsedDob;
    if (gender) updateData.gender = gender;
    if (!existing.uhid) {
      updateData.uhid = await generateCustomerUHID({ scheme: 'ONSITE_CORPORATE' });
    }

    const updated = await prisma.customer.update({
      where: { id: existing.id },
      data: updateData
    });
    return { success: true, customer: updated };
  }

  const uhid = await generateCustomerUHID({ scheme: 'ONSITE_CORPORATE' });
  const passwordSeed = `${crypto.randomBytes(8).toString('hex')}${Date.now()}`;
  const hashedPassword = await bcrypt.hash(passwordSeed, 10);

  const loginMethod = email ? 'email' : 'phone';
  const customer = await prisma.customer.create({
    data: {
      name,
      phone: phone || null,
      email: email || null,
      employeeId: employeeId || null,
      dateOfBirth: parsedDob,
      gender: gender || null,
      corporateId,
      uhid,
      password: hashedPassword,
      isActive: true,
      loginMethod
    }
  });

  return { success: true, customer };
}

export async function getActiveOnsiteTemplate(packageId: number) {
  await requireAdmin({ roles: ['SUPER_ADMIN'] });
  if (!packageId) return null;
  return prisma.onsiteTemplate.findFirst({
    where: { packageId, isActive: true },
    orderBy: { createdAt: 'desc' }
  });
}

export async function saveOnsiteTemplate(data: {
  packageId: number;
  title: string;
  fields: OnsiteField[];
}) {
  await requireAdmin({ roles: ['SUPER_ADMIN'] });
  const packageId = Number(data.packageId);
  if (!packageId) return { success: false, error: 'Select a package' };
  const title = String(data.title || '').trim();
  if (!title) return { success: false, error: 'Title is required' };

  const fields = cleanFields(data.fields || []);
  if (!fields.length) return { success: false, error: 'Add at least one field' };

  await prisma.$transaction(async (tx) => {
    await tx.onsiteTemplate.updateMany({
      where: { packageId, isActive: true },
      data: { isActive: false }
    });
    await tx.onsiteTemplate.create({
      data: {
        packageId,
        title,
        fields
      }
    });
  });

  return { success: true };
}

export async function createOnsiteCamp(data: {
  corporateId: number;
  title: string;
  expectedHeadcount?: number;
  labName?: string;
}) {
  const admin = await requireAdmin({ roles: ['SUPER_ADMIN'] });
  const corporateId = Number(data.corporateId);
  if (!corporateId) return { success: false, error: 'Select a corporate' };

  const title = String(data.title || '').trim();
  if (!title) return { success: false, error: 'Camp title is required' };
  const labName = String(data.labName || '').trim();

  const expectedHeadcount = Number.isFinite(Number(data.expectedHeadcount))
    ? Number(data.expectedHeadcount)
    : null;

  const camp = await prisma.onsiteCamp.create({
    data: {
      corporateId,
      title,
      labName: labName || null,
      expectedHeadcount,
      status: 'ACTIVE',
      startedAt: new Date(),
      createdByAdminId: admin.id
    }
  });

  revalidatePath('/admin/onsite');
  return { success: true, camp };
}

export async function completeOnsiteCamp(campId: number) {
  await requireAdmin({ roles: ['SUPER_ADMIN'] });
  if (!campId) return { success: false, error: 'Invalid camp' };

  await prisma.onsiteCamp.update({
    where: { id: campId },
    data: {
      status: 'COMPLETED',
      endedAt: new Date()
    }
  });

  revalidatePath('/admin/onsite');
  return { success: true };
}

export async function getOnsiteCamps(corporateId?: number) {
  await requireAdmin({ roles: ['SUPER_ADMIN'] });
  const where = corporateId ? { corporateId } : {};

  const camps = await prisma.onsiteCamp.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      corporate: { select: { companyName: true } },
      _count: { select: { entries: true } }
    }
  });

  return camps.map((camp) => ({
    ...camp,
    createdAt: camp.createdAt.toISOString(),
    startedAt: camp.startedAt ? camp.startedAt.toISOString() : null,
    endedAt: camp.endedAt ? camp.endedAt.toISOString() : null
  }));
}

export async function getOnsiteEntries(campId: number) {
  await requireAdmin({ roles: ['SUPER_ADMIN'] });
  if (!campId) return [];

  const entries = await prisma.onsiteEntry.findMany({
    where: { campId },
    orderBy: { createdAt: 'desc' },
    include: {
      customer: { select: { id: true, name: true, phone: true, email: true } },
      package: { select: { id: true, packageName: true } },
      order: { select: { id: true, orderNumber: true } },
      template: { select: { id: true, title: true } }
    }
  });

  return entries.map((e) => ({
    ...e,
    createdAt: e.createdAt.toISOString()
  }));
}

export async function createOnsiteBooking(data: {
  campId: number;
  corporateId: number;
  packageId: number;
  customerId: number;
  labName?: string;
  templateId?: number | null;
  templateData?: Record<string, any> | null;
}) {
  const admin = await requireAdmin({ roles: ['SUPER_ADMIN'] });
  const campId = Number(data.campId);
  const corporateId = Number(data.corporateId);
  const packageId = Number(data.packageId);
  const customerId = Number(data.customerId);
  const labName = String(data.labName || '').trim();

  if (!campId || !corporateId || !packageId || !customerId) {
    return { success: false, error: 'Missing booking details' };
  }

  const [camp, corpService, pkg, customer] = await Promise.all([
    prisma.onsiteCamp.findUnique({
      where: { id: campId },
      select: { id: true, corporateId: true, labName: true }
    }),
    prisma.corporateService.findFirst({
      where: {
        corporateId,
        packageId,
        isActive: true,
        validFrom: { lte: new Date() },
        validTill: { gte: new Date() }
      },
      select: {
        selfPaymentType: true,
        selfUsageLimit: true
      }
    }),
    prisma.package.findUnique({
      where: { id: packageId },
      select: { price: true, discount: true, packageName: true }
    }),
    prisma.customer.findUnique({
      where: { id: customerId },
      select: { name: true, phone: true, dateOfBirth: true, gender: true }
    })
  ]);

  if (!camp || camp.corporateId !== corporateId) {
    return { success: false, error: 'Invalid camp for this corporate' };
  }

  const resolvedLabName = labName || camp.labName || '';
  if (!resolvedLabName) return { success: false, error: 'Lab name is required' };

  if (!corpService || !pkg || !customer) {
    return { success: false, error: 'Package is not active for this corporate' };
  }

  const assignmentCount = await prisma.employeePackage.count({
    where: { packageId, customer: { corporateId } }
  });

  if (assignmentCount > 0) {
    const assigned = await prisma.employeePackage.findFirst({
      where: { packageId, customerId }
    });
    if (!assigned) {
      await prisma.employeePackage.create({
        data: { customerId, packageId, paidBy: corpService.selfPaymentType }
      });
    }
  }

  const usageLimit = Number(corpService.selfUsageLimit || 0);
  if (usageLimit > 0) {
    const usedCount = await prisma.order.count({
      where: {
        userId: customerId,
        packageId,
        patientType: 'self',
        status: { notIn: [OrderStatus.CANCELLED, OrderStatus.REJECTED] }
      }
    });
    if (usedCount >= usageLimit) {
      return { success: false, error: 'Usage limit reached for this employee' };
    }
  }

  const mrp = Number(pkg.price || 0);
  const discount = Number(pkg.discount || 0);
  const sellingPrice = mrp - (mrp * (discount / 100));
  const corporatePays = corpService.selfPaymentType === 'CORPORATE_PAYS';

  const subtotal = sellingPrice;
  const discountAmount = mrp - sellingPrice;
  const finalAmount = corporatePays ? 0 : sellingPrice;

  const order = await prisma.$transaction(async (tx) => {
    const orderNumber = await generateOrderNumber({ category: 'ONSITE', tx });
    const patientUHID = await ensureCustomerUHID(customerId, 'ONSITE_CORPORATE', tx);

    if (!camp.labName && resolvedLabName) {
      await tx.onsiteCamp.update({
        where: { id: campId },
        data: { labName: resolvedLabName }
      });
    }

    const createdOrder = await tx.order.create({
      data: {
        orderNumber,
        userId: customerId,
        packageId,
        patientName: customer.name || 'Employee',
        patientPhone: customer.phone || null,
        patientDob: customer.dateOfBirth || null,
        patientGender: customer.gender || null,
        patientUHID,
        patientType: 'self',
        patientRelation: 'Self',
        totalAmount: subtotal,
        discountAmount,
        homeCollectionCharges: 0,
        finalAmount,
        paymentMode: corporatePays ? 'Corporate Credit' : 'Pay Upon Service',
        paymentStatus: corporatePays ? 'CORPORATE_BILLING' : 'PENDING',
        status: 'PENDING',
        bookingSource: 'Admin',
        collectionType: 'onsite',
        preferredDate: new Date(),
        preferredTimeSlot: 'Onsite',
        onsiteLabName: resolvedLabName,
        items: {
          create: [
            {
              itemType: 'package',
              itemName: pkg.packageName || 'Onsite Package',
              basePrice: mrp,
              price: corporatePays ? 0 : sellingPrice,
              discount,
              packageId
            }
          ]
        }
      }
    });

    const entry = await tx.onsiteEntry.create({
      data: {
        campId,
        customerId,
        packageId,
        orderId: createdOrder.id,
        templateId: data.templateId || null,
        data: (data.templateData ?? undefined) as Prisma.InputJsonValue | undefined,
        createdByAdminId: admin.id
      }
    });

    return { createdOrder, entry };
  });

  revalidatePath('/admin/onsite');

  return {
    success: true,
    orderId: order.createdOrder.id,
    entryId: order.entry.id
  };
}

export async function updateOnsiteEntryData(entryId: number, data: Record<string, any>) {
  await requireAdmin({ roles: ['SUPER_ADMIN'] });
  if (!entryId) return { success: false, error: 'Invalid entry' };

  await prisma.onsiteEntry.update({
    where: { id: entryId },
    data: { data: data as Prisma.InputJsonValue }
  });

  revalidatePath('/admin/onsite');
  return { success: true };
}

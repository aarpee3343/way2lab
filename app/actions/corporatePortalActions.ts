'use server';

import { prisma } from '@/lib/db';
import { getCorpUser } from '@/lib/auth-corp';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';
import { encryptBuffer } from '@/lib/crypto';
import { uploadEncryptedFile } from '@/lib/gcs';

type CorpSession = {
  userId: number;
  corporateId: number;
  email?: string;
  role?: string;
  canEdit?: boolean;
  accessDept?: string | null;
  accessLocation?: string | null;
  maskContactInfo?: boolean;
};

const ATTACHMENT_PREFIX = '__ATTACHMENT__::';

const getSession = async (): Promise<CorpSession | null> => {
  const session = await getCorpUser();
  if (!session?.corporateId) return null;
  return session as CorpSession;
};

const buildEmployeeWhere = (session: CorpSession) => {
  const where: any = { corporateId: session.corporateId };
  if (session.accessDept) where.department = session.accessDept;
  if (session.accessLocation) where.location = session.accessLocation;
  return where;
};

const canEdit = (session: CorpSession | null) =>
  Boolean(session && (session.role === 'SUPER_ADMIN' || session.canEdit));

type ReportVisibility = 'USER_ONLY' | 'CORPORATE_ONLY' | 'BOTH';

const resolveReportVisibility = (service: {
  reportVisibilityOverride?: ReportVisibility | null;
  package?: { isPreEmployment?: boolean | null; reportVisibility?: ReportVisibility | null } | null;
}): ReportVisibility => {
  if (service.package?.isPreEmployment) return 'CORPORATE_ONLY';
  if (service.reportVisibilityOverride) return service.reportVisibilityOverride;
  if (service.package?.reportVisibility) return service.package.reportVisibility;
  return 'USER_ONLY';
};

const buildCorporateReportVisibilityFilter = (
  services: any[],
  options?: { includePreEmployment?: boolean; excludePreEmploymentPackages?: boolean }
) => {
  const corporatePackageIds: number[] = [];
  const corporateCouponIds: number[] = [];
  const sharedPackageIds: number[] = [];
  const sharedCouponIds: number[] = [];

  services.forEach((s) => {
    if (options?.excludePreEmploymentPackages && s.package?.isPreEmployment) return;
    const policy = resolveReportVisibility(s);
    if (policy === 'CORPORATE_ONLY' || policy === 'BOTH') {
      if (s.packageId) corporatePackageIds.push(s.packageId);
      if (s.couponId) corporateCouponIds.push(s.couponId);
    } else {
      if (s.packageId) sharedPackageIds.push(s.packageId);
      if (s.couponId) sharedCouponIds.push(s.couponId);
    }
  });

  const orConditions: any[] = [];
  if (options?.includePreEmployment !== false) {
    orConditions.push({ package: { isPreEmployment: true } });
  }

  if (corporatePackageIds.length) {
    orConditions.push({ packageId: { in: corporatePackageIds } });
  }
  if (corporateCouponIds.length) {
    orConditions.push({ couponId: { in: corporateCouponIds } });
  }

  const sharedOr: any[] = [];
  if (sharedPackageIds.length) sharedOr.push({ packageId: { in: sharedPackageIds } });
  if (sharedCouponIds.length) sharedOr.push({ couponId: { in: sharedCouponIds } });
  if (sharedOr.length) {
    orConditions.push({ isReportSharedWithCorp: true, OR: sharedOr });
  }

  if (orConditions.length === 0) {
    // Avoid invalid OR: [] filters
    return { id: -1 };
  }

  return { OR: orConditions };
};

const logActivity = async (
  corporateId: number,
  performedBy: string,
  action: string,
  details: string
) => {
  try {
    await prisma.corporateActivity.create({
      data: { corporateId, performedBy, action, details }
    });
  } catch (e) {
    console.error('Corporate activity log failed', e);
  }
};

const getActorName = async (session: CorpSession) => {
  const user = await prisma.corporateUser.findUnique({
    where: { id: session.userId },
    select: { name: true, email: true }
  });
  return user?.name || user?.email || session.email || 'Corporate User';
};

export async function getCorporateProfile() {
  const session = await getSession();
  if (!session) return null;

  const [corp, user] = await Promise.all([
    prisma.corporate.findUnique({
      where: { id: session.corporateId },
      select: {
        id: true,
        companyName: true,
        contactPerson: true,
        email: true,
        phone: true,
        address: true,
        city: true,
        state: true,
        pincode: true,
        logoUrl: true,
        domains: true,
        isActive: true
      }
    }),
    prisma.corporateUser.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        canEdit: true,
        maskContactInfo: true,
        accessDept: true,
        accessLocation: true,
        isActive: true
      }
    })
  ]);

  if (!corp) return null;

  return { corp, user };
}

export async function updateCorporateProfile(data: {
  companyName: string;
  contactPerson: string;
  phone: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  logoUrl?: string;
}) {
  const session = await getSession();
  if (!session) return { success: false, error: 'Unauthorized' };
  if (!canEdit(session)) return { success: false, error: 'Insufficient permissions' };

  try {
    await prisma.corporate.update({
      where: { id: session.corporateId },
      data: {
        companyName: data.companyName,
        contactPerson: data.contactPerson,
        phone: data.phone,
        address: data.address || null,
        city: data.city || null,
        state: data.state || null,
        pincode: data.pincode || null,
        logoUrl: data.logoUrl || null
      }
    });

    const actor = await getActorName(session);
    await logActivity(session.corporateId, actor, 'PROFILE_UPDATED', 'Updated corporate profile');

    revalidatePath('/corp-settings');
    revalidatePath('/corp');
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message || 'Update failed' };
  }
}

export async function getCorporateOverview(filter?: {
  department?: string;
  location?: string;
}) {
  const session = await getSession();
  if (!session) return null;

  const corp = await prisma.corporate.findUnique({
    where: { id: session.corporateId },
    select: {
      id: true,
      companyName: true,
      isActive: true
    }
  });

  if (!corp) return null;

  const baseEmployeeWhere = buildEmployeeWhere(session);
  const employeeWhere: any = { ...baseEmployeeWhere };
  if (filter?.department) employeeWhere.department = filter.department;
  if (filter?.location) employeeWhere.location = filter.location;
  const orderBaseWhere = { customer: employeeWhere };

  const [
    totalEmployees,
    activeEmployees,
    totalOrders,
    completedOrders,
    pendingOrders,
    servicesForDisplay,
    servicesForVisibility,
    departmentRows,
    locationRows,
    activeCamp
  ] = await Promise.all([
    prisma.customer.count({ where: employeeWhere }),
    prisma.customer.count({ where: { ...employeeWhere, isActive: true } }),
    prisma.order.count({ where: orderBaseWhere }),
    prisma.order.count({ where: { ...orderBaseWhere, status: 'COMPLETED' } }),
    prisma.order.count({
      where: {
        ...orderBaseWhere,
        status: { in: ['PENDING', 'ACCEPTED', 'PROCESSING', 'PARTIAL_COMPLETED'] }
      }
    }),
    prisma.corporateService.findMany({
      where: { corporateId: session.corporateId, isActive: true },
      include: {
        package: {
          select: {
            id: true,
            packageName: true,
            price: true,
            isPreEmployment: true,
            reportVisibility: true
          }
        },
        coupon: { select: { id: true, code: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    }),
    prisma.corporateService.findMany({
      where: { corporateId: session.corporateId, isActive: true },
      select: {
        packageId: true,
        couponId: true,
        reportVisibilityOverride: true,
        package: { select: { isPreEmployment: true, reportVisibility: true } }
      }
    }),
    prisma.customer.findMany({
      where: baseEmployeeWhere,
      distinct: ['department'],
      select: { department: true }
    }),
    prisma.customer.findMany({
      where: baseEmployeeWhere,
      distinct: ['location'],
      select: { location: true }
    }),
    prisma.onsiteCamp.findFirst({
      where: { corporateId: session.corporateId, status: 'ACTIVE' },
      orderBy: { startedAt: 'desc' },
      select: {
        id: true,
        title: true,
        expectedHeadcount: true,
        startedAt: true,
        labName: true,
        _count: { select: { entries: true } }
      }
    })
  ]);

  const departments = departmentRows
    .map((row) => row.department)
    .filter((dept): dept is string => Boolean(dept))
    .sort();
  const locations = locationRows
    .map((row) => row.location)
    .filter((loc): loc is string => Boolean(loc))
    .sort();

  const serviceStats = await Promise.all(
    servicesForDisplay.map(async (s) => {
      const usageWhere: any = {
        ...orderBaseWhere,
        status: { notIn: ['CANCELLED', 'REJECTED'] },
        ...(s.packageId ? { packageId: s.packageId } : {}),
        ...(s.couponId ? { couponId: s.couponId } : {})
      };

      const [usedCount, availedEmployeeRows, recentOrders] = await Promise.all([
        prisma.order.count({ where: usageWhere }),
        prisma.order.findMany({
          where: usageWhere,
          distinct: ['userId'],
          select: { userId: true }
        }),
        prisma.order.findMany({
          where: usageWhere,
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            id: true,
            orderNumber: true,
            createdAt: true,
            customer: { select: { id: true, name: true, employeeId: true } }
          }
        })
      ]);

      const availedEmployees = availedEmployeeRows.length;
      const seen = new Set<number>();
      const availedBy = recentOrders
        .map((o) => o.customer)
        .filter((c): c is { id: number; name: string | null; employeeId: string | null } => Boolean(c))
        .filter((c) => {
          if (seen.has(c.id)) return false;
          seen.add(c.id);
          return true;
        })
        .map((c) => ({
          id: c.id,
          name: c.name || 'Employee',
          employeeId: c.employeeId || null
        }));

      const limitPerEmployee = Number(s.selfUsageLimit || 0);
      const totalQuota = limitPerEmployee > 0 ? totalEmployees * limitPerEmployee : null;
      const remaining = totalQuota !== null ? Math.max(totalQuota - usedCount, 0) : null;

      return {
        id: s.id,
        name: s.package?.packageName || `Coupon: ${s.coupon?.code}`,
        eligibility: totalEmployees,
        availed: usedCount,
        availedEmployees,
        remaining,
        limitPerEmployee,
        availedBy,
        validFrom: s.validFrom.toISOString(),
        validTill: s.validTill.toISOString()
      };
    })
  );

  const visibilityFilter = buildCorporateReportVisibilityFilter(servicesForVisibility);
  const visibleOrderWhere: any = {
    ...orderBaseWhere,
    ...visibilityFilter
  };

  const reportsReady = await prisma.orderReport.count({
    where: {
      order: { ...visibleOrderWhere, status: 'COMPLETED' }
    }
  });

  const recentReports = await prisma.orderReport.findMany({
    where: {
      order: { ...visibleOrderWhere, status: 'COMPLETED' }
    },
    orderBy: { createdAt: 'desc' },
    take: 3,
    select: {
      id: true,
      reportType: true,
      createdAt: true,
      order: {
        select: {
          id: true,
          orderNumber: true,
          patientName: true,
          customer: { select: { employeeId: true, name: true } },
          package: { select: { isPreEmployment: true } },
          isReportSharedWithCorp: true
        }
      }
    }
  });

  const onsiteExpected = activeCamp?.expectedHeadcount ?? null;
  const onsiteReached = activeCamp?._count?.entries ?? 0;
  const onsiteRemaining =
    onsiteExpected !== null ? Math.max(onsiteExpected - onsiteReached, 0) : null;
  const onsiteProgress =
    onsiteExpected && onsiteExpected > 0
      ? Math.min(100, Math.round((onsiteReached / onsiteExpected) * 100))
      : null;

  return {
    corp,
    user: {
      role: session.role || 'CORPORATE',
      canEdit: canEdit(session),
      maskContactInfo: Boolean(session.maskContactInfo),
    },
    filters: {
      departments,
      locations
    },
    stats: {
      totalEmployees,
      activeEmployees,
      totalOrders,
      completedOrders,
      pendingOrders,
      reportsReady
    },
    onsite: activeCamp
      ? {
          campId: activeCamp.id,
          title: activeCamp.title,
          labName: activeCamp.labName,
          startedAt: activeCamp.startedAt ? activeCamp.startedAt.toISOString() : null,
          expectedHeadcount: onsiteExpected,
          reached: onsiteReached,
          remaining: onsiteRemaining,
          progress: onsiteProgress
        }
      : null,
    services: serviceStats,
    recentReports: recentReports.map(r => ({
      id: r.id,
      reportType: r.reportType,
      createdAt: r.createdAt.toISOString(),
      patientName: r.order.patientName,
      employeeId: r.order.customer.employeeId || null,
      orderNumber: r.order.orderNumber || String(r.order.id),
      category: r.order.package?.isPreEmployment
        ? 'PRE_EMPLOYMENT'
        : (r.order.isReportSharedWithCorp ? 'SHARED_BY_EMPLOYEE' : 'ANNUAL_CHECKUP')
    }))
  };
}

export async function getCorporateOnsiteActivities() {
  const session = await getSession();
  if (!session) return null;

  const camps = await prisma.onsiteCamp.findMany({
    where: { corporateId: session.corporateId },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { entries: true } }
    }
  });

  const active = camps.filter((c) => c.status === 'ACTIVE');
  const completed = camps.filter((c) => c.status === 'COMPLETED');
  const planned = camps.filter((c) => c.status === 'PLANNED');

  return {
    active: active.map((c) => ({
      ...c,
      createdAt: c.createdAt.toISOString(),
      startedAt: c.startedAt ? c.startedAt.toISOString() : null,
      endedAt: c.endedAt ? c.endedAt.toISOString() : null
    })),
    completed: completed.map((c) => ({
      ...c,
      createdAt: c.createdAt.toISOString(),
      startedAt: c.startedAt ? c.startedAt.toISOString() : null,
      endedAt: c.endedAt ? c.endedAt.toISOString() : null
    })),
    planned: planned.map((c) => ({
      ...c,
      createdAt: c.createdAt.toISOString(),
      startedAt: c.startedAt ? c.startedAt.toISOString() : null,
      endedAt: c.endedAt ? c.endedAt.toISOString() : null
    }))
  };
}

export async function getCorporateEmployees(params?: {
  search?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'ALL';
  department?: string;
  location?: string;
}) {
  const session = await getSession();
  if (!session) return { employees: [], canEdit: false, maskContactInfo: true };

  const where: any = buildEmployeeWhere(session);

  if (params?.status && params.status !== 'ALL') {
    where.isActive = params.status === 'ACTIVE';
  }
  if (params?.department) where.department = params.department;
  if (params?.location) where.location = params.location;

  if (params?.search) {
    where.OR = [
      { name: { contains: params.search, mode: 'insensitive' } },
      { email: { contains: params.search, mode: 'insensitive' } },
      { phone: { contains: params.search, mode: 'insensitive' } },
      { employeeId: { contains: params.search, mode: 'insensitive' } }
    ];
  }

  const employees = await prisma.customer.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      employeeId: true,
      department: true,
      location: true,
      isActive: true
    }
  });

  return {
    employees,
    canEdit: canEdit(session),
    maskContactInfo: Boolean(session.maskContactInfo)
  };
}

export async function setCorporateEmployeeStatus(customerId: number, status: boolean) {
  const session = await getSession();
  if (!session) return { success: false, error: 'Unauthorized' };
  if (!canEdit(session)) return { success: false, error: 'Insufficient permissions' };

  const where: any = { id: customerId, corporateId: session.corporateId };
  if (session.accessDept) where.department = session.accessDept;
  if (session.accessLocation) where.location = session.accessLocation;

  const result = await prisma.customer.updateMany({
    where,
    data: { isActive: status }
  });

  if (result.count === 0) return { success: false, error: 'Employee not found' };

  const actor = await getActorName(session);
  await logActivity(
    session.corporateId,
    actor,
    status ? 'ACTIVATED_EMPLOYEE' : 'DEACTIVATED_EMPLOYEE',
    `Updated employee status for customer #${customerId}`
  );

  revalidatePath('/employees');
  revalidatePath('/corp-settings/logs');
  return { success: true };
}

export async function uploadEmployeesForCorp(corporateId: number, employees: any[]) {
  const session = await getSession();
  if (!session) return { success: false, error: 'Unauthorized' };
  if (!canEdit(session)) return { success: false, error: 'Insufficient permissions' };
  if (session.corporateId !== corporateId) return { success: false, error: 'Forbidden' };

  try {
    const normalizeText = (value: any) => {
      if (value === null || value === undefined) return undefined;
      const trimmed = String(value).trim();
      return trimmed ? trimmed : undefined;
    };

    const parseDateOfBirth = (value: any) => {
      if (!value) return null;
      if (value instanceof Date) {
        return Number.isNaN(value.getTime()) ? null : value;
      }
      const raw = String(value).trim();
      if (!raw) return null;

      const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (isoMatch) {
        const year = Number(isoMatch[1]);
        const month = Number(isoMatch[2]);
        const day = Number(isoMatch[3]);
        const candidate = new Date(year, month - 1, day);
        if (
          candidate.getFullYear() === year &&
          candidate.getMonth() === month - 1 &&
          candidate.getDate() === day
        ) {
          return candidate;
        }
        return null;
      }

      const dmyMatch = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
      if (dmyMatch) {
        const day = Number(dmyMatch[1]);
        const month = Number(dmyMatch[2]);
        const year = Number(dmyMatch[3]);
        const candidate = new Date(year, month - 1, day);
        if (
          candidate.getFullYear() === year &&
          candidate.getMonth() === month - 1 &&
          candidate.getDate() === day
        ) {
          return candidate;
        }
        return null;
      }

      const fallback = new Date(raw);
      return Number.isNaN(fallback.getTime()) ? null : fallback;
    };

    const corp = await prisma.corporate.findUnique({
      where: { id: corporateId },
      select: { isActive: true }
    });
    if (!corp || !corp.isActive) {
      return { success: false, error: 'Corporate is archived' };
    }

    const cleanedEmployees = (employees || [])
      .map((emp: any) => ({
        name: normalizeText(emp.name),
        email: normalizeText(emp.email),
        phone: normalizeText(emp.phone),
        employeeId: normalizeText(emp.employeeId),
        department: normalizeText(emp.department),
        location: normalizeText(emp.location),
        dob: normalizeText(emp.dob),
        gender: normalizeText(emp.gender),
        uhid: normalizeText(emp.uhid)
      }))
      .filter((emp: any) => emp.email || emp.phone);

    const uniqueEmployees: any[] = [];
    const seenKeys = new Set<string>();
    for (const emp of cleanedEmployees) {
      const keys: string[] = [];
      if (emp.email) keys.push(`email:${emp.email}`);
      if (emp.phone) keys.push(`phone:${emp.phone}`);
      if (keys.some((k) => seenKeys.has(k))) continue;
      keys.forEach((k) => seenKeys.add(k));
      uniqueEmployees.push(emp);
    }

    const emails = uniqueEmployees.map(e => e.email).filter(Boolean) as string[];
    const phones = uniqueEmployees.map(e => e.phone).filter(Boolean) as string[];
    const orConditions: any[] = [];
    if (emails.length) orConditions.push({ email: { in: emails } });
    if (phones.length) orConditions.push({ phone: { in: phones } });

    const existingCustomers = orConditions.length
      ? await prisma.customer.findMany({
          where: { OR: orConditions },
          select: { id: true, email: true, phone: true, department: true, location: true }
        })
      : [];

    const existingByEmail = new Map<string, any>();
    const existingByPhone = new Map<string, any>();
    existingCustomers.forEach((c) => {
      if (c.email) existingByEmail.set(c.email, c);
      if (c.phone) existingByPhone.set(c.phone, c);
    });

    let nextUhidNumber = 100001;
    const needsGeneratedUhid = uniqueEmployees.some((e) => !e.uhid);
    if (needsGeneratedUhid) {
      const lastCustomer = await prisma.customer.findFirst({
        where: { uhid: { not: null } },
        orderBy: { id: 'desc' },
        select: { uhid: true }
      });
      if (lastCustomer?.uhid) {
        const match = lastCustomer.uhid.match(/\d+/);
        if (match) nextUhidNumber = parseInt(match[0], 10) + 1;
      }
    }

    const buildUhid = () => `WTL-${nextUhidNumber++}`;

    let mapped = 0;
    let created = 0;
    const defaultPasswordHash = await bcrypt.hash('Welcome123', 10);

    const updates: Array<{ id: number; data: any }> = [];
    const creates: any[] = [];

    for (const emp of uniqueEmployees) {
      const existing =
        (emp.email && existingByEmail.get(emp.email)) ||
        (emp.phone && existingByPhone.get(emp.phone));

      if (existing) {
        updates.push({
          id: existing.id,
          data: {
            corporateId,
            employeeId: emp.employeeId,
            department: emp.department || existing.department,
            location: emp.location || existing.location
          }
        });
      } else {
        const loginMethod = emp.email ? 'email' : 'phone';
        creates.push({
          name: emp.name || null,
          email: emp.email || null,
          phone: emp.phone || null,
          password: defaultPasswordHash,
          dateOfBirth: parseDateOfBirth(emp.dob),
          gender: emp.gender,
          employeeId: emp.employeeId,
          department: emp.department,
          location: emp.location,
          corporateId,
          isActive: true,
          loginMethod,
          uhid: emp.uhid || buildUhid()
        });
      }
    }

    for (const update of updates) {
      await prisma.customer.update({ where: { id: update.id }, data: update.data });
      mapped++;
    }

    const batchSize = 500;
    for (let i = 0; i < creates.length; i += batchSize) {
      const batch = creates.slice(i, i + batchSize);
      const res = await prisma.customer.createMany({
        data: batch,
        skipDuplicates: true
      });
      created += res.count;
    }

    const actor = await getActorName(session);
    await logActivity(
      session.corporateId,
      actor,
      'BULK_UPLOAD',
      `Uploaded employee list (${created} created, ${mapped} mapped)`
    );
    revalidatePath('/employees');
    revalidatePath('/corp-settings/logs');
    return { success: true, stats: { mapped, created } };
  } catch (e: any) {
    console.error('Upload Error:', e);
    return { success: false, error: 'Processing failed: ' + (e.message || 'Unknown error') };
  }
}

export async function getCorporateReports(filter?: {
  type?: 'PRE_EMPLOYMENT' | 'ANNUAL_CHECKUP' | 'SHARED_BY_EMPLOYEE' | 'ALL';
  search?: string;
}) {
  const session = await getSession();
  if (!session) return [];

  const employeeWhere = buildEmployeeWhere(session);
  const baseWhere: any = {
    customer: employeeWhere,
    status: 'COMPLETED'
  };

  const services = await prisma.corporateService.findMany({
    where: { corporateId: session.corporateId, isActive: true },
    include: { package: { select: { isPreEmployment: true, reportVisibility: true } } }
  });

  const normalizedType = filter?.type === 'ALL' ? undefined : filter?.type;
  let visibilityFilter: any = buildCorporateReportVisibilityFilter(services);

  if (normalizedType === 'PRE_EMPLOYMENT') {
    visibilityFilter = { package: { isPreEmployment: true } };
  } else if (normalizedType === 'SHARED_BY_EMPLOYEE') {
    visibilityFilter = { isReportSharedWithCorp: true, package: { isPreEmployment: false } };
  } else if (normalizedType === 'ANNUAL_CHECKUP') {
    visibilityFilter = buildCorporateReportVisibilityFilter(services, {
      includePreEmployment: false,
      excludePreEmploymentPackages: true
    });
  }

  const searchFilter = filter?.search
    ? {
        OR: [
          { patientName: { contains: filter.search, mode: 'insensitive' } },
          { customer: { employeeId: { contains: filter.search, mode: 'insensitive' } } },
          { orderNumber: { contains: filter.search, mode: 'insensitive' } }
        ]
      }
    : null;

  const orderWhere: any = {
    ...baseWhere,
    AND: [visibilityFilter, ...(searchFilter ? [searchFilter] : [])]
  };

  const reports = await prisma.orderReport.findMany({
    where: { order: orderWhere },
    orderBy: { createdAt: 'desc' },
    include: {
      order: {
        select: {
          id: true,
          orderNumber: true,
          patientName: true,
          customer: { select: { employeeId: true, name: true } },
          package: { select: { isPreEmployment: true } },
          isReportSharedWithCorp: true
        }
      }
    }
  });

  return reports.map(r => ({
    id: r.id,
    reportType: r.reportType,
    createdAt: r.createdAt.toISOString(),
    patientName: r.order.patientName,
    employeeId: r.order.customer.employeeId || null,
    orderNumber: r.order.orderNumber || String(r.order.id),
    category: r.order.package?.isPreEmployment
      ? 'PRE_EMPLOYMENT'
      : (r.order.isReportSharedWithCorp ? 'SHARED_BY_EMPLOYEE' : 'ANNUAL_CHECKUP')
  }));
}

export async function getCorporateTickets() {
  const session = await getSession();
  if (!session) return [];

  const tickets = await prisma.corporateTicket.findMany({
    where: { corporateId: session.corporateId },
    include: { _count: { select: { messages: true } } },
    orderBy: { updatedAt: 'desc' }
  });

  return tickets.map(t => ({
    ...t,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString()
  }));
}

export async function getCorporateTicketMessages(ticketId: number) {
  const session = await getSession();
  if (!session) return [];

  const messages = await prisma.ticketMessage.findMany({
    where: {
      ticketId,
      ticket: { corporateId: session.corporateId }
    },
    orderBy: { createdAt: 'asc' }
  });

  return messages.map(m => ({
    ...m,
    createdAt: m.createdAt.toISOString()
  }));
}

export async function createCorporateTicket(subject: string, message: string, priority: string = 'NORMAL') {
  const session = await getSession();
  if (!session) return { success: false, error: 'Unauthorized' };

  const actor = await getActorName(session);
  try {
    const ticket = await prisma.$transaction(async (tx) => {
      const t = await tx.corporateTicket.create({
        data: {
          corporateId: session.corporateId,
          subject,
          priority
        }
      });

      await tx.ticketMessage.create({
        data: {
          ticketId: t.id,
          senderType: 'CORPORATE',
          senderName: actor,
          message
        }
      });

      return t;
    });

    await logActivity(session.corporateId, actor, 'TICKET_CREATED', `Created ticket: ${subject}`);
    revalidatePath('/corp-support');
    revalidatePath('/corp-settings/logs');
    return { success: true, ticketId: ticket.id };
  } catch (e: any) {
    return { success: false, error: e.message || 'Ticket creation failed' };
  }
}

export async function replyCorporateTicket(ticketId: number, message: string) {
  const session = await getSession();
  if (!session) return { success: false, error: 'Unauthorized' };

  const actor = await getActorName(session);
  try {
    await prisma.$transaction([
      prisma.ticketMessage.create({
        data: {
          ticketId,
          senderType: 'CORPORATE',
          senderName: actor,
          message
        }
      }),
      prisma.corporateTicket.update({
        where: { id: ticketId },
        data: { status: 'IN_PROGRESS', updatedAt: new Date() }
      })
    ]);

    await logActivity(session.corporateId, actor, 'TICKET_REPLY', `Replied to ticket #${ticketId}`);
    revalidatePath('/corp-support');
    revalidatePath('/corp-settings/logs');
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message || 'Reply failed' };
  }
}

export async function uploadCorporateTicketAttachment(
  ticketId: number,
  formData: FormData
) {
  const session = await getSession();
  if (!session) return { success: false, error: 'Unauthorized' };

  const file = formData.get('file') as File | null;
  if (!file) return { success: false, error: 'No file provided' };

  const maxBytes = 10 * 1024 * 1024;
  if (file.size > maxBytes) {
    return { success: false, error: 'File too large (max 10MB)' };
  }

  const ticket = await prisma.corporateTicket.findFirst({
    where: { id: ticketId, corporateId: session.corporateId },
    select: { id: true }
  });
  if (!ticket) return { success: false, error: 'Ticket not found' };

  try {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `corporate-support/${session.corporateId}/${ticketId}/${Date.now()}-${safeName}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const { encrypted, iv, tag } = encryptBuffer(buffer);
    await uploadEncryptedFile(storagePath, encrypted);

    const payload = {
      name: file.name,
      mime: file.type || 'application/octet-stream',
      size: file.size,
      path: storagePath,
      iv: iv.toString('base64'),
      tag: tag.toString('base64')
    };

    const actor = await getActorName(session);
    await prisma.$transaction([
      prisma.ticketMessage.create({
        data: {
          ticketId,
          senderType: 'CORPORATE',
          senderName: actor,
          message: `${ATTACHMENT_PREFIX}${JSON.stringify(payload)}`
        }
      }),
      prisma.corporateTicket.update({
        where: { id: ticketId },
        data: { status: 'IN_PROGRESS', updatedAt: new Date() }
      })
    ]);

    await logActivity(
      session.corporateId,
      actor,
      'TICKET_ATTACHMENT',
      `Uploaded attachment: ${file.name}`
    );
    revalidatePath('/corp-support');
    revalidatePath('/corp-settings/logs');
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message || 'Upload failed' };
  }
}

export async function closeCorporateTicket(ticketId: number) {
  const session = await getSession();
  if (!session) return { success: false, error: 'Unauthorized' };

  const actor = await getActorName(session);
  try {
    await prisma.corporateTicket.update({
      where: { id: ticketId },
      data: { status: 'RESOLVED', updatedAt: new Date() }
    });

    await logActivity(session.corporateId, actor, 'TICKET_CLOSED', `Closed ticket #${ticketId}`);
    revalidatePath('/corp-support');
    revalidatePath('/corp-settings/logs');
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message || 'Close failed' };
  }
}

export async function getCorporateActivities() {
  const session = await getSession();
  if (!session) return [];

  const activities = await prisma.corporateActivity.findMany({
    where: { corporateId: session.corporateId },
    orderBy: { createdAt: 'desc' },
    take: 50
  });

  return activities.map(a => ({
    ...a,
    createdAt: a.createdAt.toISOString()
  }));
}

export async function createCorporateUser(data: {
  name: string;
  email: string;
  password: string;
  role: 'SUPER_ADMIN' | 'DEPT_HEAD' | 'LOCATION_MANAGER';
  accessDept?: string;
  accessLocation?: string;
  canEdit?: boolean;
  maskContactInfo?: boolean;
}) {
  const session = await getSession();
  if (!session) return { success: false, error: 'Unauthorized' };
  if (!canEdit(session)) return { success: false, error: 'Insufficient permissions' };

  if (data.role === 'SUPER_ADMIN' && session.role !== 'SUPER_ADMIN') {
    return { success: false, error: 'Only Super Admin can create another Super Admin' };
  }

  try {
    await prisma.corporateUser.create({
      data: {
        corporateId: session.corporateId,
        name: data.name,
        email: data.email,
        password: await bcrypt.hash(data.password, 10),
        role: data.role,
        canEdit: Boolean(data.canEdit),
        maskContactInfo: data.maskContactInfo !== false,
        accessDept: data.accessDept || null,
        accessLocation: data.accessLocation || null,
        isActive: true
      }
    });

    const actor = await getActorName(session);
    await logActivity(
      session.corporateId,
      actor,
      'SUB_ADMIN_CREATED',
      `Created corporate user: ${data.email}`
    );

    revalidatePath('/corp-users');
    revalidatePath('/corp-settings/logs');
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message || 'Create failed' };
  }
}

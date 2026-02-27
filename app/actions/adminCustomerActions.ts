'use server';

import { requireAdmin } from '@/lib/admin-auth';
import { prisma } from '@/lib/db';
import { OrderStatus, Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';

export type CustomerStatusFilter = 'all' | 'active' | 'inactive';
export type CustomerTypeFilter = 'all' | 'corporate' | 'general';

const toNumber = (value: Prisma.Decimal | number | null | undefined) => {
  if (value === null || value === undefined) return null;
  return Number(value);
};

const toIso = (value: Date | null | undefined) => (value ? value.toISOString() : null);

export async function getAdminCustomersStats() {
  await requireAdmin({ roles: ['SUPER_ADMIN', 'ADMIN'] });

  const [total, active, inactive, corporate, general] = await Promise.all([
    prisma.customer.count(),
    prisma.customer.count({ where: { isActive: true } }),
    prisma.customer.count({ where: { isActive: false } }),
    prisma.customer.count({ where: { corporateId: { not: null } } }),
    prisma.customer.count({ where: { corporateId: null } }),
  ]);

  return { total, active, inactive, corporate, general };
}

export async function getAdminCustomersList(params?: {
  status?: CustomerStatusFilter;
  type?: CustomerTypeFilter;
  search?: string;
  page?: number;
  pageSize?: number;
}) {
  await requireAdmin({ roles: ['SUPER_ADMIN', 'ADMIN'] });

  const status = params?.status || 'all';
  const type = params?.type || 'all';
  const search = (params?.search || '').trim();
  const page = Math.max(1, Number(params?.page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(params?.pageSize) || 100));
  const skip = (page - 1) * pageSize;

  const andFilters: Prisma.CustomerWhereInput[] = [];

  if (status === 'active') andFilters.push({ isActive: true });
  if (status === 'inactive') andFilters.push({ isActive: false });
  if (type === 'corporate') andFilters.push({ corporateId: { not: null } });
  if (type === 'general') andFilters.push({ corporateId: null });

  if (search) {
    andFilters.push({
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { uhid: { contains: search, mode: 'insensitive' } },
        { employeeId: { contains: search, mode: 'insensitive' } },
        { corporate: { companyName: { contains: search, mode: 'insensitive' } } },
      ],
    });
  }

  const where = andFilters.length ? { AND: andFilters } : undefined;

  const [total, customers] = await Promise.all([
    prisma.customer.count({ where }),
    prisma.customer.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
      select: {
        id: true,
        uhid: true,
        name: true,
        email: true,
        phone: true,
        isActive: true,
        createdAt: true,
        corporateId: true,
        corporate: {
          select: {
            id: true,
            companyName: true,
          },
        },
        _count: {
          select: {
            orders: true,
          },
        },
        orders: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            createdAt: true,
          },
        },
      },
    }),
  ]);

  const items = customers.map((customer) => ({
    id: customer.id,
    uhid: customer.uhid,
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
    isActive: customer.isActive,
    createdAt: customer.createdAt.toISOString(),
    accountType: customer.corporateId ? 'Corporate User' : 'General User',
    corporate: customer.corporate
      ? {
          id: customer.corporate.id,
          companyName: customer.corporate.companyName,
        }
      : null,
    orderCount: customer._count.orders,
    lastOrderAt: customer.orders[0]?.createdAt
      ? customer.orders[0].createdAt.toISOString()
      : null,
  }));

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return {
    items,
    total,
    page,
    pageSize,
    totalPages,
  };
}

export async function setCustomerActiveStatus(customerId: number, isActive: boolean) {
  await requireAdmin({ roles: ['SUPER_ADMIN', 'ADMIN'] });

  try {
    if (!customerId) return { success: false, error: 'Invalid customer id' };

    const existing = await prisma.customer.findUnique({
      where: { id: customerId },
      select: { id: true },
    });

    if (!existing) return { success: false, error: 'Customer not found' };

    await prisma.customer.update({
      where: { id: customerId },
      data: { isActive },
    });

    revalidatePath('/admin/customers');
    revalidatePath(`/admin/customers/${customerId}`);

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Failed to update account status' };
  }
}

export async function getAdminCustomerDetails(customerId: number) {
  await requireAdmin({ roles: ['SUPER_ADMIN', 'ADMIN'] });

  if (!customerId) return null;

  const [customer, orderStats, orderStatusStats, lastOrder] = await Promise.all([
    prisma.customer.findUnique({
      where: { id: customerId },
      select: {
        id: true,
        uhid: true,
        name: true,
        email: true,
        phone: true,
        isActive: true,
        role: true,
        loginMethod: true,
        gender: true,
        employeeId: true,
        department: true,
        location: true,
        dateOfBirth: true,
        createdAt: true,
        corporateId: true,
        corporate: {
          select: {
            id: true,
            companyName: true,
            contactPerson: true,
            email: true,
            phone: true,
            isActive: true,
          },
        },
        addresses: {
          orderBy: { id: 'desc' },
          select: {
            id: true,
            type: true,
            addressLine1: true,
            addressLine2: true,
            city: true,
            state: true,
            pincode: true,
          },
        },
        familyMembers: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            uhid: true,
            name: true,
            relationship: true,
            gender: true,
            dateOfBirth: true,
            phone: true,
            email: true,
            createdAt: true,
          },
        },
        assignedPackages: {
          orderBy: { assignedAt: 'desc' },
          select: {
            id: true,
            status: true,
            paidBy: true,
            assignedAt: true,
            availedAt: true,
            package: {
              select: {
                id: true,
                packageName: true,
                isPreEmployment: true,
                isActive: true,
                price: true,
              },
            },
          },
        },
        orders: {
          orderBy: { createdAt: 'desc' },
          take: 40,
          select: {
            id: true,
            orderNumber: true,
            status: true,
            patientName: true,
            patientPhone: true,
            patientGender: true,
            patientDob: true,
            collectionType: true,
            paymentMode: true,
            paymentStatus: true,
            preferredDate: true,
            preferredTimeSlot: true,
            bookingDate: true,
            createdAt: true,
            totalAmount: true,
            discountAmount: true,
            homeCollectionCharges: true,
            finalAmount: true,
            lab: {
              select: {
                id: true,
                labName: true,
                city: true,
              },
            },
            package: {
              select: {
                id: true,
                packageName: true,
                isPreEmployment: true,
              },
            },
            address: {
              select: {
                addressLine1: true,
                city: true,
                state: true,
                pincode: true,
              },
            },
            items: {
              select: {
                id: true,
                itemType: true,
                itemName: true,
                price: true,
              },
            },
            payments: {
              orderBy: { paymentDate: 'desc' },
              select: {
                id: true,
                method: true,
                status: true,
                paymentType: true,
                amount: true,
                refundedAmount: true,
                paymentDate: true,
              },
            },
            refunds: {
              orderBy: { createdAt: 'desc' },
              select: {
                id: true,
                amount: true,
                status: true,
                mode: true,
                reason: true,
                createdAt: true,
              },
            },
          },
        },
        _count: {
          select: {
            orders: true,
            addresses: true,
            familyMembers: true,
            assignedPackages: true,
          },
        },
      },
    }),
    prisma.order.aggregate({
      where: { userId: customerId },
      _sum: { finalAmount: true },
    }),
    prisma.order.groupBy({
      by: ['status'],
      where: { userId: customerId },
      _count: {
        _all: true,
      },
    }),
    prisma.order.findFirst({
      where: { userId: customerId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        createdAt: true,
      },
    }),
  ]);

  if (!customer) return null;

  const statusCounts = {
    pending: 0,
    completed: 0,
    cancelled: 0,
  };

  orderStatusStats.forEach((entry) => {
    if (
      entry.status === OrderStatus.PENDING ||
      entry.status === OrderStatus.ACCEPTED ||
      entry.status === OrderStatus.PROCESSING ||
      entry.status === OrderStatus.PARTIAL_COMPLETED
    ) {
      statusCounts.pending += entry._count._all;
    }

    if (entry.status === OrderStatus.COMPLETED) {
      statusCounts.completed += entry._count._all;
    }

    if (entry.status === OrderStatus.CANCELLED || entry.status === OrderStatus.REJECTED) {
      statusCounts.cancelled += entry._count._all;
    }
  });

  return {
    id: customer.id,
    uhid: customer.uhid,
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
    isActive: customer.isActive,
    role: customer.role,
    loginMethod: customer.loginMethod,
    gender: customer.gender,
    employeeId: customer.employeeId,
    department: customer.department,
    location: customer.location,
    dateOfBirth: toIso(customer.dateOfBirth),
    createdAt: customer.createdAt.toISOString(),
    accountType: customer.corporateId ? 'Corporate User' : 'General User',
    corporate: customer.corporate
      ? {
          ...customer.corporate,
        }
      : null,
    counts: {
      orders: customer._count.orders,
      addresses: customer._count.addresses,
      familyMembers: customer._count.familyMembers,
      assignedPackages: customer._count.assignedPackages,
    },
    spendSummary: {
      totalSpent: toNumber(orderStats._sum.finalAmount) || 0,
      pendingOrders: statusCounts.pending,
      completedOrders: statusCounts.completed,
      cancelledOrders: statusCounts.cancelled,
      lastOrderAt: toIso(lastOrder?.createdAt),
    },
    addresses: customer.addresses.map((address) => ({
      ...address,
    })),
    familyMembers: customer.familyMembers.map((member) => ({
      ...member,
      dateOfBirth: toIso(member.dateOfBirth),
      createdAt: member.createdAt.toISOString(),
    })),
    assignedPackages: customer.assignedPackages.map((entry) => ({
      id: entry.id,
      status: entry.status,
      paidBy: entry.paidBy,
      assignedAt: entry.assignedAt.toISOString(),
      availedAt: toIso(entry.availedAt),
      package: {
        ...entry.package,
        price: toNumber(entry.package.price) || 0,
      },
    })),
    orders: customer.orders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      patientName: order.patientName,
      patientPhone: order.patientPhone,
      patientGender: order.patientGender,
      patientDob: toIso(order.patientDob),
      collectionType: order.collectionType,
      paymentMode: order.paymentMode,
      paymentStatus: order.paymentStatus,
      preferredDate: toIso(order.preferredDate),
      preferredTimeSlot: order.preferredTimeSlot,
      bookingDate: order.bookingDate.toISOString(),
      createdAt: order.createdAt.toISOString(),
      totalAmount: toNumber(order.totalAmount),
      discountAmount: toNumber(order.discountAmount) || 0,
      homeCollectionCharges: toNumber(order.homeCollectionCharges) || 0,
      finalAmount: toNumber(order.finalAmount),
      lab: order.lab,
      package: order.package,
      address: order.address,
      items: order.items.map((item) => ({
        ...item,
        price: toNumber(item.price),
      })),
      payments: order.payments.map((payment) => ({
        ...payment,
        amount: toNumber(payment.amount) || 0,
        refundedAmount: toNumber(payment.refundedAmount) || 0,
        paymentDate: payment.paymentDate.toISOString(),
      })),
      refunds: order.refunds.map((refund) => ({
        ...refund,
        amount: toNumber(refund.amount) || 0,
        createdAt: refund.createdAt.toISOString(),
      })),
    })),
  };
}

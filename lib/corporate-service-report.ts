import prisma from '@/lib/db';
import { OrderStatus } from '@prisma/client';

export type CorporateServiceEmployeeStatus = 'PENDING' | 'IN_PROCESS' | 'AVAILED';

export type CorporateServiceEmployeeRow = {
  employeeId: number;
  name: string;
  email: string | null;
  phone: string | null;
  employeeCode: string | null;
  isEmployeeActive: boolean;
  status: CorporateServiceEmployeeStatus;
  orderId: number | null;
  orderNumber: string | null;
  orderBookedAt: string | null;
  completedAt: string | null;
};

type ReportParams = {
  corporateId: number;
  serviceId: number;
  status?: 'ALL' | CorporateServiceEmployeeStatus;
  from?: string;
  to?: string;
};

const formatIsoDate = (value?: Date | null) => (value ? value.toISOString().slice(0, 10) : null);

const toDate = (value?: string) => {
  if (!value) return null;
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export async function getCorporateServiceEmployeeReport(params: ReportParams) {
  const statusFilter = params.status || 'ALL';
  const from = toDate(params.from || '');
  const to = toDate(params.to || '');
  const fromMs = from ? from.getTime() : null;
  const toMs = to ? to.getTime() + (24 * 60 * 60 * 1000 - 1) : null;

  const service = await prisma.corporateService.findFirst({
    where: { id: params.serviceId, corporateId: params.corporateId },
    select: {
      id: true,
      isActive: true,
      validFrom: true,
      validTill: true,
      selfUsageLimit: true,
      familyUsageLimit: true,
      selfPaymentType: true,
      familyPaymentType: true,
      packageId: true,
      couponId: true,
      package: {
        select: {
          id: true,
          packageName: true,
          price: true,
          discount: true,
          isCorporate: true,
          isActive: true
        }
      },
      coupon: {
        select: {
          id: true,
          code: true
        }
      },
      corporate: {
        select: {
          id: true,
          companyName: true
        }
      }
    }
  });

  if (!service) {
    return { service: null, rows: [], counts: { pending: 0, inProcess: 0, availed: 0, total: 0 } };
  }

  if (!service.packageId) {
    return {
      service,
      rows: [],
      counts: { pending: 0, inProcess: 0, availed: 0, total: 0 }
    };
  }

  const explicitAssignments = await prisma.employeePackage.findMany({
    where: {
      packageId: service.packageId,
      customer: { corporateId: params.corporateId }
    },
    select: { customerId: true }
  });

  const assignedCustomerIds = explicitAssignments.map((a) => a.customerId);
  const employeeWhere =
    assignedCustomerIds.length > 0
      ? { id: { in: assignedCustomerIds }, corporateId: params.corporateId }
      : { corporateId: params.corporateId };

  const employees = await prisma.customer.findMany({
    where: employeeWhere,
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      employeeId: true,
      isActive: true
    }
  });

  if (!employees.length) {
    return {
      service,
      rows: [],
      counts: { pending: 0, inProcess: 0, availed: 0, total: 0 }
    };
  }

  const employeeIds = employees.map((e) => e.id);
  const orders = await prisma.order.findMany({
    where: {
      userId: { in: employeeIds },
      packageId: service.packageId,
      status: { notIn: [OrderStatus.CANCELLED, OrderStatus.REJECTED] }
    },
    select: {
      id: true,
      userId: true,
      orderNumber: true,
      createdAt: true,
      bookingDate: true,
      status: true
    },
    orderBy: { createdAt: 'desc' }
  });

  const completedOrderIds = orders.filter((o) => o.status === OrderStatus.COMPLETED).map((o) => o.id);
  const completedActivities = completedOrderIds.length
    ? await prisma.orderActivity.findMany({
        where: {
          orderId: { in: completedOrderIds },
          OR: [
            { action: 'STATUS_UPDATED', newValue: 'COMPLETED' },
            { action: 'REPORT_UPLOADED', newValue: 'COMPLETED' }
          ]
        },
        select: { orderId: true, createdAt: true },
        orderBy: { createdAt: 'desc' }
      })
    : [];

  const completionByOrder = new Map<number, Date>();
  for (const activity of completedActivities) {
    if (!completionByOrder.has(activity.orderId)) {
      completionByOrder.set(activity.orderId, activity.createdAt);
    }
  }

  const ordersByUser = new Map<number, typeof orders>();
  for (const order of orders) {
    const list = ordersByUser.get(order.userId) || [];
    list.push(order);
    ordersByUser.set(order.userId, list);
  }

  const rows: CorporateServiceEmployeeRow[] = employees.map((emp) => {
    const empOrders = ordersByUser.get(emp.id) || [];
    const completedForEmployee = empOrders
      .filter((o) => o.status === OrderStatus.COMPLETED)
      .map((o) => ({
        order: o,
        completedAt: completionByOrder.get(o.id) || o.createdAt
      }))
      .sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime());

    if (completedForEmployee.length > 0) {
      const latest = completedForEmployee[0];
      return {
        employeeId: emp.id,
        name: emp.name || 'N/A',
        email: emp.email,
        phone: emp.phone,
        employeeCode: emp.employeeId,
        isEmployeeActive: emp.isActive,
        status: 'AVAILED',
        orderId: latest.order.id,
        orderNumber: latest.order.orderNumber || String(latest.order.id),
        orderBookedAt: latest.order.bookingDate.toISOString(),
        completedAt: latest.completedAt.toISOString()
      };
    }

    if (empOrders.length > 0) {
      const latest = empOrders[0];
      return {
        employeeId: emp.id,
        name: emp.name || 'N/A',
        email: emp.email,
        phone: emp.phone,
        employeeCode: emp.employeeId,
        isEmployeeActive: emp.isActive,
        status: 'IN_PROCESS',
        orderId: latest.id,
        orderNumber: latest.orderNumber || String(latest.id),
        orderBookedAt: latest.bookingDate.toISOString(),
        completedAt: null
      };
    }

    return {
      employeeId: emp.id,
      name: emp.name || 'N/A',
      email: emp.email,
      phone: emp.phone,
      employeeCode: emp.employeeId,
      isEmployeeActive: emp.isActive,
      status: 'PENDING',
      orderId: null,
      orderNumber: null,
      orderBookedAt: null,
      completedAt: null
    };
  });

  const filtered = rows.filter((row) => {
    if (statusFilter !== 'ALL' && row.status !== statusFilter) return false;

    if (!fromMs && !toMs) return true;
    const eventDateStr = row.status === 'AVAILED' ? row.completedAt : row.orderBookedAt;
    if (!eventDateStr) return false;
    const ts = new Date(eventDateStr).getTime();
    if (Number.isNaN(ts)) return false;
    if (fromMs && ts < fromMs) return false;
    if (toMs && ts > toMs) return false;
    return true;
  });

  const counts = {
    pending: rows.filter((r) => r.status === 'PENDING').length,
    inProcess: rows.filter((r) => r.status === 'IN_PROCESS').length,
    availed: rows.filter((r) => r.status === 'AVAILED').length,
    total: rows.length
  };

  return {
    service: {
      ...service,
      validFrom: formatIsoDate(service.validFrom),
      validTill: formatIsoDate(service.validTill)
    },
    rows: filtered,
    counts
  };
}

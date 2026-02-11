import prisma from '@/lib/db';
import { OrderStatus, PaymentType } from '@prisma/client';

export type CorporateBillableOrder = {
  orderId: number;
  orderNumber: string;
  packageId: number;
  packageName: string;
  employeeName: string;
  employeeEmail: string | null;
  employeePhone: string | null;
  completedAt: string;
  bookedAt: string;
  unitPrice: number;
  status: string;
  paymentStatus: string | null;
};

function money(value: unknown) {
  return Number(value || 0);
}

function round2(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

type Args = {
  corporateId: number;
  start: Date;
  end: Date;
};

export async function getCorporateBillableOrders({ corporateId, start, end }: Args): Promise<CorporateBillableOrder[]> {
  const completedOrders = await prisma.order.findMany({
    where: {
      customer: { corporateId },
      status: OrderStatus.COMPLETED,
      packageId: { not: null }
    },
    select: {
      id: true,
      orderNumber: true,
      packageId: true,
      patientType: true,
      createdAt: true,
      bookingDate: true,
      status: true,
      paymentStatus: true,
      paymentMode: true,
      package: {
        select: {
          packageName: true,
          price: true,
          discount: true
        }
      },
      customer: {
        select: {
          name: true,
          email: true,
          phone: true
        }
      },
      items: {
        select: {
          itemType: true,
          packageId: true,
          price: true,
          basePrice: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  if (!completedOrders.length) return [];

  const packageIds = Array.from(
    new Set(completedOrders.map((o) => Number(o.packageId)).filter((id) => Number.isFinite(id)))
  );

  const services = await prisma.corporateService.findMany({
    where: {
      corporateId,
      packageId: { in: packageIds }
    },
    select: {
      packageId: true,
      validFrom: true,
      validTill: true,
      selfPaymentType: true,
      familyPaymentType: true,
      createdAt: true
    },
    orderBy: { createdAt: 'desc' }
  });

  const servicesByPackage = new Map<number, typeof services>();
  for (const service of services) {
    const pkgId = Number(service.packageId);
    if (!pkgId) continue;
    const list = servicesByPackage.get(pkgId) || [];
    list.push(service);
    servicesByPackage.set(pkgId, list);
  }

  const orderIds = completedOrders.map((o) => o.id);
  const completionActivities = await prisma.orderActivity.findMany({
    where: {
      orderId: { in: orderIds },
      OR: [
        { action: 'STATUS_UPDATED', newValue: 'COMPLETED' },
        { action: 'REPORT_UPLOADED', newValue: 'COMPLETED' }
      ]
    },
    select: {
      orderId: true,
      createdAt: true
    },
    orderBy: { createdAt: 'desc' }
  });

  const completedAtByOrder = new Map<number, Date>();
  for (const act of completionActivities) {
    if (!completedAtByOrder.has(act.orderId)) {
      completedAtByOrder.set(act.orderId, act.createdAt);
    }
  }

  const rows: CorporateBillableOrder[] = [];

  for (const order of completedOrders) {
    const pkgId = Number(order.packageId);
    if (!pkgId) continue;

    const completionDate = completedAtByOrder.get(order.id) || order.createdAt;
    if (completionDate < start || completionDate > end) continue;

    const matchingServices = servicesByPackage.get(pkgId) || [];
    const applicableService = matchingServices.find((svc) => {
      return order.createdAt >= svc.validFrom && order.createdAt <= svc.validTill;
    });

    const patientType = order.patientType === 'family' ? 'family' : 'self';
    const servicePays = applicableService
      ? (patientType === 'family' ? applicableService.familyPaymentType : applicableService.selfPaymentType)
      : null;

    const isCorporatePayByRule = servicePays === PaymentType.CORPORATE_PAYS;
    const isCorporatePayByOrder =
      String(order.paymentStatus || '').toUpperCase() === 'CORPORATE_BILLING' ||
      String(order.paymentMode || '').toLowerCase() === 'corporate credit';

    if (!isCorporatePayByRule && !isCorporatePayByOrder) continue;

    const packageItem = order.items.find(
      (item) => item.itemType === 'package' && Number(item.packageId) === pkgId
    );

    let unitPrice = money(packageItem?.price);
    if (unitPrice <= 0) {
      const packagePrice = money(order.package?.price);
      const packageDiscount = money(order.package?.discount);
      unitPrice = packagePrice > 0 ? packagePrice * (1 - packageDiscount / 100) : 0;
    }
    if (unitPrice <= 0) {
      unitPrice = money(packageItem?.basePrice);
    }

    rows.push({
      orderId: order.id,
      orderNumber: order.orderNumber || String(order.id),
      packageId: pkgId,
      packageName: order.package?.packageName || `Package #${pkgId}`,
      employeeName: order.customer?.name || 'Employee',
      employeeEmail: order.customer?.email || null,
      employeePhone: order.customer?.phone || null,
      completedAt: completionDate.toISOString(),
      bookedAt: (order.bookingDate || order.createdAt).toISOString(),
      unitPrice: round2(unitPrice),
      status: order.status,
      paymentStatus: order.paymentStatus
    });
  }

  rows.sort((a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime());
  return rows;
}

export async function getCorporateBillableAmountForOrder(orderId: number): Promise<number | null> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      packageId: true,
      patientType: true,
      createdAt: true,
      paymentStatus: true,
      paymentMode: true,
      customer: { select: { corporateId: true } },
      package: {
        select: {
          price: true,
          discount: true
        }
      },
      items: {
        select: {
          itemType: true,
          packageId: true,
          price: true,
          basePrice: true
        }
      }
    }
  });

  if (!order?.packageId || !order.customer?.corporateId) return null;

  const service = await prisma.corporateService.findFirst({
    where: {
      corporateId: order.customer.corporateId,
      packageId: order.packageId,
      validFrom: { lte: order.createdAt },
      validTill: { gte: order.createdAt }
    },
    select: {
      selfPaymentType: true,
      familyPaymentType: true
    },
    orderBy: { createdAt: 'desc' }
  });

  const patientType = order.patientType === 'family' ? 'family' : 'self';
  const servicePays = service
    ? (patientType === 'family' ? service.familyPaymentType : service.selfPaymentType)
    : null;
  const isCorporatePayByRule = servicePays === PaymentType.CORPORATE_PAYS;
  const isCorporatePayByOrder =
    String(order.paymentStatus || '').toUpperCase() === 'CORPORATE_BILLING' ||
    String(order.paymentMode || '').toLowerCase() === 'corporate credit';
  if (!isCorporatePayByRule && !isCorporatePayByOrder) return null;

  const packageItem = order.items.find(
    (item) => item.itemType === 'package' && Number(item.packageId) === Number(order.packageId)
  );

  let unitPrice = money(packageItem?.price);
  if (unitPrice <= 0) {
    const packagePrice = money(order.package?.price);
    const packageDiscount = money(order.package?.discount);
    unitPrice = packagePrice > 0 ? packagePrice * (1 - packageDiscount / 100) : 0;
  }
  if (unitPrice <= 0) {
    unitPrice = money(packageItem?.basePrice);
  }

  return round2(unitPrice);
}

'use server';

import { requireAdmin } from '@/lib/admin-auth';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { writeAdminAuditLog } from '@/lib/audit';
import { OrderStatus } from '@prisma/client';
import {
  canTransitionPaymentState,
  derivePaymentState,
  normalizePaymentState,
  toStoredPaymentStatus,
} from '@/lib/payment-state';
import { getCorporateBillableAmountForOrder, getCorporateBillableOrders } from '@/lib/corporate-finance';

type FinanceFilters = {
  from?: string;
  to?: string;
  query?: string;
  page?: number;
  limit?: number;
};

const FINANCE_ROLES = ['SUPER_ADMIN', 'ADMIN'] as const;

function toDateRange(from?: string, to?: string) {
  const now = new Date();
  const fallbackFrom = new Date(now);
  fallbackFrom.setDate(fallbackFrom.getDate() - 30);
  fallbackFrom.setHours(0, 0, 0, 0);

  const start = from ? new Date(from) : fallbackFrom;
  const end = to ? new Date(to) : now;
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function money(value: unknown) {
  return Number(value || 0);
}

async function recalculateOrderPaymentStatus(orderId: number) {
  const [order, paymentAgg, refundAgg] = await Promise.all([
    prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        finalAmount: true,
        paymentStatus: true,
        packageId: true,
        customer: { select: { corporateId: true } },
      },
    }),
    prisma.payment.aggregate({
      where: { orderId },
      _sum: { amount: true },
    }),
    prisma.paymentRefund.aggregate({
      where: { orderId, status: 'PROCESSED' },
      _sum: { amount: true },
    }),
  ]);

  if (!order) return null;

  let finalAmount = money(order.finalAmount);
  if (order.customer?.corporateId && order.packageId) {
    const billableAmount = await getCorporateBillableAmountForOrder(orderId);
    if (billableAmount !== null && billableAmount > 0) {
      finalAmount = billableAmount;
    }
  }
  const paid = money(paymentAgg._sum.amount);
  const refunded = money(refundAgg._sum.amount);
  const netPaid = paid - refunded;
  const targetState = derivePaymentState({
    finalAmount,
    totalPaid: paid,
    totalRefunded: refunded,
    currentStatus: order.paymentStatus,
  });
  const currentState = normalizePaymentState(order.paymentStatus);

  if (!canTransitionPaymentState(currentState, targetState)) {
    throw new Error(`Invalid payment state transition: ${currentState} -> ${targetState}`);
  }

  const paymentStatus = toStoredPaymentStatus(targetState);

  await prisma.order.update({
    where: { id: orderId },
    data: { paymentStatus },
  });

  return { finalAmount, paid, refunded, netPaid, paymentStatus };
}

export async function updateOrderPaymentStatusManualAction(input: {
  orderId: number;
  targetStatus: 'PENDING' | 'PARTIAL' | 'PAID' | 'REFUNDED' | 'CORPORATE_BILLING';
  reason: string;
}) {
  const admin = await requireAdmin({ roles: [...FINANCE_ROLES] });
  try {
    const orderId = Number(input.orderId);
    const targetStatus = normalizePaymentState(input.targetStatus);
    const reason = String(input.reason || '').trim();
    if (!orderId || !reason) {
      return { success: false, error: 'Order id and reason are required' };
    }

    const [order, paidAgg, refundedAgg] = await Promise.all([
      prisma.order.findUnique({
        where: { id: orderId },
        select: {
          id: true,
          finalAmount: true,
          paymentStatus: true,
          packageId: true,
          customer: { select: { corporateId: true } },
        },
      }),
      prisma.payment.aggregate({ where: { orderId }, _sum: { amount: true } }),
      prisma.paymentRefund.aggregate({ where: { orderId, status: 'PROCESSED' }, _sum: { amount: true } }),
    ]);
    if (!order) return { success: false, error: 'Order not found' };

    const current = normalizePaymentState(order.paymentStatus);
    if (!canTransitionPaymentState(current, targetStatus)) {
      return { success: false, error: `Transition not allowed: ${current} -> ${targetStatus}` };
    }

    let finalAmount = money(order.finalAmount);
    if (order.customer?.corporateId && order.packageId) {
      const billableAmount = await getCorporateBillableAmountForOrder(orderId);
      if (billableAmount !== null && billableAmount > 0) {
        finalAmount = billableAmount;
      }
    }
    const paid = money(paidAgg._sum.amount);
    const refunded = money(refundedAgg._sum.amount);
    const netPaid = paid - refunded;

    if (targetStatus === 'PAID' && netPaid + 0.5 < finalAmount) {
      return { success: false, error: 'Cannot mark paid before collecting full amount' };
    }
    if (targetStatus === 'REFUNDED' && refunded <= 0) {
      return { success: false, error: 'Cannot mark refunded without a processed refund' };
    }
    if (targetStatus === 'PENDING' && netPaid > 0 && current !== 'CORPORATE_BILLING') {
      return { success: false, error: 'Cannot set pending when payment exists' };
    }

    const nextStored = toStoredPaymentStatus(targetStatus);
    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: { paymentStatus: nextStored },
      });
      await tx.orderActivity.create({
        data: {
          orderId,
          action: 'PAYMENT_STATUS_UPDATED',
          oldValue: order.paymentStatus || null,
          newValue: nextStored,
          performedBy: `ADMIN:${admin.email}`,
        },
      });
    });

    await writeAdminAuditLog({
      adminId: admin.id,
      adminEmail: admin.email,
      action: 'finance.payment_status.manual_update',
      entityType: 'order',
      entityId: orderId,
      metadata: { oldStatus: order.paymentStatus || null, newStatus: nextStored, reason },
    });

    revalidatePath(`/admin/orders/${orderId}`);
    revalidatePath('/admin/orders');
    revalidatePath('/admin/finance');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Failed to update payment status' };
  }
}

export async function recordManualPaymentAction(input: {
  orderId: number;
  amount: number;
  method: string;
  transactionId?: string;
  notes?: string;
}) {
  const admin = await requireAdmin({ roles: [...FINANCE_ROLES] });
  try {
    const orderId = Number(input.orderId);
    const amount = Number(input.amount);
    const method = String(input.method || '').trim();
    const txnId = String(input.transactionId || '').trim();
    const notes = String(input.notes || '').trim();

    if (!orderId || !Number.isFinite(orderId)) {
      return { success: false, error: 'Invalid order id' };
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      return { success: false, error: 'Amount must be greater than zero' };
    }
    if (!method) {
      return { success: false, error: 'Payment method is required' };
    }

    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        finalAmount: true,
        paymentStatus: true,
        packageId: true,
        customer: { select: { corporateId: true } },
      },
    });
    if (!existingOrder) return { success: false, error: 'Order not found' };

    const [paymentAgg, refundAgg] = await Promise.all([
      prisma.payment.aggregate({
        where: { orderId },
        _sum: { amount: true },
      }),
      prisma.paymentRefund.aggregate({
        where: { orderId, status: 'PROCESSED' },
        _sum: { amount: true },
      }),
    ]);

    let finalAmount = money(existingOrder.finalAmount);
    if (existingOrder.customer?.corporateId && existingOrder.packageId) {
      const billableAmount = await getCorporateBillableAmountForOrder(orderId);
      if (billableAmount !== null && billableAmount > 0) {
        finalAmount = billableAmount;
      }
    }
    const paid = money(paymentAgg._sum.amount);
    const refunded = money(refundAgg._sum.amount);
    const netPaid = paid - refunded;
    const remaining = Math.max(0, finalAmount - netPaid);

    if (remaining > 0 && amount > remaining * 1.1) {
      return { success: false, error: 'Amount exceeds remaining by more than 10%' };
    }

    const payment = await prisma.payment.create({
      data: {
        orderId,
        amount,
        method,
        transactionId: txnId || null,
        notes: notes || null,
        status: 'verified',
        paymentType: 'MANUAL_PAYMENT',
        receivedByAdminId: admin.id,
      },
      select: { id: true },
    });

    const summary = await recalculateOrderPaymentStatus(orderId);

    await writeAdminAuditLog({
      adminId: admin.id,
      adminEmail: admin.email,
      action: 'finance.payment.recorded',
      entityType: 'payment',
      entityId: payment.id,
      metadata: { orderId, amount, method, txnId: txnId || null },
    });

    revalidatePath(`/admin/orders/${orderId}`);
    revalidatePath('/admin/orders');
    revalidatePath('/admin/finance');

    return { success: true, paymentId: payment.id, summary };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Failed to record payment' };
  }
}

export async function initiateRefundAction(input: {
  orderId: number;
  amount: number;
  reason: string;
  paymentId?: number;
  mode?: string;
  transactionId?: string;
  notes?: string;
}) {
  const admin = await requireAdmin({ roles: [...FINANCE_ROLES] });
  try {
    const orderId = Number(input.orderId);
    const amount = Number(input.amount);
    const reason = String(input.reason || '').trim();
    const mode = String(input.mode || 'Manual');
    const transactionId = String(input.transactionId || '').trim();
    const notes = String(input.notes || '').trim();
    const paymentId = input.paymentId ? Number(input.paymentId) : null;

    if (!orderId || !Number.isFinite(orderId)) {
      return { success: false, error: 'Invalid order id' };
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      return { success: false, error: 'Refund amount must be greater than zero' };
    }
    if (!reason) {
      return { success: false, error: 'Refund reason is required' };
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true },
    });
    if (!order) return { success: false, error: 'Order not found' };

    const [paymentAgg, refundAgg] = await Promise.all([
      prisma.payment.aggregate({
        where: { orderId },
        _sum: { amount: true },
      }),
      prisma.paymentRefund.aggregate({
        where: { orderId, status: 'PROCESSED' },
        _sum: { amount: true },
      }),
    ]);
    const totalPaid = money(paymentAgg._sum.amount);
    const totalRefunded = money(refundAgg._sum.amount);
    const refundable = Math.max(0, totalPaid - totalRefunded);
    if (amount > refundable + 0.01) {
      return { success: false, error: 'Refund exceeds refundable amount' };
    }

    const refund = await prisma.paymentRefund.create({
      data: {
        orderId,
        paymentId,
        amount,
        reason,
        status: 'PROCESSED',
        mode,
        transactionId: transactionId || null,
        notes: notes || null,
        processedAt: new Date(),
        createdByAdminId: admin.id,
      },
      select: { id: true },
    });

    if (paymentId) {
      await prisma.payment.update({
        where: { id: paymentId },
        data: { refundedAmount: { increment: amount } },
      });
    }

    const summary = await recalculateOrderPaymentStatus(orderId);

    await writeAdminAuditLog({
      adminId: admin.id,
      adminEmail: admin.email,
      action: 'finance.refund.processed',
      entityType: 'refund',
      entityId: refund.id,
      metadata: { orderId, paymentId, amount, reason },
    });

    revalidatePath(`/admin/orders/${orderId}`);
    revalidatePath('/admin/orders');
    revalidatePath('/admin/finance');

    return { success: true, refundId: refund.id, summary };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Failed to process refund' };
  }
}

export async function getFinanceDashboardDataAction(filters?: FinanceFilters) {
  await requireAdmin({ roles: [...FINANCE_ROLES] });

  const page = Math.max(1, Number(filters?.page || 1));
  const limit = Math.min(100, Math.max(10, Number(filters?.limit || 25)));
  const skip = (page - 1) * limit;
  const query = String(filters?.query || '').trim();
  const { start, end } = toDateRange(filters?.from, filters?.to);

  const paymentWhere = {
    paymentDate: { gte: start, lte: end },
    ...(query
      ? {
          OR: [
            { transactionId: { contains: query, mode: 'insensitive' as const } },
            { method: { contains: query, mode: 'insensitive' as const } },
            { order: { orderNumber: { contains: query, mode: 'insensitive' as const } } },
            { order: { patientName: { contains: query, mode: 'insensitive' as const } } },
          ],
        }
      : {}),
  };

  const refundWhere = {
    createdAt: { gte: start, lte: end },
    ...(query
      ? {
          OR: [
            { transactionId: { contains: query, mode: 'insensitive' as const } },
            { reason: { contains: query, mode: 'insensitive' as const } },
            { order: { orderNumber: { contains: query, mode: 'insensitive' as const } } },
            { order: { patientName: { contains: query, mode: 'insensitive' as const } } },
          ],
        }
      : {}),
  };

  const nonBillableStatuses: OrderStatus[] = [OrderStatus.CANCELLED, OrderStatus.REJECTED];
  const orderRangeWhere = {
    createdAt: { gte: start, lte: end },
    status: { notIn: nonBillableStatuses },
  };

  const [
    paymentsTotalAgg,
    refundsTotalAgg,
    orderTotalAgg,
    corporateBilledAgg,
    userBilledAgg,
    corporateCollectedAgg,
    generalCollectedAgg,
    outstandingOrdersCount,
    paymentsCount,
    refundsCount,
    payments,
    refunds,
    corporates,
  ] = await Promise.all([
    prisma.payment.aggregate({
      where: { paymentDate: { gte: start, lte: end } },
      _sum: { amount: true },
    }),
    prisma.paymentRefund.aggregate({
      where: { createdAt: { gte: start, lte: end }, status: 'PROCESSED' },
      _sum: { amount: true },
    }),
    prisma.order.aggregate({
      where: orderRangeWhere,
      _sum: { finalAmount: true },
    }),
    prisma.order.aggregate({
      where: { ...orderRangeWhere, paymentStatus: 'CORPORATE_BILLING' },
      _sum: { finalAmount: true },
    }),
    prisma.order.aggregate({
      where: { ...orderRangeWhere, customer: { corporateId: null } },
      _sum: { finalAmount: true },
    }),
    prisma.payment.aggregate({
      where: { paymentDate: { gte: start, lte: end }, order: { customer: { corporateId: { not: null } } } },
      _sum: { amount: true },
    }),
    prisma.payment.aggregate({
      where: { paymentDate: { gte: start, lte: end }, order: { customer: { corporateId: null } } },
      _sum: { amount: true },
    }),
    prisma.order.count({
      where: {
        ...orderRangeWhere,
        paymentStatus: { in: ['Pending', 'Partial', 'CORPORATE_BILLING'] },
      },
    }),
    prisma.payment.count({ where: paymentWhere }),
    prisma.paymentRefund.count({ where: refundWhere }),
    prisma.payment.findMany({
      where: paymentWhere,
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            patientName: true,
            finalAmount: true,
            customer: {
              select: {
                corporateId: true,
                corporate: { select: { companyName: true } },
              },
            },
          },
        },
      },
      orderBy: { paymentDate: 'desc' },
      skip,
      take: limit,
    }),
    prisma.paymentRefund.findMany({
      where: refundWhere,
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            patientName: true,
            customer: {
              select: {
                corporateId: true,
                corporate: { select: { companyName: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.corporate.findMany({
      where: { isActive: true },
      select: {
        id: true,
        companyName: true,
        _count: { select: { employees: true } },
      },
      orderBy: { companyName: 'asc' },
      take: 100,
    }),
  ]);

  const totalCollected = money(paymentsTotalAgg._sum.amount);
  const totalRefunded = money(refundsTotalAgg._sum.amount);
  const netRevenue = totalCollected - totalRefunded;
  const totalBilling = money(orderTotalAgg?._sum?.finalAmount);
  const outstanding = Math.max(0, totalBilling - netRevenue);

  const corporateSummaries = await Promise.all(
    corporates.map(async (corp) => {
      const [corpBilledAgg, corpCollectedAgg, corpRefundedAgg] = await Promise.all([
        prisma.order.aggregate({
          where: { ...orderRangeWhere, customer: { corporateId: corp.id } },
          _sum: { finalAmount: true },
        }),
        prisma.payment.aggregate({
          where: { paymentDate: { gte: start, lte: end }, order: { customer: { corporateId: corp.id } } },
          _sum: { amount: true },
        }),
        prisma.paymentRefund.aggregate({
          where: { createdAt: { gte: start, lte: end }, status: 'PROCESSED', order: { customer: { corporateId: corp.id } } },
          _sum: { amount: true },
        }),
      ]);

      const billed = money(corpBilledAgg?._sum?.finalAmount);
      const collected = money(corpCollectedAgg?._sum?.amount);
      const refunded = money(corpRefundedAgg?._sum?.amount);
      return {
        corporateId: corp.id,
        companyName: corp.companyName,
        employees: corp._count.employees,
        billed,
        collected,
        refunded,
        outstanding: Math.max(0, billed - (collected - refunded)),
      };
    })
  );

  corporateSummaries.sort((a, b) => b.outstanding - a.outstanding);

  return {
    summary: {
      totalCollected,
      totalRefunded,
      netRevenue,
      totalBilling,
      outstanding,
      corporateBilling: money(corporateBilledAgg?._sum?.finalAmount),
      generalBilling: money(userBilledAgg?._sum?.finalAmount),
      corporateCollected: money(corporateCollectedAgg?._sum?.amount),
      generalCollected: money(generalCollectedAgg?._sum?.amount),
      outstandingOrdersCount,
    },
    filters: {
      from: start.toISOString(),
      to: end.toISOString(),
      query,
      page,
      limit,
    },
    paymentsPagination: {
      page,
      limit,
      total: paymentsCount,
      pages: Math.max(1, Math.ceil(paymentsCount / limit)),
    },
    refundsPagination: {
      page,
      limit,
      total: refundsCount,
      pages: Math.max(1, Math.ceil(refundsCount / limit)),
    },
    payments: payments.map((p) => ({
      id: p.id,
      orderId: p.orderId,
      orderNumber: p.order?.orderNumber || '',
      patientName: p.order?.patientName || '',
      amount: money(p.amount),
      method: p.method,
      status: p.status,
      paymentType: p.paymentType,
      transactionId: p.transactionId,
      notes: p.notes,
      paymentDate: p.paymentDate.toISOString(),
      corporateName: p.order?.customer?.corporate?.companyName || null,
      isCorporate: Boolean(p.order?.customer?.corporateId),
    })),
    refunds: refunds.map((r) => ({
      id: r.id,
      orderId: r.orderId,
      orderNumber: r.order?.orderNumber || '',
      patientName: r.order?.patientName || '',
      amount: money(r.amount),
      reason: r.reason,
      mode: r.mode,
      status: r.status,
      transactionId: r.transactionId,
      notes: r.notes,
      createdAt: r.createdAt.toISOString(),
      processedAt: r.processedAt ? r.processedAt.toISOString() : null,
      corporateName: r.order?.customer?.corporate?.companyName || null,
      isCorporate: Boolean(r.order?.customer?.corporateId),
    })),
    corporateSummaries,
  };
}

export async function getCorporateFinanceOverviewAction(corporateId: number, filters?: { from?: string; to?: string }) {
  await requireAdmin({ roles: [...FINANCE_ROLES] });
  const corpId = Number(corporateId);
  if (!corpId) return null;

  const corp = await prisma.corporate.findUnique({
    where: { id: corpId },
    select: { id: true, companyName: true, isActive: true },
  });
  if (!corp) return null;

  const { start, end } = toDateRange(filters?.from, filters?.to);

  const billableOrders = await getCorporateBillableOrders({
    corporateId: corpId,
    start,
    end
  });
  const billed = billableOrders.reduce((sum, row) => sum + Number(row.unitPrice || 0), 0);
  const billableOrderIds = billableOrders.map((row) => row.orderId);

  const [paymentsAgg, refundsAgg, payments, refunds] = await Promise.all([
    billableOrderIds.length
      ? prisma.payment.aggregate({
          where: {
            paymentDate: { gte: start, lte: end },
            orderId: { in: billableOrderIds },
          },
          _sum: { amount: true },
        })
      : Promise.resolve({ _sum: { amount: 0 } as any }),
    billableOrderIds.length
      ? prisma.paymentRefund.aggregate({
          where: {
            createdAt: { gte: start, lte: end },
            status: 'PROCESSED',
            orderId: { in: billableOrderIds },
          },
          _sum: { amount: true },
        })
      : Promise.resolve({ _sum: { amount: 0 } as any }),
    billableOrderIds.length
      ? prisma.payment.findMany({
          where: {
            paymentDate: { gte: start, lte: end },
            orderId: { in: billableOrderIds },
          },
          select: {
            id: true,
            orderId: true,
            amount: true,
            method: true,
            status: true,
            transactionId: true,
            paymentDate: true,
          },
          orderBy: { paymentDate: 'desc' },
          take: 100,
        })
      : Promise.resolve([]),
    billableOrderIds.length
      ? prisma.paymentRefund.findMany({
          where: {
            createdAt: { gte: start, lte: end },
            orderId: { in: billableOrderIds },
          },
          select: {
            id: true,
            orderId: true,
            amount: true,
            reason: true,
            status: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 100,
        })
      : Promise.resolve([]),
  ]);

  const paid = money(paymentsAgg._sum.amount);
  const refunded = money(refundsAgg._sum.amount);
  const net = paid - refunded;

  return {
    corporate: corp,
    summary: {
      billed,
      paid,
      refunded,
      netCollected: net,
      outstanding: Math.max(0, billed - net),
    },
    orders: billableOrders.map((o) => ({
      id: o.orderId,
      orderNumber: o.orderNumber,
      patientName: o.employeeName,
      finalAmount: money(o.unitPrice),
      paymentStatus: o.paymentStatus,
      status: o.status,
      createdAt: o.bookedAt,
      completedAt: o.completedAt,
      packageName: o.packageName,
    })),
    payments: payments.map((p) => ({
      ...p,
      amount: money(p.amount),
      paymentDate: p.paymentDate.toISOString(),
    })),
    refunds: refunds.map((r) => ({
      ...r,
      amount: money(r.amount),
      createdAt: r.createdAt.toISOString(),
    })),
  };
}

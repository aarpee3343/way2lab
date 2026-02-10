'use server';

import { requireAdmin } from '@/lib/admin-auth';

import { prisma } from '@/lib/db';
import { OrderStatus } from '@prisma/client';

export async function getAdminDashboardStats() {
  await requireAdmin({ roles: ['SUPER_ADMIN'] });
  /* ---------------- CHART (LAST 7 DAYS) ---------------- */

  let chartData: { d: Date; c: number }[] = [];

  try {
    chartData = await prisma.$queryRawUnsafe<
      { d: Date; c: number }[]
    >(`
      SELECT
        d::date AS d,
        COUNT(o.id)::int AS c
      FROM generate_series(
        CURRENT_DATE - INTERVAL '6 days',
        CURRENT_DATE,
        INTERVAL '1 day'
      ) d
      LEFT JOIN orders o
        ON DATE(o.created_at) = d
      GROUP BY d
      ORDER BY d ASC
    `);
  } catch (err) {
    console.error('Dashboard chart query failed:', err);
  }

  /* ---------------- STATS ---------------- */

  let totalOrders = 0;
  let todayOrders = 0;
  let pendingOrders = 0;
  let completedOrders = 0;
  let totalCollected = 0;
  let totalRefunded = 0;
  let netRevenue = 0;
  let outstanding = 0;

  try {
    const [ordersAgg, paymentsAgg, refundsAgg] = await Promise.all([
      Promise.all([
      prisma.order.count(),

      prisma.order.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      }),

      prisma.order.count({
        where: {
          status: {
            in: [
              OrderStatus.PENDING,
              OrderStatus.PROCESSING,
              OrderStatus.PARTIAL_COMPLETED
            ]
          }
        }
      }),

      prisma.order.count({
        where: {
          status: OrderStatus.COMPLETED
        }
      })
      ]),
      prisma.payment.aggregate({
        _sum: { amount: true }
      }),
      prisma.paymentRefund.aggregate({
        where: { status: 'PROCESSED' },
        _sum: { amount: true }
      })
    ]);

    [totalOrders, todayOrders, pendingOrders, completedOrders] = ordersAgg;
    totalCollected = Number(paymentsAgg._sum.amount ?? 0);
    totalRefunded = Number(refundsAgg._sum.amount ?? 0);
    netRevenue = totalCollected - totalRefunded;

    const billedAgg = await prisma.order.aggregate({
      where: { status: { notIn: [OrderStatus.CANCELLED, OrderStatus.REJECTED] } },
      _sum: { finalAmount: true }
    });
    const totalBilled = Number(billedAgg._sum.finalAmount ?? 0);
    outstanding = Math.max(0, totalBilled - netRevenue);
  } catch (err) {
    console.error('Dashboard stats query failed:', err);
  }

  /* ---------------- FINAL SHAPE ---------------- */

  return {
    chartData,
    totalOrders,
    todayOrders,
    pendingOrders,
    completedOrders,
    totalCollected,
    totalRefunded,
    netRevenue,
    outstanding
  };
}

export async function getAdminOrderCount() {
  await requireAdmin({ roles: ['SUPER_ADMIN'] });
  try {
    return await prisma.order.count();
  } catch {
    return 0;
  }
}

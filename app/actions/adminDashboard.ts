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

  const [
    totalOrders,
    todayOrders,
    pendingOrders,
    completedOrders
  ] = await Promise.all([
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
  ]);

  /* ---------------- FINAL SHAPE ---------------- */

  return {
    chartData,
    totalOrders,
    todayOrders,
    pendingOrders,
    completedOrders
  };
}

export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function GET(req: Request) {
  // 1. Authentication Check
  const user = await getAuthUser(req);
  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const userId = user.id;

    // 2. Fetch All Data in Parallel (Fastest)
    const [
      totalOrders, 
      pendingOrders, 
      homeCollection, 
      familyMembers, 
      recentOrders, 
      latestCompletedOrder, 
      members
    ] = await Promise.all([
      // Stats
      prisma.order.count({ where: { userId } }),
      prisma.order.count({ where: { userId, status: 'PENDING' } }),
      prisma.order.count({ where: { userId, collectionType: 'home_collection' } }),
      prisma.familyMember.count({ where: { customerId: userId } }),

      // Recent Orders (Limit 5)
      prisma.order.findMany({
        where: { userId },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { 
          lab: { select: { labName: true } } 
        }
      }),

      // 🌟 AI Widget Data: Latest Completed Order
      // Matches your old backend logic
      prisma.order.findFirst({
        where: { 
          userId, 
          status: 'COMPLETED'
        },
        orderBy: { createdAt: 'desc' },
        include: {
          items: true,
          lab: { select: { labName: true } },
          // Uncomment the line below ONLY if you have added the 'ReportSummary' model to your schema
          // reportSummary: true 
        }
      }),

      // Recent Family Members (Limit 3)
      prisma.familyMember.findMany({
        where: { customerId: userId },
        take: 3,
        orderBy: { id: 'desc' }
      })
    ]);

    // 3. Format Response
    const formattedOrders = recentOrders.map(o => ({
      ...o,
      labName: o.lab?.labName || 'Unknown Lab'
    }));

    // 4. Return JSON
    return NextResponse.json({
      stats: {
        totalOrders,
        pendingOrders,
        homeCollection,
        familyMembers
      },
      recentOrders: formattedOrders,
      latestCompletedOrder,
      members
    });

  } catch (error) {
    console.error("Dashboard API Error:", error);
    return NextResponse.json(
      { message: 'Error fetching dashboard data' }, 
      { status: 500 }
    );
  }
}
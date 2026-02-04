export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function GET(req: Request) {
  const user = await getAuthUser(req);
  if (!user) {
    return NextResponse.json(
      { message: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const corporateId = user.corporateId ?? null;
    const corporateServices = corporateId
      ? await prisma.corporateService.findMany({
          where: { corporateId, isActive: true },
          select: {
            packageId: true,
            couponId: true,
            reportVisibilityOverride: true,
            package: { select: { isPreEmployment: true, reportVisibility: true } }
          }
        })
      : [];

    const policyByPackageId = new Map<number, 'USER_ONLY' | 'CORPORATE_ONLY' | 'BOTH'>();
    corporateServices.forEach((s) => {
      if (!s.packageId) return;
      const policy = s.package?.isPreEmployment
        ? 'CORPORATE_ONLY'
        : (s.reportVisibilityOverride || s.package?.reportVisibility || 'USER_ONLY');
      policyByPackageId.set(s.packageId, policy as any);
    });

    const reports = await prisma.order.findMany({
      where: {
        userId: user.id,
        
        // ✅ 1. Only fetch orders that actually have reports uploaded
        // This covers both 'COMPLETED' and 'PARTIAL' status automatically
        reports: {
          some: {} 
        },

        // ✅ 2. Exclude pre-employment packages (users should not see them)
        OR: [
          { packageId: null },
          { package: { isPreEmployment: false } }
        ]
      },
      // ✅ 3. Select specific fields (No prices, just names/details)
      select: {
        id: true,
        orderNumber: true,
        status: true, // Needed for the 'Partial' vs 'Completed' badge logic
        createdAt: true,
        packageId: true,
        isReportSharedWithCorp: true,

        // Patient Snapshot
        patientName: true,
        patientDob: true,
        patientGender: true,
        patientRelation: true,
        patientUHID: true,

        // Lab Details
        lab: {
          select: { 
            labName: true,
            address: true 
          }
        },

        package: {
          select: { isPreEmployment: true, reportVisibility: true }
        },

        // Items: Name only (No Price)
        items: {
          select: {
            itemName: true,
            itemType: true
          }
        },

        // Report Files metadata
        reports: {
          select: {
            id: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const enriched = reports.map((order) => {
      let policy: 'USER_ONLY' | 'CORPORATE_ONLY' | 'BOTH' = 'USER_ONLY';
      if (order.package?.isPreEmployment) {
        policy = 'CORPORATE_ONLY';
      } else if (order.packageId) {
        policy =
          policyByPackageId.get(order.packageId) ||
          order.package?.reportVisibility ||
          'USER_ONLY';
      }
      const canShare = Boolean(corporateId) && policy === 'USER_ONLY';
      return {
        ...order,
        sharePolicy: policy,
        canShare
      };
    });

    return NextResponse.json(enriched);
  } catch (error) {
    console.error('Fetch Reports Error:', error);
    return NextResponse.json(
      { message: 'Error fetching reports' },
      { status: 500 }
    );
  }
}

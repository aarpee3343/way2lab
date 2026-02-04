export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { OrderStatus } from '@prisma/client';

export async function GET(req: Request) {
  // 1. Get the logged-in user's basic info (ID)
  const sessionUser = await getAuthUser(req);
  
  if (!sessionUser || !sessionUser.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 2. FETCH FRESH DATA FROM DB
    // We re-fetch the user to ensure we have the latest corporateId
    // (This fixes the issue where the session might be stale or missing the field)
    const dbUser = await prisma.customer.findUnique({
        where: { id: Number(sessionUser.id) },
        select: { corporateId: true }
    });

    if (!dbUser || !dbUser.corporateId) {
        return NextResponse.json({ message: 'Not a corporate employee' }, { status: 401 });
    }

    const now = new Date();

    // 3. Fetch services assigned to this corporate
    const benefits = await prisma.corporateService.findMany({
      where: {
        corporateId: dbUser.corporateId, // Use the ID from DB
        isActive: true,
        validTill: { gte: now }, // Not expired
        validFrom: { lte: now }, // Already started
        packageId: { not: null } // We only want packages here
      },
      include: {
        package: {
          include: {
            labs: {
              take: 1, // Get at least one default lab for the package
              include: { lab: true }
            }
          }
        }
      }
    });

    // 4. Format for the frontend + enforce eligibility/limits
    const formatted = await Promise.all(
      benefits.map(async (b) => {
        if (!b.package?.id) return null;
        const packageId = b.package.id;
        const corporateId = dbUser.corporateId!;

        // If any employee-specific assignments exist for this package,
        // only those employees are eligible.
        const assignmentCount = await prisma.employeePackage.count({
          where: {
            packageId,
            customer: { corporateId }
          }
        });

        if (assignmentCount > 0) {
          const assigned = await prisma.employeePackage.findFirst({
            where: { packageId, customerId: Number(sessionUser.id) }
          });
          if (!assigned) return null;
        }

        const [selfUsed, familyUsed] = await Promise.all([
          prisma.order.count({
            where: {
              userId: Number(sessionUser.id),
              packageId,
              patientType: 'self',
              status: { notIn: [OrderStatus.CANCELLED, OrderStatus.REJECTED] }
            }
          }),
          prisma.order.count({
            where: {
              userId: Number(sessionUser.id),
              packageId,
              patientType: 'family',
              status: { notIn: [OrderStatus.CANCELLED, OrderStatus.REJECTED] }
            }
          })
        ]);

        const selfLimit = Number(b.selfUsageLimit || 0);
        const familyLimit = Number(b.familyUsageLimit || 0);
        const selfRemaining = selfLimit > 0 ? Math.max(0, selfLimit - selfUsed) : 0;
        const familyRemaining = familyLimit > 0 ? Math.max(0, familyLimit - familyUsed) : 0;

        return {
          id: packageId,
          serviceId: b.id,
          packageName: b.package?.packageName,
          category: b.package?.category,
          validTill: b.validTill,
          selfPaymentType: b.selfPaymentType,
          familyPaymentType: b.familyPaymentType,
          selfUsageLimit: selfLimit,
          familyUsageLimit: familyLimit,
          selfRemaining,
          familyRemaining,
          eligibleSelf: selfRemaining > 0,
          eligibleFamily: familyRemaining > 0,
          // Pass the first available lab as default for "Claim" logic
          defaultLab: b.package?.labs[0]?.lab || null,
          labPrice: Number(b.package?.labs[0]?.price || b.package?.price || 0),
          labDiscount: Number(b.package?.labs[0]?.discount || 0),
          labSellingPrice: Math.round(
            Number(b.package?.labs[0]?.price || b.package?.price || 0) *
              (1 - Number(b.package?.labs[0]?.discount || 0) / 100)
          ),
          originalPrice: Number(b.package?.price || 0)
        };
      })
    );

    return NextResponse.json(formatted.filter(Boolean));
  } catch (error) {
    console.error("Benefits API Error:", error);
    return NextResponse.json({ message: 'Error fetching benefits' }, { status: 500 });
  }
}

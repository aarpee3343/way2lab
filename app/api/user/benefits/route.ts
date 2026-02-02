export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function GET(req: Request) {
  const user = await getAuthUser(req);
  if (!user || !user.corporateId) {
    return NextResponse.json({ message: 'Unauthorized or not a corporate employee' }, { status: 401 });
  }

  try {
    const now = new Date();

    // Fetch services assigned to this user's corporate
    const benefits = await prisma.corporateService.findMany({
      where: {
        corporateId: user.corporateId,
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

    // Format for the frontend
    const formatted = benefits.map(b => ({
      id: b.package?.id,
      packageName: b.package?.packageName,
      category: b.package?.category,
      validTill: b.validTill,
      paymentType: b.selfPaymentType,
      // Pass the first available lab as default for "Claim" logic
      defaultLab: b.package?.labs[0]?.lab || null,
      originalPrice: Number(b.package?.price || 0)
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Benefits API Error:", error);
    return NextResponse.json({ message: 'Error fetching benefits' }, { status: 500 });
  }
}
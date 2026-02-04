export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

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

    // 4. Format for the frontend
    const formatted = benefits.map(b => ({
      id: b.package?.id,
      packageName: b.package?.packageName,
      category: b.package?.category,
      validTill: b.validTill,
      paymentType: b.selfPaymentType,
      // Pass the first available lab as default for "Claim" logic
      defaultLab: b.package?.labs[0]?.lab || null,
      labPrice: Number(b.package?.labs[0]?.price || b.package?.price || 0),
      labDiscount: Number(b.package?.labs[0]?.discount || 0),
      labSellingPrice: Math.round(
        Number(b.package?.labs[0]?.price || b.package?.price || 0) *
          (1 - Number(b.package?.labs[0]?.discount || 0) / 100)
      ),
      originalPrice: Number(b.package?.price || 0)
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Benefits API Error:", error);
    return NextResponse.json({ message: 'Error fetching benefits' }, { status: 500 });
  }
}

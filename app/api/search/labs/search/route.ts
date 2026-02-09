export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { safeData } from '@/lib/utils';
import { getAuthUser } from '@/lib/auth';

// Helper: Calculate Distance
function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; 
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat1)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; 
}

function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}

export async function POST(req: Request) {
  try {
    const user = await getAuthUser(req);
    let corporateId = user?.corporateId ?? null;

    if (user?.id && corporateId == null) {
      const dbUser = await prisma.customer.findUnique({
        where: { id: user.id },
        select: { corporateId: true }
      });
      corporateId = dbUser?.corporateId ?? null;
    }

    const { items, pincode, userLat, userLng } = await req.json();

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "No items selected" }, { status: 400 });
    }

    // 1. Find Labs in Pincode
    const labsInArea = await prisma.labPincode.findMany({
      where: { pincode: String(pincode) },
      include: { lab: true }
    });

    if (labsInArea.length === 0) return NextResponse.json([]);

    // 2. Process Labs
    const results = await Promise.all(labsInArea.map(async ({ lab }) => {
      let finalTotal = 0;
      let baseTotal = 0;
      const foundItems: any[] = [];
      const missingItems: any[] = [];

      for (const item of items) {
        let basePrice = 0;
        let discount = 0;
        let sellingPrice = 0;
        let found = false;
        let labItemId = null;
        let isCorporate = false;

        if (item.type === 'test') {
          const lt = await prisma.labTest.findFirst({
            where: { labId: lab.id, testId: Number(item.id), available: true }
          });
          if (lt) {
            basePrice = Number(lt.price);
            discount = Number(lt.discount);
            labItemId = lt.id;
            found = true;
          }
        } else if (item.type === 'package') {
          const lp = await prisma.labPackage.findFirst({
            where: { labId: lab.id, packageId: Number(item.id), available: true, package: { isActive: true } },
            include: {
              package: { select: { isCorporate: true, corporateId: true } }
            }
          });
          if (lp) {
            const pkg = lp.package;
            const isCorporatePackage = Boolean(pkg?.isCorporate);
            const isAllowed = !isCorporatePackage || (corporateId && pkg?.corporateId === corporateId);
            if (isAllowed) {
              basePrice = Number(lp.price);
              discount = Number(lp.discount);
              labItemId = lp.id;
              found = true;
              isCorporate = isCorporatePackage;
            }
          }          
        }

        if (found) {
          sellingPrice = Math.round(basePrice * (1 - discount / 100));
          finalTotal += sellingPrice;
          baseTotal += basePrice;
          foundItems.push({ 
            id: item.id,
            type: item.type,
            name: item.name,
            labItemPrice: sellingPrice,
            labItemMRP: basePrice,
            labItemDiscount: discount,
            labItemId,
            isCorporate
          });
        } else {
          missingItems.push(item);
        }
      }

      // If no items found at this lab, return null (to be filtered out later)
      // ✅ FIX 1: Early exit if no items match
      if (foundItems.length === 0) return null;

      const totalDiscount = baseTotal > 0 
        ? Math.round(((baseTotal - finalTotal) / baseTotal) * 100) 
        : 0;

      // 3. Calculate Distance
      let distanceStr = 'N/A';
      if (userLat && userLng && lab.latitude && lab.longitude) {
        const distKm = getDistanceFromLatLonInKm(
          Number(userLat), Number(userLng),
          Number(lab.latitude), Number(lab.longitude)
        );
        distanceStr = `${distKm.toFixed(1)} km`;
      }

      return {
        lab: {
          id: lab.id,
          labName: lab.labName,
          rating: Number(lab.rating) || 4.5,
          reviews: lab.reviewCount || 0,
          features: lab.features ? JSON.parse(JSON.stringify(lab.features)) : [],
          timings: lab.timings ? JSON.parse(JSON.stringify(lab.timings)) : "08:00 - 20:00",
          distance: distanceStr,
          accreditation: 'NABL',
          homeCollectionCharges: Number(lab.homeCollectionCharges)
        },
        totalPrice: finalTotal,
        totalBasePrice: baseTotal,
        totalDiscount: totalDiscount,
        foundItems,
        missingItems,
        isFullMatch: missingItems.length === 0
      };
    }));

    // ✅ FIX 2: Filter out nulls (labs with 0 matching items)
    const validResults = results.filter(r => r !== null);

    // Sort: Full Match first, then Cheapest
    const sorted = validResults.sort((a: any, b: any) => {
      if (a.isFullMatch !== b.isFullMatch) return a.isFullMatch ? -1 : 1;
      return a.totalPrice - b.totalPrice;
    });

    return NextResponse.json(safeData(sorted));

  } catch (error) {
    console.error("Lab Search Error:", error);
    return NextResponse.json({ error: "Failed to compare labs" }, { status: 500 });
  }
}

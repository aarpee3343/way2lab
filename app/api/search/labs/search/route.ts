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

    const normalizedItems = (items as any[])
      .map((item) => ({
        id: Number(item.id),
        type: item.type === 'package' ? 'package' : 'test',
        name: String(item.name || ''),
      }))
      .filter((item) => Number.isFinite(item.id));

    const labIds = labsInArea.map(({ lab }) => lab.id);
    const requestedTestIds = Array.from(new Set(normalizedItems.filter((i) => i.type === 'test').map((i) => i.id)));
    const requestedPackageIds = Array.from(new Set(normalizedItems.filter((i) => i.type === 'package').map((i) => i.id)));

    const [labTests, labPackages] = await Promise.all([
      requestedTestIds.length
        ? prisma.labTest.findMany({
            where: {
              labId: { in: labIds },
              testId: { in: requestedTestIds },
              available: true,
            },
            select: {
              id: true,
              labId: true,
              testId: true,
              price: true,
              discount: true,
            },
          })
        : Promise.resolve([]),
      requestedPackageIds.length
        ? prisma.labPackage.findMany({
            where: {
              labId: { in: labIds },
              packageId: { in: requestedPackageIds },
              available: true,
              package: { isActive: true },
            },
            select: {
              id: true,
              labId: true,
              packageId: true,
              price: true,
              discount: true,
              package: {
                select: {
                  isCorporate: true,
                  corporateId: true,
                },
              },
            },
          })
        : Promise.resolve([]),
    ]);

    const testMap = new Map<string, { id: number; price: number; discount: number }>();
    for (const row of labTests) {
      testMap.set(`${row.labId}:${row.testId}`, {
        id: row.id,
        price: Number(row.price),
        discount: Number(row.discount || 0),
      });
    }

    const packageMap = new Map<
      string,
      { id: number; price: number; discount: number; isCorporate: boolean; corporateId: number | null }
    >();
    for (const row of labPackages) {
      packageMap.set(`${row.labId}:${row.packageId}`, {
        id: row.id,
        price: Number(row.price),
        discount: Number(row.discount || 0),
        isCorporate: Boolean(row.package?.isCorporate),
        corporateId: row.package?.corporateId ?? null,
      });
    }

    // 2. Process Labs
    const results = labsInArea.map(({ lab }) => {
      let finalTotal = 0;
      let baseTotal = 0;
      const foundItems: any[] = [];
      const missingItems: any[] = [];

      for (const item of normalizedItems) {
        let basePrice = 0;
        let discount = 0;
        let sellingPrice = 0;
        let found = false;
        let labItemId = null;
        let isCorporate = false;

        if (item.type === 'test') {
          const lt = testMap.get(`${lab.id}:${item.id}`);
          if (lt) {
            basePrice = lt.price;
            discount = lt.discount;
            labItemId = lt.id;
            found = true;
          }
        } else if (item.type === 'package') {
          const lp = packageMap.get(`${lab.id}:${item.id}`);
          if (lp) {
            const isCorporatePackage = lp.isCorporate;
            const isAllowed = !isCorporatePackage || (corporateId && lp.corporateId === corporateId);
            if (isAllowed) {
              basePrice = lp.price;
              discount = lp.discount;
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
    });

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

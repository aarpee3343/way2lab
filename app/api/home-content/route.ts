export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { safeData } from '@/lib/utils';

export async function GET() {
  try {
    // 1. Fetch Popular Tests (Marked showOnHomepage = true)
    const popularTests = await prisma.test.findMany({
      where: { 
        showOnHomepage: true, 
        isActive: true 
      },
      take: 8,
      orderBy: { createdAt: 'desc' }
    });

    // 2. Fetch Packages (Marked showOnHomepage = true)
    // We select the 'tag' field now, so no need to fake it!
    const packages = await prisma.package.findMany({
      where: { 
        showOnHomepage: true, 
        isActive: true 
      },
      take: 4,
      orderBy: { price: 'asc' } // Or order by priority if you add a priority field
    });

    return NextResponse.json(safeData({
      popularTests,
      packages
    }));

  } catch (error) {
    console.error("Home Data Error:", error);
    return NextResponse.json({ popularTests: [], packages: [] });
  }
}
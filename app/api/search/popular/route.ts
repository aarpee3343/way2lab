export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const popularTests = await prisma.test.findMany({
      where: { isActive: true, showOnHomepage: true },
      take: 5
    });
    
    const formatted = popularTests.map(t => ({
      id: t.id,
      type: 'test',
      name: t.testName,
      price: Number(t.price),
      discount: Number(t.discount || 0)
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch popular items" }, { status: 500 });
  }
}
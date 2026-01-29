export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { safeData } from '@/lib/utils'; // 1. Import Here

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('query') || searchParams.get('q');

  if (!query || query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    const tests = await prisma.test.findMany({
      where: {
        testName: { contains: query, mode: 'insensitive' },
        isActive: true
      },
      take: 5
    });

    const packages = await prisma.package.findMany({
      where: {
        packageName: { contains: query, mode: 'insensitive' },
        isActive: true
      },
      take: 5
    });

    const results = [
      ...tests.map(t => ({
        id: t.id,
        name: t.testName,
        type: 'test',
        price: Number(t.price),
        discount: Number(t.discount || 0),
        description: t.category
      })),
      ...packages.map(p => ({
        id: p.id,
        name: p.packageName,
        type: 'package',
        price: Number(p.price),
        discount: Number(p.discount || 0),
        description: 'Health Package'
      }))
    ];

    // 2. Wrap response in safeData()
    return NextResponse.json(safeData({ 
      results,
      isSmartMatch: false 
    }));

  } catch (error) {
    console.error("Search Error:", error);
    return NextResponse.json({ results: [] });
  }
}
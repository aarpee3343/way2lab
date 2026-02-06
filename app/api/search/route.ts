export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { safeData } from '@/lib/utils';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('query') || searchParams.get('q');

  if (!query || query.length < 2) {
    return NextResponse.json(safeData({ results: [], isSmartMatch: false }));
  }

  try {
    /* -------------------- TEST SEARCH -------------------- */
    const tests = await prisma.test.findMany({
      where: {
        testName: { contains: query, mode: 'insensitive' },
        isActive: true,
      },
      take: 5,
    });

    /* ------------------ PACKAGE SEARCH ------------------- */
    const packageWhere: any = {
      isActive: true,
      isCorporate: false,
      packageName: { contains: query, mode: 'insensitive' },
    };

    const packages = await prisma.package.findMany({
      where: packageWhere,
      take: 5,
    });

    /* ------------------ MERGED RESULTS ------------------- */
    const results = [
      ...tests.map(t => ({
        id: t.id,
        name: t.testName,
        type: 'test',
        price: Number(t.price),
        discount: Number(t.discount || 0),
        description: t.category,
        isCorporate: false,
      })),
      ...packages.map(p => ({
        id: p.id,
        name: p.packageName,
        type: 'package',
        price: Number(p.price),
        discount: Number(p.discount || 0),
        description: 'Health Package',
        isCorporate: Boolean(p.isCorporate),
      })),
    ];

    return NextResponse.json(
      safeData({
        results,
        isSmartMatch: false,
      })
    );
  } catch (error) {
    console.error('Search Error:', error);
    return NextResponse.json(
      safeData({ results: [], isSmartMatch: false })
    );
  }
}


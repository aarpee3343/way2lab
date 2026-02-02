import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [tests, packages] = await Promise.all([
      // Fetch only active tests, minimal fields
      prisma.test.findMany({
        where: { isActive: true },
        select: { id: true, testName: true, description: true, price: true }
      }),
      // Fetch only active packages
      prisma.package.findMany({
        where: { isActive: true },
        select: { id: true, packageName: true, description: true, price: true }
      })
    ]);

    // Combine and format for the frontend index
    const index = [
      ...packages.map(p => ({
        id: p.id,
        name: p.packageName,
        type: 'package',
        price: Number(p.price),
        searchStr: p.packageName.toLowerCase() // Pre-compute lowercase for faster filtering
      })),
      ...tests.map(t => ({
        id: t.id,
        name: t.testName,
        type: 'test',
        price: Number(t.price),
        searchStr: t.testName.toLowerCase()
      }))
    ];

    return NextResponse.json(index);
  } catch (error) {
    return NextResponse.json([], { status: 500 });
  }
}
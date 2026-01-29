export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { safeData } from '@/lib/utils';

export async function GET(req: Request) {
  try {
    const packages = await prisma.package.findMany({
      where: { isActive: true },
      include: {
        tests: true // We need to count tests
      },
      orderBy: { createdAt: 'desc' }
    });

    const formatted = packages.map(pkg => ({
      ...pkg,
      testCount: pkg.tests.length
    }));

    return NextResponse.json(safeData(formatted));

  } catch (error) {
    return NextResponse.json({ message: "Server Error" }, { status: 500 });
  }
}
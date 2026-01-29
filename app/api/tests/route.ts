export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { safeData } from '@/lib/utils';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');
  const search = searchParams.get('search');
  const sort = searchParams.get('sort') || 'testName'; // name, price
  const order = searchParams.get('order') || 'asc'; // asc, desc
  const page = parseInt(searchParams.get('page') || '1');
  const limit = 12;
  const skip = (page - 1) * limit;

  try {
    const where: any = { isActive: true };

    if (category) {
      where.category = { equals: category, mode: 'insensitive' };
    }

    if (search) {
      where.OR = [
        { testName: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Determine Order By object
    let orderBy: any = {};
    if (sort === 'price') orderBy.price = order;
    else orderBy.testName = order;

    const [tests, total] = await Promise.all([
      prisma.test.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        select: {
          id: true,
          testName: true,
          category: true,
          price: true,
          discount: true,
          description: true,
          slug: true,
          scheduleReporting: true
        }
      }),
      prisma.test.count({ where })
    ]);

    return NextResponse.json(safeData({
      tests,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    }));

  } catch (error) {
    return NextResponse.json({ tests: [], pagination: { total: 0, page: 1, totalPages: 0 } });
  }
}
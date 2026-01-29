export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');

  try {
    const where: any = { status: 'APPROVED' };
    if (category && category !== 'All') {
      where.category = category;
    }

    const blogs = await prisma.blogPost.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 20 // Pagination limit
    });

    return NextResponse.json(blogs);
  } catch (error) {
    return NextResponse.json({ error: 'Error fetching blogs' }, { status: 500 });
  }
}
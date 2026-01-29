export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { safeData } from '@/lib/utils';

// ✅ FIX: Type definition for Next.js 15 params
export async function GET(
  req: Request,
  props: { params: Promise<{ slug: string }> }
) {
  try {
    // ✅ FIX: Await the params before accessing slug
    const params = await props.params;
    const { slug } = params;

    // If slug is numeric, assume it's an ID
    const isId = /^\d+$/.test(slug);
    
    const test = await prisma.test.findFirst({
      where: {
        isActive: true,
        OR: [
          { slug: slug },
          ...(isId ? [{ id: parseInt(slug) }] : []),
          // Fallback search by name if slug fails
          { testName: { equals: decodeURIComponent(slug), mode: 'insensitive' } } 
        ]
      },
      // Include related data if needed
      include: {
        labTests: {
           where: { available: true },
           take: 1,
           select: { price: true, discount: true }
        }
      }
    });

    if (!test) {
      return NextResponse.json({ message: "Test not found" }, { status: 404 });
    }

    return NextResponse.json(safeData(test));

  } catch (error) {
    console.error("Test Detail Error:", error);
    return NextResponse.json({ message: "Server Error" }, { status: 500 });
  }
}
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { safeData } from '@/lib/utils';

export async function GET(
  req: Request, 
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const pkgId = parseInt(params.id);

    const pkg = await prisma.package.findUnique({
      where: { id: pkgId },
      include: {
        tests: {
          include: {
            test: {
              select: { testName: true, category: true }
            }
          }
        }
      }
    });

    if (!pkg) {
      return NextResponse.json({ message: "Package not found" }, { status: 404 });
    }

    return NextResponse.json(safeData(pkg));

  } catch (error) {
    return NextResponse.json({ message: "Server Error" }, { status: 500 });
  }
}
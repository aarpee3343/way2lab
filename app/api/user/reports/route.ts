export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function GET(req: Request) {
  const user = await getAuthUser(req);
  if (!user) {
    return NextResponse.json(
      { message: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const reports = await prisma.order.findMany({
      where: {
        userId: user.id,
        status: 'COMPLETED',

        // ❌ Exclude Pre-Employment Checkup orders
        items: {
          none: {
            package: {
              category: 'Pre-Employment Checkup'
            }
          }
        }
      },
      include: {
        lab: {
          select: { labName: true }
        },
        items: true,
        reports: true // report file metadata
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(reports);
  } catch (error) {
    console.error('Fetch Reports Error:', error);
    return NextResponse.json(
      { message: 'Error fetching reports' },
      { status: 500 }
    );
  }
}

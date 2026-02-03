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
        
        // ✅ 1. Only fetch orders that actually have reports uploaded
        // This covers both 'COMPLETED' and 'PARTIAL' status automatically
        reports: {
          some: {} 
        },

        // ✅ 2. Your Existing Rule: Exclude Pre-Employment Checkup orders
        items: {
          none: {
            package: {
              category: 'Pre-Employment Checkup'
            }
          }
        }
      },
      // ✅ 3. Select specific fields (No prices, just names/details)
      select: {
        id: true,
        orderNumber: true,
        status: true, // Needed for the 'Partial' vs 'Completed' badge logic
        createdAt: true,

        // Patient Snapshot
        patientName: true,
        patientDob: true,
        patientGender: true,
        patientRelation: true,
        patientUHID: true,

        // Lab Details
        lab: {
          select: { 
            labName: true,
            address: true 
          }
        },

        // Items: Name only (No Price)
        items: {
          select: {
            itemName: true,
            itemType: true
          }
        },

        // Report Files metadata
        reports: {
          select: {
            id: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' }
        }
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
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const idParam = params.id;
  // Determine if searching by ID (int) or OrderNumber (string)
  const isNumeric = /^\d+$/.test(idParam);
  const isSafeIntId = isNumeric && idParam.length < 9;

  try {
    const order = await prisma.order.findFirst({
      where: {
        userId: user.id,
        OR: [
          { orderNumber: idParam },
          ...(isSafeIntId ? [{ id: Number(idParam) }] : [])
        ]
      },
      include: {
        items: true,
        address: true,
        technician: { select: { id: true, name: true, phone: true } },
        reports: {
           select: { id: true, reportType: true, createdAt: true },
           orderBy: { createdAt: 'desc' }
        },
        reportSummary: { select: { content: true, createdAt: true } },
        lab: { select: { id: true, labName: true, email: true, address: true, city: true, pincode: true, contactNo: true } },
        customer: { select: { id: true, name: true, email: true, phone: true } }
      }
    });

    if (!order) return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });

    // Format Reports URL
    // Note: We'll assume the report download API is /api/reports/[id]
    const reports = order.reports.map(r => ({
      ...r,
      downloadUrl: `/api/reports/${r.id}` 
    }));

    return NextResponse.json({
      ...order,
      reports,
      labName: order.lab?.labName ?? 'Unknown Lab'
    });

  } catch (error) {
    return NextResponse.json({ message: 'Error fetching order' }, { status: 500 });
  }
}
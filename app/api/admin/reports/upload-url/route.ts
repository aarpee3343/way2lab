import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { prisma } from '@/lib/db';
import { generateSignedUploadUrl } from '@/lib/gcs';

const sanitizeReportFileName = (name: string) => {
  const trimmed = (name || '').trim();
  if (!trimmed) return `report-${Date.now()}.pdf`;

  const safe = trimmed
    .replace(/[/\\?%*:|"<>]/g, '-')
    .replace(/\s+/g, ' ')
    .slice(0, 140);

  return safe.toLowerCase().endsWith('.pdf') ? safe : `${safe}.pdf`;
};

export async function POST(req: Request) {
  try {
    await requireAdmin({ roles: ['SUPER_ADMIN', 'ADMIN'] });

    const body = await req.json();
    const orderId = Number(body?.orderId);
    const type = String(body?.type || '').trim();
    const rawFileName = String(body?.fileName || '').trim();
    const rawFileType = String(body?.fileType || '').trim().toLowerCase();

    if (!orderId || !['PARTIAL', 'COMPLETED'].includes(type)) {
      return NextResponse.json({ message: 'Invalid upload payload' }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true }
    });

    if (!order) {
      return NextResponse.json({ message: 'Order not found' }, { status: 404 });
    }

    const safeFileName = sanitizeReportFileName(rawFileName);
    const isPdfByType = rawFileType === 'application/pdf';
    const isPdfByName = safeFileName.toLowerCase().endsWith('.pdf');
    if (!isPdfByType && !isPdfByName) {
      return NextResponse.json({ message: 'Only PDF reports are allowed' }, { status: 400 });
    }

    const tempPath = `tmp/report-uploads/order-${orderId}/${Date.now()}-${safeFileName}`;
    const uploadUrl = await generateSignedUploadUrl(tempPath, 'application/pdf', 20);

    return NextResponse.json({
      uploadUrl,
      tempPath,
      fileName: safeFileName
    });
  } catch (error) {
    console.error('Failed to create report upload URL:', error);
    return NextResponse.json({ message: 'Failed to prepare upload URL' }, { status: 500 });
  }
}

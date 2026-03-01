export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import PDFDocument from 'pdfkit';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';

function getRange(from?: string | null, to?: string | null) {
  const now = new Date();
  const start = from ? new Date(from) : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const end = to ? new Date(to) : now;
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function csvEscape(value: unknown) {
  const text = String(value ?? '');
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function fmtDate(value: Date | null | undefined) {
  if (!value) return '';
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Kolkata',
  }).format(value);
}

function toPdfBuffer(builder: (doc: PDFKit.PDFDocument) => void): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 36 });
    const chunks: Buffer[] = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', (e) => reject(e));
    builder(doc);
    doc.end();
  });
}

export async function GET(req: Request) {
  try {
    await requireAdmin({ roles: ['SUPER_ADMIN', 'ADMIN'] });
  } catch {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const format = String(searchParams.get('format') || 'csv').toLowerCase();
  const query = String(searchParams.get('query') || '').trim();
  const segment = String(searchParams.get('segment') || 'all').toLowerCase();
  const { start, end } = getRange(searchParams.get('from'), searchParams.get('to'));
  const orderSegmentWhere =
    segment === 'general'
      ? { customer: { corporateId: null } }
      : segment === 'corporate'
        ? { customer: { corporateId: { not: null } } }
        : {};

  const payments = await prisma.payment.findMany({
    where: {
      paymentDate: { gte: start, lte: end },
      ...(segment !== 'all' ? { order: orderSegmentWhere } : {}),
      ...(query
        ? {
            OR: [
              { transactionId: { contains: query, mode: 'insensitive' } },
              { method: { contains: query, mode: 'insensitive' } },
              { order: { orderNumber: { contains: query, mode: 'insensitive' } } },
              { order: { patientName: { contains: query, mode: 'insensitive' } } },
            ],
          }
        : {}),
    },
    include: {
      order: {
        select: {
          id: true,
          orderNumber: true,
          patientName: true,
          customer: {
            select: {
              corporateId: true,
              corporate: { select: { companyName: true } },
            },
          },
        },
      },
    },
    orderBy: { paymentDate: 'desc' },
    take: 5000,
  });

  const refunds = await prisma.paymentRefund.findMany({
    where: {
      createdAt: { gte: start, lte: end },
      ...(segment !== 'all' ? { order: orderSegmentWhere } : {}),
      ...(query
        ? {
            OR: [
              { transactionId: { contains: query, mode: 'insensitive' } },
              { reason: { contains: query, mode: 'insensitive' } },
              { order: { orderNumber: { contains: query, mode: 'insensitive' } } },
              { order: { patientName: { contains: query, mode: 'insensitive' } } },
            ],
          }
        : {}),
    },
    include: {
      order: {
        select: {
          id: true,
          orderNumber: true,
          patientName: true,
          customer: {
            select: {
              corporateId: true,
              corporate: { select: { companyName: true } },
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 5000,
  });

  const rows = [
    ...payments.map((p) => ({
      date: p.paymentDate,
      type: 'PAYMENT',
      orderNo: p.order?.orderNumber || String(p.orderId),
      patient: p.order?.patientName || '',
      segment: p.order?.customer?.corporateId ? `Corporate:${p.order?.customer?.corporate?.companyName || ''}` : 'General',
      method: p.method,
      paymentType: p.paymentType,
      status: p.status,
      transactionId: p.transactionId || '',
      amount: Number(p.amount || 0),
      notes: p.notes || '',
    })),
    ...refunds.map((r) => ({
      date: r.createdAt,
      type: 'REFUND',
      orderNo: r.order?.orderNumber || String(r.orderId),
      patient: r.order?.patientName || '',
      segment: r.order?.customer?.corporateId ? `Corporate:${r.order?.customer?.corporate?.companyName || ''}` : 'General',
      method: r.mode,
      paymentType: `REFUND:${r.destination}`,
      status: r.status,
      transactionId: r.transactionId || '',
      amount: -Number(r.amount || 0),
      notes: r.reason || r.notes || '',
    })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  const totals = rows.reduce(
    (acc, row) => {
      if (row.type === 'PAYMENT') acc.payments += row.amount;
      if (row.type === 'REFUND') acc.refunds += Math.abs(row.amount);
      return acc;
    },
    { payments: 0, refunds: 0 }
  );

  if (format === 'pdf') {
    const buffer = await toPdfBuffer((doc) => {
      doc.fontSize(16).text('WayToLab Finance Ledger');
      doc.moveDown(0.3);
      doc.fontSize(10).fillColor('#555').text(`Range: ${fmtDate(start)} - ${fmtDate(end)}`);
      doc.text(`Segment: ${segment.toUpperCase()} | Payments: INR ${totals.payments.toFixed(2)} | Refunds: INR ${totals.refunds.toFixed(2)} | Net: INR ${(totals.payments - totals.refunds).toFixed(2)}`);
      doc.moveDown(0.5);

      let y = doc.y;
      const drawHeader = () => {
        doc.fontSize(8).fillColor('#111').text('Date', 36, y);
        doc.text('Type', 120, y);
        doc.text('Order', 170, y);
        doc.text('Segment', 250, y);
        doc.text('Method', 360, y);
        doc.text('Amount', 470, y, { width: 90, align: 'right' });
        y += 14;
        doc.moveTo(36, y).lineTo(560, y).strokeColor('#ddd').stroke();
        y += 6;
      };

      drawHeader();
      for (const row of rows.slice(0, 350)) {
        if (y > 790) {
          doc.addPage();
          y = 36;
          drawHeader();
        }
        doc.fontSize(8).fillColor('#222').text(fmtDate(row.date), 36, y, { width: 80 });
        doc.text(row.type, 120, y, { width: 45 });
        doc.text(row.orderNo, 170, y, { width: 72 });
        doc.text(row.segment, 250, y, { width: 105 });
        doc.text(row.method, 360, y, { width: 90 });
        doc.text(`INR ${row.amount.toFixed(2)}`, 470, y, { width: 90, align: 'right' });
        y += 12;
      }
    });

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="finance-ledger-${start.toISOString().slice(0, 10)}-to-${end.toISOString().slice(0, 10)}.pdf"`,
      },
    });
  }

  const header = ['Date', 'Type', 'OrderNumber', 'Patient', 'Segment', 'Method', 'PaymentType', 'Status', 'TransactionId', 'Amount', 'Notes'];
  const lines = [
    header.join(','),
    ...rows.map((r) =>
      [
        csvEscape(fmtDate(r.date)),
        csvEscape(r.type),
        csvEscape(r.orderNo),
        csvEscape(r.patient),
        csvEscape(r.segment),
        csvEscape(r.method),
        csvEscape(r.paymentType),
        csvEscape(r.status),
        csvEscape(r.transactionId),
        csvEscape(r.amount.toFixed(2)),
        csvEscape(r.notes),
      ].join(',')
    ),
  ];
  return new NextResponse(lines.join('\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="finance-ledger-${start.toISOString().slice(0, 10)}-to-${end.toISOString().slice(0, 10)}.csv"`,
    },
  });
}

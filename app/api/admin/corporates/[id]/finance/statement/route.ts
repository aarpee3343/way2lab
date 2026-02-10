export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';

function range(from?: string | null, to?: string | null) {
  const now = new Date();
  const start = from ? new Date(from) : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const end = to ? new Date(to) : now;
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function csvEscape(value: unknown) {
  const text = String(value ?? '');
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
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

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin({ roles: ['SUPER_ADMIN', 'ADMIN'] });
  } catch {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const corporateId = Number(id);
  if (!corporateId) {
    return NextResponse.json({ success: false, message: 'Invalid corporate id' }, { status: 400 });
  }

  const corporate = await prisma.corporate.findUnique({
    where: { id: corporateId },
    select: { id: true, companyName: true },
  });
  if (!corporate) {
    return NextResponse.json({ success: false, message: 'Corporate not found' }, { status: 404 });
  }

  const { searchParams } = new URL(req.url);
  const { start, end } = range(searchParams.get('from'), searchParams.get('to'));

  const [orders, payments, refunds] = await Promise.all([
    prisma.order.findMany({
      where: {
        createdAt: { gte: start, lte: end },
        customer: { corporateId },
      },
      select: {
        id: true,
        orderNumber: true,
        createdAt: true,
        patientName: true,
        status: true,
        paymentStatus: true,
        finalAmount: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 5000,
    }),
    prisma.payment.findMany({
      where: {
        paymentDate: { gte: start, lte: end },
        order: { customer: { corporateId } },
      },
      select: {
        id: true,
        orderId: true,
        paymentDate: true,
        method: true,
        status: true,
        transactionId: true,
        amount: true,
      },
      orderBy: { paymentDate: 'desc' },
      take: 5000,
    }),
    prisma.paymentRefund.findMany({
      where: {
        createdAt: { gte: start, lte: end },
        order: { customer: { corporateId } },
      },
      select: {
        id: true,
        orderId: true,
        createdAt: true,
        reason: true,
        status: true,
        transactionId: true,
        amount: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 5000,
    }),
  ]);

  const orderMap = new Map(orders.map((o) => [o.id, o]));
  const lines = [
    [
      'EntryType',
      'Date',
      'OrderNumber',
      'OrderId',
      'Patient',
      'OrderStatus',
      'PaymentStatus',
      'MethodOrReason',
      'TxnId',
      'Amount',
    ].join(','),
  ];

  for (const order of orders) {
    lines.push(
      [
        'ORDER',
        csvEscape(fmtDate(order.createdAt)),
        csvEscape(order.orderNumber || String(order.id)),
        csvEscape(order.id),
        csvEscape(order.patientName || ''),
        csvEscape(order.status),
        csvEscape(order.paymentStatus || ''),
        '',
        '',
        csvEscape(Number(order.finalAmount || 0).toFixed(2)),
      ].join(',')
    );
  }

  for (const payment of payments) {
    const order = orderMap.get(payment.orderId);
    lines.push(
      [
        'PAYMENT',
        csvEscape(fmtDate(payment.paymentDate)),
        csvEscape(order?.orderNumber || String(payment.orderId)),
        csvEscape(payment.orderId),
        csvEscape(order?.patientName || ''),
        csvEscape(order?.status || ''),
        csvEscape(payment.status),
        csvEscape(payment.method),
        csvEscape(payment.transactionId || ''),
        csvEscape(Number(payment.amount || 0).toFixed(2)),
      ].join(',')
    );
  }

  for (const refund of refunds) {
    const order = orderMap.get(refund.orderId);
    lines.push(
      [
        'REFUND',
        csvEscape(fmtDate(refund.createdAt)),
        csvEscape(order?.orderNumber || String(refund.orderId)),
        csvEscape(refund.orderId),
        csvEscape(order?.patientName || ''),
        csvEscape(order?.status || ''),
        csvEscape(refund.status),
        csvEscape(refund.reason),
        csvEscape(refund.transactionId || ''),
        csvEscape((-Number(refund.amount || 0)).toFixed(2)),
      ].join(',')
    );
  }

  const filename = `corporate-statement-${corporate.id}-${start.toISOString().slice(0, 10)}-to-${end.toISOString().slice(0, 10)}.csv`;
  return new NextResponse(lines.join('\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}

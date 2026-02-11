export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';
import { getCorporateBillableOrders } from '@/lib/corporate-finance';

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

  const billableOrders = await getCorporateBillableOrders({ corporateId, start, end });
  const billableOrderIds = billableOrders.map((o) => o.orderId);

  const [payments, refunds] = await Promise.all([
    billableOrderIds.length
      ? prisma.payment.findMany({
          where: {
            paymentDate: { gte: start, lte: end },
            orderId: { in: billableOrderIds },
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
        })
      : Promise.resolve([]),
    billableOrderIds.length
      ? prisma.paymentRefund.findMany({
          where: {
            createdAt: { gte: start, lte: end },
            orderId: { in: billableOrderIds },
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
        })
      : Promise.resolve([]),
  ]);

  const orderMap = new Map(billableOrders.map((o) => [o.orderId, o]));
  const lines: string[] = [];

  lines.push('Billed Employees');
  lines.push(['Sr No', 'Employee Name', 'Email', 'Phone', 'Package', 'Order Number', 'Service Completed Date', 'Unit Price'].join(','));
  billableOrders.forEach((row, idx) => {
    lines.push([
      csvEscape(idx + 1),
      csvEscape(row.employeeName),
      csvEscape(row.employeeEmail || ''),
      csvEscape(row.employeePhone || ''),
      csvEscape(row.packageName),
      csvEscape(row.orderNumber),
      csvEscape(fmtDate(new Date(row.completedAt))),
      csvEscape(Number(row.unitPrice || 0).toFixed(2))
    ].join(','));
  });

  lines.push('');
  lines.push('Ledger');
  lines.push([
    'EntryType',
    'Date',
    'OrderNumber',
    'OrderId',
    'Employee',
    'Status',
    'MethodOrReason',
    'TxnId',
    'Amount',
  ].join(','));

  for (const order of billableOrders) {
    lines.push(
      [
        'ORDER',
        csvEscape(fmtDate(new Date(order.completedAt))),
        csvEscape(order.orderNumber),
        csvEscape(order.orderId),
        csvEscape(order.employeeName),
        csvEscape(order.paymentStatus || ''),
        '',
        '',
        csvEscape(Number(order.unitPrice || 0).toFixed(2)),
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
        csvEscape(order?.employeeName || ''),
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
        csvEscape(order?.employeeName || ''),
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

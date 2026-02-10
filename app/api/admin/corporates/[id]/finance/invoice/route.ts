export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import PDFDocument from 'pdfkit';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';

function range(from?: string | null, to?: string | null) {
  const now = new Date();
  const start = from ? new Date(from) : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const end = to ? new Date(to) : now;
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function fmtDate(value: Date | null | undefined) {
  if (!value) return '';
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Kolkata',
  }).format(value);
}

function bufferFromPdf(build: (doc: any) => void): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const chunks: Buffer[] = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', (e) => reject(e));
    build(doc);
    doc.end();
  });
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

  const { searchParams } = new URL(req.url);
  const { start, end } = range(searchParams.get('from'), searchParams.get('to'));

  const corporate = await prisma.corporate.findUnique({
    where: { id: corporateId },
    select: {
      id: true,
      companyName: true,
      contactPerson: true,
      email: true,
      phone: true,
      address: true,
      city: true,
      state: true,
      pincode: true,
      gstin: true,
      panNumber: true,
    },
  });

  if (!corporate) {
    return NextResponse.json({ success: false, message: 'Corporate not found' }, { status: 404 });
  }

  const [orders, paymentAgg, refundAgg] = await Promise.all([
    prisma.order.findMany({
      where: {
        createdAt: { gte: start, lte: end },
        customer: { corporateId },
        status: { notIn: ['CANCELLED', 'REJECTED'] },
      },
      select: {
        id: true,
        orderNumber: true,
        patientName: true,
        createdAt: true,
        finalAmount: true,
        paymentStatus: true,
      },
      orderBy: { createdAt: 'asc' },
      take: 2000,
    }),
    prisma.payment.aggregate({
      where: {
        paymentDate: { gte: start, lte: end },
        order: { customer: { corporateId } },
      },
      _sum: { amount: true },
    }),
    prisma.paymentRefund.aggregate({
      where: {
        createdAt: { gte: start, lte: end },
        status: 'PROCESSED',
        order: { customer: { corporateId } },
      },
      _sum: { amount: true },
    }),
  ]);

  const billed = orders.reduce((sum, o) => sum + Number(o.finalAmount || 0), 0);
  const paid = Number(paymentAgg._sum.amount || 0);
  const refunded = Number(refundAgg._sum.amount || 0);
  const net = paid - refunded;
  const outstanding = Math.max(0, billed - net);

  const invoiceNumber = `WTL-INV-${corporateId}-${start.toISOString().slice(0, 10).replace(/-/g, '')}`;

  const buffer = await bufferFromPdf((doc) => {
    doc.fontSize(20).text('WayToLab', { continued: true }).fontSize(12).text('  Corporate Invoice');
    doc.moveDown(0.2);
    doc.fontSize(10).fillColor('#555').text(`Invoice No: ${invoiceNumber}`);
    doc.text(`Issue Date: ${fmtDate(new Date())}`);
    doc.text(`Billing Period: ${fmtDate(start)} - ${fmtDate(end)}`);
    doc.moveDown(0.5);

    doc.fillColor('#111').fontSize(11).text('Bill To');
    doc.fontSize(10).text(corporate.companyName);
    if (corporate.contactPerson) doc.text(`Contact: ${corporate.contactPerson}`);
    if (corporate.email) doc.text(`Email: ${corporate.email}`);
    if (corporate.phone) doc.text(`Phone: ${corporate.phone}`);
    const addr = [corporate.address, corporate.city, corporate.state, corporate.pincode].filter(Boolean).join(', ');
    if (addr) doc.text(`Address: ${addr}`);
    if (corporate.gstin) doc.text(`GSTIN: ${corporate.gstin}`);
    if (corporate.panNumber) doc.text(`PAN: ${corporate.panNumber}`);

    doc.moveDown(0.8);
    doc.fontSize(11).text('Summary');
    doc.fontSize(10).text(`Total Billed: INR ${billed.toFixed(2)}`);
    doc.text(`Payments Received: INR ${paid.toFixed(2)}`);
    doc.text(`Refunds Processed: INR ${refunded.toFixed(2)}`);
    doc.text(`Net Collected: INR ${net.toFixed(2)}`);
    doc.text(`Outstanding: INR ${outstanding.toFixed(2)}`);

    doc.moveDown(0.8);
    doc.fontSize(11).text(`Order Line Items (${orders.length})`);
    let y = doc.y + 6;
    const drawHeader = () => {
      doc.fontSize(8).fillColor('#111').text('Date', 40, y);
      doc.text('Order', 118, y);
      doc.text('Patient', 185, y, { width: 160 });
      doc.text('Payment Status', 360, y);
      doc.text('Amount', 495, y, { width: 60, align: 'right' });
      y += 13;
      doc.moveTo(40, y).lineTo(555, y).strokeColor('#ddd').stroke();
      y += 6;
    };

    drawHeader();
    for (const order of orders.slice(0, 600)) {
      if (y > 790) {
        doc.addPage();
        y = 40;
        drawHeader();
      }
      doc.fontSize(8).fillColor('#222').text(fmtDate(order.createdAt), 40, y, { width: 72 });
      doc.text(order.orderNumber || String(order.id), 118, y, { width: 62 });
      doc.text(order.patientName || '-', 185, y, { width: 160 });
      doc.text(order.paymentStatus || 'Pending', 360, y, { width: 120 });
      doc.text(`INR ${Number(order.finalAmount || 0).toFixed(2)}`, 495, y, { width: 60, align: 'right' });
      y += 12;
    }
  });

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="corporate-invoice-${corporateId}-${start.toISOString().slice(0, 10)}-to-${end.toISOString().slice(0, 10)}.pdf"`,
    },
  });
}

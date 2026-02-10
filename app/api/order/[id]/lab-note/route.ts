import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAdminSession } from '@/lib/admin-auth';
import PDFDocument from 'pdfkit';
import fs from 'node:fs/promises';
import path from 'node:path';

const formatIstDateTime = (value?: Date | string | null) => {
  if (!value) return 'N/A';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Kolkata'
  }).format(date);
};

const formatIstDate = (value?: Date | string | null) => {
  if (!value) return 'N/A';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour12: false,
    timeZone: 'Asia/Kolkata'
  }).format(date);
};

const asMoney = (value: unknown) => {
  const num = Number(value ?? 0);
  if (!Number.isFinite(num)) return '0.00';
  return num.toFixed(2);
};

const getAgeFromDob = (value?: Date | string | null) => {
  if (!value) return null;
  const dob = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(dob.getTime())) return null;

  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const monthDiff = now.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())) {
    age -= 1;
  }

  return age >= 0 ? age : null;
};

async function loadLogoBuffer() {
  try {
    const logoPath = path.join(process.cwd(), 'public', 'logo.png');
    return await fs.readFile(logoPath);
  } catch {
    return null;
  }
}

async function fetchOrder(id: string) {
  let order = await prisma.order.findUnique({
    where: { orderNumber: id },
    include: {
      customer: true,
      address: true,
      lab: true,
      items: {
        include: {
          test: { select: { id: true, testName: true } },
          package: {
            include: {
              tests: {
                include: {
                  test: { select: { id: true, testName: true } }
                }
              }
            }
          }
        }
      }
    }
  });

  if (!order) {
    const numericId = Number(id);
    if (Number.isFinite(numericId)) {
      order = await prisma.order.findUnique({
        where: { id: numericId },
        include: {
          customer: true,
          address: true,
          lab: true,
          items: {
            include: {
              test: { select: { id: true, testName: true } },
              package: {
                include: {
                  tests: {
                    include: {
                      test: { select: { id: true, testName: true } }
                    }
                  }
                }
              }
            }
          }
        }
      });
    }
  }

  return order;
}

function drawHeader(
  doc: PDFKit.PDFDocument,
  logo: Buffer | null,
  orderNo: string
) {
  const pageWidth = doc.page.width;
  const headerHeight = 98;

  // Header background
  doc.rect(0, 0, pageWidth, headerHeight).fill('#0d9488');

  // Logo (left)
  if (logo) {
    try {
      doc.image(logo, 40, 19, {
        fit: [150, 60] // prevents overflow
      });
    } catch {
      doc
        .fillColor('white')
        .font('Helvetica-Bold')
        .fontSize(22)
        .text('WayToLab', 40, 30);
    }
  } else {
    doc
      .fillColor('white')
      .font('Helvetica-Bold')
      .fontSize(22)
      .text('WayToLab', 40, 30);
  }

  // Order number (top-right)
  doc
    .fillColor('white')
    .font('Helvetica-Bold')
    .fontSize(14)
    .text(`Order #${orderNo}`, pageWidth - 220, 18, {
      width: 180,
      align: 'right'
    });

  // Title (right, under order number)
  doc
    .fillColor('white')
    .font('Helvetica-Bold')
    .fontSize(11)
    .text('Diagnostic Lab Order Note', pageWidth - 260, 38, {
      width: 220,
      align: 'right'
    });

  // Generated date (right, last line)
  doc
    .fillColor('#ccfbf1')
    .font('Helvetica')
    .fontSize(9)
    .text(
      `Generated: ${formatIstDateTime(new Date())}`,
      pageWidth - 260,
      56,
      {
        width: 220,
        align: 'right'
      }
    );

  // Reset cursor below header for body content
  doc.y = headerHeight + 10;
}


function sectionTitle(doc: PDFKit.PDFDocument, title: string, y: number) {
  doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(11).text(title, 40, y);
  doc.moveTo(40, y + 14).lineTo(doc.page.width - 40, y + 14).lineWidth(0.7).strokeColor('#99f6e4').stroke();
}

function drawKeyValueGrid(
  doc: PDFKit.PDFDocument,
  startY: number,
  items: Array<{ label: string; value: string }>,
  columns = 2
) {
  const colWidth = (doc.page.width - 80) / columns;
  const rowHeight = 32;

  items.forEach((item, index) => {
    const col = index % columns;
    const row = Math.floor(index / columns);
    const x = 40 + col * colWidth;
    const y = startY + row * rowHeight;

    doc.fillColor('#64748b').font('Helvetica').fontSize(8).text(item.label.toUpperCase(), x, y);
    doc.fillColor('#111827').font('Helvetica-Bold').fontSize(10).text(item.value || 'N/A', x, y + 11, {
      width: colWidth - 18
    });
  });

  return startY + Math.ceil(items.length / columns) * rowHeight;
}

function ensureSpace(doc: PDFKit.PDFDocument, y: number, needed: number, logo: Buffer | null, orderNo: string) {
  if (y + needed <= doc.page.height - 36) return y;
  doc.addPage();
  drawHeader(doc, logo, orderNo);
  return 114;
}

async function generateLabOrderNotePdf(order: any) {
  const logo = await loadLogoBuffer();

  return await new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 0 });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    drawHeader(doc, logo, String(order.orderNumber || order.id));
    let y = 114;

    sectionTitle(doc, 'Order Summary', y);
    y = drawKeyValueGrid(doc, y + 22, [
      { label: 'Order No.', value: String(order.orderNumber || order.id) },
      { label: 'Collection Type', value: String(order.collectionType || 'N/A').replace(/_/g, ' ') },
      { label: 'Schedule Date', value: formatIstDate(order.preferredDate) },
      { label: 'Time Slot', value: order.preferredTimeSlot || 'N/A' },
      { label: 'Lab Name', value: order.lab?.labName || order.onsiteLabName || 'N/A' },
      { label: 'Lab Phone', value: order.lab?.contactNo || 'N/A' },
      { label: 'Lab City & Pincode', value: `${order.lab?.city || 'N/A'} - ${order.lab?.pincode || 'N/A'}` }
    ]);

    const patientPhone = order.patientPhone || order.customer?.phone || 'N/A';
    const patientDob = formatIstDate(order.patientDob);
    const patientAge = getAgeFromDob(order.patientDob);

    y += 8;
    y = ensureSpace(doc, y, 140, logo, String(order.orderNumber || order.id));
    sectionTitle(doc, 'Patient Details', y);
    y = drawKeyValueGrid(doc, y + 22, [
      { label: 'Patient Name', value: order.patientName || 'N/A' },
      { label: 'Gender', value: order.patientGender || 'N/A' },
      { label: 'Phone', value: patientPhone },
      { label: 'DOB / Age', value: `${patientDob}${patientAge !== null ? ` / ${patientAge} yrs` : ''}` }
    ]);

    y += 8;
    y = ensureSpace(doc, y, 150, logo, String(order.orderNumber || order.id));
    sectionTitle(doc, 'Address and Collection Instruction', y);

    const addressLines = [
      order.address?.addressLine1,
      order.address?.addressLine2,
      order.address?.city,
      order.address?.state,
      order.address?.pincode
    ].filter(Boolean);

    doc.fillColor('#64748b').font('Helvetica').fontSize(8).text('ADDRESS', 40, y + 22);
    doc.fillColor('#111827').font('Helvetica-Bold').fontSize(10).text(
      addressLines.length ? addressLines.join(', ') : 'N/A',
      40,
      y + 34,
      { width: doc.page.width - 80 }
    );

    doc.fillColor('#64748b').font('Helvetica').fontSize(8).text('COLLECTION INSTRUCTION', 40, y + 64);
    doc.fillColor('#111827').font('Helvetica-Bold').fontSize(10).text(
      order.collectionInstructions || 'N/A',
      40,
      y + 76,
      { width: doc.page.width - 80 }
    );

    y += 112;
    y = ensureSpace(doc, y, 220, logo, String(order.orderNumber || order.id));
    sectionTitle(doc, 'Order Items (Tests & Packages)', y);
    y += 24;

    if (!order.items?.length) {
      doc.fillColor('#111827').font('Helvetica').fontSize(10).text('No order items found.', 40, y);
      y += 20;
    } else {
      for (let i = 0; i < order.items.length; i += 1) {
        const item = order.items[i];
        y = ensureSpace(doc, y, 84, logo, String(order.orderNumber || order.id));
        const itemType = (item.itemType || (item.packageId ? 'package' : 'test')).toUpperCase();

        doc.fillColor('#111827').font('Helvetica-Bold').fontSize(10).text(
          `${i + 1}. ${item.itemName || item.test?.testName || item.package?.packageName || 'Item'}`,
          40,
          y
        );
        // Keep section, but do not show price
        doc.fillColor('#475569').font('Helvetica').fontSize(9).text(`Type: ${itemType}`, 40, y + 14);

        y += 30;
        if (item.packageId && item.package?.tests?.length) {
          doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(9).text('Included Tests:', 56, y);
          y += 14;
          for (const pt of item.package.tests) {
            y = ensureSpace(doc, y, 18, logo, String(order.orderNumber || order.id));
            doc.fillColor('#334155').font('Helvetica').fontSize(9).text(`- ${pt.test?.testName || `Test #${pt.testId}`}`, 72, y);
            y += 12;
          }
          y += 6;
        }
      }
    }

    if (String(order.paymentStatus || '').toUpperCase() !== 'CORPORATE_BILLING') {
      y = ensureSpace(doc, y, 120, logo, String(order.orderNumber || order.id));
      sectionTitle(doc, 'Billing Snapshot', y);
      y = drawKeyValueGrid(doc, y + 22, [
        { label: 'Subtotal', value: `INR ${asMoney(order.totalAmount)}` },
        { label: 'Discount', value: `INR ${asMoney(order.discountAmount)}` },
        { label: 'Home Collection Charges', value: `INR ${asMoney(order.homeCollectionCharges)}` },
        { label: 'Final Amount', value: `INR ${asMoney(order.finalAmount)}` },
        { label: 'Payment Mode', value: order.paymentMode || 'N/A' },
        { label: 'Payment Status', value: order.paymentStatus || 'N/A' }
      ]);
    }

    doc.fillColor('#64748b').font('Helvetica').fontSize(8).text(
      'WayToLab - Internal document for lab processing',
      40,
      doc.page.height - 24
    );

    doc.end();
  });
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const order = await fetchOrder(id);
    if (!order) {
      return NextResponse.json({ message: 'Order not found' }, { status: 404 });
    }

    const pdfBuffer = await generateLabOrderNotePdf(order);
    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Lab-Order-Note-${order.orderNumber || order.id}.pdf"`
      }
    });
  } catch (error) {
    console.error('Lab order note PDF error:', error);
    return NextResponse.json({ message: 'Failed to generate lab order note PDF' }, { status: 500 });
  }
}

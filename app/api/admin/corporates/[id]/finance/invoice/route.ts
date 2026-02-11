export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import PDFDocument from 'pdfkit';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';
import { getCorporateBillableOrders } from '@/lib/corporate-finance';
import { getAppSettingValue } from '@/lib/app-settings';
import { promises as fs } from 'node:fs';
import path from 'node:path';

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
    timeZone: 'Asia/Kolkata'
  }).format(value);
}

function shortDate(value: Date | null | undefined) {
  if (!value) return '';
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeZone: 'Asia/Kolkata'
  }).format(value);
}

function money(value: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    currencyDisplay: 'code',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Number(value || 0));
}

function maskPhone(phone: string | null | undefined) {
  const raw = String(phone || '').replace(/\D/g, '');
  if (!raw) return '-';
  if (raw.length <= 6) return raw;
  const first2 = raw.slice(0, 2);
  const last4 = raw.slice(-4);
  return `${first2}xxxx${last4}`;
}

type CompanyProfileSetting = {
  brandName: string;
  legalName: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  pan: string;
  gstin: string;
  supportEmail: string;
  billingEmail: string;
  customerCareNumber: string;
  alternateContactNumber: string;
  accounts: {
    beneficiaryName: string;
    bankName: string;
    branchName: string;
    accountType: '' | 'CURRENT' | 'SAVINGS';
    accountNumber: string;
    ifscCode: string;
    swiftCode: string;
    micrCode: string;
    upiId: string;
  };
  invoicing: {
    invoicePrefix: string;
    paymentTermsDays: number;
    placeOfSupply: string;
    declaration: string;
  };
};

const DEFAULT_COMPANY_PROFILE: CompanyProfileSetting = {
  brandName: 'WayToLab',
  legalName: 'WayToLab Healthcare Private Limited',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  pincode: '',
  country: 'India',
  pan: '',
  gstin: '',
  supportEmail: '',
  billingEmail: '',
  customerCareNumber: '',
  alternateContactNumber: '',
  accounts: {
    beneficiaryName: '',
    bankName: '',
    branchName: '',
    accountType: '',
    accountNumber: '',
    ifscCode: '',
    swiftCode: '',
    micrCode: '',
    upiId: ''
  },
  invoicing: {
    invoicePrefix: 'WTL-INV-',
    paymentTermsDays: 15,
    placeOfSupply: '',
    declaration: 'This is a system generated invoice document. No physical signature is required.'
  }
};

function getFinancialYearCode(date: Date) {
  const month = date.getMonth() + 1;
  const fyStartYear = month >= 4 ? date.getFullYear() : date.getFullYear() - 1;
  const fyEndYear = fyStartYear + 1;
  return `${String(fyStartYear).slice(-2)}${String(fyEndYear).slice(-2)}`;
}

async function getNextInvoiceSerialForFY(fyCode: string) {
  const key = `invoice_counter_${fyCode}`;
  return prisma.$transaction(async (tx) => {
    const row = await tx.appSetting.findUnique({ where: { key }, select: { value: true } });
    const currentValue = row?.value as { lastSerial?: number } | null;
    const nextSerial = Math.max(0, Number(currentValue?.lastSerial || 0)) + 1;
    await tx.appSetting.upsert({
      where: { key },
      create: { key, value: { lastSerial: nextSerial } as any },
      update: { value: { lastSerial: nextSerial } as any }
    });
    return nextSerial;
  });
}

async function getBrandLogoBuffer() {
  try {
    const logoPath = path.join(process.cwd(), 'public', 'logo.png');
    return await fs.readFile(logoPath);
  } catch {
    return null;
  }
}

function bufferFromPdf(build: (doc: any) => void): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 40, bufferPages: true });
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
  const companyProfile = await getAppSettingValue<CompanyProfileSetting>('company_profile', DEFAULT_COMPANY_PROFILE);

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
      panNumber: true
    }
  });

  if (!corporate) {
    return NextResponse.json({ success: false, message: 'Corporate not found' }, { status: 404 });
  }

  const billableOrders = await getCorporateBillableOrders({ corporateId, start, end });
  const billableOrderIds = billableOrders.map((o) => o.orderId);

  const [paymentAgg, refundAgg] = await Promise.all([
    billableOrderIds.length
      ? prisma.payment.aggregate({
          where: {
            paymentDate: { gte: start, lte: end },
            orderId: { in: billableOrderIds }
          },
          _sum: { amount: true }
        })
      : Promise.resolve({ _sum: { amount: 0 } as any }),
    billableOrderIds.length
      ? prisma.paymentRefund.aggregate({
          where: {
            createdAt: { gte: start, lte: end },
            status: 'PROCESSED',
            orderId: { in: billableOrderIds }
          },
          _sum: { amount: true }
        })
      : Promise.resolve({ _sum: { amount: 0 } as any })
  ]);

  const billed = billableOrders.reduce((sum, o) => sum + Number(o.unitPrice || 0), 0);
  const paid = Number(paymentAgg._sum.amount || 0);
  const refunded = Number(refundAgg._sum.amount || 0);
  const net = paid - refunded;
  const outstanding = Math.max(0, billed - net);

  const grouped = new Map<string, { packageName: string; unitPrice: number; count: number; total: number }>();
  for (const row of billableOrders) {
    const key = `${row.packageName}|${row.unitPrice.toFixed(2)}`;
    const current = grouped.get(key) || {
      packageName: row.packageName,
      unitPrice: Number(row.unitPrice || 0),
      count: 0,
      total: 0
    };
    current.count += 1;
    current.total += Number(row.unitPrice || 0);
    grouped.set(key, current);
  }
  const packageLines = Array.from(grouped.values()).sort((a, b) => b.total - a.total);

  const invoiceIssueDate = new Date();
  const fyCode = getFinancialYearCode(invoiceIssueDate);
  const serial = await getNextInvoiceSerialForFY(fyCode);
  const serialPart = String(serial).padStart(2, '0');
  const invoicePrefix = String(companyProfile.invoicing?.invoicePrefix || DEFAULT_COMPANY_PROFILE.invoicing.invoicePrefix).trim();
  const invoiceNumber = `${invoicePrefix}${fyCode}${serialPart}`;

  const paymentTermsDays = Math.max(0, Number(companyProfile.invoicing?.paymentTermsDays || DEFAULT_COMPANY_PROFILE.invoicing.paymentTermsDays));
  const invoiceDueDate = new Date(invoiceIssueDate);
  invoiceDueDate.setDate(invoiceDueDate.getDate() + paymentTermsDays);
  const placeOfSupply = String(corporate.state || '').trim() || String(companyProfile.invoicing?.placeOfSupply || '').trim() || 'NA';

  const logoBuffer = await getBrandLogoBuffer();

  const buffer = await bufferFromPdf((doc) => {
    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const pageLeft = 40;
    const pageRight = pageWidth - 40;
    const headerHeight = 118;
    const brandA = '#0f766e';
    const brandB = '#0284c7';
    const grayText = '#475569';
    const darkText = '#0f172a';
    const muted = '#64748b';

    const drawTopHeader = () => {
      doc.save();
      doc.rect(0, 0, pageWidth, headerHeight).fill(brandA);
      doc.rect(0, headerHeight - 30, pageWidth, 30).fill(brandB);
      doc.restore();

      if (logoBuffer) {
        try {
          doc.image(logoBuffer, 42, 18, { fit: [140, 48], align: 'left', valign: 'top' });
        } catch {
          // no-op
        }
      }

      const legalName = companyProfile.legalName || 'WayToLab Healthcare Private Limited';
      doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(9).text(legalName.toUpperCase(), pageLeft, 74, { width: 320, align: 'left' });
      doc.font('Helvetica').fontSize(7.5).fillColor('#e2e8f0').text('Corporate Billing Statement & Invoice', pageLeft, 88);

      doc.fillColor('#ffffff').fontSize(20).font('Helvetica-Bold').text('Corporate Tax Invoice', 330, 24, { width: 225, align: 'right' });
      doc.font('Helvetica-Bold').fontSize(9).text(`Invoice No: ${invoiceNumber}`, 330, 52, { width: 225, align: 'right' });
      doc.font('Helvetica').fontSize(8.5).text(`Issue Date: ${shortDate(invoiceIssueDate)}`, 330, 67, { width: 225, align: 'right' });
    };

    const drawPageFooter = (pageIndex: number, pageCount: number) => {
      const bottomY = pageHeight - 38;
      doc.save();
      doc.moveTo(pageLeft, bottomY - 10).lineTo(pageRight, bottomY - 10).strokeColor('#dbeafe').lineWidth(1).stroke();
      doc.fillColor(muted).fontSize(7.5).font('Helvetica');
      doc.text('Digitally Generated | Signature Not Required.', pageLeft, bottomY, {
        width: 300,
        lineBreak: false
      });
      doc.text(`Page ${pageIndex} of ${pageCount}`, 460, bottomY, { width: 95, align: 'right' });
      doc.restore();
    };

    const ensureSpace = (y: number, neededHeight: number) => {
      if (y + neededHeight <= 730) return y;
      doc.addPage();
      drawTopHeader();
      return 140;
    };

    drawTopHeader();
    let y = 140;

    const box = (x: number, yy: number, w: number, h: number, title: string, accentColor: string) => {
      doc.roundedRect(x, yy, w, h, 8).lineWidth(1).strokeColor('#dbeafe').fillAndStroke('#f8fafc', '#dbeafe');
      doc.roundedRect(x, yy, w, 26, 8).fill(accentColor);
      doc.fillColor(brandB).font('Helvetica-Bold').fontSize(10).text(title, x + 10, yy + 8);
    };

    const gap = 8;
    const colW = (515 - gap * 2) / 3;
    const boxH = 172;
    const fromX = 40;
    const toX = fromX + colW + gap;
    const invX = toX + colW + gap;

    box(fromX, y, colW, boxH, 'Bill From', '#ecfeff');
    box(toX, y, colW, boxH, 'Bill To', '#eff6ff');
    box(invX, y, colW, boxH, 'Invoice Details', '#f0fdf4');

    const companyAddress = [
      companyProfile.addressLine1,
      companyProfile.addressLine2,
      companyProfile.city,
      companyProfile.state,
      companyProfile.pincode,
      companyProfile.country
    ]
      .filter(Boolean)
      .join(', ');

    doc.fillColor(darkText).font('Helvetica-Bold').fontSize(9.5).text(companyProfile.legalName || companyProfile.brandName, fromX + 10, y + 34, { width: colW - 20 });
    doc.font('Helvetica').fontSize(8);
    if (companyAddress) doc.text(`Address: ${companyAddress}`, fromX + 10, y + 51, { width: colW - 20 });
    if (companyProfile.supportEmail) doc.text(`Email: ${companyProfile.supportEmail}`, fromX + 10, y + 86, { width: colW - 20 });
    if (companyProfile.customerCareNumber) doc.text(`Contact: ${companyProfile.customerCareNumber}`, fromX + 10, y + 100, { width: colW - 20 });
    if (companyProfile.gstin) doc.text(`GSTIN: ${companyProfile.gstin}`, fromX + 10, y + 114, { width: colW - 20 });
    if (companyProfile.pan) doc.text(`PAN: ${companyProfile.pan}`, fromX + 10, y + 128, { width: colW - 20 });

    const corpAddress = [corporate.address, corporate.city, corporate.state, corporate.pincode].filter(Boolean).join(', ');
    doc.fillColor(darkText).font('Helvetica-Bold').fontSize(9.5).text(corporate.companyName, toX + 10, y + 34, { width: colW - 20 });
    doc.font('Helvetica').fontSize(8);
    if (corporate.contactPerson) doc.text(`Contact: ${corporate.contactPerson}`, toX + 10, y + 51, { width: colW - 20 });
    if (corporate.email) doc.text(`Email: ${corporate.email}`, toX + 10, y + 65, { width: colW - 20 });
    if (corporate.phone) doc.text(`Phone: ${corporate.phone}`, toX + 10, y + 79, { width: colW - 20 });
    if (corpAddress) doc.text(`Address: ${corpAddress}`, toX + 10, y + 93, { width: colW - 20 });
    if (corporate.gstin) doc.text(`GSTIN: ${corporate.gstin}`, toX + 10, y + 127, { width: colW - 20 });
    if (corporate.panNumber) doc.text(`PAN: ${corporate.panNumber}`, toX + 10, y + 141, { width: colW - 20 });

    doc.fillColor(grayText).font('Helvetica').fontSize(8.3);
    doc.text(`Invoice No: ${invoiceNumber}`, invX + 10, y + 34, { width: colW - 20 });
    doc.text(`Issue Date: ${shortDate(invoiceIssueDate)}`, invX + 10, y + 48, { width: colW - 20 });
    doc.text(`Due Date: ${shortDate(invoiceDueDate)}`, invX + 10, y + 62, { width: colW - 20 });
    doc.text(`Billing Period: ${shortDate(start)} - ${shortDate(end)}`, invX + 10, y + 76, { width: colW - 20 });
    doc.text(`Financial Year: FY ${fyCode.slice(0, 2)}-${fyCode.slice(2)}`, invX + 10, y + 104, { width: colW - 20 });
    doc.text(`Payment Terms: ${paymentTermsDays} days`, invX + 10, y + 118, { width: colW - 20 });
    doc.text(`Place of Supply: ${placeOfSupply}`, invX + 10, y + 132, { width: colW - 20 });

    y += boxH + 16;

    const summaryCards = [
      { label: 'Total Billed', value: money(billed) },
      { label: 'Payments Received', value: money(paid) },
      { label: 'Refunds', value: money(refunded) },
      { label: 'Outstanding', value: money(outstanding) }
    ];

    let x = 40;
    for (const card of summaryCards) {
      doc.roundedRect(x, y, 124, 60, 8).lineWidth(1).strokeColor('#dbeafe').fillAndStroke('#ffffff', '#dbeafe');
      doc.fillColor(grayText).fontSize(8).font('Helvetica-Bold').text(card.label, x + 10, y + 10);
      doc.fillColor(darkText).fontSize(10.5).font('Helvetica-Bold').text(card.value, x + 10, y + 28, { width: 104 });
      x += 132;
    }

    y += 78;
    doc.fillColor(darkText).font('Helvetica-Bold').fontSize(12).text('Service Summary', 40, y);
    y += 8;

    const drawServiceHeader = () => {
      doc.roundedRect(40, y, 515, 22, 6).fill('#e0f2fe');
      doc.fillColor('#0c4a6e').font('Helvetica-Bold').fontSize(8);
      doc.text('Sr No.', 48, y + 7, { width: 36 });
      doc.text('Package Name', 88, y + 7, { width: 214 });
      doc.text('Unit Price', 308, y + 7, { width: 82, align: 'right' });
      doc.text('Availed Users', 396, y + 7, { width: 72, align: 'right' });
      doc.text('Amount', 472, y + 7, { width: 76, align: 'right' });
      y += 26;
    };

    drawServiceHeader();
    let rowIndex = 0;
    if (!packageLines.length) {
      doc.rect(40, y - 2, 515, 24).fill('#ffffff');
      doc.fillColor(grayText).font('Helvetica').fontSize(8.4).text('No completed billable services in selected billing period.', 48, y + 6);
      y += 24;
    }
    for (const line of packageLines) {
      y = ensureSpace(y, 24);
      if (y === 140) drawServiceHeader();
      const bg = rowIndex % 2 === 0 ? '#ffffff' : '#f8fafc';
      doc.rect(40, y - 2, 515, 20).fill(bg);
      doc.fillColor(darkText).font('Helvetica').fontSize(8);
      doc.text(String(rowIndex + 1), 48, y + 4, { width: 36, ellipsis: true });
      doc.text(line.packageName, 88, y + 4, { width: 214, ellipsis: true });
      doc.text(money(line.unitPrice), 308, y + 4, { width: 82, align: 'right' });
      doc.text(String(line.count), 396, y + 4, { width: 72, align: 'right' });
      doc.text(money(line.total), 472, y + 4, { width: 76, align: 'right' });
      y += 20;
      rowIndex += 1;
    }

    y = ensureSpace(y + 12, 96);
    doc.roundedRect(40, y, 515, 86, 8).lineWidth(1).strokeColor('#dbeafe').fillAndStroke('#f8fafc', '#dbeafe');
    doc.fillColor('#0c4a6e').font('Helvetica-Bold').fontSize(9).text('Account Details', 50, y + 10);
    doc.fillColor(darkText).font('Helvetica').fontSize(8.2);
    doc.text(`Beneficiary: ${companyProfile.accounts.beneficiaryName || '-'}`, 50, y + 27, { width: 240 });
    doc.text(`Bank: ${companyProfile.accounts.bankName || '-'} (${companyProfile.accounts.accountType || '-'})`, 50, y + 41, { width: 240 });
    doc.text(`Branch: ${companyProfile.accounts.branchName || '-'}`, 50, y + 55, { width: 240 });
    doc.text(`Account No: ${companyProfile.accounts.accountNumber || '-'}`, 310, y + 27, { width: 235 });
    doc.text(`IFSC: ${companyProfile.accounts.ifscCode || '-'}`, 310, y + 41, { width: 235 });
    doc.text(`UPI: ${companyProfile.accounts.upiId || '-'}`, 310, y + 55, { width: 235 });

    y = ensureSpace(y + 96, 56);
    doc.roundedRect(40, y, 515, 46, 8).lineWidth(1).strokeColor('#fde68a').fillAndStroke('#fffbeb', '#fde68a');
    doc.fillColor('#92400e').font('Helvetica-Bold').fontSize(9).text('Invoice Note', 50, y + 8);
    doc.fillColor('#78350f').font('Helvetica').fontSize(8).text(
      'Completed availed employee list is attached in Annexure A. This is a digitally generated invoice and does not require physical signature.',
      50,
      y + 21,
      { width: 495 }
    );

    doc.addPage();
    drawTopHeader();
    y = 140;
    doc.fillColor(darkText).font('Helvetica-Bold').fontSize(13).text('Annexure A: Completed Availed Employee List', 40, y);
    y += 16;
    doc.fillColor(grayText).font('Helvetica').fontSize(8).text(
      `Total billed employees: ${billableOrders.length} | Period: ${fmtDate(start)} - ${fmtDate(end)}`,
      40,
      y
    );
    y += 14;

    const drawAnnexHeader = () => {
      doc.roundedRect(40, y, 515, 22, 6).fill('#dcfce7');
      doc.fillColor('#14532d').font('Helvetica-Bold').fontSize(8);
      doc.text('Sr', 46, y + 7, { width: 24 });
      doc.text('Employee', 73, y + 7, { width: 112 });
      doc.text('Phone', 188, y + 7, { width: 84 });
      doc.text('Order No', 275, y + 7, { width: 70 });
      doc.text('Package', 348, y + 7, { width: 112 });
      doc.text('Completed Date', 462, y + 7, { width: 86, align: 'right' });
      y += 26;
    };

    drawAnnexHeader();
    let empIdx = 0;
    if (!billableOrders.length) {
      doc.rect(40, y - 2, 515, 24).fill('#ffffff');
      doc.fillColor(grayText).font('Helvetica').fontSize(8.4).text('No completed employee records found for this billing period.', 48, y + 6);
      y += 24;
    }
    for (const row of billableOrders) {
      y = ensureSpace(y, 26);
      if (y === 140) drawAnnexHeader();
      const bg = empIdx % 2 === 0 ? '#ffffff' : '#f8fafc';
      doc.rect(40, y - 2, 515, 22).fill(bg);
      doc.fillColor(darkText).font('Helvetica').fontSize(7.3);
      doc.text(String(empIdx + 1), 46, y + 4, { width: 24, ellipsis: true });
      doc.text(row.employeeName || '-', 73, y + 4, { width: 112, ellipsis: true });
      doc.text(maskPhone(row.employeePhone), 188, y + 4, { width: 84, ellipsis: true });
      doc.text(row.orderNumber || '-', 275, y + 4, { width: 70, ellipsis: true });
      doc.text(row.packageName || '-', 348, y + 4, { width: 112, ellipsis: true });
      doc.text(shortDate(new Date(row.completedAt)), 462, y + 4, { width: 86, align: 'right' });
      y += 22;
      empIdx += 1;
    }

    const pageRange = doc.bufferedPageRange();
    for (let i = 0; i < pageRange.count; i += 1) {
      doc.switchToPage(i);
      drawPageFooter(i + 1, pageRange.count);
    }
  });

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="corporate-invoice-${corporateId}-${start.toISOString().slice(0, 10)}-to-${end.toISOString().slice(0, 10)}.pdf"`
    }
  });
}

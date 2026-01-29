export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import path from 'path';
import fs from 'fs';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  // 1. Auth Check (Support Query Param for direct download links)
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    const orderId = Number(params.id);
    
    const order = await prisma.order.findFirst({
      where: { id: orderId, userId: user.id },
      include: { items: true, lab: true, address: true, customer: true }
    });

    if (!order) return NextResponse.json({ message: 'Order not found' }, { status: 404 });

    // Determine UHID
    let patientUhid = order.customer.uhid || 'N/A';
    if (order.patientName) {
      const familyMember = await prisma.familyMember.findFirst({
        where: { customerId: user.id, name: order.patientName },
        select: { uhid: true }
      });
      if (familyMember?.uhid) patientUhid = familyMember.uhid;
    }

    // --- PDF GENERATION ---
    const doc = new PDFDocument({ margin: 0, size: 'A4', layout: 'landscape' });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    
    // Layout Constants
    const brandColor = '#4f46e5'; 
    const textColor = '#1e293b';   
    const grayColor = '#64748b';   
    const lightGray = '#f1f5f9';
    const cardX = 40, cardY = 40, cardWidth = 760, cardHeight = 280, stubX = 560;

    const drawField = (label: string, value: string, x: number, y: number, width: number = 100) => {
      doc.fontSize(7).fillColor(grayColor).font('Helvetica').text(label.toUpperCase(), x, y);
      doc.fontSize(11).fillColor(textColor).font('Helvetica-Bold').text(value, x, y + 10, { width, ellipsis: true });
    };

    // Draw Backgrounds
    doc.roundedRect(cardX, cardY, cardWidth, cardHeight, 15).fill('#ffffff');
    doc.roundedRect(cardX, cardY, cardWidth, cardHeight, 15).stroke('#e2e8f0');
    
    // Header Strip
    doc.save();
    doc.roundedRect(cardX, cardY, cardWidth, 50, 15).clip();
    doc.rect(cardX, cardY, cardWidth, 50).fill(brandColor);
    doc.restore();

    // Logo Handling (Vercel Safe)
    const logoPath = path.join(process.cwd(), 'public', 'logo.png'); // Ensure logo.png is in frontend/public
    if (fs.existsSync(logoPath)) {
       doc.image(logoPath, cardX + 20, cardY + 10, { width: 30, height: 30 });
       doc.fillColor('#ffffff').fontSize(20).font('Helvetica-Bold').text('WayToLab', cardX + 60, cardY + 18);
    } else {
       doc.fillColor('#ffffff').fontSize(20).font('Helvetica-Bold').text('WayToLab', cardX + 20, cardY + 15);
    }

    doc.fontSize(10).font('Helvetica').text('HEALTH PASS', cardX + 200, cardY + 22);
    
    // Medical Details
    let row1Y = cardY + 70;
    drawField('Patient Name', order.patientName || 'Guest', cardX + 20, row1Y, 160);
    drawField('UHID', patientUhid, cardX + 200, row1Y);
    drawField('Order ID', `#${order.orderNumber}`, cardX + 330, row1Y);

    let row2Y = row1Y + 40;
    const typeLabel = order.collectionType === 'home_collection' ? 'HOME COLLECTION' : 'LAB VISIT';
    drawField('Type', typeLabel, cardX + 20, row2Y, 160);
    drawField('Lab', order.lab?.labName || 'Assigned Lab', cardX + 200, row2Y, 180);
    drawField('Time', order.preferredTimeSlot || 'N/A', cardX + 400, row2Y);

    // Test List
    let listY = row2Y + 40;
    doc.roundedRect(cardX + 20, listY, 480, 85, 8).fill(lightGray);
    doc.fillColor(brandColor).fontSize(8).font('Helvetica-Bold').text('TEST MANIFEST', cardX + 30, listY + 10);
    
    let textY = listY + 25;
    doc.fillColor(textColor).fontSize(9).font('Helvetica');
    order.items.slice(0, 4).forEach(item => {
        doc.text(`• ${item.itemName}`, cardX + 30, textY);
        textY += 12;
    });

    // QR Code
    const upiString = `upi://pay?pa=surendra.mahipat@oksbi&pn=WayToLab&am=${Number(order.finalAmount).toFixed(2)}&cu=INR`;
    const qrCodeData = await QRCode.toDataURL(upiString);
    doc.image(qrCodeData, stubX + 40, cardY + 150, { width: 80 });
    
    // Pricing Stub
    const stubContentX = stubX + 20;
    doc.fontSize(14).font('Helvetica-Bold').fillColor(brandColor).text(`Rs. ${Number(order.finalAmount).toFixed(2)}`, stubContentX, cardY + 120);
    doc.fontSize(8).fillColor(grayColor).text('Total Amount', stubContentX, cardY + 135);

    doc.end();

    const pdfBuffer = await new Promise<Buffer>((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
    });

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Receipt-${order.orderNumber}.pdf"`
      }
    });

  } catch (error) {
    console.error("PDF Error:", error);
    return NextResponse.json({ message: 'Error generating PDF' }, { status: 500 });
  }
}
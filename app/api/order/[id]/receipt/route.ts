import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';

// Helper to fetch order safely (handles Order Number vs ID)
async function fetchOrder(id: string) {
  let order = await prisma.order.findUnique({
    where: { orderNumber: id },
    include: { items: true, lab: true, customer: true, address: true }
  });

  if (!order) {
    const numericId = parseInt(id);
    if (!isNaN(numericId) && numericId < 2147483647) {
      order = await prisma.order.findUnique({
        where: { id: numericId },
        include: { items: true, lab: true, customer: true, address: true }
      });
    }
  }
  return order;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const order = await fetchOrder(id);

    if (!order) {
      return NextResponse.json({ message: "Order not found" }, { status: 404 });
    }

    // --- 1. PREPARE DATA ---
    
    // Determine UHID (Check patient name vs family members)
    let patientUhid = order.customer?.uhid || 'N/A';
    if (order.patientName && order.customer) {
      const familyMember = await prisma.familyMember.findFirst({
        where: { customerId: order.customer.id, name: order.patientName },
        select: { uhid: true }
      });
      if (familyMember?.uhid) patientUhid = familyMember.uhid;
    }

    // Generate QR Code
    const upiId = "surendra.mahipat@oksbi";
    const payeeName = "WayToLab";
    const amount = Number(order.finalAmount).toFixed(2);
    const upiString = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(payeeName)}&am=${amount}&cu=INR`;
    const qrCodeData = await QRCode.toDataURL(upiString);

    // --- 2. GENERATE PDF ---
    const pdfBuffer = await generateBoardingPassPDF(order, patientUhid, qrCodeData);

    // --- 3. RETURN RESPONSE ---
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="BoardingPass-${order.orderNumber}.pdf"`,
      },
    });

  } catch (error) {
    console.error("Boarding Pass Error:", error);
    return NextResponse.json({ message: "Failed to generate boarding pass" }, { status: 500 });
  }
}

// --- PDF GENERATION LOGIC ---

async function generateBoardingPassPDF(order: any, patientUhid: string, qrCodeData: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    // Landscape Mode
    const doc = new PDFDocument({ margin: 0, size: 'A4', layout: 'landscape' });
    const buffers: Buffer[] = [];

    doc.on('data', (chunk) => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', (err) => reject(err));

    // --- CONFIG ---
    const brandColor = '#4f46e5'; 
    const textColor = '#1e293b';   
    const grayColor = '#64748b';   
    const lightGray = '#f1f5f9';

    const cardX = 40;
    const cardY = 40;
    const cardWidth = 760;
    const cardHeight = 280;
    const stubX = 560; 

    // Helper: Draw Field
    const drawField = (label: string, value: string, x: number, y: number, width: number = 100) => {
      doc.fontSize(7).fillColor(grayColor).font('Helvetica').text(label.toUpperCase(), x, y);
      doc.fontSize(11).fillColor(textColor).font('Helvetica-Bold').text(value, x, y + 10, { width, ellipsis: true });
    };

    // ==========================================
    // 1. DRAW CONTAINER & HEADER
    // ==========================================
    
    // Main Background
    doc.roundedRect(cardX, cardY, cardWidth, cardHeight, 15).fill('#ffffff');
    doc.roundedRect(cardX, cardY, cardWidth, cardHeight, 15).stroke('#e2e8f0');

    // Header Strip (Blue)
    doc.save();
    doc.roundedRect(cardX, cardY, cardWidth, 50, 15).clip();
    doc.rect(cardX, cardY, cardWidth, 50).fill(brandColor);
    doc.restore();

    // --- LOGO (Fallback to Text for Serverless safety) ---
    // Note: Loading local images (path.join) fails on Vercel unless configured in public.
    // We use the text fallback here to ensure 100% stability.
    doc.fillColor('#ffffff')
       .fontSize(20)
       .font('Helvetica-Bold')
       .text('WayToLab', cardX + 20, cardY + 15);

    doc.fontSize(10).font('Helvetica').text('HEALTH PASS', cardX + 140, cardY + 23); // Adjusted position next to logo
    doc.fontSize(12).text('DIAGNOSTIC BOARDING PASS', stubX - 200, cardY + 18);
    doc.fontSize(12).text('PAYMENT STUB', stubX + 20, cardY + 18);

    // ==========================================
    // 2. LEFT SIDE (MEDICAL DETAILS)
    // ==========================================
    let row1Y = cardY + 70;
    
    drawField('Patient Name', order.patientName || 'Guest', cardX + 20, row1Y, 160);
    drawField('UHID', patientUhid, cardX + 200, row1Y);
    drawField('Order ID', `#${order.orderNumber || order.id}`, cardX + 330, row1Y);
    
    let row2Y = row1Y + 40;
    const typeLabel = order.collectionType === 'home_collection' ? 'HOME COLLECTION' : 'LAB VISIT';
    drawField('Type', typeLabel, cardX + 20, row2Y, 160);
    drawField('Lab / Gate', order.lab?.labName || 'Assigned Lab', cardX + 200, row2Y, 180);
    drawField('Time', order.preferredTimeSlot || 'N/A', cardX + 400, row2Y);

    // Test Manifest Box
    let listY = row2Y + 40;
    doc.roundedRect(cardX + 20, listY, 480, 85, 8).fill(lightGray);
    doc.fillColor(brandColor).fontSize(8).font('Helvetica-Bold').text('TEST MANIFEST', cardX + 30, listY + 10);
    
    let textY = listY + 25;
    doc.fillColor(textColor).fontSize(9).font('Helvetica');
    
    const displayItems = order.items.slice(0, 4);
    displayItems.forEach((item: any) => {
        doc.text(`• ${item.itemName}`, cardX + 30, textY);
        textY += 12;
    });
    if (order.items.length > 4) {
        doc.fillColor(grayColor).text(`+ ${order.items.length - 4} more tests...`, cardX + 30, textY);
    }

    // Left Footer (Status)
    const footerY = cardY + cardHeight - 30;
    const isPaid = order.paymentStatus === 'paid' || order.status === 'COMPLETED'; // Adjusted check
    
    doc.fontSize(8).fillColor(grayColor).text('STATUS', cardX + 20, footerY);
    doc.fontSize(10).font('Helvetica-Bold')
       .fillColor(isPaid ? 'green' : '#eab308')
       .text(isPaid ? 'PAID & CONFIRMED' : 'PAYMENT PENDING', cardX + 20, footerY + 10);

    // ==========================================
    // 3. THE "TEAR OFF" LINE
    // ==========================================
    doc.save();
    doc.dash(5, { space: 5 });
    doc.moveTo(stubX, cardY).lineTo(stubX, cardY + cardHeight).strokeColor('#ccc').stroke();
    doc.restore();

    doc.circle(stubX, cardY, 8).fill('#ffffff'); 
    doc.circle(stubX, cardY + cardHeight, 8).fill('#ffffff');

    // ==========================================
    // 4. RIGHT SIDE (PAYMENT STUB)
    // ==========================================
    const stubContentX = stubX + 20;
    let stubY = cardY + 65;

    const drawPaymentRow = (label: string, value: string, isTotal: boolean = false) => {
        doc.font(isTotal ? 'Helvetica-Bold' : 'Helvetica').fontSize(9).fillColor(grayColor).text(label, stubContentX, stubY);
        doc.fillColor(isTotal ? brandColor : textColor).text(value, stubContentX, stubY, { align: 'right', width: 160 });
        stubY += 18;
    };

    doc.fontSize(8).font('Helvetica-Bold').fillColor(brandColor).text('PAYMENT DETAILS', stubContentX, stubY);
    stubY += 15;

    drawPaymentRow('Subtotal', `Rs. ${Number(order.totalAmount || 0).toFixed(2)}`);
    
    if (Number(order.homeCollectionCharges) > 0) {
        drawPaymentRow('Home Charges', `+ Rs. ${Number(order.homeCollectionCharges).toFixed(2)}`);
    }
    
    if (Number(order.discountAmount) > 0) {
        doc.fillColor('green'); 
        drawPaymentRow('Discount', `- Rs. ${Number(order.discountAmount).toFixed(2)}`);
    }

    stubY += 5;
    doc.moveTo(stubContentX, stubY).lineTo(stubContentX + 160, stubY).strokeColor('#e2e8f0').stroke();
    stubY += 10;

    doc.fontSize(14).font('Helvetica-Bold').fillColor(brandColor).text(`Rs. ${Number(order.finalAmount).toFixed(2)}`, stubContentX, stubY, { align: 'right', width: 160 });
    doc.fontSize(8).fillColor(grayColor).text('Total Amount', stubContentX, stubY + 4);
    
    stubY += 30;

    // QR Code
    const qrSize = 80;
    const qrX = stubContentX + (160 - qrSize) / 2;
    doc.image(qrCodeData, qrX, stubY, { width: qrSize });
    
    stubY += qrSize + 5;
    doc.fontSize(7).font('Helvetica').fillColor(grayColor).text('Scan to Pay via UPI', stubContentX, stubY, { align: 'center', width: 160 });

    // ==========================================
    // 5. BOTTOM INSTRUCTIONS
    // ==========================================
    const bottomY = cardY + cardHeight + 20;
    doc.fontSize(9).fillColor(grayColor).font('Helvetica-Bold').text('IMPORTANT INSTRUCTIONS:', cardX, bottomY);
    doc.font('Helvetica').text('1. Please show this boarding pass to the phlebotomist upon arrival.', cardX, bottomY + 15);
    doc.text('2. 10-12 hours fasting is recommended for lipid profile and sugar tests.', cardX, bottomY + 28);
    
    doc.end();
  });
}
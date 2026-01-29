import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import puppeteer from 'puppeteer';

export const runtime = 'nodejs';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const orderId = Number(id);

  if (!orderId || Number.isNaN(orderId)) {
    return new NextResponse('Invalid order ID', { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      customer: true,
      lab: true,
      items: true,
      address: true,
      payments: { orderBy: { createdAt: 'asc' } },
      activities: { orderBy: { createdAt: 'asc' } }
    }
  });

  if (!order) {
    return new NextResponse('Order not found', { status: 404 });
  }

  /* ================= HTML TEMPLATE ================= */

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Order ${order.orderNumber || order.id}</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-white text-slate-800 p-10 text-sm">

  <!-- HEADER -->
  <div class="flex justify-between items-center border-b pb-4 mb-6">
    <div>
      <img src="${new URL('/logo.png', req.url)}" class="h-12" />
    </div>
    <div class="text-right">
      <h1 class="text-2xl font-bold">Order Summary</h1>
      <p class="text-xs text-slate-500">
        Order #${order.orderNumber || order.id}
      </p>
      <p class="text-xs">Status: ${order.status}</p>
    </div>
  </div>

  <!-- CUSTOMER -->
  <section class="mb-6">
    <h2 class="font-bold text-lg mb-2">Customer</h2>
    <p><strong>Name:</strong> ${order.customer?.name || '-'}</p>
    <p><strong>Email:</strong> ${order.customer?.email || '-'}</p>
    <p><strong>Phone:</strong> ${order.customer?.phone || '-'}</p>
    ${
      order.address
        ? `<p><strong>Address:</strong> ${order.address.addressLine1}, ${order.address.city}, ${order.address.pincode}</p>`
        : ''
    }
  </section>

  <!-- PATIENT -->
  <section class="mb-6">
    <h2 class="font-bold text-lg mb-2">Patient</h2>
    <p><strong>Name:</strong> ${order.patientName}</p>
    <p><strong>Gender:</strong> ${order.patientGender || '-'}</p>
    <p><strong>Phone:</strong> ${order.patientPhone || '-'}</p>
  </section>

  <!-- ITEMS -->
  <section class="mb-6">
    <h2 class="font-bold text-lg mb-2">Order Items</h2>
    <table class="w-full border text-sm">
      <thead class="bg-slate-100">
        <tr>
          <th class="border px-2 py-1 text-left">Item</th>
          <th class="border px-2 py-1">Type</th>
          <th class="border px-2 py-1 text-right">Price</th>
        </tr>
      </thead>
      <tbody>
        ${order.items
          .map(
            (i) => `
          <tr>
            <td class="border px-2 py-1">${i.itemName}</td>
            <td class="border px-2 py-1 text-center">${i.itemType}</td>
            <td class="border px-2 py-1 text-right">₹${Number(i.price).toFixed(2)}</td>
          </tr>`
          )
          .join('')}
      </tbody>
    </table>
  </section>

  <!-- PAYMENTS -->
  ${
    order.payments.length
      ? `
  <section class="mb-6">
    <h2 class="font-bold text-lg mb-2">Payments</h2>
    <ul class="list-disc ml-5">
      ${order.payments
        .map(
          (p) =>
            `<li>${new Date(p.paymentDate).toLocaleDateString()} – ${p.method} – ₹${Number(
              p.amount
            ).toFixed(2)} (${p.status})</li>`
        )
        .join('')}
    </ul>
  </section>`
      : ''
  }

  <!-- ACTIVITY LOG -->
  ${
    order.activities.length
      ? `
  <section class="mb-6">
    <h2 class="font-bold text-lg mb-2">Activity Log</h2>
    <ul class="list-disc ml-5">
      ${order.activities
        .map(
          (a) =>
            `<li>${new Date(a.createdAt).toLocaleString()} – ${a.action} (${a.oldValue || '-'} → ${
              a.newValue || '-'
            })</li>`
        )
        .join('')}
    </ul>
  </section>`
      : ''
  }

  <footer class="text-center text-xs text-slate-400 mt-10 border-t pt-4">
    This is a system generated document by WayToLab.
  </footer>

</body>
</html>
`;

  /* ================= PUPPETEER ================= */

  const browser = await puppeteer.launch({
    headless: 'new'
  });

  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });

  const pdf = await page.pdf({
    format: 'A4',
    printBackground: true
  });

  await browser.close();

  return new NextResponse(pdf, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="order-${orderId}.pdf"`
    }
  });
}

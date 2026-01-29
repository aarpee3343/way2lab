import { prisma } from '@/lib/db';

export async function generateOrderNumber() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const prefix = `ORD-${year}${month}${day}`; // Format: ORD-20250123

  // Find last order created today
  const lastOrder = await prisma.order.findFirst({
    where: { orderNumber: { startsWith: prefix } },
    orderBy: { id: 'desc' },
    select: { orderNumber: true }
  });

  let sequence = 1;
  if (lastOrder?.orderNumber) {
    const parts = lastOrder.orderNumber.split('-');
    if (parts.length === 3) {
      sequence = parseInt(parts[2]) + 1;
    }
  }

  return `${prefix}-${String(sequence).padStart(3, '0')}`; // Result: ORD-20250123-001
}

export async function generateCustomerUHID() {
  // Format: WTL-10001 (Sequential)
  const lastCustomer = await prisma.customer.findFirst({
    orderBy: { id: 'desc' },
    select: { id: true } // Using ID for simplicity, or select uhid to parse
  });
  
  const nextId = (lastCustomer?.id || 0) + 1;
  return `WTL-${String(nextId).padStart(6, '0')}`; // Result: WTL-000001
}
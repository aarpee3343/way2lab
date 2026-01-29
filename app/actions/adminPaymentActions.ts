'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function collectPaymentAction(orderId: number, amount: number, method: string, txnId: string, notes: string) {
  try {
    // 1. Get Order
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new Error("Order not found");

    // 2. Validate Overpayment (10% buffer logic from your PHP)
    const paidSum = await prisma.payment.aggregate({
      where: { orderId },
      _sum: { amount: true }
    });
    const currentPaid = paidSum._sum.amount || 0;
    const remaining = Number(order.finalAmount) - currentPaid;

    if (amount > remaining * 1.1) {
      return { success: false, error: "Amount exceeds remaining balance by > 10%" };
    }

    // 3. Create Payment
    await prisma.payment.create({
      data: {
        orderId, amount, method, transactionId: txnId, notes, status: 'verified'
      }
    });

    // 4. Update Order Status if Fully Paid
    if ((currentPaid + amount) >= Number(order.finalAmount) - 1) {
       await prisma.order.update({
         where: { id: orderId },
         data: { paymentStatus: 'Paid' }
       });
    } else {
       // Partial logic
       await prisma.order.update({
         where: { id: orderId },
         data: { paymentStatus: 'Partial' }
       });
    }

    revalidatePath(`/admin/orders/${orderId}`);
    return { success: true };

  } catch (e: any) {
    return { success: false, error: e.message };
  }
}
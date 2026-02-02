'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function getAdminTickets() {
  return await prisma.corporateTicket.findMany({
    include: {
      corporate: { select: { companyName: true } },
      _count: { select: { messages: true } }
    },
    orderBy: { updatedAt: 'desc' }
  });
}

export async function getTicketMessages(ticketId: number) {
  return await prisma.ticketMessage.findMany({
    where: { ticketId },
    orderBy: { createdAt: 'asc' }
  });
}

export async function adminReplyToTicket(ticketId: number, message: string, adminName: string) {
  try {
    await prisma.$transaction([
      prisma.ticketMessage.create({
        data: {
          ticketId,
          message,
          senderName: adminName,
          senderType: 'ADMIN'
        }
      }),
      prisma.corporateTicket.update({
        where: { id: ticketId },
        data: { status: 'IN_PROGRESS', updatedAt: new Date() }
      })
    ]);
    revalidatePath(`/admin/support/${ticketId}`);
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}
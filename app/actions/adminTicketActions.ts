'use server';

import { requireAdmin } from '@/lib/admin-auth';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { encryptBuffer } from '@/lib/crypto';
import { uploadEncryptedFile } from '@/lib/gcs';

const ATTACHMENT_PREFIX = '__ATTACHMENT__::';

export async function getAdminTickets() {
  await requireAdmin({ roles: ['SUPER_ADMIN'] });
  return await prisma.corporateTicket.findMany({
    include: {
      corporate: { select: { companyName: true } },
      _count: { select: { messages: true } }
    },
    orderBy: { updatedAt: 'desc' },
    take: 500
  });
}

export async function getTicketMessages(ticketId: number) {
  await requireAdmin({ roles: ['SUPER_ADMIN'] });
  return await prisma.ticketMessage.findMany({
    where: { ticketId },
    orderBy: { createdAt: 'asc' },
    take: 1000
  });
}

export async function adminReplyToTicket(ticketId: number, message: string, adminName: string) {
  await requireAdmin({ roles: ['SUPER_ADMIN'] });
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

export async function uploadAdminTicketAttachment(
  ticketId: number,
  formData: FormData,
  adminName: string
) {
  await requireAdmin({ roles: ['SUPER_ADMIN'] });
  const file = formData.get('file') as File | null;
  if (!file) return { success: false, error: 'No file provided' };

  const maxBytes = 10 * 1024 * 1024;
  if (file.size > maxBytes) {
    return { success: false, error: 'File too large (max 10MB)' };
  }

  const ticket = await prisma.corporateTicket.findUnique({
    where: { id: ticketId },
    select: { id: true, corporateId: true }
  });
  if (!ticket) return { success: false, error: 'Ticket not found' };

  try {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `corporate-support/${ticket.corporateId}/${ticketId}/admin-${Date.now()}-${safeName}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const { encrypted, iv, tag } = encryptBuffer(buffer);
    await uploadEncryptedFile(storagePath, encrypted);

    const payload = {
      name: file.name,
      mime: file.type || 'application/octet-stream',
      size: file.size,
      path: storagePath,
      iv: iv.toString('base64'),
      tag: tag.toString('base64')
    };

    await prisma.$transaction([
      prisma.ticketMessage.create({
        data: {
          ticketId,
          message: `${ATTACHMENT_PREFIX}${JSON.stringify(payload)}`,
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
    revalidatePath('/admin/support');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Upload failed' };
  }
}

'use server';

import prisma from '@/lib/prisma';
import { encryptBuffer } from '@/lib/crypto';
import { uploadEncryptedFile } from '@/lib/gcs';
import { OrderStatus } from '@prisma/client';
import { processAndSaveSummary } from '@/lib/aiService';




/* =============================================================================
   1️⃣ ADMIN ORDERS LIST
============================================================================= */

export async function getAdminOrders(params: {
  page?: number | string;
  status?: string;
  search?: string;
  payment?: string;
  source?: string;
}) {
  const page = Number(params.page) || 1;
  const limit = 20;
  const skip = (page - 1) * limit;

  const where: any = {
    status: { notIn: ['CANCELLED', 'REJECTED'] }
  };

  if (params.status && params.status !== 'all') {
    where.status = params.status.toUpperCase();
  }

  if (params.payment && params.payment !== 'all') {
    where.paymentStatus = params.payment;
  }

  if (params.source && params.source !== 'all') {
    where.bookingSource = params.source;
  }

  if (params.search) {
    where.OR = [
      { orderNumber: { contains: params.search, mode: 'insensitive' } },
      { patientName: { contains: params.search, mode: 'insensitive' } },
      { patientPhone: { contains: params.search } }
    ];
  }

  const [
    total,
    orders,
    totalOrders,
    pending,
    paid,
    revenue
  ] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      include: { customer: true, lab: true },
      orderBy: { id: 'desc' },
      skip,
      take: limit
    }),
    prisma.order.count(),
    prisma.order.count({
      where: {
        status: {
          in: [
            OrderStatus.PENDING,
            OrderStatus.PROCESSING,
            OrderStatus.PARTIAL_COMPLETED
          ]
        }
      }
    }),
    prisma.order.count({
      where: {
        paymentStatus: 'Paid',
        status: { notIn: ['CANCELLED', 'REJECTED'] }
      }
    }),
    prisma.order.aggregate({
      where: { status: { notIn: ['CANCELLED', 'REJECTED'] } },
      _sum: { finalAmount: true }
    })
  ]);

  return {
    orders,
    total,
    totalPages: Math.ceil(total / limit),
    stats: {
      total: totalOrders,
      pending,
      paid,
      revenue: Number(revenue._sum.finalAmount ?? 0)
    }
  };
}

/* =============================================================================
   2️⃣ UPDATE ORDER STATUS
============================================================================= */

export async function updateOrderStatusAction(formData: FormData) {
  const orderId = Number(formData.get('orderId'));
  const newStatus = formData.get('status') as OrderStatus;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { status: true }
  });

  if (!order) return { success: false };

  await prisma.$transaction(async tx => {
    await tx.order.update({
      where: { id: orderId },
      data: { status: newStatus }
    });

    await tx.orderActivity.create({
      data: {
        orderId,
        action: 'STATUS_UPDATED',
        oldValue: order.status,
        newValue: newStatus,
        performedBy: 'ADMIN'
      }
    });
  });

  return { success: true };
}

/* =============================================================================
   3️⃣ ASSIGN TECHNICIAN
============================================================================= */

export async function assignTechnicianAction(formData: FormData) {
  const orderId = Number(formData.get('orderId'));
  const technicianId = Number(formData.get('technicianId'));

  const old = await prisma.order.findUnique({
    where: { id: orderId },
    select: { technicianId: true }
  });

  await prisma.$transaction(async tx => {
    await tx.order.update({
      where: { id: orderId },
      data: {
        technicianId,
        status: OrderStatus.PROCESSING
      }
    });

    await tx.orderActivity.create({
      data: {
        orderId,
        action: 'TECHNICIAN_ASSIGNED',
        oldValue: old?.technicianId
          ? `Technician:${old.technicianId}`
          : null,
        newValue: `Technician:${technicianId}`,
        performedBy: 'ADMIN'
      }
    });
  });

  return { success: true };
}

/* =============================================================================
   4️⃣ UPLOAD REPORT (NON-BLOCKING AI)
============================================================================= */

export async function uploadReportAction(
  _prevState: any,
  formData: FormData
) {
  try {
    const file = formData.get('file');
    const orderId = Number(formData.get('orderId'));
    const typeRaw = formData.get('type');

    const type =
      typeRaw === 'PARTIAL' || typeRaw === 'COMPLETED'
        ? typeRaw
        : null;

    // Validation
    if (!(file instanceof File) || Number.isNaN(orderId) || !type) {
      return { success: false, error: 'Missing fields' };
    }

    /* 1️⃣ Encrypt + upload */
    // We create the buffer ONCE. We use it for encryption AND for the AI.
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Encrypt for storage (GCS/S3)
    const { encrypted, iv, tag } = encryptBuffer(buffer);

    const storagePath = `reports/order-${orderId}/${type.toLowerCase()}/${Date.now()}.enc`;
    await uploadEncryptedFile(storagePath, encrypted);

    /* 2️⃣ FAST DB transaction */
    await prisma.$transaction(async tx => {
      // If uploading the final report, clean up any partial drafts
      if (type === 'COMPLETED') {
        await tx.orderReport.deleteMany({
          where: { orderId, reportType: 'PARTIAL' }
        });
        
        // Optional: Auto-update Order Status to COMPLETED
        await tx.order.update({
          where: { id: orderId },
          data: { status: 'COMPLETED' }
        });
      }

      // Save the file record
      await tx.orderReport.create({
        data: {
          orderId,
          storagePath,
          reportType: type,
          encrypted: true,
          iv,
          authTag: tag,
          uploadedBy: 'ADMIN'
        }
      });

      // Log the activity
      await tx.orderActivity.create({
        data: {
          orderId,
          action: 'REPORT_UPLOADED',
          oldValue: type === 'COMPLETED' ? 'PARTIAL' : null,
          newValue: type,
          performedBy: 'ADMIN'
        }
      });
    });

    /* 3️⃣ Trigger AI in background (DIRECT CALL) */
    // ---------------------------------------------------------
    // ⚡ FIX: We call the service function directly using 'void'.
    // This runs in Node.js immediately without an API route.
    // ---------------------------------------------------------
    if (type === 'COMPLETED') {
      void processAndSaveSummary(orderId, buffer);
    }

    /* 4️⃣ Return immediately */
    return { success: true };

  } catch (err) {
    console.error('Upload error:', err);
    return { success: false, error: 'Upload failed' };
  }
}
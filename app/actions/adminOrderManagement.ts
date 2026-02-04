'use server';

import { requireAdmin } from '@/lib/admin-auth';

import { prisma } from '@/lib/db';
import { encryptBuffer } from '@/lib/crypto';
import { uploadEncryptedFile } from '@/lib/gcs';
import { OrderStatus } from '@prisma/client';
import { processAndSaveSummary } from '@/lib/aiService';
import { sendSMS } from '@/lib/sms';




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
  await requireAdmin({ roles: ['SUPER_ADMIN'] });
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
      select: {
        id: true,
        orderNumber: true,
        createdAt: true,
        bookingDate: true,
        preferredDate: true,
        preferredTimeSlot: true,
        patientName: true,
        patientPhone: true,
        collectionType: true,
        status: true,
        paymentStatus: true,
        totalAmount: true,
        discountAmount: true,
        homeCollectionCharges: true,
        finalAmount: true,
        customer: {
          select: {
            name: true,
            phone: true
          }
        },
        lab: {
          select: {
            labName: true
          }
        }
      },
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

  const normalizedOrders = orders.map(order => ({
    ...order,
    createdAt: order.createdAt?.toISOString(),
    bookingDate: order.bookingDate?.toISOString(),
    preferredDate: order.preferredDate?.toISOString(),
    totalAmount: Number(order.totalAmount ?? 0),
    discountAmount: Number(order.discountAmount ?? 0),
    homeCollectionCharges: Number(order.homeCollectionCharges ?? 0),
    finalAmount: Number(order.finalAmount ?? 0)
  }));

  return {
    orders: normalizedOrders,
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
  await requireAdmin({ roles: ['SUPER_ADMIN'] });
  const orderId = Number(formData.get('orderId'));
  const newStatus = formData.get('status') as OrderStatus;

  if (!orderId || !newStatus) {
    return { success: false };
  }

  /* ---------- 1. Fetch existing order + phone ---------- */
  const orderData = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      status: true,
      orderNumber: true,
      customer: { select: { phone: true } },
      patientPhone: true,
    },
  });

  if (!orderData) {
    return { success: false };
  }

  /* ---------- 2. Update status + activity (transaction) ---------- */
  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: orderId },
      data: { status: newStatus },
    });

    await tx.orderActivity.create({
      data: {
        orderId,
        action: 'STATUS_UPDATED',
        oldValue: orderData.status,
        newValue: newStatus,
        performedBy: 'ADMIN',
      },
    });
  });

  /* ---------- 3. Send SMS (non-blocking) ---------- */
  const mobile =
    orderData.customer?.phone || orderData.patientPhone;

  if (mobile && newStatus === 'PROCESSING') {
    try {
      await sendSMS(
        mobile,
        'SAMPLE_COLLECTED',
        [orderData.orderNumber || String(orderId)]
      );
    } catch (smsError) {
      console.error('SMS sending failed:', smsError);
      // Do NOT affect success response
    }
  }

  return { success: true };
}

/* =============================================================================
   3️⃣ ASSIGN TECHNICIAN
============================================================================= */

export async function assignTechnicianAction(formData: FormData) {
  await requireAdmin({ roles: ['SUPER_ADMIN'] });
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
  await requireAdmin({ roles: ['SUPER_ADMIN'] });
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
    const buffer = Buffer.from(await file.arrayBuffer());
    const { encrypted, iv, tag } = encryptBuffer(buffer);

    const storagePath = `reports/order-${orderId}/${type.toLowerCase()}/${Date.now()}.enc`;
    await uploadEncryptedFile(storagePath, encrypted);

    /* 2️⃣ FAST DB transaction */
    await prisma.$transaction(async tx => {
      if (type === 'COMPLETED') {
        await tx.orderReport.deleteMany({
          where: { orderId, reportType: 'PARTIAL' }
        });

        await tx.order.update({
          where: { id: orderId },
          data: { status: 'COMPLETED' }
        });
      }

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

    /* 3️⃣ Trigger AI in background */
    if (type === 'COMPLETED') {
      void processAndSaveSummary(orderId, buffer);

      /* 4️⃣ Fetch phone & send SMS (non-blocking) */
      try {
        const orderData = await prisma.order.findUnique({
          where: { id: orderId },
          select: {
            orderNumber: true,
            customer: { select: { phone: true } },
            patientPhone: true
          }
        });

        const mobile =
          orderData?.customer?.phone || orderData?.patientPhone;

        if (mobile) {
          await sendSMS(
            mobile,
            'REPORT_UPLOADED',
            [orderData?.orderNumber || String(orderId)]
          );
        }
      } catch (smsError) {
        console.error('SMS sending failed:', smsError);
      }
    }

    return { success: true };

  } catch (err) {
    console.error('Upload error:', err);
    return { success: false, error: 'Upload failed' };
  }
}

'use server';

import { requireAdmin } from '@/lib/admin-auth';

import { prisma } from '@/lib/db';
import { encryptBuffer } from '@/lib/crypto';
import { uploadEncryptedFile } from '@/lib/gcs';
import { AdminRole, OrderStatus } from '@prisma/client';
import { processAndSaveSummary } from '@/lib/aiService';
import { sendSMS } from '@/lib/sms';
import { revalidatePath } from 'next/cache';

const ORDER_ADMIN_ROLES: AdminRole[] = ['SUPER_ADMIN', 'ADMIN'];



/* =============================================================================
   1️⃣ ADMIN ORDERS LIST
============================================================================= */

export async function getAdminOrders(params: {
  page?: number | string;
  status?: string;
  search?: string;
  payment?: string;
  source?: string;
  corporate?: string;
}) {
  await requireAdmin({ roles: ORDER_ADMIN_ROLES });
  const page = Number(params.page) || 1;
  const limit = 20;
  const skip = (page - 1) * limit;

  const where: any = {};
  const statusParam = String(params.status || 'ALL').trim().toUpperCase();
  const validStatuses = new Set(Object.values(OrderStatus));
  if (statusParam !== 'ALL' && validStatuses.has(statusParam as OrderStatus)) {
    where.status = statusParam as OrderStatus;
  }

  if (params.payment && params.payment !== 'all') {
    where.paymentStatus = params.payment;
  }

  if (params.source && params.source !== 'all') {
    where.bookingSource = params.source;
  }

  if (params.corporate && params.corporate !== 'all') {
    const corporateFilter = params.corporate;
    if (corporateFilter === 'corporate') {
      where.customer = { ...(where.customer || {}), corporateId: { not: null } };
    } else if (corporateFilter === 'general') {
      where.customer = { ...(where.customer || {}), corporateId: null };
    } else if (corporateFilter === 'admin_general') {
      where.bookingSource = 'Admin';
      where.customer = { ...(where.customer || {}), corporateId: null };
    } else if (corporateFilter === 'corporate_admin') {
      where.bookingSource = 'Admin';
      where.customer = { ...(where.customer || {}), corporateId: { not: null } };
    } else if (corporateFilter === 'corporate_employee') {
      where.bookingSource = 'Customer';
      where.customer = { ...(where.customer || {}), corporateId: { not: null } };
    }
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
        onsiteLabName: true,
        status: true,
        paymentStatus: true,
        totalAmount: true,
        discountAmount: true,
        homeCollectionCharges: true,
        finalAmount: true,
        bookingSource: true,
        customer: {
          select: {
            name: true,
            phone: true,
            corporateId: true
          }
        },
        lab: {
          select: {
            labName: true,
            latitude: true,
            longitude: true
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
  try {
    await requireAdmin({ roles: ORDER_ADMIN_ROLES });
    const orderId = Number(formData.get('orderId'));
    const newStatusRaw = String(formData.get('status') || '');

    const validStatuses = new Set(Object.values(OrderStatus));
    if (!orderId || !newStatusRaw || !validStatuses.has(newStatusRaw as OrderStatus)) {
      return { success: false, error: 'Invalid payload' };
    }
    const newStatus = newStatusRaw as OrderStatus;

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
      return { success: false, error: 'Order not found' };
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
    const mobile = orderData.customer?.phone || orderData.patientPhone;

    if (mobile && newStatus === 'PROCESSING') {
      try {
        await sendSMS(
          mobile,
          'SAMPLE_COLLECTED',
          [orderData.orderNumber || String(orderId)]
        );
      } catch (smsError) {
        console.error('SMS sending failed:', smsError);
      }
    }

    return { success: true };
  } catch (err) {
    console.error('updateOrderStatusAction failed:', err);
    return { success: false, error: 'Status update failed' };
  }
}

/* =============================================================================
   3️⃣ ASSIGN TECHNICIAN
============================================================================= */

export async function assignTechnicianAction(formData: FormData) {
  try {
    await requireAdmin({ roles: ORDER_ADMIN_ROLES });
    const orderId = Number(formData.get('orderId'));
    const technicianId = Number(formData.get('technicianId'));

    if (!orderId || !technicianId) {
      return { success: false, error: 'Order and technician are required' };
    }

    const old = await prisma.order.findUnique({
      where: { id: orderId },
      select: { technicianId: true }
    });

    if (!old) {
      return { success: false, error: 'Order not found' };
    }

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
          oldValue: old.technicianId
            ? `Technician:${old.technicianId}`
            : null,
          newValue: `Technician:${technicianId}`,
          performedBy: 'ADMIN'
        }
      });
    });

    return { success: true };
  } catch (err) {
    console.error('assignTechnicianAction failed:', err);
    return { success: false, error: 'Technician assignment failed' };
  }
}

/* =============================================================================
   3b. UPDATE ORDER SCHEDULE
============================================================================= */

export async function updateOrderScheduleAction(formData: FormData) {
  try {
    await requireAdmin({ roles: ORDER_ADMIN_ROLES });

    const orderId = Number(formData.get('orderId'));
    const preferredDateRaw = String(formData.get('preferredDate') || '').trim();
    const preferredTimeSlot = String(formData.get('preferredTimeSlot') || '').trim();
    const collectionType = String(formData.get('collectionType') || '').trim();
    const remark = String(formData.get('remark') || '').trim();

    if (!orderId) {
      return { success: false, error: 'Invalid order' };
    }
    if (!preferredDateRaw || !preferredTimeSlot || !collectionType) {
      return { success: false, error: 'Schedule details are required' };
    }
    if (!remark || remark.length < 3) {
      return { success: false, error: 'Remark is required (min 3 characters)' };
    }

    const preferredDate = new Date(`${preferredDateRaw}T00:00:00`);
    if (Number.isNaN(preferredDate.getTime())) {
      return { success: false, error: 'Invalid schedule date' };
    }

    const existing = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        status: true,
        preferredDate: true,
        preferredTimeSlot: true,
        collectionType: true
      }
    });

    if (!existing) {
      return { success: false, error: 'Order not found' };
    }

    const terminalStatuses: OrderStatus[] = [
      OrderStatus.COMPLETED,
      OrderStatus.REJECTED,
      OrderStatus.CANCELLED
    ];
    if (terminalStatuses.includes(existing.status)) {
      return { success: false, error: 'Cannot edit schedule for terminal orders' };
    }

    const oldSchedule = [
      existing.preferredDate ? new Date(existing.preferredDate).toISOString().split('T')[0] : 'N/A',
      existing.preferredTimeSlot || 'N/A',
      existing.collectionType || 'N/A'
    ].join(' | ');

    const newSchedule = [preferredDateRaw, preferredTimeSlot, collectionType].join(' | ');

    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: {
          preferredDate,
          preferredTimeSlot,
          collectionType
        }
      });

      await tx.orderActivity.create({
        data: {
          orderId,
          action: 'SCHEDULE_UPDATED',
          oldValue: oldSchedule,
          newValue: `${newSchedule} | Remark: ${remark}`,
          performedBy: 'ADMIN'
        }
      });
    });

    revalidatePath(`/admin/orders/${orderId}`);
    return { success: true };
  } catch (err) {
    console.error('updateOrderScheduleAction failed:', err);
    return { success: false, error: 'Schedule update failed' };
  }
}

/* =============================================================================
   4️⃣ UPLOAD REPORT (NON-BLOCKING AI)
============================================================================= */

export async function uploadReportAction(
  _prevState: any,
  formData: FormData
) {
  try {
    await requireAdmin({ roles: ORDER_ADMIN_ROLES });
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

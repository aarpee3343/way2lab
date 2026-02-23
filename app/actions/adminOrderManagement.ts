'use server';

import { requireAdmin } from '@/lib/admin-auth';

import { prisma } from '@/lib/db';
import { encryptBuffer } from '@/lib/crypto';
import { deleteEncryptedFile, downloadEncryptedFile, uploadEncryptedFile } from '@/lib/gcs';
import { AdminRole, OrderStatus } from '@prisma/client';
import { processAndSaveSummary } from '@/lib/aiService';
import { sendSMS } from '@/lib/sms';
import { revalidatePath } from 'next/cache';

const ORDER_ADMIN_ROLES: AdminRole[] = ['SUPER_ADMIN', 'ADMIN'];

const sanitizeReportFileName = (name: string) => {
  const trimmed = (name || '').trim();
  if (!trimmed) return `report-${Date.now()}.pdf`;

  const safe = trimmed
    .replace(/[/\\?%*:|"<>]/g, '-')
    .replace(/\s+/g, ' ')
    .slice(0, 140);

  return safe.toLowerCase().endsWith('.pdf') ? safe : `${safe}.pdf`;
};

const parseCoveredOrderItemIds = (formData: FormData) => {
  const values = formData.getAll('partialOrderItemIds');
  const parsed = values
    .map(value => Number(String(value)))
    .filter(value => Number.isInteger(value) && value > 0);

  return Array.from(new Set(parsed));
};

const getCoverageFromPartialReports = (
  reports: Array<{ coveredOrderItemIds: number[] | null }>,
  validOrderItemIds: number[]
) => {
  const validSet = new Set(validOrderItemIds);
  const covered = new Set<number>();

  for (const report of reports) {
    for (const itemId of report.coveredOrderItemIds || []) {
      if (validSet.has(itemId)) {
        covered.add(itemId);
      }
    }
  }

  return covered;
};

async function optimizePdfBuffer(buffer: Buffer) {
  try {
    const initial = await optimizePdfBufferLight(buffer);
    const baseline = initial.length > 0 && initial.length < buffer.length ? initial : buffer;

    const aggressive = await optimizePdfBufferAggressive(baseline, {
      quality: 0.72,
      dpi: 140,
      maxPages: 60,
      minTriggerBytes: 2 * 1024 * 1024
    });

    if (aggressive.length > 0 && aggressive.length < baseline.length) {
      return aggressive;
    }

    const fallbackAggressive = await optimizePdfBufferAggressive(baseline, {
      quality: 0.58,
      dpi: 120,
      maxPages: 40,
      minTriggerBytes: 2 * 1024 * 1024
    });

    if (fallbackAggressive.length > 0 && fallbackAggressive.length < baseline.length) {
      return fallbackAggressive;
    }

    return baseline;
  } catch (error) {
    console.error('PDF optimization skipped:', error);
    return buffer;
  }
}

async function optimizePdfBufferLight(buffer: Buffer) {
  const { PDFDocument } = await import('pdf-lib');
  const document = await PDFDocument.load(buffer, { ignoreEncryption: true });
  return Buffer.from(
    await document.save({
      useObjectStreams: true,
      addDefaultPage: false
    })
  );
}

async function optimizePdfBufferAggressive(
  sourceBuffer: Buffer,
  options: {
    quality: number;
    dpi: number;
    maxPages: number;
    minTriggerBytes: number;
  }
) {
  const { quality, dpi, maxPages, minTriggerBytes } = options;
  if (sourceBuffer.length < minTriggerBytes) {
    return sourceBuffer;
  }

  try {
    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
    const { PDFDocument } = await import('pdf-lib');
    const canvasModule = await import('@napi-rs/canvas');

    const loadingTask = pdfjs.getDocument({
      data: new Uint8Array(sourceBuffer),
      isEvalSupported: false,
      useSystemFonts: false
    } as any);
    const sourcePdf = await loadingTask.promise;
    const pageCount = sourcePdf.numPages;

    if (pageCount <= 0 || pageCount > maxPages) {
      return sourceBuffer;
    }

    const outputPdf = await PDFDocument.create();

    for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
      const page = await sourcePdf.getPage(pageNumber);
      const outputViewport = page.getViewport({ scale: 1 });
      const renderScale = Math.max(dpi / 72, 0.8);
      const renderViewport = page.getViewport({ scale: renderScale });

      const canvas = canvasModule.createCanvas(
        Math.max(1, Math.floor(renderViewport.width)),
        Math.max(1, Math.floor(renderViewport.height))
      );

      const context = canvas.getContext('2d');
      await page.render({
        canvasContext: context as any,
        viewport: renderViewport
      }).promise;

      const jpgBuffer = await canvasToJpegBuffer(canvas, quality);
      const image = await outputPdf.embedJpg(jpgBuffer);

      const outPage = outputPdf.addPage([outputViewport.width, outputViewport.height]);
      outPage.drawImage(image, {
        x: 0,
        y: 0,
        width: outputViewport.width,
        height: outputViewport.height
      });
    }

    const compressed = Buffer.from(
      await outputPdf.save({
        useObjectStreams: true
      })
    );

    return compressed.length > 0 ? compressed : sourceBuffer;
  } catch (error) {
    console.error('Aggressive PDF optimization skipped:', error);
    return sourceBuffer;
  }
}

async function canvasToJpegBuffer(canvas: any, quality: number) {
  const q = Math.max(0.35, Math.min(quality, 0.9));
  const attempts = [
    () => canvas.toBuffer('image/jpeg', { quality: q }),
    () => canvas.toBuffer('image/jpeg', { quality: Math.round(q * 100) }),
    () => canvas.toBuffer('image/jpeg', q),
    () => canvas.toBuffer('image/jpeg')
  ];

  for (const attempt of attempts) {
    try {
      const result = await attempt();
      if (result && result.length) {
        return Buffer.from(result);
      }
    } catch {
      // Try next signature.
    }
  }

  throw new Error('Failed to encode rendered PDF page as JPEG');
}



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
   4. UPLOAD REPORT (NON-BLOCKING AI)
============================================================================= */

export async function uploadReportAction(
  _prevState: any,
  formData: FormData
) {
  let createdStoragePath: string | null = null;
  let tempUploadPathForCleanup: string | null = null;

  try {
    await requireAdmin({ roles: ORDER_ADMIN_ROLES });
    const file = formData.get('file');
    const orderId = Number(formData.get('orderId'));
    const typeRaw = formData.get('type');
    const type = typeRaw === 'PARTIAL' || typeRaw === 'COMPLETED' ? typeRaw : null;
    const tempUploadPath = String(formData.get('tempUploadPath') || '').trim();
    const uploadedFileNameRaw = String(formData.get('uploadedFileName') || '').trim();
    const uploadedFileTypeRaw = String(formData.get('uploadedFileType') || '').trim().toLowerCase();

    if (Number.isNaN(orderId) || !type) {
      return { success: false, error: 'Missing fields' };
    }

    const coveredOrderItemIds = type === 'PARTIAL' ? parseCoveredOrderItemIds(formData) : [];

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        orderNumber: true,
        patientPhone: true,
        customer: { select: { phone: true } },
        items: { select: { id: true } },
        reports: {
          select: {
            id: true,
            reportType: true,
            storagePath: true
          }
        }
      }
    });

    if (!order) {
      return { success: false, error: 'Order not found' };
    }

    const orderItemIds = order.items.map(item => item.id);

    if (type === 'PARTIAL') {
      if (!coveredOrderItemIds.length) {
        return { success: false, error: 'Please select at least one test/package for partial upload' };
      }

      const validSet = new Set(orderItemIds);
      const hasInvalid = coveredOrderItemIds.some(itemId => !validSet.has(itemId));
      if (hasInvalid) {
        return { success: false, error: 'Invalid test/package selection for partial upload' };
      }

      const hasCompletedReport = order.reports.some(rep => rep.reportType === 'COMPLETED');
      if (hasCompletedReport) {
        return {
          success: false,
          error: 'Completed report already exists. Delete it first before uploading partial reports.'
        };
      }
    }

    let originalBuffer: Buffer;
    let originalFileName = '';

    if (file instanceof File) {
      const isPdfFile =
        file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      if (!isPdfFile) {
        return { success: false, error: 'Only PDF reports are allowed' };
      }

      originalBuffer = Buffer.from(await file.arrayBuffer());
      originalFileName = file.name;
    } else if (tempUploadPath) {
      const allowedPrefix = `tmp/report-uploads/order-${orderId}/`;
      if (!tempUploadPath.startsWith(allowedPrefix)) {
        return { success: false, error: 'Invalid temporary upload path' };
      }

      const isPdfByName = uploadedFileNameRaw.toLowerCase().endsWith('.pdf');
      const isPdfByType = uploadedFileTypeRaw === 'application/pdf';
      if (!isPdfByName && !isPdfByType) {
        return { success: false, error: 'Only PDF reports are allowed' };
      }

      originalBuffer = await downloadEncryptedFile(tempUploadPath);
      originalFileName = uploadedFileNameRaw || tempUploadPath.split('/').pop() || `report-${Date.now()}.pdf`;
      tempUploadPathForCleanup = tempUploadPath;
    } else {
      return { success: false, error: 'Report file is required' };
    }

    const optimizedBuffer = await optimizePdfBuffer(originalBuffer);
    const { encrypted, iv, tag } = encryptBuffer(optimizedBuffer);
    const safeFileName = sanitizeReportFileName(originalFileName);

    createdStoragePath = `reports/order-${orderId}/${type.toLowerCase()}/${Date.now()}-${safeFileName}.enc`;
    await uploadEncryptedFile(createdStoragePath, encrypted);

    const uploadResult = await prisma.$transaction(async tx => {
      const existingReports = await tx.orderReport.findMany({
        where: { orderId },
        select: {
          id: true,
          reportType: true,
          storagePath: true,
          coveredOrderItemIds: true
        }
      });

      let nextStatus: OrderStatus = OrderStatus.PROCESSING;
      let removedReportPaths: string[] = [];
      let removedCount = 0;
      const reportCoveredItems = type === 'PARTIAL' ? coveredOrderItemIds : orderItemIds;

      if (type === 'COMPLETED') {
        const obsoleteReports = existingReports.filter(
          report => report.reportType === 'PARTIAL' || report.reportType === 'COMPLETED'
        );

        removedCount = obsoleteReports.length;
        removedReportPaths = obsoleteReports
          .map(report => report.storagePath)
          .filter((path): path is string => Boolean(path));

        if (obsoleteReports.length) {
          await tx.orderReport.deleteMany({
            where: { id: { in: obsoleteReports.map(report => report.id) } }
          });
        }

        await tx.orderReportSummary.deleteMany({ where: { orderId } });
        nextStatus = OrderStatus.COMPLETED;
      }

      await tx.orderReport.create({
        data: {
          orderId,
          storagePath: createdStoragePath,
          reportType: type,
          encrypted: true,
          iv,
          authTag: tag,
          uploadedBy: 'ADMIN',
          fileName: safeFileName,
          fileSizeBytes: originalBuffer.length,
          optimizedSizeBytes: optimizedBuffer.length,
          coveredOrderItemIds: reportCoveredItems
        }
      });

      if (type === 'PARTIAL') {
        const partialReports = await tx.orderReport.findMany({
          where: {
            orderId,
            reportType: 'PARTIAL'
          },
          select: {
            coveredOrderItemIds: true
          }
        });

        const coveredItems = getCoverageFromPartialReports(partialReports, orderItemIds);
        const allItemsCovered = orderItemIds.length > 0 && coveredItems.size >= orderItemIds.length;
        nextStatus = allItemsCovered ? OrderStatus.COMPLETED : OrderStatus.PARTIAL_COMPLETED;
      }

      await tx.order.update({
        where: { id: orderId },
        data: { status: nextStatus }
      });

      await tx.orderActivity.create({
        data: {
          orderId,
          action: 'REPORT_UPLOADED',
          oldValue:
            type === 'COMPLETED'
              ? `Cleared reports: ${removedCount}`
              : `Partial coverage count: ${coveredOrderItemIds.length}`,
          newValue: `${type} | ${safeFileName}`,
          performedBy: 'ADMIN'
        }
      });

      return {
        nextStatus,
        removedReportPaths
      };
    });

    if (uploadResult.removedReportPaths.length) {
      for (const storagePath of uploadResult.removedReportPaths) {
        try {
          await deleteEncryptedFile(storagePath);
        } catch (deleteError) {
          console.error('Failed to remove replaced report from storage:', deleteError);
        }
      }
    }

    if (type === 'COMPLETED') {
      void processAndSaveSummary(orderId, optimizedBuffer);
    }

    if (uploadResult.nextStatus === OrderStatus.COMPLETED) {
      try {
        const mobile = order.customer?.phone || order.patientPhone;
        if (mobile) {
          await sendSMS(mobile, 'REPORT_UPLOADED', [order.orderNumber || String(orderId)]);
        }
      } catch (smsError) {
        console.error('SMS sending failed:', smsError);
      }
    }

    if (tempUploadPathForCleanup) {
      try {
        await deleteEncryptedFile(tempUploadPathForCleanup);
      } catch (cleanupError) {
        console.error('Failed to cleanup temporary upload object:', cleanupError);
      }
    }

    revalidatePath(`/admin/orders/${orderId}`);
    revalidatePath(`/dashboard/orders/${orderId}`);
    return { success: true };
  } catch (err) {
    console.error('Upload error:', err);

    if (createdStoragePath) {
      try {
        await deleteEncryptedFile(createdStoragePath);
      } catch (cleanupError) {
        console.error('Failed to cleanup uploaded file after upload error:', cleanupError);
      }
    }

    if (tempUploadPathForCleanup) {
      try {
        await deleteEncryptedFile(tempUploadPathForCleanup);
      } catch (cleanupError) {
        console.error('Failed to cleanup temporary upload object after upload error:', cleanupError);
      }
    }

    return { success: false, error: 'Upload failed' };
  }
}

export async function deleteReportAction(
  _prevState: any,
  formData: FormData
) {
  try {
    await requireAdmin({ roles: ORDER_ADMIN_ROLES });

    const reportId = Number(formData.get('reportId'));
    const orderId = Number(formData.get('orderId'));
    const remark = String(formData.get('remark') || '').trim();

    if (!reportId || !orderId) {
      return { success: false, error: 'Invalid report payload' };
    }
    if (remark.length < 3) {
      return { success: false, error: 'Remark is required (min 3 characters)' };
    }

    const report = await prisma.orderReport.findFirst({
      where: { id: reportId, orderId },
      select: {
        id: true,
        reportType: true,
        storagePath: true,
        fileName: true
      }
    });

    if (!report) {
      return { success: false, error: 'Report not found' };
    }

    const reportType = report.reportType || 'UNKNOWN';
    const storagePath = report.storagePath || null;

    await prisma.$transaction(async tx => {
      await tx.orderReport.delete({
        where: { id: reportId }
      });

      const remaining = await tx.orderReport.findMany({
        where: { orderId },
        select: {
          reportType: true,
          coveredOrderItemIds: true
        }
      });

      const orderItems = await tx.orderItem.findMany({
        where: { orderId },
        select: { id: true }
      });

      const orderItemIds = orderItems.map(item => item.id);
      const hasCompleted = remaining.some(r => r.reportType === 'COMPLETED');
      const hasPartial = remaining.some(r => r.reportType === 'PARTIAL');
      const partialReports = remaining.filter(r => r.reportType === 'PARTIAL');
      const coveredItems = getCoverageFromPartialReports(partialReports, orderItemIds);
      const allItemsCovered = orderItemIds.length > 0 && coveredItems.size >= orderItemIds.length;

      if (reportType === 'COMPLETED') {
        await tx.orderReportSummary.deleteMany({ where: { orderId } });
      }

      let nextStatus: OrderStatus = OrderStatus.PROCESSING;
      if (hasCompleted) {
        nextStatus = OrderStatus.COMPLETED;
      } else if (hasPartial) {
        nextStatus = allItemsCovered ? OrderStatus.COMPLETED : OrderStatus.PARTIAL_COMPLETED;
      }

      await tx.order.update({
        where: { id: orderId },
        data: {
          status: nextStatus
        }
      });

      await tx.orderActivity.create({
        data: {
          orderId,
          action: 'REPORT_DELETED',
          oldValue: `${reportType} | ${report.fileName || `Report:${reportId}`}`,
          newValue: `Deleted by ADMIN | Remark: ${remark}`,
          performedBy: 'ADMIN'
        }
      });
    });

    if (storagePath) {
      try {
        await deleteEncryptedFile(storagePath);
      } catch (storageError) {
        console.error('Failed to delete report file from storage:', storageError);
      }
    }

    revalidatePath(`/admin/orders/${orderId}`);
    revalidatePath(`/dashboard/orders/${orderId}`);
    return { success: true };
  } catch (err) {
    console.error('deleteReportAction failed:', err);
    return { success: false, error: 'Delete report failed' };
  }
}


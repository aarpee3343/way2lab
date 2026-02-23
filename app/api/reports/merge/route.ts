import { NextResponse } from 'next/server';
import { PDFDocument } from 'pdf-lib';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { decryptBuffer } from '@/lib/crypto';
import { downloadEncryptedFile } from '@/lib/gcs';

export const runtime = 'nodejs';

type MergePayload = {
  orderId?: number;
  reportIds?: number[];
};

const parsePayload = (payload: MergePayload) => {
  const orderId = Number(payload?.orderId);
  const reportIdsRaw = Array.isArray(payload?.reportIds) ? payload.reportIds : [];
  const reportIds = Array.from(
    new Set(
      reportIdsRaw
        .map((value) => Number(value))
        .filter((value) => Number.isInteger(value) && value > 0)
    )
  );

  return { orderId, reportIds };
};

export async function POST(req: Request) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const payload = (await req.json()) as MergePayload;
    const { orderId, reportIds } = parsePayload(payload);

    if (!orderId || !reportIds.length) {
      return NextResponse.json(
        { message: 'orderId and at least one reportId are required' },
        { status: 400 }
      );
    }

    const reports = await prisma.orderReport.findMany({
      where: {
        id: { in: reportIds },
        orderId,
        order: {
          userId: user.id,
          OR: [{ packageId: null }, { package: { isPreEmployment: false } }]
        }
      },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        orderId: true,
        storagePath: true,
        iv: true,
        authTag: true
      }
    });

    if (reports.length !== reportIds.length) {
      return NextResponse.json(
        { message: 'Some selected reports are invalid for this user/order' },
        { status: 403 }
      );
    }

    const mergedPdf = await PDFDocument.create();
    for (const report of reports) {
      if (!report.storagePath || !report.iv || !report.authTag) {
        return NextResponse.json(
          { message: `Report ${report.id} is missing secure file metadata` },
          { status: 400 }
        );
      }

      const encrypted = await downloadEncryptedFile(report.storagePath);
      const decrypted = decryptBuffer(encrypted, report.iv, report.authTag);
      const source = await PDFDocument.load(decrypted, { ignoreEncryption: true });
      const pageIndices = source.getPageIndices();
      const copiedPages = await mergedPdf.copyPages(source, pageIndices);
      copiedPages.forEach((page) => mergedPdf.addPage(page));
    }

    if (mergedPdf.getPageCount() === 0) {
      return NextResponse.json({ message: 'No pages found in selected reports' }, { status: 400 });
    }

    const mergedBytes = await mergedPdf.save({ useObjectStreams: true });
    const fileName = `order-${orderId}-reports-${Date.now()}.pdf`;

    prisma.orderActivity
      .create({
        data: {
          orderId,
          action: 'REPORT_DOWNLOADED',
          newValue: `Merged report download (${reports.length} files)`,
          performedBy: 'USER'
        }
      })
      .catch((error) => console.error('Merged report activity log failed:', error));

    return new NextResponse(Buffer.from(mergedBytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`
      }
    });
  } catch (error) {
    console.error('Merged report download failed:', error);
    return NextResponse.json(
      { message: 'Failed to generate merged report PDF' },
      { status: 500 }
    );
  }
}

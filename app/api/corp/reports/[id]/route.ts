import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { decryptBuffer } from '@/lib/crypto';
import { downloadEncryptedFile } from '@/lib/gcs';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

export const runtime = 'nodejs';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const reportId = Number(id);

    if (!reportId) {
      return new NextResponse('Invalid report id', { status: 400 });
    }

    const cookieStore = await cookies();
    const token = cookieStore.get('corp_token')?.value;

    if (!token) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    let corporateId: number;
    let userId: number;
    let email: string | undefined;

    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET);
      const { payload } = await jwtVerify(token, secret);
      corporateId = Number(payload.corporateId);
      userId = Number(payload.userId);
      email = payload.email as string | undefined;
    } catch (e) {
      console.error('Corp token verification failed', e);
      return new NextResponse('Invalid token', { status: 401 });
    }

    const report = await prisma.orderReport.findFirst({
      where: {
        id: reportId,
        order: {
          customer: { corporateId },
          status: 'COMPLETED'
        }
      },
      include: {
        order: {
          select: {
            id: true,
            packageId: true,
            couponId: true,
            isReportSharedWithCorp: true,
            package: { select: { isPreEmployment: true, reportVisibility: true } }
          }
        }
      }
    });

    if (!report) {
      return new NextResponse('Report not found', { status: 404 });
    }

    const isPreEmployment = Boolean(report.order?.package?.isPreEmployment);
    if (!isPreEmployment) {
      const serviceOr = [
        report.order?.packageId ? { packageId: report.order.packageId } : null,
        report.order?.couponId ? { couponId: report.order.couponId } : null
      ].filter(Boolean) as any[];

      const service = serviceOr.length
        ? await prisma.corporateService.findFirst({
            where: {
              corporateId,
              isActive: true,
              OR: serviceOr
            },
            select: { reportVisibilityOverride: true }
          })
        : null;

      const policy =
        service?.reportVisibilityOverride ||
        report.order?.package?.reportVisibility ||
        'USER_ONLY';
      if (policy === 'USER_ONLY' && !report.order?.isReportSharedWithCorp) {
        return new NextResponse('Report not found', { status: 404 });
      }
    }

    if (!report.storagePath) {
      return new NextResponse('Report file missing', { status: 404 });
    }

    const encrypted = await downloadEncryptedFile(report.storagePath);

    if (!report.iv || !report.authTag) {
      throw new Error('Encryption metadata missing');
    }

    const decrypted = decryptBuffer(
      encrypted,
      report.iv,
      report.authTag
    );

    // Log activity asynchronously
    const actor = await prisma.corporateUser.findUnique({
      where: { id: userId },
      select: { name: true, email: true }
    });
    prisma.corporateActivity.create({
      data: {
        corporateId,
        performedBy: actor?.name || actor?.email || email || 'Corporate User',
        action: 'REPORT_DOWNLOADED',
        details: `Downloaded report #${reportId}`
      }
    }).catch(err => console.error('Corp log failed', err));

    return new NextResponse(new Uint8Array(decrypted), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="Report-${reportId}.pdf"`,
      }
    });

  } catch (error) {
    console.error('Corp report API error', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

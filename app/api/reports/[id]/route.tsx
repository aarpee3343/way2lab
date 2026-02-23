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

    /* ---------------- AUTH ---------------- */
    // ✅ FIX: Await cookies()
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    let userId: number;

    try {
      // ✅ FIX: Use 'jose' for reliable verification
      const secret = new TextEncoder().encode(process.env.JWT_SECRET);
      const { payload } = await jwtVerify(token, secret);
      userId = Number(payload.id);
    } catch (e) {
      console.error("Token verification failed", e);
      return new NextResponse('Invalid token', { status: 401 });
    }

    /* ---------------- FETCH REPORT ---------------- */
    const report = await prisma.orderReport.findFirst({
      where: {
        id: reportId,
        order: { userId } // Security check
      },
      include: {
        order: { select: { package: { select: { isPreEmployment: true } } } }
      }
    });

    if (!report) {
      return new NextResponse('Report not found', { status: 404 });
    }

    if (report.order?.package?.isPreEmployment) {
      return new NextResponse('Report not found', { status: 404 });
    }

    /* ---------------- DECRYPT & DOWNLOAD ---------------- */
    try {
      if (!report.storagePath) {
        return new NextResponse('Report file missing', { status: 404 });
      }

      const encrypted = await downloadEncryptedFile(report.storagePath);

      if (!report.iv || !report.authTag) {
         throw new Error("Encryption metadata missing");
      }

      const decrypted = decryptBuffer(
        encrypted,
        report.iv,
        report.authTag
      );
      const safeFileName = (report.fileName || `Report-${reportId}.pdf`)
        .replace(/[/\\?%*:|"<>]/g, '-')
        .trim() || `Report-${reportId}.pdf`;

      /* ---------------- LOGGING ---------------- */
      // Log asynchronously so it doesn't block the download
      prisma.orderActivity.create({
        data: {
          orderId: report.orderId,
          action: 'REPORT_DOWNLOADED',
          performedBy: 'USER'
        }
      }).catch(err => console.error("Log failed", err));

      return new NextResponse(new Uint8Array(decrypted), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `inline; filename="${safeFileName}"`,
        }
      });

    } catch (err) {
      console.error("Decryption/Download failed:", err);
      return new NextResponse('File processing error', { status: 500 });
    }

  } catch (error) {
    console.error("API Error:", error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

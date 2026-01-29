import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { decryptBuffer } from '@/lib/crypto';
import { downloadEncryptedFile } from '@/lib/gcs';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

export const runtime = 'nodejs';

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const reportId = Number(id);

  if (!reportId) {
    return new NextResponse('Invalid report id', { status: 400 });
  }

  /* ---------------- AUTH ---------------- */

  const token = cookies().get('token')?.value;

  if (!token) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  let userId: number;

  try {
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
    userId = decoded.id;
  } catch {
    return new NextResponse('Invalid token', { status: 401 });
  }

  /* ---------------- FETCH REPORT ---------------- */

  const report = await prisma.orderReport.findFirst({
    where: {
      id: reportId,
      order: {
        userId
      }
    }
  });

  if (!report) {
    return new NextResponse('Not found', { status: 404 });
  }

  /* ---------------- DECRYPT ---------------- */

  const encrypted = await downloadEncryptedFile(report.storagePath);

  const decrypted = decryptBuffer(
    encrypted,
    report.iv!,
    report.authTag!
  );

  /* ---------------- ACTIVITY LOG ---------------- */

  await prisma.orderActivity.create({
    data: {
      orderId: report.orderId,
      action: 'REPORT_DOWNLOADED',
      performedBy: 'USER'
    }
  });

  return new NextResponse(decrypted, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'inline'
    }
  });
}

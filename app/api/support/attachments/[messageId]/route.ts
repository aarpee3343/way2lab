import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/db';
import { decryptBuffer } from '@/lib/crypto';
import { downloadEncryptedFile } from '@/lib/gcs';

export const runtime = 'nodejs';

const ATTACHMENT_PREFIX = '__ATTACHMENT__::';

type AttachmentPayload = {
  name: string;
  mime: string;
  size: number;
  path: string;
  iv: string;
  tag: string;
};

const sanitizeFilename = (name: string) =>
  name.replace(/[^a-zA-Z0-9._-]/g, '_') || 'attachment';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ messageId: string }> }
) {
  try {
    const { messageId } = await params;
    const id = Number(messageId);
    if (!id) return new NextResponse('Invalid attachment id', { status: 400 });

    const secret = process.env.JWT_SECRET
      ? new TextEncoder().encode(process.env.JWT_SECRET)
      : null;
    if (!secret) return new NextResponse('Server misconfigured', { status: 500 });

    const cookieStore = await cookies();
    const adminToken = cookieStore.get('admin_token')?.value;
    const corpToken = cookieStore.get('corp_token')?.value;

    let isAdmin = false;
    let corporateId: number | null = null;

    if (adminToken) {
      try {
        const { payload } = await jwtVerify(adminToken, secret);
        if (payload.role === 'admin') {
          isAdmin = true;
        }
      } catch {
        // ignore and fall back to corp auth
      }
    }

    if (!isAdmin && corpToken) {
      try {
        const { payload } = await jwtVerify(corpToken, secret);
        corporateId = Number(payload.corporateId);
      } catch {
        return new NextResponse('Unauthorized', { status: 401 });
      }
    }

    if (!isAdmin && !corporateId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const message = await prisma.ticketMessage.findUnique({
      where: { id },
      include: { ticket: { select: { corporateId: true } } }
    });

    if (!message) return new NextResponse('Attachment not found', { status: 404 });
    if (!isAdmin && message.ticket.corporateId !== corporateId) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    if (!message.message.startsWith(ATTACHMENT_PREFIX)) {
      return new NextResponse('Attachment not found', { status: 404 });
    }

    let payload: AttachmentPayload | null = null;
    try {
      payload = JSON.parse(message.message.slice(ATTACHMENT_PREFIX.length));
    } catch {
      return new NextResponse('Attachment data invalid', { status: 400 });
    }

    if (!payload?.path || !payload.iv || !payload.tag) {
      return new NextResponse('Attachment data invalid', { status: 400 });
    }

    const encrypted = await downloadEncryptedFile(payload.path);
    const decrypted = decryptBuffer(
      encrypted,
      Buffer.from(payload.iv, 'base64'),
      Buffer.from(payload.tag, 'base64')
    );

    return new NextResponse(new Uint8Array(decrypted), {
      headers: {
        'Content-Type': payload.mime || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${sanitizeFilename(payload.name)}"`
      }
    });
  } catch (error) {
    console.error('Attachment download error', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

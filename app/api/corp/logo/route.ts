import { NextResponse } from 'next/server';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { prisma } from '@/lib/db';
import { getCorpUser } from '@/lib/auth-corp';
import { revalidatePath } from 'next/cache';

const MAX_LOGO_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/svg+xml'
]);

const EXT_BY_MIME: Record<string, string> = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/webp': '.webp',
  'image/svg+xml': '.svg'
};

export async function POST(req: Request) {
  const session = await getCorpUser();
  if (!session?.corporateId) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file');

    if (!file || typeof file === 'string') {
      return NextResponse.json({ success: false, error: 'Logo file is required' }, { status: 400 });
    }

    if (file.size > MAX_LOGO_SIZE) {
      return NextResponse.json({ success: false, error: 'Logo must be under 5MB' }, { status: 400 });
    }

    if (!ALLOWED_MIME.has(file.type)) {
      return NextResponse.json({ success: false, error: 'Unsupported file type' }, { status: 400 });
    }

    const ext = path.extname(file.name) || EXT_BY_MIME[file.type] || '.png';
    const fileName = `corp-${session.corporateId}-${Date.now()}${ext.toLowerCase()}`;
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'corporate-logos');
    await mkdir(uploadDir, { recursive: true });

    const bytes = await file.arrayBuffer();
    await writeFile(path.join(uploadDir, fileName), Buffer.from(bytes));

    const publicUrl = `/uploads/corporate-logos/${fileName}`;

    await prisma.corporate.update({
      where: { id: session.corporateId },
      data: { logoUrl: publicUrl }
    });

    revalidatePath('/corp');
    revalidatePath('/corp-settings');

    return NextResponse.json({ success: true, logoUrl: publicUrl });
  } catch (error: any) {
    console.error('Corporate logo upload failed', error);
    return NextResponse.json({ success: false, error: error.message || 'Upload failed' }, { status: 500 });
  }
}

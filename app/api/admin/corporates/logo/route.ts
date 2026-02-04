import { NextResponse } from 'next/server';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';
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
  try {
    await requireAdmin({ roles: ['SUPER_ADMIN'] });
  } catch {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file');
    const corporateId = Number(formData.get('corporateId'));

    if (!corporateId) {
      return NextResponse.json({ success: false, error: 'Corporate ID is required' }, { status: 400 });
    }

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
    const fileName = `corp-${corporateId}-${Date.now()}${ext.toLowerCase()}`;
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'corporate-logos');
    await mkdir(uploadDir, { recursive: true });

    const bytes = await file.arrayBuffer();
    await writeFile(path.join(uploadDir, fileName), Buffer.from(bytes));

    const publicUrl = `/uploads/corporate-logos/${fileName}`;

    await prisma.corporate.update({
      where: { id: corporateId },
      data: { logoUrl: publicUrl }
    });

    revalidatePath(`/admin/corporates/${corporateId}`);
    revalidatePath('/corp');
    revalidatePath('/corp-settings');

    return NextResponse.json({ success: true, logoUrl: publicUrl });
  } catch (error: any) {
    console.error('Admin corporate logo upload failed', error);
    return NextResponse.json({ success: false, error: error.message || 'Upload failed' }, { status: 500 });
  }
}

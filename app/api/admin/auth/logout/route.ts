import { NextResponse } from 'next/server';
import { clearAdminAuthCookie } from '@/lib/admin-auth';

export async function POST() {
  await clearAdminAuthCookie();
  return NextResponse.json({ success: true });
}

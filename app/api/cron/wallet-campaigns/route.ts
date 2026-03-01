export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';

import { processActiveWalletCampaignsSystemAction } from '@/app/actions/adminWalletActions';

function isAuthorized(req: Request) {
  const expected = process.env.CRON_SECRET || process.env.SCHEDULER_SECRET || '';
  const authHeader = req.headers.get('authorization') || '';
  const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  const cronHeader = req.headers.get('x-cron-secret') || '';
  const vercelCron = req.headers.get('x-vercel-cron');

  if (expected && (bearer === expected || cronHeader === expected)) return true;
  if (!expected && vercelCron) return true;
  return false;
}

export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const maxCampaigns = Math.min(20, Math.max(1, Number(searchParams.get('maxCampaigns') || 10)));
  const result = await processActiveWalletCampaignsSystemAction(maxCampaigns);

  return NextResponse.json({
    ...result,
    maxCampaigns
  });
}

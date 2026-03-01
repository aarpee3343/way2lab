import { NextResponse } from 'next/server';

import { getCurrentUserWalletOverview } from '@/app/actions/adminWalletActions';

export async function GET() {
  try {
    const data = await getCurrentUserWalletOverview();
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    if (error?.message === 'UNAUTHORIZED') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ success: false, message: 'Failed to load wallet' }, { status: 500 });
  }
}

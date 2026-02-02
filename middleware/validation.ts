// middleware/validation.ts
import { NextRequest, NextResponse } from 'next/server';

export function validateDashboardQuery(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get('limit') || '10');
  const page = parseInt(searchParams.get('page') || '1');
  
  if (limit > 100) {
    return NextResponse.json(
      { message: 'Limit cannot exceed 100' },
      { status: 400 }
    );
  }
  
  if (page < 1) {
    return NextResponse.json(
      { message: 'Page must be at least 1' },
      { status: 400 }
    );
  }
  
  return null;
}
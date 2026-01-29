import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ message: "Receipt generation is currently disabled." });
}
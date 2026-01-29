export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

// GET ALL ADDRESSES
export async function GET(req: Request) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    const addresses = await prisma.customerAddress.findMany({
      where: { customerId: user.id },
      orderBy: { id: 'desc' }
    });
    return NextResponse.json(addresses);
  } catch (error) {
    return NextResponse.json({ message: 'Error fetching addresses' }, { status: 500 });
  }
}

// ADD NEW ADDRESS
export async function POST(req: Request) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    
    // Map snake_case from frontend/controller to camelCase for Prisma
    const newAddr = await prisma.customerAddress.create({
      data: {
        customerId: user.id,
        addressLine1: body.address_line1,
        addressLine2: body.address_line2,
        city: body.city,
        state: body.state,
        pincode: body.pincode,
        type: body.type
      }
    });

    return NextResponse.json({
      success: true,
      id: newAddr.id,
      data: {
        line1: newAddr.addressLine1,
        city: newAddr.city,
        pincode: newAddr.pincode,
        type: newAddr.type
      }
    });
  } catch (error) {
    return NextResponse.json({ message: 'Error adding address' }, { status: 500 });
  }
}
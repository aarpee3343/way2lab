import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

// UPDATE Address
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    const { address_line1, address_line2, city, state, pincode, type } = await req.json();
    const id = parseInt(params.id);

    // Verify ownership
    const exists = await prisma.customerAddress.findFirst({
      where: { id, customerId: user.id }
    });

    if (!exists) return NextResponse.json({ message: 'Address not found' }, { status: 404 });

    const updated = await prisma.customerAddress.update({
      where: { id },
      data: {
        addressLine1: address_line1,
        addressLine2: address_line2,
        city,
        state,
        pincode,
        type
      }
    });

    return NextResponse.json({ success: true, address: updated });
  } catch (error) {
    return NextResponse.json({ message: 'Error updating address' }, { status: 500 });
  }
}

// DELETE Address
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    const id = parseInt(params.id);

    // Verify ownership
    const exists = await prisma.customerAddress.findFirst({
      where: { id, customerId: user.id }
    });

    if (!exists) return NextResponse.json({ message: 'Address not found' }, { status: 404 });

    await prisma.customerAddress.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ message: 'Error deleting address' }, { status: 500 });
  }
}
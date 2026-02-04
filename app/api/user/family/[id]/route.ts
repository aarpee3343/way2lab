import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

// UPDATE Family Member
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    const { name, relationship, gender, date_of_birth, phone, email } = await req.json();
    const { id: rawId } = await params;
    const id = parseInt(rawId);

    // Check ownership
    const exists = await prisma.familyMember.findFirst({
      where: { id, customerId: user.id }
    });

    if (!exists) return NextResponse.json({ message: 'Member not found' }, { status: 404 });

    const updated = await prisma.familyMember.update({
      where: { id },
      data: {
        name,
        relationship,
        gender,
        dateOfBirth: date_of_birth ? new Date(date_of_birth) : null,
        phone: phone || null,
        email: email || null
      }
    });

    return NextResponse.json({ success: true, member: updated });
  } catch (error) {
    return NextResponse.json({ message: 'Error updating family member' }, { status: 500 });
  }
}

// DELETE Family Member
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    const { id: rawId } = await params;
    const id = parseInt(rawId);

    const exists = await prisma.familyMember.findFirst({
      where: { id, customerId: user.id }
    });

    if (!exists) return NextResponse.json({ message: 'Member not found' }, { status: 404 });

    await prisma.familyMember.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ message: 'Error deleting family member' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

// GET Family Members
export async function GET(req: Request) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    const members = await prisma.familyMember.findMany({
      where: { customerId: user.id }
    });
    return NextResponse.json(members);
  } catch (error) {
    return NextResponse.json({ message: 'Error fetching family members' }, { status: 500 });
  }
}

// ADD Family Member
export async function POST(req: Request) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    const { name, relationship, gender, date_of_birth, phone, email } = await req.json();

    // Generate UHID
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    const uhid = `WTLF${randomSuffix}`;

    const member = await prisma.familyMember.create({
      data: {
        customerId: user.id,
        uhid,
        name,
        relationship,
        gender,
        dateOfBirth: date_of_birth ? new Date(date_of_birth) : null,
        phone: phone || null,
        email: email || null
      }
    });

    return NextResponse.json({
      success: true,
      id: member.id,
      data: {
        name: member.name,
        relationship: member.relationship
      }
    });
  } catch (error) {
    return NextResponse.json({ message: 'Error adding family member' }, { status: 500 });
  }
}

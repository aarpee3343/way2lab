import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { generateFamilyUHID } from '@/lib/utils/generators';

export async function POST(req: Request) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const { action, ...data } = body;

    // --- ADD ADDRESS ---
    if (action === 'add_address') {
      const { address_line1, address_line2, city, state, pincode, type } = data;
      
      const newAddress = await prisma.customerAddress.create({
        data: {
          customerId: user.id,
          addressLine1: address_line1,
          addressLine2: address_line2,
          city,
          state,
          pincode,
          type
        }
      });
      
      return NextResponse.json({ success: true, id: newAddress.id, data: newAddress });
    } 
    
    // --- ADD FAMILY MEMBER ---
    else if (action === 'add_member') {
      const { name, relationship, gender, date_of_birth, phone } = data;
      const uhid = await generateFamilyUHID();
      
      const newMember = await prisma.familyMember.create({
        data: {
          customerId: user.id,
          uhid,
          name,
          relationship,
          gender,
          dateOfBirth: new Date(date_of_birth),
          phone
        }
      });

      return NextResponse.json({ success: true, id: newMember.id, data: newMember });
    } 
    
    return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 });

  } catch (error: any) {
    console.error("Checkout Helper Error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

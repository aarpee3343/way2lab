import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { name, email, subject, message } = await req.json();

    if (!name || !email || !message) {
      return NextResponse.json({ success: false, message: 'Missing fields' }, { status: 400 });
    }

    await prisma.contactRequest.create({
      data: { name, email, subject, message }
    });

    // Optional: Trigger email notification here

    return NextResponse.json({ success: true, message: 'Message sent successfully' });

  } catch (error) {
    console.error("Contact API Error:", error);
    return NextResponse.json({ success: false, message: 'Server Error' }, { status: 500 });
  }
}
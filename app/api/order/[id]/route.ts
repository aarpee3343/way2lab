import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    if (!id) return NextResponse.json({ message: "Missing ID" }, { status: 400 });

    // ✅ UPDATED DATA SELECTION
    const includeData = {
      // 1. Order Items (Test/Packages)
      items: true,
      
      // 2. Lab Details
      lab: {
        select: {
          labName: true,
          address: true,
          city: true,
          pincode: true,
          contactNo: true,
          // Add any other specific lab fields you need
        }
      },
      
      // 3. Technician (Strictly Name & Phone only)
      technician: {
        select: {
          name: true,
          phone: true
        }
      },

      // 4. Reports & Summary
      reports: true,
      reportSummary: true,

      // 5. Others
      address: true,
      customer: true,
      coupon: true,
    };

    // --- Lookup Logic (Same as before) ---
    let order = await prisma.order.findUnique({
      where: { orderNumber: id },
      include: includeData
    });

    if (!order) {
      const numericId = parseInt(id);
      if (!isNaN(numericId) && numericId < 2147483647) {
        order = await prisma.order.findUnique({
          where: { id: numericId },
          include: includeData
        });
      }
    }

    if (!order) return NextResponse.json({ message: "Order not found" }, { status: 404 });
    if (order.userId !== user.id) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    // Handle BigInt/Decimal serialization safety
    return NextResponse.json(JSON.parse(JSON.stringify(order)));

  } catch (error) {
    console.error("Order Fetch Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
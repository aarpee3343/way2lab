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

      // 4.5 Package (for report sharing rules)
      package: {
        select: { isPreEmployment: true, reportVisibility: true, isCorporate: true }
      },

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

    let sharePolicy: 'USER_ONLY' | 'CORPORATE_ONLY' | 'BOTH' =
      order.package?.reportVisibility || 'USER_ONLY';
    if (order.package?.isPreEmployment) {
      sharePolicy = 'CORPORATE_ONLY';
    }
    if (user.corporateId && order.packageId) {
      const service = await prisma.corporateService.findFirst({
        where: { corporateId: user.corporateId, isActive: true, packageId: order.packageId },
        select: { reportVisibilityOverride: true, package: { select: { isPreEmployment: true, reportVisibility: true } } }
      });
      if (service?.package?.isPreEmployment) {
        sharePolicy = 'CORPORATE_ONLY';
      } else if (service?.reportVisibilityOverride) {
        sharePolicy = service.reportVisibilityOverride as any;
      } else if (service?.package?.reportVisibility) {
        sharePolicy = service.package.reportVisibility as any;
      }
    }

    const canShare = Boolean(user.corporateId) && !order.package?.isPreEmployment && sharePolicy === 'USER_ONLY';

    // Handle BigInt/Decimal serialization safety
    return NextResponse.json(JSON.parse(JSON.stringify({ ...order, sharePolicy, canShare })));

  } catch (error) {
    console.error("Order Fetch Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

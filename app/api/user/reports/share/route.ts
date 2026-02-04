import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function PATCH(req: Request) {
  const user = await getAuthUser(req);
  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const orderId = Number(body?.orderId);
  const share = Boolean(body?.share);

  if (!orderId) {
    return NextResponse.json({ message: 'Invalid order id' }, { status: 400 });
  }

  if (!user.corporateId) {
    return NextResponse.json({ message: 'Not a corporate employee' }, { status: 403 });
  }

  const order = await prisma.order.findFirst({
    where: { id: orderId, userId: user.id },
    select: {
      id: true,
      packageId: true,
      package: { select: { isPreEmployment: true, reportVisibility: true } }
    }
  });

  if (!order) {
    return NextResponse.json({ message: 'Order not found' }, { status: 404 });
  }

  if (order.package?.isPreEmployment) {
    return NextResponse.json({ message: 'Pre-employment reports cannot be shared' }, { status: 400 });
  }

  const service = order.packageId
    ? await prisma.corporateService.findFirst({
        where: { corporateId: user.corporateId, isActive: true, packageId: order.packageId },
        select: { reportVisibilityOverride: true, package: { select: { isPreEmployment: true, reportVisibility: true } } }
      })
    : null;

  const policy = service?.package?.isPreEmployment
    ? 'CORPORATE_ONLY'
    : (service?.reportVisibilityOverride || service?.package?.reportVisibility || order.package?.reportVisibility || 'USER_ONLY');

  if (policy !== 'USER_ONLY') {
    return NextResponse.json({ message: 'Sharing not required for this package' }, { status: 400 });
  }

  await prisma.order.update({
    where: { id: orderId },
    data: { isReportSharedWithCorp: share }
  });

  return NextResponse.json({ success: true });
}

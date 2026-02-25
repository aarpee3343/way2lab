export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { prisma } from '@/lib/db';

type SearchResult = {
  id: string;
  group: string;
  label: string;
  description?: string;
  href: string;
  status?: string;
};

const titleCase = (value: string | null | undefined) =>
  String(value || '')
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (m) => m.toUpperCase());

export async function GET(req: Request) {
  try {
    await requireAdmin({ roles: ['SUPER_ADMIN', 'ADMIN'] });
  } catch {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const q = String(searchParams.get('q') || '').trim();

  if (!q) {
    return NextResponse.json({ success: true, query: q, results: [] as SearchResult[] });
  }

  const qNum = /^\d+$/.test(q) ? Number(q) : null;

  const [
    orders,
    customers,
    corporates,
    labs,
    tests,
    packages,
    technicians,
    coupons,
    corporateTickets,
    contactRequests,
    corporateServices,
  ] = await Promise.all([
    prisma.order.findMany({
      where: {
        OR: [
          { orderNumber: { contains: q, mode: 'insensitive' } },
          { patientName: { contains: q, mode: 'insensitive' } },
          { patientPhone: { contains: q } },
          { customer: { name: { contains: q, mode: 'insensitive' } } },
          { customer: { email: { contains: q, mode: 'insensitive' } } },
          { customer: { phone: { contains: q } } },
          ...(qNum ? [{ id: qNum }] : []),
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 8,
      select: {
        id: true,
        orderNumber: true,
        patientName: true,
        status: true,
        customer: { select: { name: true } },
      },
    }),
    prisma.customer.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
          { phone: { contains: q } },
          { uhid: { contains: q, mode: 'insensitive' } },
          { employeeId: { contains: q, mode: 'insensitive' } },
          { corporate: { companyName: { contains: q, mode: 'insensitive' } } },
          ...(qNum ? [{ id: qNum }] : []),
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 8,
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        isActive: true,
        corporate: { select: { companyName: true } },
      },
    }),
    prisma.corporate.findMany({
      where: {
        OR: [
          { companyName: { contains: q, mode: 'insensitive' } },
          { contactPerson: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
          { phone: { contains: q } },
          ...(qNum ? [{ id: qNum }] : []),
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 8,
      select: {
        id: true,
        companyName: true,
        contactPerson: true,
        isActive: true,
      },
    }),
    prisma.lab.findMany({
      where: {
        OR: [
          { labName: { contains: q, mode: 'insensitive' } },
          { city: { contains: q, mode: 'insensitive' } },
          { pincode: { contains: q } },
          { contactNo: { contains: q } },
          { email: { contains: q, mode: 'insensitive' } },
          ...(qNum ? [{ id: qNum }] : []),
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 8,
      select: {
        id: true,
        labName: true,
        city: true,
        status: true,
        activeStatus: true,
      },
    }),
    prisma.test.findMany({
      where: {
        OR: [
          { testName: { contains: q, mode: 'insensitive' } },
          { slug: { contains: q, mode: 'insensitive' } },
          { category: { contains: q, mode: 'insensitive' } },
          { specialty: { contains: q, mode: 'insensitive' } },
          ...(qNum ? [{ id: qNum }] : []),
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 8,
      select: {
        id: true,
        testName: true,
        category: true,
        isActive: true,
      },
    }),
    prisma.package.findMany({
      where: {
        OR: [
          { packageName: { contains: q, mode: 'insensitive' } },
          { category: { contains: q, mode: 'insensitive' } },
          { tag: { contains: q, mode: 'insensitive' } },
          ...(qNum ? [{ id: qNum }] : []),
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 8,
      select: {
        id: true,
        packageName: true,
        isCorporate: true,
        isActive: true,
      },
    }),
    prisma.technician.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { phone: { contains: q } },
          { email: { contains: q, mode: 'insensitive' } },
          { username: { contains: q, mode: 'insensitive' } },
          ...(qNum ? [{ id: qNum }] : []),
        ],
      },
      orderBy: { id: 'desc' },
      take: 8,
      select: {
        id: true,
        name: true,
        phone: true,
        isActive: true,
      },
    }),
    prisma.coupon.findMany({
      where: {
        OR: [
          { code: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
          { couponScope: { contains: q, mode: 'insensitive' } },
          ...(qNum ? [{ id: qNum }] : []),
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 8,
      select: {
        id: true,
        code: true,
        isActive: true,
        couponScope: true,
      },
    }),
    prisma.corporateTicket.findMany({
      where: {
        OR: [
          { subject: { contains: q, mode: 'insensitive' } },
          { status: { contains: q, mode: 'insensitive' } },
          { corporate: { companyName: { contains: q, mode: 'insensitive' } } },
          ...(qNum ? [{ id: qNum }] : []),
        ],
      },
      orderBy: { updatedAt: 'desc' },
      take: 8,
      select: {
        id: true,
        subject: true,
        status: true,
        corporate: { select: { companyName: true } },
      },
    }),
    prisma.contactRequest.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
          { subject: { contains: q, mode: 'insensitive' } },
          { message: { contains: q, mode: 'insensitive' } },
          ...(qNum ? [{ id: qNum }] : []),
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 8,
      select: {
        id: true,
        name: true,
        email: true,
        subject: true,
        status: true,
      },
    }),
    prisma.corporateService.findMany({
      where: {
        OR: [
          { corporate: { companyName: { contains: q, mode: 'insensitive' } } },
          { package: { packageName: { contains: q, mode: 'insensitive' } } },
          { coupon: { code: { contains: q, mode: 'insensitive' } } },
          ...(qNum ? [{ id: qNum }] : []),
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 8,
      select: {
        id: true,
        isActive: true,
        corporate: { select: { id: true, companyName: true } },
        package: { select: { packageName: true } },
        coupon: { select: { code: true } },
      },
    }),
  ]);

  const results: SearchResult[] = [
    ...orders.map((order) => ({
      id: `order-${order.id}`,
      group: 'Orders',
      label: `${order.orderNumber || `#${order.id}`} • ${order.patientName}`,
      description: order.customer?.name || undefined,
      href: `/admin/orders/${order.id}`,
      status: titleCase(order.status),
    })),
    ...customers.map((customer) => ({
      id: `customer-${customer.id}`,
      group: 'Customers',
      label: customer.name || `Customer #${customer.id}`,
      description:
        [customer.phone, customer.email, customer.corporate?.companyName]
          .filter(Boolean)
          .join(' • ') || undefined,
      href: `/admin/customers/${customer.id}`,
      status: customer.isActive ? 'Active' : 'Inactive',
    })),
    ...corporates.map((corp) => ({
      id: `corporate-${corp.id}`,
      group: 'Corporates',
      label: corp.companyName,
      description: [corp.contactPerson, `#${corp.id}`].filter(Boolean).join(' • '),
      href: `/admin/corporates/${corp.id}`,
      status: corp.isActive ? 'Active' : 'Archived',
    })),
    ...labs.map((lab) => ({
      id: `lab-${lab.id}`,
      group: 'Labs',
      label: lab.labName,
      description: [lab.city, `#${lab.id}`].filter(Boolean).join(' • '),
      href: `/admin/labs/${lab.id}`,
      status: lab.activeStatus ? titleCase(lab.status) || 'Active' : 'Inactive',
    })),
    ...tests.map((test) => ({
      id: `test-${test.id}`,
      group: 'Tests',
      label: test.testName,
      description: [test.category, `#${test.id}`].filter(Boolean).join(' • '),
      href: `/admin/tests/${test.id}`,
      status: test.isActive ? 'Active' : 'Inactive',
    })),
    ...packages.map((pkg) => ({
      id: `package-${pkg.id}`,
      group: 'Packages',
      label: pkg.packageName,
      description: [pkg.isCorporate ? 'Corporate' : 'General', `#${pkg.id}`].join(' • '),
      href: `/admin/packages/edit/${pkg.id}`,
      status: pkg.isActive ? 'Active' : 'Inactive',
    })),
    ...technicians.map((technician) => ({
      id: `technician-${technician.id}`,
      group: 'Technicians',
      label: technician.name,
      description: [technician.phone, `#${technician.id}`].filter(Boolean).join(' • '),
      href: `/admin/technicians/edit/${technician.id}`,
      status: technician.isActive ? 'Active' : 'Inactive',
    })),
    ...coupons.map((coupon) => ({
      id: `coupon-${coupon.id}`,
      group: 'Coupons',
      label: coupon.code,
      description: [coupon.couponScope, `#${coupon.id}`].join(' • '),
      href: '/admin/coupons',
      status: coupon.isActive ? 'Active' : 'Inactive',
    })),
    ...corporateTickets.map((ticket) => ({
      id: `ticket-${ticket.id}`,
      group: 'Support',
      label: ticket.subject || `Ticket #${ticket.id}`,
      description: ticket.corporate?.companyName || undefined,
      href: `/admin/support/${ticket.id}`,
      status: titleCase(ticket.status),
    })),
    ...contactRequests.map((request) => ({
      id: `contact-${request.id}`,
      group: 'Support',
      label: request.subject || `Request #${request.id}`,
      description: [request.name, request.email].filter(Boolean).join(' • ') || undefined,
      href: `/admin/support/general/${request.id}`,
      status: titleCase(request.status),
    })),
    ...corporateServices.map((service) => ({
      id: `corp-service-${service.id}`,
      group: 'Corporate Services',
      label: service.package?.packageName || `Coupon ${service.coupon?.code || ''}`.trim(),
      description: service.corporate?.companyName || undefined,
      href: service.corporate?.id
        ? `/admin/corporates/${service.corporate.id}/services/${service.id}`
        : '/admin/corporates/services',
      status: service.isActive ? 'Active' : 'Inactive',
    })),
  ];

  return NextResponse.json({
    success: true,
    query: q,
    count: results.length,
    results,
  });
}

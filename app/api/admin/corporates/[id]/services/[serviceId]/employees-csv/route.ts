import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { getCorporateServiceEmployeeReport } from '@/lib/corporate-service-report';

function csvEscape(value: unknown) {
  const str = String(value ?? '');
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string; serviceId: string }> }
) {
  try {
    await requireAdmin({ roles: ['SUPER_ADMIN', 'ADMIN'] });
    const { id, serviceId } = await params;
    const corporateId = Number(id);
    const serviceIdNum = Number(serviceId);
    if (!corporateId || !serviceIdNum) {
      return NextResponse.json({ message: 'Invalid params' }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const status = String(searchParams.get('status') || 'ALL').toUpperCase() as
      | 'ALL'
      | 'PENDING'
      | 'IN_PROCESS'
      | 'AVAILED';
    const from = String(searchParams.get('from') || '');
    const to = String(searchParams.get('to') || '');

    const report = await getCorporateServiceEmployeeReport({
      corporateId,
      serviceId: serviceIdNum,
      status,
      from,
      to
    });
    if (!report.service) {
      return NextResponse.json({ message: 'Service not found' }, { status: 404 });
    }

    const service: any = report.service;
    const serviceName = service.package?.packageName || `Coupon ${service.coupon?.code || ''}`;
    const lines: string[] = [];

    lines.push('Service Details');
    lines.push(`Corporate,${csvEscape(service.corporate?.companyName || '')}`);
    lines.push(`Service ID,${csvEscape(service.id)}`);
    lines.push(`Service Name,${csvEscape(serviceName)}`);
    lines.push(`Service Status,${csvEscape(service.isActive ? 'Active' : 'Inactive')}`);
    lines.push(`Valid From,${csvEscape(service.validFrom || '')}`);
    lines.push(`Valid Till,${csvEscape(service.validTill || '')}`);
    lines.push(`Filter Status,${csvEscape(status)}`);
    lines.push(`Filter From,${csvEscape(from)}`);
    lines.push(`Filter To,${csvEscape(to)}`);
    lines.push(`Total Employees,${csvEscape(report.counts.total)}`);
    lines.push(`Availed,${csvEscape(report.counts.availed)}`);
    lines.push(`In Process,${csvEscape(report.counts.inProcess)}`);
    lines.push(`Pending,${csvEscape(report.counts.pending)}`);
    lines.push('');

    lines.push('Employee List');
    lines.push([
      'Sr No',
      'Employee Name',
      'Employee ID',
      'Email',
      'Phone',
      'Employee Active',
      'Service Status',
      'Order Number',
      'Order Booked At',
      'Order Completed At'
    ].join(','));

    report.rows.forEach((row, idx) => {
      lines.push([
        csvEscape(idx + 1),
        csvEscape(row.name),
        csvEscape(row.employeeCode || ''),
        csvEscape(row.email || ''),
        csvEscape(row.phone || ''),
        csvEscape(row.isEmployeeActive ? 'Yes' : 'No'),
        csvEscape(row.status),
        csvEscape(row.orderNumber || ''),
        csvEscape(row.orderBookedAt || ''),
        csvEscape(row.completedAt || '')
      ].join(','));
    });

    const filename = `corporate-service-${service.id}-employees.csv`;
    return new NextResponse(lines.join('\n'), {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    });
  } catch (error) {
    console.error('Service employee CSV export failed:', error);
    return NextResponse.json({ message: 'Failed to export CSV' }, { status: 500 });
  }
}

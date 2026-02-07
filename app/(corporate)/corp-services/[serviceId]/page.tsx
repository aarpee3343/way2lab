'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Download,
  Search,
  Filter,
  Users,
  CheckCircle2,
  Clock3,
  ClipboardList
} from 'lucide-react';
import { toast } from '@/lib/safe-toast';
import { getCorporateServiceDetails } from '@/app/actions/corporatePortalActions';

type UsageFilter = 'ALL' | 'AVAILED' | 'PENDING';

function escapeCsv(value: unknown) {
  const text = String(value ?? '');
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export default function CorporateServiceDetailsPage() {
  const params = useParams<{ serviceId: string }>();
  const router = useRouter();
  const serviceId = Number(params?.serviceId);

  const [search, setSearch] = useState('');
  const [usageStatus, setUsageStatus] = useState<UsageFilter>('ALL');
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (!serviceId) {
      toast.error('Invalid service');
      router.replace('/corp');
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      const details = await getCorporateServiceDetails(serviceId, {
        search: search || undefined,
        usageStatus
      });

      if (!details) {
        toast.error('Service not found or access denied');
        router.replace('/corp');
        return;
      }

      setData(details);
      setLoading(false);
    }, 250);

    return () => clearTimeout(timer);
  }, [router, search, serviceId, usageStatus]);

  const maskValue = (value?: string | null) => {
    if (!value) return '-';
    if (!data?.maskContactInfo) return value;

    if (value.includes('@')) {
      const [user, domain] = value.split('@');
      return `${user.slice(0, 2)}***@${domain}`;
    }
    return `${value.slice(0, 2)}******${value.slice(-2)}`;
  };

  const rows = data?.employees || [];
  const summary = data?.summary;
  const service = data?.service;

  const subtitle = useMemo(() => {
    if (!service) return '';
    const typeLabel = service.type === 'PACKAGE' ? 'Package Service' : 'Coupon Service';
    return `${typeLabel} - Valid ${new Date(service.validFrom).toLocaleDateString()} to ${new Date(
      service.validTill
    ).toLocaleDateString()}`;
  }, [service]);

  const handleDownloadCsv = async () => {
    if (!serviceId) return;
    setDownloading(true);

    try {
      const complete = await getCorporateServiceDetails(serviceId, { usageStatus: 'ALL' });
      if (!complete?.employeesComplete?.length) {
        toast.error('No employees found for this service');
        setDownloading(false);
        return;
      }

      const csvHeaders = [
        'serviceId',
        'serviceName',
        'serviceType',
        'couponCode',
        'packageId',
        'validFrom',
        'validTill',
        'assignmentMode',
        'selfUsageLimit',
        'familyUsageLimit',
        'selfPaymentType',
        'familyPaymentType',
        'employeeName',
        'employeeId',
        'email',
        'phone',
        'department',
        'location',
        'employeeStatus',
        'serviceUsageStatus',
        'availedCount',
        'lastAvailedAt'
      ];

      const csvRows = complete.employeesComplete.map((employee: any) => [
        complete.service.id,
        complete.service.name,
        complete.service.type,
        complete.service.couponCode || '',
        complete.service.packageId || '',
        complete.service.validFrom,
        complete.service.validTill,
        complete.service.assignmentMode,
        complete.service.selfUsageLimit,
        complete.service.familyUsageLimit,
        complete.service.selfPaymentType,
        complete.service.familyPaymentType,
        employee.name,
        employee.employeeId,
        employee.email,
        employee.phone,
        employee.department,
        employee.location,
        employee.employeeStatus,
        employee.usageStatus,
        employee.availedCount,
        employee.lastAvailedAt || ''
      ]);

      const csv = [
        csvHeaders.map(escapeCsv).join(','),
        ...csvRows.map((row: unknown[]) => row.map(escapeCsv).join(','))
      ].join('\n');

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `corporate_service_${complete.service.id}_employees.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error('Failed to generate CSV');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm">
        <div>
          <button
            onClick={() => router.push('/corp')}
            className="mb-3 inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-500 hover:text-blue-600"
          >
            <ArrowLeft size={14} />
            Back To Dashboard
          </button>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {service?.name || 'Service Details'}
          </h1>
          <p className="text-sm text-slate-500 font-medium">{subtitle}</p>
        </div>

        <button
          onClick={handleDownloadCsv}
          disabled={downloading || loading}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-xl disabled:opacity-60"
        >
          <Download size={16} />
          {downloading ? 'Preparing CSV...' : 'Download Complete CSV'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Assigned Employees</p>
          <p className="text-2xl font-black text-slate-900 mt-2">{summary?.totalAssigned ?? 0}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Availed Employees</p>
          <p className="text-2xl font-black text-emerald-600 mt-2">{summary?.availedEmployees ?? 0}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pending Employees</p>
          <p className="text-2xl font-black text-amber-600 mt-2">{summary?.pendingEmployees ?? 0}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Availed Orders</p>
          <p className="text-2xl font-black text-blue-600 mt-2">{summary?.totalAvailedOrders ?? 0}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 relative group">
          <Search className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
          <input
            type="text"
            placeholder="Search employee by name, email, phone, or employee ID"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full bg-white border border-slate-200 rounded-2xl pl-11 pr-4 py-3.5 outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium"
          />
        </div>
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-2xl px-4">
          <Filter size={16} className="text-slate-400" />
          <select
            value={usageStatus}
            onChange={(event) => setUsageStatus(event.target.value as UsageFilter)}
            className="w-full bg-transparent py-3.5 text-sm font-bold text-slate-700 outline-none"
          >
            <option value="ALL">All Usage Status</option>
            <option value="AVAILED">Availed</option>
            <option value="PENDING">Pending</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
            <Users size={16} className="text-blue-600" />
            Assigned Employees
          </h3>
          <div className="text-[11px] font-bold text-slate-500">
            Assignment Mode: {service?.assignmentMode === 'PACKAGE_ASSIGNMENT' ? 'Specific Package Assignment' : 'All Employees'}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white">
              <tr>
                <th className="px-8 py-4">Employee</th>
                <th className="px-4 py-4">Department</th>
                <th className="px-4 py-4">Location</th>
                <th className="px-4 py-4 text-center">Employee Status</th>
                <th className="px-4 py-4 text-center">Service Status</th>
                <th className="px-4 py-4 text-center">Availed Count</th>
                <th className="px-8 py-4 text-right">Last Availed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading && (
                <tr>
                  <td colSpan={7} className="px-8 py-6 text-slate-500">
                    Loading service data...
                  </td>
                </tr>
              )}

              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-8 py-6 text-slate-500">
                    No employees found for this service.
                  </td>
                </tr>
              )}

              {!loading &&
                rows.map((employee: any) => (
                  <tr key={employee.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-5">
                      <p className="font-black text-slate-800">{employee.name}</p>
                      <p className="text-[10px] font-bold text-slate-400 mt-0.5">
                        {employee.employeeId || '-'}
                      </p>
                      <p className="text-[10px] font-semibold text-slate-400 mt-1">
                        {maskValue(employee.email)} - {maskValue(employee.phone)}
                      </p>
                    </td>
                    <td className="px-4 py-5 font-semibold text-slate-600">{employee.department || '-'}</td>
                    <td className="px-4 py-5 font-semibold text-slate-600">{employee.location || '-'}</td>
                    <td className="px-4 py-5 text-center">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                          employee.employeeStatus === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-600'
                            : 'bg-rose-50 text-rose-600'
                        }`}
                      >
                        {employee.employeeStatus === 'ACTIVE' ? <CheckCircle2 size={12} /> : <Clock3 size={12} />}
                        {employee.employeeStatus}
                      </span>
                    </td>
                    <td className="px-4 py-5 text-center">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                          employee.usageStatus === 'AVAILED'
                            ? 'bg-blue-50 text-blue-600'
                            : 'bg-amber-50 text-amber-600'
                        }`}
                      >
                        <ClipboardList size={12} />
                        {employee.usageStatus}
                      </span>
                    </td>
                    <td className="px-4 py-5 text-center font-black text-slate-700">{employee.availedCount}</td>
                    <td className="px-8 py-5 text-right text-xs font-bold text-slate-500">
                      {employee.lastAvailedAt ? new Date(employee.lastAvailedAt).toLocaleString() : '-'}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

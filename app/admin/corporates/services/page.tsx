'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, Trash2 } from 'lucide-react';
import { toast } from '@/lib/safe-toast';
import {
  deleteCorporateServiceAction,
  getCorporateServices,
} from '@/app/actions/adminCorporateActions';
import Button from '@/components/admin/corporate/Button';
import Card from '@/components/admin/corporate/Card';
import Table from '@/components/admin/corporate/Table';
import Badge from '@/components/admin/corporate/Badge';
import Input from '@/components/admin/corporate/Input';
import LoadingSpinner from '@/components/admin/corporate/LoadingSpinner';

type StatusFilter = 'all' | 'active' | 'archived';

export default function CorporateServicesPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');

  const load = async (nextStatus: StatusFilter, nextSearch: string) => {
    setLoading(true);
    const res = await getCorporateServices({ status: nextStatus, search: nextSearch });
    setItems(res || []);
    setLoading(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      load(status, search);
    }, 300);
    return () => clearTimeout(timer);
  }, [status, search]);

  const handleRemove = async (serviceId: number) => {
    if (!confirm('Remove this service from the corporate?')) return;
    const res = await deleteCorporateServiceAction(serviceId);
    if (res.success) {
      toast.success('Service removed');
      load(status, search);
    } else {
      toast.error(res.error || 'Remove failed');
    }
  };

  const rows = items.map((s) => [
    <div key={`corp-${s.id}`}>
      <Link href={`/admin/corporates/${s.corporate.id}`} className="admin-table-row-primary hover:underline">
        {s.corporate.companyName}
      </Link>
      {!s.corporate.isActive && (
        <div className="admin-table-row-secondary text-xs">Archived</div>
      )}
    </div>,
    <div key={`service-${s.id}`}>
      <div className="admin-table-row-primary">
        {s.package?.packageName || `Coupon: ${s.coupon?.code}`}
      </div>
      <div className="admin-table-row-secondary text-xs">
        {s.package ? 'Package' : 'Coupon'}
      </div>
    </div>,
    <span key={`validity-${s.id}`} className="admin-table-row-secondary">
      {new Date(s.validFrom).toLocaleDateString()} - {new Date(s.validTill).toLocaleDateString()}
    </span>,
    <Badge key={`status-${s.id}`} variant={s.isActive ? 'success' : 'default'}>
      {s.isActive ? 'Active' : 'Archived'}
    </Badge>,
    <div key={`action-${s.id}`} className="text-right">
      <Button variant="destructive" size="sm" onClick={() => handleRemove(s.id)}>
        <Trash2 size={14} /> Remove
      </Button>
    </div>,
  ]);

  return (
    <div className="admin-space-y">
      <div className="admin-page-header flex items-center justify-between">
        <div>
          <h1 className="admin-page-title">Corporate Services</h1>
          <p className="admin-page-subtitle">
            Manage service assignments and quickly jump to corporate detail workspaces.
          </p>
        </div>
        <Button href="/admin/corporates" variant="secondary" size="sm">
          Back
        </Button>
      </div>

      <div className="admin-card p-4">
        <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between">
          <div className="flex gap-2">
            {(['all', 'active', 'archived'] as StatusFilter[]).map((s) => (
              <Button
                key={s}
                variant={status === s ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setStatus(s)}
              >
                {s}
              </Button>
            ))}
          </div>

          <div className="relative w-full md:w-80">
            <Search size={16} className="absolute left-3 top-3 text-muted" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search services..."
              className="pl-9"
            />
          </div>
        </div>
      </div>

      <Card header="Service Assignments">
        {loading ? (
          <LoadingSpinner text="Loading services..." />
        ) : items.length === 0 ? (
          <div className="p-6 text-muted text-sm">No services found.</div>
        ) : (
          <Table
            headers={['Corporate', 'Service', 'Validity', 'Status', 'Action']}
            rows={rows}
          />
        )}
      </Card>
    </div>
  );
}


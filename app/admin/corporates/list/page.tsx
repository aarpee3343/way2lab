'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, Archive, RotateCcw } from 'lucide-react';
import { toast } from '@/lib/safe-toast';
import { getCorporatesList, setCorporateActiveStatus } from '@/app/actions/adminCorporateActions';
import Button from '@/components/admin/corporate/Button';
import Card from '@/components/admin/corporate/Card';
import Table from '@/components/admin/corporate/Table';
import Badge from '@/components/admin/corporate/Badge';
import Input from '@/components/admin/corporate/Input';
import LoadingSpinner from '@/components/admin/corporate/LoadingSpinner';

type StatusFilter = 'all' | 'active' | 'archived';

export default function CorporateListPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');

  const load = async (nextStatus: StatusFilter, nextSearch: string) => {
    setLoading(true);
    const res = await getCorporatesList({ status: nextStatus, search: nextSearch });
    setItems(res || []);
    setLoading(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => load(status, search), 300);
    return () => clearTimeout(timer);
  }, [status, search]);

  const handleArchive = async (id: number) => {
    if (!confirm('Archive this corporate? Employees will become regular users.')) return;
    const res = await setCorporateActiveStatus(id, false);
    if (res.success) { toast.success('Corporate archived'); load(status, search); }
    else toast.error(res.error || 'Archive failed');
  };

  const handleRestore = async (id: number) => {
    const res = await setCorporateActiveStatus(id, true);
    if (res.success) { toast.success('Corporate restored'); load(status, search); }
    else toast.error(res.error || 'Restore failed');
  };

  const rows = items.map((c) => [
    <span key={`name-${c.id}`} className="admin-table-row-primary">{c.companyName}</span>,
    <div key={`contact-${c.id}`}>
      <div className="admin-table-row-primary">{c.contactPerson}</div>
      <div className="admin-table-row-secondary">{c.email}</div>
    </div>,
    <span key={`city-${c.id}`} className="admin-table-row-secondary">{c.city || '-'}</span>,
    <span key={`emp-${c.id}`} className="admin-table-row-primary">{c._count.employees}</span>,
    <span key={`serv-${c.id}`} className="admin-table-row-primary">{c._count.services}</span>,
    <Badge key={`status-${c.id}`} variant={c.isActive ? 'success' : 'default'}>
      {c.isActive ? 'Active' : 'Archived'}
    </Badge>,
    <div key={`action-${c.id}`} className="text-right space-x-2">
      <Button href={`/admin/corporates/${c.id}`} variant="secondary" size="sm">Manage</Button>
      {c.isActive ? (
        <Button variant="destructive" size="sm" onClick={() => handleArchive(c.id)}>
          <Archive size={14} /> Archive
        </Button>
      ) : (
        <Button variant="primary" size="sm" onClick={() => handleRestore(c.id)}>
          <RotateCcw size={14} /> Restore
        </Button>
      )}
    </div>
  ]);

  return (
    <div className="admin-space-y">
      <div className="admin-page-header flex items-center justify-between">
        <div>
          <h1 className="admin-page-title">All Corporates</h1>
          <p className="admin-page-subtitle">Search, archive, restore, and open corporate workspaces.</p>
        </div>
        <Button href="/admin/corporates/create" variant="primary" size="sm">Create Corporate</Button>
      </div>

      <div className="admin-card p-4">
        <div className="flex gap-4 items-center justify-between">
          <div className="flex gap-2">
            {(['all', 'active', 'archived'] as StatusFilter[]).map(s => (
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
              placeholder="Search corporates..."
              className="pl-9"
            />
          </div>
        </div>
      </div>

      <Card header="Corporates">
        {loading ? (
          <LoadingSpinner text="Loading corporates..." />
        ) : items.length === 0 ? (
          <div className="p-6 text-muted text-sm">No corporates found.</div>
        ) : (
          <Table
            headers={['Company', 'Contact', 'City', 'Employees', 'Services', 'Status', 'Action']}
            rows={rows}
          />
        )}
      </Card>
    </div>
  );
}


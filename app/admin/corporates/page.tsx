'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getCorporateDashboardStats } from '@/app/actions/adminCorporateActions';
import { Building2, Users } from 'lucide-react';
import StatCard from '@/components/admin/corporate/StatCard';
import Card from '@/components/admin/corporate/Card';
import Table from '@/components/admin/corporate/Table';
import Badge from '@/components/admin/corporate/Badge';
import Button from '@/components/admin/corporate/Button';
import LoadingSpinner from '@/components/admin/corporate/LoadingSpinner';

export default function CorporateDashboard() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    getCorporateDashboardStats().then(setData);
  }, []);

  if (!data) return <LoadingSpinner text="Loading Dashboard..." />;

  const rows = data.recent.map((c: any) => [
    <span key={`name-${c.id}`} className="admin-table-row-primary">{c.companyName}</span>,
    <div key={`contact-${c.id}`}>
      <div className="admin-table-row-primary">{c.contactPerson}</div>
      <div className="admin-table-row-secondary">{c.phone}</div>
    </div>,
    <span key={`city-${c.id}`} className="admin-table-row-secondary">{c.city || '-'}</span>,
    <span key={`emp-${c.id}`} className="admin-table-row-primary">{c._count.employees}</span>,
    <Badge key={`status-${c.id}`} variant={c.isActive ? 'success' : 'default'}>
      {c.isActive ? 'Active' : 'Archived'}
    </Badge>,
    <div key={`action-${c.id}`} className="text-right">
      <Button href={`/admin/corporates/${c.id}`} variant="secondary" size="sm">
        Manage
      </Button>
    </div>
  ]);

  return (
    <div className="admin-space-y">
      <div className="admin-page-header">
        <h1 className="admin-page-title">Corporate Dashboard</h1>
        <p className="admin-page-subtitle">
          Overview of corporate accounts, workforce activation and enterprise onboarding.
        </p>
      </div>

      <div className="admin-stat-grid">
        <StatCard
          icon={<Building2 size={24} />}
          label="Total Corporates"
          value={data.total}
          gradient="blue"
        />
        <StatCard
          icon={<Users size={24} />}
          label="Active"
          value={data.active}
          gradient="green"
          iconBgWhite
        />
        <StatCard
          icon={<Building2 size={24} />}
          label="Archived"
          value={data.archived}
          gradient="gray"
          iconBgWhite
        />
      </div>

      <Card header="Recently Added Corporates">
        <Table
          headers={['Company', 'Contact', 'City', 'Employees', 'Status', 'Action']}
          rows={rows}
        />
      </Card>
    </div>
  );
}


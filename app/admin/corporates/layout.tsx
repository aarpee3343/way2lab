'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Building2, Plus, List, LayoutDashboard, BriefcaseBusiness, Landmark, Sparkles } from 'lucide-react';
import './corporate-admin.css';

export default function CorporateLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const mainNavs = [
    { name: 'Dashboard', href: '/admin/corporates', icon: LayoutDashboard },
    { name: 'All Corporates', href: '/admin/corporates/list', icon: List },
    { name: 'Create Corporate', href: '/admin/corporates/create', icon: Building2 },
    { name: 'Services Desk', href: '/admin/corporates/services', icon: Plus }
  ];

  const currentCorporateMatch = pathname.match(/^\/admin\/corporates\/(\d+)/);
  const currentCorporateId = currentCorporateMatch?.[1];

  const corporateSubNav = currentCorporateId
    ? [
        { name: 'Overview', href: `/admin/corporates/${currentCorporateId}`, icon: BriefcaseBusiness },
        { name: 'Management', href: `/admin/corporates/${currentCorporateId}/management`, icon: Building2 },
        { name: 'Finance', href: `/admin/corporates/${currentCorporateId}/finance`, icon: Landmark }
      ]
    : [];

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="corp-admin-shell">
      <div className="corp-admin-topbar">
        <div className="corp-admin-topbar-inner">
          <div className="corp-admin-brand">
            <div className="corp-admin-brand-icon">
              <Sparkles size={16} />
            </div>
            <div>
              <p className="corp-admin-brand-title">Corporate Command Center</p>
              <p className="corp-admin-brand-subtitle">Accounts, services, billing and operations</p>
            </div>
          </div>

          <div className="corp-admin-main-nav">
            {mainNavs.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={`corp-admin-nav-pill ${isActive(n.href) ? 'active' : ''}`}
              >
                <n.icon size={15} />
                <span>{n.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {corporateSubNav.length > 0 && (
        <div className="corp-admin-subnav-wrap">
          <div className="corp-admin-subnav">
            {corporateSubNav.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={`corp-admin-subnav-pill ${isActive(n.href) ? 'active' : ''}`}
              >
                <n.icon size={14} />
                <span>{n.name}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="corp-admin-content">
        <div className="corp-admin-content-inner">{children}</div>
      </div>
    </div>
  );
}

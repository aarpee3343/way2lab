'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Building2, Plus, List, LayoutDashboard } from 'lucide-react';

export default function CorporateLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const navs = [
    { name: 'Dashboard', href: '/admin/corporates', icon: LayoutDashboard },
    { name: 'View All', href: '/admin/corporates/list', icon: List },
    { name: 'Create Corporate', href: '/admin/corporates/create', icon: Building2 },
    // "Create Services" interpreted as assigning services page or list
    { name: 'Manage Services', href: '/admin/corporates/services', icon: Plus }, 
  ];

  return (
    <div className="space-y-6">
      {/* Submenu Bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between sticky top-16 z-20">
        <div className="flex gap-1">
          {navs.map(n => {
            const isActive = pathname === n.href;
            return (
              <Link 
                key={n.href} 
                href={n.href}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-colors ${isActive ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                <n.icon size={16} /> {n.name}
              </Link>
            )
          })}
        </div>
        <Link href="/admin" className="text-xs font-bold text-slate-400 hover:text-slate-800 uppercase tracking-wide">
          Back to Admin
        </Link>
      </div>

      <div className="px-6 pb-20">
        {children}
      </div>
    </div>
  );
}
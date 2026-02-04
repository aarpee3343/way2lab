'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, ShoppingCart, FlaskConical, Building2, 
  Users, Ticket, Briefcase, Menu, Package, Map, Settings, LogOut, MessageSquare,
  ClipboardList
} from 'lucide-react';
import { motion } from 'framer-motion';

// ✅ Import missing components
import { CommandPalette } from '@/components/admin/CommandPalette';
import OrderAlerter from '@/components/admin/OrderAlerter';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [admin, setAdmin] = useState<{ name: string; role: string } | null>(null);
  const isAuthPage = pathname === '/admin/login' || pathname === '/admin/register';

  useEffect(() => {
    if (isAuthPage) return;
    const fetchAdmin = async () => {
      try {
        const res = await fetch('/api/admin/auth/me');
        if (!res.ok) return;
        const data = await res.json();
        setAdmin(data.admin || null);
      } catch {}
    };
    fetchAdmin();
  }, [isAuthPage]);

  if (isAuthPage) return <>{children}</>;

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/auth/logout', { method: 'POST' });
      window.location.href = '/admin/login';
    } catch {
      window.location.href = '/admin/login';
    }
  };

  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, href: '/admin' },
    { name: 'Live Map', icon: Map, href: '/admin/map' },
    { name: 'Orders', icon: ShoppingCart, href: '/admin/orders' },
    { name: 'Tests Inventory', icon: FlaskConical, href: '/admin/tests' },
    { name: 'Packages', icon: Package, href: '/admin/packages' },
    { name: 'Lab Partners', icon: Building2, href: '/admin/labs' },
    { name: 'Coupons', icon: Ticket, href: '/admin/coupons' }, 
    { name: 'Technicians', icon: Users, href: '/admin/technicians' },
    { name: 'Corporates', icon: Briefcase, href: '/admin/corporates' },
    { name: 'Onsite Programme', icon: ClipboardList, href: '/admin/onsite' },
    { name: 'Chats', icon: MessageSquare, href: '/admin/support' },
    { name: 'Settings', icon: Settings, href: '/admin/settings' },
  ];

  return (
    <div className="admin-layout-container flex h-screen w-full overflow-hidden bg-[#f8fafc]">
      
      {/* Command Palette */}
      <CommandPalette />

      {/* Order notifications */}
      <OrderAlerter />

      {/* SIDEBAR */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 260 : 70 }}
        className="admin-sidebar relative h-full z-50 transition-all duration-300 flex flex-col shrink-0"
      >
        <div className="admin-sidebar-header flex items-center justify-center shrink-0">
          <div className={`flex items-center ${isSidebarOpen ? 'gap-3' : 'justify-center'}`}>
            <Image src="/logo.png" alt="WayToLab" width={28} height={28} className="rounded" />
            {isSidebarOpen && <span className="admin-logo tracking-tight">WayToLab</span>}
          </div>
        </div>
        
        <nav className="admin-nav flex-1 overflow-y-auto admin-scrollbar">
          {menuItems.map(item => {
            const isActive = item.href === '/admin'
              ? pathname === '/admin'
              : pathname === item.href || pathname?.startsWith(item.href + '/');
            return (
              <Link key={item.href} href={item.href} className={`admin-nav-item ${isActive ? 'active' : ''}`}>
                <item.icon size={20} className="admin-nav-icon" />
                {isSidebarOpen && <span className="admin-nav-text">{item.name}</span>}
              </Link>
            )
          })}
        </nav>

        <div className="admin-user-footer shrink-0">
          <div className={`flex items-center gap-3 ${!isSidebarOpen && 'justify-center'}`}>
            <div className="admin-user-avatar">{admin?.name?.[0] || 'A'}</div>
            {isSidebarOpen && (
              <div className="admin-user-info">
                <p className="admin-user-name">{admin?.name || 'Admin'}</p>
                <p className="admin-user-role">{admin?.role || 'SUPER_ADMIN'}</p>
              </div>
            )}
          </div>
        </div>
      </motion.aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        
        {/* Header */}
        <header className="admin-header flex items-center justify-between shrink-0">
          <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="admin-sidebar-toggle">
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-3">
            {admin ? (
              <div className="text-xs text-slate-500 font-semibold">
                {admin.name} - {admin.role}
              </div>
            ) : null}
            <button onClick={handleLogout} className="admin-btn-secondary text-xs">
              <LogOut size={14} /> Logout
            </button>
            <div className="admin-version-badge">v2.5.0</div>
          </div>
        </header>

        {/* Page Content */}
        <main className="admin-main flex-1 overflow-y-auto admin-scrollbar bg-slate-50/30">
          <div className="admin-page-shell">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

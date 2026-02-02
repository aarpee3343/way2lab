'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  Users,
  FileBarChart,
  Settings,
  Menu,
  Bell,
  LogOut,
  UserPlus,
  MessageSquare
} from 'lucide-react';

/* ----------------------------------
   TYPES (adjust if needed)
----------------------------------- */
type Corporate = {
  companyName: string;
  logoUrl?: string;
};

/* ==================================
   LAYOUT
================================== */

export default function CorporateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  /* 🔐 These should come from auth/session */
  const corp: Corporate = {
    companyName: 'Acme Corp',
    logoUrl: '/logos/acme-logo.png',
  };

  const wayToLabLogo = '/logos/wtl-logo.png';

  const menuItems = [
    { name: 'Analytics Hub', icon: LayoutDashboard, href: '/corp' },
    { name: 'Employee Directory', icon: Users, href: '/corp-employees' },
    { name: 'Health Records', icon: FileBarChart, href: '/corp-reports' },
    { name: 'Team Access', icon: UserPlus, href: '/corp-users' },
    { name: 'Support', icon: MessageSquare, href: '/corp-support' },
    { name: 'Settings', icon: Settings, href: '/corp-settings' },
  ];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* ================= SIDEBAR ================= */}
      <aside
        className={`bg-white border-r border-slate-200 transition-all duration-300 flex flex-col z-50 ${
          isSidebarOpen ? 'w-64' : 'w-20'
        }`}
      >
        <div className="h-20 flex items-center px-6 gap-3 border-b border-slate-100 bg-white">
          <img src="/logo.png" alt="WTL" className="h-6 w-auto flex-shrink-0" />
          <div className="h-4 w-[1px] bg-slate-200" />
          {isSidebarOpen && (
            <span className="text-[10px] font-black uppercase text-slate-400 leading-none">
              Enterprise <br/> Portal
            </span>
          )}
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="flex items-center gap-3 px-3 py-3 rounded-xl text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-all font-semibold text-sm"
            >
              <item.icon size={20} />
              {isSidebarOpen && <span>{item.name}</span>}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button className="flex items-center gap-3 px-3 py-3 w-full text-red-500 font-bold text-sm hover:bg-red-50 rounded-xl transition-all">
            <LogOut size={20} />
            {isSidebarOpen && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* ================= MAIN ================= */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* -------- HEADER (Merged from code-2) -------- */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
          <button
            onClick={() => setSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-slate-100 rounded-lg"
          >
            <Menu size={20} />
          </button>

          <div className="flex items-center gap-6">
            {/* Branding */}
            <div className="flex items-center gap-4">
              <img
                src={wayToLabLogo}
                className="h-8 w-auto grayscale opacity-70 hover:grayscale-0 transition-all"
                alt="WayToLab"
              />
              <div className="h-6 w-px bg-slate-200" />
              <img
                src={corp.logoUrl || '/default-corp.png'}
                className="h-10 w-auto object-contain"
                alt={corp.companyName}
              />
            </div>

            {/* Notifications */}
            <button className="p-2 text-slate-400 hover:text-blue-600 relative">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
            </button>

            <div className="h-8 w-px bg-slate-200" />

            {/* User */}
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-black text-slate-900 leading-none">
                  Super Admin
                </p>
                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mt-1">
                  {corp.companyName}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold">
                A
              </div>
            </div>
          </div>
        </header>

        {/* -------- CONTENT -------- */}
        <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {children}
        </main>
      </div>
    </div>
  );
}

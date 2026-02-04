'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  LayoutDashboard,
  Users,
  FileBarChart,
  Activity,
  Settings,
  Menu,
  Bell,
  LogOut,
  UserPlus,
  MessageSquare,
} from 'lucide-react';
import { corporateLogoutAction } from '@/app/actions/corporateAuthActions';
import { getCorporateProfile } from '@/app/actions/corporatePortalActions';

/* ----------------------------------
   TYPES
----------------------------------- */
type Corporate = {
  companyName: string;
  logoUrl?: string;
};

/* ==================================
   CORPORATE LAYOUT
================================== */

export default function CorporateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [corp, setCorp] = useState<Corporate>({
    companyName: 'Corporate',
    logoUrl: '/default-corp.png',
  });
  const [userLabel, setUserLabel] = useState('Corporate User');

  /**
   * Routes that should NOT show dashboard shell
   * (login / auth pages)
   */
  const isLoginPage = pathname === '/corp-login';

  /* These should later come from auth/session */
  useEffect(() => {
    if (isLoginPage) return;
    const loadProfile = async () => {
      const profile = await getCorporateProfile();
      if (profile?.corp) {
        setCorp({
          companyName: profile.corp.companyName,
          logoUrl: profile.corp.logoUrl || '/default-corp.png',
        });
      }
      if (profile?.user?.role) {
        setUserLabel(profile.user.role.replace('_', ' '));
      }
    };
    loadProfile();
  }, [isLoginPage]);

  // Render auth pages without sidebar/header
  if (isLoginPage) {
    return <div className="min-h-screen bg-white">{children}</div>;
  }

  const wayToLabLogo = '/logo.png';

  const menuItems = [
    { name: 'Analytics Hub', icon: LayoutDashboard, href: '/corp' },
    { name: 'Employee Directory', icon: Users, href: '/employees' },
    { name: 'Health Records', icon: FileBarChart, href: '/corp-reports' },
    { name: 'Onsite Activity', icon: Activity, href: '/corp-onsite' },
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
        {/* Logo */}
        <div className="h-20 flex items-center px-6 gap-3 border-b border-slate-100">
          <Image src="/logo.png" alt="WTL" width={96} height={24} className="h-6 w-auto" priority />
          <div className="h-4 w-[1px] bg-slate-200" />
          {isSidebarOpen && (
            <span className="text-[10px] font-black uppercase text-slate-400 leading-none">
              Enterprise <br /> Portal
            </span>
          )}
        </div>

        {/* Menu */}
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

        {/* Logout */}
        <div className="p-4 border-t border-slate-100">
          <button
            onClick={async () => {
              await corporateLogoutAction();
              router.push('/corp-login');
            }}
            className="flex items-center gap-3 px-3 py-3 w-full text-red-500 font-bold text-sm hover:bg-red-50 rounded-xl transition-all"
          >
            <LogOut size={20} />
            {isSidebarOpen && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* ================= MAIN ================= */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* -------- HEADER -------- */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-slate-100 rounded-lg"
            >
              <Menu size={20} />
            </button>
            <Image
              src={wayToLabLogo}
              width={140}
              height={32}
              className="h-8 w-auto"
              alt="WayToLab"
              priority
            />
          </div>

          <div className="flex items-center gap-6">
            {/* Corporate Logo */}
            <Image
              src={corp.logoUrl || '/default-corp.png'}
              width={160}
              height={40}
              className="h-10 w-auto object-contain"
              alt={corp.companyName}
              unoptimized={Boolean(corp.logoUrl && !corp.logoUrl.startsWith('/'))}
            />

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
                  {userLabel}
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

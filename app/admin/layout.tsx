'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, ShoppingCart, FlaskConical, Building2, 
  Users, Ticket, Menu, Package, Map, Settings 
} from 'lucide-react';
import { motion } from 'framer-motion';
import { CommandPalette } from '@/components/admin/CommandPalette';
import OrderAlerter from '@/components/admin/OrderAlerter';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  if (pathname === '/admin/login') return <>{children}</>;

  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, href: '/admin' },
    { name: 'Live Map', icon: Map, href: '/admin/map' },
    { name: 'Orders', icon: ShoppingCart, href: '/admin/orders' },
    { name: 'Tests Inventory', icon: FlaskConical, href: '/admin/tests' },
    { name: 'Packages', icon: Package, href: '/admin/packages' },
    { name: 'Lab Partners', icon: Building2, href: '/admin/labs' },
    { name: 'Coupons', icon: Ticket, href: '/admin/coupons' }, 
    { name: 'Technicians', icon: Users, href: '/admin/technicians' },
    { name: 'Settings', icon: Settings, href: '/admin/settings' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans overflow-hidden">
      <CommandPalette />
      <OrderAlerter />

      {/* SIDEBAR */}
      <motion.aside 
        initial={{ width: 260 }}
        animate={{ width: isSidebarOpen ? 260 : 70 }}
        className="fixed h-full z-50 bg-slate-900 text-white shadow-2xl transition-all duration-300 flex flex-col"
      >
        {/* Logo Area */}
        <div className="h-16 flex items-center justify-center border-b border-slate-800/50 bg-slate-950 z-10 shrink-0">
           {isSidebarOpen ? (
             <span className="text-xl font-black bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent tracking-tight">WayToLab</span>
           ) : (
             <span className="text-xl font-black text-blue-500">W</span>
           )}
        </div>
        
        {/* Menu */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 custom-scrollbar">
           {menuItems.map(item => {
             const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
             return (
               <Link key={item.href} href={item.href} className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group relative ${isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
                 <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                 
                 {isSidebarOpen && (
                   <span className={`text-sm font-medium tracking-wide ${isActive ? 'font-bold' : ''}`}>{item.name}</span>
                 )}
                 
                 {!isSidebarOpen && (
                   <div className="absolute left-12 bg-slate-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none shadow-xl border border-slate-700">
                     {item.name}
                   </div>
                 )}
               </Link>
             )
           })}
        </nav>

        {/* User Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 shrink-0">
          <div className={`flex items-center gap-3 ${!isSidebarOpen && 'justify-center'}`}>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg text-xs">A</div>
            {isSidebarOpen && (
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-white truncate">Admin</p>
                <p className="text-[10px] text-slate-500 truncate uppercase tracking-wider">Super Admin</p>
              </div>
            )}
          </div>
        </div>
      </motion.aside>

      {/* MAIN CONTENT AREA */}
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${isSidebarOpen ? 'md:ml-[260px]' : 'md:ml-[70px]'}`}>
        
        {/* Sticky Header */}
        <header className="h-16 bg-white/80 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-40 px-6 flex items-center justify-between shadow-sm/50">
          <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors">
            <Menu size={20} />
          </button>
          
          <div className="flex items-center gap-4">
             <div className="bg-slate-100 px-3 py-1 rounded-full text-[10px] font-bold text-slate-500 border border-slate-200">
                v2.5.0
             </div>
          </div>
        </header>

        {/* Page Content - Zero Top Padding to fix gap */}
        <main className="p-6 max-w-[1600px] mx-auto w-full animate-in fade-in slide-in-from-bottom-2 duration-500">
          {children}
        </main>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; }
      `}</style>
    </div>
  );
}
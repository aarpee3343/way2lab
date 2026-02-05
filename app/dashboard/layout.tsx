'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import { 
  LayoutDashboard, 
  ClipboardList, 
  FileText, 
  MapPin, 
  Users, 
  LogOut, 
  Menu, 
  X,
  UserCircle,
  ChevronRight,
  Bell,
  HelpCircle,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion'; 

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [loading, setLoading] = useState(true);

  // --- 1. AUTH CHECK ---
  useEffect(() => {
    const init = async () => {
      try {
        const res = await axios.get('/api/auth/me', { withCredentials: true });
        setUser(res.data.user);
      } catch (error) {
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [router]);

  const handleLogout = async () => {
    try {
      await axios.post('/api/auth/logout', undefined, { withCredentials: true });
      router.push('/login');
    } catch (e) {
      console.error('Logout failed');
    }
  };

  const navItems: NavItem[] = [
    { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { name: 'My Orders', href: '/dashboard/orders', icon: ClipboardList },
    { name: 'Reports', href: '/dashboard/reports', icon: FileText },
    { name: 'Addresses', href: '/dashboard/addresses', icon: MapPin },
    { name: 'Family Members', href: '/dashboard/family', icon: Users },
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white border-r border-slate-100">
      {/* Sidebar Header */}
      <div className="p-6 border-b border-slate-50 flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-md shrink-0">
          {user?.name?.[0]?.toUpperCase() || <UserCircle size={24} />}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-bold text-slate-800 truncate">{user?.name || 'Loading...'}</h2>
          <p className="text-xs text-slate-400 truncate">{user?.email}</p>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <p className="px-4 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 mt-2">Menu</p>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link 
              key={item.name} 
              href={item.href}
              onClick={() => setIsMobileOpen(false)}
              className={`group relative flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive 
                  ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 font-semibold border border-blue-100' 
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon 
                  size={20} 
                  className={`transition-colors ${isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`} 
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span>{item.name}</span>
              </div>
              {isActive && <ChevronRight size={16} className="text-blue-400" />}
            </Link>
          );
        })}
      </nav>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-slate-50 space-y-2">
        <Link
          href="/dashboard/benefits"
          className="flex items-center gap-3 w-full px-4 py-3 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors font-medium"
        >
          <HelpCircle size={20} />
          Corporate Benefits
        </Link>
        
        <button 
          onClick={handleLogout} 
          className="flex items-center gap-3 w-full px-4 py-3 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors font-medium group"
        >
          <LogOut size={20} className="group-hover:scale-110 transition-transform" />
          Sign Out
        </button>
      </div>
    </div>
  );

  // Show nothing or loader while checking auth to prevent flash
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <Loader2 className="animate-spin text-blue-600" size={32} />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-72 fixed h-full z-20 shadow-sm">
        <SidebarContent />
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 w-full bg-white/90 backdrop-blur-md border-b border-slate-200 z-30 px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsMobileOpen(true)}
            className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg active:scale-95 transition-all"
          >
            <Menu size={24} />
          </button>
          <span className="font-bold text-slate-800 text-lg">WayToLab</span>
        </div>
        <button className="p-2 relative">
          <Bell size={22} className="text-slate-600" />
        </button>
      </header>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 md:hidden"
            />
            
            <motion.div 
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed top-0 left-0 bottom-0 w-[85%] max-w-sm bg-white z-50 md:hidden shadow-2xl"
            >
              <div className="absolute top-4 right-4">
                <button 
                  onClick={() => setIsMobileOpen(false)} 
                  className="p-2 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-lg"
                >
                  <X size={24} />
                </button>
              </div>
              <SidebarContent />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className="flex-1 md:ml-72 p-4 md:p-8 w-full mt-16 md:mt-0">
        <div className="max-w-6xl mx-auto">
          {children} {/* This renders page.tsx */}
        </div>
      </main>
    </div>
  );
}

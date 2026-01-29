'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import Cookies from 'js-cookie';
import { 
  LayoutDashboard, 
  ClipboardList, 
  FileText, 
  MapPin, 
  Users, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  UserCircle,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion'; // Using Framer Motion for smooth transitions

import { Toaster } from 'sonner';


export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);

  // Fetch basic user info for the sidebar (optional but nice)
  useEffect(() => {
    // In a real app, you might decode the token or fetch from store
    // For now, we'll just use a placeholder or read from cookie if you store basic info there
    setUser({ name: "User", email: "user@example.com" }); 
  }, []);

  const handleLogout = () => {
    Cookies.remove('token');
    router.push('/login');
  };

  const navItems = [
    { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { name: 'My Orders', href: '/dashboard/orders', icon: ClipboardList },
    { name: 'Reports', href: '/dashboard/reports', icon: FileText },
    { name: 'Addresses', href: '/dashboard/addresses', icon: MapPin },
    { name: 'Family Members', href: '/dashboard/family', icon: Users },
    { name: 'Settings', href: '/dashboard/profile', icon: Settings },
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white border-r border-slate-100">
      {/* Sidebar Header */}
      <div className="p-6 border-b border-slate-50 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-blue-200 shadow-md">
          {user?.name?.[0] || <UserCircle />}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-bold text-slate-800 truncate">My Account</h2>
          <p className="text-xs text-slate-400 truncate">Manage your health</p>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <p className="px-4 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 mt-2">Menu</p>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link 
              key={item.name} 
              href={item.href}
              onClick={() => setIsMobileOpen(false)}
              className={`group flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive 
                  ? 'bg-blue-50 text-blue-700 font-semibold' 
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon 
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
      <div className="p-4 border-t border-slate-50">
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

  return (
    <div className="min-h-screen bg-slate-50 flex">
      
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-72 fixed h-full z-20 shadow-sm">
        <SidebarContent />
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-slate-200 z-30 px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
           <span className="font-bold text-slate-800 text-lg">Dashboard</span>
        </div>
        <button 
          onClick={() => setIsMobileOpen(true)}
          className="p-2 -mr-2 text-slate-600 hover:bg-slate-100 rounded-lg active:scale-95 transition-all"
        >
          <Menu size={24} />
        </button>
      </div>

      {/* Mobile Sidebar Overlay (Slide-over) */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileOpen(false)}
              className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 md:hidden"
            />
            
            {/* Drawer */}
            <motion.div 
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed top-0 left-0 bottom-0 w-[80%] max-w-sm bg-white z-50 md:hidden shadow-2xl"
            >
              <div className="absolute top-4 right-4">
                 <button onClick={() => setIsMobileOpen(false)} className="p-2 text-slate-400 hover:text-slate-600">
                   <X size={24} />
                 </button>
              </div>
              <SidebarContent />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className="flex-1 md:ml-72 p-4 md:p-10 md:pt-10 max-w-7xl mx-auto w-full">
        {children}
      </main>
      
    </div>
  );
}
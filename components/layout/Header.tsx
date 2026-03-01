'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useCartStore } from '@/store/useCartStore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Menu, X, ShoppingCart, User, LogOut, 
  LayoutDashboard, ClipboardList, FileText, Settings,
  Home, Search, Package, Info, Phone, ArrowRight, ChevronDown, 
  Heart, ShieldCheck, Stethoscope, MapPin, Users, Briefcase, TestTube, Wallet
} from 'lucide-react';

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  // ✅ AUTH STATE
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  
  const pathname = usePathname();
  const router = useRouter();
  const { items } = useCartStore();
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Hide header in admin panel
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  const isDashboard = pathname.startsWith('/dashboard');

  // --- 1. AUTH CHECK (Replaces Cookies.get) ---
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        setUser(data.user);
      } catch (e) {
        setUser(null);
      } finally {
        setLoadingUser(false);
      }
    };
    checkAuth();
  }, [pathname]); // Re-check on route change to keep sync

  // Scroll Listener
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setIsMobileOpen(false);
    setShowUserMenu(false);
  }, [pathname]);

  // Click Outside Listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' }); // Need to create this route to clear cookie
      setUser(null);
      router.push('/login');
      router.refresh(); // Force refresh to clear server cache
    } catch (e) {
      console.error("Logout failed", e);
    }
  };

  const publicLinks = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Tests', href: '/tests', icon: TestTube  },
    { name: 'Packages', href: '/packages', icon: Package },
    { name: 'Labs Network', href: '/labs', icon: Stethoscope },
    { name: 'FAQ', href: '/faq', icon: Info },
    { name: 'Health Blog', href: '/blogs', icon: Heart },
    // { name: 'About Us', href: '/about', icon: Info },
    // { name: 'Contact', href: '/contact', icon: Phone },
  ];

  const dashboardLinks = [
  { name: 'Health Dashboard', href: '/dashboard', icon: LayoutDashboard },

  { name: 'Corporate Benefits', href: '/dashboard/benefits', icon: Briefcase },
  { name: 'Wallet', href: '/dashboard/wallet', icon: Wallet },

  { name: 'My Orders', href: '/dashboard/orders', icon: ClipboardList },

  // { name: 'Health Reports', href: '/dashboard/reports', icon: FileText },

  { name: 'My Profile', href: '/dashboard/profile', icon: User },

  // { name: 'My Address', href: '/dashboard/addresses', icon: MapPin },

  // { name: 'My Family', href: '/dashboard/family', icon: Users },
];

  const currentLinks = isDashboard ? dashboardLinks : publicLinks;

  return (
    <>
      <header 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-in-out ${
          isScrolled || isMobileOpen || isDashboard 
            ? 'bg-white/90 backdrop-blur-xl border-b border-teal-100 shadow-sm py-3' 
            : 'bg-transparent py-5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex justify-between items-center">
          
          {/* LOGO */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative">
              <Image
                src="/logo.png"
                alt="WayToLab Logo"
                width={160}
                height={40}
                sizes="(max-width: 768px) 40px, 160px"
                className="h-10 w-auto object-contain transition-transform group-hover:scale-105 duration-300"
                priority
              />
            </div>
            <div className="hidden md:flex flex-col">
              <span className="text-xl font-bold tracking-tight text-slate-900 leading-none">WAYTOLAB</span>
              <span className="text-[10px] font-bold text-teal-700 uppercase tracking-widest leading-none mt-2">HEALTHCARE</span>
            </div>
          </Link>

          {/* DESKTOP NAV */}
          <nav className="hidden md:flex items-center gap-1 bg-white/80 backdrop-blur-md p-1.5 rounded-2xl border border-teal-100 shadow-sm">
            {currentLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link 
                  key={link.name} 
                  href={link.href} 
                  className={`relative px-5 py-2.5 text-sm font-medium rounded-xl transition-all duration-300 flex items-center gap-2 ${
                    isActive 
                      ? 'text-teal-700 bg-gradient-to-r from-teal-50 to-teal-50 shadow-sm' 
                      : 'text-slate-600 hover:text-teal-700 hover:bg-teal-50/50'
                  }`}
                >
                  <link.icon size={16} />
                  {link.name}
                </Link>
              )
            })}
          </nav>

          {/* RIGHT ACTIONS */}
          <div className="flex items-center gap-3">
            
            {/* Cart Icon */}
            <Link
              href="/cart"
              aria-label={`Cart (${items.length} items)`}
              className="relative p-2.5 text-slate-600 hover:bg-teal-50 rounded-full transition-colors group"
            >
              <span className="sr-only">Open cart</span>
              <div className="relative">
                <ShoppingCart size={22} className="group-hover:text-teal-600 transition-colors" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-teal-600 rounded-full animate-pulse opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <AnimatePresence>
                {items.length > 0 && (
                  <motion.span 
                    initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                    className="absolute top-0.5 right-0.5 bg-gradient-to-r from-rose-500 to-rose-600 text-white text-[10px] font-bold h-5 w-5 flex items-center justify-center rounded-full ring-2 ring-white shadow-md"
                  >
                    {items.length}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>

            {/* AUTH SECTION */}
            {loadingUser ? (
              // Skeleton Loader while checking auth
              <div className="hidden md:block w-10 h-10 bg-slate-100 rounded-full animate-pulse" />
            ) : user ? (
              // LOGGED IN STATE
              <div className="hidden md:block relative" ref={userMenuRef}>
                <button 
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  aria-label={showUserMenu ? 'Close account menu' : 'Open account menu'}
                  className="flex items-center gap-2 pl-2 pr-4 py-1.5 bg-white border border-teal-100 rounded-xl hover:shadow-md transition-all group hover:border-teal-300"
                >
                  <div className="w-9 h-9 bg-gradient-to-br from-teal-500 to-teal-600 text-white rounded-full flex items-center justify-center font-bold shadow-sm">
                    {user.name?.[0]?.toUpperCase() || <User size={18} />}
                  </div>
                  <ChevronDown size={14} className={`text-teal-600 transition-transform duration-300 ${showUserMenu ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                <AnimatePresence>
                  {showUserMenu && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute top-full right-0 mt-3 w-64 bg-white rounded-2xl shadow-xl border border-teal-100 overflow-hidden py-3 z-50"
                    >
                      <div className="px-4 py-3 bg-gradient-to-r from-teal-50 to-teal-50/50 border-b border-teal-100">
                        <p className="text-xs font-bold text-teal-700 uppercase tracking-wider">Health Dashboard</p>
                        <p className="text-sm text-slate-600 mt-1 truncate">{user.name}</p>
                      </div>
                      
                      <div className="py-2">
                        {dashboardLinks.map(link => (
                          <Link key={link.href} href={link.href} className="flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-teal-50 hover:text-teal-700 transition-colors">
                            <link.icon size={18} className="text-teal-600" />
                            {link.name}
                          </Link>
                        ))}
                      </div>
                      
                      <div className="border-t border-teal-100 pt-2">
                        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-rose-600 hover:bg-rose-50 transition-colors font-medium">
                          <LogOut size={18} /> Sign Out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              // LOGGED OUT STATE
              <Link 
                href="/login" 
                className="hidden md:inline-flex bg-gradient-to-r from-teal-600 to-teal-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:shadow-xl hover:shadow-teal-200 hover:scale-105 active:scale-95 transition-all"
              >
                Sign In
              </Link>
            )}

            {/* Mobile Hamburger */}
            <button 
              onClick={() => setIsMobileOpen(true)}
              aria-label="Open mobile menu"
              className="md:hidden p-2.5 text-slate-700 bg-white border border-teal-100 rounded-xl active:scale-95 transition-all shadow-sm"
            >
              <Menu size={22} />
            </button>
          </div>
        </div>
      </header>

      {/* --- MOBILE MENU --- */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsMobileOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[180] md:hidden"
            />
            <motion.div 
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed inset-y-0 right-0 w-[85%] max-w-sm bg-white shadow-2xl z-[200] flex flex-col md:hidden"
            >
              <div className="p-6 border-b border-teal-100 bg-gradient-to-r from-teal-50 to-white flex justify-between items-center">
                 <div className="flex items-center gap-3">
                    <Image
                      src="/logo.png"
                      alt="WayToLab"
                      width={140}
                      height={36}
                      sizes="140px"
                      className="h-9 w-auto"
                      priority
                    />
                    <span className="font-bold text-lg text-slate-800">WayToLab</span>
                 </div>
                 <button
                   onClick={() => setIsMobileOpen(false)}
                   aria-label="Close mobile menu"
                   className="p-2 bg-white text-teal-600 rounded-full hover:bg-teal-50 border border-teal-200"
                 >
                   <X size={20} />
                 </button>
              </div>

              <div className="p-4 border-b border-teal-100 bg-teal-50/40">
                {user ? (
                  <div className="space-y-2">
                    <Link
                      href="/dashboard"
                      onClick={() => setIsMobileOpen(false)}
                      className="flex w-full items-center justify-center gap-3 bg-gradient-to-r from-teal-600 to-teal-700 text-white px-4 py-3 rounded-xl font-bold text-sm shadow-lg"
                    >
                      <LayoutDashboard size={18} /> Health Dashboard
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center justify-center gap-3 bg-white border border-rose-200 text-rose-600 px-4 py-3 rounded-xl font-bold text-sm"
                    >
                      <LogOut size={18} /> Sign Out
                    </button>
                  </div>
                ) : (
                  <Link
                    href="/login"
                    onClick={() => setIsMobileOpen(false)}
                    className="flex w-full items-center justify-center gap-3 bg-gradient-to-r from-teal-600 to-teal-700 text-white px-4 py-3 rounded-xl font-bold text-sm shadow-lg"
                  >
                    Sign In / Register <ArrowRight size={16} />
                  </Link>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-1">
                {currentLinks.map((link) => (
                  <Link 
                    key={link.name} 
                    href={link.href} 
                    onClick={() => setIsMobileOpen(false)}
                    className="flex items-center gap-4 px-4 py-4 rounded-2xl text-slate-600 hover:bg-teal-50 hover:text-teal-700 font-medium"
                  >
                    <link.icon size={20} className="text-teal-500" />
                    {link.name}
                  </Link>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

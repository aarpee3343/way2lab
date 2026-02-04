'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { 
  Facebook, Twitter, Linkedin, Instagram, ArrowUpRight, 
  MessageCircle, Mail, MapPin, Phone, ShieldCheck, Heart, Stethoscope, Award
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function Footer() {
  const pathname = usePathname();
  const currentYear = new Date().getFullYear();

  // Hide logic
  const isDashboard = pathname?.startsWith('/dashboard');
  const isAdmin = pathname?.startsWith('/admin');
  const isBookingFlow = pathname === '/cart' || pathname?.startsWith('/checkout');

  if (isDashboard || isAdmin || isBookingFlow) return null;

  return (
    <footer className="relative bg-gradient-to-b from-teal-900 via-teal-950 to-slate-950 text-white overflow-hidden pt-24 pb-8">
      
      {/* Medical-themed background patterns */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M50 20L50 80M20 50L80 50' stroke='%230d9488' stroke-width='2' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
          backgroundSize: '50px 50px',
        }} />
      </div>
      
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-teal-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        
        {/* TOP SECTION: CTA */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-24 gap-10">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-sm font-bold uppercase tracking-widest mb-6">
              <ShieldCheck size={16} /> Certified Healthcare Partner
            </div>
            <h2 className="text-5xl md:text-7xl font-bold tracking-tighter leading-[0.9] mb-6">
              Your Health, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-blue-400">
                Our Priority.
              </span>
            </h2>
            <p className="text-slate-400 max-w-md text-lg leading-relaxed">
              Advanced diagnostics with AI-powered reports, expert consultation, and premium care delivered to your doorstep.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
            <Link 
              href="/search" 
              className="group flex items-center justify-center gap-3 bg-gradient-to-r from-teal-500 to-teal-600 text-white px-8 py-4 rounded-full font-bold text-lg hover:shadow-xl hover:shadow-teal-200 transition-all active:scale-95"
            >
              Book Diagnostic Test
              <ArrowUpRight className="group-hover:rotate-45 transition-transform" />
            </Link>
            <a 
              href="tel:+919311213388"
              className="group flex items-center justify-center gap-3 border border-teal-700 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-teal-900/30 transition-all"
            >
              <Phone size={20} className="text-teal-400 group-hover:text-white transition-colors" />
              24/7 Medical Support
            </a>
          </div>
        </div>

        <hr className="border-teal-800/50 mb-16" />

        {/* MIDDLE SECTION: LINKS */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-20">
          
          {/* Brand & Address */}
          <div className="md:col-span-5 space-y-8">
            <div className="flex items-center gap-3">
              <Image
                src="/logo.png"
                alt="WayToLab Logo"
                width={200}
                height={48}
                className="h-12 w-auto brightness-0 invert opacity-90"
              />
              <div className="flex flex-col">
                <span className="text-xl font-bold tracking-tight text-white leading-none">WayToLab</span>
                <span className="text-xs font-bold text-teal-400 uppercase tracking-widest leading-none">Advanced Diagnostics</span>
              </div>
            </div>
            <div className="space-y-4 text-slate-400 text-sm">
              <div className="flex items-start gap-3">
                <MapPin className="shrink-0 mt-1 text-teal-600" size={18} />
                <p className="leading-relaxed">Medical Plaza, Sector 48<br/>Gurugram, Haryana 122018, INDIA</p>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="shrink-0 text-teal-600" size={18} />
                <a href="mailto:care@WayToLab.com" className="hover:text-white transition-colors">care@WayToLab.com</a>
              </div>
            </div>
            
            {/* Healthcare certifications */}
            <div className="flex flex-wrap gap-4 pt-4">
              <div className="flex items-center gap-2 text-xs text-teal-400">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                NABL Certified Labs
              </div>
              <div className="flex items-center gap-2 text-xs text-teal-400">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                ISO 9001:2015
              </div>
            </div>
          </div>

          {/* Healthcare Links */}
          <div className="md:col-span-2">
            <h4 className="font-bold mb-6 text-teal-400 uppercase text-xs tracking-widest flex items-center gap-2">
              <Heart size={14} /> Services
            </h4>
            <ul className="space-y-4">
              {[
                { name: 'Diagnostic Tests', href: '/tests' },
                { name: 'Health Packages', href: '/packages' },
                { name: 'Our Labs', href: '/labs' },
                { name: 'Corporate Login', href: '/corp-login' },
                { name: 'Home Collection', href: '/search' }
              ].map((item) => (
                <li key={item.name}>
                  <Link href={item.href} className="text-slate-300 hover:text-teal-400 transition-colors text-sm font-medium flex items-center gap-2">
                    <ArrowUpRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div className="md:col-span-2">
            <h4 className="font-bold mb-6 text-teal-400 uppercase text-xs tracking-widest flex items-center gap-2">
              <Stethoscope size={14} /> Support
            </h4>
            <ul className="space-y-4">
              {[
                { name: 'Contact Us', href: '/contact' },
                { name: 'Health Blog', href: '/blogs' },
                { name: 'Privacy Policy', href: '/privacy-policy' },
                { name: 'Terms of Service', href: '/terms' },
                { name: 'Refund Policy', href: '/refund-policy' }
              ].map((item) => (
                <li key={item.name}>
                  <Link href={item.href} className="text-slate-300 hover:text-teal-400 transition-colors text-sm font-medium flex items-center gap-2">
                    <ArrowUpRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Health Newsletter */}
          <div className="md:col-span-3">
            <h4 className="font-bold mb-6 text-teal-400 uppercase text-xs tracking-widest flex items-center gap-2">
              <Award size={14} /> Health Updates
            </h4>
            <div className="relative">
              <input 
                type="email" 
                placeholder="Enter your email" 
                className="w-full bg-teal-900/30 border border-teal-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal-500 text-white placeholder:text-teal-600"
              />
              <button className="absolute right-2 top-2 p-2 bg-teal-600 rounded-lg text-white hover:bg-teal-500 transition-colors">
                <ArrowUpRight size={16} />
              </button>
            </div>
            <p className="text-xs text-teal-600 mt-3">
              Subscribe for health tips, offers, and medical insights.
            </p>
          </div>
        </div>

        {/* BOTTOM SECTION */}
        <div className="relative border-t border-teal-800/50 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-teal-600 gap-4">
          <div className="flex items-center gap-4">
            <p>&copy; {currentYear} WayToLab Healthcare. All rights reserved.</p>
            <div className="hidden md:flex items-center gap-2">
              <div className="w-1 h-1 bg-teal-600 rounded-full"></div>
              <span>Committed to your health</span>
            </div>
          </div>
          
          {/* Social Icons */}
          <div className="flex gap-4">
            {[
              { icon: Facebook, label: 'Facebook' },
              { icon: Twitter, label: 'Twitter' },
              { icon: Linkedin, label: 'LinkedIn' },
              { icon: Instagram, label: 'Instagram' }
            ].map(({ icon: Icon, label }) => (
              <a 
                key={label}
                href="#" 
                className="w-10 h-10 bg-teal-900/30 border border-teal-800 rounded-full flex items-center justify-center hover:bg-teal-800 hover:border-teal-600 transition-all hover:scale-110"
              >
                <Icon size={18} className="text-teal-400 hover:text-white" />
              </a>
            ))}
          </div>
        </div>

        {/* Healthcare Watermark */}
        <h1 className="text-[15vw] font-bold text-teal-950 leading-none text-center select-none pointer-events-none opacity-5 absolute -bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap">
          WayToLab
        </h1>
      </div>

      {/* Floating Healthcare WhatsApp Button */}
      <motion.a 
        href="https://wa.me/919311213388"
        target="_blank"
        initial={{ y: 100 }} 
        animate={{ y: 0 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white pl-4 pr-6 py-3.5 rounded-full shadow-2xl shadow-emerald-900/30 backdrop-blur-md border border-emerald-400/30"
      >
        <div className="bg-white/20 p-2 rounded-full">
          <MessageCircle size={20} fill="currentColor" />
        </div>
        <div>
          <p className="text-[10px] font-medium opacity-90 leading-none">Medical Support</p>
          <p className="font-bold text-sm leading-none">Chat with Expert</p>
        </div>
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full animate-ping" />
      </motion.a>

    </footer>
  );
}

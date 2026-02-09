'use client';

import { motion } from 'framer-motion';
import { ArrowLeft, ShieldCheck, Scale, FileText, HeartPulse } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface LegalLayoutProps {
  title: string;
  subtitle: string;
  updatedAt: string;
  icon: 'privacy' | 'terms' | 'refund' | 'logo';
  children: React.ReactNode;
}

export default function LegalLayout({ title, subtitle, updatedAt, icon, children }: LegalLayoutProps) {
  
  const icons = {
    privacy: <ShieldCheck className="w-14 h-14 text-teal-500" />,
    terms: <Scale className="w-14 h-14 text-blue-500" />,
    refund: <FileText className="w-14 h-14 text-emerald-500" />,
    logo: (
      <Image
        src="/logo.png"
        alt="WayToLab"
        width={56}
        height={56}
        className="object-contain"
      />
    )
  };

  const iconColors = {
    privacy: 'bg-gradient-to-br from-teal-500/10 to-teal-600/10 border-teal-200',
    terms: 'bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-200',
    refund: 'bg-gradient-to-br from-emerald-500/10 to-emerald-600/10 border-emerald-200'
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50/10 via-white to-slate-50">
      
      {/* Healthcare Hero Header */}
      <section className="bg-gradient-to-r from-teal-600 via-teal-500 to-teal-600 text-white pt-24 pb-20 relative overflow-hidden">
        {/* Medical pattern overlay */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M50 20L50 80M20 50L80 50' stroke='white' stroke-width='2' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
            backgroundSize: '80px 80px',
          }} />
        </div>
        
        <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
          <motion.div 
            initial={{ scale: 0.5, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }}
            className={`w-24 h-24 backdrop-blur-md border ${iconColors[icon]} rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl`}
          >
            {icons[icon]}
          </motion.div>
          
          <motion.h1 
            initial={{ y: 20, opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }}
            className="text-4xl md:text-5xl font-black mb-4 tracking-tight"
          >
            {title}
          </motion.h1>
          
          <motion.p 
            initial={{ y: 20, opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }} 
            transition={{ delay: 0.1 }}
            className="text-teal-100 text-lg max-w-2xl mx-auto"
          >
            {subtitle}
          </motion.p>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-8 inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20"
          >
            <HeartPulse size={14} className="text-teal-200" />
            <span className="text-xs font-bold text-teal-100 uppercase tracking-wider">
              Last Updated: {updatedAt}
            </span>
          </motion.div>
        </div>
      </section>

      {/* Content Container */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 -mt-10 relative z-20 pb-20">
        <motion.div 
          initial={{ y: 20, opacity: 0 }} 
          animate={{ y: 0, opacity: 1 }} 
          transition={{ delay: 0.2 }}
          className="bg-white rounded-3xl p-6 sm:p-10 shadow-xl shadow-teal-200/30 border border-teal-100"
        >
          {/* Healthcare Navigation */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
            <Link 
              href="/" 
              className="inline-flex items-center gap-2 text-sm font-bold text-teal-700 hover:text-teal-800 transition-colors group"
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              Back to Healthcare Portal
            </Link>
            
            <div className="flex gap-4">
              <Link 
                href="/privacy-policy" 
                className={`text-xs font-bold px-3 py-1.5 rounded-full transition-colors ${
                  icon === 'privacy' 
                    ? 'bg-teal-100 text-teal-700 border border-teal-200' 
                    : 'text-slate-500 hover:text-teal-700'
                }`}
              >
                Privacy
              </Link>
              <Link 
                href="/terms" 
                className={`text-xs font-bold px-3 py-1.5 rounded-full transition-colors ${
                  icon === 'terms' 
                    ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                    : 'text-slate-500 hover:text-blue-700'
                }`}
              >
                Terms
              </Link>
              <Link 
                href="/refund-policy" 
                className={`text-xs font-bold px-3 py-1.5 rounded-full transition-colors ${
                  icon === 'refund' 
                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                    : 'text-slate-500 hover:text-emerald-700'
                }`}
              >
                Refunds
              </Link>
            </div>
          </div>

          {/* Healthcare Legal Content */}
          <div className="prose prose-lg prose-slate max-w-none 
            prose-headings:font-bold prose-headings:text-slate-900 prose-headings:mt-10 prose-headings:mb-4
            prose-p:text-slate-600 prose-p:leading-relaxed prose-p:mt-4
            prose-ul:mt-4 prose-li:text-slate-600 prose-li:leading-relaxed
            prose-strong:text-slate-800 prose-strong:font-semibold
            prose-a:text-teal-600 prose-a:no-underline hover:prose-a:underline prose-a:font-medium
            prose-blockquote:border-l-4 prose-blockquote:border-teal-300 prose-blockquote:pl-4 prose-blockquote:py-2 prose-blockquote:bg-teal-50/50
            prose-hr:my-8 prose-hr:border-slate-200"
          >
            {children}
          </div>

          {/* Healthcare Footer */}
          <div className="mt-12 pt-8 border-t border-slate-100">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <div>
                <div className="flex items-center gap-3">
                  <Image src="/logo.png" alt="WayToLab" width={140} height={32} className="h-8 w-auto opacity-80" />
                  <span className="font-bold text-slate-800">WayToLab Healthcare</span>
                </div>
                <p className="text-sm text-slate-500 mt-1">Trusted Diagnostic Service Provider</p>
              </div>
              
              <div className="flex items-center gap-4">
                <a 
                  href="mailto:legal@waytolab.com" 
                  className="text-sm text-slate-600 hover:text-teal-700 transition-colors font-medium"
                >
                  legal@waytolab.com
                </a>
                <a 
                  href="tel:+919311213388" 
                  className="text-sm text-slate-600 hover:text-teal-700 transition-colors font-medium"
                >
                  +91 93112 13388
                </a>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

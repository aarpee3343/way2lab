'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Stethoscope, Search, Home, HeartPulse, Thermometer, Activity, 
  ArrowRight, ShieldCheck, Clock, AlertCircle
} from 'lucide-react';

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50/30 via-white to-blue-50/20 flex flex-col items-center justify-center px-4 py-12">
      
      {/* Healthcare Background Pattern */}
      <div className="absolute inset-0 overflow-hidden opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M50 20L50 80M20 50L80 50' stroke='%230d9488' stroke-width='2' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px',
        }} />
      </div>

      <div className="max-w-3xl mx-auto text-center relative z-10">
        
        {/* Healthcare Icons Animation */}
        <div className="flex justify-center gap-6 mb-8">
          {[Stethoscope, Thermometer, Activity, HeartPulse].map((Icon, i) => (
            <motion.div
              key={i}
              initial={{ y: 0 }}
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, delay: i * 0.3, repeat: Infinity }}
              className="w-12 h-12 bg-white rounded-xl shadow-lg flex items-center justify-center border border-teal-100"
            >
              <Icon size={20} className="text-teal-600" />
            </motion.div>
          ))}
        </div>

        {/* Medical Alert */}
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-rose-50 to-orange-50 text-rose-700 px-4 py-2 rounded-full mb-6 border border-rose-200"
        >
          <AlertCircle size={18} />
          <span className="text-sm font-bold">Healthcare Page Not Found</span>
        </motion.div>

        {/* 404 Display */}
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-9xl font-black text-slate-900 mb-4 leading-none"
        >
          <span className="text-teal-600">4</span>
          <span className="text-blue-600">0</span>
          <span className="text-teal-600">4</span>
        </motion.h1>

        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-3xl md:text-4xl font-bold text-slate-900 mb-4"
        >
          Healthcare Page Not Found
        </motion.h2>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-slate-600 text-lg mb-8 max-w-2xl mx-auto"
        >
          The diagnostic test or healthcare page you're looking for may have been moved, 
          or the URL might be incorrect. Let's help you find the right healthcare resources.
        </motion.p>

        {/* Healthcare Services Grid */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10"
        >
          {[
            { 
              title: 'Diagnostic Tests', 
              desc: 'Browse 600+ tests',
              icon: <Search size={20} className="text-teal-600" />,
              href: '/tests',
              color: 'bg-gradient-to-r from-teal-50 to-teal-50/50 border-teal-100'
            },
            { 
              title: 'Health Packages', 
              desc: 'Comprehensive checkups',
              icon: <HeartPulse size={20} className="text-rose-600" />,
              href: '/packages',
              color: 'bg-gradient-to-r from-rose-50 to-rose-50/50 border-rose-100'
            },
            { 
              title: 'Homepage', 
              desc: 'Return to healthcare hub',
              icon: <Home size={20} className="text-blue-600" />,
              href: '/',
              color: 'bg-gradient-to-r from-blue-50 to-blue-50/50 border-blue-100'
            }
          ].map((service, i) => (
            <Link
              key={i}
              href={service.href}
              className={`${service.color} p-4 rounded-2xl border hover:shadow-lg transition-all hover:-translate-y-1`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                  {service.icon}
                </div>
                <h3 className="font-bold text-slate-900 text-left">{service.title}</h3>
              </div>
              <p className="text-sm text-slate-600 text-left">{service.desc}</p>
            </Link>
          ))}
        </motion.div>

        {/* Healthcare CTA Buttons */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <button
            onClick={() => router.push('/search')}
            className="group bg-gradient-to-r from-teal-600 to-teal-700 text-white px-8 py-4 rounded-xl font-bold text-lg hover:shadow-xl hover:shadow-teal-200 transition-all flex items-center justify-center gap-3"
          >
            <Search size={20} />
            Search Diagnostic Tests
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
          
          <Link
            href="/contact"
            className="group bg-white border-2 border-teal-200 text-teal-700 px-8 py-4 rounded-xl font-bold text-lg hover:bg-teal-50 transition-all flex items-center justify-center gap-3"
          >
            <ShieldCheck size={20} />
            Contact Healthcare Support
          </Link>
        </motion.div>

        {/* Healthcare Assurance */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-12 pt-8 border-t border-teal-100"
        >
          <div className="flex flex-wrap justify-center gap-8 text-sm text-slate-500">
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-teal-600" />
              <span>NABL Certified Labs</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-teal-600" />
              <span>24/7 Support Available</span>
            </div>
            <div className="flex items-center gap-2">
              <HeartPulse size={16} className="text-teal-600" />
              <span>Trusted by 10,000+ Patients</span>
            </div>
          </div>
        </motion.div>

        {/* Medical Floating Elements */}
        <div className="absolute -z-10 inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute top-1/4 left-1/4 w-64 h-64 border-2 border-teal-200/20 rounded-full"
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="absolute bottom-1/4 right-1/4 w-48 h-48 border-2 border-blue-200/20 rounded-full"
          />
        </div>

      </div>
    </div>
  );
}
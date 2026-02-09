'use client';

import { useEffect, useState } from 'react';
import HeroSearch from "@/components/home/HeroSearch";
import TestCard from "@/components/home/TestCard";
import PackageCard from "@/components/home/PackageCard";
import LabSlider from "@/components/home/LabSlider";
import { ShieldCheck, Clock, Award, TrendingUp, ArrowRight, Activity, Stethoscope, Heart, Thermometer, Microscope } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/Skeleton';

export default function Home() {
  const [data, setData] = useState<{ popularTests: any[], packages: any[] }>({ popularTests: [], packages: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/home-content');
        const json = await res.json();
        setData(json);
      } catch (e) {
        console.error("Failed to load home data", e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50/30 via-white to-slate-50">
      
      {/* --- HERO SECTION --- */}
      <section className="relative pt-12 pb-28 px-4 overflow-hidden">
        {/* Medical-themed animated background */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full z-0 pointer-events-none">
          <div className="absolute top-20 left-10 w-96 h-96 bg-teal-400/20 rounded-full blur-[100px] animate-pulse" />
          <div className="absolute top-40 right-10 w-72 h-72 bg-blue-400/20 rounded-full blur-[80px] animate-pulse delay-1000" />
          
          {/* Medical cross patterns */}
          <div className="absolute top-1/4 right-1/4 opacity-5">
            <svg width="200" height="200" viewBox="0 0 100 100" className="text-teal-400">
              <path d="M50 25L50 75M25 50L75 50" stroke="currentColor" strokeWidth="8" strokeLinecap="round"/>
            </svg>
          </div>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/90 backdrop-blur-md border border-teal-100 rounded-full px-5 py-2 mb-8 shadow-sm group hover:shadow-md transition-all duration-300">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-bold text-teal-700 uppercase tracking-wider">Trusted by 1M+ Patients</span>
            <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter mb-6 leading-[1.1]">
            Your Health, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-blue-600">Our Precision.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            Your Health, Our Precision. Advanced diagnostic tests from certified labs. <br className="hidden md:block"/>
            Home collection • AI-powered reports • Expert consultation
          </p>

          <HeroSearch />

          {/* Healthcare Trust Badges */}
          <div className="mt-16 flex flex-wrap justify-center gap-8 md:gap-16">
             {[
               { label: 'NABL Certified', icon: <ShieldCheck size={20} className="text-teal-600" /> },
               { label: 'ISO 9001:2015', icon: <Award size={20} className="text-blue-600" /> },
               { label: '100% Safe', icon: <Heart size={20} className="text-rose-600" /> },
               { label: 'Expert Pathologists', icon: <Stethoscope size={20} className="text-emerald-600" /> }
             ].map((badge, i) => (
               <div key={i} className="flex flex-col items-center gap-2 group cursor-pointer">
                 <div className="w-14 h-14 bg-white rounded-2xl shadow-md flex items-center justify-center group-hover:shadow-lg group-hover:scale-110 transition-all duration-300 border border-teal-100">
                   {badge.icon}
                 </div>
                 <span className="text-xs font-semibold text-slate-700 mt-1">{badge.label}</span>
               </div>
             ))}
          </div>
        </div>
      </section>

      {/* --- HEALTHCARE FEATURES BENTO --- */}
      <section className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Smart Health Tracking */}
            <div className="md:col-span-2 bg-gradient-to-br from-white to-teal-50/30 rounded-3xl p-8 border border-teal-100 relative overflow-hidden group hover:shadow-xl transition-all duration-500">
              <div className="relative z-10">
                <div className="w-14 h-14 bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl flex items-center justify-center mb-5 shadow-lg text-white">
                   <Activity size={26} />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-3">Smart Health Tracking</h2>
                <p className="text-slate-600 max-w-md mb-4">Our AI analyzes your reports to show health trends and provide personalized insights.</p>
                <Link href="/dashboard" className="inline-flex items-center gap-2 text-teal-700 font-semibold text-sm hover:gap-3 transition-all duration-300">
                  View Dashboard <ArrowRight size={16} />
                </Link>
              </div>
              {/* Animated medical pattern */}
              <div className="absolute right-0 bottom-0 w-64 h-64 opacity-10">
                <svg width="256" height="256" viewBox="0 0 100 100" className="text-teal-400">
                  <path d="M20 20L80 80M80 20L20 80" stroke="currentColor" strokeWidth="2"/>
                  <circle cx="50" cy="50" r="25" stroke="currentColor" strokeWidth="2" fill="none"/>
                </svg>
              </div>
            </div>

            {/* Fast Collection */}
            <div className="bg-gradient-to-br from-teal-600 to-teal-700 rounded-3xl p-8 text-white relative overflow-hidden group hover:shadow-xl hover:shadow-teal-200 transition-all duration-500">
              <Clock className="w-14 h-14 mb-5 text-teal-200 group-hover:rotate-12 transition-transform duration-500" />
              <h3 className="text-xl font-bold mb-2">60 Min Collection</h3>
              <p className="text-teal-100 text-sm mb-4">Fastest sample collection with trained professionals.</p>
              <div className="inline-flex items-center gap-2 text-teal-100 text-sm font-medium">
                <div className="w-2 h-2 bg-teal-300 rounded-full animate-pulse" />
                Available 7AM-9PM
              </div>
            </div>

            {/* Certified Labs */}
            <div className="bg-white rounded-3xl p-8 border border-teal-100 group hover:border-teal-300 transition-all duration-500 hover:shadow-lg relative overflow-hidden">
              <div className="absolute top-4 right-4 w-12 h-12 bg-teal-50 rounded-full flex items-center justify-center">
                <Microscope size={20} className="text-teal-600" />
              </div>
              <Award className="w-14 h-14 mb-5 text-amber-500" />
              <h3 className="text-xl font-bold text-slate-800 mb-2">Top 1% Labs</h3>
              <p className="text-slate-600 text-sm">Partnered with verified NABL accredited diagnostic centers.</p>
            </div>

            {/* Health Packages CTA */}
            <div className="md:col-span-2 bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-8 text-white relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-teal-500/20 to-blue-500/20 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-125 transition-transform duration-700" />
              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                  <h3 className="text-2xl font-bold mb-2">Comprehensive Health Checkups</h3>
                  <p className="text-slate-400">Starting at â‚¹499. Includes 60+ parameters with doctor consultation.</p>
                </div>
                <Link href="/packages" className="bg-gradient-to-r from-teal-500 to-teal-600 text-white px-6 py-3.5 rounded-xl font-bold hover:shadow-xl hover:shadow-teal-200 transition-all duration-300 flex items-center gap-2 group/btn">
                  Explore Packages 
                  <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform duration-300" />
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* --- CURATED HEALTH PACKAGES --- */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-teal-50 text-teal-700 px-4 py-2 rounded-full mb-4">
              <Heart size={16} />
              <span className="text-sm font-semibold">Preventive Healthcare</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4 tracking-tight">Curated Health Packages</h2>
            <p className="text-slate-600">Save up to 70% with comprehensive diagnostic bundles.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {loading ? (
               [1,2,3,4].map(i => <Skeleton key={i} className="h-96 rounded-3xl" />)
            ) : (
               data.packages.map((pkg: any) => <PackageCard key={pkg.id} pkg={pkg} />)
            )}
          </div>
          
          {/* View All Packages Link */}
          <div className="text-center mt-12">
            <Link href="/packages" className="inline-flex items-center gap-2 bg-white border border-teal-200 text-teal-700 px-6 py-3.5 rounded-xl font-bold hover:bg-teal-50 hover:shadow-md transition-all duration-300">
              View All Packages
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* --- POPULAR DIAGNOSTIC TESTS --- */}
      <section className="py-20 px-4 bg-gradient-to-b from-white to-teal-50/20">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-end mb-10">
            <div>
              <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full mb-3">
                <TrendingUp size={14} />
                <span className="text-xs font-semibold">Most Booked This Week</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Popular Diagnostic Tests</h2>
              <p className="text-slate-600 mt-1">Essential tests for preventive healthcare.</p>
            </div>
            <Link href="/search" className="hidden md:flex items-center gap-2 text-sm font-bold text-teal-700 hover:text-teal-800 bg-white border border-teal-100 px-4 py-2.5 rounded-xl hover:shadow-md transition-all">
              View All Tests <ArrowRight size={16}/>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {loading ? (
               [1,2,3,4].map(i => <Skeleton key={i} className="h-48 rounded-2xl" />)
            ) : (
               data.popularTests.map((test: any) => <TestCard key={test.id} test={test} />)
            )}
          </div>
          
          <div className="mt-10 text-center md:hidden">
            <Link href="/search" className="inline-flex items-center gap-2 text-sm font-bold text-teal-700 border border-teal-100 bg-white px-6 py-3 rounded-xl hover:shadow-md transition-all">
              View All Tests <ArrowRight size={16}/>
            </Link>
          </div>
        </div>
      </section>

      {/* --- LAB NETWORK --- */}
      <LabSlider />

      {/* --- HEALTHCARE CTA --- */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-r from-teal-50 to-blue-50 rounded-3xl p-8 md:p-12 border border-teal-100 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-32 h-32 bg-teal-500/10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-2xl" />
            <h3 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">Need Personalized Recommendations?</h3>
            <p className="text-slate-600 mb-6 max-w-2xl mx-auto">
              Our healthcare experts can help you choose the right tests based on your health profile and family history.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/contact" className="bg-gradient-to-r from-teal-600 to-teal-700 text-white px-8 py-3.5 rounded-xl font-bold hover:shadow-xl hover:shadow-teal-200 transition-all">
                Talk to Health Expert
              </Link>
              <Link href="/search" className="bg-white border border-teal-200 text-teal-700 px-8 py-3.5 rounded-xl font-bold hover:bg-teal-50 transition-all">
                Browse All Tests
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}




'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import HeroSearch from '@/components/home/HeroSearch';
import TestCard from '@/components/home/TestCard';
import PackageCard from '@/components/home/PackageCard';
import { ArrowRight, ShieldCheck, Clock3, Stethoscope, Sparkles, PhoneCall } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';

type HomeContentState = {
  popularTests: any[];
  packages: any[];
};

export default function BookNowPage() {
  const [data, setData] = useState<HomeContentState>({ popularTests: [], packages: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/home-content');
        const json = await res.json();
        setData({
          popularTests: Array.isArray(json?.popularTests) ? json.popularTests : [],
          packages: Array.isArray(json?.packages) ? json.packages : [],
        });
      } catch (err) {
        console.error('Failed to load book-now content', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const stats = useMemo(
    () => [
      { icon: ShieldCheck, label: 'NABL Labs' },
      { icon: Clock3, label: 'Fast Home Collection' },
      { icon: Stethoscope, label: 'Expert Support' },
    ],
    []
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50/50 via-white to-slate-50">
      <header className="sticky top-0 z-30 border-b border-teal-100/70 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center px-4">
          <Link href="/" aria-label="Go to home page" className="inline-flex items-center">
            <Image
              src="/logo.png"
              alt="WayToLab"
              width={160}
              height={40}
              priority
              className="h-10 w-auto"
            />
          </Link>
        </div>
      </header>

      <section className="relative overflow-hidden px-4 pb-14 pt-10">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-10 top-12 h-72 w-72 rounded-full bg-teal-300/30 blur-[90px]" />
          <div className="absolute -right-10 top-10 h-72 w-72 rounded-full bg-blue-300/25 blur-[90px]" />
        </div>

        <div className="relative mx-auto max-w-5xl text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-teal-200 bg-white/90 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-teal-700">
            <Sparkles size={14} />
            One Step To Book
          </div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 md:text-6xl">
            Book Your Test <span className="text-teal-700">In Minutes</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-slate-600 md:text-lg">
            Search tests instantly, use symptom-based AI recommendations, and confirm with home collection from trusted labs.
          </p>

          <div className="mt-8">
            <HeroSearch />
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {stats.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-2 rounded-full border border-teal-100 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm"
              >
                <Icon size={14} className="text-teal-700" />
                {label}
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/search"
              className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-6 py-3 text-sm font-bold text-white shadow-md hover:bg-teal-800"
            >
              Start Booking
              <ArrowRight size={16} />
            </Link>
            <a
              href="tel:+919311213388"
              className="inline-flex items-center gap-2 rounded-xl border border-teal-200 bg-white px-6 py-3 text-sm font-bold text-teal-800 hover:bg-teal-50"
            >
              <PhoneCall size={16} />
              Talk to Care Team
            </a>
          </div>
        </div>
      </section>

      <section className="px-4 py-10">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-teal-700">Book Faster</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-900 md:text-3xl">
                Popular Tests
              </h2>
            </div>
            <Link href="/search" className="text-sm font-bold text-teal-700 hover:text-teal-800">
              View All
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {loading
              ? [1, 2, 3, 4].map((id) => <Skeleton key={id} className="h-52 rounded-2xl" />)
              : data.popularTests.map((test: any) => <TestCard key={test.id} test={test} />)}
          </div>
        </div>
      </section>

      <section className="px-4 pb-8 pt-4">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-teal-700">Best Value</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-900 md:text-3xl">
                Health Packages
              </h2>
            </div>
            <Link href="/packages" className="text-sm font-bold text-teal-700 hover:text-teal-800">
              View All
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {loading
              ? [1, 2, 3, 4].map((id) => <Skeleton key={id} className="h-96 rounded-2xl" />)
              : data.packages.map((pkg: any) => <PackageCard key={pkg.id} pkg={pkg} />)}
          </div>
        </div>
      </section>
    </div>
  );
}

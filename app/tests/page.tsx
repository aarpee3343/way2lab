'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';
import { motion } from 'framer-motion';
import { 
  Search, LayoutGrid, List, ArrowRight, Beaker, Clock, ShieldCheck, 
  ChevronLeft, ChevronRight, Filter, Stethoscope, HeartPulse, Brain
} from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';
import Breadcrumbs from '@/components/ui/Breadcrumbs';

const categories = [
  { name: "Allergy & Immunology", icon: "🤧", color: "bg-orange-50 text-orange-600 border-orange-100" },
  { name: "Cancer Markers", icon: "🎗️", color: "bg-pink-50 text-pink-600 border-pink-100" },
  { name: "Cardiac & Diabetes", icon: "❤️", color: "bg-rose-50 text-rose-600 border-rose-100" },
  { name: "Genetic & Wellness", icon: "🧬", color: "bg-blue-50 text-blue-600 border-blue-100" },
  { name: "Hormonal & Endocrine", icon: "⚖️", color: "bg-purple-50 text-purple-600 border-purple-100" },
  { name: "Infectious Diseases", icon: "🦠", color: "bg-emerald-50 text-emerald-600 border-emerald-100" },
  { name: "Routine Tests", icon: "🩸", color: "bg-slate-50 text-slate-600 border-slate-100" },
];

function TestsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // View State
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [loading, setLoading] = useState(true);
  
  // Data State
  const [tests, setTests] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });

  // Filters
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [sort, setSort] = useState('testName');
  const [order, setOrder] = useState('asc');
  const [page, setPage] = useState(1);

  // Fetch Logic
  const fetchTests = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        search,
        category,
        sort,
        order,
        page: page.toString(),
        limit: '12' 
      });
      
      const res = await axios.get(`/api/tests?${params}`);
      setTests(res.data.tests);
      setPagination(res.data.pagination);
      
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [search, category, sort, order, page]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTests();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchTests]);

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearFilters = () => {
    setSearch('');
    setCategory('');
    setSort('testName');
    setOrder('asc');
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50/20 via-white to-slate-50 pb-20">
      
      {/* Healthcare Hero */}
      <section className="bg-gradient-to-r from-teal-600 to-teal-700 text-white pt-16 pb-24 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M50 20L50 80M20 50L80 50' stroke='white' stroke-width='2' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px',
          }} />
        </div>
        
        <div className="max-w-7xl mx-auto px-4 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6 border border-white/20">
            <HeartPulse size={16} className="text-teal-200" />
            <span className="text-sm font-bold text-white">Diagnostic Tests</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">
            Comprehensive <span className="text-teal-200">Diagnostic Tests</span>
          </h1>
          <p className="text-teal-100 max-w-2xl mx-auto text-lg">
            Choose from {pagination.total > 0 ? pagination.total + '+' : '600+'} NABL certified diagnostic tests with accurate reports.
          </p>
          
          <div className="max-w-2xl mx-auto mt-10 relative">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Search for diagnostic tests (e.g. CBC, Thyroid, Vitamin D)..." 
                className="w-full pl-14 pr-4 py-4 rounded-2xl text-slate-900 shadow-2xl focus:outline-none focus:ring-4 focus:ring-teal-500/30 font-medium"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
              <Search className="absolute left-4 top-4 text-teal-600" size={24} />
              <div className="absolute right-4 top-4 text-teal-600">
                <Stethoscope size={20} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 -mt-12 relative z-20">
        
        {/* Medical Category Filters */}
        <div className="flex gap-3 overflow-x-auto pb-6 scrollbar-hide mb-10">
          {categories.map((cat) => (
            <button
              key={cat.name}
              onClick={() => { setCategory(cat.name === category ? '' : cat.name); setPage(1); }}
              className={`flex-shrink-0 flex items-center gap-3 px-5 py-3.5 rounded-xl border transition-all shadow-sm ${
                category === cat.name 
                  ? 'bg-gradient-to-r from-teal-600 to-teal-700 text-white border-teal-600 shadow-lg scale-105' 
                  : 'bg-white text-slate-600 border-slate-200 hover:border-teal-300 hover:bg-teal-50/50'
              }`}
            >
              <span className={`text-lg ${category === cat.name ? 'text-white' : ''}`}>
                {cat.icon}
              </span>
              <span className="font-bold text-sm whitespace-nowrap">{cat.name}</span>
            </button>
          ))}
        </div>

        {/* Filters Bar */}
        <div className="flex flex-wrap justify-between items-center mb-8 gap-4">
          <Breadcrumbs />
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Filter size={16} className="text-teal-600" />
              <span className="font-medium">View:</span>
            </div>
            
            <div className="bg-white border border-teal-100 rounded-xl p-1 flex">
              <button 
                onClick={() => setView('grid')}
                className={`p-2.5 rounded-lg transition-all ${view === 'grid' ? 'bg-teal-50 text-teal-600' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <LayoutGrid size={18} />
              </button>
              <button 
                onClick={() => setView('list')}
                className={`p-2.5 rounded-lg transition-all ${view === 'list' ? 'bg-teal-50 text-teal-600' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <List size={18} />
              </button>
            </div>

            <select 
              className="bg-white border border-teal-100 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition-all"
              value={`${sort}-${order}`}
              onChange={(e) => {
                const [s, o] = e.target.value.split('-');
                setSort(s);
                setOrder(o);
                setPage(1);
              }}
            >
              <option value="testName-asc">Name (A-Z)</option>
              <option value="testName-desc">Name (Z-A)</option>
              <option value="price-asc">Price (Low to High)</option>
              <option value="price-desc">Price (High to Low)</option>
            </select>
          </div>
        </div>

        {/* Diagnostic Tests Grid */}
        {loading ? (
          <div className={`grid gap-6 ${view === 'grid' ? 'grid-cols-1 md:grid-cols-3 lg:grid-cols-4' : 'grid-cols-1'}`}>
            {[1,2,3,4,5,6,7,8].map(i => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-teal-100 space-y-4">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <div className="flex justify-between mt-4">
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-8 w-8 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : tests.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-teal-100 shadow-sm">
            <div className="w-20 h-20 bg-gradient-to-br from-teal-50 to-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 text-teal-600">
              <Search size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-800">No diagnostic tests found</h3>
            <p className="text-slate-500 mt-2">Try adjusting your filters or search criteria.</p>
            <button 
              onClick={clearFilters} 
              className="mt-6 text-teal-700 font-bold hover:text-teal-800 hover:underline transition-all flex items-center gap-2 justify-center mx-auto"
            >
              <span>Clear all filters</span>
              <ArrowRight size={14} />
            </button>
          </div>
        ) : (
          <div className={`grid gap-6 ${view === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4' : 'grid-cols-1'}`}>
            {tests.map((test) => {
              const mrp = Number(test.price);
              const discount = Number(test.discount || 0);
              const sellingPrice = discount > 0 ? Math.round(mrp - (mrp * discount / 100)) : mrp;
              const savings = mrp - sellingPrice;

              return (
                <motion.div 
                  key={test.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ y: -8 }}
                  className={`bg-white border border-teal-100 rounded-2xl shadow-lg hover:shadow-2xl transition-all cursor-pointer group flex relative overflow-hidden ${
                    view === 'list' ? 'flex-row items-center p-6 gap-6' : 'flex-col p-5'
                  }`}
                  onClick={() => router.push(`/tests/${test.slug || test.id}`)}
                >
                  {discount > 0 && (
                    <div className="absolute top-0 right-0 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded-bl-2xl z-10 shadow-md">
                      SAVE {discount}%
                    </div>
                  )}

                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-3 py-1.5 rounded-full border border-teal-100">
                        {test.category || 'Diagnostic Test'}
                      </span>
                      {view === 'grid' && (
                        <div className="bg-teal-50 p-2 rounded-full text-teal-600 group-hover:bg-teal-100 transition-colors">
                          <Beaker size={18} />
                        </div>
                      )}
                    </div>
                    
                    <h3 className="font-bold text-slate-800 mb-2 group-hover:text-teal-700 transition-colors text-lg line-clamp-2">
                      {test.testName}
                    </h3>
                    
                    <div className="flex items-center gap-4 text-xs text-slate-500 mt-3 mb-4">
                      {test.scheduleReporting && (
                        <span className="flex items-center gap-1"><Clock size={12}/> {test.scheduleReporting}</span>
                      )}
                      <span className="flex items-center gap-1"><ShieldCheck size={12} className="text-emerald-500"/> NABL Lab</span>
                    </div>
                  </div>

                  <div className={`flex items-center justify-between ${view === 'list' ? 'w-56 flex-col items-end gap-3' : 'pt-4 border-t border-slate-50'}`}>
                    <div className="text-right">
                      <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Starting from</p>
                      <div className="flex items-baseline gap-2 justify-end">
                        <p className="text-2xl font-black text-teal-700">₹{sellingPrice}</p>
                        {discount > 0 && (
                          <p className="text-sm text-slate-400 line-through decoration-slate-300 decoration-2">
                            ₹{mrp}
                          </p>
                        )}
                      </div>
                      {savings > 0 && (
                        <p className="text-xs text-emerald-600 font-bold mt-1">Save ₹{savings}</p>
                      )}
                    </div>
                    
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/search?q=${encodeURIComponent(test.testName)}`);
                      }}
                      className={`bg-gradient-to-r from-teal-600 to-teal-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:shadow-xl hover:shadow-teal-200 transition-all ${
                        view === 'list' ? 'w-full py-3 text-sm' : 'w-12 h-12'
                      }`}
                    >
                      {view === 'list' ? 'Book Test' : <ArrowRight size={18} />}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Medical Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex justify-center items-center mt-16 gap-4">
            <button 
              disabled={page === 1}
              onClick={() => handlePageChange(page - 1)}
              className="p-3 rounded-xl border border-teal-100 hover:bg-teal-50 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all bg-white text-teal-700"
            >
              <ChevronLeft size={20} />
            </button>
            
            <div className="flex items-center gap-3">
              <span className="font-bold text-slate-600 text-sm">
                Page {page} of {pagination.totalPages}
              </span>
              <div className="flex gap-1">
                {[...Array(Math.min(3, pagination.totalPages))].map((_, i) => {
                  const pageNum = i + Math.max(1, page - 1);
                  if (pageNum > pagination.totalPages) return null;
                  return (
                    <button
                      key={i}
                      onClick={() => handlePageChange(pageNum)}
                      className={`w-8 h-8 rounded-lg text-sm font-bold transition-all ${
                        pageNum === page 
                          ? 'bg-teal-600 text-white' 
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
            </div>

            <button 
              disabled={page === pagination.totalPages}
              onClick={() => handlePageChange(page + 1)}
              className="p-3 rounded-xl border border-teal-100 hover:bg-teal-50 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all bg-white text-teal-700"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        )}

        {/* Healthcare CTA */}
        <div className="mt-20 text-center">
          <div className="bg-gradient-to-r from-teal-50 to-blue-50 rounded-3xl p-8 border border-teal-100 max-w-2xl mx-auto">
            <Brain size={40} className="mx-auto mb-4 text-teal-600" />
            <h3 className="text-xl font-bold text-slate-800 mb-2">Need Help Choosing Tests?</h3>
            <p className="text-slate-600 mb-6">Our medical experts can recommend the right tests for your health needs.</p>
            <button 
              onClick={() => router.push('/contact')}
              className="bg-gradient-to-r from-teal-600 to-teal-700 text-white px-8 py-3 rounded-xl font-bold hover:shadow-xl hover:shadow-teal-200 transition-all"
            >
              Consult Health Expert
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

export default function TestsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading diagnostic tests...</p>
        </div>
      </div>
    }>
      <TestsContent />
    </Suspense>
  );
}
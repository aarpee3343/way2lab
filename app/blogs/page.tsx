'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Calendar, User, ArrowRight, BookOpen, HeartPulse, Stethoscope, Clock, Activity } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';
import Breadcrumbs from '@/components/ui/Breadcrumbs';

export default function BlogListingPage() {
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCat, setActiveCat] = useState('All');

  const categories = [
    { id: 'All', name: 'All Health Topics', icon: <Activity size={16} /> },
    { id: 'Health Tips', name: 'Health Tips', icon: <HeartPulse size={16} /> },
    { id: 'Diagnostics', name: 'Diagnostics', icon: <Stethoscope size={16} /> },
    { id: 'Wellness', name: 'Wellness', icon: <BookOpen size={16} /> },
    { id: 'Nutrition', name: 'Nutrition', icon: '🥗' },
    { id: 'Preventive Care', name: 'Preventive Care', icon: '🛡️' },
  ];

  useEffect(() => {
    setLoading(true);
    axios.get(`/api/blogs?category=${activeCat === 'All' ? '' : activeCat}`)
      .then(res => setBlogs(res.data))
      .catch(() => setBlogs([]))
      .finally(() => setLoading(false));
  }, [activeCat]);

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Estimate reading time
  const getReadingTime = (content: string) => {
    const wordCount = content?.split(/\s+/).length || 0;
    return Math.max(1, Math.ceil(wordCount / 200));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50/10 via-white to-slate-50">
      
      {/* Healthcare Hero Section */}
      <section className="bg-gradient-to-r from-teal-700 via-teal-600 to-teal-700 text-white pt-16 pb-28 relative overflow-hidden">
        {/* Medical pattern overlay */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M50 20L50 80M20 50L80 50' stroke='white' stroke-width='2' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
            backgroundSize: '80px 80px',
          }} />
        </div>
        
        <div className="max-w-7xl mx-auto px-4 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6 border border-white/20">
            <BookOpen size={18} className="text-teal-200" />
            <span className="text-sm font-bold">WayToLab Health Insights</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-6 tracking-tight">
            Health & <span className="text-teal-200">Wellness</span> Insights
          </h1>
          <p className="text-teal-100 max-w-2xl mx-auto text-lg mb-8 leading-relaxed">
            Expert healthcare advice, diagnostic guides, and wellness tips from medical professionals to help you make informed health decisions.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link 
              href="/search" 
              className="bg-gradient-to-r from-teal-500 to-teal-600 text-white px-8 py-3.5 rounded-xl font-bold hover:shadow-xl hover:shadow-teal-200 transition-all flex items-center gap-2"
            >
              <Stethoscope size={20} />
              Book Diagnostic Test
            </Link>
            <Link 
              href="/contact" 
              className="bg-white/10 backdrop-blur-sm border border-white/20 text-white px-8 py-3.5 rounded-xl font-bold hover:bg-white/20 transition-all flex items-center gap-2"
            >
              <HeartPulse size={20} />
              Consult Health Expert
            </Link>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 -mt-12 relative z-20">
        <Breadcrumbs />

        {/* Healthcare Categories */}
        <div className="flex gap-3 overflow-x-auto pb-8 mb-8 scrollbar-hide">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCat(cat.id)}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold whitespace-nowrap transition-all flex-shrink-0 ${
                activeCat === cat.id 
                  ? 'bg-gradient-to-r from-teal-600 to-teal-700 text-white shadow-lg shadow-teal-200' 
                  : 'bg-white text-slate-600 hover:bg-teal-50 border border-teal-100'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.name}</span>
            </button>
          ))}
        </div>

        {/* Healthcare Blog Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {loading ? (
            // Healthcare Skeleton Loaders
            [1,2,3,4,5,6].map(i => (
              <div key={i} className="bg-white rounded-3xl p-5 border border-teal-100 shadow-sm">
                <Skeleton className="h-48 w-full rounded-2xl mb-5" />
                <Skeleton className="h-6 w-3/4 mb-3" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3 mb-4" />
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-8 rounded-full" />
                </div>
              </div>
            ))
          ) : blogs.length === 0 ? (
            // No Blogs Found State
            <div className="col-span-3 text-center py-20 bg-white rounded-3xl border border-teal-100 shadow-sm">
              <div className="w-20 h-20 bg-gradient-to-br from-teal-50 to-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 text-teal-600">
                <BookOpen size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">No Health Articles Found</h3>
              <p className="text-slate-600 mb-6 max-w-md mx-auto">
                {activeCat === 'All' 
                  ? 'We\'re currently preparing new healthcare content. Check back soon!'
                  : `No articles found in ${activeCat} category. Try another category.`}
              </p>
              {activeCat !== 'All' && (
                <button 
                  onClick={() => setActiveCat('All')}
                  className="bg-gradient-to-r from-teal-600 to-teal-700 text-white px-6 py-3 rounded-xl font-bold hover:shadow-xl hover:shadow-teal-200 transition-all"
                >
                  View All Health Topics
                </button>
              )}
            </div>
          ) : (
            // Healthcare Blog Cards
            blogs.map((blog, i) => (
              <motion.div 
                key={blog.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white rounded-3xl p-5 shadow-lg hover:shadow-2xl transition-all border border-teal-100 flex flex-col h-full group hover:-translate-y-2"
              >
                {/* Featured Image */}
                <div className="relative h-56 w-full mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-teal-50 to-blue-50">
                  <img 
                    src={blog.coverImage || '/assets/images/blog-health-placeholder.jpg'} 
                    alt={blog.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    onError={(e) => {
                      e.currentTarget.src = 'https://placehold.co/600x400/0d9488/ffffff?text=Health+Article';
                      e.currentTarget.className = 'w-full h-full object-cover group-hover:scale-105 transition-transform duration-700';
                    }}
                  />
                  {/* Healthcare Category Badge */}
                  <div className="absolute top-4 left-4">
                    <span className="bg-gradient-to-r from-teal-600 to-teal-700 text-white px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg">
                      {blog.category}
                    </span>
                  </div>
                  {/* Reading Time Badge */}
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full">
                    <div className="flex items-center gap-1 text-xs font-bold text-slate-700">
                      <Clock size={12} />
                      <span>{getReadingTime(blog.content)} min</span>
                    </div>
                  </div>
                </div>

                {/* Healthcare Content */}
                <div className="px-1 flex-1 flex flex-col">
                  <h3 className="text-xl font-bold text-slate-900 mb-3 line-clamp-2 leading-tight group-hover:text-teal-700 transition-colors">
                    {blog.title}
                  </h3>
                  <p className="text-slate-600 text-sm mb-4 line-clamp-3 leading-relaxed flex-1">
                    {blog.excerpt}
                  </p>
                  
                  {/* Author & Meta Info */}
                  <div className="border-t border-slate-100 pt-4 mt-auto">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {blog.authorName?.charAt(0) || 'W'}
                        </div>
                        <div>
                          <p className="font-medium text-slate-800 text-sm">{blog.authorName || 'WayToLab Team'}</p>
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <Calendar size={12} />
                            <span>{formatDate(blog.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                      <Link 
                        href={`/blogs/${blog.slug}`} 
                        className="w-10 h-10 bg-teal-50 rounded-full flex items-center justify-center text-teal-600 hover:bg-teal-100 hover:text-teal-700 transition-colors group/link"
                      >
                        <ArrowRight size={18} className="group-hover/link:translate-x-1 transition-transform" />
                      </Link>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Healthcare Newsletter CTA */}
        {!loading && blogs.length > 0 && (
          <div className="mt-16 text-center">
            <div className="bg-gradient-to-r from-teal-50 to-blue-50 rounded-3xl p-8 border border-teal-100 max-w-2xl mx-auto">
              <HeartPulse size={40} className="mx-auto mb-4 text-teal-600" />
              <h3 className="text-2xl font-bold text-slate-900 mb-3">Stay Updated with Health Tips</h3>
              <p className="text-slate-600 mb-6 max-w-lg mx-auto">
                Subscribe to our healthcare newsletter for weekly wellness tips, diagnostic guides, and expert advice.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
                <input 
                  type="email" 
                  placeholder="Enter your email address" 
                  className="flex-1 px-5 py-3.5 rounded-xl border border-teal-200 focus:border-teal-500 focus:ring-4 focus:ring-teal-100 outline-none"
                />
                <button className="bg-gradient-to-r from-teal-600 to-teal-700 text-white px-8 py-3.5 rounded-xl font-bold hover:shadow-xl hover:shadow-teal-200 transition-all">
                  Subscribe
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-4">No spam. Unsubscribe anytime. Healthcare information only.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
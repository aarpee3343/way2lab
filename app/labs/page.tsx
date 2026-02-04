'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { motion } from 'framer-motion';
import { 
  MapPin, Phone, Star, Clock, ShieldCheck, 
  Search, Filter, Navigation, Award, CheckCircle2
} from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';
import Breadcrumbs from '@/components/ui/Breadcrumbs';

export default function LabsPage() {
  const router = useRouter();
  const [labs, setLabs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState('All');
  const [cities, setCities] = useState<string[]>([]);

  useEffect(() => {
    fetchLabs();
  }, []);

  const fetchLabs = async () => {
    try {
      const res = await axios.get('/api/labs');
      setLabs(res.data);
      
      // Extract unique cities
      const uniqueCities = Array.from(new Set(res.data
        .filter((lab: any) => lab.city)
        .map((lab: any) => lab.city)
      ));
      setCities(uniqueCities);
    } catch (error) {
      console.error('Failed to fetch labs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLabs = labs.filter(lab => {
    const matchesSearch = lab.labName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lab.city?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCity = selectedCity === 'All' || lab.city === selectedCity;
    return matchesSearch && matchesCity;
  });

  const getLabFeatures = (features: any) => {
    if (!features) return [];
    try {
      return Array.isArray(features) ? features : JSON.parse(features);
    } catch {
      return [];
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50/10 via-white to-slate-50 pb-20">
      
      {/* Healthcare Hero */}
      <section className="bg-gradient-to-r from-teal-600 via-teal-500 to-teal-600 text-white pt-16 pb-24 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M50 20L50 80M20 50L80 50' stroke='white' stroke-width='2' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
            backgroundSize: '80px 80px',
          }} />
        </div>
        
        <div className="max-w-7xl mx-auto px-4 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6 border border-white/20">
            <ShieldCheck size={18} className="text-teal-200" />
            <span className="text-sm font-bold">NABL Certified Labs</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">
            Our <span className="text-teal-200">Diagnostic Lab</span> Network
          </h1>
          <p className="text-teal-100 max-w-2xl mx-auto text-lg">
            Partnered with certified diagnostic laboratories across India for accurate and reliable test results
          </p>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mt-10 relative">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Search labs by name, city, or specialty..."
                className="w-full pl-12 pr-4 py-4 rounded-2xl text-slate-900 shadow-2xl focus:outline-none focus:ring-4 focus:ring-teal-500/30 font-medium"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className="absolute left-4 top-4 text-teal-600" size={24} />
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 -mt-12 relative z-20">
        <Breadcrumbs />

        {/* Filters */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
              <Filter size={16} className="text-teal-600" />
              <span>Filter by:</span>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCity('All')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedCity === 'All' 
                    ? 'bg-teal-600 text-white' 
                    : 'bg-white text-slate-600 border border-teal-100 hover:bg-teal-50'
                }`}
              >
                All Cities
              </button>
              
              {cities.slice(0, 5).map(city => (
                <button
                  key={city}
                  onClick={() => setSelectedCity(city)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedCity === city 
                      ? 'bg-teal-600 text-white' 
                      : 'bg-white text-slate-600 border border-teal-100 hover:bg-teal-50'
                  }`}
                >
                  {city}
                </button>
              ))}
              
              {cities.length > 5 && (
                <button className="px-4 py-2 rounded-full text-sm font-medium bg-white text-teal-600 border border-teal-100 hover:bg-teal-50">
                  +{cities.length - 5} more
                </button>
              )}
            </div>
          </div>
          
          <div className="text-sm text-slate-500 font-medium">
            Showing {filteredLabs.length} of {labs.length} certified labs
          </div>
        </div>

        {/* Labs Grid */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="bg-white rounded-3xl p-6 border border-teal-100 space-y-4">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-32 w-full rounded-xl" />
                <div className="flex justify-between">
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-8 w-8 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredLabs.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-teal-100 shadow-sm">
            <div className="w-20 h-20 bg-gradient-to-br from-teal-50 to-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 text-teal-600">
              <Search size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">No Labs Found</h3>
            <p className="text-slate-600 mb-6 max-w-md mx-auto">
              {searchTerm 
                ? `No labs found matching "${searchTerm}". Try a different search term.`
                : 'No labs available in the selected city.'}
            </p>
            <button 
              onClick={() => { setSearchTerm(''); setSelectedCity('All'); }}
              className="bg-gradient-to-r from-teal-600 to-teal-700 text-white px-6 py-3 rounded-xl font-bold hover:shadow-xl hover:shadow-teal-200 transition-all"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLabs.map((lab, i) => (
              <motion.div 
                key={lab.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white rounded-3xl p-6 border border-teal-100 shadow-lg hover:shadow-2xl transition-all cursor-pointer group"
                onClick={() => router.push(`/labs/${lab.id}`)}
              >
                {/* Lab Status Badge */}
                <div className="flex justify-between items-start mb-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                    lab.activeStatus 
                      ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}>
                    {lab.activeStatus ? 'Active' : 'Inactive'}
                  </span>
                  
                  {lab.rating && (
                    <div className="flex items-center gap-1 bg-teal-50 px-2 py-1 rounded-full">
                      <Star size={14} className="text-amber-500 fill-amber-500" />
                      <span className="text-sm font-bold text-slate-800">{lab.rating}</span>
                      <span className="text-xs text-slate-500">({lab.reviewCount})</span>
                    </div>
                  )}
                </div>

                {/* Lab Name */}
                <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-teal-700 transition-colors">
                  {lab.labName}
                </h3>

                {/* Location Info */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-start gap-2">
                    <MapPin size={18} className="text-teal-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-slate-700">{lab.address}</p>
                      <p className="text-sm text-slate-500">{lab.city}, {lab.state}</p>
                    </div>
                  </div>
                  
                  {lab.contactNo && (
                    <div className="flex items-center gap-2">
                      <Phone size={16} className="text-teal-600" />
                      <span className="text-sm text-slate-600">{lab.contactNo}</span>
                    </div>
                  )}
                </div>

                {/* Lab Features */}
                {getLabFeatures(lab.features).length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Features</h4>
                    <div className="flex flex-wrap gap-2">
                      {getLabFeatures(lab.features).slice(0, 3).map((feature: string, idx: number) => (
                        <span 
                          key={idx}
                          className="px-2 py-1 bg-teal-50 text-teal-700 text-xs rounded-full border border-teal-100"
                        >
                          {feature}
                        </span>
                      ))}
                      {getLabFeatures(lab.features).length > 3 && (
                        <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-full">
                          +{getLabFeatures(lab.features).length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Service Info */}
                <div className="border-t border-slate-100 pt-4 mt-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Navigation size={16} className="text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-700">Home Collection</p>
                        <p className="text-xs text-slate-500">₹{lab.homeCollectionCharges}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                        <Clock size={16} className="text-emerald-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-700">Timings</p>
                        <p className="text-xs text-slate-500">8AM - 8PM</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* View Details Button */}
                <div className="mt-6 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Award size={16} className="text-amber-500" />
                    <span className="text-sm font-medium text-slate-700">NABL Certified</span>
                  </div>
                  <button className="px-4 py-2 bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-xl font-bold text-sm hover:shadow-xl hover:shadow-teal-200 transition-all">
                    View Details
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Healthcare CTA */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-teal-50 to-blue-50 rounded-3xl p-8 border border-teal-100 max-w-2xl mx-auto">
            <ShieldCheck size={40} className="mx-auto mb-4 text-teal-600" />
            <h3 className="text-xl font-bold text-slate-900 mb-3">Partner with WayToLab</h3>
            <p className="text-slate-600 mb-6 max-w-lg mx-auto">
              Are you a certified diagnostic lab? Join our network and reach thousands of patients across India.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-gradient-to-r from-teal-600 to-teal-700 text-white px-8 py-3.5 rounded-xl font-bold hover:shadow-xl hover:shadow-teal-200 transition-all">
                Register Your Lab
              </button>
              <button className="bg-white border-2 border-teal-200 text-teal-700 px-8 py-3.5 rounded-xl font-bold hover:bg-teal-50 transition-all">
                Contact Partnership Team
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
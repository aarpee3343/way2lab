'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Search, X, ArrowRight, Loader2, Package, Beaker, Stethoscope, Sparkles, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SymptomSearchModal from './SymptomSearchModal';

// Types for our fast index
interface SearchItem {
  id: number;
  name: string;
  type: 'test' | 'package';
  price: number;
  searchStr: string;
}

export default function HeroSearch() {
  const router = useRouter();
  const wrapperRef = useRef<HTMLDivElement>(null);
  
  // State
  const [query, setQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  
  // 🚀 PERFORMANCE: Local Search Index
  const [searchIndex, setSearchIndex] = useState<SearchItem[]>([]);
  const [isIndexLoaded, setIsIndexLoaded] = useState(false);

  // 1. Fetch the lightweight index ONCE on mount
  useEffect(() => {
    const loadSearchIndex = async () => {
      try {
        const res = await axios.get('/api/search/index');
        setSearchIndex(res.data);
        setIsIndexLoaded(true);
      } catch (e) {
        console.error("Failed to load search index", e);
      }
    };
    loadSearchIndex();
  }, []);

  // 2. ⚡ INSTANT FILTERING (No API Call on typing)
  const filteredResults = useMemo(() => {
    if (!query || query.length < 2) return [];
    
    const lowerQuery = query.toLowerCase();
    
    // Filter the local index (Fast!)
    return searchIndex
      .filter(item => item.searchStr.includes(lowerQuery))
      .slice(0, 6); // Limit to top 6 results
  }, [query, searchIndex]);

  // Handle Selection
  const handleSelect = (item: SearchItem) => {
    router.push(`/search?q=${encodeURIComponent(item.name)}&id=${item.id}`);
  };

  const handleManualSearch = () => {
    if (!query) return;
    router.push(`/search?q=${encodeURIComponent(query)}`);
  };

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative w-full max-w-2xl mx-auto z-40" ref={wrapperRef}>
      
      {/* Search Input Bar */}
      <div className={`relative group transition-all duration-300 ${showDropdown ? 'scale-105' : 'hover:scale-[1.02]'}`}>
        <div className="absolute inset-0 bg-gradient-to-r from-teal-400/20 via-blue-400/20 to-teal-400/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        <div className="relative bg-white/95 backdrop-blur-xl border border-teal-100 shadow-2xl shadow-teal-900/10 rounded-full flex items-center p-2 pr-2.5">
          <div className="pl-4 pr-3 text-slate-400">
            <Search size={22} className="text-teal-600" />
          </div>
          
          <input
            type="text"
            className="flex-1 bg-transparent border-none outline-none text-slate-800 placeholder:text-slate-400 font-medium text-lg h-12 w-full"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (e.target.value.length > 1) setShowDropdown(true);
            }}
            onFocus={() => { if(query.length > 1) setShowDropdown(true); }}
            onKeyDown={(e) => e.key === 'Enter' && handleManualSearch()}
            placeholder={isIndexLoaded ? "Search tests or packages..." : "Loading search..."}
          />

          {query && (
            <button 
              onClick={() => setQuery('')} 
              className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X size={18} />
            </button>
          )}

          <button 
            onClick={handleManualSearch}
            className="bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg hover:shadow-xl active:scale-95 transition-all"
          >
            <ArrowRight size={20} />
          </button>
        </div>
      </div>

      {/* Helper Link */}
      {!showDropdown && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center mt-4">
          <button onClick={() => setShowAiModal(true)} className="text-sm font-medium text-slate-600 hover:text-teal-700 flex items-center justify-center gap-2 mx-auto">
            <Stethoscope size={16} className="text-teal-600" />
            <span>Not sure what to test? Analyze by symptoms</span>
          </button>
        </motion.div>
      )}

      {/* Results Dropdown */}
      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute top-full left-0 right-0 mt-4 bg-white/98 backdrop-blur-xl border border-teal-100 rounded-3xl shadow-2xl overflow-hidden"
          >
            
            {/* ⚡ INSTANT RESULTS */}
            {filteredResults.length > 0 ? (
              <div className="p-2 max-h-[60vh] overflow-y-auto">
                {filteredResults.map((item) => (
                  <motion.div 
                    key={`${item.type}-${item.id}`} 
                    onClick={() => handleSelect(item)}
                    className="flex items-center gap-4 p-3 hover:bg-teal-50 rounded-2xl cursor-pointer group transition-all"
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm ${item.type === 'package' ? 'bg-teal-500' : 'bg-blue-500'}`}>
                      {item.type === 'package' ? <Package size={18} /> : <Beaker size={18} />}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-slate-800">{item.name}</div>
                      <div className="text-xs text-slate-500 capitalize">{item.type}</div>
                    </div>
                    <div className="text-teal-600 font-bold text-sm">
                      ₹{item.price.toLocaleString()}
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              // Empty State or AI Suggestion
              <div className="p-4 text-center">
                {query.length < 2 ? (
                  <div className="text-sm text-slate-400">Type at least 2 characters</div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-slate-500">No direct matches found.</p>
                    <button 
                      onClick={() => setShowAiModal(true)}
                      className="text-xs font-bold text-teal-600 bg-teal-50 px-3 py-2 rounded-lg hover:bg-teal-100 transition-colors flex items-center gap-2 mx-auto w-fit"
                    >
                      <Sparkles size={14} /> Try AI Symptom Search
                    </button>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      
      <SymptomSearchModal isOpen={showAiModal} onClose={() => setShowAiModal(false)} />
    </div>
  );
}
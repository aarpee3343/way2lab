'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Search, X, TrendingUp, Package, Beaker, ArrowRight, Loader2, Sparkles, BrainCircuit, Stethoscope, Thermometer, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SymptomSearchModal from './SymptomSearchModal';

export default function HeroSearch() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [smartSuggestion, setSmartSuggestion] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [showAiModal, setShowAiModal] = useState(false);

  // Healthcare-themed placeholders
  const placeholders = [
    "Search 'Comprehensive Health Checkup'...",
    "Describe your symptoms like 'headache & fatigue'...",
    "Search 'Diabetes Screening Package'...",
    "Type 'joint pain with fever' for AI analysis...",
    "Search 'Annual Preventive Health Check'..."
  ];
  
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [displayedPlaceholder, setDisplayedPlaceholder] = useState("");

  // Typing animation for placeholder
  useEffect(() => {
    let currentText = placeholders[placeholderIndex];
    let charIndex = 0;
    
    const typeInterval = setInterval(() => {
      if (charIndex <= currentText.length) {
        setDisplayedPlaceholder(currentText.slice(0, charIndex));
        charIndex++;
      } else {
        clearInterval(typeInterval);
        setTimeout(() => {
          setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
        }, 2000);
      }
    }, 70);

    return () => clearInterval(typeInterval);
  }, [placeholderIndex]);

  // Search logic
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.length < 2) { 
        setResults([]); 
        setSmartSuggestion(null);
        return; 
      }
      setLoading(true);
      try {
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/search?query=${query}`);
        
        if (res.data.isSmartMatch) {
          setResults(res.data.results.slice(0, 6));
          setSmartSuggestion(`AI Health Analysis: Recommended tests for "${res.data.symptomName || query}"`);
        } else {
          const data = Array.isArray(res.data) ? res.data : (res.data.results || []);
          setResults(data.slice(0, 6));
          setSmartSuggestion(null);
        }
        
        setShowDropdown(true);
      } catch (e) { console.error(e); } 
      finally { setLoading(false); }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (item: any) => {
    router.push(`/search?q=${encodeURIComponent(item.name)}`);
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto z-40" ref={wrapperRef}>
      
      {/* Search Input Bar with Healthcare Styling */}
      <div className={`relative group transition-all duration-300 ${showDropdown ? 'scale-105' : 'hover:scale-[1.02]'}`}>
        {/* Healthcare gradient glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-teal-400/20 via-blue-400/20 to-teal-400/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        <div className="relative bg-white/95 backdrop-blur-xl border border-teal-100 shadow-2xl shadow-teal-900/10 rounded-full flex items-center p-2 pr-2.5">
          {/* Medical-themed search icon */}
          <div className="pl-4 pr-3 text-slate-400">
            {loading ? (
              <Loader2 size={22} className="animate-spin text-teal-600" />
            ) : (
              <div className="relative">
                <Search size={22} strokeWidth={2.5} className="text-teal-600" />
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-teal-500 rounded-full animate-pulse" />
              </div>
            )}
          </div>
          
          <input
            type="text"
            className="flex-1 bg-transparent border-none outline-none text-slate-800 placeholder:text-slate-400 font-medium text-lg h-12 w-full"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setShowDropdown(true)}
            placeholder={displayedPlaceholder}
          />

          {query && (
            <button 
              onClick={() => { setQuery(''); setSmartSuggestion(null); }} 
              className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X size={18} />
            </button>
          )}

          {/* Healthcare CTA button */}
          <button 
            onClick={() => router.push(`/search?q=${query}`)}
            className="bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white rounded-full w-12 h-12 flex items-center justify-center transition-all duration-300 active:scale-95 shadow-lg hover:shadow-xl group/btn"
          >
            <ArrowRight size={20} className="group-hover/btn:translate-x-1 transition-transform duration-300" />
          </button>
        </div>
      </div>

      {/* Symptom Analysis Helper */}
      {!showDropdown && (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }}
          className="text-center mt-4"
        >
          <button 
            onClick={() => setShowAiModal(true)}
            className="text-sm font-medium text-slate-600 hover:text-teal-700 transition-colors flex items-center justify-center gap-2 mx-auto group/helper"
          >
            <div className="relative">
              <Stethoscope size={16} className="text-teal-600" />
              <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-teal-500 rounded-full animate-ping" />
            </div>
            <span>Not sure what to test? Analyze by symptoms</span>
            <ArrowRight size={14} className="opacity-0 group-hover/helper:opacity-100 group-hover/helper:translate-x-1 transition-all duration-300" />
          </button>
        </motion.div>
      )}

      {/* Results Dropdown with Medical Styling */}
      <AnimatePresence>
        {showDropdown && (results.length > 0 || query.length === 0) && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 mt-4 bg-white/98 backdrop-blur-xl border border-teal-100 rounded-3xl shadow-2xl overflow-hidden"
          >
            
            {/* AI Health Analysis Header */}
            {smartSuggestion && (
              <div className="px-5 py-3 bg-gradient-to-r from-teal-50 to-blue-50 border-b border-teal-100 flex items-center gap-2 text-sm font-bold text-teal-800">
                <div className="relative">
                  <Sparkles size={16} className="text-teal-600" />
                  <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-teal-500 rounded-full animate-pulse" />
                </div>
                <span>{smartSuggestion}</span>
              </div>
            )}

            <div className="p-2">
              {results.length > 0 ? (
                <div>
                  {!smartSuggestion && (
                    <div className="px-4 py-2.5 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <TrendingUp size={14} className="text-teal-600" />
                        Recommended Tests
                      </div>
                    </div>
                  )}
                  
                  {results.map((item: any) => (
                    <motion.div 
                      key={item.id} 
                      onClick={() => handleSelect(item)}
                      className="flex items-center gap-4 p-3 hover:bg-teal-50 rounded-2xl cursor-pointer group transition-all duration-300 border border-transparent hover:border-teal-100"
                      whileHover={{ x: 4 }}
                    >
                      {/* Healthcare-themed icon */}
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm ${
                        item.type === 'package' 
                          ? 'bg-gradient-to-br from-teal-500 to-teal-600 text-white' 
                          : 'bg-gradient-to-br from-blue-500 to-blue-600 text-white'
                      }`}>
                        {item.type === 'package' ? (
                          <Package size={20} strokeWidth={2} />
                        ) : (
                          <Beaker size={20} strokeWidth={2} />
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <div className="font-semibold text-slate-800 group-hover:text-teal-700 transition-colors">
                          {item.name}
                        </div>
                        <div className="text-sm text-slate-600 line-clamp-1 mt-0.5">
                          {item.description || 'Comprehensive diagnostic assessment'}
                        </div>
                      </div>
                      
                      <div className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                        <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center">
                          <ArrowRight size={16} className="text-teal-600" />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                // Popular Health Searches
                <div className="p-4">
                  <div className="flex items-center gap-2 px-2 pb-3 text-slate-600 text-sm font-semibold border-b border-slate-100 mb-4">
                    <TrendingUp size={18} className="text-teal-600" /> 
                    Popular Health Checks
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { name: 'Full Body Check', icon: <Heart size={14} className="text-rose-500" />, color: 'bg-rose-50 text-rose-700 border-rose-100 hover:bg-rose-100' },
                      { name: 'Diabetes Panel', icon: <Thermometer size={14} className="text-amber-500" />, color: 'bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-100' },
                      { name: 'Thyroid Profile', icon: <BrainCircuit size={14} className="text-blue-500" />, color: 'bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100' },
                      { name: 'Vitamin Tests', icon: <Sparkles size={14} className="text-emerald-500" />, color: 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100' },
                    ].map((tag, index) => (
                      <button 
                        key={index}
                        onClick={() => { setQuery(tag.name); router.push(`/search?q=${tag.name}`); }}
                        className={`px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 border flex items-center justify-center gap-2 ${tag.color} hover:scale-[1.02]`}
                      >
                        {tag.icon}
                        {tag.name}
                      </button>
                    ))}
                  </div>
                  
                  {/* Quick symptom suggestions */}
                  <div className="mt-5 pt-4 border-t border-slate-100">
                    <div className="text-xs text-slate-500 font-medium mb-3">Quick Symptom Search:</div>
                    <div className="flex flex-wrap gap-2">
                      {['fatigue', 'headache', 'joint pain', 'fever'].map(symptom => (
                        <button 
                          key={symptom}
                          onClick={() => { setQuery(symptom); }}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs rounded-full transition-colors font-medium capitalize"
                        >
                          {symptom}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Footer with AI suggestion */}
            <div className="px-4 py-3 bg-slate-50 border-t border-slate-100">
              <button 
                onClick={() => setShowAiModal(true)}
                className="w-full text-center text-sm text-teal-700 font-medium hover:text-teal-800 transition-colors flex items-center justify-center gap-2"
              >
                <BrainCircuit size={16} className="text-teal-600" />
                Get personalized test recommendations based on symptoms
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <SymptomSearchModal 
        isOpen={showAiModal} 
        onClose={() => setShowAiModal(false)} 
      />

      {/* Healthcare accent elements */}
      <div className="absolute -bottom-6 left-1/4 w-24 h-1 bg-gradient-to-r from-transparent via-teal-400 to-transparent opacity-50 blur-sm" />
      <div className="absolute -bottom-6 right-1/4 w-24 h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent opacity-50 blur-sm" />
    </div>
  );
}
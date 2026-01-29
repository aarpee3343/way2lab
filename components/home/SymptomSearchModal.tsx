'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, ArrowRight, Activity, Loader2, Search, Stethoscope, Heart, Brain, Thermometer, HeartPulse, Microscope, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

interface SymptomSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SymptomSearchModal({ isOpen, onClose }: SymptomSearchModalProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [searchStage, setSearchStage] = useState<'idle' | 'analyzing' | 'matching' | 'complete'>('idle');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setResults([]);
    setSearchStage('analyzing');

    try {
      // Stage 1: Analyzing symptoms
      await new Promise(resolve => setTimeout(resolve, 800));
      setSearchStage('matching');

      // Stage 2: Matching with medical database
      await new Promise(resolve => setTimeout(resolve, 800));

      const res = await axios.post('/api/ai/symptom-search', { query });
      
      // Stage 3: Complete
      setSearchStage('complete');
      
      if (res.data.matches) {
        setResults(res.data.matches);
      }
    } catch (err) {
      console.error(err);
      setSearchStage('complete');
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (item: any) => {
    onClose();
    router.push(`/search?q=${encodeURIComponent(item.name)}`);
  };

  // Hospital/animated elements for different search stages
  const getAnimatedElements = () => {
    switch(searchStage) {
      case 'analyzing':
        return (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              {/* Animated brain */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                className="absolute -inset-10"
              >
                <Brain className="w-20 h-20 text-teal-400 opacity-30" />
              </motion.div>
              
              {/* Pulsing stethoscope */}
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="relative z-10"
              >
                <Stethoscope className="w-12 h-12 text-teal-600" />
              </motion.div>

              {/* Floating medical icons */}
              <motion.div
                initial={{ opacity: 0, y: 0 }}
                animate={{ opacity: 1, y: -20 }}
                transition={{ duration: 1, repeat: Infinity, repeatType: "reverse" }}
                className="absolute -top-8 left-1/2 transform -translate-x-1/2"
              >
                <Activity className="w-6 h-6 text-blue-400" />
              </motion.div>
            </div>
          </div>
        );

      case 'matching':
        return (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              {/* Scanning effect */}
              <motion.div
                animate={{ y: [0, 50, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="absolute inset-0 bg-gradient-to-b from-transparent via-teal-100/30 to-transparent blur-sm"
              />
              
              <div className="relative z-10 grid grid-cols-2 gap-4">
                {[Microscope, Thermometer, Heart, HeartPulse].map((Icon, i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: i * 0.1, type: "spring" }}
                    whileHover={{ scale: 1.2 }}
                    className="w-12 h-12 bg-white rounded-xl shadow-lg flex items-center justify-center"
                  >
                    <Icon className="w-6 h-6 text-teal-600" />
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const getStatusMessage = () => {
    switch(searchStage) {
      case 'analyzing':
        return "Analyzing symptoms with AI...";
      case 'matching':
        return "Matching with medical database...";
      default:
        return "Describe your symptoms (e.g., 'constant headache and fatigue')";
    }
  };

  const getStageIndicators = () => {
    const stages = [
      { label: 'Input', active: searchStage !== 'idle' },
      { label: 'Analyzing', active: searchStage === 'analyzing' || searchStage === 'matching' || searchStage === 'complete' },
      { label: 'Matching', active: searchStage === 'matching' || searchStage === 'complete' },
      { label: 'Results', active: searchStage === 'complete' }
    ];

    return (
      <div className="flex items-center justify-center gap-2 mb-4">
        {stages.map((stage, index) => (
          <div key={stage.label} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-500
              ${stage.active ? 'bg-teal-600 text-white scale-110' : 'bg-slate-200 text-slate-400'}`}>
              {stage.active ? '✓' : index + 1}
            </div>
            <span className={`ml-2 text-xs font-medium transition-all duration-300
              ${stage.active ? 'text-teal-700' : 'text-slate-400'}`}>
              {stage.label}
            </span>
            {index < stages.length - 1 && (
              <div className={`w-8 h-0.5 mx-2 transition-all duration-500
                ${stage.active ? 'bg-teal-600' : 'bg-slate-200'}`} />
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          
          {/* Backdrop with medical pattern */}
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-teal-900/70 backdrop-blur-sm"
          >
            {/* Animated medical pattern */}
            <div className="absolute inset-0 opacity-10">
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 0.5, 0] }}
                  transition={{ duration: 3, delay: i * 0.2, repeat: Infinity }}
                  className="absolute text-teal-300"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                  }}
                >
                  <Activity size={24} />
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Modal Content */}
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }} 
            animate={{ scale: 1, opacity: 1, y: 0 }} 
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border border-teal-100"
          >
            
            {/* Header with healthcare gradient */}
            <div className="bg-gradient-to-r from-teal-600 via-teal-500 to-teal-600 p-6 text-white">
              <button 
                onClick={onClose} 
                className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors bg-white/10 hover:bg-white/20 p-2 rounded-full"
              >
                <X size={20} />
              </button>
              <div className="flex items-center gap-3 mb-2">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="bg-white/20 p-2 rounded-full"
                >
                  <Sparkles size={20} className="text-amber-300" />
                </motion.div>
                <h2 className="text-2xl font-bold">AI Health Assistant</h2>
              </div>
              <p className="text-teal-100 text-sm">
                Our AI analyzes your symptoms and recommends appropriate diagnostic tests
              </p>
            </div>

            {/* Progress indicators */}
            {loading && getStageIndicators()}

            {/* Input Area */}
            <div className="p-6 border-b border-slate-100 bg-gradient-to-b from-white to-teal-50/30">
              <form onSubmit={handleSearch} className="relative">
                <div className="relative">
                  <input
                    autoFocus
                    type="text"
                    placeholder="Type your symptoms here (e.g., headache, fatigue, fever)..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full pl-14 pr-24 py-5 rounded-2xl border-2 border-teal-200 shadow-lg focus:border-teal-500 focus:ring-4 focus:ring-teal-100 text-lg font-medium outline-none transition-all"
                    disabled={loading}
                  />
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                    {loading ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <Loader2 className="text-teal-600" size={24} />
                      </motion.div>
                    ) : (
                      <Stethoscope className="text-teal-600" size={24} />
                    )}
                  </div>
                  <button 
                    type="submit"
                    disabled={loading || !query.trim()}
                    className={`absolute right-2 top-1/2 transform -translate-y-1/2 
                      ${loading 
                        ? 'bg-gradient-to-r from-teal-500 to-teal-600' 
                        : 'bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800'
                      } text-white w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 disabled:opacity-50`}
                  >
                    {loading ? (
                      <Loader2 className="animate-spin" size={20} />
                    ) : (
                      <ArrowRight size={20} />
                    )}
                  </button>
                </div>
                
                {/* Status message */}
                <div className="mt-3 text-center">
                  <p className="text-sm text-slate-600 font-medium">
                    {loading ? getStatusMessage() : "Enter multiple symptoms for better accuracy"}
                  </p>
                </div>
              </form>
            </div>

            {/* Results/Animation Area */}
            <div className="flex-1 overflow-y-auto min-h-[300px] relative">
              {/* Animated hospital elements during loading */}
              {loading && (
                <div className="absolute inset-0 bg-gradient-to-b from-white via-teal-50/20 to-white">
                  {getAnimatedElements()}
                  
                  {/* Floating status text */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute bottom-8 left-0 right-0 text-center"
                  >
                    <div className="inline-flex items-center gap-2 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg">
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                        className="w-2 h-2 bg-teal-500 rounded-full"
                      />
                      <span className="text-sm font-medium text-teal-700">
                        {searchStage === 'analyzing' ? 'Analyzing symptom patterns...' : 'Searching medical protocols...'}
                      </span>
                    </div>
                  </motion.div>
                </div>
              )}

              {/* Results List */}
              <div className={`p-6 space-y-4 ${loading ? 'opacity-30' : ''}`}>
                {results.length > 0 ? (
                  <>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <motion.div
                          animate={{ rotate: [0, 360] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <Activity className="text-teal-600" size={20} />
                        </motion.div>
                        Recommended Diagnostic Tests
                      </h3>
                      <span className="text-sm font-medium text-teal-700 bg-teal-50 px-3 py-1 rounded-full">
                        {results.length} matches found
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-3">
                      {results.map((item: any, i) => (
                        <motion.div 
                          initial={{ opacity: 0, x: -20 }} 
                          animate={{ opacity: 1, x: 0 }} 
                          transition={{ delay: i * 0.1, type: "spring" }}
                          key={i} 
                          onClick={() => handleSelect(item)}
                          className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:border-teal-300 cursor-pointer transition-all duration-300 group hover:scale-[1.01]"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="font-bold text-slate-800 group-hover:text-teal-700 transition-colors text-lg">
                                  {item.name}
                                </h3>
                                <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                                  item.confidence === 'High' 
                                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                                    : 'bg-amber-100 text-amber-700 border border-amber-200'
                                }`}>
                                  {item.confidence} Match
                                </span>
                              </div>
                              <p className="text-sm text-slate-600 flex items-start gap-2">
                                <AlertCircle size={16} className="mt-0.5 shrink-0 text-teal-500" />
                                {item.reason}
                              </p>
                            </div>
                            <motion.div 
                              whileHover={{ scale: 1.2, rotate: 90 }}
                              className="w-10 h-10 bg-teal-50 rounded-full flex items-center justify-center text-slate-400 group-hover:bg-teal-100 group-hover:text-teal-600 transition-colors ml-4"
                            >
                              <ArrowRight size={18} />
                            </motion.div>
                          </div>
                          
                          {/* Additional info */}
                          <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-slate-100">
                            <span className="text-xs px-3 py-1 bg-blue-50 text-blue-700 rounded-full font-medium">
                              Diagnostic Test
                            </span>
                            <span className="text-xs px-3 py-1 bg-slate-100 text-slate-700 rounded-full font-medium">
                              Reports in 24h
                            </span>
                            <span className="text-xs px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full font-medium">
                              Home Collection
                            </span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </>
                ) : (
                  !loading && (
                    <div className="text-center py-12">
                      <motion.div
                        animate={{ y: [0, -10, 0] }}
                        transition={{ duration: 3, repeat: Infinity }}
                        className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-teal-100 to-blue-100 rounded-full mb-4"
                      >
                        <Brain className="w-10 h-10 text-teal-600" />
                      </motion.div>
                      <h3 className="text-lg font-bold text-slate-700 mb-2">Describe Your Symptoms</h3>
                      <p className="text-slate-500 max-w-md mx-auto">
                        Enter symptoms like "headache with dizziness" or "fever and cough" for AI-powered test recommendations
                      </p>
                      
                      {/* Quick symptom examples */}
                      <div className="mt-6 flex flex-wrap gap-2 justify-center">
                        {['Headache & fatigue', 'Fever & body ache', 'Stomach pain', 'Chest discomfort'].map((symptom, i) => (
                          <button
                            key={i}
                            onClick={() => setQuery(symptom)}
                            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm rounded-full transition-colors font-medium"
                          >
                            {symptom}
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
              <p className="text-xs text-slate-500">
                AI recommendations are based on medical protocols. Consult a doctor for accurate diagnosis.
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
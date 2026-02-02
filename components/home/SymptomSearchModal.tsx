'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Sparkles,
  ArrowRight,
  Activity,
  Loader2,
  Stethoscope,
  Heart,
  Brain,
  Thermometer,
  HeartPulse,
  Microscope,
  AlertCircle,
} from 'lucide-react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

interface SymptomSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SymptomSearchModal({
  isOpen,
  onClose,
}: SymptomSearchModalProps) {
  const router = useRouter();

  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [searchStage, setSearchStage] = useState<
    'idle' | 'analyzing' | 'matching' | 'complete'
  >('idle');

  /* -------------------- BODY SCROLL + ESC -------------------- */
  useEffect(() => {
    if (!isOpen) return;

    document.body.style.overflow = 'hidden';

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleEsc);

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  /* -------------------- SEARCH -------------------- */
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setResults([]);
    setSearchStage('analyzing');

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setSearchStage('matching');

      await new Promise((resolve) => setTimeout(resolve, 1500));
      const res = await axios.post('/api/ai/symptom-search', { query });

      setSearchStage('complete');
      if (res.data?.matches) {
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
    router.push(`/search?q=${encodeURIComponent(item.name)}&id=${item.id}`);
  };

  /* -------------------- ANIMATIONS -------------------- */
  const getAnimatedElements = () => {
    switch (searchStage) {
      case 'analyzing':
        return (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                className="absolute -inset-10"
              >
                <Brain className="w-20 h-20 text-teal-400 opacity-30" />
              </motion.div>

              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="relative z-10"
              >
                <Stethoscope className="w-12 h-12 text-teal-600" />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 0 }}
                animate={{ opacity: 1, y: -20 }}
                transition={{ duration: 1, repeat: Infinity, repeatType: 'reverse' }}
                className="absolute -top-8 left-1/2 -translate-x-1/2"
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
                    transition={{ delay: i * 0.1, type: 'spring' }}
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
    switch (searchStage) {
      case 'analyzing':
        return 'Analyzing symptoms with AI...';
      case 'matching':
        return 'Matching with medical database...';
      default:
        return 'Describe your symptoms';
    }
  };

  /* -------------------- RENDER -------------------- */
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6">
          {/* BACKDROP */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-teal-950/60 backdrop-blur-md"
          />

          {/* MODAL */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-teal-100 z-10"
          >
            {/* HEADER */}
            <div className="bg-gradient-to-r from-teal-600 via-teal-500 to-teal-600 p-6 text-white shrink-0">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 p-2 rounded-full"
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
                Our AI analyzes your symptoms and recommends diagnostic tests
              </p>
            </div>

            {/* INPUT */}
            <div className="p-6 border-b bg-gradient-to-b from-white to-teal-50/30 shrink-0">
              <form onSubmit={handleSearch} className="relative">
                <input
                  autoFocus
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  disabled={loading}
                  placeholder="Type your symptoms here (e.g., headache, fatigue)..."
                  className="w-full pl-14 pr-24 py-5 rounded-2xl border-2 border-teal-200 focus:border-teal-500 outline-none text-lg font-medium"
                />

                <div className="absolute left-4 top-1/2 -translate-y-1/2">
                  {loading ? (
                    <Loader2 className="animate-spin text-teal-600" />
                  ) : (
                    <Stethoscope className="text-teal-600" />
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || !query.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-teal-600 text-white w-12 h-12 rounded-xl flex items-center justify-center"
                >
                  <ArrowRight />
                </button>
              </form>

              <p className="text-center text-sm text-slate-600 mt-3">
                {loading
                  ? getStatusMessage()
                  : 'Enter multiple symptoms for better accuracy'}
              </p>
            </div>

            {/* RESULTS */}
            <div className="flex-1 overflow-y-auto relative min-h-[300px]">
              {loading && (
                <div className="absolute inset-0 z-20 bg-white/80">
                  {getAnimatedElements()}
                </div>
              )}

              <div className={`p-6 space-y-4 ${loading ? 'opacity-30' : ''}`}>
                {results.length > 0 ? (
                  results.map((item: any, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      onClick={() => handleSelect(item)}
                      className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:border-teal-300 cursor-pointer"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-lg">{item.name}</h3>
                          <p className="text-sm text-slate-600 flex gap-2 mt-1">
                            <AlertCircle size={16} className="text-teal-500" />
                            {item.reason}
                          </p>
                        </div>
                        <ArrowRight className="text-teal-600" />
                      </div>
                    </motion.div>
                  ))
                ) : (
                  !loading && (
                    <div className="text-center py-12 text-slate-500">
                      <Brain className="mx-auto mb-4 text-teal-600" size={48} />
                      Describe your symptoms to get AI-powered recommendations
                    </div>
                  )
                )}
              </div>
            </div>

            {/* FOOTER */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 text-center text-xs text-slate-500 shrink-0">
              AI recommendations are informational. Consult a doctor for diagnosis.
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

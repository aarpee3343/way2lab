'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useBookingStore } from '@/store/useBookingStore';
import { useCartStore } from '@/store/useCartStore';
import { motion } from 'framer-motion';
import { ChevronRight, Sun, Moon, Home, Building2, AlertTriangle, ArrowLeft, Calendar, Clock } from 'lucide-react';
import { toast } from 'sonner';

export default function SchedulePage() {
  const router = useRouter();
  const { items } = useCartStore();
  const { setSchedule } = useBookingStore();
  
  const [selectedDate, setSelectedDate] = useState(0); 
  const [selectedTime, setSelectedTime] = useState('');
  const [type, setType] = useState<'home_collection'|'center_visit'>('home_collection');

  // Check Radiology
  const hasNonPathology = items.some(i => 
    i.type === 'test' && ['x-ray', 'mri', 'scan', 'ultrasound'].some(k => i.name.toLowerCase().includes(k))
  );

  // Generate 14 days
  const dates = Array.from({length: 14}, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i + 1);
    return { 
      day: d.toLocaleDateString('en-US', { weekday: 'short' }), 
      date: d.getDate(),
      full: d.toISOString().split('T')[0]
    };
  });

  const slots = [
    { label: 'Morning', icon: Sun, times: ['06:00 AM - 07:00 AM', '07:00 AM - 08:00 AM', '08:00 AM - 09:00 AM', '09:00 AM - 10:00 AM', '10:00 AM - 11:00 AM'] },
    { label: 'Afternoon', icon: Sun, times: ['12:00 PM - 01:00 PM', '02:00 PM - 03:00 PM'] },
    { label: 'Evening', icon: Moon, times: ['05:00 PM - 06:00 PM', '06:00 PM - 07:00 PM'] },
  ];

  const handleNext = () => {
    if (!selectedTime) return toast.error("Please select a time slot");
    setSchedule(dates[selectedDate].full, selectedTime, type, '');
    router.push('/checkout'); // Final Review Page
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      <header className="bg-white px-4 py-4 sticky top-0 z-10 border-b border-slate-100 flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 -ml-2 text-slate-400 hover:text-slate-600 transition-colors">
          <ArrowLeft size={20}/>
        </button>
        <div className="flex-1">
          <h1 className="font-bold text-lg text-slate-800">Schedule</h1>
          <div className="flex gap-1 mt-1.5">
            <div className="h-1 w-8 bg-blue-600 rounded-full"/>
            <div className="h-1 w-8 bg-blue-600 rounded-full"/>
            <div className="h-1 w-8 bg-slate-200 rounded-full"/>
          </div>
        </div>
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Step 2/3</div>
      </header>

      <div className="max-w-3xl mx-auto p-4 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Collection Type Switcher */}
        <section>
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 ml-1">Collection Type</h2>
          <div className="bg-white p-1.5 rounded-2xl border border-slate-200 flex shadow-sm relative overflow-hidden">
            {/* Animated Background Slider */}
            <motion.div 
              className="absolute top-1.5 bottom-1.5 bg-slate-900 rounded-xl z-0 shadow-md"
              initial={false}
              animate={{ 
                left: type === 'home_collection' ? '6px' : '50%', 
                width: 'calc(50% - 6px)' 
              }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
            
            <button onClick={() => !hasNonPathology && setType('home_collection')}
              className={`flex-1 py-3.5 relative z-10 font-bold text-sm flex items-center justify-center gap-2 transition-colors ${type === 'home_collection' ? 'text-white' : hasNonPathology ? 'text-slate-300 cursor-not-allowed' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Home size={18} /> Home Collection
            </button>
            
            <button onClick={() => setType('center_visit')}
              className={`flex-1 py-3.5 relative z-10 font-bold text-sm flex items-center justify-center gap-2 transition-colors ${type === 'center_visit' ? 'text-white' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Building2 size={18} /> Lab Visit
            </button>
          </div>

          {hasNonPathology && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-3">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-3 text-amber-800 text-sm">
                <AlertTriangle size={18} className="shrink-0 text-amber-600" />
                <p>Some tests in your cart require machinery available only at the lab. Home collection is disabled.</p>
              </div>
            </motion.div>
          )}
        </section>

        {/* Date Scroller */}
        <section>
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 ml-1">Pick a Date</h2>
          <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 snap-x">
            {dates.map((d, i) => (
              <motion.div key={i} whileTap={{ scale: 0.95 }} onClick={() => setSelectedDate(i)}
                className={`min-w-[72px] flex flex-col items-center p-3 rounded-2xl border transition-all cursor-pointer snap-start ${
                  selectedDate === i 
                    ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-200 scale-105' 
                    : 'bg-white text-slate-600 border-slate-100 shadow-sm hover:border-slate-300'
                }`}
              >
                <span className={`text-xs font-medium ${selectedDate === i ? 'opacity-80' : 'opacity-50'}`}>{d.day}</span>
                <span className="text-xl font-bold mt-1">{d.date}</span>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Time Slots */}
        <section className="space-y-8">
          {slots.map((section) => (
            <div key={section.label}>
              <div className="flex items-center gap-2 mb-3 ml-1 text-slate-400">
                <section.icon size={16} />
                <span className="text-xs font-bold uppercase tracking-widest">{section.label}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {section.times.map((t) => (
                  <motion.button key={t} whileTap={{ scale: 0.98 }} onClick={() => setSelectedTime(t)}
                    className={`py-3 px-3 rounded-xl text-xs font-bold border transition-all ${
                      selectedTime === t 
                        ? 'bg-blue-50 border-blue-500 text-blue-700 ring-1 ring-blue-500 shadow-sm' 
                        : 'bg-white text-slate-600 border-slate-100 shadow-sm hover:border-slate-300'
                    }`}
                  >
                    {t}
                  </motion.button>
                ))}
              </div>
            </div>
          ))}
        </section>

      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 p-4 pb-6 md:pb-4 z-20 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <div className="flex-1">
             <p className="text-xs text-slate-400 font-bold uppercase mb-0.5">Selected Slot</p>
             <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
               <Calendar size={14} className="text-blue-600"/> {dates[selectedDate].date} {dates[selectedDate].day}
               <span className="text-slate-300">|</span>
               <Clock size={14} className="text-blue-600"/> {selectedTime || '--:--'}
             </div>
          </div>
          <button 
            disabled={!selectedTime}
            onClick={handleNext} 
            className="bg-slate-900 text-white px-8 h-12 rounded-2xl font-bold flex items-center gap-2 hover:bg-black active:scale-[0.98] transition-all shadow-lg shadow-slate-900/20 disabled:opacity-50 disabled:scale-100 disabled:shadow-none"
          >
            Review <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
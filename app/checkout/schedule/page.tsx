'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useBookingStore } from '@/store/useBookingStore';
import { useCartStore } from '@/store/useCartStore';
import { getISTDateInputValue } from '@/lib/date-time';
import { motion } from 'framer-motion';
import { ChevronRight, Sun, Moon, Home, Building2, AlertTriangle, ArrowLeft, Calendar, Clock } from 'lucide-react';
import { toast } from '@/lib/safe-toast';

const IST_OFFSET_MINUTES = 330;
const MORNING_END_HOUR = 12; // Morning slots up to 11:00 - 12:00

const toIstEpoch = (year: number, month: number, day: number, hour: number, minute = 0) =>
  Date.UTC(year, month - 1, day, hour, minute) - IST_OFFSET_MINUTES * 60 * 1000;

const pad = (n: number) => String(n).padStart(2, '0');

const parseHourMinute = (value: string) => {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (!Number.isInteger(hour) || !Number.isInteger(minute)) return null;
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return { hour, minute };
};

const resolveLabWindow = (timings: unknown) => {
  const fallback = { from: '08:00', to: '20:00' };
  if (!timings) return fallback;

  if (typeof timings === 'string') {
    const normalized = timings.trim();
    const rangeMatch = normalized.match(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/);
    if (rangeMatch) return { from: rangeMatch[1], to: rangeMatch[2] };
    return fallback;
  }

  if (typeof timings === 'object') {
    const raw = timings as Record<string, unknown>;
    const from = typeof raw.from === 'string' ? raw.from : null;
    const to = typeof raw.to === 'string' ? raw.to : null;
    if (from && to) return { from, to };
  }

  return fallback;
};

export default function SchedulePage() {
  const router = useRouter();
  const { items, lab } = useCartStore();
  const { setSchedule } = useBookingStore();
  
  const [selectedDate, setSelectedDate] = useState(0); 
  const [selectedTime, setSelectedTime] = useState('');
  const [type, setType] = useState<'home_collection'|'center_visit'>('home_collection');

  // Check Radiology
  const hasNonPathology = items.some(i => 
    i.type === 'test' && ['x-ray', 'mri', 'scan', 'ultrasound'].some(k => i.name.toLowerCase().includes(k))
  );

  useEffect(() => {
    if (hasNonPathology && type === 'home_collection') {
      setType('center_visit');
    }
  }, [hasNonPathology, type]);

  const dates = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => {
        const d = new Date(Date.now() + i * 24 * 60 * 60 * 1000);
        const day = new Intl.DateTimeFormat('en-IN', {
          weekday: 'short',
          timeZone: 'Asia/Kolkata'
        }).format(d);
        const date = Number(
          new Intl.DateTimeFormat('en-IN', {
            day: '2-digit',
            timeZone: 'Asia/Kolkata'
          }).format(d)
        );
        return {
          day,
          date,
          full: getISTDateInputValue(d)
        };
      }),
    []
  );

  const selectedDay = dates[selectedDate] || dates[0];
  const selectedDateIso = selectedDay?.full || '';

  const labWindow = useMemo(() => resolveLabWindow(lab?.timings), [lab?.timings]);

  const sundayClosedMessage = useMemo(() => {
    if (!selectedDateIso) return '';
    const [y, m, d] = selectedDateIso.split('-').map(Number);
    const middayEpoch = toIstEpoch(y, m, d, 12, 0);
    const weekdayShort = new Intl.DateTimeFormat('en-IN', {
      weekday: 'short',
      timeZone: 'Asia/Kolkata'
    }).format(new Date(middayEpoch));
    return weekdayShort === 'Sun'
      ? 'Sunday schedule is limited to morning slots. Afternoon and evening slots are unavailable.'
      : '';
  }, [selectedDateIso]);

  const slotSections = useMemo(() => {
    if (!selectedDateIso) return [];

    const [y, m, d] = selectedDateIso.split('-').map(Number);
    const nowPlus14Hours = Date.now() + 14 * 60 * 60 * 1000;
    const fromParsed = parseHourMinute(labWindow.from);
    const toParsed = parseHourMinute(labWindow.to);

    if (!fromParsed || !toParsed) return [];

    let startHour = fromParsed.hour;
    let endHour = toParsed.hour;

    if (toParsed.minute > 0) endHour += 1;
    startHour = Math.max(0, Math.min(23, startHour));
    endHour = Math.max(0, Math.min(24, endHour));
    if (endHour <= startHour) return [];

    const middayEpoch = toIstEpoch(y, m, d, 12, 0);
    const weekdayShort = new Intl.DateTimeFormat('en-IN', {
      weekday: 'short',
      timeZone: 'Asia/Kolkata'
    }).format(new Date(middayEpoch));
    const isSunday = weekdayShort === 'Sun';

    const morning: string[] = [];
    const afternoon: string[] = [];
    const evening: string[] = [];

    for (let hour = startHour; hour < endHour; hour += 1) {
      const slotStartEpoch = toIstEpoch(y, m, d, hour, 0);
      if (slotStartEpoch < nowPlus14Hours) continue;

      const nextHour = hour + 1;
      const label = `${pad(hour)}:00 - ${pad(nextHour)}:00`;

      if (hour < MORNING_END_HOUR) {
        morning.push(label);
        continue;
      }

      if (isSunday) continue;

      if (hour < 17) afternoon.push(label);
      else evening.push(label);
    }

    return [
      { label: 'Morning', icon: Sun, times: morning },
      { label: 'Afternoon', icon: Sun, times: afternoon },
      { label: 'Evening', icon: Moon, times: evening }
    ];
  }, [labWindow.from, labWindow.to, selectedDateIso]);

  useEffect(() => {
    if (!slotSections.some((section) => section.times.includes(selectedTime))) {
      setSelectedTime('');
    }
  }, [selectedTime, slotSections]);

  const handleNext = () => {
    if (!selectedTime) return toast.error("Please select a time slot");
    setSchedule(selectedDateIso, selectedTime, type, '');
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

        <section className="space-y-3">
          {/* <div className="bg-teal-50 border border-teal-200 rounded-xl p-3 text-sm text-teal-900">
            Slots follow lab operating hours ({labWindow.from} - {labWindow.to}) with 1-hour windows.
            You can book only slots from available slots.
          </div> */}
          {sundayClosedMessage && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-900">
              {sundayClosedMessage}
            </div>
          )}
          {slotSections.every((section) => section.times.length === 0) && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-sm text-rose-900">
              No slots are available for this day.
            </div>
          )}
        </section>

        {/* Time Slots */}
        <section className="space-y-8">
          {slotSections.map((section) => (
            <div key={section.label}>
              <div className="flex items-center gap-2 mb-3 ml-1 text-slate-400">
                <section.icon size={16} />
                <span className="text-xs font-bold uppercase tracking-widest">{section.label}</span>
              </div>
              {section.times.length > 0 ? (
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
              ) : (
                <p className="text-xs text-slate-400">No slots available in this window.</p>
              )}
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
               <Calendar size={14} className="text-blue-600"/> {selectedDay?.date} {selectedDay?.day}
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

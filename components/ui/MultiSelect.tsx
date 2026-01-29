'use client';
import { useState, useRef, useEffect } from 'react';
import { X, Check, ChevronDown } from 'lucide-react';

export default function MultiSelect({ options, selected, onChange, placeholder }: any) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: any) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleOption = (id: string) => {
    const newSelected = selected.includes(id)
      ? selected.filter((item: string) => item !== id)
      : [...selected, id];
    onChange(newSelected);
  };

  return (
    <div className="relative" ref={containerRef}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full border border-slate-300 rounded-xl px-3 py-2.5 bg-white cursor-pointer flex justify-between items-center min-h-[46px]"
      >
        <div className="flex flex-wrap gap-1.5">
          {selected.length === 0 && <span className="text-slate-400 text-sm">{placeholder}</span>}
          {selected.map((id: string) => {
            const opt = options.find((o: any) => String(o.id) === String(id));
            return (
              <span key={id} className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1">
                {opt?.label || opt?.name || id}
                <X size={12} className="cursor-pointer hover:text-blue-900" onClick={(e) => { e.stopPropagation(); toggleOption(id); }} />
              </span>
            );
          })}
        </div>
        <ChevronDown size={16} className="text-slate-400" />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto z-50 p-1">
          {options.map((opt: any) => (
            <div 
              key={opt.id} 
              onClick={() => toggleOption(String(opt.id))}
              className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg cursor-pointer text-sm text-slate-700"
            >
              <span>{opt.label || opt.name || opt.testName || opt.labName || opt.packageName}</span>
              {selected.includes(String(opt.id)) && <Check size={16} className="text-blue-600" />}
            </div>
          ))}
          {options.length === 0 && <div className="p-3 text-center text-slate-400 text-xs">No options available</div>}
        </div>
      )}
    </div>
  );
}
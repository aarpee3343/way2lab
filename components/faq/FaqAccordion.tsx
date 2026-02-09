'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

type FaqItem = {
  q: string;
  a: string;
};

export default function FaqAccordion({ faqs }: { faqs: FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState<number>(0);

  return (
    <div className="space-y-3">
      {faqs.map((item, index) => {
        const isOpen = openIndex === index;
        return (
          <article
            key={item.q}
            className={`rounded-2xl border bg-white shadow-sm transition-all ${
              isOpen ? 'border-teal-300' : 'border-slate-200'
            }`}
          >
            <button
              type="button"
              className="w-full px-5 py-4 text-left flex items-center justify-between gap-4"
              aria-expanded={isOpen}
              onClick={() => setOpenIndex(isOpen ? -1 : index)}
            >
              <h2 className="text-base md:text-lg font-bold text-slate-900">{item.q}</h2>
              <ChevronDown
                size={18}
                className={`shrink-0 text-teal-700 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              />
            </button>
            {isOpen && <p className="px-5 pb-5 text-slate-600">{item.a}</p>}
          </article>
        );
      })}
    </div>
  );
}

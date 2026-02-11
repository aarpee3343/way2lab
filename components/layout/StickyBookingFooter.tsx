'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo, useState } from 'react';
import { PhoneCall, MessageSquare, X, Phone, MessageCircle, LifeBuoy } from 'lucide-react';

const CARE_NUMBER = '+919311213388';
const CARE_WHATSAPP = '919311213388';

const shouldHideStickyFooter = (pathname: string | null) => {
  if (!pathname) return true;

  if (pathname === '/cart' || pathname.startsWith('/checkout')) return true;
  if (pathname.startsWith('/search')) return true;
  if (pathname.startsWith('/dashboard')) return true;
  if (pathname.startsWith('/admin')) return true;
  if (pathname.startsWith('/corp') || pathname.startsWith('/employees')) return true;
  if (pathname.startsWith('/login') || pathname.startsWith('/register') || pathname.startsWith('/forgot-password')) return true;
  if (pathname.startsWith('/account')) return true;
  if (pathname.startsWith('/order-success')) return true;

  return false;
};

export default function StickyBookingFooter() {
  const pathname = usePathname();
  const [showContactSheet, setShowContactSheet] = useState(false);

  const hidden = useMemo(() => shouldHideStickyFooter(pathname), [pathname]);
  if (hidden) return null;

  return (
    <>
      <div
        className="fixed inset-x-0 bottom-0 z-[90] border-t border-slate-200 bg-white/98 backdrop-blur-lg shadow-[0_-10px_25px_-15px_rgba(15,23,42,0.35)]"
        style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
      >
        <div className="mx-auto flex w-full max-w-4xl gap-3 px-3 pt-3">
          <Link
            href="/book-now"
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-teal-700 text-sm font-bold text-white shadow-md transition hover:brightness-105 active:scale-[0.99]"
          >
            <PhoneCall size={17} />
            Book Now
          </Link>

          <button
            type="button"
            onClick={() => setShowContactSheet(true)}
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-teal-200 bg-teal-50 text-sm font-bold text-teal-800 transition hover:bg-teal-100 active:scale-[0.99]"
          >
            <MessageSquare size={17} />
            Call / SMS
          </button>
        </div>
      </div>

      {showContactSheet && (
        <div className="fixed inset-0 z-[110]">
          <button
            type="button"
            aria-label="Close contact options"
            onClick={() => setShowContactSheet(false)}
            className="absolute inset-0 bg-slate-950/40"
          />

          <div className="absolute inset-x-0 bottom-0 rounded-t-3xl border-t border-slate-200 bg-white p-4 shadow-2xl">
            <div className="mx-auto w-full max-w-4xl">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-bold text-slate-900">Choose support option</p>
                <button
                  type="button"
                  onClick={() => setShowContactSheet(false)}
                  className="rounded-full border border-slate-200 p-2 text-slate-500 hover:bg-slate-50"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <a
                  href={`tel:${CARE_NUMBER}`}
                  className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                >
                  <Phone size={16} className="text-teal-700" />
                  Call
                </a>

                <a
                  href={`https://wa.me/${CARE_WHATSAPP}?text=${encodeURIComponent('Hi WayToLab team, I want to book a diagnostic test.')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                >
                  <MessageCircle size={16} className="text-emerald-600" />
                  WhatsApp
                </a>

                <Link
                  href="/contact"
                  onClick={() => setShowContactSheet(false)}
                  className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                >
                  <LifeBuoy size={16} className="text-blue-600" />
                  Support
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

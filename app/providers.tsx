'use client';

import { Toaster } from 'sonner';

type ToasterPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

export function UiProvider({
  children,
  toasterPosition = 'top-center',
}: {
  children: React.ReactNode;
  toasterPosition?: ToasterPosition;
}) {
  return (
    <>
      {children}
      <Toaster 
        position={toasterPosition} 
        richColors 
        closeButton
        toastOptions={{
          style: {
            background: 'white',
            border: '1px solid #e2e8f0',
            color: '#1e293b',
            fontSize: '14px',
            borderRadius: '12px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
          },
          classNames: {
            error: 'bg-rose-50 border-rose-200 text-rose-800',
            success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
            warning: 'bg-amber-50 border-amber-200 text-amber-800',
            info: 'bg-teal-50 border-teal-200 text-teal-800',
          },
          duration: 4000,
        }}
      />
    </>
  );
}

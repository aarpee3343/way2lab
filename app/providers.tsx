'use client';

import { Toaster } from 'sonner';

export function UiProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster position="top-center" richColors closeButton />
    </>
  );
}
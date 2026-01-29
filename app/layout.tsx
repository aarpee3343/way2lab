import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header"; 
import Footer from "@/components/layout/Footer"; 
import { UiProvider } from "./providers"; 
import { Toaster } from "sonner";
import NextTopLoader from 'nextjs-toploader';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "WayToLab - Advanced Diagnostic Healthcare",
  description: "Book diagnostic tests from certified labs with home collection, AI-powered reports, and expert consultation",
  keywords: ["diagnostic tests", "health checkup", "lab tests", "medical tests", "healthcare"],
  authors: [{ name: "WayToLab" }],
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    title: 'WayToLab - Advanced Diagnostic Healthcare',
    description: 'Book diagnostic tests from certified labs',
    siteName: 'WayToLab',
  },
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link 
          rel="stylesheet" 
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" 
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={`${inter.className} antialiased bg-gradient-to-b from-teal-50/20 via-white to-slate-50`}>
        
        {/* Healthcare-themed Progress Bar */}
        <NextTopLoader 
          color="#0d9488" // Teal color
          initialPosition={0.08}
          crawlSpeed={200}
          height={3}
          crawl={true}
          showSpinner={false}
          easing="ease"
          speed={200}
          shadow="0 0 10px rgba(13, 148, 136, 0.5)"
          template={`
            <div class="bar" role="bar">
              <div class="peg"></div>
            </div>
            <div class="spinner" role="spinner">
              <div class="spinner-icon"></div>
            </div>
          `}
        />

        <UiProvider>
          <Header />
          
          <main className="min-h-screen pt-20">
            {children}
          </main>
          
          <Footer />
        </UiProvider>

        {/* Healthcare-themed Toaster */}
        <Toaster 
          position="top-center" 
          richColors 
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
        
        {/* Medical-themed background pattern */}
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full opacity-[0.03]">
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="medical-pattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                  <path d="M50 20L50 80M20 50L80 50" stroke="#0d9488" strokeWidth="1" fill="none"/>
                  <circle cx="50" cy="50" r="10" stroke="#0d9488" strokeWidth="0.5" fill="none"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#medical-pattern)" />
            </svg>
          </div>
        </div>
      </body>
    </html>
  );
}
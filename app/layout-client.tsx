'use client';

import { usePathname } from "next/navigation";
import NextTopLoader from "nextjs-toploader";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { UiProvider } from "./providers";

export default function LayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const isCorpRoute =
    pathname.startsWith("/corp") || pathname.startsWith("/employees");
  const isAdminRoute = pathname.startsWith("/admin");
  const isDashboardRoute = pathname.startsWith("/dashboard");

  const hidePublicLayout = isCorpRoute || isAdminRoute;
  const toasterPosition = isDashboardRoute ? "bottom-right" : "top-center";

  return (
    <>
      <NextTopLoader
        color="#0d9488"
        initialPosition={0.08}
        crawlSpeed={200}
        height={3}
        crawl
        showSpinner={false}
        easing="ease"
        speed={200}
        shadow="0 0 10px rgba(13, 148, 136, 0.5)"
      />

      <UiProvider toasterPosition={toasterPosition}>
        {!hidePublicLayout && <Header />}

        <main
          className={
            !hidePublicLayout ? "min-h-screen pt-20" : "min-h-screen"
          }
        >
          {children}
        </main>

        {!hidePublicLayout && <Footer />}
      </UiProvider>

      {/* Background pattern stays global */}
      <div className="fixed inset-0 -z-10 pointer-events-none opacity-[0.03]">
        <svg width="100%" height="100%">
          <defs>
            <pattern
              id="medical-pattern"
              x="0"
              y="0"
              width="100"
              height="100"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M50 20L50 80M20 50L80 50"
                stroke="#0d9488"
                strokeWidth="1"
                fill="none"
              />
              <circle
                cx="50"
                cy="50"
                r="10"
                stroke="#0d9488"
                strokeWidth="0.5"
                fill="none"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#medical-pattern)" />
        </svg>
      </div>
    </>
  );
}

'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

export default function Breadcrumbs() {
  const pathname = usePathname();
  
  // Don't show on home page
  if (pathname === '/') return null;

  const pathSegments = pathname.split('/').filter(Boolean);

  return (
    <nav className="flex items-center text-sm text-slate-500 mb-6 animate-in fade-in slide-in-from-left-2 duration-500">
      <Link href="/" className="hover:text-blue-600 transition-colors flex items-center gap-1">
        <Home size={14} />
        <span className="sr-only">Home</span>
      </Link>
      
      {pathSegments.map((segment, index) => {
        const href = `/${pathSegments.slice(0, index + 1).join('/')}`;
        const isLast = index === pathSegments.length - 1;
        
        // Format: "orders" -> "Orders", "123" -> "#123"
        let label = segment.replace(/-/g, ' ');
        if (!isNaN(Number(segment))) label = `#${segment}`; // If it's an ID
        
        return (
          <div key={href} className="flex items-center">
            <ChevronRight size={14} className="mx-2 text-slate-300" />
            {isLast ? (
              <span className="font-bold text-slate-800 capitalize">
                {label}
              </span>
            ) : (
              <Link href={href} className="hover:text-blue-600 transition-colors capitalize">
                {label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}
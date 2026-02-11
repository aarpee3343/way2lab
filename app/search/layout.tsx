import type { Metadata } from 'next';
import { absoluteUrl } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Search Diagnostic Tests in Gurugram and Delhi | WayToLab',
  description:
    'Search and compare blood tests, health packages, and diagnostic services in Gurugram, Gurgaon, and Delhi NCR by test name, price, and availability.',
  alternates: { canonical: absoluteUrl('/search') },
  openGraph: {
    title: 'Search Diagnostic Tests in Gurugram and Delhi | WayToLab',
    description:
      'Find diagnostic tests and packages in Gurugram and Delhi NCR with transparent pricing and home collection availability.',
    url: absoluteUrl('/search'),
    type: 'website'
  }
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children;
}

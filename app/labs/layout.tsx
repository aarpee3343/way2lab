import type { Metadata } from 'next';
import { absoluteUrl } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'NABL Certified Diagnostic Labs in Gurugram and Delhi | WayToLab',
  description:
    'Find and compare NABL certified diagnostic labs in Gurugram, Gurgaon, and Delhi NCR with ratings, timings, and home collection availability.',
  alternates: { canonical: absoluteUrl('/labs') },
  openGraph: {
    title: 'NABL Certified Diagnostic Labs in Gurugram and Delhi | WayToLab',
    description:
      'Compare diagnostic labs in Gurugram and Delhi NCR with transparent details and home collection options.',
    url: absoluteUrl('/labs'),
    type: 'website'
  }
};

export default function LabsLayout({ children }: { children: React.ReactNode }) {
  return children;
}

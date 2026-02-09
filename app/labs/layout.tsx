import type { Metadata } from 'next';
import { absoluteUrl } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Diagnostic Labs | NABL Certified Labs Near You | WayToLab',
  description:
    'Find NABL certified diagnostic labs, compare ratings, timings and home collection availability. Book tests from trusted labs.',
  alternates: { canonical: absoluteUrl('/labs') },
  openGraph: {
    title: 'Diagnostic Labs | WayToLab',
    description: 'Find NABL certified diagnostic labs with transparent details and home collection options.',
    url: absoluteUrl('/labs'),
    type: 'website'
  }
};

export default function LabsLayout({ children }: { children: React.ReactNode }) {
  return children;
}


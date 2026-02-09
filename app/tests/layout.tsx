import type { Metadata } from 'next';
import { absoluteUrl } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Diagnostic Tests | Book Blood Tests Online | WayToLab',
  description:
    'Browse and book diagnostic tests online from certified labs. Compare prices, preparation details, and report timelines across CBC, thyroid, diabetes, vitamin tests and more.',
  alternates: { canonical: absoluteUrl('/tests') },
  openGraph: {
    title: 'Diagnostic Tests | WayToLab',
    description:
      'Book diagnostic tests online from certified labs with home sample collection and digital reports.',
    url: absoluteUrl('/tests'),
    type: 'website'
  }
};

export default function TestsLayout({ children }: { children: React.ReactNode }) {
  return children;
}


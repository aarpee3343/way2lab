import type { Metadata } from 'next';
import { absoluteUrl } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Blood & Diagnostic Tests in Gurugram and Delhi | WayToLab',
  description:
    'Compare and book blood tests online in Gurugram, Gurgaon, and Delhi NCR. Check prices, preparation guidance, and report timelines from certified labs.',
  alternates: { canonical: absoluteUrl('/tests') },
  openGraph: {
    title: 'Blood & Diagnostic Tests in Gurugram and Delhi | WayToLab',
    description:
      'Book blood and diagnostic tests online across Gurugram and Delhi NCR with home sample collection and digital reports.',
    url: absoluteUrl('/tests'),
    type: 'website'
  }
};

export default function TestsLayout({ children }: { children: React.ReactNode }) {
  return children;
}

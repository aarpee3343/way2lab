import type { Metadata } from 'next';
import { absoluteUrl } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Health Checkup Packages in Gurugram and Delhi | WayToLab',
  description:
    'Explore full body and preventive health checkup packages in Gurugram, Gurgaon, and Delhi NCR with transparent pricing and certified lab support.',
  alternates: { canonical: absoluteUrl('/packages') },
  openGraph: {
    title: 'Health Checkup Packages in Gurugram and Delhi | WayToLab',
    description:
      'Book preventive and full body checkup packages in Gurugram and Delhi NCR with home collection and certified lab support.',
    url: absoluteUrl('/packages'),
    type: 'website'
  }
};

export default function PackagesLayout({ children }: { children: React.ReactNode }) {
  return children;
}

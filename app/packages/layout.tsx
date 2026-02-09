import type { Metadata } from 'next';
import { absoluteUrl } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Health Checkup Packages | Full Body Packages | WayToLab',
  description:
    'Explore full body health checkup packages with transparent pricing, test inclusions and certified lab support. Book preventive health packages online.',
  alternates: { canonical: absoluteUrl('/packages') },
  openGraph: {
    title: 'Health Checkup Packages | WayToLab',
    description: 'Book preventive health checkup packages with certified lab support.',
    url: absoluteUrl('/packages'),
    type: 'website'
  }
};

export default function PackagesLayout({ children }: { children: React.ReactNode }) {
  return children;
}


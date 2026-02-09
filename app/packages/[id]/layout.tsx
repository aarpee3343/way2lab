import type { Metadata } from 'next';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { absoluteUrl, truncate } from '@/lib/seo';

type Props = {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
};

async function getPackage(id: string) {
  const numericId = Number(id);
  if (!Number.isFinite(numericId)) return null;
  return prisma.package.findFirst({
    where: { id: numericId, isActive: true, isCorporate: false },
    include: {
      tests: {
        include: {
          test: {
            select: {
              id: true,
              slug: true,
              testName: true
            }
          }
        }
      }
    }
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const pkg = await getPackage(id);
  if (!pkg) {
    return {
      title: 'Package Not Found | WayToLab',
      robots: { index: false, follow: true }
    };
  }

  const title = `${pkg.packageName} Package | Price & Included Tests | WayToLab`;
  const description = truncate(
    pkg.description ||
      `Book ${pkg.packageName} package online. Includes ${pkg.tests.length} diagnostic tests with certified lab support.`,
    158
  );

  return {
    title,
    description,
    keywords: [
      `${pkg.packageName} package`,
      `${pkg.packageName} price`,
      'health checkup package',
      'full body checkup package'
    ],
    alternates: { canonical: absoluteUrl(`/packages/${pkg.id}`) },
    openGraph: {
      title,
      description,
      url: absoluteUrl(`/packages/${pkg.id}`),
      type: 'website'
    }
  };
}

export default async function PackageDetailLayout({ children, params }: Props) {
  const { id } = await params;
  const pkg = await getPackage(id);
  const relatedPackages = pkg
    ? await prisma.package.findMany({
        where: {
          isActive: true,
          isCorporate: false,
          id: { not: pkg.id },
          ...(pkg.category ? { category: pkg.category } : {})
        },
        select: { id: true, packageName: true },
        take: 8
      })
    : [];
  const includedTests = pkg?.tests?.slice(0, 12).map((t: any) => t.test).filter(Boolean) || [];

  const jsonLd = pkg
    ? {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: pkg.packageName,
        description: pkg.description || `${pkg.packageName} health package`,
        category: 'Health Checkup Package',
        brand: { '@type': 'Brand', name: 'WayToLab' },
        offers: {
          '@type': 'Offer',
          priceCurrency: 'INR',
          price: Number(pkg.price || 0),
          availability: 'https://schema.org/InStock',
          url: absoluteUrl(`/packages/${pkg.id}`)
        }
      }
    : null;

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: absoluteUrl('/') },
      { '@type': 'ListItem', position: 2, name: 'Packages', item: absoluteUrl('/packages') },
      {
        '@type': 'ListItem',
        position: 3,
        name: pkg?.packageName || 'Package',
        item: absoluteUrl(`/packages/${pkg?.id || id}`)
      }
    ]
  };

  const faqJsonLd = pkg
    ? {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: `What does ${pkg.packageName} include?`,
            acceptedAnswer: {
              '@type': 'Answer',
              text: `${pkg.packageName} includes ${pkg.tests.length} diagnostic tests. Review the included test list on this page before booking.`
            }
          },
          {
            '@type': 'Question',
            name: `Is home collection available for ${pkg.packageName}?`,
            acceptedAnswer: {
              '@type': 'Answer',
              text: `Home collection depends on the selected lab and service area. Availability is shown during checkout.`
            }
          },
          {
            '@type': 'Question',
            name: `How do I choose the best lab for ${pkg.packageName}?`,
            acceptedAnswer: {
              '@type': 'Answer',
              text: `Compare lab availability, pricing, and schedule options, then confirm booking with your preferred lab.`
            }
          }
        ]
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {faqJsonLd && (
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      )}
      {children}
      {(relatedPackages.length > 0 || includedTests.length > 0) && (
        <section className="max-w-6xl mx-auto px-4 pb-12 space-y-6">
          {includedTests.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="text-lg font-bold text-slate-900">Included Tests</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {includedTests.map((t: any) => (
                  <Link
                    key={t.id}
                    href={`/tests/${t.slug || t.id}`}
                    className="rounded-full border border-teal-200 bg-teal-50 px-3 py-1.5 text-sm font-semibold text-teal-700 hover:bg-teal-100"
                  >
                    {t.testName}
                  </Link>
                ))}
              </div>
            </div>
          )}
          {relatedPackages.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="text-lg font-bold text-slate-900">Related Health Packages</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {relatedPackages.map((p) => (
                  <Link
                    key={p.id}
                    href={`/packages/${p.id}`}
                    className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-700 hover:bg-blue-100"
                  >
                    {p.packageName}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </section>
      )}
    </>
  );
}

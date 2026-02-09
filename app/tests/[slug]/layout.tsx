import type { Metadata } from 'next';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { absoluteUrl, toSlug, truncate } from '@/lib/seo';
import { buildBreadcrumbSchema, buildFaqSchema } from '@/lib/schema';

type Props = {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
};

async function getTest(slug: string) {
  const isId = /^\d+$/.test(slug);
  return prisma.test.findFirst({
    where: {
      isActive: true,
      OR: [{ slug }, ...(isId ? [{ id: Number(slug) }] : [])]
    },
    select: {
      id: true,
      slug: true,
      testName: true,
      category: true,
      description: true,
      preparation: true,
      scheduleReporting: true,
      price: true,
      discount: true
    }
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const test = await getTest(slug);
  if (!test) {
    return {
      title: 'Diagnostic Test Not Found | WayToLab',
      robots: { index: false, follow: true }
    };
  }

  const canonicalSlug = test.slug || test.id.toString();
  const title = `${test.testName} Test | Price, Preparation & Booking | WayToLab`;
  const description = truncate(
    test.description ||
      `Book ${test.testName} test online from certified labs. Check preparation, report time and transparent pricing.`,
    158
  );

  return {
    title,
    description,
    keywords: [
      `${test.testName} test`,
      `${test.testName} price`,
      `${test.testName} test booking`,
      'diagnostic tests',
      'lab test near me'
    ],
    alternates: { canonical: absoluteUrl(`/tests/${canonicalSlug}`) },
    openGraph: {
      title,
      description,
      url: absoluteUrl(`/tests/${canonicalSlug}`),
      type: 'website'
    }
  };
}

export default async function TestDetailLayout({ children, params }: Props) {
  const { slug } = await params;
  const test = await getTest(slug);
  const canonicalSlug = test?.slug || test?.id?.toString() || slug;
  const relatedTests = test
    ? await prisma.test.findMany({
        where: {
          isActive: true,
          id: { not: test.id },
          ...(test.category ? { category: test.category } : {})
        },
        select: { id: true, slug: true, testName: true },
        take: 10
      })
    : [];
  const relatedPackages = test
    ? await prisma.package.findMany({
        where: {
          isActive: true,
          isCorporate: false,
          tests: { some: { testId: test.id } }
        },
        select: { id: true, packageName: true },
        take: 8
      })
    : [];

  const jsonLd = test
    ? {
        '@context': 'https://schema.org',
        '@type': 'MedicalTest',
        name: test.testName,
        description:
          test.description ||
          `Diagnostic test: ${test.testName}.`,
        url: absoluteUrl(`/tests/${canonicalSlug}`),
        medicineSystem: 'https://schema.org/WesternConventional',
        preparation: test.preparation || undefined,
        relevantSpecialty: test.category || undefined
      }
    : null;

  const breadcrumbJsonLd = buildBreadcrumbSchema([
    { name: 'Home', item: absoluteUrl('/') },
    { name: 'Tests', item: absoluteUrl('/tests') },
    {
      name: test?.testName || toSlug(slug) || 'Test',
      item: absoluteUrl(`/tests/${canonicalSlug}`)
    }
  ]);

  const faqJsonLd = test
    ? buildFaqSchema([
        {
          question: `How should I prepare for ${test.testName}?`,
          answer:
            test.preparation ||
            `Preparation depends on the test protocol. Confirm fasting and medication guidance before sample collection.`
        },
        {
          question: `How long does ${test.testName} reporting take?`,
          answer:
            test.scheduleReporting ||
            `Reporting timelines vary by lab workflow. Exact turnaround time is confirmed at booking.`
        },
        {
          question: `Can I book ${test.testName} with home collection?`,
          answer: `Home collection availability depends on selected lab and serviceability in your pincode.`
        }
      ])
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
      {(relatedTests.length > 0 || relatedPackages.length > 0) && (
        <section className="max-w-6xl mx-auto px-4 pb-12 space-y-6">
          {relatedTests.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="text-lg font-bold text-slate-900">Related Diagnostic Tests</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {relatedTests.map((t) => (
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
              <h2 className="text-lg font-bold text-slate-900">Packages Including This Test</h2>
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

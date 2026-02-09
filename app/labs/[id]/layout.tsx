import type { Metadata } from 'next';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { absoluteUrl, truncate } from '@/lib/seo';
import { buildBreadcrumbSchema, buildFaqSchema, buildLabSchema } from '@/lib/schema';

type Props = {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
};

async function getLab(id: string) {
  const numericId = Number(id);
  if (!Number.isFinite(numericId)) return null;
  return prisma.lab.findFirst({
    where: { id: numericId, activeStatus: true },
    select: {
      id: true,
      labName: true,
      address: true,
      city: true,
      state: true,
      pincode: true,
      contactNo: true,
      email: true,
      rating: true,
      reviewCount: true,
      latitude: true,
      longitude: true,
      timings: true
    }
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const lab = await getLab(id);
  if (!lab) {
    return {
      title: 'Lab Not Found | WayToLab',
      robots: { index: false, follow: true }
    };
  }

  const location = [lab.city, lab.state].filter(Boolean).join(', ');
  const title = `${lab.labName}${location ? ` - ${location}` : ''} | Diagnostic Lab | WayToLab`;
  const description = truncate(
    `View ${lab.labName} details including timings, address, contact and available diagnostics${location ? ` in ${location}` : ''}.`,
    158
  );

  return {
    title,
    description,
    keywords: [
      `${lab.labName}`,
      `${lab.labName} lab`,
      `diagnostic lab ${lab.city || ''}`.trim(),
      'NABL certified lab',
      'lab tests near me'
    ],
    alternates: { canonical: absoluteUrl(`/labs/${lab.id}`) },
    openGraph: {
      title,
      description,
      url: absoluteUrl(`/labs/${lab.id}`),
      type: 'website'
    }
  };
}

export default async function LabDetailLayout({ children, params }: Props) {
  const { id } = await params;
  const lab = await getLab(id);
  const featuredTests = lab
    ? await prisma.labTest.findMany({
        where: {
          labId: lab.id,
          available: true,
          test: { isActive: true }
        },
        include: {
          test: {
            select: { id: true, slug: true, testName: true }
          }
        },
        orderBy: { testId: 'asc' },
        take: 12
      })
    : [];
  const featuredPackages = lab
    ? await prisma.labPackage.findMany({
        where: {
          labId: lab.id,
          available: true,
          package: { isActive: true, isCorporate: false }
        },
        include: {
          package: {
            select: { id: true, packageName: true }
          }
        },
        orderBy: { packageId: 'asc' },
        take: 8
      })
    : [];

  const jsonLd = lab
    ? buildLabSchema({
        id: lab.id,
        name: lab.labName,
        phone: lab.contactNo,
        email: lab.email,
        address: lab.address,
        city: lab.city,
        state: lab.state,
        pincode: lab.pincode,
        latitude: lab.latitude,
        longitude: lab.longitude,
        rating: Number(lab.rating || 0),
        reviewCount: Number(lab.reviewCount || 0),
        timings: lab.timings
      })
    : null;

  const breadcrumbJsonLd = buildBreadcrumbSchema([
    { name: 'Home', item: absoluteUrl('/') },
    { name: 'Labs', item: absoluteUrl('/labs') },
    {
      name: lab?.labName || 'Lab',
      item: absoluteUrl(`/labs/${lab?.id || id}`)
    }
  ]);

  const faqJsonLd = lab
    ? buildFaqSchema([
        {
          question: `Is ${lab.labName} available for home sample collection?`,
          answer: `Home collection depends on test type and pincode serviceability. Confirm slot availability during checkout.`
        },
        {
          question: `How can I contact ${lab.labName}?`,
          answer: lab.contactNo
            ? `You can reach the lab on ${lab.contactNo}.`
            : `Contact information is shown on the lab profile when available.`
        },
        {
          question: `Which tests and packages are available at ${lab.labName}?`,
          answer: `Available tests and packages are listed on this page and may vary by lab catalog updates.`
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
      {(featuredTests.length > 0 || featuredPackages.length > 0) && (
        <section className="max-w-6xl mx-auto px-4 pb-12 space-y-6">
          {featuredTests.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="text-lg font-bold text-slate-900">Tests Available At This Lab</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {featuredTests.map((row) => (
                  <Link
                    key={row.id}
                    href={`/tests/${row.test.slug || row.test.id}`}
                    className="rounded-full border border-teal-200 bg-teal-50 px-3 py-1.5 text-sm font-semibold text-teal-700 hover:bg-teal-100"
                  >
                    {row.test.testName}
                  </Link>
                ))}
              </div>
            </div>
          )}
          {featuredPackages.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="text-lg font-bold text-slate-900">Packages Available At This Lab</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {featuredPackages.map((row) => (
                  <Link
                    key={row.id}
                    href={`/packages/${row.package.id}`}
                    className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-700 hover:bg-blue-100"
                  >
                    {row.package.packageName}
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

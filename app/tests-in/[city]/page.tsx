import type { Metadata } from 'next';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { absoluteUrl, toSlug, truncate } from '@/lib/seo';
import { buildBreadcrumbSchema } from '@/lib/schema';

type Props = {
  params: Promise<{ city: string }>;
};

async function resolveCity(rawCitySlug: string) {
  const labs = await prisma.lab.findMany({
    where: { activeStatus: true, city: { not: null } },
    select: { city: true },
    distinct: ['city']
  });
  const matched = labs.find((l) => toSlug(l.city) === rawCitySlug);
  return matched?.city || null;
}

async function getCityTests(citySlug: string) {
  const cityName = await resolveCity(citySlug);
  if (!cityName) return { cityName: null as string | null, tests: [] as any[], labCount: 0 };

  const labs = await prisma.lab.findMany({
    where: { activeStatus: true, city: { equals: cityName, mode: 'insensitive' } },
    select: { id: true }
  });
  const labIds = labs.map((l) => l.id);
  if (!labIds.length) return { cityName, tests: [], labCount: 0 };

  const rows = await prisma.labTest.findMany({
    where: {
      available: true,
      labId: { in: labIds },
      test: { isActive: true }
    },
    select: {
      test: {
        select: {
          id: true,
          slug: true,
          testName: true,
          category: true,
          description: true
        }
      }
    },
    take: 5000
  });

  const seen = new Set<number>();
  const tests = [];
  for (const row of rows) {
    if (seen.has(row.test.id)) continue;
    seen.add(row.test.id);
    tests.push(row.test);
  }

  return { cityName, tests, labCount: labIds.length };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city } = await params;
  const data = await getCityTests(city);
  const cityLabel = data.cityName || city.replace(/-/g, ' ');

  return {
    title: `Diagnostic Tests in ${cityLabel} | Compare & Book Online | WayToLab`,
    description: truncate(
      `Discover and compare diagnostic tests in ${cityLabel}. Check available tests from certified labs and book online with transparent pricing.`,
      158
    ),
    alternates: { canonical: absoluteUrl(`/tests-in/${city}`) },
    openGraph: {
      title: `Diagnostic Tests in ${cityLabel} | WayToLab`,
      description: `Compare and book diagnostic tests in ${cityLabel}.`,
      url: absoluteUrl(`/tests-in/${city}`),
      type: 'website'
    }
  };
}

export default async function CityTestsPage({ params }: Props) {
  const { city } = await params;
  const data = await getCityTests(city);
  const cityLabel = data.cityName || city.replace(/-/g, ' ');

  const breadcrumbJsonLd = buildBreadcrumbSchema([
    { name: 'Home', item: absoluteUrl('/') },
    { name: 'Tests', item: absoluteUrl('/tests') },
    { name: `Tests in ${cityLabel}`, item: absoluteUrl(`/tests-in/${city}`) }
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50/20 via-white to-slate-50 py-12">
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <div className="max-w-6xl mx-auto px-4">
        <div className="rounded-3xl bg-gradient-to-r from-teal-600 to-teal-700 text-white p-8">
          <h1 className="text-3xl md:text-4xl font-black">Diagnostic Tests in {cityLabel}</h1>
          <p className="mt-3 text-teal-100">
            {data.tests.length} tests available across {data.labCount} labs in {cityLabel}.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.tests.map((test: any) => {
            const slug = test.slug || String(test.id);
            return (
              <Link
                key={test.id}
                href={`/tests-in/${city}/${slug}`}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-all"
              >
                <p className="text-xs font-bold uppercase tracking-wide text-teal-700">{test.category || 'Diagnostic'}</p>
                <h2 className="mt-2 font-bold text-slate-900">{test.testName}</h2>
                <p className="mt-2 text-sm text-slate-600 line-clamp-2">
                  {test.description || `Book ${test.testName} in ${cityLabel}.`}
                </p>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

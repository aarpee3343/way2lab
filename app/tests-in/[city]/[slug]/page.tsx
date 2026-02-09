import type { Metadata } from 'next';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { absoluteUrl, toSlug, truncate } from '@/lib/seo';

type Props = {
  params: Promise<{ city: string; slug: string }>;
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

async function getCityTestData(citySlug: string, slug: string) {
  const cityName = await resolveCity(citySlug);
  if (!cityName) return null;

  const isId = /^\d+$/.test(slug);
  const test = await prisma.test.findFirst({
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
      preparation: true
    }
  });
  if (!test) return null;

  const labRows = await prisma.labTest.findMany({
    where: {
      available: true,
      testId: test.id,
      lab: { activeStatus: true, city: { equals: cityName, mode: 'insensitive' } }
    },
    include: {
      lab: {
        select: {
          id: true,
          labName: true,
          city: true,
          pincode: true,
          rating: true,
          homeCollectionCharges: true
        }
      }
    },
    orderBy: { price: 'asc' },
    take: 50
  });

  const related = await prisma.test.findMany({
    where: {
      isActive: true,
      category: test.category || undefined,
      id: { not: test.id }
    },
    select: { id: true, slug: true, testName: true },
    take: 8
  });

  return { cityName, test, labs: labRows, related };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city, slug } = await params;
  const data = await getCityTestData(city, slug);
  const cityLabel = data?.cityName || city.replace(/-/g, ' ');
  const testName = data?.test?.testName || 'Diagnostic Test';

  return {
    title: `${testName} in ${cityLabel} | Labs, Price & Booking | WayToLab`,
    description: truncate(
      `Compare labs offering ${testName} in ${cityLabel}. Check availability and book from certified labs online.`,
      158
    ),
    alternates: { canonical: absoluteUrl(`/tests-in/${city}/${slug}`) },
    openGraph: {
      title: `${testName} in ${cityLabel} | WayToLab`,
      description: `Book ${testName} in ${cityLabel} from certified labs.`,
      url: absoluteUrl(`/tests-in/${city}/${slug}`),
      type: 'website'
    }
  };
}

export default async function CityTestPage({ params }: Props) {
  const { city, slug } = await params;
  const data = await getCityTestData(city, slug);

  if (!data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900">Page not found</h1>
          <p className="mt-2 text-slate-600">This city-test page is not available.</p>
        </div>
      </div>
    );
  }

  const testSlug = data.test.slug || String(data.test.id);
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: absoluteUrl('/') },
      { '@type': 'ListItem', position: 2, name: 'Tests', item: absoluteUrl('/tests') },
      { '@type': 'ListItem', position: 3, name: `Tests in ${data.cityName}`, item: absoluteUrl(`/tests-in/${city}`) },
      { '@type': 'ListItem', position: 4, name: data.test.testName, item: absoluteUrl(`/tests-in/${city}/${testSlug}`) }
    ]
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50/20 via-white to-slate-50 py-12">
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <div className="max-w-6xl mx-auto px-4">
        <div className="rounded-3xl bg-gradient-to-r from-teal-600 to-teal-700 text-white p-8">
          <h1 className="text-3xl md:text-4xl font-black">
            {data.test.testName} in {data.cityName}
          </h1>
          <p className="mt-3 text-teal-100">
            {data.labs.length} labs available for this test in {data.cityName}.
          </p>
        </div>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-bold text-slate-900">About the test</h2>
          <p className="mt-2 text-slate-600">
            {data.test.description || `${data.test.testName} is available in ${data.cityName}.`}
          </p>
          {data.test.preparation && (
            <p className="mt-3 text-sm text-slate-700">
              <span className="font-bold">Preparation:</span> {data.test.preparation}
            </p>
          )}
          <div className="mt-4">
            <Link href={`/tests/${testSlug}`} className="text-sm font-bold text-teal-700 hover:underline">
              View full test details
            </Link>
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-bold text-slate-900">Available Labs in {data.cityName}</h2>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.labs.map((row) => (
              <Link
                key={`${row.lab.id}-${row.id}`}
                href={`/labs/${row.lab.id}`}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-all"
              >
                <h3 className="font-bold text-slate-900">{row.lab.labName}</h3>
                <p className="mt-1 text-sm text-slate-600">
                  {row.lab.city} - {row.lab.pincode || 'N/A'}
                </p>
                <p className="mt-2 text-sm text-slate-700">Price: INR {Number(row.price || 0).toFixed(0)}</p>
                <p className="mt-1 text-xs text-slate-500">
                  Home Collection: INR {Number(row.lab.homeCollectionCharges || 0).toFixed(0)}
                </p>
              </Link>
            ))}
          </div>
        </section>

        {data.related.length > 0 && (
          <section className="mt-10 rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-bold text-slate-900">Related tests in {data.cityName}</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {data.related.map((t) => (
                <Link
                  key={t.id}
                  href={`/tests-in/${city}/${t.slug || t.id}`}
                  className="text-sm rounded-full border border-teal-200 bg-teal-50 px-3 py-1.5 text-teal-700 font-semibold hover:bg-teal-100"
                >
                  {t.testName}
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}


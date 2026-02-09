import type { Metadata } from 'next';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { absoluteUrl, toSlug, truncate } from '@/lib/seo';
import { buildBreadcrumbSchema } from '@/lib/schema';

type Props = {
  params: Promise<{ city: string; id: string }>;
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

async function getCityPackageData(citySlug: string, id: string) {
  const cityName = await resolveCity(citySlug);
  const numericId = Number(id);
  if (!cityName || !Number.isFinite(numericId)) return null;

  const pkg = await prisma.package.findFirst({
    where: { id: numericId, isActive: true, isCorporate: false },
    include: {
      tests: {
        include: { test: { select: { id: true, slug: true, testName: true } } }
      }
    }
  });
  if (!pkg) return null;

  const labRows = await prisma.labPackage.findMany({
    where: {
      packageId: numericId,
      available: true,
      lab: { activeStatus: true, city: { equals: cityName, mode: 'insensitive' } }
    },
    include: {
      lab: {
        select: { id: true, labName: true, city: true, pincode: true, homeCollectionCharges: true }
      }
    },
    orderBy: { price: 'asc' },
    take: 50
  });

  const related = await prisma.package.findMany({
    where: {
      isActive: true,
      isCorporate: false,
      id: { not: pkg.id },
      ...(pkg.category ? { category: pkg.category } : {})
    },
    select: { id: true, packageName: true },
    take: 8
  });

  return { cityName, pkg, labs: labRows, related };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city, id } = await params;
  const data = await getCityPackageData(city, id);
  const cityLabel = data?.cityName || city.replace(/-/g, ' ');
  const packageName = data?.pkg?.packageName || 'Health Package';

  return {
    title: `${packageName} in ${cityLabel} | Labs, Price & Booking | WayToLab`,
    description: truncate(
      `Compare labs offering ${packageName} in ${cityLabel}. Check test inclusions and book online.`,
      158
    ),
    alternates: { canonical: absoluteUrl(`/packages-in/${city}/${id}`) },
    openGraph: {
      title: `${packageName} in ${cityLabel} | WayToLab`,
      description: `Book ${packageName} in ${cityLabel} from certified labs.`,
      url: absoluteUrl(`/packages-in/${city}/${id}`),
      type: 'website'
    }
  };
}

export default async function CityPackagePage({ params }: Props) {
  const { city, id } = await params;
  const data = await getCityPackageData(city, id);
  if (!data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900">Page not found</h1>
          <p className="mt-2 text-slate-600">This city-package page is not available.</p>
        </div>
      </div>
    );
  }

  const breadcrumbJsonLd = buildBreadcrumbSchema([
    { name: 'Home', item: absoluteUrl('/') },
    { name: 'Packages', item: absoluteUrl('/packages') },
    { name: `Packages in ${data.cityName}`, item: absoluteUrl(`/packages-in/${city}`) },
    { name: data.pkg.packageName, item: absoluteUrl(`/packages-in/${city}/${id}`) }
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
          <h1 className="text-3xl md:text-4xl font-black">
            {data.pkg.packageName} in {data.cityName}
          </h1>
          <p className="mt-3 text-teal-100">{data.labs.length} labs available for this package.</p>
        </div>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-bold text-slate-900">Package Overview</h2>
          <p className="mt-2 text-slate-600">
            {data.pkg.description || `${data.pkg.packageName} is available in ${data.cityName}.`}
          </p>
          <p className="mt-3 text-sm text-slate-700">
            <span className="font-bold">Included tests:</span> {data.pkg.tests.length}
          </p>
          <div className="mt-4">
            <Link href={`/packages/${data.pkg.id}`} className="text-sm font-bold text-teal-700 hover:underline">
              View full package details
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
            <h2 className="text-lg font-bold text-slate-900">Related Packages in {data.cityName}</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {data.related.map((p) => (
                <Link
                  key={p.id}
                  href={`/packages-in/${city}/${p.id}`}
                  className="text-sm rounded-full border border-teal-200 bg-teal-50 px-3 py-1.5 text-teal-700 font-semibold hover:bg-teal-100"
                >
                  {p.packageName}
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

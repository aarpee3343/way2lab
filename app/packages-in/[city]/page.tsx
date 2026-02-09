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

async function getCityPackages(citySlug: string) {
  const cityName = await resolveCity(citySlug);
  if (!cityName) return { cityName: null as string | null, packages: [] as any[], labCount: 0 };

  const labs = await prisma.lab.findMany({
    where: { activeStatus: true, city: { equals: cityName, mode: 'insensitive' } },
    select: { id: true }
  });
  const labIds = labs.map((l) => l.id);
  if (!labIds.length) return { cityName, packages: [], labCount: 0 };

  const rows = await prisma.labPackage.findMany({
    where: {
      available: true,
      labId: { in: labIds },
      package: { isActive: true, isCorporate: false }
    },
    select: {
      package: {
        select: {
          id: true,
          packageName: true,
          description: true,
          price: true,
          discount: true
        }
      }
    },
    take: 3000
  });

  const seen = new Set<number>();
  const packages = [];
  for (const row of rows) {
    if (seen.has(row.package.id)) continue;
    seen.add(row.package.id);
    packages.push(row.package);
  }

  return { cityName, packages, labCount: labIds.length };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city } = await params;
  const data = await getCityPackages(city);
  const cityLabel = data.cityName || city.replace(/-/g, ' ');

  return {
    title: `Health Packages in ${cityLabel} | Full Body Checkups | WayToLab`,
    description: truncate(
      `Compare preventive health packages in ${cityLabel}. Explore full body checkups from certified labs and book online.`,
      158
    ),
    alternates: { canonical: absoluteUrl(`/packages-in/${city}`) },
    openGraph: {
      title: `Health Packages in ${cityLabel} | WayToLab`,
      description: `Find and compare diagnostic health packages in ${cityLabel}.`,
      url: absoluteUrl(`/packages-in/${city}`),
      type: 'website'
    }
  };
}

export default async function CityPackagesPage({ params }: Props) {
  const { city } = await params;
  const data = await getCityPackages(city);
  const cityLabel = data.cityName || city.replace(/-/g, ' ');

  const breadcrumbJsonLd = buildBreadcrumbSchema([
    { name: 'Home', item: absoluteUrl('/') },
    { name: 'Packages', item: absoluteUrl('/packages') },
    { name: `Packages in ${cityLabel}`, item: absoluteUrl(`/packages-in/${city}`) }
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
          <h1 className="text-3xl md:text-4xl font-black">Health Packages in {cityLabel}</h1>
          <p className="mt-3 text-teal-100">
            {data.packages.length} packages available across {data.labCount} labs.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.packages.map((pkg: any) => (
            <Link
              key={pkg.id}
              href={`/packages-in/${city}/${pkg.id}`}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-all"
            >
              <h2 className="font-bold text-slate-900">{pkg.packageName}</h2>
              <p className="mt-2 text-sm text-slate-600 line-clamp-2">
                {pkg.description || `Book ${pkg.packageName} in ${cityLabel}.`}
              </p>
              <p className="mt-3 text-sm text-slate-700">From INR {Number(pkg.price || 0).toFixed(0)}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

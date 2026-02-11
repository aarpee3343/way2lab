import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/db';
import { absoluteUrl, toSlug } from '@/lib/seo';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: absoluteUrl('/'), lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: absoluteUrl('/tests'), lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: absoluteUrl('/packages'), lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: absoluteUrl('/labs'), lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: absoluteUrl('/search'), lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: absoluteUrl('/book-now'), lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: absoluteUrl('/about'), lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: absoluteUrl('/contact'), lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: absoluteUrl('/privacy-policy'), lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: absoluteUrl('/terms'), lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: absoluteUrl('/refund-policy'), lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: absoluteUrl('/blogs'), lastModified: now, changeFrequency: 'weekly', priority: 0.7 }
    ,{ url: absoluteUrl('/faq'), lastModified: now, changeFrequency: 'monthly', priority: 0.6 }
  ];

  const [tests, packages, labs, blogs, cities, cityTestRows, cityPackageRows] = await Promise.all([
    prisma.test.findMany({
      where: { isActive: true },
      select: { slug: true, id: true, createdAt: true }
    }),
    prisma.package.findMany({
      where: { isActive: true, isCorporate: false },
      select: { id: true, createdAt: true }
    }),
    prisma.lab.findMany({
      where: { activeStatus: true },
      select: { id: true, createdAt: true }
    }),
    prisma.blogPost.findMany({
      where: { status: 'APPROVED' },
      select: { slug: true, createdAt: true }
    }),
    prisma.lab.findMany({
      where: { activeStatus: true, city: { not: null } },
      select: { city: true },
      distinct: ['city']
    }),
    prisma.labTest.findMany({
      where: {
        available: true,
        lab: { activeStatus: true, city: { not: null } },
        test: { isActive: true }
      },
      select: {
        lab: { select: { city: true } },
        test: { select: { id: true, slug: true, createdAt: true } }
      },
      orderBy: { id: 'asc' },
      take: 10000
    }),
    prisma.labPackage.findMany({
      where: {
        available: true,
        lab: { activeStatus: true, city: { not: null } },
        package: { isActive: true, isCorporate: false }
      },
      select: {
        lab: { select: { city: true } },
        package: { select: { id: true, createdAt: true } }
      },
      orderBy: { id: 'asc' },
      take: 10000
    })
  ]);

  const testRoutes: MetadataRoute.Sitemap = tests.map((t) => ({
    url: absoluteUrl(`/tests/${t.slug || t.id}`),
    lastModified: t.createdAt || now,
    changeFrequency: 'weekly',
    priority: 0.8
  }));

  const packageRoutes: MetadataRoute.Sitemap = packages.map((p) => ({
    url: absoluteUrl(`/packages/${p.id}`),
    lastModified: p.createdAt || now,
    changeFrequency: 'weekly',
    priority: 0.8
  }));

  const labRoutes: MetadataRoute.Sitemap = labs.map((l) => ({
    url: absoluteUrl(`/labs/${l.id}`),
    lastModified: l.createdAt || now,
    changeFrequency: 'weekly',
    priority: 0.8
  }));

  const blogRoutes: MetadataRoute.Sitemap = blogs.map((b) => ({
    url: absoluteUrl(`/blogs/${b.slug}`),
    lastModified: b.createdAt || now,
    changeFrequency: 'monthly',
    priority: 0.6
  }));

  const cityRoutes: MetadataRoute.Sitemap = cities
    .filter((c) => c.city)
    .map((c) => ({
      url: absoluteUrl(`/tests-in/${toSlug(c.city)}`),
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.7
    }));

  const cityPackageIndexRoutes: MetadataRoute.Sitemap = cities
    .filter((c) => c.city)
    .map((c) => ({
      url: absoluteUrl(`/packages-in/${toSlug(c.city)}`),
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.7
    }));

  const seen = new Set<string>();
  const cityTestRoutes: MetadataRoute.Sitemap = [];
  for (const row of cityTestRows) {
    const citySlug = toSlug(row.lab.city);
    const testSlug = row.test.slug || row.test.id.toString();
    if (!citySlug || !testSlug) continue;
    const key = `${citySlug}|${testSlug}`;
    if (seen.has(key)) continue;
    seen.add(key);
    cityTestRoutes.push({
      url: absoluteUrl(`/tests-in/${citySlug}/${testSlug}`),
      lastModified: row.test.createdAt || now,
      changeFrequency: 'weekly',
      priority: 0.7
    });
  }

  const seenPackage = new Set<string>();
  const cityPackageRoutes: MetadataRoute.Sitemap = [];
  for (const row of cityPackageRows) {
    const citySlug = toSlug(row.lab.city);
    const packageId = row.package.id.toString();
    if (!citySlug || !packageId) continue;
    const key = `${citySlug}|${packageId}`;
    if (seenPackage.has(key)) continue;
    seenPackage.add(key);
    cityPackageRoutes.push({
      url: absoluteUrl(`/packages-in/${citySlug}/${packageId}`),
      lastModified: row.package.createdAt || now,
      changeFrequency: 'weekly',
      priority: 0.7
    });
  }

  return [
    ...staticRoutes,
    ...testRoutes,
    ...packageRoutes,
    ...labRoutes,
    ...blogRoutes,
    ...cityRoutes,
    ...cityPackageIndexRoutes,
    ...cityTestRoutes,
    ...cityPackageRoutes
  ];
}

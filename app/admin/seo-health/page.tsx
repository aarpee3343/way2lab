import Link from 'next/link';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

type Row = { id: number; name: string };

function isBlank(value?: string | null) {
  return !value || value.trim().length === 0;
}

function thin(value?: string | null, minLength = 120) {
  return !!value && value.trim().length > 0 && value.trim().length < minLength;
}

function SectionCard({
  title,
  count,
  children
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900">{title}</h2>
        <span
          className={`rounded-full px-3 py-1 text-xs font-bold ${
            count > 0
              ? 'bg-rose-100 text-rose-700 border border-rose-200'
              : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
          }`}
        >
          {count}
        </span>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function SimpleList({
  rows,
  hrefPrefix,
  emptyText
}: {
  rows: Row[];
  hrefPrefix: string;
  emptyText: string;
}) {
  if (rows.length === 0) return <p className="text-sm text-slate-500">{emptyText}</p>;
  return (
    <ul className="space-y-2">
      {rows.map((row) => (
        <li key={row.id}>
          <Link href={`${hrefPrefix}${row.id}`} className="text-sm font-semibold text-blue-700 hover:underline">
            #{row.id} - {row.name}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default async function SeoHealthPage() {
  try {
    await requireAdmin({ roles: ['SUPER_ADMIN', 'ADMIN'] });
  } catch {
    redirect('/admin/login');
  }

  const [tests, packages, labs, orphanTests, orphanPackages] = await Promise.all([
    prisma.test.findMany({
      where: { isActive: true },
      select: { id: true, testName: true, slug: true, description: true, category: true },
      orderBy: { id: 'desc' },
      take: 3000
    }),
    prisma.package.findMany({
      where: { isActive: true, isCorporate: false },
      select: { id: true, packageName: true, description: true },
      orderBy: { id: 'desc' },
      take: 3000
    }),
    prisma.lab.findMany({
      where: { activeStatus: true },
      select: { id: true, labName: true, city: true, pincode: true, address: true },
      orderBy: { id: 'desc' },
      take: 3000
    }),
    prisma.test.findMany({
      where: {
        isActive: true,
        labTests: {
          none: {
            available: true,
            lab: { activeStatus: true }
          }
        }
      },
      select: { id: true, testName: true },
      orderBy: { id: 'desc' },
      take: 25
    }),
    prisma.package.findMany({
      where: {
        isActive: true,
        isCorporate: false,
        labs: {
          none: {
            available: true,
            lab: { activeStatus: true }
          }
        }
      },
      select: { id: true, packageName: true },
      orderBy: { id: 'desc' },
      take: 25
    })
  ]);

  const testsMissingSlug = tests.filter((t) => isBlank(t.slug)).slice(0, 25);
  const testsMissingDescription = tests.filter((t) => isBlank(t.description)).slice(0, 25);
  const testsMissingCategory = tests.filter((t) => isBlank(t.category)).slice(0, 25);
  const testsThinDescription = tests.filter((t) => thin(t.description)).slice(0, 25);

  const packagesMissingDescription = packages.filter((p) => isBlank(p.description)).slice(0, 25);
  const packagesThinDescription = packages.filter((p) => thin(p.description)).slice(0, 25);

  const labsMissingLocation = labs
    .filter((l) => isBlank(l.city) || isBlank(l.pincode) || isBlank(l.address))
    .slice(0, 25);

  const quickStats = [
    { label: 'Active Tests', value: tests.length },
    { label: 'Active Packages', value: packages.length },
    { label: 'Active Labs', value: labs.length },
    { label: 'Orphan Tests', value: orphanTests.length },
    { label: 'Orphan Packages', value: orphanPackages.length }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">SEO Health Report</h1>
        <p className="text-slate-600 mt-1">
          Track metadata/data gaps that reduce index quality for tests, packages, and labs.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {quickStats.map((card) => (
          <div key={card.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">{card.label}</p>
            <p className="mt-2 text-2xl font-black text-slate-900">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <SectionCard title="Tests Missing Slug" count={testsMissingSlug.length}>
          <SimpleList
            rows={testsMissingSlug.map((x) => ({ id: x.id, name: x.testName }))}
            hrefPrefix="/admin/tests/"
            emptyText="All active tests have slugs."
          />
        </SectionCard>

        <SectionCard title="Tests Missing Description" count={testsMissingDescription.length}>
          <SimpleList
            rows={testsMissingDescription.map((x) => ({ id: x.id, name: x.testName }))}
            hrefPrefix="/admin/tests/"
            emptyText="No missing test descriptions in sampled data."
          />
        </SectionCard>

        <SectionCard title="Tests Missing Category" count={testsMissingCategory.length}>
          <SimpleList
            rows={testsMissingCategory.map((x) => ({ id: x.id, name: x.testName }))}
            hrefPrefix="/admin/tests/"
            emptyText="No missing test categories in sampled data."
          />
        </SectionCard>

        <SectionCard title="Thin Test Descriptions (<120 chars)" count={testsThinDescription.length}>
          <SimpleList
            rows={testsThinDescription.map((x) => ({ id: x.id, name: x.testName }))}
            hrefPrefix="/admin/tests/"
            emptyText="No thin test descriptions in sampled data."
          />
        </SectionCard>

        <SectionCard title="Packages Missing Description" count={packagesMissingDescription.length}>
          <SimpleList
            rows={packagesMissingDescription.map((x) => ({ id: x.id, name: x.packageName }))}
            hrefPrefix="/admin/packages/edit/"
            emptyText="All active packages have descriptions."
          />
        </SectionCard>

        <SectionCard title="Thin Package Descriptions (<120 chars)" count={packagesThinDescription.length}>
          <SimpleList
            rows={packagesThinDescription.map((x) => ({ id: x.id, name: x.packageName }))}
            hrefPrefix="/admin/packages/edit/"
            emptyText="No thin package descriptions in sampled data."
          />
        </SectionCard>

        <SectionCard title="Labs Missing Address / City / Pincode" count={labsMissingLocation.length}>
          <SimpleList
            rows={labsMissingLocation.map((x) => ({ id: x.id, name: x.labName }))}
            hrefPrefix="/admin/labs/"
            emptyText="All active labs have complete location details."
          />
        </SectionCard>

        <SectionCard title="Orphan Tests (Not Available in Active Labs)" count={orphanTests.length}>
          <SimpleList
            rows={orphanTests.map((x) => ({ id: x.id, name: x.testName }))}
            hrefPrefix="/admin/tests/"
            emptyText="No orphan tests found in sampled data."
          />
        </SectionCard>

        <SectionCard title="Orphan Packages (Not Available in Active Labs)" count={orphanPackages.length}>
          <SimpleList
            rows={orphanPackages.map((x) => ({ id: x.id, name: x.packageName }))}
            hrefPrefix="/admin/packages/edit/"
            emptyText="No orphan packages found in sampled data."
          />
        </SectionCard>
      </div>
    </div>
  );
}

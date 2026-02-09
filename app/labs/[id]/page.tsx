import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import LabCoverageMap from '@/components/labs/LabCoverageMap';

type Props = {
  params: Promise<{ id: string }>;
};

async function getLabDetails(id: string) {
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
      latitude: true,
      longitude: true,
      homeCollectionCharges: true,
      pincodes: {
        select: { pincode: true },
        orderBy: { pincode: 'asc' },
        take: 500
      },
      tests: {
        where: { available: true, test: { isActive: true } },
        orderBy: { price: 'asc' },
        take: 100,
        select: {
          id: true,
          price: true,
          discount: true,
          test: {
            select: {
              id: true,
              slug: true,
              testName: true,
              category: true
            }
          }
        }
      },
      packages: {
        where: { available: true, package: { isActive: true, isCorporate: false } },
        orderBy: { price: 'asc' },
        take: 100,
        select: {
          id: true,
          price: true,
          discount: true,
          package: {
            select: {
              id: true,
              packageName: true
            }
          }
        }
      }
    }
  });
}

export default async function LabDetailPage({ params }: Props) {
  const { id } = await params;
  const lab = await getLabDetails(id);
  if (!lab) return notFound();

  const fullAddress = [lab.address, lab.city, lab.state, lab.pincode].filter(Boolean).join(', ');
  const coveragePincodes = Array.from(new Set(lab.pincodes.map((p) => p.pincode).filter(Boolean)));

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50/20 via-white to-slate-50 py-10">
      <div className="max-w-6xl mx-auto px-4">
        <div className="rounded-3xl bg-gradient-to-r from-teal-600 to-teal-700 text-white p-8 shadow-lg">
          <p className="text-xs font-bold uppercase tracking-wide text-teal-100">Lab Profile</p>
          <h1 className="mt-2 text-3xl md:text-4xl font-black">{lab.labName}</h1>
          <p className="mt-3 text-teal-100">{fullAddress || 'Address unavailable'}</p>
          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            <span className="rounded-full bg-white/15 px-3 py-1.5">Phone: {lab.contactNo || 'N/A'}</span>
            <span className="rounded-full bg-white/15 px-3 py-1.5">Email: {lab.email || 'N/A'}</span>
            <span className="rounded-full bg-white/15 px-3 py-1.5">
              Home Collection: INR {Number(lab.homeCollectionCharges || 0).toFixed(0)}
            </span>
          </div>
          <div className="mt-6 flex gap-3">
            <Link href="/labs" className="rounded-xl bg-white text-teal-700 px-4 py-2 font-bold hover:bg-teal-50">
              Back to Labs
            </Link>
            <Link href="/search" className="rounded-xl border border-white/40 px-4 py-2 font-bold hover:bg-white/10">
              Book Now
            </Link>
          </div>
        </div>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">Lab Coverage</h2>
          <p className="mt-2 text-sm text-slate-600">
            View the service coverage area for this lab with branded location pins.
          </p>
          <div className="mt-4">
            <LabCoverageMap
              labName={lab.labName}
              latitude={lab.latitude}
              longitude={lab.longitude}
              city={lab.city}
              state={lab.state}
              primaryPincode={lab.pincode}
              coveragePincodes={coveragePincodes}
            />
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">Available Tests</h2>
          {lab.tests.length === 0 ? (
            <p className="mt-3 text-slate-600">No tests are currently available for this lab.</p>
          ) : (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              {lab.tests.map((row) => (
                <Link
                  key={row.id}
                  href={`/tests/${row.test.slug || row.test.id}`}
                  className="rounded-xl border border-slate-200 p-4 hover:border-teal-300 hover:bg-teal-50/40 transition-colors"
                >
                  <p className="text-xs font-bold uppercase text-teal-700">{row.test.category || 'Diagnostic Test'}</p>
                  <p className="mt-1 font-semibold text-slate-900">{row.test.testName}</p>
                  <p className="mt-2 text-sm text-slate-700">Price: INR {Number(row.price || 0).toFixed(0)}</p>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">Available Packages</h2>
          {lab.packages.length === 0 ? (
            <p className="mt-3 text-slate-600">No packages are currently available for this lab.</p>
          ) : (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              {lab.packages.map((row) => (
                <Link
                  key={row.id}
                  href={`/packages/${row.package.id}`}
                  className="rounded-xl border border-slate-200 p-4 hover:border-blue-300 hover:bg-blue-50/40 transition-colors"
                >
                  <p className="font-semibold text-slate-900">{row.package.packageName}</p>
                  <p className="mt-2 text-sm text-slate-700">Price: INR {Number(row.price || 0).toFixed(0)}</p>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

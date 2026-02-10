import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!id || Number.isNaN(id)) {
    return NextResponse.json({ message: 'Invalid lab id' }, { status: 400 });
  }

  try {
    const lab = await prisma.lab.findUnique({
      where: { id },
      include: {
        pincodes: true,
        packages: {
          include: {
            package: {
              select: {
                id: true,
                packageName: true,
                description: true,
                price: true,
                discount: true
              }
            }
          }
        },
        tests: {
          include: {
            test: {
              select: {
                id: true,
                testName: true,
                category: true,
                price: true,
                discount: true
              }
            }
          }
        }
      }
    });

    if (!lab) {
      return NextResponse.json({ message: 'Lab not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: lab.id,
      labName: lab.labName,
      address: lab.address,
      city: lab.city,
      state: lab.state,
      pincode: lab.pincode,
      contactNo: lab.contactNo,
      email: lab.email,
      activeStatus: lab.activeStatus,
      rating: Number(lab.rating || 0),
      reviewCount: lab.reviewCount,
      features: lab.features ?? [],
      timings: lab.timings ?? null,
      homeCollectionCharges: Number(lab.homeCollectionCharges || 0),
      latitude: lab.latitude,
      longitude: lab.longitude,
      pincodes: lab.pincodes.map((p) => p.pincode),
      packages: lab.packages.map((p) => ({
        id: p.packageId,
        packageName: p.package.packageName,
        description: p.package.description,
        price: Number(p.price || 0),
        discount: Number(p.discount || 0),
        basePrice: Number(p.package.price || 0),
        baseDiscount: Number(p.package.discount || 0)
      })),
      tests: lab.tests.map((t) => ({
        id: t.testId,
        testName: t.test.testName,
        category: t.test.category,
        price: Number(t.price || 0),
        discount: Number(t.discount || 0),
        basePrice: Number(t.test.price || 0),
        baseDiscount: Number(t.test.discount || 0),
        available: t.available
      }))
    });
  } catch (error) {
    console.error('Lab detail API error', error);
    return NextResponse.json({ message: 'Failed to fetch lab details' }, { status: 500 });
  }
}

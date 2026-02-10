import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get('page') || '1'));
    const limit = Math.min(1000, Math.max(1, Number(searchParams.get('limit') || '1000')));
    const skip = (page - 1) * limit;

    const labs = await prisma.lab.findMany({
      where: { activeStatus: true },
      orderBy: { labName: 'asc' },
      skip,
      take: limit,
      select: {
        id: true,
        labName: true,
        address: true,
        city: true,
        state: true,
        pincode: true,
        contactNo: true,
        email: true,
        activeStatus: true,
        rating: true,
        reviewCount: true,
        features: true,
        timings: true,
        homeCollectionCharges: true,
        latitude: true,
        longitude: true
      }
    });

    const payload = labs.map((lab) => ({
      ...lab,
      rating: Number(lab.rating || 0),
      homeCollectionCharges: Number(lab.homeCollectionCharges || 0)
    }));

    return NextResponse.json(payload);
  } catch (error) {
    console.error('Labs API error', error);
    return NextResponse.json({ message: 'Failed to fetch labs' }, { status: 500 });
  }
}

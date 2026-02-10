'use server';

import { requireAdmin } from '@/lib/admin-auth';
import { prisma } from '@/lib/db';

export async function getAdminContactRequests() {
  await requireAdmin({ roles: ['SUPER_ADMIN'] });

  const requests = await prisma.contactRequest.findMany({
    orderBy: { createdAt: 'desc' },
    take: 500
  });

  return requests.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString()
  }));
}

export async function getAdminContactRequest(requestId: number) {
  await requireAdmin({ roles: ['SUPER_ADMIN'] });

  const request = await prisma.contactRequest.findUnique({
    where: { id: requestId }
  });

  if (!request) return null;

  return {
    ...request,
    createdAt: request.createdAt.toISOString()
  };
}

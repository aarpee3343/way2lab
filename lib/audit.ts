import { prisma } from '@/lib/db';
import type { Prisma } from '@prisma/client';

type AuditInput = {
  adminId?: number | null;
  adminEmail?: string | null;
  action: string;
  entityType?: string;
  entityId?: string | number | null;
  metadata?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  actorType?: 'ADMIN' | 'SYSTEM';
};

export async function writeAdminAuditLog(input: AuditInput) {
  try {
    const metadata =
      input.metadata == null
        ? undefined
        : (JSON.parse(JSON.stringify(input.metadata)) as Prisma.InputJsonValue);

    await prisma.adminAuditLog.create({
      data: {
        actorType: input.actorType || 'ADMIN',
        adminId: input.adminId || null,
        adminEmail: input.adminEmail || null,
        action: input.action,
        entityType: input.entityType || null,
        entityId: input.entityId != null ? String(input.entityId) : null,
        metadata,
        ipAddress: input.ipAddress || null,
        userAgent: input.userAgent || null,
      },
    });
  } catch (error) {
    console.error('writeAdminAuditLog error:', error);
  }
}

import { prisma } from '@/lib/db';
import type { Prisma } from '@prisma/client';

const KEY_MAX = 128;

function sanitizeKey(value: string) {
  return value.trim().slice(0, KEY_MAX);
}

function toInputJsonValue(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value ?? null)) as Prisma.InputJsonValue;
}

export async function getIdempotentResponse(key: string, route: string, method: string, userId?: number | null) {
  const safe = sanitizeKey(key);
  if (!safe) return null;
  const now = new Date();
  return prisma.apiIdempotencyKey.findFirst({
    where: {
      key: safe,
      route,
      method,
      userId: userId ?? null,
      expiresAt: { gt: now },
    },
    select: {
      responseCode: true,
      responseBody: true,
    },
  });
}

export async function storeIdempotentResponse(params: {
  key: string;
  route: string;
  method: string;
  userId?: number | null;
  responseCode: number;
  responseBody: unknown;
  ttlSeconds?: number;
}) {
  const safe = sanitizeKey(params.key);
  if (!safe) return;
  const ttlSeconds = Math.max(60, params.ttlSeconds ?? 60 * 60 * 24);
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

  await prisma.apiIdempotencyKey.upsert({
    where: { key: safe },
    create: {
      key: safe,
      route: params.route,
      method: params.method,
      userId: params.userId ?? null,
      responseCode: params.responseCode,
      responseBody: toInputJsonValue(params.responseBody),
      expiresAt,
    },
    update: {
      route: params.route,
      method: params.method,
      userId: params.userId ?? null,
      responseCode: params.responseCode,
      responseBody: toInputJsonValue(params.responseBody),
      expiresAt,
    },
  });
}

export async function pruneExpiredIdempotencyKeys(limit = 1000) {
  void limit;
  return prisma.apiIdempotencyKey.deleteMany({
    where: {
      expiresAt: { lt: new Date() },
    },
  });
}

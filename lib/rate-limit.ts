type RateLimitOptions = {
  key: string;
  limit: number;
  windowSec: number;
};

type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSec: number;
};

const localStore = new Map<string, { count: number; resetAt: number }>();

const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;

async function upstashCall<T = unknown>(...parts: (string | number)[]) {
  if (!upstashUrl || !upstashToken) return null;
  const path = parts.map((p) => encodeURIComponent(String(p))).join('/');
  const res = await fetch(`${upstashUrl}/${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${upstashToken}`,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { result?: T };
  return data.result ?? null;
}

function applyLocalRateLimit({ key, limit, windowSec }: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  const resetAt = now + windowSec * 1000;
  const existing = localStore.get(key);

  if (!existing || existing.resetAt <= now) {
    localStore.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: Math.max(0, limit - 1), retryAfterSec: windowSec };
  }

  existing.count += 1;
  localStore.set(key, existing);
  const remaining = Math.max(0, limit - existing.count);
  const retryAfterSec = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
  return {
    allowed: existing.count <= limit,
    remaining,
    retryAfterSec,
  };
}

export async function rateLimit(options: RateLimitOptions): Promise<RateLimitResult> {
  const redisKey = `rl:${options.key}`;
  const current = await upstashCall<number>('incr', redisKey);
  if (current == null) return applyLocalRateLimit(options);
  if (current === 1) {
    await upstashCall<number>('expire', redisKey, options.windowSec);
  }
  const ttl = await upstashCall<number>('ttl', redisKey);
  return {
    allowed: current <= options.limit,
    remaining: Math.max(0, options.limit - current),
    retryAfterSec: ttl && ttl > 0 ? ttl : options.windowSec,
  };
}

export function getRequestIp(req: Request) {
  const xfwd = req.headers.get('x-forwarded-for');
  if (xfwd) return xfwd.split(',')[0].trim();
  return req.headers.get('x-real-ip') || 'unknown';
}

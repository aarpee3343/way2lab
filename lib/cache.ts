// lib/cache.ts
const CACHE_TTL = 60 * 5; // 5 minutes
let redisClient: { get: <T>(key: string) => Promise<T | null>; setex: (key: string, ttlSeconds: number, value: any) => Promise<any>; } | null = null;

async function getRedisClient() {
  if (redisClient) return redisClient;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) return null;

  try {
    const { Redis } = await import('@upstash/redis');
    redisClient = new Redis({ url, token });
    return redisClient;
  } catch (error) {
    console.warn('Upstash Redis unavailable, falling back to no-cache mode.', error);
    return null;
  }
}

export async function getCachedData<T>(key: string, fetchData: () => Promise<T>): Promise<T> {
  if (process.env.NODE_ENV === 'development') {
    return fetchData();
  }

  const redis = await getRedisClient();
  if (!redis) return fetchData();

  const cached = await redis.get<T>(key);
  if (cached) {
    return cached;
  }
  
  const data = await fetchData();
  await redis.setex(key, CACHE_TTL, data);
  return data;
}

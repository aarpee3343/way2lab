// lib/cache.ts
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const CACHE_TTL = 60 * 5; // 5 minutes

export async function getCachedData<T>(key: string, fetchData: () => Promise<T>): Promise<T> {
  if (process.env.NODE_ENV === 'development') {
    return fetchData();
  }
  
  const cached = await redis.get<T>(key);
  if (cached) {
    return cached;
  }
  
  const data = await fetchData();
  await redis.setex(key, CACHE_TTL, data);
  return data;
}
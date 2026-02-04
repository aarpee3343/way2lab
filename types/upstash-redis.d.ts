declare module '@upstash/redis' {
  export class Redis {
    constructor(options: { url: string; token: string });
    get<T>(key: string): Promise<T | null>;
    setex(key: string, ttlSeconds: number, value: any): Promise<any>;
  }
}

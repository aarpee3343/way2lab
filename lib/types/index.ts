
export * from './dashboard';

export * from './prisma';

// Common utility types
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type WithId<T> = T & { id: number };
export type Paginated<T> = {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
};
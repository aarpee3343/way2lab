// lib/index.ts
// Barrel exports for easy imports

// Database
export { prisma, db, DBService } from './db';
export { successResponse, errorResponse, handlePrismaError } from './db';

// Types
export type {
  Customer,
  Order,
  Lab,
  FamilyMember,
  CustomerAddress,
  DashboardStats,
  DashboardResponse,
  ApiResponse,
} from './types/dashboard';

// Auth (assuming you have this)
export { getAuthUser } from './auth';

// Utils
export { generateOrderNumber, generateCustomerUHID } from './utils/generators';
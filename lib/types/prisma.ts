// lib/types/prisma.ts
import { Prisma } from '@prisma/client';
import type { ApiResponse } from './dashboard';

// ===================== PRISMA GENERATED TYPES =====================

// 1. Customer types
export type CustomerWithRelations = Prisma.CustomerGetPayload<{
  include: {
    addresses: true;
    familyMembers: true;
    orders: {
      include: {
        lab: true;
        items: true;
      };
      take: 10;
      orderBy: { createdAt: 'desc' };
    };
  };
}>;

// 2. Order types with different relation levels
export type OrderWithBasicRelations = Prisma.OrderGetPayload<{
  include: {
    lab: { select: { labName: true; city: true; contactNo: true } };
    items: { take: 5 };
  };
}>;

export type OrderWithFullRelations = Prisma.OrderGetPayload<{
  include: {
    lab: true;
    address: true;
    items: true;
    reports: true;
    reportSummary: true;
    customer: { select: { id: true; name: true; email: true } };
    technician: { select: { id: true; name: true; phone: true } };
    coupon: { select: { id: true; code: true; discountValue: true } };
    package: { select: { id: true; packageName: true; isPreEmployment: true } };
  };
}>;

// 3. Lab types
export type LabWithRelations = Prisma.LabGetPayload<{
  include: {
    tests: { include: { test: true } };
    packages: { include: { package: true } };
    pincodes: true;
  };
}>;

// 4. Dashboard specific types
export type DashboardStatsQuery = {
  totalOrders: bigint;
  pendingOrders: bigint;
  homeCollection: bigint;
  familyMembers: bigint;
};

// ===================== PRISMA INCLUDE PATTERNS =====================

// Reusable include patterns for consistent queries
export const orderIncludes = {
  basic: {
    lab: {
      select: {
        labName: true,
        city: true,
        contactNo: true
      }
    },
    items: {
      take: 3,
      select: {
        id: true,
        itemName: true,
        itemType: true,
        price: true
      }
    }
  } as const,
  
  full: {
    lab: true,
    address: true,
    items: true,
    reports: {
      select: {
        id: true,
        reportType: true,
        createdAt: true
      }
    },
    reportSummary: true,
    customer: {
      select: {
        id: true,
        name: true,
        email: true,
        phone: true
      }
    },
    technician: {
      select: {
        id: true,
        name: true,
        phone: true
      }
    },
    coupon: {
      select: {
        id: true,
        code: true,
        discountValue: true
      }
    },
    package: {
      select: {
        id: true,
        packageName: true,
        isPreEmployment: true
      }
    }
  } as const
};

export const customerIncludes = {
  basic: {
    addresses: true,
    familyMembers: {
      take: 5,
      orderBy: { createdAt: 'desc' }
    }
  } as const,
  
  full: {
    addresses: true,
    familyMembers: true,
    orders: {
      take: 10,
      include: orderIncludes.basic,
      orderBy: { createdAt: 'desc' }
    },
    assignedPackages: {
      include: {
        package: {
          select: {
            packageName: true,
            price: true
          }
        }
      }
    }
  } as const
};

// ===================== API RESPONSE HELPERS =====================

export function createSuccessResponse<T>(
  data: T, 
  message?: string, 
  meta?: Record<string, any>
): ApiResponse<T> {
  return {
    success: true,
    data,
    ...(message && { message }),
    ...(meta && { meta })
  };
}

export function createErrorResponse(
  message: string, 
  errors?: Record<string, string[]>,
  code?: string
): ApiResponse {
  return {
    success: false,
    message,
    ...(errors && { errors }),
    ...(code && { code })
  };
}

// ===================== PRISMA UTILITIES =====================

export function toJSON<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}

export function safeParseJSON<T>(jsonString: string | null, fallback: T): T {
  try {
    return jsonString ? JSON.parse(jsonString) : fallback;
  } catch {
    return fallback;
  }
}

// Type guard for Prisma errors
export function isPrismaError(error: any): error is Prisma.PrismaClientKnownRequestError {
  return error instanceof Prisma.PrismaClientKnownRequestError;
}

export function handlePrismaError(error: any): { message: string; code?: string } {
  if (isPrismaError(error)) {
    switch (error.code) {
      case 'P2002':
        return { message: 'Duplicate entry found', code: 'DUPLICATE_ENTRY' };
      case 'P2025':
        return { message: 'Record not found', code: 'NOT_FOUND' };
      case 'P2003':
        return { message: 'Foreign key constraint failed', code: 'FOREIGN_KEY_FAILED' };
      default:
        return { message: 'Database error occurred', code: 'DATABASE_ERROR' };
    }
  }
  return { message: error.message || 'An error occurred' };
}
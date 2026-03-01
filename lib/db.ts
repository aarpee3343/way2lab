// lib/db.ts
import { PrismaClient, Prisma, OrderStatus } from '@prisma/client';
import type { 
  Customer, Order, Lab, FamilyMember, CustomerAddress,
  DashboardStats, DashboardResponse, ApiResponse 
} from './types/dashboard';

// ===================== PRISMA CLIENT SETUP =====================
const globalForPrisma = global as unknown as { prisma: PrismaClient };

const withIstTimezone = (url?: string) => {
  if (!url) return undefined;
  try {
    const parsed = new URL(url);
    // Ensure every PostgreSQL session uses IST for timestamp evaluation/storage.
    const existingOptions = parsed.searchParams.get('options');
    if (!existingOptions) {
      parsed.searchParams.set('options', '-c TimeZone=Asia/Kolkata');
    } else if (!/timezone\s*=\s*asia\/kolkata/i.test(existingOptions)) {
      parsed.searchParams.set('options', `${existingOptions} -c TimeZone=Asia/Kolkata`);
    }
    return parsed.toString();
  } catch {
    return url;
  }
};

const prismaDbUrl = withIstTimezone(process.env.DATABASE_URL);

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'error', 'warn'] 
      : ['error'],
    ...(prismaDbUrl
      ? {
          datasources: {
            db: { url: prismaDbUrl }
          }
        }
      : {})
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// ===================== TYPE HELPERS =====================
export type { Prisma } from '@prisma/client';

// Re-export common types
export type { Customer, Order, Lab, FamilyMember, CustomerAddress };

// ===================== INCLUDE PATTERNS =====================
export const orderIncludes = {
  basic: {
    lab: {
      select: {
        id: true,
        labName: true,
        city: true,
        contactNo: true,
      } as const,
    },
    items: {
      select: {
        id: true,
        itemName: true,
        itemType: true,
        price: true,
        discount: true,
      } as const,
      take: 3,
    },
  } as const,

  full: {
    lab: {
      select: {
        id: true,
        labName: true,
        city: true,
        address: true,
        contactNo: true,
        email: true,
        homeCollectionCharges: true,
      } as const,
    },
    address: true,
    items: true,
    reports: {
      select: {
        id: true,
        reportType: true,
        createdAt: true,
      } as const,
    },
    reportSummary: true,
    customer: {
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
      } as const,
    },
    technician: {
      select: {
        id: true,
        name: true,
        phone: true,
      } as const,
    },
    coupon: {
      select: {
        id: true,
        code: true,
        discountValue: true,
      } as const,
    },
    package: {
      select: {
        id: true,
        packageName: true,
        isPreEmployment: true,
      } as const,
    },
  } as const,
};

export const customerIncludes = {
  basic: {
    addresses: true,
    familyMembers: {
      take: 5,
      orderBy: { createdAt: 'desc' } as const,
    },
  } as const,

  withOrders: {
    addresses: true,
    familyMembers: true,
    orders: {
      take: 10,
      orderBy: { createdAt: 'desc' } as const,
      include: orderIncludes.basic,
    },
  } as const,
};

// ===================== API RESPONSE HELPERS =====================
export function successResponse<T>(data: T, message?: string): ApiResponse<T> {
  return {
    success: true,
    data,
    ...(message && { message }),
  };
}

export function errorResponse(
  message: string, 
  errors?: Record<string, string[]>,
  code?: string
): ApiResponse {
  return {
    success: false,
    message,
    ...(errors && { errors }),
    ...(code && { code }),
  };
}

// ===================== PRISMA ERROR HANDLING =====================
export function isPrismaError(error: unknown): error is Prisma.PrismaClientKnownRequestError {
  return error instanceof Prisma.PrismaClientKnownRequestError;
}

export function handlePrismaError(error: unknown): { 
  message: string; 
  code?: string; 
  statusCode?: number;
} {
  if (isPrismaError(error)) {
    switch (error.code) {
      case 'P2002':
        return { 
          message: 'A record with this value already exists.', 
          code: 'DUPLICATE_ENTRY',
          statusCode: 409
        };
      case 'P2025':
        return { 
          message: 'Record not found.', 
          code: 'NOT_FOUND',
          statusCode: 404
        };
      case 'P2003':
        return { 
          message: 'Foreign key constraint failed.', 
          code: 'FOREIGN_KEY_FAILED',
          statusCode: 400
        };
      default:
        return { 
          message: 'Database error occurred.', 
          code: 'DATABASE_ERROR',
          statusCode: 500
        };
    }
  }

  if (error instanceof Error) {
    return { message: error.message };
  }

  return { message: 'An unexpected error occurred.' };
}

// ===================== DATABASE SERVICE CLASS =====================
export class DBService {
  // Safe query execution
  static async safeQuery<T>(
    queryFn: () => Promise<T>
  ): Promise<{ data: T | null; error: any | null }> {
    try {
      const data = await queryFn();
      return { data, error: null };
    } catch (error) {
      console.error('Database query error:', error);
      return { data: null, error };
    }
  }

  // Transaction wrapper
  static async transaction<T>(
    queries: (tx: Prisma.TransactionClient) => Promise<T>,
    options?: { timeout?: number; maxWait?: number }
  ): Promise<T> {
    return await prisma.$transaction(queries, options);
  }

  // Pagination helper
  static async paginate<T>(
    model: keyof typeof prisma,
    where: any = {},
    options: {
      page?: number;
      limit?: number;
      orderBy?: any;
      include?: any;
      select?: any;
    } = {}
  ): Promise<{ data: T[]; total: number; page: number; pages: number }> {
    const page = options.page || 1;
    const limit = options.limit || 10;
    const skip = (page - 1) * limit;
    const orderBy = options.orderBy || { id: 'desc' };

    const [data, total] = await Promise.all([
      // @ts-ignore - Dynamic model access
      prisma[model].findMany({
        where,
        skip,
        take: limit,
        orderBy,
        ...(options.include && { include: options.include }),
        ...(options.select && { select: options.select }),
      }),
      // @ts-ignore - Dynamic model access
      prisma[model].count({ where }),
    ]);

    return {
      data: data as T[],
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }
}

// ===================== SPECIFIC DATABASE OPERATIONS =====================
// These match your actual API needs

export const db = {
  // Dashboard operations
  dashboard: {
    getStats: async (userId: number): Promise<DashboardStats> => {
      const [stats, familyCount] = await Promise.all([
        // Raw SQL for better performance
        prisma.$queryRaw<Array<{
          total_orders: bigint;
          pending_orders: bigint;
          home_collection: bigint;
        }>>`
          SELECT 
            COUNT(*) as total_orders,
            COUNT(CASE WHEN status = 'PENDING' THEN 1 END) as pending_orders,
            COUNT(CASE WHEN collection_type = 'home_collection' THEN 1 END) as home_collection
          FROM orders 
          WHERE user_id = ${userId}
        `,
        prisma.familyMember.count({ where: { customerId: userId } }),
      ]);

      const statsRow = stats[0];

      return {
        totalOrders: Number(statsRow?.total_orders || 0),
        pendingOrders: Number(statsRow?.pending_orders || 0),
        homeCollection: Number(statsRow?.home_collection || 0),
        familyMembers: familyCount,
      };
    },

    getRecentOrders: async (userId: number, limit: number = 5) => {
      return await prisma.order.findMany({
        where: { userId },
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: orderIncludes.basic,
      });
    },

    getLatestCompletedOrder: async (userId: number) => {
      return await prisma.order.findFirst({
        where: { 
          userId, 
          status: 'COMPLETED',
          reports: { some: {} } // Has at least one report
        },
        orderBy: { createdAt: 'desc' },
        include: {
          lab: {
            select: {
              labName: true,
              city: true,
            },
          },
          reportSummary: true,
          items: {
            take: 3,
          },
        },
      });
    },

    getRecentFamilyMembers: async (userId: number, limit: number = 3) => {
      return await prisma.familyMember.findMany({
        where: { customerId: userId },
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          relationship: true,
          gender: true,
          dateOfBirth: true,
        },
      });
    },
  },

  // Customer operations
  customers: {
    findById: async (id: number) => {
      return await prisma.customer.findUnique({
        where: { id },
        include: customerIncludes.basic,
      });
    },

    findByEmail: async (email: string) => {
      return await prisma.customer.findUnique({
        where: { email },
        include: customerIncludes.basic,
      });
    },

    updateProfile: async (id: number, data: Partial<Customer>) => {
      return await prisma.customer.update({
        where: { id },
        data: {
          name: data.name,
          email: data.email,
          phone: data.phone,
          gender: data.gender,
          dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
        },
      });
    },
  },

  // Order operations
  orders: {
    findById: async (id: number) => {
      return await prisma.order.findUnique({
        where: { id },
        include: orderIncludes.full,
      });
    },

    findByOrderNumber: async (orderNumber: string) => {
      return await prisma.order.findUnique({
        where: { orderNumber },
        include: orderIncludes.full,
      });
    },

    findByUser: async (
      userId: number, 
      options: { 
        page?: number; 
        limit?: number; 
        status?: string;
      } = {}
    ) => {
      const page = options.page || 1;
      const limit = options.limit || 10;
      const skip = (page - 1) * limit;

      const where: any = { userId };
      if (options.status && options.status !== 'ALL') {
        where.status = options.status;
      }

      const [orders, total] = await Promise.all([
        prisma.order.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: orderIncludes.basic,
        }),
        prisma.order.count({ where }),
      ]);

      return {
        orders,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      };
    },

    updateStatus: async (id: number, status: OrderStatus) => {
      return await prisma.order.update({
        where: { id },
        data: { status },
      });
    },

    reschedule: async (
      id: number, 
      data: { 
        preferredDate: Date; 
        preferredTimeSlot: string;
        collectionType?: string;
      }
    ) => {
      return await prisma.order.update({
        where: { id },
        data: {
          preferredDate: data.preferredDate,
          preferredTimeSlot: data.preferredTimeSlot,
          collectionType: data.collectionType,
        },
      });
    },
  },

  // Family members operations
  family: {
    list: async (customerId: number) => {
      return await prisma.familyMember.findMany({
        where: { customerId },
        orderBy: { createdAt: 'desc' },
      });
    },

    create: async (
      customerId: number, 
      data: {
        name: string;
        relationship: string;
        gender?: string;
        dateOfBirth?: Date;
        phone?: string;
        email?: string;
      }
    ) => {
      const { generateFamilyUHID } = await import('./utils/generators');
      const uhid = await generateFamilyUHID();

      return await prisma.familyMember.create({
        data: {
          customerId,
          uhid,
          name: data.name,
          relationship: data.relationship,
          gender: data.gender,
          dateOfBirth: data.dateOfBirth,
          phone: data.phone,
          email: data.email,
        },
      });
    },

    update: async (id: number, customerId: number, data: Partial<FamilyMember>) => {
      return await prisma.familyMember.update({
        where: { id, customerId },
        data: {
          name: data.name,
          relationship: data.relationship,
          gender: data.gender,
          dateOfBirth: data.dateOfBirth,
          phone: data.phone,
          email: data.email,
        },
      });
    },

    delete: async (id: number, customerId: number) => {
      return await prisma.familyMember.delete({
        where: { id, customerId },
      });
    },
  },

  // Address operations
  addresses: {
    list: async (customerId: number) => {
      return await prisma.customerAddress.findMany({
        where: { customerId },
        orderBy: { id: 'desc' },
      });
    },

    create: async (
      customerId: number, 
      data: {
        addressLine1: string;
        addressLine2?: string;
        city: string;
        state: string;
        pincode: string;
        type?: string;
      }
    ) => {
      return await prisma.customerAddress.create({
        data: {
          customerId,
          addressLine1: data.addressLine1,
          addressLine2: data.addressLine2,
          city: data.city,
          state: data.state,
          pincode: data.pincode,
          type: data.type || 'Home',
        },
      });
    },

    update: async (id: number, customerId: number, data: Partial<CustomerAddress>) => {
      return await prisma.customerAddress.update({
        where: { id, customerId },
        data: {
          addressLine1: data.addressLine1,
          addressLine2: data.addressLine2,
          city: data.city,
          state: data.state,
          pincode: data.pincode,
          type: data.type,
        },
      });
    },

    delete: async (id: number, customerId: number) => {
      return await prisma.customerAddress.delete({
        where: { id, customerId },
      });
    },
  },

  // Report operations
  reports: {
    list: async (userId: number) => {
      return await prisma.order.findMany({
        where: { 
          userId, 
          status: 'COMPLETED',
          reports: { some: {} } // Has reports
        },
        orderBy: { createdAt: 'desc' },
        include: {
          lab: {
            select: {
              labName: true,
              city: true,
            },
          },
          reports: {
            select: {
              id: true,
              reportType: true,
              createdAt: true,
            },
          },
        },
      });
    },

    findById: async (reportId: number, userId: number) => {
      return await prisma.orderReport.findFirst({
        where: {
          id: reportId,
          order: {
            userId,
          },
        },
        include: {
          order: {
            include: {
              lab: true,
              customer: true,
            },
          },
        },
      });
    },
  },
};

// ===================== EXPORT ALL UTILITIES =====================
// For backward compatibility
export default prisma;

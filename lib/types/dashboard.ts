import { Prisma } from '@prisma/client';

// ==========================================
// 1. AUTOMATED PRISMA TYPES
// ==========================================

// Basic types (Raw table data)
export type Customer = Prisma.CustomerGetPayload<{}>;
export type Lab = Prisma.LabGetPayload<{}>;
export type FamilyMember = Prisma.FamilyMemberGetPayload<{}>;
export type CustomerAddress = Prisma.CustomerAddressGetPayload<{}>;
export type Package = Prisma.PackageGetPayload<{}>;
export type Coupon = Prisma.CouponGetPayload<{}>;
export type Technician = Prisma.TechnicianGetPayload<{}>;

// Complex types (With Relationships included)
// These match the 'include' patterns in your lib/db.ts

export type Order = Prisma.OrderGetPayload<{
  include: {
    lab: { select: { labName: true; city: true; contactNo: true } };
    items: { select: { id: true; itemName: true; itemType: true; price: true; discount: true } };
    // Add other relations here if your queries fetch them
  }
}>;

export type OrderWithFullDetails = Prisma.OrderGetPayload<{
  include: {
    lab: true;
    address: true;
    items: true;
    reports: true;
    reportSummary: true;
    customer: true;
  }
}>;

// ==========================================
// 2. CUSTOM API INTERFACES (Keep these)
// ==========================================

export type Role =
  | 'USER'
  | 'ADMIN'
  | 'LAB'
  | 'TECHNICIAN'
  | 'CORP_ADMIN'
  | 'CORP_SUB_ADMIN';

export type CorporateRole = 'SUPER_ADMIN' | 'DEPT_HEAD' | 'LOCATION_MANAGER';

export interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  homeCollection: number;
  familyMembers: number;
}

export interface DashboardResponse {
  stats: DashboardStats;
  recentOrders: Order[];
  latestCompletedOrder?: Order | null;
  members: FamilyMember[];
  user?: {
    name?: string | null;
    email?: string | null;
    avatar?: string | null;
    phone?: string | null;
    uhid?: string | null;
    gender?: string | null;
    dateOfBirth?: Date | string | null;
    createdAt?: Date | string | null;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

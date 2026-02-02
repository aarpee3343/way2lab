// app/api/user/dashboard/route.ts
import { NextResponse } from 'next/server';
import { db, successResponse } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { handleApiError, AuthError, AppError } from '@/lib/utils/error-handling';
import type { DashboardResponse } from '@/lib/types/dashboard';

export const dynamic = 'force-dynamic';
export const maxDuration = 30; // 30 seconds max
export const runtime = 'nodejs';

// Cache control headers
const CACHE_HEADERS = {
  'Cache-Control': 'private, no-cache, no-store, must-revalidate',
  'CDN-Cache-Control': 'no-cache',
  'Vercel-CDN-Cache-Control': 'no-cache',
};

export async function GET(req: Request) {
  try {
    // Authentication
    const user = await getAuthUser(req);
    if (!user) {
      throw new AuthError();
    }

    // Validate user
    if (!user.id || !user.email) {
      throw new AppError('Invalid user data', 'INVALID_USER', 400);
    }

    // Fetch dashboard data in parallel with timeout
    const dashboardPromise = Promise.all([
      db.dashboard.getStats(user.id),
      db.dashboard.getRecentOrders(user.id, 5),
      db.dashboard.getLatestCompletedOrder(user.id),
      db.dashboard.getRecentFamilyMembers(user.id, 3),
    ]);

    // Add timeout to prevent hanging requests
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new AppError('Request timeout', 'TIMEOUT', 408)), 10000);
    });

    const [stats, recentOrders, latestCompletedOrder, members] = 
      await Promise.race([dashboardPromise, timeoutPromise]) as any[];

    // Validate response
    if (!stats || !recentOrders) {
      throw new AppError('Failed to fetch dashboard data', 'DASHBOARD_FETCH_ERROR', 500);
    }

    const response: DashboardResponse = {
      stats,
      recentOrders,
      latestCompletedOrder,
      members,
      user: {
        name: user.name,
        email: user.email,
      },
    };

    // Return successful response
    return NextResponse.json(successResponse(response), {
      status: 200,
      headers: CACHE_HEADERS,
    });

  } catch (error: any) {
    // Handle known errors
    const { message, code, statusCode, ...rest } = handleApiError(error);
    
    // Log full error in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Dashboard API Error Details:', {
        error,
        message,
        code,
        statusCode,
        ...rest,
      });
    }

    return NextResponse.json(
      {
        success: false,
        message,
        code,
        ...rest,
      },
      {
        status: statusCode || 500,
        headers: CACHE_HEADERS,
      }
    );
  }
}
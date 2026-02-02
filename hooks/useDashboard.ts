import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { toast } from '@/lib/safe-toast';
import type { DashboardResponse, ApiResponse } from '@/lib/types/dashboard';

interface UseDashboardOptions {
  autoFetch?: boolean;
  refetchInterval?: number;
}

/* ======================================================
   DASHBOARD HOOK
====================================================== */

export function useDashboard(options: UseDashboardOptions = {}) {
  const { autoFetch = true, refetchInterval } = options;

  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(autoFetch);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async (isRefresh = false) => {
    // Abort previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    if (!isRefresh) setLoading(true);
    setRefreshing(true);

    try {
      const response = await axios.get<ApiResponse<DashboardResponse>>(
        '/api/user/dashboard',
        {
          withCredentials: true, // ✅ HttpOnly cookie auth
          headers: {
            'Cache-Control': 'no-cache',
          },
          timeout: 10000,
          signal: abortControllerRef.current.signal,
        }
      );

      if (response.data.success && response.data.data) {
        setData(response.data.data);
        setError(null);

        if (isRefresh) {
          toast.success('Dashboard refreshed');
        }
      } else {
        throw new Error(response.data.message || 'Failed to load dashboard');
      }
    } catch (err: any) {
      if (err.name === 'AbortError' || err.name === 'CanceledError') return;

      const message =
        err.response?.data?.message || err.message || 'Network error';

      setError(message);

      // Auth error → redirect
      if (err.response?.status === 401) {
        window.location.href = '/login';
        return;
      }

      if (!isRefresh) {
        toast.error(message);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
      abortControllerRef.current = null;
    }
  }, []);

  /* ---------- Cleanup ---------- */
  useEffect(() => {
    return () => abortControllerRef.current?.abort();
  }, []);

  /* ---------- Auto Fetch ---------- */
  useEffect(() => {
    if (autoFetch) fetchData();
  }, [fetchData, autoFetch]);

  /* ---------- Polling ---------- */
  useEffect(() => {
    if (!refetchInterval) return;

    const interval = setInterval(() => {
      fetchData(true);
    }, refetchInterval);

    return () => clearInterval(interval);
  }, [fetchData, refetchInterval]);

  const refresh = useCallback(() => {
    fetchData(true);
  }, [fetchData]);

  return {
    // Data
    data,
    stats: data?.stats,
    recentOrders: data?.recentOrders || [],
    latestOrder: data?.latestCompletedOrder,
    familyMembers: data?.members || [],
    user: data?.user,

    // State
    loading,
    error,
    refreshing,

    // Actions
    refresh,
    refetch: refresh,

    // Helpers
    hasData: !!data,
    isEmpty:
      !!data &&
      data.recentOrders.length === 0 &&
      !data.latestCompletedOrder &&
      data.members.length === 0,
  };
}

/* ======================================================
   ORDERS HOOK (PAGINATION)
====================================================== */

export function useOrders(options: {
  page?: number;
  limit?: number;
  status?: string;
  enabled?: boolean;
} = {}) {
  const { page = 1, limit = 10, status, enabled = true } = options;

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page,
    limit,
    total: 0,
    pages: 0,
  });

  const fetchOrders = useCallback(
    async (pageNum: number, reset = false) => {
      if (!enabled) return;

      setLoading(true);

      try {
        const params = new URLSearchParams({
          page: pageNum.toString(),
          limit: limit.toString(),
          ...(status && status !== 'ALL' && { status }),
        });

        const response = await axios.get(`/api/orders?${params}`, {
          withCredentials: true, // ✅ cookie auth
        });

        if (response.data.success) {
          const newOrders = response.data.data || [];

          setOrders(prev =>
            reset || pageNum === 1 ? newOrders : [...prev, ...newOrders]
          );

          if (response.data.pagination) {
            setPagination(response.data.pagination);
          }

          setError(null);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load orders');

        if (err.response?.status === 401) {
          window.location.href = '/login';
          return;
        }

        toast.error('Failed to load orders');
      } finally {
        setLoading(false);
      }
    },
    [limit, status, enabled]
  );

  useEffect(() => {
    if (enabled) fetchOrders(1, true);
  }, [fetchOrders, enabled]);

  const loadMore = useCallback(() => {
    if (pagination.page >= pagination.pages || loading) return;
    fetchOrders(pagination.page + 1);
  }, [pagination, loading, fetchOrders]);

  const refresh = useCallback(() => {
    fetchOrders(1, true);
  }, [fetchOrders]);

  return {
    orders,
    loading,
    error,
    pagination,
    hasMore: pagination.page < pagination.pages,
    loadMore,
    refresh,
    refetch: refresh,
  };
}

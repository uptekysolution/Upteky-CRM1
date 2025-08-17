'use client';

import { useState, useEffect, useCallback } from 'react';
import { analyticsService, DashboardMetrics } from '@/lib/analytics-service';

interface UseAnalyticsOptions {
  autoRefresh?: boolean;
  refreshInterval?: number; // in milliseconds
  enableRealTime?: boolean;
}

interface UseAnalyticsReturn {
  metrics: DashboardMetrics | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  lastUpdated: Date | null;
}

export function useAnalytics(options: UseAnalyticsOptions = {}): UseAnalyticsReturn {
  const {
    autoRefresh = true,
    refreshInterval = 3600000, // 1 hour (3600000 ms)
    enableRealTime = true
  } = options;

  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchMetrics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await analyticsService.getDashboardMetrics();
      setMetrics(data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics data');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  // Auto-refresh timer
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchMetrics();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchMetrics]);

  // Real-time subscription
  useEffect(() => {
    if (!enableRealTime) return;

    const unsubscribe = analyticsService.subscribeToDashboardMetrics((data) => {
      setMetrics(data);
      setLastUpdated(new Date());
      setError(null);
    });

    return () => unsubscribe();
  }, [enableRealTime]);

  const refresh = useCallback(async () => {
    await fetchMetrics();
  }, [fetchMetrics]);

  return {
    metrics,
    loading,
    error,
    refresh,
    lastUpdated
  };
}

// Hook for specific metric types
export function useMetric<T extends keyof DashboardMetrics>(
  metricKey: T,
  options: UseAnalyticsOptions = {}
): {
  data: DashboardMetrics[T] | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
} {
  const { metrics, loading, error, refresh } = useAnalytics(options);

  return {
    data: metrics ? metrics[metricKey] : null,
    loading,
    error,
    refresh
  };
}

// Hook for attendance metrics specifically
export function useAttendanceMetrics(options: UseAnalyticsOptions = {}) {
  return useMetric('attendanceToday', options);
}

// Hook for task metrics specifically
export function useTaskMetrics(options: UseAnalyticsOptions = {}) {
  return useMetric('openTasks', options);
}

// Hook for user activity specifically
export function useUserActivity(options: UseAnalyticsOptions = {}) {
  return useMetric('userActivity', options);
}

// Hook for system health specifically
export function useSystemHealth(options: UseAnalyticsOptions = {}) {
  return useMetric('systemHealth', options);
}

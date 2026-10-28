import { useState, useEffect, useCallback } from 'react';
import { ApiResponse, HealthResponseData } from '@/types';
import { fetchHealth } from '@/services/api';

export function useHealth(autoRefreshIntervalMs: number = 10000) {
  const [data, setData] = useState<ApiResponse<HealthResponseData> | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [lastChecked, setLastChecked] = useState<Date>(new Date());

  const checkStatus = useCallback(async () => {
    setLoading(true);
    const result = await fetchHealth();
    setData(result);
    setLoading(false);
    setLastChecked(new Date());
  }, []);

  useEffect(() => {
    checkStatus();
    if (autoRefreshIntervalMs > 0) {
      const interval = setInterval(checkStatus, autoRefreshIntervalMs);
      return () => clearInterval(interval);
    }
  }, [checkStatus, autoRefreshIntervalMs]);

  return {
    healthData: data,
    isLoading: loading,
    isHealthy: data?.success === true && data.data.status === 'healthy',
    isDatabaseConnected: data?.data?.database?.connected === true,
    lastChecked,
    refresh: checkStatus,
  };
}


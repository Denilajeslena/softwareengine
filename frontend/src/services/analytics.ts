import {
  ApiResponse,
  AnalyticsOverview,
  CategoryStat,
  BorrowingTrendPoint,
  PopularBookItem,
  LowStockAlert,
  DemandForecastResponse,
} from '@/types';
import { getStoredToken } from '@/services/auth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5000/api';

function getAuthHeaders(): HeadersInit {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export async function fetchAnalyticsOverviewApi(): Promise<ApiResponse<AnalyticsOverview>> {
  try {
    const res = await fetch(`${API_BASE_URL}/analytics/overview`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return await res.json();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to connect to analytics overview API';
    return {
      success: false,
      message: msg,
      data: {
        totalBooks: 0,
        totalCopies: 0,
        availableCopies: 0,
        activeLoans: 0,
        overdueLoans: 0,
        totalReservations: 0,
        utilizationRate: 0,
        updatedAt: new Date().toISOString(),
        dataSource: 'offline_fallback',
      },
    };
  }
}

export async function fetchBorrowingTrendsApi(): Promise<ApiResponse<{ trends: BorrowingTrendPoint[]; currentPeriod: string }>> {
  try {
    const res = await fetch(`${API_BASE_URL}/analytics/trends`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return await res.json();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to connect to borrowing trends API';
    return {
      success: false,
      message: msg,
      data: {
        trends: [],
        currentPeriod: 'Fall Semester',
      },
    };
  }
}

export async function fetchCategoryStatsApi(): Promise<ApiResponse<{ categories: CategoryStat[] }>> {
  try {
    const res = await fetch(`${API_BASE_URL}/analytics/categories`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return await res.json();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to connect to category statistics API';
    return {
      success: false,
      message: msg,
      data: { categories: [] },
    };
  }
}

export async function fetchPopularBooksApi(topK: number = 5): Promise<ApiResponse<{ popularBooks: PopularBookItem[] }>> {
  try {
    const res = await fetch(`${API_BASE_URL}/analytics/popular-books?top_k=${topK}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return await res.json();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to connect to popular books API';
    return {
      success: false,
      message: msg,
      data: { popularBooks: [] },
    };
  }
}

export async function fetchLowStockAlertsApi(): Promise<ApiResponse<{ alerts: LowStockAlert[]; totalAlerts: number }>> {
  try {
    const res = await fetch(`${API_BASE_URL}/analytics/low-stock`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return await res.json();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to connect to low stock alerts API';
    return {
      success: false,
      message: msg,
      data: { alerts: [], totalAlerts: 0 },
    };
  }
}

export async function fetchDemandForecastApi(): Promise<ApiResponse<DemandForecastResponse>> {
  try {
    const res = await fetch(`${API_BASE_URL}/analytics/forecast`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return await res.json();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to connect to ML demand forecast API';
    return {
      success: false,
      message: msg,
      data: {
        modelName: 'Ridge-Local-Fallback',
        dataSufficient: false,
        historicalObservations: 0,
        forecastHorizon: '3 Months',
        evaluationMetrics: {
          mae: 0,
          rmse: 0,
          r2Score: 0,
          confidenceScore: 'Insufficient live data',
        },
        forecastSeries: [],
        procurementRecommendations: [],
        generatedAt: new Date().toISOString(),
      },
    };
  }
}


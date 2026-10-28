import { ApiResponse, HealthResponseData } from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5000/api';

export async function fetchHealth(): Promise<ApiResponse<HealthResponseData>> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000);

  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
    }

    const data: ApiResponse<HealthResponseData> = await response.json();
    return data;
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    const errorMessage = err instanceof Error ? err.message : 'Unable to connect to Flask backend service';
    return {
      success: false,
      message: errorMessage,
      data: {
        service: "The Scholar's Shelf API (Offline)",
        tagline: "Where Knowledge Finds Its Place.",
        status: 'unreachable',
        timestamp: new Date().toISOString(),
        phase: 'Part 1 of 8 — Project Foundation & UI/UX Design System',
        environment: 'offline',
        database: {
          status: 'unavailable',
          connected: false,
          database: 'scholars_shelf',
          message: 'Backend API is currently offline. Ensure `python backend/run.py` is running.',
        },
        features: {},
      },
      error: {
        code: 'NETWORK_ERROR',
        details: errorMessage,
      },
    };
  }
}


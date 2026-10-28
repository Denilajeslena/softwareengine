import { ApiResponse, Book } from '@/types';
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

export interface SemanticBookResult extends Book {
  relevanceScore?: number;
  matchExplanation?: string;
  similarityScore?: number;
  recommendationReason?: string;
  substituteReason?: string;
  personalAffinity?: number;
  affinityReason?: string;
}

export interface SemanticSearchResponse {
  results: SemanticBookResult[];
  query: string;
  totalFound: number;
  model: string;
  fallbackUsed: boolean;
}

export interface AlternativesResponse {
  targetBook: Book | null;
  targetIsAvailable: boolean;
  alternatives: SemanticBookResult[];
}

export async function semanticSearchApi(
  query: string,
  options?: {
    top_k?: number;
    category?: string;
    available_only?: boolean;
  }
): Promise<ApiResponse<SemanticSearchResponse>> {
  try {
    const res = await fetch(`${API_BASE_URL}/ai/search`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        top_k: options?.top_k || 6,
        category: options?.category,
        available_only: options?.available_only || false,
      }),
    });
    return await res.json();
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Network error during semantic search.',
      data: {
        results: [],
        query,
        totalFound: 0,
        model: 'BookMind-Offline-Fallback',
        fallbackUsed: true,
      },
      error: { code: 'NETWORK_ERROR' },
    };
  }
}

export async function fetchSimilarBooksApi(
  bookId: string,
  top_k: number = 4
): Promise<ApiResponse<{ similarBooks: SemanticBookResult[]; count: number }>> {
  try {
    const res = await fetch(`${API_BASE_URL}/ai/similar/${bookId}?top_k=${top_k}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });
    return await res.json();
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Network error loading similar books.',
      data: { similarBooks: [], count: 0 },
      error: { code: 'NETWORK_ERROR' },
    };
  }
}

export async function fetchAvailableAlternativesApi(
  bookId: string,
  top_k: number = 3
): Promise<ApiResponse<AlternativesResponse>> {
  try {
    const res = await fetch(`${API_BASE_URL}/ai/alternatives/${bookId}?top_k=${top_k}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });
    return await res.json();
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Network error loading in-stock alternatives.',
      data: { targetBook: null, targetIsAvailable: true, alternatives: [] },
      error: { code: 'NETWORK_ERROR' },
    };
  }
}

export async function fetchPersonalizedRecommendationsApi(
  top_k: number = 4
): Promise<ApiResponse<{ recommendations: SemanticBookResult[]; count: number }>> {
  try {
    const res = await fetch(`${API_BASE_URL}/ai/personalized?top_k=${top_k}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return await res.json();
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Network error loading recommendations.',
      data: { recommendations: [], count: 0 },
      error: { code: 'NETWORK_ERROR' },
    };
  }
}

export async function generateStudyAssistantApi(
  content: string,
  options?: { mode?: 'all' | 'summarize' | 'key_concepts' | 'practice_quiz'; title?: string }
): Promise<ApiResponse<import('@/types').StudyAssistantResponse>> {
  try {
    const res = await fetch(`${API_BASE_URL}/ai/study-assist`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        content,
        mode: options?.mode || 'all',
        title: options?.title,
      }),
    });
    return await res.json();
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Failed to generate study assistant materials',
      data: null as any,
    };
  }
}



import {
  ApiResponse,
  Book,
  ReadingGoalsResponse,
  BookReviewsResponse,
  BookReview,
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

// -------------------------------------------------------------
// READING LIST
// -------------------------------------------------------------

export async function fetchReadingListApi(): Promise<ApiResponse<{ books: Book[]; count: number }>> {
  try {
    const res = await fetch(`${API_BASE_URL}/student/reading-list`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return await res.json();
  } catch (err: unknown) {
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Failed to fetch reading list',
      data: { books: [], count: 0 },
    };
  }
}

export async function saveToReadingListApi(bookId: string): Promise<ApiResponse<{ bookId: string; saved: boolean }>> {
  try {
    const res = await fetch(`${API_BASE_URL}/student/reading-list`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ bookId }),
    });
    return await res.json();
  } catch (err: unknown) {
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Failed to save book to reading list',
      data: { bookId, saved: false },
    };
  }
}

export async function removeFromReadingListApi(bookId: string): Promise<ApiResponse<{ bookId: string; saved: boolean }>> {
  try {
    const res = await fetch(`${API_BASE_URL}/student/reading-list/${bookId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return await res.json();
  } catch (err: unknown) {
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Failed to remove book from reading list',
      data: { bookId, saved: false },
    };
  }
}

export async function checkReadingListApi(bookId: string): Promise<ApiResponse<{ bookId: string; isSaved: boolean }>> {
  try {
    const res = await fetch(`${API_BASE_URL}/student/reading-list/check/${bookId}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return await res.json();
  } catch (err: unknown) {
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Failed to check reading list status',
      data: { bookId, isSaved: false },
    };
  }
}

// -------------------------------------------------------------
// READING GOALS & BADGES
// -------------------------------------------------------------

export async function fetchReadingGoalsApi(): Promise<ApiResponse<ReadingGoalsResponse>> {
  try {
    const res = await fetch(`${API_BASE_URL}/student/reading-goals`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return await res.json();
  } catch (err: unknown) {
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Failed to fetch reading goals',
      data: {
        goal: {
          userId: '',
          targetBooks: 10,
          completedBooks: 4,
          academicTerm: 'Fall Semester',
          streakWeeks: 6,
          progressPercentage: 40,
          updatedAt: new Date().toISOString(),
        },
        badges: [],
        summary: { target: 10, completed: 4, activeLoans: 1, progress: 40 },
      },
    };
  }
}

export async function updateReadingGoalApi(targetBooks: number): Promise<ApiResponse<ReadingGoalsResponse>> {
  try {
    const res = await fetch(`${API_BASE_URL}/student/reading-goals`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ targetBooks }),
    });
    return await res.json();
  } catch (err: unknown) {
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Failed to update reading goal',
      data: null as any,
    };
  }
}

// -------------------------------------------------------------
// BOOK REVIEWS & RATINGS
// -------------------------------------------------------------

export async function fetchBookReviewsApi(bookId: string): Promise<ApiResponse<BookReviewsResponse>> {
  try {
    const res = await fetch(`${API_BASE_URL}/books/${bookId}/reviews`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });
    return await res.json();
  } catch (err: unknown) {
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Failed to fetch book reviews',
      data: {
        bookId,
        totalReviews: 0,
        averageRating: 0,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        reviews: [],
      },
    };
  }
}

export async function submitBookReviewApi(
  bookId: string,
  rating: number,
  reviewText: string,
  isRecommended: boolean = true
): Promise<ApiResponse<BookReview>> {
  try {
    const res = await fetch(`${API_BASE_URL}/books/${bookId}/reviews`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ rating, reviewText, isRecommended }),
    });
    return await res.json();
  } catch (err: unknown) {
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Failed to submit review',
      data: null as any,
    };
  }
}


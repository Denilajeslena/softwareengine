import { ApiResponse, Book, BookCopy } from '@/types';
import { getStoredToken } from '@/services/auth';

export type BookDetailResponse = Book;

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

export async function fetchBooksApi(params?: {
  search?: string;
  category?: string;
  available?: boolean;
  sort_by?: string;
  include_archived?: boolean;
}): Promise<ApiResponse<{ books: Book[]; count: number }>> {
  try {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.category && params.category !== 'All Categories') query.set('category', params.category);
    if (params?.available) query.set('available', 'true');
    if (params?.sort_by) query.set('sort_by', params.sort_by);
    if (params?.include_archived) query.set('include_archived', 'true');

    const qs = query.toString();
    const url = `${API_BASE_URL}/books${qs ? `?${qs}` : ''}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });

    const data = await response.json();
    return data;
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Failed to retrieve catalogue books.',
      data: { books: [], count: 0 },
      error: { code: 'NETWORK_ERROR' },
    };
  }
}

export async function fetchBookByIdApi(bookId: string): Promise<ApiResponse<{ book: Book }>> {
  try {
    const response = await fetch(`${API_BASE_URL}/books/${bookId}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });

    const data = await response.json();
    return data;
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Failed to retrieve book details.',
      data: { book: {} as Book },
      error: { code: 'NETWORK_ERROR' },
    };
  }
}

export async function createBookApi(bookData: Partial<Book>): Promise<ApiResponse<{ book: Book }>> {
  try {
    const response = await fetch(`${API_BASE_URL}/books`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(bookData),
    });

    const data = await response.json();
    return data;
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Failed to catalogue new book.',
      data: { book: {} as Book },
      error: { code: 'NETWORK_ERROR' },
    };
  }
}

export async function updateBookApi(bookId: string, bookData: Partial<Book>): Promise<ApiResponse<{ book: Book }>> {
  try {
    const response = await fetch(`${API_BASE_URL}/books/${bookId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(bookData),
    });

    const data = await response.json();
    return data;
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Failed to update book records.',
      data: { book: {} as Book },
      error: { code: 'NETWORK_ERROR' },
    };
  }
}

export async function archiveBookApi(bookId: string): Promise<ApiResponse<{ book: Book }>> {
  try {
    const response = await fetch(`${API_BASE_URL}/books/${bookId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    const data = await response.json();
    return data;
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Failed to archive book.',
      data: { book: {} as Book },
      error: { code: 'NETWORK_ERROR' },
    };
  }
}

export async function addCopyApi(bookId: string, copyData?: { copyId?: string; shelfLocation?: string }): Promise<ApiResponse<{ copy: BookCopy }>> {
  try {
    const response = await fetch(`${API_BASE_URL}/books/${bookId}/copies`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(copyData || {}),
    });

    const data = await response.json();
    return data;
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Failed to add copy.',
      data: { copy: {} as BookCopy },
      error: { code: 'NETWORK_ERROR' },
    };
  }
}

export async function removeCopyApi(bookId: string, copyId: string): Promise<ApiResponse<{ removedCopy: BookCopy }>> {
  try {
    const response = await fetch(`${API_BASE_URL}/books/${bookId}/copies/${copyId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    const data = await response.json();
    return data;
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Failed to remove copy.',
      data: { removedCopy: {} as BookCopy },
      error: { code: 'NETWORK_ERROR' },
    };
  }
}

export async function fetchBookQrApi(bookId: string): Promise<ApiResponse<{ qrDataUrl: string; payload: string; bookId: string }>> {
  try {
    const response = await fetch(`${API_BASE_URL}/books/${bookId}/qr`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });

    const data = await response.json();
    return data;
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Failed to generate QR code.',
      data: { qrDataUrl: '', payload: '', bookId },
      error: { code: 'NETWORK_ERROR' },
    };
  }
}

export async function fetchCopyQrApi(copyId: string): Promise<ApiResponse<{ qrDataUrl: string; barcode: string; copyId: string; book: Book; copy: BookCopy }>> {
  try {
    const response = await fetch(`${API_BASE_URL}/books/copies/${copyId}/qr`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });

    const data = await response.json();
    return data;
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Failed to generate copy QR code.',
      data: {} as { qrDataUrl: string; barcode: string; copyId: string; book: Book; copy: BookCopy },
      error: { code: 'NETWORK_ERROR' },
    };
  }
}

export async function scanCodeApi(code: string): Promise<ApiResponse<{ type: string; book: Book; matchedCopy: BookCopy }>> {
  try {
    const response = await fetch(`${API_BASE_URL}/books/scan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ code }),
    });

    const data = await response.json();
    return data;
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Failed to scan barcode.',
      data: {} as { type: string; book: Book; matchedCopy: BookCopy },
      error: { code: 'NETWORK_ERROR' },
    };
  }
}

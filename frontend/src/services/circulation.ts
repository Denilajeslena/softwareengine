import { ApiResponse, BorrowRecord, Reservation } from '@/types';
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

export interface StudentLoansSummary {
  activeLoans: BorrowRecord[];
  history: BorrowRecord[];
  pendingRequests: BorrowRecord[];
  activeCount: number;
  totalCount: number;
  totalFines: number;
  remainingAllowance: number;
  maxAllowance: number;
}

// -------------------------------------------------------------
// STUDENT CIRCULATION CALLS
// -------------------------------------------------------------

export async function fetchMyLoansApi(): Promise<ApiResponse<StudentLoansSummary>> {
  try {
    const res = await fetch(`${API_BASE_URL}/loans/my-loans`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return await res.json();
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Network error loading borrowed books.',
      data: {
        activeLoans: [],
        history: [],
        pendingRequests: [],
        activeCount: 0,
        totalCount: 0,
        totalFines: 0,
        remainingAllowance: 5,
        maxAllowance: 5,
      },
      error: { code: 'NETWORK_ERROR' },
    };
  }
}

export async function requestLoanApi(bookId: string, copyId?: string): Promise<ApiResponse<{ loan: BorrowRecord }>> {
  try {
    const res = await fetch(`${API_BASE_URL}/loans/request`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ bookId, copyId }),
    });
    return await res.json();
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Network error requesting book checkout.',
      data: {} as { loan: BorrowRecord },
      error: { code: 'NETWORK_ERROR' },
    };
  }
}

export async function renewLoanApi(loanId: string): Promise<ApiResponse<{ loan: BorrowRecord }>> {
  try {
    const res = await fetch(`${API_BASE_URL}/loans/${loanId}/renew`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return await res.json();
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Network error renewing volume loan.',
      data: {} as { loan: BorrowRecord },
      error: { code: 'NETWORK_ERROR' },
    };
  }
}

export async function fetchMyReservationsApi(): Promise<ApiResponse<{ reservations: Reservation[]; count: number }>> {
  try {
    const res = await fetch(`${API_BASE_URL}/loans/reservations/my-reservations`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return await res.json();
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Network error loading reservations.',
      data: { reservations: [], count: 0 },
      error: { code: 'NETWORK_ERROR' },
    };
  }
}

export async function placeReservationApi(bookId: string): Promise<ApiResponse<{ reservation: Reservation }>> {
  try {
    const res = await fetch(`${API_BASE_URL}/loans/reservations`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ bookId }),
    });
    return await res.json();
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Network error placing reservation.',
      data: {} as { reservation: Reservation },
      error: { code: 'NETWORK_ERROR' },
    };
  }
}

export async function cancelReservationApi(reservationId: string): Promise<ApiResponse<{ reservation: Reservation }>> {
  try {
    const res = await fetch(`${API_BASE_URL}/loans/reservations/${reservationId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return await res.json();
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Network error cancelling reservation.',
      data: {} as { reservation: Reservation },
      error: { code: 'NETWORK_ERROR' },
    };
  }
}

// -------------------------------------------------------------
// LIBRARIAN CIRCULATION CALLS
// -------------------------------------------------------------

export async function fetchAllLoansApi(params?: {
  status?: string;
  userId?: string;
  bookId?: string;
}): Promise<ApiResponse<{ loans: BorrowRecord[]; count: number }>> {
  try {
    const query = new URLSearchParams();
    if (params?.status && params.status !== 'all') query.set('status', params.status);
    if (params?.userId) query.set('userId', params.userId);
    if (params?.bookId) query.set('bookId', params.bookId);

    const qs = query.toString();
    const url = `${API_BASE_URL}/loans${qs ? `?${qs}` : ''}`;

    const res = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return await res.json();
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Network error loading circulation records.',
      data: { loans: [], count: 0 },
      error: { code: 'NETWORK_ERROR' },
    };
  }
}

export async function issueBookApi(data: {
  studentIdentifier: string;
  bookId: string;
  copyId?: string;
  durationDays?: number;
}): Promise<ApiResponse<{ loan: BorrowRecord }>> {
  try {
    const res = await fetch(`${API_BASE_URL}/loans/issue`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return await res.json();
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Network error issuing volume.',
      data: {} as { loan: BorrowRecord },
      error: { code: 'NETWORK_ERROR' },
    };
  }
}

export async function returnBookApi(loanId: string): Promise<ApiResponse<{ loan: BorrowRecord; notification?: string }>> {
  try {
    const res = await fetch(`${API_BASE_URL}/loans/${loanId}/return`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return await res.json();
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Network error processing return.',
      data: {} as { loan: BorrowRecord },
      error: { code: 'NETWORK_ERROR' },
    };
  }
}

export async function fetchOverdueLoansApi(): Promise<ApiResponse<{ loans: BorrowRecord[]; count: number; totalFines: number }>> {
  try {
    const res = await fetch(`${API_BASE_URL}/loans/overdue`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return await res.json();
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Network error loading overdue loans.',
      data: { loans: [], count: 0, totalFines: 0 },
      error: { code: 'NETWORK_ERROR' },
    };
  }
}

export async function fetchAllReservationsApi(): Promise<ApiResponse<{ reservations: Reservation[]; count: number }>> {
  try {
    const res = await fetch(`${API_BASE_URL}/loans/reservations`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return await res.json();
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Network error loading reservations queue.',
      data: { reservations: [], count: 0 },
      error: { code: 'NETWORK_ERROR' },
    };
  }
}

export interface LibrarianStudentSummary {
  userId: string;
  name: string;
  email: string;
  role: string;
  department: string;
  studentId: string;
  standing: string;
  status: string;
  enrolledDate: string;
  activeLoans: number;
  overdueLoans: number;
  totalFines: number;
}

export async function fetchLibrarianStudentsApi(search?: string): Promise<
  ApiResponse<{ students: LibrarianStudentSummary[]; count: number }>
> {
  try {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    const res = await fetch(`${API_BASE_URL}/librarian/students${query}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return await res.json();
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Failed to retrieve students directory.',
      data: { students: [], count: 0 },
      error: { code: 'NETWORK_ERROR' },
    };
  }
}



import { ApiResponse, NotificationItem } from '@/types';
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

export async function fetchNotificationsApi(): Promise<
  ApiResponse<{ notifications: NotificationItem[]; total: number; unreadCount: number }>
> {
  try {
    const res = await fetch(`${API_BASE_URL}/notifications`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return await res.json();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch notifications';
    return {
      success: false,
      message: msg,
      data: { notifications: [], total: 0, unreadCount: 0 },
    };
  }
}

export async function markNotificationReadApi(notificationId: string): Promise<ApiResponse<null>> {
  try {
    const res = await fetch(`${API_BASE_URL}/notifications/${notificationId}/read`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
    });
    return await res.json();
  } catch (err: unknown) {
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Failed to mark notification read',
      data: null as any,
    };
  }
}

export async function markAllNotificationsReadApi(): Promise<ApiResponse<{ modifiedCount: number }>> {
  try {
    const res = await fetch(`${API_BASE_URL}/notifications/mark-all-read`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return await res.json();
  } catch (err: unknown) {
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Failed to mark all notifications read',
      data: { modifiedCount: 0 },
    };
  }
}

export async function dismissNotificationApi(notificationId: string): Promise<ApiResponse<null>> {
  try {
    const res = await fetch(`${API_BASE_URL}/notifications/${notificationId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return await res.json();
  } catch (err: unknown) {
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Failed to dismiss notification',
      data: null as any,
    };
  }
}


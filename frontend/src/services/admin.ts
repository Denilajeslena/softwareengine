import { ApiResponse } from '@/types';
import { getStoredToken } from './auth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5000/api';

export interface CirculationPolicy {
  loan_duration_days: number;
  max_active_loans: number;
  renewal_limit: number;
  renewal_duration_days: number;
  overdue_fine_per_day: number;
  reservation_hold_days: number;
  pickup_window_hours: number;
  max_reservations_per_student: number;
  updated_at?: string;
  updated_by?: string;
}

export interface AuditLogEvent {
  id: string;
  timestamp: string;
  actor: string;
  role: string;
  action: string;
  resource_type: string;
  resource_id: string;
  details: string;
  level: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS';
}

export interface RoleDefinition {
  role: string;
  title: string;
  badge: string;
  description: string;
  permissions: string[];
}

export async function fetchCirculationPolicyApi(): Promise<ApiResponse<{ policy: CirculationPolicy }>> {
  const token = getStoredToken();
  try {
    const res = await fetch(`${API_BASE_URL}/admin/policy`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    return await res.json();
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Failed to fetch circulation policy.',
      data: {} as { policy: CirculationPolicy },
      error: { code: 'NETWORK_ERROR' },
    };
  }
}

export async function updateCirculationPolicyApi(policy: Partial<CirculationPolicy>): Promise<ApiResponse<{ policy: CirculationPolicy }>> {
  const token = getStoredToken();
  try {
    const res = await fetch(`${API_BASE_URL}/admin/policy`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(policy),
    });
    return await res.json();
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Failed to update circulation policy.',
      data: {} as { policy: CirculationPolicy },
      error: { code: 'NETWORK_ERROR' },
    };
  }
}

export async function fetchAuditLogsApi(params?: {
  action?: string;
  level?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<ApiResponse<{ logs: AuditLogEvent[]; total: number; page: number; totalPages: number }>> {
  const token = getStoredToken();
  const query = new URLSearchParams();
  if (params?.action) query.set('action', params.action);
  if (params?.level) query.set('level', params.level);
  if (params?.search) query.set('search', params.search);
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));

  try {
    const res = await fetch(`${API_BASE_URL}/admin/audit-logs?${query.toString()}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    return await res.json();
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Failed to retrieve audit log ledger.',
      data: { logs: [], total: 0, page: 1, totalPages: 1 },
      error: { code: 'NETWORK_ERROR' },
    };
  }
}

export function getAuditLogsCsvDownloadUrl(params?: { action?: string; level?: string; search?: string }): string {
  const query = new URLSearchParams();
  query.set('format', 'csv');
  if (params?.action) query.set('action', params.action);
  if (params?.level) query.set('level', params.level);
  if (params?.search) query.set('search', params.search);
  return `${API_BASE_URL}/admin/audit-logs?${query.toString()}`;
}

export async function fetchRolesApi(): Promise<ApiResponse<{ roles: RoleDefinition[] }>> {
  const token = getStoredToken();
  try {
    const res = await fetch(`${API_BASE_URL}/admin/roles`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    return await res.json();
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Failed to retrieve role permission matrix.',
      data: { roles: [] },
      error: { code: 'NETWORK_ERROR' },
    };
  }
}

export async function updateRolePermissionsApi(role: string, permissions: string[]): Promise<ApiResponse<{ role: RoleDefinition }>> {
  const token = getStoredToken();
  try {
    const res = await fetch(`${API_BASE_URL}/admin/roles/${role}/permissions`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ permissions }),
    });
    return await res.json();
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Failed to update role permissions.',
      data: {} as { role: RoleDefinition },
      error: { code: 'NETWORK_ERROR' },
    };
  }
}

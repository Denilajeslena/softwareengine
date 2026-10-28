import { ApiResponse, AuthResponseData, User } from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5000/api';

const TOKEN_KEY = 'scholars_auth_token';
const USER_KEY = 'scholars_auth_user';

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch (err) {
    console.error('Failed to save token to localStorage', err);
  }
}

export function getStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredUser(user: User): void {
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch (err) {
    console.error('Failed to save user to localStorage', err);
  }
}

export function clearStoredAuth(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch (err) {
    console.error('Failed to clear auth storage', err);
  }
}

export async function loginApi(email: string, password: string): Promise<ApiResponse<AuthResponseData>> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data: ApiResponse<AuthResponseData> = await response.json();
    if (response.ok && data.success && data.data?.token) {
      setStoredToken(data.data.token);
      setStoredUser(data.data.user);
    }
    return data;
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Unable to connect to authentication service.',
      data: {} as AuthResponseData,
      error: { code: 'NETWORK_ERROR' },
    };
  }
}

export async function registerApi(payload: {
  name: string;
  email: string;
  password: string;
  department?: string;
}): Promise<ApiResponse<AuthResponseData>> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data: ApiResponse<AuthResponseData> = await response.json();
    if (response.ok && data.success && data.data?.token) {
      setStoredToken(data.data.token);
      setStoredUser(data.data.user);
    }
    return data;
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Unable to connect to registration service.',
      data: {} as AuthResponseData,
      error: { code: 'NETWORK_ERROR' },
    };
  }
}

export async function getProfileApi(): Promise<ApiResponse<{ user: User }>> {
  const token = getStoredToken();
  if (!token) {
    return {
      success: false,
      message: 'No active session token.',
      data: {} as { user: User },
      error: { code: 'NO_TOKEN' },
    };
  }

  try {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const data: ApiResponse<{ user: User }> = await response.json();
    if (response.ok && data.success && data.data?.user) {
      setStoredUser(data.data.user);
    } else if (response.status === 401) {
      clearStoredAuth();
    }
    return data;
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Unable to verify profile with server.',
      data: {} as { user: User },
      error: { code: 'NETWORK_ERROR' },
    };
  }
}

export async function logoutApi(): Promise<void> {
  const token = getStoredToken();
  clearStoredAuth();
  if (!token) return;

  try {
    await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  } catch {
    // Stateless cleanup already completed locally
  }
}

export async function fetchAdminUsersApi(roleFilter?: string): Promise<ApiResponse<{ users: User[] }>> {
  const token = getStoredToken();
  try {
    const url = roleFilter ? `${API_BASE_URL}/auth/admin/users?role=${roleFilter}` : `${API_BASE_URL}/auth/admin/users`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    return await response.json();
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Unable to fetch admin user accounts.',
      data: { users: [] },
      error: { code: 'NETWORK_ERROR' },
    };
  }
}



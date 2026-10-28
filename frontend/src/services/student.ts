import { ApiResponse } from '@/types';
import { getStoredToken } from './auth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5000/api';

export interface StudentPreferences {
  emailDueReminders: boolean;
  holdArrivalAlerts: boolean;
  acquisitionsDigest: boolean;
  fontSize: 'small' | 'medium' | 'large';
  theme: 'dark-emerald' | 'warm-gold' | 'monochrome';
  preferredLanguage?: string;
}

export interface StudentDigitalCardData {
  studentId: string;
  name: string;
  department: string;
  validThru: string;
  cardStatus: string;
  qrBase64: string;
  verifiableToken: string;
}

export async function fetchStudentPreferencesApi(): Promise<ApiResponse<{ preferences: StudentPreferences }>> {
  const token = getStoredToken();
  try {
    const res = await fetch(`${API_BASE_URL}/student/preferences`, {
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
      message: err instanceof Error ? err.message : 'Failed to retrieve student preferences.',
      data: {
        preferences: {
          emailDueReminders: true,
          holdArrivalAlerts: true,
          acquisitionsDigest: false,
          fontSize: 'medium',
          theme: 'dark-emerald',
        },
      },
      error: { code: 'NETWORK_ERROR' },
    };
  }
}

export async function saveStudentPreferencesApi(
  preferences: Partial<StudentPreferences>
): Promise<ApiResponse<{ preferences: StudentPreferences }>> {
  const token = getStoredToken();
  try {
    const res = await fetch(`${API_BASE_URL}/student/preferences`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(preferences),
    });
    return await res.json();
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Failed to save student preferences.',
      data: {} as { preferences: StudentPreferences },
      error: { code: 'NETWORK_ERROR' },
    };
  }
}

export async function fetchStudentDigitalCardApi(): Promise<ApiResponse<StudentDigitalCardData>> {
  const token = getStoredToken();
  try {
    const res = await fetch(`${API_BASE_URL}/student/card`, {
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
      message: err instanceof Error ? err.message : 'Failed to fetch digital library card.',
      data: {} as StudentDigitalCardData,
      error: { code: 'NETWORK_ERROR' },
    };
  }
}

export async function verifyCardTokenApi(tokenString: string): Promise<
  ApiResponse<{ valid: boolean; name?: string; studentId?: string; role?: string; department?: string; reason?: string }>
> {
  try {
    const res = await fetch(`${API_BASE_URL}/student/verify-card`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ token: tokenString }),
    });
    return await res.json();
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Failed to verify library card token.',
      data: { valid: false, reason: 'Network failure communicating with verification gateway' },
      error: { code: 'NETWORK_ERROR' },
    };
  }
}

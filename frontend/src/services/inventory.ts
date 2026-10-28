import { ApiResponse } from '@/types';
import { getStoredToken } from './auth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5000/api';

export interface PhysicalStack {
  id: string;
  name: string;
  category: string;
  floorLevel: string;
  capacity: number;
  description: string;
  totalCopies: number;
  availableCopies: number;
  borrowedCopies: number;
  utilizationRate: number;
  status: string;
}

export interface InventoryOverviewData {
  stacks: PhysicalStack[];
  totalStacks: number;
  totalCapacity: number;
  totalPhysicalCopies: number;
  availableCopies: number;
  averageUtilization: number;
  lastAuditDate: string;
}

export interface InventoryAuditReport {
  id: string;
  stackId: string;
  stackName: string;
  auditorEmail: string;
  timestamp: string;
  totalExpected: number;
  totalScanned: number;
  matchedCount: number;
  missingCount: number;
  unexpectedCount: number;
  matchRate: number;
  missingItems: Array<{ barcode: string; bookTitle?: string; copyId?: string; status?: string }>;
  notes: string;
  outcome: string;
}

export async function fetchInventoryOverviewApi(): Promise<ApiResponse<InventoryOverviewData>> {
  const token = getStoredToken();
  try {
    const res = await fetch(`${API_BASE_URL}/inventory/overview`, {
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
      message: err instanceof Error ? err.message : 'Failed to retrieve physical stack inventory.',
      data: {
        stacks: [],
        totalStacks: 0,
        totalCapacity: 0,
        totalPhysicalCopies: 0,
        availableCopies: 0,
        averageUtilization: 0,
        lastAuditDate: new Date().toISOString(),
      },
      error: { code: 'NETWORK_ERROR' },
    };
  }
}

export async function saveStackApi(stackData: {
  id?: string;
  name: string;
  category: string;
  floorLevel?: string;
  capacity: number;
  description?: string;
}): Promise<ApiResponse<{ stack: PhysicalStack }>> {
  const token = getStoredToken();
  try {
    const res = await fetch(`${API_BASE_URL}/inventory/stacks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(stackData),
    });
    return await res.json();
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Failed to save stack configuration.',
      data: {} as { stack: PhysicalStack },
      error: { code: 'NETWORK_ERROR' },
    };
  }
}

export async function submitInventoryAuditApi(
  stackId: string,
  scannedBarcodes: string[],
  notes?: string
): Promise<ApiResponse<{ auditReport: InventoryAuditReport }>> {
  const token = getStoredToken();
  try {
    const res = await fetch(`${API_BASE_URL}/inventory/audits`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ stackId, scannedBarcodes, notes }),
    });
    return await res.json();
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Failed to submit physical inventory audit.',
      data: {} as { auditReport: InventoryAuditReport },
      error: { code: 'NETWORK_ERROR' },
    };
  }
}

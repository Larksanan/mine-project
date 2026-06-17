import {
  CreateMedicalHistoryDto,
  UpdateMedicalHistoryDto,
  MedicalHistoryFilters,
  MedicalHistoryResponse,
  MedicalHistorySummaryResponse,
} from '@/types/medicalHistory';

const API_BASE_URL = '/api/medicalHistory';

/**
 * Fetch medical history records with filters and pagination
 */
export async function getMedicalHistory(
  filters?: MedicalHistoryFilters
): Promise<MedicalHistoryResponse> {
  try {
    const params = new URLSearchParams();

    if (filters?.nic) params.append('nic', filters.nic);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.severity) params.append('severity', filters.severity);
    if (filters?.condition) params.append('condition', filters.condition);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const response = await fetch(`${API_BASE_URL}?${params.toString()}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch medical history');
    }

    return await response.json();
  } catch (error) {
    console.error('Error in getMedicalHistory:', error);
    throw error;
  }
}

/**
 * Fetch a single medical history record by ID
 */
export async function getMedicalHistoryById(
  id: string
): Promise<MedicalHistoryResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/${id}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        error.message || 'Failed to fetch medical history record'
      );
    }

    return await response.json();
  } catch (error) {
    console.error('Error in getMedicalHistoryById:', error);
    throw error;
  }
}

/**
 * Create a new medical history record
 */
export async function createMedicalHistory(
  data: CreateMedicalHistoryDto
): Promise<MedicalHistoryResponse> {
  try {
    if (!data.nic) {
      throw new Error('Patient NIC is required');
    }

    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        error.message || 'Failed to create medical history record'
      );
    }

    return await response.json();
  } catch (error) {
    console.error('Error in createMedicalHistory:', error);
    throw error;
  }
}

/**
 * Update an existing medical history record
 */
export async function updateMedicalHistory(
  id: string,
  data: UpdateMedicalHistoryDto
): Promise<MedicalHistoryResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        error.message || 'Failed to update medical history record'
      );
    }

    return await response.json();
  } catch (error) {
    console.error('Error in updateMedicalHistory:', error);
    throw error;
  }
}

/**
 * Delete a medical history record
 */
export async function deleteMedicalHistory(
  id: string
): Promise<MedicalHistoryResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        error.message || 'Failed to delete medical history record'
      );
    }

    return await response.json();
  } catch (error) {
    console.error('Error in deleteMedicalHistory:', error);
    throw error;
  }
}

/**
 * Get patient medical history summary by NIC
 */
export async function getMedicalHistorySummary(
  nic: string
): Promise<MedicalHistorySummaryResponse> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/summary?nic=${encodeURIComponent(nic)}`
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        error.message || 'Failed to fetch medical history summary'
      );
    }

    return await response.json();
  } catch (error) {
    console.error('Error in getMedicalHistorySummary:', error);
    throw error;
  }
}

/**
 * Get medical history status summary by NIC
 */
export async function getMedicalHistoryStatus(
  nic: string
): Promise<MedicalHistoryResponse> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/status?nic=${encodeURIComponent(nic)}`
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        error.message || 'Failed to fetch medical history status'
      );
    }

    return await response.json();
  } catch (error) {
    console.error('Error in getMedicalHistoryStatus:', error);
    throw error;
  }
}

/**
 * Get active conditions for a patient by NIC
 */
export async function getActiveConditions(
  nic: string
): Promise<MedicalHistoryResponse> {
  return getMedicalHistory({ nic, status: 'active' });
}

/**
 * Get chronic conditions for a patient by NIC
 */
export async function getChronicConditions(
  nic: string
): Promise<MedicalHistoryResponse> {
  return getMedicalHistory({ nic, status: 'chronic' });
}

/**
 * Get resolved conditions for a patient by NIC
 */
export async function getResolvedConditions(
  nic: string
): Promise<MedicalHistoryResponse> {
  return getMedicalHistory({ nic, status: 'resolved' });
}

/**
 * Get conditions by severity for a patient
 */
export async function getConditionsBySeverity(
  nic: string,
  severity: 'mild' | 'moderate' | 'severe'
): Promise<MedicalHistoryResponse> {
  return getMedicalHistory({ nic, severity });
}

/**
 * Search medical history by condition name
 */
export async function searchMedicalHistory(
  nic: string,
  searchTerm: string
): Promise<MedicalHistoryResponse> {
  return getMedicalHistory({
    nic,
    condition: searchTerm,
  });
}

/**
 * Get recent medical history entries for a patient
 */
export async function getRecentMedicalHistory(
  nic: string,
  limit: number = 5
): Promise<MedicalHistoryResponse> {
  return getMedicalHistory({
    nic,
    page: 1,
    limit,
  });
}

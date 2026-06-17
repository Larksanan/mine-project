import { Patient } from './patient';

export type MedicalHistoryStatus = 'active' | 'resolved' | 'chronic';
export type MedicalHistorySeverity = 'mild' | 'moderate' | 'severe';

export interface MedicalHistoryAttachment {
  fileName: string;
  fileUrl: string;
  fileType: string;
  uploadedAt: Date | string;
}

export interface MedicalHistoryRecord {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [x: string]: any;
  _id: string;
  nic: string; // Patient identifier (NIC)
  condition: string;
  diagnosisDate: Date | string;
  resolutionDate?: Date | string;
  status: MedicalHistoryStatus;
  severity: MedicalHistorySeverity;
  description?: string;
  treatment?: string;
  medications?: string[];
  notes?: string;
  attachments?: MedicalHistoryAttachment[];
  createdBy: string; // User ID
  updatedBy?: string; // User ID
  createdAt: Date | string;
  updatedAt: Date | string;
  durationDays?: number; // Virtual field
  // Populated fields (optional, when populated via query)
  patientDetails?: Partial<Patient>; // When enriched with patient data
  creatorDetails?: {
    // When populated with user data
    name?: string;
    email?: string;
  };
}

export interface CreateMedicalHistoryDto {
  nic: string; // Changed from patientId to nic
  patientId?: string;
  condition: string;
  diagnosisDate: string | Date;
  resolutionDate?: string | Date;
  status: MedicalHistoryStatus;
  severity: MedicalHistorySeverity;
  description?: string;
  treatment?: string;
  medications?: string[];
  notes?: string;
  attachments?: Omit<MedicalHistoryAttachment, 'uploadedAt'>[];
}

export interface UpdateMedicalHistoryDto {
  condition?: string;
  diagnosisDate?: string | Date;
  resolutionDate?: string | Date;
  status?: MedicalHistoryStatus;
  severity?: MedicalHistorySeverity;
  description?: string;
  treatment?: string;
  medications?: string[];
  notes?: string;
  attachments?: Omit<MedicalHistoryAttachment, 'uploadedAt'>[];
}

export interface MedicalHistoryFilters {
  nic?: string; // Filter by NIC
  patientId?: string; // Also support patientId (will be converted to NIC)
  status?: MedicalHistoryStatus;
  severity?: MedicalHistorySeverity;
  condition?: string;
  startDate?: string; // Filter by diagnosis date range
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface MedicalHistoryPagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface MedicalHistoryResponse {
  success: boolean;
  data?: MedicalHistoryRecord | MedicalHistoryRecord[];
  pagination?: MedicalHistoryPagination;
  message?: string;
}

// Enhanced summary interface matching your API response
export interface MedicalHistorySummary {
  patientInfo?: {
    nic: string;
    name: string;
    id?: string;
    dateOfBirth?: Date | string;
    gender?: string;
  };
  counts: {
    total: number;
    active: number;
    resolved: number;
    chronic: number;
    activeConditions: number;
    chronicConditions: number;
    resolvedLast30Days?: number;
  };
  severity: {
    mild: number;
    moderate: number;
    severe: number;
  };
  recentConditions: Array<{
    _id?: string;
    condition: string;
    diagnosisDate?: string;
    status: MedicalHistoryStatus;
    severity: MedicalHistorySeverity;
    treatment?: string;
  }>;
  commonConditions?: Array<{
    condition: string;
    occurrences: number;
    lastDiagnosed?: string;
    statuses?: MedicalHistoryStatus[];
  }>;
  conditionsByYear?: Array<{
    year: number;
    count: number;
  }>;
  activeMedications?: string[];
  activeMedicationsCount?: number;
  hasActiveConditions?: boolean;
  conditionTimeline?: Array<{
    month: string;
    count: number;
    conditions: string[];
  }>;
}

export interface MedicalHistorySummaryResponse {
  success: boolean;
  data?: MedicalHistorySummary;
  message?: string;
}

// Status summary interface for the status endpoint
export interface MedicalHistoryStatusSummary {
  patientInfo?: {
    nic: string;
    name: string;
    id?: string;
  };
  counts: {
    total: number;
    active: number;
    resolved: number;
    chronic: number;
  };
  severity: {
    mild: number;
    moderate: number;
    severe: number;
  };
  activeConditions: number;
  chronicConditions: number;
  recentConditions: Array<{
    _id?: string;
    condition: string;
    diagnosisDate?: string;
    status: MedicalHistoryStatus;
    severity: MedicalHistorySeverity;
  }>;
}

// Dashboard/Chart data interfaces
export interface MedicalHistoryTimelineData {
  month: string;
  diagnoses: number;
  resolved: number;
  active: number;
}

export interface MedicalHistoryConditionDistribution {
  condition: string;
  count: number;
  percentage?: number;
}

export interface MedicalHistorySeverityDistribution {
  severity: MedicalHistorySeverity;
  count: number;
  percentage?: number;
}

// Export type guard functions
export const isValidMedicalHistoryStatus = (
  status: string
): status is MedicalHistoryStatus => {
  return ['active', 'resolved', 'chronic'].includes(status);
};

export const isValidMedicalHistorySeverity = (
  severity: string
): severity is MedicalHistorySeverity => {
  return ['mild', 'moderate', 'severe'].includes(severity);
};

// Helper type for creating attachments
export interface CreateAttachmentDto {
  fileName: string;
  fileUrl: string;
  fileType: string;
}

// API request/response types for file uploads
export interface MedicalHistoryAttachmentUploadResponse {
  success: boolean;
  data?: {
    attachments: MedicalHistoryAttachment[];
  };
  message?: string;
}

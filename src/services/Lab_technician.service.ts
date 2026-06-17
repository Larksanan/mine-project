/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Lab Technician Service
 * Handles all API interactions for lab technicians
 */

import { apiClient } from './api-client';

// Types matching your existing structure
export interface LabTechnician {
  [x: string]: any;

  name: any;
  status: string;
  shift: 'GENERAL' | 'MORNING' | 'EVENING' | 'NIGHT';
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    profileImage?: string;
  };
  employeeId: string;
  specialization:
    | 'HEMATOLOGY'
    | 'BIOCHEMISTRY'
    | 'MICROBIOLOGY'
    | 'IMMUNOLOGY'
    | 'PATHOLOGY'
    | 'URINALYSIS'
    | 'ENDOCRINOLOGY'
    | 'TOXICOLOGY'
    | 'MOLECULAR_DIAGNOSTICS'
    | 'GENERAL';
  currentWorkload: number;
  maxConcurrentTests: number;
  performanceScore: number;
  efficiency: number;
  isAvailable: boolean;
  availableSlots?: number;
  createdAt: string;
  updatedAt: string;
}

export interface TechnicianWorkloadInfo {
  technician: {
    name: string;
    currentWorkload: number;
    maxConcurrentTests: number;
    efficiency: number;
    isAvailable: boolean;
  };
  activeTests: number;
  availableSlots: number;
  canAcceptMore: boolean;
}

export interface CreateTechnicianDto {
  user?: string;
  name: string;
  employeeId: string;
  email: string;
  phone: string;
  specialization: string;
  qualification: string;
  yearsOfExperience: number;
  status: string;
  shift: string;
  maxConcurrentTests: number;
  joinedDate: string;
  certifications: string[];
  notes: string;
}

export interface UpdateTechnicianDto {
  specialization?: LabTechnician['specialization'];
  maxConcurrentTests?: number;
  isAvailable?: boolean;
  performanceScore?: number;
  efficiency?: number;
}

export interface GetTechniciansParams {
  specialization?: string;
  availableOnly?: boolean;
}

export interface GetAvailableTechniciansParams {
  testId?: string;
  specialization?: string;
  includeWorkload?: boolean;
}

export interface AvailableTechniciansResponse {
  technicians: LabTechnician[];
  specialization: string;
  totalAvailable: number;
}

export interface WorkloadAction {
  action: 'assign' | 'complete' | 'update';
}

export interface WorkloadUpdateResponse {
  technician: LabTechnician;
  action: string;
  message: string;
}

class LabTechnicianService {
  private readonly basePath = '/lab/lab-technicians';

  /**
   * Get all lab technicians with optional filters
   */
  async getTechnicians(
    params?: GetTechniciansParams
  ): Promise<{ technicians: LabTechnician[] }> {
    const queryParams: Record<string, string> = {};

    if (params?.specialization) {
      queryParams.specialization = params.specialization;
    }
    if (params?.availableOnly) {
      queryParams.availableOnly = 'true';
    }

    const response = await apiClient.get<{ technicians: LabTechnician[] }>(
      this.basePath,
      queryParams
    );
    return response && response.technicians ? response : { technicians: [] };
  }

  /**
   * Get available technicians for a specific test or specialization
   */
  async getAvailableTechnicians(
    params?: GetAvailableTechniciansParams
  ): Promise<AvailableTechniciansResponse> {
    const queryParams: Record<string, string> = {};

    if (params?.testId) {
      queryParams.testId = params.testId;
    }
    if (params?.specialization) {
      queryParams.specialization = params.specialization;
    }
    if (params?.includeWorkload) {
      queryParams.includeWorkload = 'true';
    }

    return apiClient.get(`${this.basePath}/available`, queryParams);
  }

  /**
   * Get a specific technician by ID
   */
  async getTechnicianById(id: string): Promise<{ technician: LabTechnician }> {
    return apiClient.get(`${this.basePath}/${id}`);
  }

  /**
   * Create a new lab technician
   */
  async createTechnician(
    data: CreateTechnicianDto
  ): Promise<{ technician: LabTechnician }> {
    return apiClient.post(this.basePath, data);
  }

  /**
   * Update a lab technician
   */
  async updateTechnician(
    id: string,
    data: UpdateTechnicianDto
  ): Promise<{ technician: LabTechnician }> {
    return apiClient.patch(`${this.basePath}/${id}`, data);
  }

  /**
   * Delete a lab technician
   */
  async deleteTechnician(id: string): Promise<{ message: string }> {
    return apiClient.delete(`${this.basePath}/${id}`);
  }

  /**
   * Get technician workload information
   */
  async getTechnicianWorkload(id: string): Promise<TechnicianWorkloadInfo> {
    return apiClient.get(`${this.basePath}/${id}/workload`);
  }

  /**
   * Update technician workload (assign, complete, or update)
   */
  async updateWorkload(
    id: string,
    action: WorkloadAction['action']
  ): Promise<WorkloadUpdateResponse> {
    return apiClient.post(`${this.basePath}/${id}/workload`, { action });
  }

  /**
   * Assign a test to a technician
   */
  async assignTest(technicianId: string): Promise<WorkloadUpdateResponse> {
    return this.updateWorkload(technicianId, 'assign');
  }

  /**
   * Mark a test as complete for a technician
   */
  async completeTest(technicianId: string): Promise<WorkloadUpdateResponse> {
    return this.updateWorkload(technicianId, 'complete');
  }

  /**
   * Refresh technician workload from database
   */
  async refreshWorkload(technicianId: string): Promise<WorkloadUpdateResponse> {
    return this.updateWorkload(technicianId, 'update');
  }

  /**
   * Get technicians by specialization (convenience method)
   */
  async getTechniciansBySpecialization(
    specialization: LabTechnician['specialization']
  ): Promise<{ technicians: LabTechnician[] }> {
    return this.getTechnicians({ specialization });
  }

  /**
   * Get only available technicians (convenience method)
   */
  async getOnlyAvailableTechnicians(): Promise<{
    technicians: LabTechnician[];
  }> {
    return this.getTechnicians({ availableOnly: true });
  }
}

export const labTechnicianService = new LabTechnicianService();

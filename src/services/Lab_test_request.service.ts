import { apiClient } from './api-client';

export interface LabTestRequest {
  _id: string;
  patient: {
    _id: string;
    nic: string;
    name: string;
    email: string;
    dateOfBirth: Date;
    gender: 'MALE' | 'FEMALE' | 'OTHER';
    phone?: string;
    medicalRecordNumber?: string;
  };
  doctor: {
    _id: string;
    name: string;
    email: string;
    phone: string;
    doctorId: string;
    doctor_number: string;
  };
  labTechnician?: {
    _id: string;
    name: string;
    employeeId: string;
  };
  test: {
    _id: string;
    name: string;
    category: string;
    duration: number;
    price: number;
    sampleType: string;
  };
  status:
    | 'REQUESTED'
    | 'SAMPLE_COLLECTED'
    | 'IN_PROGRESS'
    | 'COMPLETED'
    | 'VERIFIED'
    | 'CANCELLED';
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'STAT';
  requestedDate: string;
  sampleCollectedDate?: string;
  startedDate?: string;
  completedDate?: string;
  verifiedDate?: string;
  results?: string;
  findings?: string;
  notes?: string;
  isCritical: boolean;
  turnaroundTime?: number;
  isOverdue: boolean;
  employeeId?: string;
}

export interface CreateLabTestRequestDto {
  patientId: string;
  testId: string;
  priority?: LabTestRequest['priority'];
  notes?: string;
  referral?: string;
  isCritical?: boolean;
  requestedDate?: string;
}

export interface UpdateLabTestRequestDto {
  status?: LabTestRequest['status'];
  priority?: LabTestRequest['priority'];
  results?: string;
  findings?: string;
  notes?: string;
  labTechnician?: string;
  sampleCollectedDate?: string;
  startedDate?: string;
  completedDate?: string;
}

export interface GetTestRequestsParams {
  status?: LabTestRequest['status'];
  patientId?: string;
  technicianId?: string;
  priority?: LabTestRequest['priority'];
}

export interface AssignTechnicianDto {
  labTechnician: string;
}

class LabTestRequestService {
  private readonly basePath = '/lab-test-requests';

  /**
   * Get all lab test requests with optional filters
   */
  async getTestRequests(
    params?: GetTestRequestsParams
  ): Promise<{ requests: LabTestRequest[] }> {
    const queryParams: Record<string, string> = {};

    if (params?.status) {
      queryParams.status = params.status;
    }
    if (params?.patientId) {
      queryParams.patientId = params.patientId;
    }
    if (params?.technicianId) {
      queryParams.technicianId = params.technicianId;
    }
    if (params?.priority) {
      queryParams.priority = params.priority;
    }

    return apiClient.get(this.basePath, queryParams);
  }

  /**
   * Get a specific test request by ID
   */
  async getTestRequestById(
    id: string
  ): Promise<{ testRequest: LabTestRequest }> {
    return apiClient.get(`${this.basePath}/${id}`);
  }

  /**
   * Create a new lab test request
   */
  async createTestRequest(
    data: CreateLabTestRequestDto
  ): Promise<{ testRequest: LabTestRequest }> {
    return apiClient.post(this.basePath, data);
  }

  /**
   * Update a lab test request
   */
  async updateTestRequest(
    id: string,
    data: UpdateLabTestRequestDto
  ): Promise<{ testRequest: LabTestRequest }> {
    return apiClient.patch(`${this.basePath}/${id}`, data);
  }

  /**
   * Update test request status
   */
  async updateStatus(
    id: string,
    status: LabTestRequest['status']
  ): Promise<{ testRequest: LabTestRequest }> {
    return this.updateTestRequest(id, { status });
  }

  /**
   * Assign a technician to a test request
   */
  async assignTechnician(
    id: string,
    technicianId: string
  ): Promise<{ testRequest: LabTestRequest }> {
    return this.updateTestRequest(id, { labTechnician: technicianId });
  }

  /**
   * Update test results
   */
  async updateResults(
    id: string,
    results: string,
    findings?: string
  ): Promise<{ testRequest: LabTestRequest }> {
    return this.updateTestRequest(id, { results, findings });
  }

  /**
   * Mark sample as collected
   */
  async collectSample(
    id: string,
    collectedDate?: string
  ): Promise<{ testRequest: LabTestRequest }> {
    return this.updateTestRequest(id, {
      status: 'SAMPLE_COLLECTED',
      sampleCollectedDate: collectedDate || new Date().toISOString(),
    });
  }

  /**
   * Start test processing
   */
  async startTest(
    id: string,
    startedDate?: string
  ): Promise<{ testRequest: LabTestRequest }> {
    return this.updateTestRequest(id, {
      status: 'IN_PROGRESS',
      startedDate: startedDate || new Date().toISOString(),
    });
  }

  /**
   * Complete test
   */
  async completeTest(
    id: string,
    results: string,
    findings?: string,
    completedDate?: string
  ): Promise<{ testRequest: LabTestRequest }> {
    return this.updateTestRequest(id, {
      status: 'COMPLETED',
      results,
      findings,
      completedDate: completedDate || new Date().toISOString(),
    });
  }

  /**
   * Verify test results
   */
  async verifyTest(id: string): Promise<{ testRequest: LabTestRequest }> {
    return this.updateTestRequest(id, {
      status: 'VERIFIED',
    });
  }

  /**
   * Cancel test request
   */
  async cancelTest(id: string): Promise<{ testRequest: LabTestRequest }> {
    return this.updateTestRequest(id, {
      status: 'CANCELLED',
    });
  }

  /**
   * Get test requests by status (convenience method)
   */
  async getTestRequestsByStatus(
    status: LabTestRequest['status']
  ): Promise<{ requests: LabTestRequest[] }> {
    return this.getTestRequests({ status });
  }

  /**
   * Get test requests for a specific patient
   */
  async getPatientTestRequests(
    patientId: string
  ): Promise<{ requests: LabTestRequest[] }> {
    return this.getTestRequests({ patientId });
  }

  /**
   * Get test requests for a specific technician
   */
  async getTechnicianTestRequests(
    technicianId: string
  ): Promise<{ requests: LabTestRequest[] }> {
    return this.getTestRequests({ technicianId });
  }

  /**
   * Get pending test requests (not yet completed)
   */
  async getPendingTestRequests(): Promise<{ requests: LabTestRequest[] }> {
    // This would need to be implemented on the backend to support multiple statuses
    // For now, we can make multiple calls or implement on frontend
    const statuses: LabTestRequest['status'][] = [
      'REQUESTED',
      'SAMPLE_COLLECTED',
      'IN_PROGRESS',
    ];

    const results = await Promise.all(
      statuses.map(status => this.getTestRequestsByStatus(status))
    );

    return {
      requests: results.flatMap(result => result.requests),
    };
  }

  /**
   * Get critical test requests
   */
  async getCriticalTestRequests(): Promise<{ requests: LabTestRequest[] }> {
    const allRequests = await this.getTestRequests();
    return {
      requests: allRequests.requests.filter(req => req.isCritical),
    };
  }

  /**
   * Get overdue test requests
   */
  async getOverdueTestRequests(): Promise<{ requests: LabTestRequest[] }> {
    const allRequests = await this.getTestRequests();
    return {
      requests: allRequests.requests.filter(req => req.isOverdue),
    };
  }
}

export const labTestRequestService = new LabTestRequestService();

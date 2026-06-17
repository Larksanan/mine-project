import { apiClient } from './api-client';

export interface LabTest {
  _id: string;
  name: string;
  category: string;
  description?: string;
  price: number;
  duration: number;
  sampleType: string;
  preparationInstructions?: string;
  normalRange?: string;
  units?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateLabTestDto {
  name: string;
  category: string;
  description?: string;
  price: number;
  duration: number;
  sampleType: string;
  preparationInstructions?: string;
  normalRange?: string;
  units?: string;
  isActive?: boolean;
}

export interface UpdateLabTestDto {
  name?: string;
  category?: string;
  description?: string;
  price?: number;
  duration?: number;
  sampleType?: string;
  preparationInstructions?: string;
  normalRange?: string;
  units?: string;
  isActive?: boolean;
}

export interface GetLabTestsParams {
  category?: string;
  activeOnly?: boolean;
}

class LabTestService {
  private readonly basePath = '/lab-tests';

  /**
   * Get all lab tests with optional filters
   */
  async getLabTests(params?: GetLabTestsParams): Promise<{ tests: LabTest[] }> {
    const queryParams: Record<string, string> = {};

    if (params?.category) {
      queryParams.category = params.category;
    }
    if (params?.activeOnly !== undefined) {
      queryParams.activeOnly = params.activeOnly.toString();
    }

    return apiClient.get(this.basePath, queryParams);
  }

  /**
   * Get a specific lab test by ID
   */
  async getLabTestById(id: string): Promise<{ test: LabTest }> {
    return apiClient.get(`${this.basePath}/${id}`);
  }

  /**
   * Create a new lab test
   */
  async createLabTest(data: CreateLabTestDto): Promise<{ test: LabTest }> {
    return apiClient.post(this.basePath, data);
  }

  /**
   * Update a lab test
   */
  async updateLabTest(
    id: string,
    data: UpdateLabTestDto
  ): Promise<{ test: LabTest }> {
    return apiClient.patch(`${this.basePath}/${id}`, data);
  }

  /**
   * Deactivate a lab test (soft delete)
   */
  async deactivateLabTest(
    id: string
  ): Promise<{ message: string; test: LabTest }> {
    return apiClient.delete(`${this.basePath}/${id}`);
  }

  /**
   * Get lab tests by category (convenience method)
   */
  async getLabTestsByCategory(category: string): Promise<{ tests: LabTest[] }> {
    return this.getLabTests({ category });
  }

  /**
   * Get only active lab tests (convenience method)
   */
  async getActiveLabTests(): Promise<{ tests: LabTest[] }> {
    return this.getLabTests({ activeOnly: true });
  }

  /**
   * Get all unique categories
   */
  async getCategories(): Promise<string[]> {
    const { tests } = await this.getLabTests({ activeOnly: true });
    const categories = [...new Set(tests.map(test => test.category))];
    return categories.sort();
  }

  /**
   * Search lab tests by name
   */
  async searchLabTests(query: string): Promise<{ tests: LabTest[] }> {
    const { tests } = await this.getLabTests({ activeOnly: true });
    const lowerQuery = query.toLowerCase();
    return {
      tests: tests.filter(test => test.name.toLowerCase().includes(lowerQuery)),
    };
  }
}

export const labTestService = new LabTestService();

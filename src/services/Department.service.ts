import {
  IDepartment,
  ICreateDepartmentInput,
  IUpdateDepartmentInput,
  IDepartmentFilters,
  IDepartmentStats,
  IDepartmentResponse,
} from '@/types/department';

const API_BASE_URL = '/api/admin/departments';

class DepartmentService {
  private cache: Map<string, { data: IDepartment[]; timestamp: number }> =
    new Map();
  private CACHE_TTL = 5000;

  /**
   * Get all departments with optional filters
   */
  async getAllDepartments(
    filters?: IDepartmentFilters
  ): Promise<IDepartment[]> {
    try {
      const queryParams = new URLSearchParams();

      if (filters) {
        if (filters.isActive !== undefined) {
          queryParams.append('isActive', filters.isActive.toString());
        }
        if (filters.search) {
          queryParams.append('search', filters.search);
        }
        if (filters.floor !== undefined) {
          queryParams.append('floor', filters.floor.toString());
        }
        if (filters.hasHead !== undefined) {
          queryParams.append('hasHead', filters.hasHead.toString());
        }
      }

      const url = `${API_BASE_URL}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

      const cached = this.cache.get(url);
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
        return cached.data;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch departments');
      }

      const data: IDepartmentResponse = await response.json();
      const departments = data.departments || [];
      this.cache.set(url, { data: departments, timestamp: Date.now() });
      return departments;
    } catch (error) {
      console.error('Error fetching departments:', error);
      throw error;
    }
  }

  /**
   * Get a single department by ID
   */
  async getDepartmentById(id: string): Promise<IDepartment> {
    if (!id || id === 'undefined') {
      throw new Error('Invalid department ID');
    }

    try {
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch department');
      }

      const data: IDepartmentResponse = await response.json();
      if (!data.department) {
        throw new Error('Department not found');
      }

      return data.department;
    } catch (error) {
      console.error('Error fetching department:', error);
      throw error;
    }
  }

  /**
   * Create a new department
   */
  async createDepartment(
    departmentData: ICreateDepartmentInput
  ): Promise<IDepartment> {
    try {
      const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(departmentData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create department');
      }

      const data: IDepartmentResponse = await response.json();
      if (!data.department) {
        throw new Error('Failed to create department');
      }

      this.cache.clear();
      return data.department;
    } catch (error) {
      console.error('Error creating department:', error);
      throw error;
    }
  }

  /**
   * Update an existing department
   */
  async updateDepartment(
    id: string,
    departmentData: Partial<IUpdateDepartmentInput>
  ): Promise<IDepartment> {
    try {
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(departmentData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update department');
      }

      const data: IDepartmentResponse = await response.json();
      if (!data.department) {
        throw new Error('Failed to update department');
      }

      this.cache.clear();
      return data.department;
    } catch (error) {
      console.error('Error updating department:', error);
      throw error;
    }
  }

  /**
   * Delete a department
   */
  async deleteDepartment(id: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete department');
      }
      this.cache.clear();
    } catch (error) {
      console.error('Error deleting department:', error);
      throw error;
    }
  }

  /**
   * Get department statistics
   */
  async getDepartmentStats(): Promise<IDepartmentStats> {
    try {
      const response = await fetch(`${API_BASE_URL}/stats`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch department stats');
      }

      const data: IDepartmentResponse = await response.json();
      if (!data.stats) {
        throw new Error('Failed to fetch department stats');
      }

      return data.stats;
    } catch (error) {
      console.error('Error fetching department stats:', error);
      throw error;
    }
  }

  /**
   * Toggle department active status
   */
  async toggleDepartmentStatus(id: string): Promise<IDepartment> {
    try {
      const response = await fetch(`${API_BASE_URL}/${id}/toggle-status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to toggle department status');
      }

      const data: IDepartmentResponse = await response.json();
      if (!data.department) {
        throw new Error('Failed to toggle department status');
      }

      this.cache.clear();
      return data.department;
    } catch (error) {
      console.error('Error toggling department status:', error);
      throw error;
    }
  }

  /**
   * Get departments by floor
   */
  async getDepartmentsByFloor(floor: number): Promise<IDepartment[]> {
    try {
      return this.getAllDepartments({ floor });
    } catch (error) {
      console.error('Error fetching departments by floor:', error);
      throw error;
    }
  }

  /**
   * Search departments
   */
  async searchDepartments(query: string): Promise<IDepartment[]> {
    try {
      return this.getAllDepartments({ search: query });
    } catch (error) {
      console.error('Error searching departments:', error);
      throw error;
    }
  }

  /**
   * Get active departments
   */
  async getActiveDepartments(): Promise<IDepartment[]> {
    try {
      return this.getAllDepartments({ isActive: true });
    } catch (error) {
      console.error('Error fetching active departments:', error);
      throw error;
    }
  }

  /**
   * Update department staff count
   */

  async updateStaffCount(id: string, count: number): Promise<IDepartment> {
    try {
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staffCount: count }),
      });
      if (!response.ok) throw new Error('Failed to update staff count');
      const data: IDepartmentResponse = await response.json();
      if (!data.department) throw new Error('Department not found');
      this.cache.clear();
      return data.department;
    } catch (error) {
      console.error('Error updating staff count:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const departmentService = new DepartmentService();

export default departmentService;

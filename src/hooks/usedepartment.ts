import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/useToast';
import { departmentService } from '@/services/Department.service';
import {
  IDepartment,
  ICreateDepartmentInput,
  IUpdateDepartmentInput,
  IDepartmentFilters,
  IDepartmentStats,
} from '@/types/department';

interface UseDepartmentReturn {
  // State
  departments: IDepartment[];
  department: IDepartment | null;
  stats: IDepartmentStats | null;
  loading: boolean;
  error: string | null;

  // Methods
  fetchDepartments: (filters?: IDepartmentFilters) => Promise<void>;
  fetchDepartmentById: (id: string) => Promise<void>;
  createDepartment: (
    data: ICreateDepartmentInput
  ) => Promise<IDepartment | null>;
  updateDepartment: (
    id: string,
    data: Partial<IUpdateDepartmentInput>
  ) => Promise<IDepartment | null>;
  deleteDepartment: (id: string) => Promise<boolean>;
  toggleDepartmentStatus: (id: string) => Promise<IDepartment | null>;
  fetchStats: () => Promise<void>;
  searchDepartments: (query: string) => Promise<void>;
  getActiveDepartments: () => Promise<void>;
  clearError: () => void;
  resetDepartment: () => void;
}

export const useDepartment = (): UseDepartmentReturn => {
  const [departments, setDepartments] = useState<IDepartment[]>([]);
  const [department, setDepartment] = useState<IDepartment | null>(null);
  const [stats, setStats] = useState<IDepartmentStats | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  /**
   * Fetch all departments with optional filters
   */
  const fetchDepartments = useCallback(
    async (filters?: IDepartmentFilters) => {
      setLoading(true);
      setError(null);
      try {
        const data = await departmentService.getAllDepartments(filters);
        setDepartments(data);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to fetch departments';
        setError(errorMessage);
        toast.showToast(errorMessage, 'error');
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  /**
   * Fetch a single department by ID
   */
  const fetchDepartmentById = useCallback(
    async (id: string) => {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const data = await departmentService.getDepartmentById(id);
        setDepartment(data);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to fetch department';
        setError(errorMessage);
        toast.showToast(errorMessage, 'error');
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  /**
   * Create a new department
   */
  const createDepartment = useCallback(
    async (data: ICreateDepartmentInput): Promise<IDepartment | null> => {
      setLoading(true);
      setError(null);
      try {
        const newDepartment = await departmentService.createDepartment(data);
        setDepartments(prev => [...prev, newDepartment]);
        toast.showToast('Department created successfully', 'success');
        return newDepartment;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to create department';
        setError(errorMessage);
        toast.showToast(errorMessage, 'error');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  /**
   * Update an existing department
   */
  const updateDepartment = useCallback(
    async (
      id: string,
      data: Partial<IUpdateDepartmentInput>
    ): Promise<IDepartment | null> => {
      setLoading(true);
      setError(null);
      try {
        const updatedDepartment = await departmentService.updateDepartment(
          id,
          data
        );
        setDepartments(prev =>
          prev.map(dept => (dept._id === id ? updatedDepartment : dept))
        );
        if (department && department._id === id) {
          setDepartment(updatedDepartment);
        }
        toast.showToast('Department updated successfully', 'success');
        return updatedDepartment;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to update department';
        setError(errorMessage);
        toast.showToast(errorMessage, 'error');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [department, toast]
  );

  /**
   * Delete a department
   */
  const deleteDepartment = useCallback(
    async (id: string): Promise<boolean> => {
      setLoading(true);
      setError(null);
      try {
        await departmentService.deleteDepartment(id);
        setDepartments(prev => prev.filter(dept => dept._id !== id));
        if (department && department._id === id) {
          setDepartment(null);
        }
        toast.showToast('Department deleted successfully', 'success');
        return true;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to delete department';
        setError(errorMessage);
        toast.showToast(errorMessage, 'error');
        return false;
      } finally {
        setLoading(false);
      }
    },
    [department, toast]
  );

  /**
   * Toggle department active status
   */
  const toggleDepartmentStatus = useCallback(
    async (id: string): Promise<IDepartment | null> => {
      setLoading(true);
      setError(null);
      try {
        const updatedDepartment =
          await departmentService.toggleDepartmentStatus(id);
        setDepartments(prev =>
          prev.map(dept => (dept._id === id ? updatedDepartment : dept))
        );
        if (department && department._id === id) {
          setDepartment(updatedDepartment);
        }
        toast.showToast(
          `Department ${updatedDepartment.isActive ? 'activated' : 'deactivated'} successfully`,
          'success'
        );
        return updatedDepartment;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : 'Failed to toggle department status';
        setError(errorMessage);
        toast.showToast(errorMessage, 'error');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [department, toast]
  );

  /**
   * Fetch department statistics
   */
  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await departmentService.getDepartmentStats();
      setStats(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch statistics';
      setError(errorMessage);
      toast.showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  /**
   * Search departments
   */
  const searchDepartments = useCallback(
    async (query: string) => {
      await fetchDepartments({ search: query });
    },
    [fetchDepartments]
  );

  /**
   * Get active departments only
   */
  const getActiveDepartments = useCallback(async () => {
    await fetchDepartments({ isActive: true });
  }, [fetchDepartments]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Reset department state
   */
  const resetDepartment = useCallback(() => {
    setDepartment(null);
  }, []);

  return {
    // State
    departments,
    department,
    stats,
    loading,
    error,

    // Methods
    fetchDepartments,
    fetchDepartmentById,
    createDepartment,
    updateDepartment,
    deleteDepartment,
    toggleDepartmentStatus,
    fetchStats,
    searchDepartments,
    getActiveDepartments,
    clearError,
    resetDepartment,
  };
};

export default useDepartment;

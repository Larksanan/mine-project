import { useState, useEffect, useCallback, useMemo } from 'react';
import { ApiError } from '@/services/api-client';
import { useToast } from './useToast';
import {
  CreateLabTestDto,
  GetLabTestsParams,
  labTestService,
  UpdateLabTestDto,
} from '../services/Lab_test.service';
import {
  LabTest,
  UseLabTestActionsResult,
  UseLabTestResult,
  UseLabTestsResult,
  UseTestCategoriesResult,
  UseTestSearchResult,
} from '../types/lab';

/**
 * Hook to fetch and manage all lab tests
 */
export function useLabTests(
  params?: GetLabTestsParams,
  autoFetch = true
): UseLabTestsResult {
  const [tests, setTests] = useState<LabTest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTests = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await labTestService.getLabTests(params);
      setTests(response.tests);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Failed to fetch lab tests';
      setError(message);
      console.error('Error fetching lab tests:', err);
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    if (autoFetch) {
      fetchTests();
    }
  }, [autoFetch, fetchTests]);

  return {
    tests,
    loading,
    error,
    refetch: fetchTests,
  };
}

/**
 * Hook to fetch and manage a single lab test
 */
export function useLabTest(id: string): UseLabTestResult {
  const [test, setTest] = useState<LabTest | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  const fetchTest = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);
      const response = await labTestService.getLabTestById(id);
      setTest(response.test);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Failed to fetch lab test';
      setError(message);
      console.error('Error fetching lab test:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const updateTest = useCallback(
    async (data: UpdateLabTestDto) => {
      try {
        setLoading(true);
        const response = await labTestService.updateLabTest(id, data);
        setTest(response.test);
        showToast('Lab test updated successfully', 'success');
      } catch (err) {
        const message =
          err instanceof ApiError ? err.message : 'Failed to update lab test';
        setError(message);
        showToast(message, 'error');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [id, showToast]
  );

  const deactivateTest = useCallback(async () => {
    try {
      setLoading(true);
      await labTestService.deactivateLabTest(id);
      showToast('Lab test deactivated successfully', 'success');
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Failed to deactivate lab test';
      setError(message);
      showToast(message, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [id, showToast]);

  useEffect(() => {
    fetchTest();
  }, [fetchTest]);

  return {
    test,
    loading,
    error,
    updateTest,
    deactivateTest,
    refetch: fetchTest,
  };
}

/**
 * Hook for lab test CRUD actions
 */
export function useLabTestActions(): UseLabTestActionsResult {
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const { showToast } = useToast();

  const createTest = useCallback(
    async (data: CreateLabTestDto): Promise<LabTest | null> => {
      try {
        setCreating(true);
        const response = await labTestService.createLabTest(data);
        showToast('Lab test created successfully', 'success');
        return response.test;
      } catch (err) {
        const message =
          err instanceof ApiError ? err.message : 'Failed to create lab test';
        showToast(message, 'error');
        return null;
      } finally {
        setCreating(false);
      }
    },
    [showToast]
  );

  const updateTest = useCallback(
    async (id: string, data: UpdateLabTestDto): Promise<LabTest | null> => {
      try {
        setUpdating(true);
        const response = await labTestService.updateLabTest(id, data);
        showToast('Lab test updated successfully', 'success');
        return response.test;
      } catch (err) {
        const message =
          err instanceof ApiError ? err.message : 'Failed to update lab test';
        showToast(message, 'error');
        return null;
      } finally {
        setUpdating(false);
      }
    },
    [showToast]
  );

  const deactivateTest = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        setDeactivating(true);
        await labTestService.deactivateLabTest(id);
        showToast('Lab test deactivated successfully', 'success');
        return true;
      } catch (err) {
        const message =
          err instanceof ApiError
            ? err.message
            : 'Failed to deactivate lab test';
        showToast(message, 'error');
        return false;
      } finally {
        setDeactivating(false);
      }
    },
    [showToast]
  );

  return {
    creating,
    updating,
    deactivating,
    createTest,
    updateTest,
    deactivateTest,
  };
}

/**
 * Hook to fetch active lab tests only
 */
export function useActiveLabTests(): UseLabTestsResult {
  const params = useMemo(() => ({ activeOnly: true }), []);
  return useLabTests(params);
}

/**
 * Hook to fetch lab tests by category
 */
export function useLabTestsByCategory(category: string): UseLabTestsResult {
  const params = useMemo(() => ({ category, activeOnly: true }), [category]);
  return useLabTests(params);
}

/**
 * Hook to fetch all test categories
 */
export function useTestCategories(): UseTestCategoriesResult {
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await labTestService.getCategories();
      setCategories(data);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Failed to fetch categories';
      setError(message);
      console.error('Error fetching categories:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return {
    categories,
    loading,
    error,
  };
}

/**
 * Hook for searching lab tests by name
 */
export function useTestSearch(): UseTestSearchResult {
  const [tests, setTests] = useState<LabTest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (query: string) => {
    if (!query.trim()) {
      setTests([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await labTestService.searchLabTests(query);
      setTests(response.tests);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Failed to search lab tests';
      setError(message);
      console.error('Error searching lab tests:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    tests,
    loading,
    error,
    search,
  };
}

/**
 * Hook with debounced search for lab tests
 */
export function useDebouncedTestSearch(
  initialQuery = '',
  debounceMs = 300
): UseTestSearchResult & { query: string; setQuery: (q: string) => void } {
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const searchResult = useTestSearch();

  // Debounce query changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, debounceMs]);

  // Trigger search when debounced query changes
  useEffect(() => {
    if (debouncedQuery) {
      searchResult.search(debouncedQuery);
    }
  }, [debouncedQuery, searchResult]);

  return {
    ...searchResult,
    query,
    setQuery,
  };
}

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useToast } from '@/components/ui/Toast';
import {
  UseLabTestRequestsResult,
  UseLabTestRequestResult,
  UseTestRequestActionsResult,
  LabTestRequest,
} from '@/types/lab';
import {
  CreateLabTestRequestDto,
  GetTestRequestsParams,
  labTestRequestService,
  UpdateLabTestRequestDto,
} from './Index';
import { ApiError } from '@/services/api-client';

export function useLabTestRequests(
  params?: GetTestRequestsParams,
  autoFetch = true
): UseLabTestRequestsResult {
  const [requests, setRequests] = useState<LabTestRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await labTestRequestService.getTestRequests(params);
      // Cast specifically to LabTestRequest[] to ensure the rest of the
      // component tree receives the expected shape.
      setRequests((response?.requests as unknown as LabTestRequest[]) || []);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Failed to fetch test requests';
      setError(message);
      console.error('Error fetching test requests:', err);
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    if (autoFetch) {
      fetchRequests();
    }
  }, [autoFetch, fetchRequests]);

  return {
    requests,
    loading,
    error,
    refetch: fetchRequests,
  };
}

/**
 * Hook to fetch and manage a single lab test request
 */
export function useLabTestRequest(id: string): UseLabTestRequestResult {
  const [request, setRequest] = useState<LabTestRequest | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  const fetchRequest = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);
      const response = await labTestRequestService.getTestRequestById(id);
      setRequest(response.testRequest as any);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Failed to fetch test request';
      setError(message);
      console.error('Error fetching test request:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const updateRequest = useCallback(
    async (data: UpdateLabTestRequestDto) => {
      try {
        setLoading(true);
        const response = await labTestRequestService.updateTestRequest(
          id,
          data
        );
        setRequest(response.testRequest as any);
        showToast('Test request updated successfully', 'success');
      } catch (err) {
        const message =
          err instanceof ApiError
            ? err.message
            : 'Failed to update test request';
        setError(message);
        showToast(message, 'error');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [id, showToast]
  );

  const updateStatus = useCallback(
    async (status: LabTestRequest['status']) => {
      try {
        setLoading(true);
        const response = await labTestRequestService.updateStatus(id, status);
        setRequest(response.testRequest as any);
        showToast(`Status updated to ${status}`, 'success');
      } catch (err) {
        const message =
          err instanceof ApiError ? err.message : 'Failed to update status';
        setError(message);
        showToast(message, 'error');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [id, showToast]
  );

  const assignTechnician = useCallback(
    async (technicianId: string) => {
      try {
        setLoading(true);
        const response = await labTestRequestService.assignTechnician(
          id,
          technicianId
        );
        setRequest(response.testRequest as any);
        showToast('Technician assigned successfully', 'success');
      } catch (err) {
        const message =
          err instanceof ApiError ? err.message : 'Failed to assign technician';
        setError(message);
        showToast(message, 'error');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [id, showToast]
  );

  useEffect(() => {
    fetchRequest();
  }, [fetchRequest]);

  return {
    request,
    loading,
    error,
    updateRequest,
    updateStatus,
    assignTechnician,
    refetch: fetchRequest,
  };
}

/**
 * Hook for test request CRUD and workflow actions
 */
export function useTestRequestActions(): UseTestRequestActionsResult {
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const { showToast } = useToast();

  const createTestRequest = useCallback(
    async (data: CreateLabTestRequestDto): Promise<LabTestRequest | null> => {
      try {
        setCreating(true);
        const response = await labTestRequestService.createTestRequest(data);
        showToast('Test request created successfully', 'success');
        return response.testRequest as any;
      } catch (err) {
        const message =
          err instanceof ApiError
            ? err.message
            : 'Failed to create test request';
        showToast(message, 'error');
        return null;
      } finally {
        setCreating(false);
      }
    },
    [showToast]
  );

  const updateTestRequest = useCallback(
    async (
      id: string,
      data: UpdateLabTestRequestDto
    ): Promise<LabTestRequest | null> => {
      try {
        setUpdating(true);
        const response = await labTestRequestService.updateTestRequest(
          id,
          data
        );
        showToast('Test request updated successfully', 'success');
        return response.testRequest as any;
      } catch (err) {
        const message =
          err instanceof ApiError
            ? err.message
            : 'Failed to update test request';
        showToast(message, 'error');
        return null;
      } finally {
        setUpdating(false);
      }
    },
    [showToast]
  );

  const collectSample = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        setUpdating(true);
        await labTestRequestService.collectSample(id);
        showToast('Sample collected successfully', 'success');
        return true;
      } catch (err) {
        const message =
          err instanceof ApiError ? err.message : 'Failed to collect sample';
        showToast(message, 'error');
        return false;
      } finally {
        setUpdating(false);
      }
    },
    [showToast]
  );

  const startTest = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        setUpdating(true);
        await labTestRequestService.startTest(id);
        showToast('Test started successfully', 'success');
        return true;
      } catch (err) {
        const message =
          err instanceof ApiError ? err.message : 'Failed to start test';
        showToast(message, 'error');
        return false;
      } finally {
        setUpdating(false);
      }
    },
    [showToast]
  );

  const completeTest = useCallback(
    async (
      id: string,
      results: string,
      findings?: string
    ): Promise<boolean> => {
      try {
        setUpdating(true);
        await labTestRequestService.completeTest(id, results, findings);
        showToast('Test completed successfully', 'success');
        return true;
      } catch (err) {
        const message =
          err instanceof ApiError ? err.message : 'Failed to complete test';
        showToast(message, 'error');
        return false;
      } finally {
        setUpdating(false);
      }
    },
    [showToast]
  );

  const verifyTest = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        setUpdating(true);
        await labTestRequestService.verifyTest(id);
        showToast('Test verified successfully', 'success');
        return true;
      } catch (err) {
        const message =
          err instanceof ApiError ? err.message : 'Failed to verify test';
        showToast(message, 'error');
        return false;
      } finally {
        setUpdating(false);
      }
    },
    [showToast]
  );

  const cancelTest = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        setUpdating(true);
        await labTestRequestService.cancelTest(id);
        showToast('Test cancelled successfully', 'success');
        return true;
      } catch (err) {
        const message =
          err instanceof ApiError ? err.message : 'Failed to cancel test';
        showToast(message, 'error');
        return false;
      } finally {
        setUpdating(false);
      }
    },
    [showToast]
  );

  const assignTechnician = useCallback(
    async (id: string, technicianId: string): Promise<boolean> => {
      try {
        setUpdating(true);
        await labTestRequestService.assignTechnician(id, technicianId);
        showToast('Technician assigned successfully', 'success');
        return true;
      } catch (err) {
        const message =
          err instanceof ApiError ? err.message : 'Failed to assign technician';
        showToast(message, 'error');
        return false;
      } finally {
        setUpdating(false);
      }
    },
    [showToast]
  );

  return {
    creating,
    updating,
    createTestRequest,
    updateTestRequest,
    collectSample,
    startTest,
    completeTest,
    verifyTest,
    cancelTest,
    assignTechnician,
  };
}

/**
 * Hook to fetch pending test requests
 */
export function usePendingTestRequests(): UseLabTestRequestsResult {
  const [requests, setRequests] = useState<LabTestRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPendingRequests = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await labTestRequestService.getPendingTestRequests();
      setRequests(response.requests as any);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : 'Failed to fetch pending test requests';
      setError(message);
      console.error('Error fetching pending test requests:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPendingRequests();
  }, [fetchPendingRequests]);

  return {
    requests,
    loading,
    error,
    refetch: fetchPendingRequests,
  };
}

/**
 * Hook to fetch test requests by status
 */
export function useTestRequestsByStatus(
  status: LabTestRequest['status']
): UseLabTestRequestsResult {
  const params = useMemo(() => ({ status }), [status]);
  return useLabTestRequests(params);
}

/**
 * Hook to fetch test requests for a patient
 */
export function usePatientTestRequests(
  patientId: string
): UseLabTestRequestsResult {
  const params = useMemo(() => ({ patientId }), [patientId]);
  return useLabTestRequests(params);
}

/**
 * Hook to fetch test requests for a technician
 */
export function useTechnicianTestRequests(
  technicianId: string
): UseLabTestRequestsResult {
  const params = useMemo(() => ({ technicianId }), [technicianId]);
  return useLabTestRequests(params);
}

/**
 * Hook to fetch critical test requests
 */
export function useCriticalTestRequests(): UseLabTestRequestsResult {
  const [requests, setRequests] = useState<LabTestRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCriticalRequests = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await labTestRequestService.getCriticalTestRequests();
      setRequests(response.requests as any);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : 'Failed to fetch critical test requests';
      setError(message);
      console.error('Error fetching critical test requests:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCriticalRequests();
  }, [fetchCriticalRequests]);

  return {
    requests,
    loading,
    error,
    refetch: fetchCriticalRequests,
  };
}

/**
 * Hook to fetch overdue test requests
 */
export function useOverdueTestRequests(): UseLabTestRequestsResult {
  const [requests, setRequests] = useState<LabTestRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOverdueRequests = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await labTestRequestService.getOverdueTestRequests();
      setRequests(response.requests as any);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : 'Failed to fetch overdue test requests';
      setError(message);
      console.error('Error fetching overdue test requests:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOverdueRequests();
  }, [fetchOverdueRequests]);

  return {
    requests,
    loading,
    error,
    refetch: fetchOverdueRequests,
  };
}

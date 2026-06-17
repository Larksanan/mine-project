/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from 'react';
import {
  getMedicalHistory,
  getMedicalHistoryById,
  createMedicalHistory,
  updateMedicalHistory,
  deleteMedicalHistory,
  getMedicalHistorySummary,
  getMedicalHistoryStatus,
  getActiveConditions,
  getChronicConditions,
  getConditionsBySeverity,
  searchMedicalHistory,
  getRecentMedicalHistory,
} from '@/services/medicalHistory.Service';
import {
  MedicalHistoryRecord,
  CreateMedicalHistoryDto,
  UpdateMedicalHistoryDto,
  MedicalHistoryFilters,
  MedicalHistorySummary,
  MedicalHistoryStatusSummary,
  MedicalHistoryPagination,
} from '@/types/medicalHistory';

/**
 * Hook for fetching paginated medical history records with filters
 */
export function useMedicalHistory(filters?: MedicalHistoryFilters) {
  const [data, setData] = useState<MedicalHistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<MedicalHistoryPagination>({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getMedicalHistory(filters);

      if (response.success) {
        if (Array.isArray(response.data)) {
          setData(response.data);
        }
        if (response.pagination) {
          setPagination(response.pagination);
        }
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch medical history'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [JSON.stringify(filters)]);

  const refetch = () => {
    fetchData();
  };

  return { data, loading, error, pagination, refetch };
}

/**
 * Hook for fetching a single medical history record by ID
 */
export function useMedicalHistoryById(id: string | null) {
  const [data, setData] = useState<MedicalHistoryRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setData(null);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getMedicalHistoryById(id);

        if (response.success && !Array.isArray(response.data)) {
          setData(response.data ?? null);
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to fetch medical history record'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  return { data, loading, error };
}

/**
 * Hook for fetching medical history summary by NIC
 */
export function useMedicalHistorySummary(nic: string | null) {
  const [summary, setSummary] = useState<MedicalHistorySummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = async () => {
    if (!nic) return;

    try {
      setLoading(true);
      setError(null);
      const response = await getMedicalHistorySummary(nic);

      if (response.success && response.data) {
        setSummary(response.data);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to fetch medical history summary'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [nic]);

  return {
    summary,
    loading,
    error,
    refetch: fetchSummary,
  };
}

/**
 * Hook for fetching medical history status summary by NIC
 */
export function useMedicalHistoryStatus(nic: string | null) {
  const [statusData, setStatusData] =
    useState<MedicalHistoryStatusSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    if (!nic) return;

    try {
      setLoading(true);
      setError(null);
      const response = await getMedicalHistoryStatus(nic);

      if (response.success && response.data) {
        setStatusData(response.data as unknown as MedicalHistoryStatusSummary);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to fetch medical history status'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [nic]);

  return {
    statusData,
    loading,
    error,
    refetch: fetchStatus,
  };
}

/**
 * Hook for fetching a patient's complete medical history by NIC
 */
export function usePatientMedicalHistory(
  nic: string | null,
  limit: number = 100
) {
  const [data, setData] = useState<MedicalHistoryRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    chronic: 0,
    resolved: 0,
    mild: 0,
    moderate: 0,
    severe: 0,
  });

  const fetchPatientHistory = async () => {
    if (!nic) {
      setData([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await getMedicalHistory({
        nic,
        limit,
        page: 1,
      });

      if (response.success && Array.isArray(response.data)) {
        setData(response.data);

        // Calculate comprehensive stats
        const active = response.data.filter(r => r.status === 'active').length;
        const chronic = response.data.filter(
          r => r.status === 'chronic'
        ).length;
        const resolved = response.data.filter(
          r => r.status === 'resolved'
        ).length;
        const mild = response.data.filter(r => r.severity === 'mild').length;
        const moderate = response.data.filter(
          r => r.severity === 'moderate'
        ).length;
        const severe = response.data.filter(
          r => r.severity === 'severe'
        ).length;

        setStats({
          total: response.data.length,
          active,
          chronic,
          resolved,
          mild,
          moderate,
          severe,
        });
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to fetch patient medical history'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatientHistory();
  }, [nic, limit]);

  const refetch = () => {
    if (nic) {
      fetchPatientHistory();
    }
  };

  return { data, loading, error, stats, refetch };
}

/**
 * Hook for fetching active conditions by NIC
 */
export function useActiveConditions(nic: string | null) {
  const [data, setData] = useState<MedicalHistoryRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!nic) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getActiveConditions(nic);

        if (response.success && Array.isArray(response.data)) {
          setData(response.data);
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to fetch active conditions'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [nic]);

  return { data, loading, error };
}

/**
 * Hook for fetching chronic conditions by NIC
 */
export function useChronicConditions(nic: string | null) {
  const [data, setData] = useState<MedicalHistoryRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!nic) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getChronicConditions(nic);

        if (response.success && Array.isArray(response.data)) {
          setData(response.data);
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to fetch chronic conditions'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [nic]);

  return { data, loading, error };
}

/**
 * Hook for fetching conditions by severity
 */
export function useConditionsBySeverity(
  nic: string | null,
  severity: 'mild' | 'moderate' | 'severe'
) {
  const [data, setData] = useState<MedicalHistoryRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!nic) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getConditionsBySeverity(nic, severity);

        if (response.success && Array.isArray(response.data)) {
          setData(response.data);
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : `Failed to fetch ${severity} conditions`
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [nic, severity]);

  return { data, loading, error };
}

/**
 * Hook for searching medical history
 */
export function useMedicalHistorySearch(
  nic: string | null,
  searchTerm: string
) {
  const [data, setData] = useState<MedicalHistoryRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!nic || !searchTerm.trim()) {
      setData([]);
      return;
    }

    const search = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await searchMedicalHistory(nic, searchTerm);

        if (response.success && Array.isArray(response.data)) {
          setData(response.data);
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to search medical history'
        );
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(search, 500);
    return () => clearTimeout(debounceTimer);
  }, [nic, searchTerm]);

  return { data, loading, error };
}

/**
 * Hook for fetching recent medical history
 */
export function useRecentMedicalHistory(nic: string | null, limit: number = 5) {
  const [data, setData] = useState<MedicalHistoryRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!nic) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getRecentMedicalHistory(nic, limit);

        if (response.success && Array.isArray(response.data)) {
          setData(response.data);
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to fetch recent medical history'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [nic, limit]);

  return { data, loading, error };
}

/**
 * Hook for medical history CRUD operations
 */
export function useMedicalHistoryActions() {
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = async (data: CreateMedicalHistoryDto) => {
    try {
      setCreating(true);
      setError(null);

      if (!data.nic) {
        throw new Error('Patient NIC is required');
      }

      const response = await createMedicalHistory(data);

      if (!response.success) {
        throw new Error(
          response.message || 'Failed to create medical history record'
        );
      }

      return response;
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Failed to create medical history record';
      setError(errorMessage);
      throw err;
    } finally {
      setCreating(false);
    }
  };

  const update = async (id: string, data: UpdateMedicalHistoryDto) => {
    try {
      setUpdating(true);
      setError(null);
      const response = await updateMedicalHistory(id, data);

      if (!response.success) {
        throw new Error(
          response.message || 'Failed to update medical history record'
        );
      }

      return response;
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Failed to update medical history record';
      setError(errorMessage);
      throw err;
    } finally {
      setUpdating(false);
    }
  };

  const remove = async (id: string) => {
    try {
      setDeleting(true);
      setError(null);
      const response = await deleteMedicalHistory(id);

      if (!response.success) {
        throw new Error(
          response.message || 'Failed to delete medical history record'
        );
      }

      return response;
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Failed to delete medical history record';
      setError(errorMessage);
      throw err;
    } finally {
      setDeleting(false);
    }
  };

  const bulkCreate = async (records: CreateMedicalHistoryDto[]) => {
    try {
      setCreating(true);
      setError(null);

      // Validate all records have NIC
      const invalidRecords = records.filter(r => !r.nic);
      if (invalidRecords.length > 0) {
        throw new Error('All records must have a patient NIC');
      }

      const results = await Promise.all(
        records.map(record => createMedicalHistory(record))
      );

      const allSuccessful = results.every(r => r.success);

      if (!allSuccessful) {
        throw new Error('Some records failed to create');
      }

      return results;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to bulk create records';
      setError(errorMessage);
      throw err;
    } finally {
      setCreating(false);
    }
  };

  return {
    create,
    update,
    remove,
    bulkCreate,
    creating,
    updating,
    deleting,
    error,
  };
}

/**
 * Hook for managing medical history attachments
 */
export function useMedicalHistoryAttachments(recordId: string | null) {
  const [attachments, setAttachments] = useState<
    MedicalHistoryRecord['attachments']
  >([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadAttachment = async (_file: File) => {
    if (!recordId) return;

    try {
      setUploading(true);
      setError(null);

      // Implementation for file upload
      // const response = await uploadMedicalHistoryAttachment(recordId, file);
      // setAttachments(prev => [...prev, response.data]);

      // Placeholder for now
      console.log('Upload attachment:', recordId, _file.name);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to upload attachment'
      );
      throw err;
    } finally {
      setUploading(false);
    }
  };

  const removeAttachment = async (fileName: string) => {
    if (!recordId) return;

    try {
      // Implementation for attachment removal
      // await deleteMedicalHistoryAttachment(recordId, fileName);

      setAttachments(prev => prev?.filter(a => a.fileName !== fileName) || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to remove attachment'
      );
      throw err;
    }
  };

  return {
    attachments,
    uploadAttachment,
    removeAttachment,
    uploading,
    error,
  };
}

/**
 * Hook for medical history analytics
 */
export function useMedicalHistoryAnalytics(nic: string | null) {
  const [analytics, setAnalytics] = useState({
    conditionsByYear: [] as { year: number; count: number }[],
    commonConditions: [] as { condition: string; occurrences: number }[],
    monthlyTrend: [] as { month: string; count: number }[],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!nic) return;

    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await getMedicalHistory({ nic, limit: 1000 });

        if (response.success && Array.isArray(response.data)) {
          const records = response.data;

          // Conditions by year
          const yearMap = new Map<number, number>();
          // Common conditions
          const conditionMap = new Map<string, number>();
          // Monthly trend (last 12 months)
          const monthMap = new Map<string, number>();

          const now = new Date();
          const twelveMonthsAgo = new Date();
          twelveMonthsAgo.setMonth(now.getMonth() - 12);

          records.forEach(record => {
            // Year aggregation
            const year = new Date(record.diagnosisDate).getFullYear();
            yearMap.set(year, (yearMap.get(year) || 0) + 1);

            // Condition aggregation
            conditionMap.set(
              record.condition,
              (conditionMap.get(record.condition) || 0) + 1
            );

            // Monthly trend (last 12 months)
            const diagnosisDate = new Date(record.diagnosisDate);
            if (diagnosisDate >= twelveMonthsAgo) {
              const monthKey = `${diagnosisDate.getFullYear()}-${String(diagnosisDate.getMonth() + 1).padStart(2, '0')}`;
              monthMap.set(monthKey, (monthMap.get(monthKey) || 0) + 1);
            }
          });

          setAnalytics({
            conditionsByYear: Array.from(yearMap.entries())
              .map(([year, count]) => ({ year, count }))
              .sort((a, b) => b.year - a.year),
            commonConditions: Array.from(conditionMap.entries())
              .map(([condition, occurrences]) => ({ condition, occurrences }))
              .sort((a, b) => b.occurrences - a.occurrences)
              .slice(0, 10),
            monthlyTrend: Array.from(monthMap.entries())
              .map(([month, count]) => ({ month, count }))
              .sort((a, b) => a.month.localeCompare(b.month)),
          });
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to fetch analytics'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [nic]);

  return { analytics, loading, error };
}

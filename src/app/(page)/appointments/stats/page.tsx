'use client';

import React, { useState, useEffect } from 'react';
import { AppointmentStats } from '@/types/appointment';
import LoadingSpinner from '@/components/Loading';
import StatsHeader from '@/components/Appointment/stats/StatsHeader';
import KeyMetricsGrid from '@/components/Appointment/stats/KeyMetricsGrid';
import AdditionalMetrics from '@/components/Appointment/stats/AdditionalMetrics';
import DataBreakdown from '@/components/Appointment/stats/DataBreakdown';
import ChartPlaceholder from '@/components/Appointment/stats/ChartPlaceholder';
import ErrorComponent from '@/components/Error';

export default function AppointmentStatsPage() {
  const [stats, setStats] = useState<AppointmentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('week');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(
        `/api/doctor/appointments/stats?range=${timeRange}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }

      const result = await response.json();

      if (result.success) {
        setStats(result.data);
      } else {
        throw new Error(result.message || 'Failed to fetch stats');
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      setError(
        error instanceof Error ? error.message : 'Failed to fetch statistics'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  const handleTimeRangeChange = (range: 'week' | 'month' | 'year') => {
    setTimeRange(range);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorComponent message={error} />;
  }

  return (
    <div className='min-h-screen bg-gray-50 p-6'>
      <div className='max-w-7xl mx-auto'>
        <StatsHeader
          timeRange={timeRange}
          onTimeRangeChange={handleTimeRangeChange}
          onRefresh={handleRefresh}
          refreshing={refreshing}
        />

        {stats ? (
          <>
            <KeyMetricsGrid stats={stats} />
            <AdditionalMetrics stats={stats} />
            <DataBreakdown stats={stats} />
            <ChartPlaceholder timeRange={timeRange} />
          </>
        ) : (
          <div className='text-center py-12'>
            <p className='text-gray-500 text-lg'>
              No statistics data available
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

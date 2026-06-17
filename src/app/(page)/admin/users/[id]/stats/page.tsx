'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Loading from '@/components/Loading';
import Link from 'next/link';
import ErrorComponent from '@/components/Error';
import {
  FiUser,
  FiArrowLeft,
  FiActivity,
  FiTrendingUp,
  FiCalendar,
  FiUsers,
  FiCheckCircle,
  FiXCircle,
  FiBarChart2,
  FiPieChart,
  FiRefreshCw,
  FiDownload,
  FiFileText,
  FiAward,
  FiTarget,
} from 'react-icons/fi';

interface UserStats {
  userId: unknown;
  userName?: string;
  userEmail?: string;
  userRole?: string;
  userStatus?: string;
  accountCreated?: string;
  lastLogin?: string | null;
  isEmailVerified?: boolean;
  profileType: string;
  [key: string]: unknown;
}

interface AppointmentTrend {
  period: string;
  count: number;
}

interface RecentAppointment {
  id: unknown;
  patientName?: string;
  doctorName?: string;
  date?: string;
  status?: string;
  type?: string;
}

export default function UserStatsPage() {
  const params = useParams();
  const userId = params?.id as string;

  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: '',
  });

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (dateRange.startDate) params.append('startDate', dateRange.startDate);
      if (dateRange.endDate) params.append('endDate', dateRange.endDate);

      const response = await fetch(
        `/api/admin/users/${userId}/stats?${params}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch statistics');
      }

      setStats(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [userId, dateRange]);

  useEffect(() => {
    if (userId) {
      fetchStats();
    }
  }, [userId, fetchStats]);

  const handleExport = () => {
    if (!stats) return;

    const exportData = {
      user: {
        name: stats.userName,
        email: stats.userEmail,
        role: stats.userRole,
        status: stats.userStatus,
      },
      statistics: stats,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `user-stats-${userId}-${new Date().toISOString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return <Loading />;
  }

  if (error || !stats) {
    return <ErrorComponent message={error || 'Statistics not found'} />;
  }

  const renderDoctorStats = () => {
    const appointments = stats.appointments as {
      total?: number;
      completed?: number;
      cancelled?: number;
      upcoming?: number;
      completionRate?: string;
      statusDistribution?: Record<string, number>;
    };

    const patients = stats.patients as {
      total?: number;
      unique?: number;
    };

    const performance = stats.performance as {
      averageConsultationTime?: string;
      appointmentTrends?: AppointmentTrend[];
    };

    const recentActivity = stats.recentActivity as {
      recentAppointments?: RecentAppointment[];
    };

    return (
      <>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6'>
          <div className='bg-white rounded-lg shadow p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-gray-600'>Total Appointments</p>
                <p className='text-2xl font-bold text-blue-600'>
                  {appointments?.total || 0}
                </p>
              </div>
              <FiCalendar className='w-10 h-10 text-blue-600' />
            </div>
          </div>

          <div className='bg-white rounded-lg shadow p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-gray-600'>Completed</p>
                <p className='text-2xl font-bold text-green-600'>
                  {appointments?.completed || 0}
                </p>
              </div>
              <FiCheckCircle className='w-10 h-10 text-green-600' />
            </div>
          </div>

          <div className='bg-white rounded-lg shadow p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-gray-600'>Total Patients</p>
                <p className='text-2xl font-bold text-purple-600'>
                  {patients?.total || 0}
                </p>
              </div>
              <FiUsers className='w-10 h-10 text-purple-600' />
            </div>
          </div>

          <div className='bg-white rounded-lg shadow p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-gray-600'>Completion Rate</p>
                <p className='text-2xl font-bold text-indigo-600'>
                  {appointments?.completionRate || '0%'}
                </p>
              </div>
              <FiTrendingUp className='w-10 h-10 text-indigo-600' />
            </div>
          </div>
        </div>

        {appointments?.statusDistribution && (
          <div className='bg-white rounded-lg shadow p-6 mb-6'>
            <h3 className='text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2'>
              <FiPieChart className='w-5 h-5' />
              Appointment Status Distribution
            </h3>
            <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
              {Object.entries(appointments.statusDistribution).map(
                ([status, count]) => (
                  <div key={status} className='p-4 bg-gray-50 rounded-lg'>
                    <p className='text-sm text-gray-600'>{status}</p>
                    <p className='text-xl font-bold text-gray-900'>{count}</p>
                  </div>
                )
              )}
            </div>
          </div>
        )}

        <div className='bg-white rounded-lg shadow p-6 mb-6'>
          <h3 className='text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2'>
            <FiBarChart2 className='w-5 h-5' />
            Performance Metrics
          </h3>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div>
              <p className='text-sm text-gray-600 mb-2'>
                Average Consultation Time
              </p>
              <p className='text-2xl font-bold text-blue-600'>
                {performance?.averageConsultationTime || 'N/A'}
              </p>
            </div>
            <div>
              <p className='text-sm text-gray-600 mb-2'>Unique Patients</p>
              <p className='text-2xl font-bold text-purple-600'>
                {patients?.unique || 0}
              </p>
            </div>
          </div>
        </div>

        {performance?.appointmentTrends &&
          performance.appointmentTrends.length > 0 && (
            <div className='bg-white rounded-lg shadow p-6 mb-6'>
              <h3 className='text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2'>
                <FiTrendingUp className='w-5 h-5' />
                Appointment Trends (Last 12 Months)
              </h3>
              <div className='space-y-2'>
                {performance.appointmentTrends.map(trend => (
                  <div
                    key={trend.period}
                    className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'
                  >
                    <span className='text-sm font-medium text-gray-700'>
                      {trend.period}
                    </span>
                    <span className='text-sm font-bold text-blue-600'>
                      {trend.count} appointments
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        {recentActivity?.recentAppointments &&
          recentActivity.recentAppointments.length > 0 && (
            <div className='bg-white rounded-lg shadow p-6 mb-6'>
              <h3 className='text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2'>
                <FiCalendar className='w-5 h-5' />
                Recent Appointments
              </h3>
              <div className='space-y-3'>
                {recentActivity.recentAppointments.map((apt, index) => (
                  <div
                    key={index}
                    className='p-4 border border-gray-200 rounded-lg hover:bg-gray-50'
                  >
                    <div className='flex items-center justify-between'>
                      <div>
                        <p className='font-medium text-gray-900'>
                          {apt.patientName}
                        </p>
                        <p className='text-sm text-gray-600'>
                          {apt.type || 'Consultation'}
                        </p>
                      </div>
                      <div className='text-right'>
                        <p className='text-sm text-gray-600'>
                          {apt.date
                            ? new Date(apt.date).toLocaleDateString()
                            : 'N/A'}
                        </p>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            apt.status === 'COMPLETED'
                              ? 'bg-green-100 text-green-800'
                              : apt.status === 'SCHEDULED'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {apt.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
      </>
    );
  };

  const renderPatientStats = () => {
    const personalInfo = stats.personalInfo as {
      age?: number | null;
      gender?: string;
      bloodType?: string;
      maritalStatus?: string;
      occupation?: string;
    };

    const appointments = stats.appointments as {
      total?: number;
      completed?: number;
      upcoming?: number;
      lastVisit?: string;
    };

    const engagement = stats.engagement as {
      doctorsVisited?: number;
      isActive?: boolean;
    };

    const recentActivity = stats.recentActivity as {
      appointmentHistory?: RecentAppointment[];
    };

    const medical = stats.medical as {
      allergies?: string[];
      chronicConditions?: string[];
      currentMedications?: string[];
    };

    return (
      <>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6'>
          <div className='bg-white rounded-lg shadow p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-gray-600'>Total Appointments</p>
                <p className='text-2xl font-bold text-blue-600'>
                  {appointments?.total || 0}
                </p>
              </div>
              <FiCalendar className='w-10 h-10 text-blue-600' />
            </div>
          </div>

          <div className='bg-white rounded-lg shadow p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-gray-600'>Completed</p>
                <p className='text-2xl font-bold text-green-600'>
                  {appointments?.completed || 0}
                </p>
              </div>
              <FiCheckCircle className='w-10 h-10 text-green-600' />
            </div>
          </div>

          <div className='bg-white rounded-lg shadow p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-gray-600'>Doctors Visited</p>
                <p className='text-2xl font-bold text-purple-600'>
                  {engagement?.doctorsVisited || 0}
                </p>
              </div>
              <FiUsers className='w-10 h-10 text-purple-600' />
            </div>
          </div>

          <div className='bg-white rounded-lg shadow p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-gray-600'>Status</p>
                <p className='text-sm font-bold text-indigo-600'>
                  {engagement?.isActive ? 'Active' : 'Inactive'}
                </p>
              </div>
              <FiActivity className='w-10 h-10 text-indigo-600' />
            </div>
          </div>
        </div>

        <div className='bg-white rounded-lg shadow p-6 mb-6'>
          <h3 className='text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2'>
            <FiUser className='w-5 h-5' />
            Personal Information
          </h3>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
            <div>
              <p className='text-sm text-gray-600'>Age</p>
              <p className='text-lg font-medium text-gray-900'>
                {personalInfo?.age || 'N/A'}
              </p>
            </div>
            <div>
              <p className='text-sm text-gray-600'>Gender</p>
              <p className='text-lg font-medium text-gray-900'>
                {personalInfo?.gender || 'N/A'}
              </p>
            </div>
            <div>
              <p className='text-sm text-gray-600'>Blood Type</p>
              <p className='text-lg font-medium text-gray-900'>
                {personalInfo?.bloodType || 'N/A'}
              </p>
            </div>
            <div>
              <p className='text-sm text-gray-600'>Marital Status</p>
              <p className='text-lg font-medium text-gray-900'>
                {personalInfo?.maritalStatus || 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {medical && (
          <div className='bg-white rounded-lg shadow p-6 mb-6'>
            <h3 className='text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2'>
              <FiFileText className='w-5 h-5' />
              Medical Information
            </h3>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
              <div>
                <p className='text-sm font-medium text-gray-600 mb-2'>
                  Allergies
                </p>
                {medical.allergies && medical.allergies.length > 0 ? (
                  <ul className='list-disc list-inside text-sm text-gray-900'>
                    {medical.allergies.map((allergy, index) => (
                      <li key={index}>{allergy}</li>
                    ))}
                  </ul>
                ) : (
                  <p className='text-sm text-gray-500'>None reported</p>
                )}
              </div>
              <div>
                <p className='text-sm font-medium text-gray-600 mb-2'>
                  Chronic Conditions
                </p>
                {medical.chronicConditions &&
                medical.chronicConditions.length > 0 ? (
                  <ul className='list-disc list-inside text-sm text-gray-900'>
                    {medical.chronicConditions.map((condition, index) => (
                      <li key={index}>{condition}</li>
                    ))}
                  </ul>
                ) : (
                  <p className='text-sm text-gray-500'>None reported</p>
                )}
              </div>
              <div>
                <p className='text-sm font-medium text-gray-600 mb-2'>
                  Current Medications
                </p>
                {medical.currentMedications &&
                medical.currentMedications.length > 0 ? (
                  <ul className='list-disc list-inside text-sm text-gray-900'>
                    {medical.currentMedications.map((medication, index) => (
                      <li key={index}>{medication}</li>
                    ))}
                  </ul>
                ) : (
                  <p className='text-sm text-gray-500'>None reported</p>
                )}
              </div>
            </div>
          </div>
        )}

        {recentActivity?.appointmentHistory &&
          recentActivity.appointmentHistory.length > 0 && (
            <div className='bg-white rounded-lg shadow p-6 mb-6'>
              <h3 className='text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2'>
                <FiCalendar className='w-5 h-5' />
                Recent Appointment History
              </h3>
              <div className='space-y-3'>
                {recentActivity.appointmentHistory.map((apt, index) => (
                  <div
                    key={index}
                    className='p-4 border border-gray-200 rounded-lg hover:bg-gray-50'
                  >
                    <div className='flex items-center justify-between'>
                      <div>
                        <p className='font-medium text-gray-900'>
                          Dr. {apt.doctorName}
                        </p>
                        <p className='text-sm text-gray-600'>
                          {apt.type || 'Consultation'}
                        </p>
                      </div>
                      <div className='text-right'>
                        <p className='text-sm text-gray-600'>
                          {apt.date
                            ? new Date(apt.date).toLocaleDateString()
                            : 'N/A'}
                        </p>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            apt.status === 'COMPLETED'
                              ? 'bg-green-100 text-green-800'
                              : apt.status === 'SCHEDULED'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {apt.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
      </>
    );
  };

  const renderReceptionistStats = () => {
    const employmentInfo = stats.employmentInfo as {
      employeeId?: string;
      department?: string;
      shift?: string;
      employmentStatus?: string;
      joinDate?: string;
    };

    const performance = stats.performance as {
      currentAppointments?: number;
      maxAppointmentsPerDay?: number;
      metrics?: Record<string, unknown>;
    };

    return (
      <>
        <div className='bg-white rounded-lg shadow p-6 mb-6'>
          <h3 className='text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2'>
            <FiUser className='w-5 h-5' />
            Employment Information
          </h3>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
            <div>
              <p className='text-sm text-gray-600'>Employee ID</p>
              <p className='text-lg font-medium text-gray-900'>
                {employmentInfo?.employeeId || 'N/A'}
              </p>
            </div>
            <div>
              <p className='text-sm text-gray-600'>Department</p>
              <p className='text-lg font-medium text-gray-900'>
                {employmentInfo?.department || 'N/A'}
              </p>
            </div>
            <div>
              <p className='text-sm text-gray-600'>Shift</p>
              <p className='text-lg font-medium text-gray-900'>
                {employmentInfo?.shift || 'N/A'}
              </p>
            </div>
            <div>
              <p className='text-sm text-gray-600'>Status</p>
              <p className='text-lg font-medium text-gray-900'>
                {employmentInfo?.employmentStatus || 'N/A'}
              </p>
            </div>
          </div>
        </div>

        <div className='bg-white rounded-lg shadow p-6 mb-6'>
          <h3 className='text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2'>
            <FiTarget className='w-5 h-5' />
            Performance
          </h3>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div>
              <p className='text-sm text-gray-600 mb-2'>Current Appointments</p>
              <p className='text-2xl font-bold text-blue-600'>
                {performance?.currentAppointments || 0}
              </p>
            </div>
            <div>
              <p className='text-sm text-gray-600 mb-2'>Max Per Day</p>
              <p className='text-2xl font-bold text-purple-600'>
                {performance?.maxAppointmentsPerDay || 0}
              </p>
            </div>
          </div>
        </div>
      </>
    );
  };

  const renderAdminStats = () => {
    const adminActivity = stats.adminActivity as {
      usersCreated?: number;
      recentActions?: Array<{
        action: string;
        target?: string;
        targetRole?: string;
        timestamp?: string;
      }>;
    };

    return (
      <>
        <div className='bg-white rounded-lg shadow p-6 mb-6'>
          <h3 className='text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2'>
            <FiAward className='w-5 h-5' />
            Admin Activity
          </h3>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div className='p-6 bg-blue-50 rounded-lg'>
              <p className='text-sm text-gray-600 mb-2'>Users Created</p>
              <p className='text-3xl font-bold text-blue-600'>
                {adminActivity?.usersCreated || 0}
              </p>
            </div>
          </div>
        </div>

        {adminActivity?.recentActions &&
          adminActivity.recentActions.length > 0 && (
            <div className='bg-white rounded-lg shadow p-6 mb-6'>
              <h3 className='text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2'>
                <FiActivity className='w-5 h-5' />
                Recent Actions
              </h3>
              <div className='space-y-3'>
                {adminActivity.recentActions.map((action, index) => (
                  <div
                    key={index}
                    className='p-4 border border-gray-200 rounded-lg'
                  >
                    <div className='flex items-center justify-between'>
                      <div>
                        <p className='font-medium text-gray-900'>
                          {action.action}
                        </p>
                        <p className='text-sm text-gray-600'>
                          {action.target} ({action.targetRole})
                        </p>
                      </div>
                      <p className='text-sm text-gray-500'>
                        {action.timestamp
                          ? new Date(action.timestamp).toLocaleDateString()
                          : 'N/A'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
      </>
    );
  };

  return (
    <div className='min-h-screen bg-gray-50 p-6'>
      <div className='max-w-7xl mx-auto'>
        <div className='mb-6'>
          <Link href={`/admin/users/${userId}`}>
            <button className='flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4'>
              <FiArrowLeft className='w-5 h-5' />
              Back to User Details
            </button>
          </Link>

          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-3xl font-bold text-gray-900 flex items-center gap-2'>
                <FiBarChart2 className='w-8 h-8' />
                User Statistics
              </h1>
              <p className='text-gray-600 mt-1'>
                Detailed analytics for {stats.userName}
              </p>
            </div>
            <div className='flex items-center gap-3'>
              <button
                onClick={handleExport}
                className='flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50'
              >
                <FiDownload className='w-5 h-5' />
                Export
              </button>
              <button
                onClick={fetchStats}
                disabled={loading}
                className='flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50'
              >
                <FiRefreshCw
                  className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`}
                />
                Refresh
              </button>
            </div>
          </div>
        </div>

        <div className='bg-white rounded-lg shadow p-4 mb-6'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Start Date
              </label>
              <input
                type='date'
                value={dateRange.startDate}
                onChange={e =>
                  setDateRange(prev => ({ ...prev, startDate: e.target.value }))
                }
                className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500'
              />
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                End Date
              </label>
              <input
                type='date'
                value={dateRange.endDate}
                onChange={e =>
                  setDateRange(prev => ({ ...prev, endDate: e.target.value }))
                }
                className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500'
              />
            </div>
          </div>
        </div>

        <div className='bg-white rounded-lg shadow p-6 mb-6'>
          <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
            <div>
              <p className='text-sm text-gray-600'>User</p>
              <p className='text-lg font-medium text-gray-900'>
                {stats.userName}
              </p>
            </div>
            <div>
              <p className='text-sm text-gray-600'>Role</p>
              <p className='text-lg font-medium text-gray-900'>
                {stats.userRole}
              </p>
            </div>
            <div>
              <p className='text-sm text-gray-600'>Status</p>
              <p className='text-lg font-medium text-gray-900'>
                {stats.userStatus}
              </p>
            </div>
            <div>
              <p className='text-sm text-gray-600'>Email Verified</p>
              <p className='text-lg font-medium text-gray-900'>
                {stats.isEmailVerified ? (
                  <FiCheckCircle className='inline w-5 h-5 text-green-600' />
                ) : (
                  <FiXCircle className='inline w-5 h-5 text-gray-400' />
                )}
              </p>
            </div>
          </div>
        </div>

        {stats.profileType === 'DOCTOR' && renderDoctorStats()}
        {stats.profileType === 'PATIENT' && renderPatientStats()}
        {stats.profileType === 'RECEPTIONIST' && renderReceptionistStats()}
        {stats.profileType === 'ADMIN' && renderAdminStats()}
      </div>
    </div>
  );
}

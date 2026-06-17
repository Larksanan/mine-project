/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  FiActivity as Activity,
  FiClock as Clock,
  FiCheckCircle as CheckCircle,
  FiAlertCircle as AlertCircle,
  FiUsers as Users,
  FiFileText as FileText,
  FiTrendingUp as TrendingUp,
  FiCalendar as Calendar,
  FiSearch as Search,
  FiFilter as Filter,
  FiArrowRight as ArrowRight,
} from 'react-icons/fi';
import Loading from '@/components/ui/Loading';
import Toast from '@/components/ui/Toast';

interface LabTestRequest {
  _id: string;
  patient: {
    fullName: string;
    email: string;
    nic: string;
  };
  test: {
    name: string;
    category: string;
    testCode: string;
  };
  status: string;
  priority: string;
  requestedDate: string;
  scheduledDate?: string;
  createdAt: string;
}

interface DashboardStats {
  totalAssigned: number;
  pending: number;
  inProgress: number;
  completed: number;
  todayTests: number;
  urgentTests: number;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; icon: any }
> = {
  PENDING: {
    label: 'Pending',
    color: 'text-yellow-700',
    bg: 'bg-yellow-50',
    icon: Clock,
  },
  IN_PROGRESS: {
    label: 'In Progress',
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    icon: Activity,
  },
  COMPLETED: {
    label: 'Completed',
    color: 'text-green-700',
    bg: 'bg-green-50',
    icon: CheckCircle,
  },
  REQUESTED: {
    label: 'Requested',
    color: 'text-purple-700',
    bg: 'bg-purple-50',
    icon: FileText,
  },
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  NORMAL: { label: 'Normal', color: 'text-blue-600' },
  HIGH: { label: 'High', color: 'text-orange-600' },
  URGENT: { label: 'Urgent', color: 'text-orange-600' },
  CRITICAL: { label: 'Critical', color: 'text-red-600' },
  STAT: { label: 'STAT', color: 'text-red-600' },
};

export default function LabTechDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalAssigned: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
    todayTests: 0,
    urgentTests: 0,
  });
  const [allTests, setAllTests] = useState<LabTestRequest[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({
    show: false,
    message: '',
    type: 'info',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated') {
      if (session?.user?.role !== 'LABTECH') {
        router.push('/dashboard');
      } else {
        fetchDashboardData();
      }
    }
  }, [status, session, router]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch lab test requests assigned to this technician
      const response = await fetch(
        `/api/lab/lab-test-requests?technicianId=${session?.user?.id}`
      );
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch data');
      }

      const requests = result.requests || [];

      // Calculate stats
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const calculatedStats: DashboardStats = {
        totalAssigned: requests.length,
        pending: requests.filter(
          (r: LabTestRequest) =>
            r.status === 'PENDING' || r.status === 'REQUESTED'
        ).length,
        inProgress: requests.filter(
          (r: LabTestRequest) => r.status === 'IN_PROGRESS'
        ).length,
        completed: requests.filter(
          (r: LabTestRequest) => r.status === 'COMPLETED'
        ).length,
        todayTests: requests.filter((r: LabTestRequest) => {
          const schedDate = r.scheduledDate ? new Date(r.scheduledDate) : null;
          if (schedDate) {
            schedDate.setHours(0, 0, 0, 0);
            return schedDate.getTime() === today.getTime();
          }
          return false;
        }).length,
        urgentTests: requests.filter((r: LabTestRequest) =>
          ['URGENT', 'CRITICAL', 'STAT', 'HIGH'].includes(r.priority)
        ).length,
      };

      setStats(calculatedStats);

      // Store all tests and sort by date
      const sortedTests = [...requests].sort(
        (a: LabTestRequest, b: LabTestRequest) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setAllTests(sortedTests);
    } catch (err: any) {
      setToast({
        show: true,
        message: err.message || 'Failed to load dashboard data',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const getFilteredTests = () => {
    let filtered = [...allTests];

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(test => test.status === filterStatus);
    }

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        test =>
          test.patient?.fullName
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          test.patient?.nic
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          test.test?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          test.test?.testCode?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  };

  if (loading || status === 'loading') {
    return (
      <div className='min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center'>
        <Loading />
      </div>
    );
  }

  // Show all matches if searching/filtering, otherwise show top 10
  const filteredTests = getFilteredTests().slice(
    0,
    searchQuery || filterStatus !== 'all' ? undefined : 10
  );

  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8 px-4 sm:px-6 lg:px-8'>
      {/* Decorative background */}
      <div className='fixed inset-0 overflow-hidden pointer-events-none'>
        <div className='absolute -top-40 -right-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob'></div>
        <div className='absolute -bottom-40 -left-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000'></div>
      </div>

      {/* Header */}
      <div className='max-w-7xl mx-auto mb-8 relative z-10'>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'
        >
          <div>
            <h1 className='text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent'>
              Lab Technician Dashboard
            </h1>
            <p className='text-gray-600 mt-2'>
              Welcome back, {session?.user?.name || 'Lab Technician'}
            </p>
          </div>
          <div className='flex items-center gap-3'>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={fetchDashboardData}
              className='px-6 py-3 bg-white text-gray-700 font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all'
            >
              Refresh
            </motion.button>
            <Link href='/labtestrequests'>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className='px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all'
              >
                View All Tests
              </motion.button>
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Stats Grid */}
      <div className='max-w-7xl mx-auto mb-8 relative z-10'>
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6'>
          {/* Total Assigned */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className='bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all'
          >
            <div className='flex items-center justify-between mb-3'>
              <div className='p-3 bg-blue-50 rounded-xl'>
                <Activity className='w-6 h-6 text-blue-600' />
              </div>
            </div>
            <h3 className='text-gray-600 text-sm font-medium mb-1'>
              Total Assigned
            </h3>
            <p className='text-3xl font-bold text-gray-800'>
              {stats.totalAssigned}
            </p>
          </motion.div>

          {/* Pending */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className='bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all'
          >
            <div className='flex items-center justify-between mb-3'>
              <div className='p-3 bg-yellow-50 rounded-xl'>
                <Clock className='w-6 h-6 text-yellow-600' />
              </div>
            </div>
            <h3 className='text-gray-600 text-sm font-medium mb-1'>Pending</h3>
            <p className='text-3xl font-bold text-gray-800'>{stats.pending}</p>
          </motion.div>

          {/* In Progress */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className='bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all'
          >
            <div className='flex items-center justify-between mb-3'>
              <div className='p-3 bg-blue-50 rounded-xl'>
                <TrendingUp className='w-6 h-6 text-blue-600' />
              </div>
            </div>
            <h3 className='text-gray-600 text-sm font-medium mb-1'>
              In Progress
            </h3>
            <p className='text-3xl font-bold text-gray-800'>
              {stats.inProgress}
            </p>
          </motion.div>

          {/* Completed */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className='bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all'
          >
            <div className='flex items-center justify-between mb-3'>
              <div className='p-3 bg-green-50 rounded-xl'>
                <CheckCircle className='w-6 h-6 text-green-600' />
              </div>
            </div>
            <h3 className='text-gray-600 text-sm font-medium mb-1'>
              Completed
            </h3>
            <p className='text-3xl font-bold text-gray-800'>
              {stats.completed}
            </p>
          </motion.div>

          {/* Today's Tests */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className='bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all'
          >
            <div className='flex items-center justify-between mb-3'>
              <div className='p-3 bg-purple-50 rounded-xl'>
                <Calendar className='w-6 h-6 text-purple-600' />
              </div>
            </div>
            <h3 className='text-gray-600 text-sm font-medium mb-1'>Today</h3>
            <p className='text-3xl font-bold text-gray-800'>
              {stats.todayTests}
            </p>
          </motion.div>

          {/* Urgent Tests */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className='bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all'
          >
            <div className='flex items-center justify-between mb-3'>
              <div className='p-3 bg-red-50 rounded-xl'>
                <AlertCircle className='w-6 h-6 text-red-600' />
              </div>
            </div>
            <h3 className='text-gray-600 text-sm font-medium mb-1'>Urgent</h3>
            <p className='text-3xl font-bold text-gray-800'>
              {stats.urgentTests}
            </p>
          </motion.div>
        </div>
      </div>

      {/* Recent Tests Section */}
      <div className='max-w-7xl mx-auto relative z-10'>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className='bg-white rounded-3xl shadow-xl overflow-hidden'
        >
          {/* Header */}
          <div className='p-6 border-b border-gray-100'>
            <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4'>
              <div>
                <h2 className='text-2xl font-bold text-gray-800 flex items-center gap-2'>
                  <Users className='w-7 h-7 text-blue-600' />
                  Recent Test Requests
                </h2>
                <p className='text-gray-600 text-sm mt-1'>
                  Your assigned laboratory tests
                </p>
              </div>

              {/* Filters */}
              <div className='flex flex-col sm:flex-row gap-3'>
                {/* Search */}
                <div className='relative'>
                  <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400' />
                  <input
                    type='text'
                    placeholder='Search...'
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className='pl-10 pr-4 py-2 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors w-full sm:w-64'
                  />
                </div>

                {/* Status Filter */}
                <div className='relative'>
                  <Filter className='absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400' />
                  <select
                    value={filterStatus}
                    onChange={e => setFilterStatus(e.target.value)}
                    className='pl-10 pr-4 py-2 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors appearance-none bg-white w-full sm:w-48'
                  >
                    <option value='all'>All Status</option>
                    <option value='PENDING'>Pending</option>
                    <option value='REQUESTED'>Requested</option>
                    <option value='IN_PROGRESS'>In Progress</option>
                    <option value='COMPLETED'>Completed</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Tests List */}
          <div className='divide-y divide-gray-100'>
            {filteredTests.length === 0 ? (
              <div className='p-12 text-center'>
                <FileText className='w-16 h-16 text-gray-300 mx-auto mb-4' />
                <h3 className='text-xl font-semibold text-gray-800 mb-2'>
                  No Test Requests Found
                </h3>
                <p className='text-gray-600'>
                  {searchQuery || filterStatus !== 'all'
                    ? 'Try adjusting your filters'
                    : 'You have no assigned test requests at the moment'}
                </p>
              </div>
            ) : (
              filteredTests.map((test, index) => {
                const statusConfig =
                  STATUS_CONFIG[test.status] || STATUS_CONFIG.PENDING;
                const StatusIcon = statusConfig.icon;
                const priorityConfig =
                  PRIORITY_CONFIG[test.priority] || PRIORITY_CONFIG.NORMAL;

                return (
                  <motion.div
                    key={test._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className='p-6 hover:bg-gray-50 transition-colors'
                  >
                    <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4'>
                      <div className='flex-1'>
                        <div className='flex items-start gap-4'>
                          <div
                            className={`p-3 ${statusConfig.bg} rounded-xl shrink-0`}
                          >
                            <StatusIcon
                              className={`w-6 h-6 ${statusConfig.color}`}
                            />
                          </div>

                          <div className='flex-1 min-w-0'>
                            <div className='flex items-center gap-3 mb-2'>
                              <h3 className='text-lg font-bold text-gray-800'>
                                {test.test?.name}
                              </h3>
                              <span
                                className={`text-xs font-semibold ${priorityConfig.color}`}
                              >
                                {priorityConfig.label}
                              </span>
                            </div>

                            <div className='flex flex-wrap items-center gap-4 text-sm text-gray-600'>
                              <span className='flex items-center gap-1'>
                                <Users className='w-4 h-4' />
                                {test.patient?.fullName}
                              </span>
                              <span className='flex items-center gap-1'>
                                <FileText className='w-4 h-4' />
                                {test.test?.testCode}
                              </span>
                              <span className='flex items-center gap-1'>
                                <Calendar className='w-4 h-4' />
                                {new Date(
                                  test.requestedDate
                                ).toLocaleDateString()}
                              </span>
                            </div>

                            <div className='mt-2'>
                              <span className='inline-block px-3 py-1 bg-purple-50 text-purple-700 text-xs rounded-lg font-medium'>
                                {test.test?.category}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className='flex items-center gap-3'>
                        <span
                          className={`px-4 py-2 ${statusConfig.bg} ${statusConfig.color} text-sm font-semibold rounded-xl`}
                        >
                          {statusConfig.label}
                        </span>
                        <Link href={`/labtestrequests/${test._id}`}>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className='p-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all'
                          >
                            <ArrowRight className='w-5 h-5' />
                          </motion.button>
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>

          {/* View All Link */}
          {filteredTests.length > 0 && (
            <div className='p-6 bg-gray-50 border-t border-gray-100'>
              <Link
                href='/labtestrequests'
                className='flex items-center justify-center gap-2 text-blue-600 hover:text-blue-700 font-semibold transition-colors'
              >
                View All Test Requests
                <ArrowRight className='w-5 h-5' />
              </Link>
            </div>
          )}
        </motion.div>
      </div>

      {/* Toast */}
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(prev => ({ ...prev, show: false }))}
        />
      )}
    </div>
  );
}

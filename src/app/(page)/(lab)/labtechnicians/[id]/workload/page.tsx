/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  FiArrowLeft as ArrowLeft,
  FiActivity as Activity,
  FiUser as User,
  FiClock as Clock,
  FiCheckCircle as CheckCircle,
  FiAlertCircle as AlertCircle,
  FiTrendingUp as TrendingUp,
  FiTrendingDown as TrendingDown,
  FiRefreshCw as RefreshCw,
  FiBarChart2 as BarChart,
  FiCalendar as Calendar,
  FiAward as Award,
  FiTarget as Target,
  FiZap as Zap,
  FiCpu as Cpu,
  FiPieChart as PieChart,
  FiMail as Mail,
  FiPhone as Phone,
} from 'react-icons/fi';
import Loading from '@/components/ui/Loading';
import Toast from '@/components/ui/Toast';

interface Technician {
  _id: string;
  id: string;
  name: string;
  employeeId: string;
  email: string;
  phone: string;
  specialization: string[];
  qualification: string;
  certifications: string[];
  yearsOfExperience: number;
  status: 'AVAILABLE' | 'BUSY' | 'OFFLINE' | 'ON_LEAVE';
  shift: 'GENERAL' | 'MORNING' | 'EVENING' | 'NIGHT';
  isAvailable: boolean;
  maxConcurrentTests: number;
  currentWorkload: number;
  performanceScore: number;
  efficiency: number;
  isLicenseExpired: boolean;
  joinedDate: string;
  notes?: string;
  user?: {
    id: string;
    name: string;
    email: string;
    nic: string;
    phone: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface WorkloadMetrics {
  utilizationRate: number;
  remainingCapacity: number;
  workloadTrend: 'increasing' | 'decreasing' | 'stable';
  averageTestsPerDay: number;
  peakWorkloadTime: string;
  productivityScore: number;
  taskCompletionRate: number;
  overloadRisk: 'low' | 'medium' | 'high';
  capacityStatus: string;
  recommendedAction: string;
}

interface TimelineEntry {
  date: string;
  workload: number;
  capacity: number;
  status: string;
  utilizationRate: number;
}

const STATUS_CONFIG = {
  AVAILABLE: {
    color: 'emerald',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    icon: CheckCircle,
    label: 'Available',
  },
  BUSY: {
    color: 'amber',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    icon: Activity,
    label: 'Busy',
  },
  OFFLINE: {
    color: 'slate',
    bg: 'bg-slate-50',
    text: 'text-slate-700',
    border: 'border-slate-200',
    icon: AlertCircle,
    label: 'Offline',
  },
  ON_LEAVE: {
    color: 'orange',
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    border: 'border-orange-200',
    icon: Calendar,
    label: 'On Leave',
  },
};

const SHIFT_CONFIG = {
  GENERAL: {
    label: 'General Shift',
    color: 'blue',
    time: 'Flexible hours',
    peak: '10:00 AM - 2:00 PM',
  },
  MORNING: {
    label: 'Morning Shift',
    color: 'amber',
    time: '6:00 AM - 2:00 PM',
    peak: '9:00 AM - 11:00 AM',
  },
  EVENING: {
    label: 'Evening Shift',
    color: 'purple',
    time: '2:00 PM - 10:00 PM',
    peak: '3:00 PM - 5:00 PM',
  },
  NIGHT: {
    label: 'Night Shift',
    color: 'indigo',
    time: '10:00 PM - 6:00 AM',
    peak: '11:00 PM - 1:00 AM',
  },
};

export default function TechnicianWorkloadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const router = useRouter();
  const resolvedParams = use(params);
  const [technician, setTechnician] = useState<Technician | null>(null);
  const [metrics, setMetrics] = useState<WorkloadMetrics>({
    utilizationRate: 0,
    remainingCapacity: 0,
    workloadTrend: 'stable',
    averageTestsPerDay: 0,
    peakWorkloadTime: 'N/A',
    productivityScore: 0,
    taskCompletionRate: 0,
    overloadRisk: 'low',
    capacityStatus: 'Normal',
    recommendedAction: 'No action required',
  });
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
    fetchTechnicianWorkload();
  }, [resolvedParams.id]);

  const fetchTechnicianWorkload = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/lab/lab-technicians/${resolvedParams.id}`
      );
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch technician');
      }

      if (result.success && result.technician) {
        setTechnician(result.technician);
        calculateMetrics(result.technician);
        generateTimeline(result.technician);
      } else {
        throw new Error('Technician not found');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load technician');
      console.error('Error fetching technician:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateMetrics = (tech: Technician) => {
    const utilizationRate =
      tech.maxConcurrentTests > 0
        ? (tech.currentWorkload / tech.maxConcurrentTests) * 100
        : 0;
    const remainingCapacity = tech.maxConcurrentTests - tech.currentWorkload;

    // Determine workload trend based on current utilization
    let workloadTrend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (utilizationRate > 75) workloadTrend = 'increasing';
    else if (utilizationRate < 30) workloadTrend = 'decreasing';

    // Calculate average tests per day (simulated based on current workload)
    const averageTestsPerDay = Math.round(tech.currentWorkload * 1.5);

    // Get peak workload time based on shift
    const shiftConfig = SHIFT_CONFIG[tech.shift];
    const peakWorkloadTime = shiftConfig.peak;

    // Calculate productivity score (combination of performance and efficiency)
    const productivityScore = Math.min(
      100,
      Math.round((tech.performanceScore + tech.efficiency) / 2)
    );

    // Calculate task completion rate (simulated, slightly higher than efficiency)
    const taskCompletionRate = Math.min(100, tech.efficiency + 5);

    // Determine overload risk
    let overloadRisk: 'low' | 'medium' | 'high' = 'low';
    let capacityStatus = 'Normal Capacity';
    let recommendedAction =
      'No action required. Operating within normal parameters.';

    if (utilizationRate >= 90) {
      overloadRisk = 'high';
      capacityStatus = 'Critical - Near Maximum';
      recommendedAction =
        'Immediate action required. Redistribute workload or schedule additional technician support.';
    } else if (utilizationRate >= 80) {
      overloadRisk = 'high';
      capacityStatus = 'High Load';
      recommendedAction =
        'Consider redistributing some tests to other available technicians.';
    } else if (utilizationRate >= 60) {
      overloadRisk = 'medium';
      capacityStatus = 'Moderate Load';
      recommendedAction =
        'Monitor workload closely. Prepare backup support if needed.';
    } else if (utilizationRate === 0) {
      capacityStatus = 'Idle';
      recommendedAction = 'Technician available for new test assignments.';
    } else {
      capacityStatus = 'Low Load';
      recommendedAction =
        'Optimal workload. Can accept additional tests if needed.';
    }

    setMetrics({
      utilizationRate,
      remainingCapacity,
      workloadTrend,
      averageTestsPerDay,
      peakWorkloadTime,
      productivityScore,
      taskCompletionRate,
      overloadRisk,
      capacityStatus,
      recommendedAction,
    });
  };

  const generateTimeline = (tech: Technician) => {
    // Generate sample timeline data for the last 7 days
    const timelineData: TimelineEntry[] = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);

      // Simulate workload variation (more realistic patterns)
      const baseWorkload = tech.currentWorkload;
      const dayOfWeek = date.getDay();

      // Weekends typically have lower workload
      let variation = 0;
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        // Weekend - lower workload
        variation = Math.floor(Math.random() * 3) - 2;
      } else {
        // Weekday - normal variation
        variation = Math.floor(Math.random() * 5) - 2;
      }

      const workload = Math.max(
        0,
        Math.min(tech.maxConcurrentTests, baseWorkload + variation)
      );
      const utilizationRate = (workload / tech.maxConcurrentTests) * 100;

      let status = 'Low';
      if (utilizationRate >= 80) status = 'High';
      else if (utilizationRate >= 60) status = 'Moderate';
      else if (utilizationRate >= 40) status = 'Normal';

      timelineData.push({
        date: date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
        workload,
        capacity: tech.maxConcurrentTests,
        status,
        utilizationRate,
      });
    }

    setTimeline(timelineData);
  };

  const getWorkloadColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-red-500';
    if (percentage >= 60) return 'bg-amber-500';
    if (percentage >= 40) return 'bg-yellow-500';
    if (percentage > 0) return 'bg-emerald-500';
    return 'bg-gray-400';
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'medium':
        return 'text-amber-600 bg-amber-50 border-amber-200';
      default:
        return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    }
  };

  if (loading) {
    return (
      <div className='min-h-screen bg-linear-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center'>
        <Loading />
      </div>
    );
  }

  if (error || !technician) {
    return (
      <div className='min-h-screen bg-linear-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4'>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className='bg-white rounded-3xl shadow-2xl p-12 max-w-md w-full text-center'
        >
          <div className='w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6'>
            <AlertCircle className='w-10 h-10 text-red-500' />
          </div>
          <h2 className='text-3xl font-bold text-gray-800 mb-4'>
            Technician Not Found
          </h2>
          <p className='text-gray-600 mb-8'>
            {error || 'The requested technician could not be found.'}
          </p>
          <Link
            href='/labtechnicians'
            className='inline-flex items-center gap-2 px-6 py-3 bg-linear-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all'
          >
            <ArrowLeft className='w-5 h-5' />
            Back to Technicians
          </Link>
        </motion.div>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[technician.status];
  const StatusIcon = statusConfig.icon;
  const shiftConfig = SHIFT_CONFIG[technician.shift];

  return (
    <div className='min-h-screen bg-linear-to-br from-blue-50 via-white to-purple-50 py-8 px-4 sm:px-6 lg:px-8'>
      {/* Decorative background */}
      <div className='fixed inset-0 overflow-hidden pointer-events-none'>
        <div className='absolute -top-40 -right-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob'></div>
        <div className='absolute -bottom-40 -left-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000'></div>
      </div>

      {/* Header */}
      <div className='max-w-7xl mx-auto mb-8 relative z-10'>
        <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'>
          <div className='flex items-center gap-4'>
            <Link
              href='/labtechnicians'
              className='p-3 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-105'
            >
              <ArrowLeft className='w-6 h-6 text-gray-700' />
            </Link>
            <div>
              <h1 className='text-3xl sm:text-4xl font-bold bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-3'>
                <Activity className='w-10 h-10 text-blue-600' />
                Workload Analysis
              </h1>
              <p className='text-gray-600 mt-1'>
                Detailed workload metrics and insights
              </p>
            </div>
          </div>
          <button
            onClick={fetchTechnicianWorkload}
            className='px-6 py-3 bg-linear-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all flex items-center gap-2'
          >
            <RefreshCw className='w-5 h-5' />
            Refresh
          </button>
        </div>
      </div>

      {/* Technician Info Card */}
      <div className='max-w-7xl mx-auto mb-8 relative z-10'>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className='bg-white rounded-3xl shadow-xl overflow-hidden'
        >
          <div className='bg-linear-to-r from-blue-500 to-purple-500 p-6'>
            <div className='flex flex-col md:flex-row items-start md:items-center justify-between gap-4'>
              <div className='flex items-center gap-4'>
                <div className='w-16 h-16 bg-white rounded-full flex items-center justify-center shrink-0'>
                  <User className='w-8 h-8 text-blue-600' />
                </div>
                <div>
                  <h2 className='text-2xl font-bold text-white'>
                    {technician.name}
                  </h2>
                  <p className='text-blue-100 font-medium'>
                    {technician.employeeId}
                  </p>
                  <div className='flex flex-wrap items-center gap-3 mt-2'>
                    <span className='flex items-center gap-1 text-blue-100 text-sm'>
                      <Mail className='w-4 h-4' />
                      {technician.email}
                    </span>
                    <span className='flex items-center gap-1 text-blue-100 text-sm'>
                      <Phone className='w-4 h-4' />
                      {technician.phone}
                    </span>
                  </div>
                </div>
              </div>
              <div className='flex flex-col gap-2'>
                <div
                  className={`flex items-center gap-2 px-4 py-2 rounded-full ${statusConfig.bg} ${statusConfig.border} border-2`}
                >
                  <StatusIcon className={`w-5 h-5 ${statusConfig.text}`} />
                  <span className={`font-semibold ${statusConfig.text}`}>
                    {statusConfig.label}
                  </span>
                </div>
                <div className='px-4 py-2 bg-white rounded-full text-center'>
                  <span className='text-sm font-semibold text-gray-700'>
                    {shiftConfig.label}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className='p-6 grid grid-cols-2 md:grid-cols-5 gap-4'>
            <div className='text-center bg-gray-50 rounded-xl p-4'>
              <p className='text-sm text-gray-600 mb-1'>Qualification</p>
              <p className='text-lg font-bold text-gray-800'>
                {technician.qualification}
              </p>
            </div>
            <div className='text-center bg-gray-50 rounded-xl p-4'>
              <p className='text-sm text-gray-600 mb-1'>Experience</p>
              <p className='text-lg font-bold text-gray-800'>
                {technician.yearsOfExperience} years
              </p>
            </div>
            <div className='text-center bg-gray-50 rounded-xl p-4'>
              <p className='text-sm text-gray-600 mb-1'>Performance</p>
              <p className='text-lg font-bold text-gray-800'>
                {technician.performanceScore}%
              </p>
            </div>
            <div className='text-center bg-gray-50 rounded-xl p-4'>
              <p className='text-sm text-gray-600 mb-1'>Efficiency</p>
              <p className='text-lg font-bold text-gray-800'>
                {technician.efficiency}%
              </p>
            </div>
            <div className='text-center bg-gray-50 rounded-xl p-4'>
              <p className='text-sm text-gray-600 mb-1'>Shift Time</p>
              <p className='text-sm font-bold text-gray-800'>
                {shiftConfig.time}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Current Workload Overview */}
      <div className='max-w-7xl mx-auto mb-8 relative z-10'>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className='bg-white rounded-3xl shadow-xl p-8'
        >
          <h3 className='text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3'>
            <Target className='w-7 h-7 text-blue-500' />
            Current Workload Status
          </h3>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-6'>
            <div className='bg-linear-to-br from-blue-50 to-blue-100 rounded-2xl p-6'>
              <div className='flex items-center justify-between mb-4'>
                <span className='text-gray-700 font-semibold'>
                  Current Tests
                </span>
                <BarChart className='w-6 h-6 text-blue-600' />
              </div>
              <p className='text-4xl font-bold text-blue-600 mb-2'>
                {technician.currentWorkload}
              </p>
              <p className='text-sm text-gray-600'>
                of {technician.maxConcurrentTests} max capacity
              </p>
            </div>

            <div className='bg-linear-to-br from-purple-50 to-purple-100 rounded-2xl p-6'>
              <div className='flex items-center justify-between mb-4'>
                <span className='text-gray-700 font-semibold'>
                  Utilization Rate
                </span>
                <PieChart className='w-6 h-6 text-purple-600' />
              </div>
              <p className='text-4xl font-bold text-purple-600 mb-2'>
                {metrics.utilizationRate.toFixed(1)}%
              </p>
              <div className='w-full bg-gray-200 rounded-full h-2 mt-3'>
                <div
                  className={`h-full rounded-full transition-all ${getWorkloadColor(
                    metrics.utilizationRate
                  )}`}
                  style={{
                    width: `${Math.min(metrics.utilizationRate, 100)}%`,
                  }}
                />
              </div>
            </div>

            <div className='bg-linear-to-br from-emerald-50 to-emerald-100 rounded-2xl p-6'>
              <div className='flex items-center justify-between mb-4'>
                <span className='text-gray-700 font-semibold'>
                  Remaining Capacity
                </span>
                <Zap className='w-6 h-6 text-emerald-600' />
              </div>
              <p className='text-4xl font-bold text-emerald-600 mb-2'>
                {metrics.remainingCapacity}
              </p>
              <p className='text-sm text-gray-600'>tests available</p>
            </div>
          </div>

          {/* Capacity Status Banner */}
          <div
            className={`p-5 rounded-2xl border-2 ${getRiskColor(
              metrics.overloadRisk
            )} mb-4`}
          >
            <div className='flex items-start gap-3'>
              <div className='shrink-0 mt-1'>
                {metrics.overloadRisk === 'high' ? (
                  <AlertCircle className='w-6 h-6' />
                ) : metrics.overloadRisk === 'medium' ? (
                  <Activity className='w-6 h-6' />
                ) : (
                  <CheckCircle className='w-6 h-6' />
                )}
              </div>
              <div className='flex-1'>
                <p className='font-bold text-lg mb-1'>
                  {metrics.capacityStatus}
                </p>
                <p className='text-sm'>{metrics.recommendedAction}</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Performance Metrics */}
      <div className='max-w-7xl mx-auto mb-8 relative z-10'>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className='bg-white rounded-3xl shadow-xl p-6'
          >
            <div className='flex items-center justify-between mb-4'>
              <div className='w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center'>
                <Award className='w-6 h-6 text-indigo-600' />
              </div>
              {metrics.workloadTrend === 'increasing' ? (
                <TrendingUp className='w-6 h-6 text-red-500' />
              ) : metrics.workloadTrend === 'decreasing' ? (
                <TrendingDown className='w-6 h-6 text-emerald-500' />
              ) : (
                <Activity className='w-6 h-6 text-blue-500' />
              )}
            </div>
            <p className='text-sm text-gray-600 mb-2'>Workload Trend</p>
            <p className='text-2xl font-bold text-gray-800 capitalize'>
              {metrics.workloadTrend}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className='bg-white rounded-3xl shadow-xl p-6'
          >
            <div className='flex items-center justify-between mb-4'>
              <div className='w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center'>
                <BarChart className='w-6 h-6 text-amber-600' />
              </div>
            </div>
            <p className='text-sm text-gray-600 mb-2'>Avg Tests/Day</p>
            <p className='text-2xl font-bold text-gray-800'>
              {metrics.averageTestsPerDay}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className='bg-white rounded-3xl shadow-xl p-6'
          >
            <div className='flex items-center justify-between mb-4'>
              <div className='w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center'>
                <Cpu className='w-6 h-6 text-purple-600' />
              </div>
            </div>
            <p className='text-sm text-gray-600 mb-2'>Productivity</p>
            <p className='text-2xl font-bold text-gray-800'>
              {metrics.productivityScore}%
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className='bg-white rounded-3xl shadow-xl p-6'
          >
            <div className='flex items-center justify-between mb-4'>
              <div className='w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center'>
                <CheckCircle className='w-6 h-6 text-emerald-600' />
              </div>
            </div>
            <p className='text-sm text-gray-600 mb-2'>Task Completion</p>
            <p className='text-2xl font-bold text-gray-800'>
              {metrics.taskCompletionRate}%
            </p>
          </motion.div>
        </div>
      </div>

      {/* Peak Hours & 7-Day Timeline Grid */}
      <div className='max-w-7xl mx-auto mb-8 relative z-10'>
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
          {/* Peak Hours */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className='bg-white rounded-3xl shadow-xl p-8'
          >
            <h3 className='text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3'>
              <Clock className='w-7 h-7 text-amber-500' />
              Peak Workload Times
            </h3>
            <div className='bg-linear-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border-2 border-amber-200'>
              <p className='text-sm text-gray-600 mb-2'>
                Highest Activity Period
              </p>
              <p className='text-3xl font-bold text-amber-700 mb-3'>
                {metrics.peakWorkloadTime}
              </p>
              <p className='text-sm text-gray-600'>
                Based on {shiftConfig.label} schedule
              </p>
              <p className='text-xs text-gray-500 mt-2'>
                Shift: {shiftConfig.time}
              </p>
            </div>
          </motion.div>

          {/* Quick Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className='bg-white rounded-3xl shadow-xl p-8'
          >
            <h3 className='text-2xl font-bold text-gray-800 mb-6'>
              Quick Statistics
            </h3>
            <div className='space-y-4'>
              <div className='flex justify-between items-center p-4 bg-gray-50 rounded-xl'>
                <span className='text-gray-700 font-medium'>
                  Total Capacity
                </span>
                <span className='text-xl font-bold text-gray-800'>
                  {technician.maxConcurrentTests} tests
                </span>
              </div>
              <div className='flex justify-between items-center p-4 bg-gray-50 rounded-xl'>
                <span className='text-gray-700 font-medium'>
                  Available Since
                </span>
                <span className='text-xl font-bold text-gray-800'>
                  {new Date(technician.joinedDate).toLocaleDateString('en-US', {
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>
              <div className='flex justify-between items-center p-4 bg-gray-50 rounded-xl'>
                <span className='text-gray-700 font-medium'>
                  Certifications
                </span>
                <span className='text-xl font-bold text-gray-800'>
                  {technician.certifications?.length || 0}
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* 7-Day Timeline */}
      <div className='max-w-7xl mx-auto mb-8 relative z-10'>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className='bg-white rounded-3xl shadow-xl p-8'
        >
          <h3 className='text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3'>
            <Calendar className='w-7 h-7 text-blue-500' />
            7-Day Workload History
          </h3>
          <div className='space-y-4'>
            {timeline.map((entry, index) => {
              return (
                <div key={index} className='flex items-center gap-4'>
                  <div className='w-20 text-sm font-semibold text-gray-700'>
                    {entry.date}
                  </div>
                  <div className='flex-1'>
                    <div className='flex items-center justify-between mb-2'>
                      <span className='text-sm text-gray-600'>
                        {entry.workload} / {entry.capacity} tests
                      </span>
                      <span className='text-sm font-semibold text-gray-700'>
                        {entry.utilizationRate.toFixed(1)}%
                      </span>
                      <span
                        className={`text-xs font-semibold px-3 py-1 rounded-full ${
                          entry.status === 'High'
                            ? 'bg-red-100 text-red-700'
                            : entry.status === 'Moderate'
                              ? 'bg-amber-100 text-amber-700'
                              : entry.status === 'Normal'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {entry.status}
                      </span>
                    </div>
                    <div className='w-full bg-gray-200 rounded-full h-3'>
                      <div
                        className={`h-full rounded-full transition-all ${getWorkloadColor(
                          entry.utilizationRate
                        )}`}
                        style={{ width: `${entry.utilizationRate}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* Specializations */}
      <div className='max-w-7xl mx-auto relative z-10'>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className='bg-white rounded-3xl shadow-xl p-8'
        >
          <h3 className='text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3'>
            <Award className='w-7 h-7 text-purple-500' />
            Specializations & Expertise
          </h3>
          <div className='flex flex-wrap gap-3'>
            {technician.specialization.map((spec, index) => (
              <span
                key={index}
                className='px-6 py-3 bg-linear-to-r from-blue-50 to-purple-50 text-blue-700 rounded-xl font-medium border-2 border-blue-200 text-lg'
              >
                {spec}
              </span>
            ))}
          </div>

          {technician.certifications &&
            technician.certifications.length > 0 && (
              <div className='mt-6'>
                <h4 className='text-lg font-bold text-gray-800 mb-4'>
                  Certifications
                </h4>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                  {technician.certifications.map((cert, index) => (
                    <div
                      key={index}
                      className='flex items-center gap-3 p-4 bg-linear-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-200'
                    >
                      <Award className='w-5 h-5 text-purple-600 shrink-0' />
                      <span className='text-gray-800 font-medium'>{cert}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {technician.notes && (
            <div className='mt-6 p-5 bg-gray-50 rounded-2xl border border-gray-200'>
              <h4 className='text-sm font-bold text-gray-700 mb-2'>Notes</h4>
              <p className='text-gray-700 leading-relaxed'>
                {technician.notes}
              </p>
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

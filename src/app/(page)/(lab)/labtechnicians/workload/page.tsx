/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiActivity as Activity,
  FiUsers as Users,
  FiClock as Clock,
  FiCheckCircle as CheckCircle,
  FiAlertCircle as AlertCircle,
  FiTrendingUp as TrendingUp,
  FiTrendingDown as TrendingDown,
  FiRefreshCw as RefreshCw,
  FiFilter as Filter,
  FiSearch as Search,
  FiBarChart2 as BarChart,
  FiPieChart as PieChart,
  FiCalendar as Calendar,
  FiUser as User,
  FiAward as Award,
} from 'react-icons/fi';
import Loading from '@/components/ui/Loading';
import Toast from '@/components/ui/Toast';

interface Technician {
  _id: string;
  id: string;
  name: string;
  employeeId: string;
  email: string;
  specialization: string[];
  status: 'AVAILABLE' | 'BUSY' | 'OFFLINE' | 'ON_LEAVE';
  shift: 'GENERAL' | 'MORNING' | 'EVENING' | 'NIGHT';
  isAvailable: boolean;
  maxConcurrentTests: number;
  currentWorkload: number;
  performanceScore: number;
  efficiency: number;
  yearsOfExperience: number;
}

interface WorkloadStats {
  totalTechnicians: number;
  activeTechnicians: number;
  totalCapacity: number;
  currentWorkload: number;
  utilizationRate: number;
  availableCapacity: number;
  overloadedTechnicians: number;
  idleTechnicians: number;
  averagePerformance: number;
  averageEfficiency: number;
}

const STATUS_COLORS = {
  AVAILABLE: 'text-emerald-600 bg-emerald-50 border-emerald-200',
  BUSY: 'text-amber-600 bg-amber-50 border-amber-200',
  OFFLINE: 'text-slate-600 bg-slate-50 border-slate-200',
  ON_LEAVE: 'text-orange-600 bg-orange-50 border-orange-200',
};

const SHIFT_COLORS = {
  GENERAL: 'text-blue-600 bg-blue-50',
  MORNING: 'text-amber-600 bg-amber-50',
  EVENING: 'text-purple-600 bg-purple-50',
  NIGHT: 'text-indigo-600 bg-indigo-50',
};

export default function WorkloadPage() {
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [filteredTechnicians, setFilteredTechnicians] = useState<Technician[]>(
    []
  );
  const [stats, setStats] = useState<WorkloadStats>({
    totalTechnicians: 0,
    activeTechnicians: 0,
    totalCapacity: 0,
    currentWorkload: 0,
    utilizationRate: 0,
    availableCapacity: 0,
    overloadedTechnicians: 0,
    idleTechnicians: 0,
    averagePerformance: 0,
    averageEfficiency: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterShift, setFilterShift] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<
    'workload' | 'performance' | 'efficiency'
  >('workload');
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
    fetchTechnicians();
  }, []);

  useEffect(() => {
    filterAndSortTechnicians();
  }, [technicians, searchQuery, filterStatus, filterShift, sortBy]);

  const fetchTechnicians = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/lab/lab-technicians');
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch technicians');
      }

      if (result.success && result.technicians) {
        setTechnicians(result.technicians);
        calculateStats(result.technicians);
      }
    } catch (err: any) {
      setToast({
        show: true,
        message: err.message || 'Failed to load technicians',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (techs: Technician[]) => {
    const totalTechnicians = techs.length;
    const activeTechnicians = techs.filter(
      t => t.status === 'AVAILABLE' || t.status === 'BUSY'
    ).length;
    const totalCapacity = techs.reduce(
      (sum, t) => sum + t.maxConcurrentTests,
      0
    );
    const currentWorkload = techs.reduce(
      (sum, t) => sum + t.currentWorkload,
      0
    );
    const utilizationRate =
      totalCapacity > 0 ? (currentWorkload / totalCapacity) * 100 : 0;
    const availableCapacity = totalCapacity - currentWorkload;
    const overloadedTechnicians = techs.filter(
      t => t.currentWorkload >= t.maxConcurrentTests * 0.8
    ).length;
    const idleTechnicians = techs.filter(
      t => t.currentWorkload === 0 && t.isAvailable
    ).length;
    const averagePerformance =
      totalTechnicians > 0
        ? techs.reduce((sum, t) => sum + t.performanceScore, 0) /
          totalTechnicians
        : 0;
    const averageEfficiency =
      totalTechnicians > 0
        ? techs.reduce((sum, t) => sum + t.efficiency, 0) / totalTechnicians
        : 0;

    setStats({
      totalTechnicians,
      activeTechnicians,
      totalCapacity,
      currentWorkload,
      utilizationRate,
      availableCapacity,
      overloadedTechnicians,
      idleTechnicians,
      averagePerformance,
      averageEfficiency,
    });
  };

  const filterAndSortTechnicians = () => {
    let filtered = [...technicians];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        tech =>
          tech.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          tech.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
          tech.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply status filter
    if (filterStatus !== 'ALL') {
      filtered = filtered.filter(tech => tech.status === filterStatus);
    }

    // Apply shift filter
    if (filterShift !== 'ALL') {
      filtered = filtered.filter(tech => tech.shift === filterShift);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'workload':
          return (
            b.currentWorkload / b.maxConcurrentTests -
            a.currentWorkload / a.maxConcurrentTests
          );
        case 'performance':
          return b.performanceScore - a.performanceScore;
        case 'efficiency':
          return b.efficiency - a.efficiency;
        default:
          return 0;
      }
    });

    setFilteredTechnicians(filtered);
  };

  const getWorkloadPercentage = (tech: Technician) => {
    return (tech.currentWorkload / tech.maxConcurrentTests) * 100;
  };

  const getWorkloadColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-red-500';
    if (percentage >= 60) return 'bg-amber-500';
    if (percentage >= 40) return 'bg-yellow-500';
    return 'bg-emerald-500';
  };

  const getWorkloadStatus = (percentage: number) => {
    if (percentage >= 80) return { label: 'Overloaded', color: 'text-red-600' };
    if (percentage >= 60)
      return { label: 'High Load', color: 'text-amber-600' };
    if (percentage >= 40)
      return { label: 'Moderate', color: 'text-yellow-600' };
    if (percentage > 0) return { label: 'Low Load', color: 'text-emerald-600' };
    return { label: 'Idle', color: 'text-slate-600' };
  };

  if (loading) {
    return (
      <div className='min-h-screen bg-linear-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center'>
        <Loading />
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-linear-to-br from-blue-50 via-white to-purple-50 py-8 px-4 sm:px-6 lg:px-8'>
      {/* Decorative background elements */}
      <div className='fixed inset-0 overflow-hidden pointer-events-none'>
        <div className='absolute -top-40 -right-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob'></div>
        <div className='absolute -bottom-40 -left-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000'></div>
        <div className='absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000'></div>
      </div>

      {/* Header */}
      <div className='max-w-7xl mx-auto mb-8'>
        <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'>
          <div>
            <h1 className='text-3xl sm:text-4xl font-bold bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-3'>
              <Activity className='w-10 h-10 text-blue-600' />
              Workload Management
            </h1>
            <p className='text-gray-600 mt-2'>
              Monitor and manage technician workload distribution
            </p>
          </div>
          <button
            onClick={fetchTechnicians}
            className='px-6 py-3 bg-linear-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all flex items-center gap-2'
          >
            <RefreshCw className='w-5 h-5' />
            Refresh Data
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className='max-w-7xl mx-auto mb-8'>
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6'>
          {/* Total Capacity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className='bg-white rounded-3xl shadow-xl p-6'
          >
            <div className='flex items-start justify-between mb-4'>
              <div className='w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center'>
                <BarChart className='w-6 h-6 text-blue-600' />
              </div>
              <div className='text-right'>
                <p className='text-3xl font-bold text-gray-800'>
                  {stats.totalCapacity}
                </p>
                <p className='text-sm text-gray-600'>Total Capacity</p>
              </div>
            </div>
            <div className='flex items-center justify-between text-sm'>
              <span className='text-gray-600'>
                Current: {stats.currentWorkload}
              </span>
              <span className='text-gray-600'>
                Available: {stats.availableCapacity}
              </span>
            </div>
          </motion.div>

          {/* Utilization Rate */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className='bg-white rounded-3xl shadow-xl p-6'
          >
            <div className='flex items-start justify-between mb-4'>
              <div className='w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center'>
                <PieChart className='w-6 h-6 text-purple-600' />
              </div>
              <div className='text-right'>
                <p className='text-3xl font-bold text-gray-800'>
                  {stats.utilizationRate.toFixed(1)}%
                </p>
                <p className='text-sm text-gray-600'>Utilization Rate</p>
              </div>
            </div>
            <div className='w-full bg-gray-200 rounded-full h-2 overflow-hidden'>
              <div
                className={`h-full rounded-full transition-all duration-500 ${getWorkloadColor(
                  stats.utilizationRate
                )}`}
                style={{ width: `${Math.min(stats.utilizationRate, 100)}%` }}
              />
            </div>
          </motion.div>

          {/* Active Technicians */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className='bg-white rounded-3xl shadow-xl p-6'
          >
            <div className='flex items-start justify-between mb-4'>
              <div className='w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center'>
                <Users className='w-6 h-6 text-emerald-600' />
              </div>
              <div className='text-right'>
                <p className='text-3xl font-bold text-gray-800'>
                  {stats.activeTechnicians}
                </p>
                <p className='text-sm text-gray-600'>Active Technicians</p>
              </div>
            </div>
            <div className='flex items-center justify-between text-sm'>
              <span className='text-gray-600'>
                Total: {stats.totalTechnicians}
              </span>
              <span className='text-gray-600'>
                Idle: {stats.idleTechnicians}
              </span>
            </div>
          </motion.div>

          {/* Overloaded Technicians */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className='bg-white rounded-3xl shadow-xl p-6'
          >
            <div className='flex items-start justify-between mb-4'>
              <div className='w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center'>
                <AlertCircle className='w-6 h-6 text-red-600' />
              </div>
              <div className='text-right'>
                <p className='text-3xl font-bold text-gray-800'>
                  {stats.overloadedTechnicians}
                </p>
                <p className='text-sm text-gray-600'>Overloaded</p>
              </div>
            </div>
            <div className='flex items-center gap-2'>
              {stats.overloadedTechnicians > 0 ? (
                <>
                  <TrendingUp className='w-4 h-4 text-red-500' />
                  <span className='text-sm text-red-600'>Needs attention</span>
                </>
              ) : (
                <>
                  <CheckCircle className='w-4 h-4 text-emerald-500' />
                  <span className='text-sm text-emerald-600'>All good</span>
                </>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Performance Overview */}
      <div className='max-w-7xl mx-auto mb-8'>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className='bg-white rounded-3xl shadow-xl p-6'
          >
            <h3 className='text-lg font-bold text-gray-800 mb-4 flex items-center gap-2'>
              <Award className='w-5 h-5 text-indigo-500' />
              Average Performance Score
            </h3>
            <div className='flex items-center justify-between mb-3'>
              <span className='text-4xl font-bold text-indigo-600'>
                {stats.averagePerformance.toFixed(1)}%
              </span>
              {stats.averagePerformance >= 80 ? (
                <TrendingUp className='w-8 h-8 text-emerald-500' />
              ) : (
                <TrendingDown className='w-8 h-8 text-amber-500' />
              )}
            </div>
            <div className='w-full bg-gray-200 rounded-full h-3 overflow-hidden'>
              <div
                className='bg-linear-to-r from-indigo-500 to-purple-500 h-full rounded-full transition-all duration-500'
                style={{ width: `${stats.averagePerformance}%` }}
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className='bg-white rounded-3xl shadow-xl p-6'
          >
            <h3 className='text-lg font-bold text-gray-800 mb-4 flex items-center gap-2'>
              <Clock className='w-5 h-5 text-emerald-500' />
              Average Efficiency
            </h3>
            <div className='flex items-center justify-between mb-3'>
              <span className='text-4xl font-bold text-emerald-600'>
                {stats.averageEfficiency.toFixed(1)}%
              </span>
              {stats.averageEfficiency >= 80 ? (
                <TrendingUp className='w-8 h-8 text-emerald-500' />
              ) : (
                <TrendingDown className='w-8 h-8 text-amber-500' />
              )}
            </div>
            <div className='w-full bg-gray-200 rounded-full h-3 overflow-hidden'>
              <div
                className='bg-linear-to-r from-emerald-500 to-teal-500 h-full rounded-full transition-all duration-500'
                style={{ width: `${stats.averageEfficiency}%` }}
              />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className='max-w-7xl mx-auto mb-8'>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className='bg-white rounded-3xl shadow-xl p-6'
        >
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
            {/* Search */}
            <div className='relative'>
              <Search className='absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400' />
              <input
                type='text'
                placeholder='Search technicians...'
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className='w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors'
              />
            </div>

            {/* Status Filter */}
            <div className='relative'>
              <Filter className='absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400' />
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className='w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors appearance-none bg-white'
              >
                <option value='ALL'>All Status</option>
                <option value='AVAILABLE'>Available</option>
                <option value='BUSY'>Busy</option>
                <option value='OFFLINE'>Offline</option>
                <option value='ON_LEAVE'>On Leave</option>
              </select>
            </div>

            {/* Shift Filter */}
            <div className='relative'>
              <Calendar className='absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400' />
              <select
                value={filterShift}
                onChange={e => setFilterShift(e.target.value)}
                className='w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors appearance-none bg-white'
              >
                <option value='ALL'>All Shifts</option>
                <option value='GENERAL'>General</option>
                <option value='MORNING'>Morning</option>
                <option value='EVENING'>Evening</option>
                <option value='NIGHT'>Night</option>
              </select>
            </div>

            {/* Sort By */}
            <div className='relative'>
              <BarChart className='absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400' />
              <select
                value={sortBy}
                onChange={e =>
                  setSortBy(
                    e.target.value as 'workload' | 'performance' | 'efficiency'
                  )
                }
                className='w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors appearance-none bg-white'
              >
                <option value='workload'>Sort by Workload</option>
                <option value='performance'>Sort by Performance</option>
                <option value='efficiency'>Sort by Efficiency</option>
              </select>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Technician Cards */}
      <div className='max-w-7xl mx-auto'>
        <AnimatePresence mode='wait'>
          {filteredTechnicians.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className='bg-white rounded-3xl shadow-xl p-12 text-center'
            >
              <Users className='w-16 h-16 text-gray-400 mx-auto mb-4' />
              <h3 className='text-xl font-bold text-gray-800 mb-2'>
                No Technicians Found
              </h3>
              <p className='text-gray-600'>
                Try adjusting your filters or search query
              </p>
            </motion.div>
          ) : (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
              {filteredTechnicians.map((tech, index) => {
                const workloadPercentage = getWorkloadPercentage(tech);
                const workloadStatus = getWorkloadStatus(workloadPercentage);

                return (
                  <motion.div
                    key={tech._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                    className='bg-white rounded-3xl shadow-xl overflow-hidden hover:shadow-2xl transition-all'
                  >
                    {/* Header */}
                    <div className='bg-linear-to-r from-blue-500 to-purple-500 p-6'>
                      <div className='flex items-start justify-between mb-3'>
                        <div className='w-12 h-12 bg-white rounded-full flex items-center justify-center'>
                          <User className='w-6 h-6 text-blue-600' />
                        </div>
                        <div className='flex flex-col gap-2 items-end'>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                              STATUS_COLORS[tech.status]
                            }`}
                          >
                            {tech.status}
                          </span>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              SHIFT_COLORS[tech.shift]
                            }`}
                          >
                            {tech.shift}
                          </span>
                        </div>
                      </div>
                      <h3 className='text-xl font-bold text-white mb-1'>
                        {tech.name}
                      </h3>
                      <p className='text-blue-100 text-sm'>{tech.employeeId}</p>
                    </div>

                    {/* Body */}
                    <div className='p-6'>
                      {/* Workload Status */}
                      <div className='mb-6'>
                        <div className='flex items-center justify-between mb-2'>
                          <span className='text-sm font-semibold text-gray-700'>
                            Workload Status
                          </span>
                          <span
                            className={`text-sm font-bold ${workloadStatus.color}`}
                          >
                            {workloadStatus.label}
                          </span>
                        </div>
                        <div className='flex items-center justify-between mb-2'>
                          <span className='text-2xl font-bold text-gray-800'>
                            {tech.currentWorkload}
                          </span>
                          <span className='text-gray-600'>
                            / {tech.maxConcurrentTests} tests
                          </span>
                        </div>
                        <div className='w-full bg-gray-200 rounded-full h-3 overflow-hidden'>
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${getWorkloadColor(
                              workloadPercentage
                            )}`}
                            style={{ width: `${workloadPercentage}%` }}
                          />
                        </div>
                        <p className='text-xs text-gray-600 mt-2 text-center'>
                          {workloadPercentage.toFixed(1)}% Capacity Used
                        </p>
                      </div>

                      {/* Metrics */}
                      <div className='grid grid-cols-2 gap-4 mb-4'>
                        <div className='bg-indigo-50 rounded-2xl p-4 text-center'>
                          <p className='text-2xl font-bold text-indigo-600'>
                            {tech.performanceScore}%
                          </p>
                          <p className='text-xs text-gray-600'>Performance</p>
                        </div>
                        <div className='bg-emerald-50 rounded-2xl p-4 text-center'>
                          <p className='text-2xl font-bold text-emerald-600'>
                            {tech.efficiency}%
                          </p>
                          <p className='text-xs text-gray-600'>Efficiency</p>
                        </div>
                      </div>

                      {/* Specializations */}
                      <div>
                        <p className='text-xs text-gray-600 mb-2 font-semibold'>
                          Specializations:
                        </p>
                        <div className='flex flex-wrap gap-2'>
                          {tech.specialization.slice(0, 3).map((spec, idx) => (
                            <span
                              key={idx}
                              className='px-3 py-1 bg-blue-50 text-blue-700 text-xs rounded-lg font-medium'
                            >
                              {spec}
                            </span>
                          ))}
                          {tech.specialization.length > 3 && (
                            <span className='px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-lg font-medium'>
                              +{tech.specialization.length - 3}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Toast Notifications */}
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

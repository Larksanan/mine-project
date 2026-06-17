/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-undef */
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiCalendar,
  FiClock,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiCheck,
  FiX,
  FiRepeat,
  FiUsers,
  FiLoader,
  FiAlertCircle,
  FiChevronLeft,
  FiChevronRight,
  FiFilter,
  FiRefreshCw,
  FiSave,
  FiWatch,
  FiCoffee,
  FiEye,
  FiEyeOff,
} from 'react-icons/fi';
import { MdEventAvailable, MdSchedule } from 'react-icons/md';

interface Schedule {
  _id: string;
  id?: string;
  doctor:
    | string
    | {
        _id: string;
        id: string;
        name: string;
        email: string;
        phone?: string;
        specialization: string;
        department: string;
      };
  dayOfWeek?: string;
  date: string | null;
  startTime: string;
  endTime: string;
  slotDuration: number;
  maxPatientsPerSlot: number;
  breakTime: string | null;
  isRecurring: boolean;
  isActive: boolean;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

const TIME_SLOTS = [
  '08:00',
  '08:30',
  '09:00',
  '09:30',
  '10:00',
  '10:30',
  '11:00',
  '11:30',
  '12:00',
  '12:30',
  '13:00',
  '13:30',
  '14:00',
  '14:30',
  '15:00',
  '15:30',
  '16:00',
  '16:30',
  '17:00',
  '17:30',
  '18:00',
  '18:30',
  '19:00',
  '19:30',
];

export default function DoctorSchedulePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(
    null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filterStatus, setFilterStatus] = useState<
    'all' | 'active' | 'inactive'
  >('all');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Receptionist specific state
  const [doctors, setDoctors] = useState<any[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');

  // Form state
  const [formData, setFormData] = useState({
    dayOfWeek: '',
    date: '',
    startTime: '09:00',
    endTime: '17:00',
    slotDuration: 30,
    maxPatientsPerSlot: 1,
    breakTime: '',
    isRecurring: false,
    isActive: true,
    notes: '',
  });

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/auth/signin?callbackUrl=/dashboard/doctor/schedule');
      return;
    }

    if (
      session.user?.role !== 'DOCTOR' &&
      session.user?.role !== 'RECEPTIONIST'
    ) {
      router.push('/dashboard');
      return;
    }

    if (session.user.role === 'RECEPTIONIST') {
      fetchDoctors();
    } else {
      fetchSchedules();
    }
  }, [session, status, router, filterStatus, selectedDoctorId]);

  const fetchDoctors = async () => {
    try {
      const response = await fetch('/api/doctors');
      const data = await response.json();
      if (data.success) {
        setDoctors(data.data);
        if (data.data.length > 0 && !selectedDoctorId) {
          setSelectedDoctorId(data.data[0]._id);
        }
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
    }
  };

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      setError('');

      let url = '/api/doctor/schedule';
      const params = new URLSearchParams();

      if (filterStatus !== 'all') params.append('status', filterStatus);

      // If receptionist, pass selected doctor ID
      if (session?.user?.role === 'RECEPTIONIST' && selectedDoctorId) {
        params.append('doctorId', selectedDoctorId);
      }

      if (params.toString()) url += `?${params.toString()}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setSchedules(data.data || []);
      } else {
        setError(data.error || 'Failed to fetch schedules');
      }
    } catch (error) {
      console.error('Error fetching schedules:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    const payload: any = { ...formData };
    if (session?.user?.role === 'RECEPTIONIST') {
      payload.doctorId = selectedDoctorId;
    }

    try {
      const response = await fetch('/api/doctor/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Schedule added successfully!');
        setSchedules([...schedules, data.data]);
        setShowAddModal(false);
        resetForm();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || 'Failed to add schedule');
      }
    } catch (error) {
      console.error('Error adding schedule:', error);
      setError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSchedule) return;

    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/doctor/schedule', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scheduleId: selectedSchedule._id,
          ...formData,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Schedule updated successfully!');
        setSchedules(
          schedules.map(s => (s._id === selectedSchedule._id ? data.data : s))
        );
        setShowEditModal(false);
        resetForm();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || 'Failed to update schedule');
      }
    } catch (error) {
      console.error('Error updating schedule:', error);
      setError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSchedule = async () => {
    if (!selectedSchedule) return;

    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch(
        `/api/doctor/schedule?id=${selectedSchedule._id}`,
        {
          method: 'DELETE',
        }
      );

      const data = await response.json();

      if (data.success) {
        setSuccess('Schedule deleted successfully!');
        setSchedules(schedules.filter(s => s._id !== selectedSchedule._id));
        setShowDeleteModal(false);
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || 'Failed to delete schedule');
      }
    } catch (error) {
      console.error('Error deleting schedule:', error);
      setError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      dayOfWeek: '',
      date: '',
      startTime: '09:00',
      endTime: '17:00',
      slotDuration: 30,
      maxPatientsPerSlot: 1,
      breakTime: '',
      isRecurring: false,
      isActive: true,
      notes: '',
    });
    setSelectedSchedule(null);
  };

  const openEditModal = (schedule: Schedule) => {
    setSelectedSchedule(schedule);
    setFormData({
      dayOfWeek: schedule.dayOfWeek || '',
      date: schedule.date || '',
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      slotDuration: schedule.slotDuration,
      maxPatientsPerSlot: schedule.maxPatientsPerSlot,
      breakTime: schedule.breakTime || '',
      isRecurring: schedule.isRecurring,
      isActive: schedule.isActive,
      notes: schedule.notes,
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (schedule: Schedule) => {
    setSelectedSchedule(schedule);
    setShowDeleteModal(true);
  };

  const toggleScheduleStatus = async (schedule: Schedule) => {
    try {
      const response = await fetch('/api/doctor/schedule', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scheduleId: schedule._id,
          isActive: !schedule.isActive,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSchedules(
          schedules.map(s => (s._id === schedule._id ? data.data : s))
        );
        setSuccess(
          `Schedule ${!schedule.isActive ? 'activated' : 'deactivated'} successfully!`
        );
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (error) {
      console.error('Error toggling schedule status:', error);
      setError('Failed to update schedule status');
    }
  };

  const getDaySchedules = (day: string) => {
    return schedules.filter(s => {
      if (s.dayOfWeek === day) return true;
      if (s.date) {
        const dayName = new Date(s.date).toLocaleDateString('en-US', {
          weekday: 'long',
          timeZone: 'UTC',
        });
        return dayName === day;
      }
      return false;
    });
  };

  if (loading) {
    return (
      <div className='min-h-screen bg-linear-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center'>
        <div className='text-center'>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className='w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4'
          />
          <p className='text-gray-600'>Loading schedule...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-linear-to-br from-blue-50 via-white to-cyan-50'>
      {/* Floating Background Elements */}
      <div className='fixed inset-0 overflow-hidden pointer-events-none'>
        {[...Array(10)].map((_, i) => (
          <motion.div
            key={i}
            className='absolute w-32 h-32 rounded-full bg-linear-to-r from-blue-100/20 to-cyan-100/20'
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              x: [0, Math.sin(i) * 30, 0],
              y: [0, Math.cos(i) * 30, 0],
              rotate: 360,
            }}
            transition={{
              duration: 20 + i * 3,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        ))}
      </div>

      {/* Main Content */}
      <div className='relative z-10 max-w-7xl mx-auto px-4 py-8'>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className='mb-8'
        >
          <div className='flex flex-col md:flex-row justify-between items-start md:items-center gap-6'>
            <div>
              <h1 className='text-3xl font-bold text-gray-900 mb-2'>
                Schedule Management
              </h1>
              <p className='text-gray-600'>
                {session?.user?.role === 'RECEPTIONIST'
                  ? 'Manage doctor availability and schedules'
                  : 'Manage your availability and appointments'}
              </p>
            </div>

            {session?.user?.role === 'RECEPTIONIST' && (
              <div className='w-full md:w-64'>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Select Doctor
                </label>
                <select
                  value={selectedDoctorId}
                  onChange={e => setSelectedDoctorId(e.target.value)}
                  className='w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500'
                >
                  <option value=''>Select a doctor...</option>
                  {doctors.map(doc => (
                    <option key={doc._id} value={doc._id}>
                      {doc.user?.name || 'Unknown'} (
                      {doc.profile?.specialization || 'General'})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className='flex flex-wrap gap-3'>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowAddModal(true)}
                className='bg-linear-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all shadow-lg hover:shadow-xl'
              >
                <FiPlus className='w-5 h-5' />
                Add Schedule
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={fetchSchedules}
                className='bg-white hover:bg-gray-50 text-gray-700 px-4 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all border border-gray-300 shadow-sm'
              >
                <FiRefreshCw className='w-5 h-5' />
                Refresh
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className='grid grid-cols-1 md:grid-cols-4 gap-6 mb-8'>
          {[
            {
              label: 'Total Schedules',
              value: schedules.length,
              icon: FiCalendar,
              color: 'from-blue-500 to-cyan-500',
              change: '+2 this week',
            },
            {
              label: 'Active Schedules',
              value: schedules.filter(s => s.isActive).length,
              icon: MdEventAvailable,
              color: 'from-green-500 to-emerald-500',
              change: '3 available today',
            },
            {
              label: 'Weekly Hours',
              value: `${schedules.reduce((acc, s) => {
                const start = new Date(`2000-01-01T${s.startTime}`);
                const end = new Date(`2000-01-01T${s.endTime}`);
                return acc + (end.getHours() - start.getHours());
              }, 0)}h`,
              icon: FiClock,
              color: 'from-purple-500 to-pink-500',
              change: '40h this week',
            },
            {
              label: 'Recurring',
              value: schedules.filter(s => s.isRecurring).length,
              icon: FiRepeat,
              color: 'from-orange-500 to-red-500',
              change: 'Weekly schedules',
            },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`bg-linear-to-br ${stat.color} rounded-2xl p-6 text-white shadow-xl`}
            >
              <div className='flex items-center justify-between mb-4'>
                <stat.icon className='w-8 h-8' />
                <span className='text-sm font-medium opacity-90'>
                  {stat.change}
                </span>
              </div>
              <div className='text-3xl font-bold mb-1'>{stat.value}</div>
              <div className='text-sm opacity-90'>{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Filters and Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className='bg-white rounded-2xl shadow-lg p-6 mb-8'
        >
          <div className='flex flex-col md:flex-row gap-6'>
            {/* View Mode Selector */}
            <div className='flex-1'>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                View Mode
              </label>
              <div className='flex space-x-1 bg-gray-100 rounded-xl p-1'>
                {[
                  { id: 'day', label: 'Day View', icon: FiCalendar },
                  { id: 'week', label: 'Week View', icon: MdSchedule },
                  { id: 'month', label: 'Month View', icon: FiCalendar },
                ].map(mode => (
                  <button
                    key={mode.id}
                    onClick={() => setViewMode(mode.id as any)}
                    className={`flex-1 py-2 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-all ${
                      viewMode === mode.id
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-blue-600'
                    }`}
                  >
                    <mode.icon className='w-4 h-4' />
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Date Selector */}
            <div className='flex-1'>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Select Date
              </label>
              <div className='flex items-center gap-2'>
                <button
                  onClick={() => {
                    const date = new Date(selectedDate);
                    date.setDate(date.getDate() - 1);
                    setSelectedDate(date.toISOString().split('T')[0]);
                  }}
                  className='p-2 hover:bg-gray-100 rounded-lg'
                >
                  <FiChevronLeft className='w-5 h-5 text-gray-600' />
                </button>
                <input
                  type='date'
                  value={selectedDate}
                  onChange={e => setSelectedDate(e.target.value)}
                  className='flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                />
                <button
                  onClick={() => {
                    const date = new Date(selectedDate);
                    date.setDate(date.getDate() + 1);
                    setSelectedDate(date.toISOString().split('T')[0]);
                  }}
                  className='p-2 hover:bg-gray-100 rounded-lg'
                >
                  <FiChevronRight className='w-5 h-5 text-gray-600' />
                </button>
              </div>
            </div>

            {/* Status Filter */}
            <div className='flex-1'>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Filter by Status
              </label>
              <div className='flex space-x-1 bg-gray-100 rounded-xl p-1'>
                {[
                  { id: 'all', label: 'All', icon: FiFilter },
                  { id: 'active', label: 'Active', icon: FiEye },
                  { id: 'inactive', label: 'Inactive', icon: FiEyeOff },
                ].map(status => (
                  <button
                    key={status.id}
                    onClick={() => setFilterStatus(status.id as any)}
                    className={`flex-1 py-2 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-all ${
                      filterStatus === status.id
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-blue-600'
                    }`}
                  >
                    <status.icon className='w-4 h-4' />
                    {status.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Week View */}
        {viewMode === 'week' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className='bg-white rounded-2xl shadow-xl p-6 mb-8'
          >
            <h2 className='text-2xl font-bold text-gray-900 mb-6'>
              Weekly Schedule
            </h2>

            <div className='overflow-x-auto'>
              <div className='grid grid-cols-8 min-w-250'>
                {/* Time Column */}
                <div className='col-span-1'>
                  <div className='h-16'></div>
                  {TIME_SLOTS.map(time => (
                    <div
                      key={time}
                      className='h-16 border-t border-gray-200 flex items-center justify-center text-sm text-gray-500'
                    >
                      {time}
                    </div>
                  ))}
                </div>

                {/* Day Columns */}
                {DAYS_OF_WEEK.map(day => {
                  const daySchedules = getDaySchedules(day);

                  return (
                    <div key={day} className='col-span-1'>
                      <div className='h-16 border-b border-gray-200 flex items-center justify-center font-semibold text-gray-900'>
                        {day}
                      </div>
                      {TIME_SLOTS.map(time => {
                        const schedule = daySchedules.find(s => {
                          const start = s.startTime;
                          const end = s.endTime;
                          return time >= start && time < end;
                        });

                        const isBreak = schedule?.breakTime === time;
                        const isActive = schedule?.isActive;

                        return (
                          <div
                            key={`${day}-${time}`}
                            className={`h-16 border-t border-gray-200 ${
                              schedule
                                ? isBreak
                                  ? 'bg-linear-to-r from-orange-100 to-amber-100'
                                  : isActive
                                    ? 'bg-linear-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 cursor-pointer'
                                    : 'bg-linear-to-r from-red-50 to-pink-50'
                                : 'hover:bg-gray-50 cursor-pointer'
                            }`}
                            onClick={() => {
                              if (schedule) {
                                openEditModal(schedule);
                              }
                            }}
                          >
                            {schedule && time === schedule.startTime && (
                              <div className='p-2'>
                                <div className='text-xs font-medium text-gray-900'>
                                  {schedule.startTime} - {schedule.endTime}
                                </div>
                                <div className='text-xs text-gray-500'>
                                  {schedule.slotDuration}min slots
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* Schedule List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className='bg-white rounded-2xl shadow-xl p-6'
        >
          <div className='flex justify-between items-center mb-6'>
            <h2 className='text-2xl font-bold text-gray-900'>All Schedules</h2>
            <div className='text-sm text-gray-600'>
              Showing {schedules.length} schedule
              {schedules.length !== 1 ? 's' : ''}
            </div>
          </div>

          {schedules.length === 0 ? (
            <div className='text-center py-12'>
              <MdSchedule className='w-16 h-16 text-gray-300 mx-auto mb-4' />
              <h3 className='text-lg font-medium text-gray-900 mb-2'>
                No schedules found
              </h3>
              <p className='text-gray-500 mb-6'>
                Add your first schedule to start accepting appointments
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className='bg-linear-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 mx-auto transition-all'
              >
                <FiPlus className='w-5 h-5' />
                Add Your First Schedule
              </button>
            </div>
          ) : (
            <div className='space-y-4'>
              {schedules.map(schedule => (
                <motion.div
                  key={schedule._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`p-6 rounded-xl border ${
                    schedule.isActive
                      ? 'border-green-200 bg-linear-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100'
                      : 'border-red-200 bg-linear-to-r from-red-50 to-pink-50 hover:from-red-100 hover:to-pink-100'
                  } transition-all`}
                >
                  <div className='flex flex-col md:flex-row md:items-center gap-6'>
                    {/* Schedule Info */}
                    <div className='flex-1'>
                      <div className='flex items-center gap-4 mb-3'>
                        <div className='flex items-center gap-2'>
                          <div
                            className={`w-3 h-3 rounded-full ${schedule.isActive ? 'bg-green-500' : 'bg-red-500'}`}
                          />
                          <span className='font-bold text-gray-900'>
                            {schedule.dayOfWeek ||
                              new Date(
                                schedule.date || ''
                              ).toLocaleDateString()}
                          </span>
                        </div>
                        {schedule.isRecurring && (
                          <span className='px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium flex items-center gap-1'>
                            <FiRepeat className='w-3 h-3' />
                            Recurring
                          </span>
                        )}
                      </div>

                      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                        <div className='flex items-center gap-3'>
                          <FiClock className='w-5 h-5 text-gray-500' />
                          <div>
                            <div className='text-sm text-gray-500'>Time</div>
                            <div className='font-medium text-gray-900'>
                              {schedule.startTime} - {schedule.endTime}
                            </div>
                          </div>
                        </div>

                        <div className='flex items-center gap-3'>
                          <FiWatch className='w-5 h-5 text-gray-500' />
                          <div>
                            <div className='text-sm text-gray-500'>
                              Slot Duration
                            </div>
                            <div className='font-medium text-gray-900'>
                              {schedule.slotDuration} minutes
                            </div>
                          </div>
                        </div>

                        <div className='flex items-center gap-3'>
                          <FiUsers className='w-5 h-5 text-gray-500' />
                          <div>
                            <div className='text-sm text-gray-500'>
                              Patients per Slot
                            </div>
                            <div className='font-medium text-gray-900'>
                              {schedule.maxPatientsPerSlot}
                            </div>
                          </div>
                        </div>
                      </div>

                      {schedule.breakTime && (
                        <div className='flex items-center gap-3 mt-4'>
                          <FiCoffee className='w-5 h-5 text-gray-500' />
                          <div>
                            <div className='text-sm text-gray-500'>
                              Break Time
                            </div>
                            <div className='font-medium text-gray-900'>
                              {schedule.breakTime}
                            </div>
                          </div>
                        </div>
                      )}

                      {schedule.notes && (
                        <div className='mt-4'>
                          <div className='text-sm text-gray-500 mb-1'>
                            Notes
                          </div>
                          <p className='text-gray-700'>{schedule.notes}</p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className='flex items-center gap-3'>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => toggleScheduleStatus(schedule)}
                        className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${
                          schedule.isActive
                            ? 'bg-red-100 text-red-700 hover:bg-red-200'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        {schedule.isActive ? (
                          <FiEyeOff className='w-4 h-4' />
                        ) : (
                          <FiEye className='w-4 h-4' />
                        )}
                        {schedule.isActive ? 'Deactivate' : 'Activate'}
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => openEditModal(schedule)}
                        className='px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-medium hover:bg-blue-200 flex items-center gap-2'
                      >
                        <FiEdit2 className='w-4 h-4' />
                        Edit
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => openDeleteModal(schedule)}
                        className='px-4 py-2 bg-red-100 text-red-700 rounded-lg font-medium hover:bg-red-200 flex items-center gap-2'
                      >
                        <FiTrash2 className='w-4 h-4' />
                        Delete
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Add Schedule Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className='fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4'>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className='bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto'
            >
              <div className='p-8'>
                <div className='flex justify-between items-center mb-8'>
                  <h2 className='text-2xl font-bold text-gray-900'>
                    Add New Schedule
                  </h2>
                  <button
                    onClick={() => {
                      setShowAddModal(false);
                      resetForm();
                    }}
                    className='p-2 hover:bg-gray-100 rounded-full transition-colors'
                  >
                    <FiX className='w-6 h-6 text-gray-500' />
                  </button>
                </div>

                {error && (
                  <div className='mb-6 p-4 bg-red-50 border border-red-200 rounded-xl'>
                    <div className='flex items-center gap-3'>
                      <FiAlertCircle className='w-5 h-5 text-red-600 shrink-0' />
                      <p className='text-red-700'>{error}</p>
                    </div>
                  </div>
                )}

                {success && (
                  <div className='mb-6 p-4 bg-green-50 border border-green-200 rounded-xl'>
                    <div className='flex items-center gap-3'>
                      <FiCheck className='w-5 h-5 text-green-600 shrink-0' />
                      <p className='text-green-700'>{success}</p>
                    </div>
                  </div>
                )}

                <form onSubmit={handleAddSchedule} className='space-y-6'>
                  {/* Schedule Type */}
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Schedule Type
                    </label>
                    <div className='flex space-x-1 bg-gray-100 rounded-xl p-1'>
                      {[
                        {
                          id: 'recurring',
                          label: 'Recurring Weekly',
                          icon: FiRepeat,
                        },
                        {
                          id: 'specific',
                          label: 'Specific Date',
                          icon: FiCalendar,
                        },
                      ].map(type => (
                        <button
                          key={type.id}
                          type='button'
                          onClick={() =>
                            setFormData({
                              ...formData,
                              isRecurring: type.id === 'recurring',
                              dayOfWeek:
                                type.id === 'recurring' ? 'Monday' : '',
                              date: type.id === 'specific' ? selectedDate : '',
                            })
                          }
                          className={`flex-1 py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-all ${
                            (type.id === 'recurring' && formData.isRecurring) ||
                            (type.id === 'specific' && !formData.isRecurring)
                              ? 'bg-white text-blue-600 shadow-sm'
                              : 'text-gray-600 hover:text-blue-600'
                          }`}
                        >
                          <type.icon className='w-4 h-4' />
                          {type.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Day/Date Selection */}
                  {formData.isRecurring ? (
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-2'>
                        Day of Week
                      </label>
                      <select
                        value={formData.dayOfWeek}
                        onChange={e =>
                          setFormData({
                            ...formData,
                            dayOfWeek: e.target.value,
                          })
                        }
                        required
                        className='w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                      >
                        <option value=''>Select a day</option>
                        {DAYS_OF_WEEK.map(day => (
                          <option key={day} value={day}>
                            {day}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-2'>
                        Date
                      </label>
                      <input
                        type='date'
                        value={formData.date}
                        onChange={e =>
                          setFormData({ ...formData, date: e.target.value })
                        }
                        required
                        className='w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                      />
                    </div>
                  )}

                  {/* Time Selection */}
                  <div className='grid grid-cols-2 gap-6'>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-2'>
                        Start Time
                      </label>
                      <input
                        type='time'
                        value={formData.startTime}
                        onChange={e =>
                          setFormData({
                            ...formData,
                            startTime: e.target.value,
                          })
                        }
                        required
                        className='w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                      />
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-2'>
                        End Time
                      </label>
                      <input
                        type='time'
                        value={formData.endTime}
                        onChange={e =>
                          setFormData({ ...formData, endTime: e.target.value })
                        }
                        required
                        className='w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                      />
                    </div>
                  </div>

                  {/* Slot Configuration */}
                  <div className='grid grid-cols-2 gap-6'>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-2'>
                        Slot Duration (minutes)
                      </label>
                      <select
                        value={formData.slotDuration}
                        onChange={e =>
                          setFormData({
                            ...formData,
                            slotDuration: parseInt(e.target.value),
                          })
                        }
                        className='w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                      >
                        <option value={15}>15 minutes</option>
                        <option value={30}>30 minutes</option>
                        <option value={45}>45 minutes</option>
                        <option value={60}>60 minutes</option>
                      </select>
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-2'>
                        Max Patients per Slot
                      </label>
                      <input
                        type='number'
                        min='1'
                        max='10'
                        value={formData.maxPatientsPerSlot}
                        onChange={e =>
                          setFormData({
                            ...formData,
                            maxPatientsPerSlot: parseInt(e.target.value),
                          })
                        }
                        className='w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                      />
                    </div>
                  </div>

                  {/* Break Time */}
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Break Time (Optional)
                    </label>
                    <input
                      type='time'
                      value={formData.breakTime}
                      onChange={e =>
                        setFormData({ ...formData, breakTime: e.target.value })
                      }
                      className='w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                    />
                  </div>

                  {/* Notes */}
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Notes (Optional)
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={e =>
                        setFormData({ ...formData, notes: e.target.value })
                      }
                      rows={3}
                      className='w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none'
                      placeholder='Add any notes about this schedule...'
                    />
                  </div>

                  {/* Submit Buttons */}
                  <div className='flex justify-end gap-4 pt-8 border-t border-gray-200'>
                    <button
                      type='button'
                      onClick={() => {
                        setShowAddModal(false);
                        resetForm();
                      }}
                      className='px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors'
                    >
                      Cancel
                    </button>
                    <button
                      type='submit'
                      disabled={isSubmitting}
                      className='px-6 py-3 bg-linear-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-xl font-semibold transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed'
                    >
                      {isSubmitting ? (
                        <>
                          <FiLoader className='w-5 h-5 animate-spin' />
                          Creating...
                        </>
                      ) : (
                        <>
                          <FiSave className='w-5 h-5' />
                          Create Schedule
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Schedule Modal */}
      <AnimatePresence>
        {showEditModal && selectedSchedule && (
          <div className='fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4'>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className='bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto'
            >
              <div className='p-8'>
                <div className='flex justify-between items-center mb-8'>
                  <h2 className='text-2xl font-bold text-gray-900'>
                    Edit Schedule
                  </h2>
                  <button
                    onClick={() => {
                      setShowEditModal(false);
                      resetForm();
                    }}
                    className='p-2 hover:bg-gray-100 rounded-full transition-colors'
                  >
                    <FiX className='w-6 h-6 text-gray-500' />
                  </button>
                </div>

                {error && (
                  <div className='mb-6 p-4 bg-red-50 border border-red-200 rounded-xl'>
                    <div className='flex items-center gap-3'>
                      <FiAlertCircle className='w-5 h-5 text-red-600 shrink-0' />
                      <p className='text-red-700'>{error}</p>
                    </div>
                  </div>
                )}

                <form onSubmit={handleUpdateSchedule} className='space-y-6'>
                  {/* Schedule Type */}
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Schedule Type
                    </label>
                    <div className='flex space-x-1 bg-gray-100 rounded-xl p-1'>
                      {[
                        {
                          id: 'recurring',
                          label: 'Recurring Weekly',
                          icon: FiRepeat,
                        },
                        {
                          id: 'specific',
                          label: 'Specific Date',
                          icon: FiCalendar,
                        },
                      ].map(type => (
                        <button
                          key={type.id}
                          type='button'
                          onClick={() =>
                            setFormData({
                              ...formData,
                              isRecurring: type.id === 'recurring',
                              dayOfWeek:
                                type.id === 'recurring' ? 'Monday' : '',
                              date: type.id === 'specific' ? selectedDate : '',
                            })
                          }
                          className={`flex-1 py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-all ${
                            (type.id === 'recurring' && formData.isRecurring) ||
                            (type.id === 'specific' && !formData.isRecurring)
                              ? 'bg-white text-blue-600 shadow-sm'
                              : 'text-gray-600 hover:text-blue-600'
                          }`}
                        >
                          <type.icon className='w-4 h-4' />
                          {type.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Day/Date Selection */}
                  {formData.isRecurring ? (
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-2'>
                        Day of Week
                      </label>
                      <select
                        value={formData.dayOfWeek}
                        onChange={e =>
                          setFormData({
                            ...formData,
                            dayOfWeek: e.target.value,
                          })
                        }
                        required
                        className='w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                      >
                        <option value=''>Select a day</option>
                        {DAYS_OF_WEEK.map(day => (
                          <option key={day} value={day}>
                            {day}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-2'>
                        Date
                      </label>
                      <input
                        type='date'
                        value={formData.date}
                        onChange={e =>
                          setFormData({ ...formData, date: e.target.value })
                        }
                        required
                        className='w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                      />
                    </div>
                  )}

                  {/* Time Selection */}
                  <div className='grid grid-cols-2 gap-6'>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-2'>
                        Start Time
                      </label>
                      <input
                        type='time'
                        value={formData.startTime}
                        onChange={e =>
                          setFormData({
                            ...formData,
                            startTime: e.target.value,
                          })
                        }
                        required
                        className='w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                      />
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-2'>
                        End Time
                      </label>
                      <input
                        type='time'
                        value={formData.endTime}
                        onChange={e =>
                          setFormData({ ...formData, endTime: e.target.value })
                        }
                        required
                        className='w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                      />
                    </div>
                  </div>

                  {/* Slot Configuration */}
                  <div className='grid grid-cols-2 gap-6'>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-2'>
                        Slot Duration (minutes)
                      </label>
                      <select
                        value={formData.slotDuration}
                        onChange={e =>
                          setFormData({
                            ...formData,
                            slotDuration: parseInt(e.target.value),
                          })
                        }
                        className='w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                      >
                        <option value={15}>15 minutes</option>
                        <option value={30}>30 minutes</option>
                        <option value={45}>45 minutes</option>
                        <option value={60}>60 minutes</option>
                      </select>
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-2'>
                        Max Patients per Slot
                      </label>
                      <input
                        type='number'
                        min='1'
                        max='10'
                        value={formData.maxPatientsPerSlot}
                        onChange={e =>
                          setFormData({
                            ...formData,
                            maxPatientsPerSlot: parseInt(e.target.value),
                          })
                        }
                        className='w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                      />
                    </div>
                  </div>

                  {/* Break Time */}
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Break Time (Optional)
                    </label>
                    <input
                      type='time'
                      value={formData.breakTime}
                      onChange={e =>
                        setFormData({ ...formData, breakTime: e.target.value })
                      }
                      className='w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                    />
                  </div>

                  {/* Notes */}
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Notes (Optional)
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={e =>
                        setFormData({ ...formData, notes: e.target.value })
                      }
                      rows={3}
                      className='w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none'
                      placeholder='Add any notes about this schedule...'
                    />
                  </div>

                  <div className='flex justify-end gap-4 pt-8 border-t border-gray-200'>
                    <button
                      type='button'
                      onClick={() => {
                        setShowEditModal(false);
                        resetForm();
                      }}
                      className='px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors'
                    >
                      Cancel
                    </button>
                    <button
                      type='submit'
                      disabled={isSubmitting}
                      className='px-6 py-3 bg-linear-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-xl font-semibold transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed'
                    >
                      {isSubmitting ? (
                        <>
                          <FiLoader className='w-5 h-5 animate-spin' />
                          Updating...
                        </>
                      ) : (
                        <>
                          <FiSave className='w-5 h-5' />
                          Update Schedule
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && selectedSchedule && (
          <div className='fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4'>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className='bg-white rounded-3xl shadow-2xl w-full max-w-md'
            >
              <div className='p-8'>
                <div className='text-center'>
                  <div className='w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                    <FiTrash2 className='w-8 h-8 text-red-600' />
                  </div>
                  <h3 className='text-2xl font-bold text-gray-900 mb-2'>
                    Delete Schedule
                  </h3>
                  <p className='text-gray-600 mb-6'>
                    Are you sure you want to delete the schedule for{' '}
                    <span className='font-semibold'>
                      {selectedSchedule.dayOfWeek ||
                        new Date(
                          selectedSchedule.date || ''
                        ).toLocaleDateString()}
                    </span>{' '}
                    from {selectedSchedule.startTime} to{' '}
                    {selectedSchedule.endTime}?
                  </p>
                  <p className='text-sm text-red-600 mb-8'>
                    This action cannot be undone.
                  </p>
                </div>

                <div className='flex justify-center gap-4'>
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className='px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors'
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteSchedule}
                    disabled={isSubmitting}
                    className='px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed'
                  >
                    {isSubmitting ? (
                      <>
                        <FiLoader className='w-5 h-5 animate-spin' />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <FiTrash2 className='w-5 h-5' />
                        Delete Schedule
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

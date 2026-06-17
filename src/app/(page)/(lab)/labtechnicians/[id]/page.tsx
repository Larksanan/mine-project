/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  FiArrowLeft as ArrowLeft,
  FiUser as User,
  FiMail as Mail,
  FiPhone as Phone,
  FiBriefcase as Briefcase,
  FiAward as Award,
  FiClock as Clock,
  FiCalendar as Calendar,
  FiEdit2 as Edit,
  FiTrash2 as Trash,
  FiAlertCircle as AlertCircle,
  FiCheckCircle as CheckCircle,
  FiXCircle as XCircle,
  FiActivity as Activity,
  FiCpu as Cpu,
  FiBarChart2 as Chart,
  FiDownload as Download,
  FiPrinter as Printer,
} from 'react-icons/fi';
import Toast from '@/components/ui/Toast';
import Loading from '@/components/ui/Loading';
import DeleteConfirmationModal from '@/components/ui/DeleteConfirmationModal';

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
    displayName: string;
  };
  createdAt: string;
  updatedAt: string;
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
    icon: XCircle,
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
  GENERAL: { label: 'General Shift', color: 'blue', time: 'Flexible hours' },
  MORNING: {
    label: 'Morning Shift',
    color: 'amber',
    time: '6:00 AM - 2:00 PM',
  },
  EVENING: {
    label: 'Evening Shift',
    color: 'purple',
    time: '2:00 PM - 10:00 PM',
  },
  NIGHT: { label: 'Night Shift', color: 'indigo', time: '10:00 PM - 6:00 AM' },
};

export default function TechnicianDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const resolvedParams = use(params);
  const [technician, setTechnician] = useState<Technician | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState(false);
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
    fetchTechnician();
  }, [resolvedParams.id]);

  const fetchTechnician = async () => {
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

  const handleDelete = async () => {
    if (!technician) return;

    try {
      const response = await fetch(
        `/api/lab/lab-technicians/${technician._id}`,
        {
          method: 'DELETE',
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete technician');
      }

      setToast({
        show: true,
        message: 'Technician deleted successfully',
        type: 'success',
      });

      setTimeout(() => {
        router.push('/labtechnicians');
      }, 2000);
    } catch (err: any) {
      setToast({
        show: true,
        message: err.message || 'Failed to delete technician',
        type: 'error',
      });
    } finally {
      setDeleteModal(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    if (!technician) return;

    const data = {
      Name: technician.name,
      'Employee ID': technician.employeeId,
      Email: technician.email,
      Phone: technician.phone,
      Specializations: technician.specialization.join(', '),
      Qualification: technician.qualification,
      'Years of Experience': technician.yearsOfExperience,
      Status: technician.status,
      Shift: technician.shift,
      'Max Concurrent Tests': technician.maxConcurrentTests,
      'Current Workload': technician.currentWorkload,
      'Performance Score': `${technician.performanceScore}%`,
      Efficiency: `${technician.efficiency}%`,
      'License Expired': technician.isLicenseExpired ? 'Yes' : 'No',
      'Joined Date': new Date(technician.joinedDate).toLocaleDateString(),
      Certifications: technician.certifications?.join(', ') || 'None',
      Notes: technician.notes || 'None',
      'Created At': new Date(technician.createdAt).toLocaleString(),
      'Last Updated': new Date(technician.updatedAt).toLocaleString(),
    };

    const csv = [
      Object.keys(data).join(','),
      Object.values(data)
        .map(v => `"${v}"`)
        .join(','),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `technician-${technician.employeeId}-${
      new Date().toISOString().split('T')[0]
    }.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    setToast({
      show: true,
      message: 'Data exported successfully',
      type: 'success',
    });
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
      {/* Decorative background elements */}
      <div className='fixed inset-0 overflow-hidden pointer-events-none'>
        <div className='absolute -top-40 -right-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob'></div>
        <div className='absolute -bottom-40 -left-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000'></div>
        <div className='absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000'></div>
      </div>

      {/* Header */}
      <div className='max-w-7xl mx-auto mb-8'>
        <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'>
          <div className='flex items-center gap-4'>
            <Link
              href='/labtechnicians'
              className='p-3 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-105'
            >
              <ArrowLeft className='w-6 h-6 text-gray-700' />
            </Link>
            <div>
              <h1 className='text-3xl sm:text-4xl font-bold bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent'>
                Technician Details
              </h1>
              <p className='text-gray-600 mt-1'>
                Complete information and metrics
              </p>
            </div>
          </div>
          <div className='flex items-center gap-3'>
            <button
              onClick={handleExport}
              className='px-4 py-3 bg-white text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all flex items-center gap-2 shadow-lg'
            >
              <Download className='w-5 h-5' />
              Export
            </button>
            <button
              onClick={handlePrint}
              className='px-4 py-3 bg-white text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all flex items-center gap-2 shadow-lg'
            >
              <Printer className='w-5 h-5' />
              Print
            </button>
            <Link
              href={`/labtechnicians/${technician._id}/edit`}
              className='px-6 py-3 bg-linear-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all flex items-center gap-2'
            >
              <Edit className='w-5 h-5' />
              Edit
            </Link>
            <button
              onClick={() => setDeleteModal(true)}
              className='px-6 py-3 bg-red-500 text-white font-semibold rounded-xl hover:bg-red-600 transition-all flex items-center gap-2 shadow-lg shadow-red-500/30'
            >
              <Trash className='w-5 h-5' />
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className='max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8'>
        {/* Left Column - Profile */}
        <div className='lg:col-span-1 space-y-6'>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className='bg-white rounded-3xl shadow-xl overflow-hidden'
          >
            {/* Profile Image */}
            <div className='relative h-32 bg-linear-to-r from-blue-500 to-purple-500'>
              <div className='absolute -bottom-16 left-1/2 transform -translate-x-1/2'>
                <div className='w-32 h-32 bg-white rounded-full p-2 shadow-xl'>
                  <div className='w-full h-full bg-linear-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center'>
                    <User className='w-16 h-16 text-white' />
                  </div>
                </div>
              </div>
              <div className='absolute top-4 right-4'>
                <div
                  className={`flex items-center gap-2 px-4 py-2 rounded-full ${statusConfig.bg} ${statusConfig.border} border-2`}
                >
                  <StatusIcon className={`w-5 h-5 ${statusConfig.text}`} />
                  <span className={`font-semibold ${statusConfig.text}`}>
                    {statusConfig.label}
                  </span>
                </div>
              </div>
            </div>

            {/* Name and ID */}
            <div className='pt-20 pb-6 px-6 text-center'>
              <h2 className='text-2xl font-bold text-gray-800 mb-2'>
                {technician.name}
              </h2>
              <p className='text-gray-600 font-medium'>
                Employee ID: {technician.employeeId}
              </p>
            </div>

            {/* Quick Stats */}
            <div className='grid grid-cols-2 gap-4 px-6 pb-6'>
              <div className='bg-linear-to-br from-blue-50 to-blue-100 rounded-2xl p-4 text-center'>
                <div className='text-3xl font-bold text-blue-600 mb-1'>
                  {technician.yearsOfExperience}
                </div>
                <div className='text-sm text-gray-600'>Years Exp</div>
              </div>
              <div className='bg-linear-to-br from-emerald-50 to-emerald-100 rounded-2xl p-4 text-center'>
                <div className='text-3xl font-bold text-emerald-600 mb-1'>
                  {technician.performanceScore}%
                </div>
                <div className='text-sm text-gray-600'>Performance</div>
              </div>
              <div className='bg-linear-to-br from-purple-50 to-purple-100 rounded-2xl p-4 text-center'>
                <div className='text-3xl font-bold text-purple-600 mb-1'>
                  {technician.efficiency}%
                </div>
                <div className='text-sm text-gray-600'>Efficiency</div>
              </div>
              <div className='bg-linear-to-br from-amber-50 to-amber-100 rounded-2xl p-4 text-center'>
                <div className='text-3xl font-bold text-amber-600 mb-1'>
                  {technician.currentWorkload}/{technician.maxConcurrentTests}
                </div>
                <div className='text-sm text-gray-600'>Workload</div>
              </div>
            </div>

            {/* Contact Info */}
            <div className='border-t border-gray-100 px-6 py-6 space-y-4'>
              <div className='flex items-start gap-3'>
                <div className='w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center shrink-0'>
                  <Mail className='w-5 h-5 text-blue-600' />
                </div>
                <div className='flex-1 min-w-0'>
                  <p className='text-sm text-gray-600 mb-1'>Email</p>
                  <p className='text-gray-800 font-medium break-all'>
                    {technician.email}
                  </p>
                </div>
              </div>
              <div className='flex items-start gap-3'>
                <div className='w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0'>
                  <Phone className='w-5 h-5 text-emerald-600' />
                </div>
                <div className='flex-1'>
                  <p className='text-sm text-gray-600 mb-1'>Phone</p>
                  <p className='text-gray-800 font-medium'>
                    {technician.phone}
                  </p>
                </div>
              </div>
              <div className='flex items-start gap-3'>
                <div className='w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center shrink-0'>
                  <Calendar className='w-5 h-5 text-purple-600' />
                </div>
                <div className='flex-1'>
                  <p className='text-sm text-gray-600 mb-1'>Joined Date</p>
                  <p className='text-gray-800 font-medium'>
                    {new Date(technician.joinedDate).toLocaleDateString(
                      'en-US',
                      {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      }
                    )}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Linked User */}
          {technician.user && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className='bg-white rounded-3xl shadow-xl p-6'
            >
              <h3 className='text-lg font-bold text-gray-800 mb-4 flex items-center gap-2'>
                <User className='w-5 h-5 text-blue-500' />
                Linked User Account
              </h3>
              <div className='space-y-3'>
                <div>
                  <p className='text-sm text-gray-600'>Name</p>
                  <p className='text-gray-800 font-medium'>
                    {technician.user.name}
                  </p>
                </div>
                <div>
                  <p className='text-sm text-gray-600'>Email</p>
                  <p className='text-gray-800 font-medium break-all'>
                    {technician.user.email}
                  </p>
                </div>
                <div>
                  <p className='text-sm text-gray-600'>NIC</p>
                  <p className='text-gray-800 font-medium'>
                    NIC: {technician.user.nic}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Right Column - Details */}
        <div className='lg:col-span-2 space-y-6'>
          {/* Professional Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className='bg-white rounded-3xl shadow-xl p-8'
          >
            <h3 className='text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3'>
              <Briefcase className='w-7 h-7 text-blue-500' />
              Professional Information
            </h3>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <div>
                <p className='text-sm text-gray-600 mb-3 font-semibold'>
                  Specializations
                </p>
                <div className='flex flex-wrap gap-2'>
                  {technician.specialization.map((spec, index) => (
                    <span
                      key={index}
                      className='px-4 py-2 bg-linear-to-r from-blue-50 to-purple-50 text-blue-700 rounded-xl font-medium border border-blue-200'
                    >
                      {spec}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className='text-sm text-gray-600 mb-3 font-semibold'>
                  Qualification
                </p>
                <p className='text-gray-800 font-medium text-lg'>
                  {technician.qualification}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Certifications */}
          {technician.certifications &&
            technician.certifications.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className='bg-white rounded-3xl shadow-xl p-8'
              >
                <h3 className='text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3'>
                  <Award className='w-7 h-7 text-purple-500' />
                  Certifications
                </h3>
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                  {technician.certifications.map((cert, index) => (
                    <div
                      key={index}
                      className='flex items-start gap-3 p-4 bg-linear-to-br from-purple-50 to-pink-50 rounded-2xl border border-purple-200'
                    >
                      <div className='w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center shrink-0'>
                        <Award className='w-5 h-5 text-white' />
                      </div>
                      <p className='text-gray-800 font-medium flex-1'>{cert}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

          {/* Shift & Schedule */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className='bg-white rounded-3xl shadow-xl p-8'
          >
            <h3 className='text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3'>
              <Clock className='w-7 h-7 text-amber-500' />
              Shift & Schedule
            </h3>
            <div className='space-y-6'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div className='p-6 bg-linear-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-200'>
                  <p className='text-sm text-gray-600 mb-2 font-semibold'>
                    Current Shift
                  </p>
                  <p className='text-2xl font-bold text-amber-700 mb-1'>
                    {shiftConfig.label}
                  </p>
                  <p className='text-amber-600'>{shiftConfig.time}</p>
                </div>
                <div className='p-6 bg-linear-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200'>
                  <p className='text-sm text-gray-600 mb-2 font-semibold'>
                    Availability
                  </p>
                  <p className='text-xl font-bold text-emerald-700'>
                    {technician.isAvailable
                      ? 'Available for work'
                      : 'Currently unavailable'}
                  </p>
                </div>
              </div>
              {technician.isLicenseExpired && (
                <div className='p-4 bg-red-50 border-l-4 border-red-500 rounded-lg'>
                  <div className='flex items-start gap-3'>
                    <AlertCircle className='w-6 h-6 text-red-500 shrink-0 mt-0.5' />
                    <div>
                      <p className='font-bold text-red-800 mb-1'>
                        License Expired
                      </p>
                      <p className='text-red-700 text-sm'>
                        This technician&apos;s license has expired and requires
                        renewal.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Performance Metrics */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className='bg-white rounded-3xl shadow-xl p-8'
          >
            <h3 className='text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3'>
              <Chart className='w-7 h-7 text-indigo-500' />
              Performance Metrics
            </h3>
            <div className='space-y-6'>
              {/* Performance Score */}
              <div>
                <div className='flex justify-between items-center mb-3'>
                  <span className='text-gray-700 font-semibold'>
                    Performance Score
                  </span>
                  <span className='text-2xl font-bold text-indigo-600'>
                    {technician.performanceScore}%
                  </span>
                </div>
                <div className='w-full bg-gray-200 rounded-full h-4 overflow-hidden'>
                  <div
                    className='bg-linear-to-r from-indigo-500 to-purple-500 h-full rounded-full transition-all duration-500'
                    style={{ width: `${technician.performanceScore}%` }}
                  />
                </div>
              </div>

              {/* Efficiency */}
              <div>
                <div className='flex justify-between items-center mb-3'>
                  <span className='text-gray-700 font-semibold'>
                    Efficiency
                  </span>
                  <span className='text-2xl font-bold text-emerald-600'>
                    {technician.efficiency}%
                  </span>
                </div>
                <div className='w-full bg-gray-200 rounded-full h-4 overflow-hidden'>
                  <div
                    className='bg-linear-to-r from-emerald-500 to-teal-500 h-full rounded-full transition-all duration-500'
                    style={{ width: `${technician.efficiency}%` }}
                  />
                </div>
              </div>

              {/* Workload */}
              <div>
                <div className='flex justify-between items-center mb-3'>
                  <span className='text-gray-700 font-semibold'>
                    Current Workload
                  </span>
                  <span className='text-2xl font-bold text-amber-600'>
                    {technician.currentWorkload} /{' '}
                    {technician.maxConcurrentTests} tests
                  </span>
                </div>
                <div className='w-full bg-gray-200 rounded-full h-4 overflow-hidden'>
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      technician.currentWorkload /
                        technician.maxConcurrentTests >
                      0.8
                        ? 'bg-red-500'
                        : technician.currentWorkload /
                              technician.maxConcurrentTests >
                            0.5
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                    }`}
                    style={{
                      width: `${
                        (technician.currentWorkload /
                          technician.maxConcurrentTests) *
                        100
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Notes */}
          {technician.notes && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className='bg-white rounded-3xl shadow-xl p-8'
            >
              <h3 className='text-2xl font-bold text-gray-800 mb-4 flex items-center gap-3'>
                <Cpu className='w-7 h-7 text-pink-500' />
                Additional Notes
              </h3>
              <p className='text-gray-700 leading-relaxed bg-gray-50 p-6 rounded-2xl border border-gray-200'>
                {technician.notes}
              </p>
            </motion.div>
          )}

          {/* System Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className='bg-white rounded-3xl shadow-xl p-8'
          >
            <h3 className='text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3'>
              <Cpu className='w-7 h-7 text-gray-500' />
              System Information
            </h3>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <div className='p-4 bg-gray-50 rounded-2xl border border-gray-200'>
                <p className='text-sm text-gray-600 mb-1'>Created At</p>
                <p className='text-gray-800 font-medium'>
                  {new Date(technician.createdAt).toLocaleString()}
                </p>
              </div>
              <div className='p-4 bg-gray-50 rounded-2xl border border-gray-200'>
                <p className='text-sm text-gray-600 mb-1'>Last Updated</p>
                <p className='text-gray-800 font-medium'>
                  {new Date(technician.updatedAt).toLocaleString()}
                </p>
              </div>
              <div className='md:col-span-2 p-4 bg-gray-50 rounded-2xl border border-gray-200'>
                <p className='text-sm text-gray-600 mb-1'>Technician ID</p>
                <p className='text-gray-800 font-mono text-sm break-all'>
                  {technician._id}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModal}
        onCancel={() => setDeleteModal(false)}
        onConfirm={handleDelete}
        title='Delete Technician'
        message={`Are you sure you want to delete ${technician.name}? This action cannot be undone.`}
      />

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

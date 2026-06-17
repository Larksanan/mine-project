/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  FiArrowLeft as ArrowLeft,
  FiEdit2 as Edit,
  FiTrash2 as Trash,
  FiUser as User,
  FiFileText as FileText,
  FiCalendar as Calendar,
  FiClock as Clock,
  FiCheckCircle as CheckCircle,
  FiXCircle as XCircle,
  FiActivity as Activity,
  FiAlertCircle as AlertCircle,
  FiDollarSign as DollarSign,
  FiMail as Mail,
  FiPhone as Phone,
  FiAward as Award,
  FiDownload as Download,
  FiPrinter as Printer,
} from 'react-icons/fi';
import Loading from '@/components/ui/Loading';
import Toast from '@/components/ui/Toast';
import DeleteConfirmationModal from '@/components/ui/DeleteConfirmationModal';

interface LabTestRequest {
  _id: string;
  patient: {
    _id: string;
    name?: string;
    firstName?: string;
    lastName?: string;
    fullName?: string;
    email: string;
    phone?: string;
    dateOfBirth?: string;
    gender?: string;
  };
  doctor: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    specialization?: string;
  };
  labTechnician?: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    specialization?: string[];
  };
  test: {
    _id: string;
    name: string;
    category: string;
    price: number;
    description?: string;
    testCode?: string;
  };
  status: 'REQUESTED' | 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  priority: 'NORMAL' | 'HIGH' | 'CRITICAL' | 'ROUTINE' | 'URGENT' | 'STAT';
  requestedDate: string;
  scheduledDate?: string;
  completedDate?: string;
  notes?: string;
  results?: string;
  createdAt: string;
  updatedAt: string;
}

const STATUS_CONFIG = {
  REQUESTED: {
    color: 'amber',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    icon: Clock,
    label: 'Requested',
  },
  PENDING: {
    color: 'amber',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    icon: Clock,
    label: 'Pending',
  },
  IN_PROGRESS: {
    color: 'blue',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    icon: Activity,
    label: 'In Progress',
  },
  COMPLETED: {
    color: 'emerald',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    icon: CheckCircle,
    label: 'Completed',
  },
  CANCELLED: {
    color: 'red',
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
    icon: XCircle,
    label: 'Cancelled',
  },
};

const PRIORITY_CONFIG = {
  NORMAL: {
    color: 'slate',
    bg: 'bg-slate-50',
    text: 'text-slate-700',
    border: 'border-slate-200',
    label: 'Normal',
  },
  HIGH: {
    color: 'orange',
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    border: 'border-orange-200',
    label: 'High',
  },
  CRITICAL: {
    color: 'red',
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
    label: 'Critical',
  },
  ROUTINE: {
    color: 'slate',
    bg: 'bg-slate-50',
    text: 'text-slate-700',
    border: 'border-slate-200',
    label: 'Routine',
  },
  URGENT: {
    color: 'orange',
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    border: 'border-orange-200',
    label: 'Urgent',
  },
  STAT: {
    color: 'red',
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
    label: 'STAT',
  },
};

export default function LabTestRequestDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const resolvedParams = use(params);
  const [request, setRequest] = useState<LabTestRequest | null>(null);
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
    fetchRequest();
  }, [resolvedParams.id]);

  const fetchRequest = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/lab/lab-test-requests/${resolvedParams.id}`
      );
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch request');
      }

      if (result.testRequest) {
        setRequest(result.testRequest);
      } else {
        throw new Error('Request not found');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load request');
      console.error('Error fetching request:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!request) return;

    try {
      const response = await fetch(
        `/api/lab/lab-test-requests/${request._id}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete request');
      }

      setToast({
        show: true,
        message: 'Request deleted successfully',
        type: 'success',
      });

      setTimeout(() => {
        router.push('/lab-test-requests');
      }, 2000);
    } catch (err: any) {
      setToast({
        show: true,
        message: err.message || 'Failed to delete request',
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
    if (!request) return;

    const data = {
      'Request ID': request._id,
      Patient:
        request.patient?.fullName &&
        request.patient.fullName !== 'undefined undefined'
          ? request.patient.fullName
          : request.patient?.name ||
            (request.patient?.firstName
              ? `${request.patient.firstName} ${request.patient.lastName || ''}`
              : 'N/A'),
      'Patient Email': request.patient?.email || 'N/A',
      'Patient Phone': request.patient?.phone || 'N/A',
      Doctor: request.doctor?.name || 'N/A',
      'Doctor Email': request.doctor?.email || 'N/A',
      'Lab Technician': request.labTechnician?.name || 'Not Assigned',
      'Technician Email': request.labTechnician?.email || 'N/A',
      'Test Name': request.test?.name || 'N/A',
      'Test Category': request.test?.category || 'N/A',
      'Test Price': `$${request.test?.price || 0}`,
      Status: request.status,
      Priority: request.priority,
      'Requested Date': new Date(request.requestedDate).toLocaleDateString(),
      'Scheduled Date': request.scheduledDate
        ? new Date(request.scheduledDate).toLocaleDateString()
        : 'N/A',
      'Completed Date': request.completedDate
        ? new Date(request.completedDate).toLocaleDateString()
        : 'N/A',
      Notes: request.notes || 'None',
      Results: request.results || 'Pending',
      'Created At': new Date(request.createdAt).toLocaleString(),
      'Last Updated': new Date(request.updatedAt).toLocaleString(),
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
    a.download = `lab-request-${request._id}-${
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

  if (error || !request) {
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
            Request Not Found
          </h2>
          <p className='text-gray-600 mb-8'>
            {error || 'The requested lab test request could not be found.'}
          </p>
          <Link
            href='/lab-test-requests'
            className='inline-flex items-center gap-2 px-6 py-3 bg-linear-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all'
          >
            <ArrowLeft className='w-5 h-5' />
            Back to Requests
          </Link>
        </motion.div>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[request.status] || STATUS_CONFIG.REQUESTED;
  const StatusIcon = statusConfig.icon;
  const priorityConfig =
    PRIORITY_CONFIG[request.priority] || PRIORITY_CONFIG.NORMAL;

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
              href='/lab-test-requests'
              className='p-3 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-105'
            >
              <ArrowLeft className='w-6 h-6 text-gray-700' />
            </Link>
            <div>
              <h1 className='text-3xl sm:text-4xl font-bold bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent'>
                Request Details
              </h1>
              <p className='text-gray-600 mt-1'>Lab test request information</p>
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
              href={`/labtestrequests/${request._id}/edit`}
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
      <div className='max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10'>
        {/* Left Column - Status & Overview */}
        <div className='lg:col-span-1 space-y-6'>
          {/* Status Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className='bg-white rounded-3xl shadow-xl p-6'
          >
            <h3 className='text-lg font-bold text-gray-800 mb-4'>
              Request Status
            </h3>
            <div
              className={`flex items-center gap-3 p-4 rounded-2xl ${statusConfig.bg} ${statusConfig.border} border-2 mb-4`}
            >
              <StatusIcon className={`w-8 h-8 ${statusConfig.text}`} />
              <div>
                <p className={`font-bold text-lg ${statusConfig.text}`}>
                  {statusConfig.label}
                </p>
                <p className='text-sm text-gray-600'>Current Status</p>
              </div>
            </div>
            <div
              className={`flex items-center gap-3 p-4 rounded-2xl ${priorityConfig.bg} ${priorityConfig.border} border-2`}
            >
              <AlertCircle className={`w-8 h-8 ${priorityConfig.text}`} />
              <div>
                <p className={`font-bold text-lg ${priorityConfig.text}`}>
                  {priorityConfig.label}
                </p>
                <p className='text-sm text-gray-600'>Priority Level</p>
              </div>
            </div>
          </motion.div>

          {/* Request ID */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className='bg-white rounded-3xl shadow-xl p-6'
          >
            <h3 className='text-lg font-bold text-gray-800 mb-4'>Request ID</h3>
            <p className='text-sm font-mono text-gray-600 bg-gray-50 p-4 rounded-xl break-all'>
              {request._id}
            </p>
          </motion.div>

          {/* Dates */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className='bg-white rounded-3xl shadow-xl p-6'
          >
            <h3 className='text-lg font-bold text-gray-800 mb-4 flex items-center gap-2'>
              <Calendar className='w-5 h-5 text-blue-500' />
              Important Dates
            </h3>
            <div className='space-y-4'>
              <div className='p-4 bg-blue-50 rounded-xl'>
                <p className='text-sm text-gray-600 mb-1'>Requested Date</p>
                <p className='font-bold text-gray-800'>
                  {new Date(request.requestedDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
              {request.scheduledDate && (
                <div className='p-4 bg-purple-50 rounded-xl'>
                  <p className='text-sm text-gray-600 mb-1'>Scheduled Date</p>
                  <p className='font-bold text-gray-800'>
                    {new Date(request.scheduledDate).toLocaleDateString(
                      'en-US',
                      {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      }
                    )}
                  </p>
                </div>
              )}
              {request.completedDate && (
                <div className='p-4 bg-emerald-50 rounded-xl'>
                  <p className='text-sm text-gray-600 mb-1'>Completed Date</p>
                  <p className='font-bold text-gray-800'>
                    {new Date(request.completedDate).toLocaleDateString(
                      'en-US',
                      {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      }
                    )}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Right Column - Details */}
        <div className='lg:col-span-2 space-y-6'>
          {/* Test Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className='bg-white rounded-3xl shadow-xl p-8'
          >
            <h3 className='text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3'>
              <FileText className='w-7 h-7 text-purple-500' />
              Test Information
            </h3>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <div className='md:col-span-2 p-6 bg-linear-to-br from-purple-50 to-pink-50 rounded-2xl border-2 border-purple-200'>
                <p className='text-sm text-gray-600 mb-2'>Test Name</p>
                <p className='text-2xl font-bold text-purple-700 mb-3'>
                  {request.test?.name || 'N/A'}
                </p>
                {request.test?.testCode && (
                  <p className='text-sm text-gray-600'>
                    Code: {request.test.testCode}
                  </p>
                )}
              </div>
              <div className='p-4 bg-gray-50 rounded-xl'>
                <p className='text-sm text-gray-600 mb-1'>Category</p>
                <p className='text-lg font-bold text-gray-800'>
                  {request.test?.category || 'N/A'}
                </p>
              </div>
              <div className='p-4 bg-emerald-50 rounded-xl'>
                <p className='text-sm text-gray-600 mb-1 flex items-center gap-1'>
                  <DollarSign className='w-4 h-4' />
                  Price
                </p>
                <p className='text-lg font-bold text-emerald-700'>
                  ${request.test?.price?.toFixed(2) || '0.00'}
                </p>
              </div>
              {request.test?.description && (
                <div className='md:col-span-2 p-4 bg-gray-50 rounded-xl'>
                  <p className='text-sm text-gray-600 mb-2'>Description</p>
                  <p className='text-gray-700'>{request.test.description}</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Patient Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className='bg-white rounded-3xl shadow-xl p-8'
          >
            <h3 className='text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3'>
              <User className='w-7 h-7 text-blue-500' />
              Patient Information
            </h3>
            <div className='space-y-4'>
              <div className='flex items-start gap-4'>
                <div className='w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center shrink-0'>
                  <User className='w-6 h-6 text-blue-600' />
                </div>
                <div className='flex-1'>
                  <p className='text-lg font-bold text-gray-800'>
                    {request.patient?.fullName &&
                    request.patient.fullName !== 'undefined undefined'
                      ? request.patient.fullName
                      : request.patient?.name ||
                        (request.patient?.firstName
                          ? `${request.patient.firstName} ${request.patient.lastName || ''}`
                          : 'N/A')}
                  </p>
                  <div className='flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-600'>
                    {request.patient?.email && (
                      <span className='flex items-center gap-1'>
                        <Mail className='w-4 h-4' />
                        {request.patient.email}
                      </span>
                    )}
                    {request.patient?.phone && (
                      <span className='flex items-center gap-1'>
                        <Phone className='w-4 h-4' />
                        {request.patient.phone}
                      </span>
                    )}
                  </div>
                  {request.patient?.dateOfBirth && (
                    <p className='text-sm text-gray-600 mt-2'>
                      DOB:{' '}
                      {new Date(
                        request.patient.dateOfBirth
                      ).toLocaleDateString()}
                    </p>
                  )}
                  {request.patient?.gender && (
                    <p className='text-sm text-gray-600'>
                      Gender: {request.patient.gender}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Doctor Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className='bg-white rounded-3xl shadow-xl p-8'
          >
            <h3 className='text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3'>
              <Award className='w-7 h-7 text-emerald-500' />
              Requesting Doctor
            </h3>
            <div className='space-y-4'>
              <div className='flex items-start gap-4'>
                <div className='w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center shrink-0'>
                  <Award className='w-6 h-6 text-emerald-600' />
                </div>
                <div className='flex-1'>
                  <p className='text-lg font-bold text-gray-800'>
                    {request.doctor?.name || 'N/A'}
                  </p>
                  {request.doctor?.specialization && (
                    <p className='text-sm text-gray-600 mb-2'>
                      {request.doctor.specialization}
                    </p>
                  )}
                  <div className='flex flex-wrap items-center gap-4 text-sm text-gray-600'>
                    {request.doctor?.email && (
                      <span className='flex items-center gap-1'>
                        <Mail className='w-4 h-4' />
                        {request.doctor.email}
                      </span>
                    )}
                    {request.doctor?.phone && (
                      <span className='flex items-center gap-1'>
                        <Phone className='w-4 h-4' />
                        {request.doctor.phone}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Lab Technician Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className='bg-white rounded-3xl shadow-xl p-8'
          >
            <h3 className='text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3'>
              <Activity className='w-7 h-7 text-amber-500' />
              Assigned Technician
            </h3>
            {request.labTechnician ? (
              <div className='space-y-4'>
                <div className='flex items-start gap-4'>
                  <div className='w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center shrink-0'>
                    <User className='w-6 h-6 text-amber-600' />
                  </div>
                  <div className='flex-1'>
                    <p className='text-lg font-bold text-gray-800'>
                      {request.labTechnician.name}
                    </p>
                    <div className='flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-600'>
                      {request.labTechnician.email && (
                        <span className='flex items-center gap-1'>
                          <Mail className='w-4 h-4' />
                          {request.labTechnician.email}
                        </span>
                      )}
                      {request.labTechnician.phone && (
                        <span className='flex items-center gap-1'>
                          <Phone className='w-4 h-4' />
                          {request.labTechnician.phone}
                        </span>
                      )}
                    </div>
                    {request.labTechnician.specialization &&
                      request.labTechnician.specialization.length > 0 && (
                        <div className='flex flex-wrap gap-2 mt-3'>
                          {request.labTechnician.specialization.map(
                            (spec, idx) => (
                              <span
                                key={idx}
                                className='px-3 py-1 bg-amber-50 text-amber-700 text-xs rounded-lg font-medium'
                              >
                                {spec}
                              </span>
                            )
                          )}
                        </div>
                      )}
                  </div>
                </div>
              </div>
            ) : (
              <div className='p-6 bg-gray-50 rounded-2xl text-center'>
                <AlertCircle className='w-12 h-12 text-gray-400 mx-auto mb-3' />
                <p className='text-gray-600 font-semibold'>
                  No technician assigned yet
                </p>
                <p className='text-sm text-gray-500 mt-1'>
                  A technician will be assigned when the test is scheduled
                </p>
              </div>
            )}
          </motion.div>

          {/* Notes */}
          {request.notes && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className='bg-white rounded-3xl shadow-xl p-8'
            >
              <h3 className='text-2xl font-bold text-gray-800 mb-4 flex items-center gap-3'>
                <FileText className='w-7 h-7 text-gray-500' />
                Notes & Instructions
              </h3>
              <p className='text-gray-700 leading-relaxed bg-gray-50 p-6 rounded-2xl border border-gray-200'>
                {request.notes}
              </p>
            </motion.div>
          )}

          {/* Results */}
          {request.results && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className='bg-white rounded-3xl shadow-xl p-8'
            >
              <h3 className='text-2xl font-bold text-gray-800 mb-4 flex items-center gap-3'>
                <CheckCircle className='w-7 h-7 text-emerald-500' />
                Test Results
              </h3>
              <div className='p-6 bg-emerald-50 rounded-2xl border-2 border-emerald-200'>
                <p className='text-gray-700 leading-relaxed whitespace-pre-wrap'>
                  {request.results}
                </p>
              </div>
            </motion.div>
          )}

          {/* System Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className='bg-white rounded-3xl shadow-xl p-8'
          >
            <h3 className='text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3'>
              <Clock className='w-7 h-7 text-gray-500' />
              System Information
            </h3>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='p-4 bg-gray-50 rounded-xl'>
                <p className='text-sm text-gray-600 mb-1'>Created At</p>
                <p className='text-gray-800 font-medium'>
                  {new Date(request.createdAt).toLocaleString()}
                </p>
              </div>
              <div className='p-4 bg-gray-50 rounded-xl'>
                <p className='text-sm text-gray-600 mb-1'>Last Updated</p>
                <p className='text-gray-800 font-medium'>
                  {new Date(request.updatedAt).toLocaleString()}
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
        title='Delete Test Request'
        message={`Are you sure you want to delete this lab test request? This action cannot be undone.`}
      />

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

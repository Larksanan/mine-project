/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect, use, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import {
  FiArrowLeft as ArrowLeft,
  FiSave as Save,
  FiUser as User,
  FiFileText as FileText,
  FiAlertCircle as AlertCircle,
  FiClock as Clock,
  FiSearch as Search,
} from 'react-icons/fi';
import {
  useLabTestRequest,
  useTestRequestActions,
} from '@/hooks/Uselabtestrequests';
import { useActiveLabTests } from '@/hooks/Uselabtests';
import Loading from '@/components/ui/Loading';
import ErrorComponent from '@/components/ui/Error';
import { LabTest } from '@/types/lab';
import { Patient } from '@/types/patient';

// Form schema
const requestSchema = z.object({
  patient: z.string().min(1, 'Patient is required'),
  test: z.string().min(1, 'Test is required'),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'STAT']),
  notes: z.string().optional(),
  isCritical: z.boolean(),
  requestedDate: z.string().optional(),
  status: z
    .enum([
      'REQUESTED',
      'SAMPLE_COLLECTED',
      'IN_PROGRESS',
      'COMPLETED',
      'VERIFIED',
      'CANCELLED',
    ])
    .optional(),
  sampleCollectedDate: z.string().optional(),
  startedDate: z.string().optional(),
  completedDate: z.string().optional(),
  results: z.string().optional(),
  findings: z.string().optional(),
});

type RequestFormData = z.infer<typeof requestSchema>;

interface EditLabTestRequestPageProps {
  params: Promise<{ id: string }>;
}

function EditLabTestRequestForm({ params }: EditLabTestRequestPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const isNew = id === 'new';
  const copyFrom = searchParams.get('copy');

  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientSearch, setPatientSearch] = useState('');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchingPatients, setSearchingPatients] = useState(false);
  const [showPatientSearch, setShowPatientSearch] = useState(!isNew);

  const { request, loading, error } = useLabTestRequest(
    isNew && !copyFrom ? '' : copyFrom || id
  );

  const { tests: fetchedTests, loading: loadingTests } =
    useActiveLabTests() as any;
  const tests = fetchedTests || [];
  const { createTestRequest, updateTestRequest, creating, updating } =
    useTestRequestActions();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<RequestFormData>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      priority: 'NORMAL',
      isCritical: false,
      status: 'REQUESTED',
      requestedDate: new Date().toISOString().split('T')[0],
    },
  });

  const selectedTestId = watch('test');
  const priority = watch('priority');

  // Populate form when editing existing request
  useEffect(() => {
    if (request) {
      const formatDateForInput = (dateValue: any) => {
        if (!dateValue) return '';
        const date = new Date(dateValue);
        return isNaN(date.getTime()) ? '' : date.toISOString().split('T')[0];
      };

      setValue('patient', request.patient._id);
      setValue('test', request.test._id);
      setValue('priority', request.priority);
      setValue('notes', request.notes || '');
      setValue('isCritical', request.isCritical || false);
      setValue('status', request.status);
      setValue('requestedDate', formatDateForInput(request.requestedDate));
      setValue(
        'sampleCollectedDate',
        formatDateForInput(request.sampleCollectedDate)
      );
      setValue('startedDate', formatDateForInput(request.startedDate));
      setValue('completedDate', formatDateForInput(request.completedDate));
      setValue('results', request.results || '');
      setValue('findings', request.findings || '');

      // Set selected patient from request
      setSelectedPatient({
        _id: request.patient._id,
        firstName: request.patient.firstName || '',
        lastName: request.patient.lastName || '',
        nic: request.patient.nic,
        email: request.patient.email,
        phone: request.patient.phone?.toString() || '',
        dateOfBirth: new Date(request.patient.dateOfBirth),
        gender: request.patient.gender as 'MALE' | 'FEMALE' | 'OTHER',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  }, [request, setValue]);

  // Search patients - FIXED VERSION
  const searchPatients = async (query: string) => {
    if (!query.trim()) {
      setPatients([]);
      return;
    }

    setSearchingPatients(true);
    try {
      // Use the API endpoint properly
      const response = await fetch(
        `/api/patients?search=${encodeURIComponent(query)}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch patients');
      }

      const data = await response.json();

      // Handle different response formats
      if (data.success && data.data) {
        setPatients(data.data);
      } else if (data.patients) {
        setPatients(data.patients);
      } else if (Array.isArray(data)) {
        setPatients(data);
      } else {
        setPatients([]);
      }
    } catch (err) {
      console.error('Error searching patients:', err);
      setPatients([]);
    } finally {
      setSearchingPatients(false);
    }
  };

  const handlePatientSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setPatientSearch(query);
    searchPatients(query);
  };

  const selectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setValue('patient', patient._id);
    setPatients([]);
    setPatientSearch('');
    setShowPatientSearch(false);
  };

  const onSubmit = async (data: RequestFormData) => {
    try {
      if (isNew) {
        const newRequest = await createTestRequest({
          ...data,
          patientId: data.patient,
          testId: data.test,
        });
        if (newRequest) {
          router.push(`/labtestrequests/${newRequest._id}`);
        }
      } else {
        const updated = await updateTestRequest(id, data);
        if (updated) {
          router.push(`/labtestrequests/${id}`);
        }
      }
    } catch (err) {
      console.error('Failed to save test request:', err);
    }
  };

  if (!isNew && loading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <Loading />
      </div>
    );
  }

  if (!isNew && error) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <ErrorComponent message={error} />
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {/* Header */}
        <div className='mb-8'>
          <Link
            href='/labtestrequests'
            className='inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4'
          >
            <ArrowLeft className='w-4 h-4 mr-1' />
            Back to Requests
          </Link>
          <h1 className='text-3xl font-bold text-gray-900'>
            {isNew ? 'Create New Test Request' : 'Edit Test Request'}
          </h1>
          <p className='mt-2 text-sm text-gray-600'>
            {isNew
              ? 'Create a new laboratory test request'
              : `Editing request #${request?._id.slice(-8).toUpperCase()}`}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
          {/* Patient Selection */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'
          >
            <h2 className='text-lg font-semibold text-gray-900 mb-4 flex items-center'>
              <User className='w-5 h-5 mr-2 text-gray-400' />
              Patient Information
            </h2>

            {selectedPatient && !showPatientSearch ? (
              <div className='flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg'>
                <div>
                  <p className='font-medium text-green-900'>
                    {selectedPatient.firstName} {selectedPatient.lastName}
                  </p>
                  <p className='text-sm text-green-700'>
                    {selectedPatient.nic}
                  </p>
                  <p className='text-xs text-green-600'>
                    {selectedPatient.email}
                  </p>
                </div>
                <button
                  type='button'
                  onClick={() => {
                    setSelectedPatient(null);
                    setValue('patient', '');
                    setShowPatientSearch(true);
                  }}
                  className='text-sm text-green-700 hover:text-green-800'
                >
                  Change
                </button>
              </div>
            ) : (
              <div>
                <div className='relative mb-4'>
                  <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5' />
                  <input
                    type='text'
                    value={patientSearch}
                    onChange={handlePatientSearch}
                    placeholder='Search by name, NIC, or email...'
                    className='w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  />
                </div>

                {searchingPatients && (
                  <div className='text-sm text-gray-500 flex items-center gap-2'>
                    <Loading />
                    <span>Searching...</span>
                  </div>
                )}

                {patients.length > 0 && (
                  <div className='border border-gray-200 rounded-lg divide-y max-h-64 overflow-y-auto'>
                    {patients.map(patient => (
                      <button
                        key={patient._id}
                        type='button'
                        onClick={() => selectPatient(patient)}
                        className='w-full p-4 text-left hover:bg-gray-50 transition-colors'
                      >
                        <p className='font-medium text-gray-900'>
                          {patient.firstName} {patient.lastName}
                        </p>
                        <p className='text-sm text-gray-500'>
                          {patient.nic} • {patient.email}
                        </p>
                      </button>
                    ))}
                  </div>
                )}

                {!searchingPatients &&
                  patientSearch &&
                  patients.length === 0 && (
                    <p className='text-sm text-gray-500 text-center py-4'>
                      No patients found
                    </p>
                  )}
              </div>
            )}

            {errors.patient && (
              <p className='mt-2 text-sm text-red-600 flex items-center gap-1'>
                <AlertCircle className='w-4 h-4' />
                {errors.patient.message}
              </p>
            )}
          </motion.div>

          {/* Test Selection */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'
          >
            <h2 className='text-lg font-semibold text-gray-900 mb-4 flex items-center'>
              <FileText className='w-5 h-5 mr-2 text-gray-400' />
              Test Selection
            </h2>

            {loadingTests ? (
              <Loading />
            ) : (
              <div className='grid gap-3 max-h-80 overflow-y-auto'>
                {tests.map((test: LabTest) => (
                  <button
                    key={test._id}
                    type='button'
                    onClick={() => setValue('test', test._id)}
                    className={`p-4 border rounded-lg text-left transition-colors ${
                      selectedTestId === test._id
                        ? 'bg-blue-50 border-blue-500'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className='flex items-start justify-between'>
                      <div>
                        <p className='font-medium text-gray-900'>{test.name}</p>
                        <p className='text-sm text-gray-500'>{test.category}</p>
                        <p className='text-xs text-gray-400 mt-1'>
                          {test.duration} min • {test.sampleType}
                        </p>
                      </div>
                      <p className='text-lg font-semibold text-gray-900'>
                        ${test.price}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {errors.test && (
              <p className='mt-2 text-sm text-red-600 flex items-center gap-1'>
                <AlertCircle className='w-4 h-4' />
                {errors.test.message}
              </p>
            )}
          </motion.div>

          {/* Request Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'
          >
            <h2 className='text-lg font-semibold text-gray-900 mb-4 flex items-center'>
              <Clock className='w-5 h-5 mr-2 text-gray-400' />
              Request Details
            </h2>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              {/* Priority */}
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Priority Level
                </label>
                <div className='grid grid-cols-2 gap-2'>
                  {['LOW', 'NORMAL', 'HIGH', 'STAT'].map(p => (
                    <button
                      key={p}
                      type='button'
                      onClick={() => setValue('priority', p as any)}
                      className={`p-2 border rounded-lg text-center transition-all ${
                        priority === p
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className='text-sm font-medium'>{p}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Requested Date */}
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Requested Date
                </label>
                <input
                  type='date'
                  {...register('requestedDate')}
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                />
              </div>

              {/* Critical Checkbox */}
              <div className='md:col-span-2'>
                <label className='flex items-center gap-3'>
                  <input
                    type='checkbox'
                    {...register('isCritical')}
                    className='w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500'
                  />
                  <div>
                    <span className='font-medium text-gray-900'>
                      Mark as Critical
                    </span>
                    <p className='text-sm text-gray-500'>
                      Critical tests require immediate attention
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </motion.div>

          {/* Status & Dates (for editing) */}
          {!isNew && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'
            >
              <h2 className='text-lg font-semibold text-gray-900 mb-4'>
                Status & Timeline
              </h2>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                {/* Status */}
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Status
                  </label>
                  <select
                    {...register('status')}
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  >
                    <option value='REQUESTED'>Requested</option>
                    <option value='SAMPLE_COLLECTED'>Sample Collected</option>
                    <option value='IN_PROGRESS'>In Progress</option>
                    <option value='COMPLETED'>Completed</option>
                    <option value='VERIFIED'>Verified</option>
                    <option value='CANCELLED'>Cancelled</option>
                  </select>
                </div>

                {/* Sample Collected Date */}
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Sample Collected Date
                  </label>
                  <input
                    type='date'
                    {...register('sampleCollectedDate')}
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  />
                </div>

                {/* Started Date */}
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Started Date
                  </label>
                  <input
                    type='date'
                    {...register('startedDate')}
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  />
                </div>

                {/* Completed Date */}
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Completed Date
                  </label>
                  <input
                    type='date'
                    {...register('completedDate')}
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* Results & Findings */}
          {!isNew && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'
            >
              <h2 className='text-lg font-semibold text-gray-900 mb-4'>
                Results & Findings
              </h2>

              <div className='space-y-4'>
                {/* Results */}
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Test Results
                  </label>
                  <textarea
                    {...register('results')}
                    rows={4}
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono'
                    placeholder='Enter test results...'
                  />
                </div>

                {/* Findings */}
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Clinical Findings
                  </label>
                  <textarea
                    {...register('findings')}
                    rows={4}
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                    placeholder='Enter clinical findings...'
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* Notes */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'
          >
            <h2 className='text-lg font-semibold text-gray-900 mb-4'>
              Additional Notes
            </h2>
            <textarea
              {...register('notes')}
              rows={3}
              className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
              placeholder='Enter any additional notes or instructions...'
            />
          </motion.div>

          {/* Form Actions */}
          <div className='flex items-center justify-end gap-4 pt-6 border-t'>
            <Link
              href='/labtestrequests'
              className='px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors'
            >
              Cancel
            </Link>
            <button
              type='submit'
              disabled={
                creating ||
                updating ||
                (isNew ? !selectedPatient || !selectedTestId : !isDirty)
              }
              className='px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2'
            >
              <Save className='w-5 h-5' />
              {creating || updating
                ? 'Saving...'
                : isNew
                  ? 'Create Request'
                  : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function EditLabTestRequestPage(
  props: EditLabTestRequestPageProps
) {
  return (
    <Suspense fallback={<Loading />}>
      <EditLabTestRequestForm {...props} />
    </Suspense>
  );
}

/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  FiArrowLeft as ArrowLeft,
  FiSave as Save,
  FiUser as User,
  FiFileText as FileText,
  FiCalendar as Calendar,
  FiAlertCircle as AlertCircle,
  FiActivity as Activity,
  FiSearch as Search,
} from 'react-icons/fi';
import Loading from '@/components/ui/Loading';
import Toast from '@/components/ui/Toast';

interface Patient {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  gender?: string;
  nic: string;
}

interface LabTest {
  _id: string;
  name: string;
  category: string;
  price: number;
  description?: string;
}

interface Technician {
  _id: string;
  name: string;
  email: string;
  specialization: string[];
  status: string;
}

interface FormData {
  requestedDate: any;
  scheduledDate: string;
  priority: any;
  patient: string;
  test: string;
  labTechnician: string;
  status: 'REQUESTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  notes: string;
}

export default function CreateLabTestRequestPage() {
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [tests, setTests] = useState<LabTest[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchNic, setSearchNic] = useState('');
  const [searchingPatient, setSearchingPatient] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    patient: '',
    test: '',
    labTechnician: '',
    status: 'REQUESTED',
    priority: 'NORMAL',
    requestedDate: new Date().toISOString().split('T')[0],
    scheduledDate: '',
    notes: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
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
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);

      // Fetch patients, tests, and technicians
      const [patientsRes, testsRes, techniciansRes] = await Promise.all([
        fetch('/api/patients'),
        fetch('/api/lab/lab-tests'),
        fetch('/api/lab/lab-technicians'),
      ]);

      const patientsData = await patientsRes.json();
      const testsData = await testsRes.json();
      const techniciansData = await techniciansRes.json();

      setPatients(patientsData.patients || []);
      setTests(testsData.tests || []);
      setTechnicians(techniciansData.technicians || []);
    } catch (err: any) {
      setToast({
        show: true,
        message: err.message || 'Failed to load data',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNicSearch = async () => {
    if (!searchNic.trim()) {
      setToast({
        show: true,
        message: 'Please enter a NIC number to search',
        type: 'error',
      });
      return;
    }

    try {
      setSearchingPatient(true);

      const response = await fetch(
        `/api/patients/search?nic=${encodeURIComponent(searchNic)}`
      );
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('No patient found with this NIC');
        }
        throw new Error(
          data.message || data.error || 'Failed to search patient'
        );
      }

      if (data.success && data.data) {
        const patient = data.data;
        // Format patient data to match interface
        const formattedPatient = {
          ...patient,
          name:
            patient.name ||
            (patient.firstName
              ? `${patient.firstName} ${patient.lastName || ''}`
              : 'N/A'),
        };

        // Update patients list with search results
        setPatients([formattedPatient]);

        // Auto-select the patient
        setFormData(prev => ({ ...prev, patient: patient._id }));
        setToast({
          show: true,
          message: `Patient found: ${formattedPatient.name}`,
          type: 'success',
        });
      } else {
        setToast({
          show: true,
          message: 'No patient found with this NIC',
          type: 'error',
        });
      }
    } catch (err: any) {
      setToast({
        show: true,
        message: err.message || 'Failed to search patient',
        type: 'error',
      });
    } finally {
      setSearchingPatient(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.patient) {
      newErrors.patient = 'Patient is required';
    }

    if (!formData.test) {
      newErrors.test = 'Test is required';
    }

    if (!formData.requestedDate) {
      newErrors.requestedDate = 'Requested date is required';
    }

    if (
      formData.scheduledDate &&
      new Date(formData.scheduledDate) < new Date(formData.requestedDate)
    ) {
      newErrors.scheduledDate =
        'Scheduled date cannot be before requested date';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      setToast({
        show: true,
        message: 'Please fix the errors in the form',
        type: 'error',
      });
      return;
    }

    try {
      setSubmitting(true);

      const submitData: any = {
        patient: formData.patient,
        test: formData.test,
        status: formData.status,
        priority: formData.priority,
        requestedDate: formData.requestedDate,
        notes: formData.notes,
      };

      // Only include optional fields if they have values
      if (formData.labTechnician) {
        submitData.labTechnician = formData.labTechnician;
      }

      if (formData.scheduledDate) {
        submitData.scheduledDate = formData.scheduledDate;
      }

      const response = await fetch('/api/lab/lab-test-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create request');
      }

      setToast({
        show: true,
        message: 'Test request created successfully',
        type: 'success',
      });

      setTimeout(() => {
        router.push('/labtestrequests');
      }, 1500);
    } catch (err: any) {
      setToast({
        show: true,
        message: err.message || 'Failed to create request',
        type: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className='min-h-screen bg-linear-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center'>
        <Loading />
      </div>
    );
  }

  const selectedTest = tests.find(t => t._id === formData.test);
  const selectedPatient = patients.find(p => p._id === formData.patient);

  return (
    <div className='min-h-screen bg-linear-to-br from-blue-50 via-white to-purple-50 py-8 px-4 sm:px-6 lg:px-8'>
      {/* Decorative background */}
      <div className='fixed inset-0 overflow-hidden pointer-events-none'>
        <div className='absolute -top-40 -right-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob'></div>
        <div className='absolute -bottom-40 -left-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000'></div>
      </div>

      {/* Header */}
      <div className='max-w-4xl mx-auto mb-8 relative z-10'>
        <div className='flex items-center gap-4 mb-6'>
          <Link
            href='/lab-test-requests'
            className='p-3 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-105'
          >
            <ArrowLeft className='w-6 h-6 text-gray-700' />
          </Link>
          <div>
            <h1 className='text-3xl sm:text-4xl font-bold bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent'>
              Create Lab Test Request
            </h1>
            <p className='text-gray-600 mt-1'>
              Submit a new laboratory test request
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className='max-w-4xl mx-auto relative z-10'>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className='bg-white rounded-3xl shadow-xl overflow-hidden'
        >
          <form onSubmit={handleSubmit}>
            {/* Patient & Test Selection */}
            <div className='p-8 border-b border-gray-100'>
              <h2 className='text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3'>
                <User className='w-7 h-7 text-blue-500' />
                Patient & Test Information
              </h2>

              {/* NIC Search */}
              <div className='mb-6 p-4 bg-blue-50 rounded-xl'>
                <label className='block text-sm font-semibold text-gray-700 mb-2'>
                  Search Patient by NIC
                </label>
                <div className='flex gap-3'>
                  <input
                    type='text'
                    value={searchNic}
                    onChange={e => setSearchNic(e.target.value)}
                    onKeyPress={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleNicSearch();
                      }
                    }}
                    placeholder='Enter NIC number (e.g., 200269700372)'
                    className='flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors'
                  />
                  <button
                    type='button'
                    onClick={handleNicSearch}
                    disabled={searchingPatient}
                    className='px-6 py-3 bg-blue-500 text-white font-semibold rounded-xl hover:bg-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2'
                  >
                    {searchingPatient ? (
                      <>
                        <div className='w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin' />
                        Searching...
                      </>
                    ) : (
                      <>
                        <Search className='w-5 h-5' />
                        Search
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                {/* Patient */}
                <div>
                  <label className='block text-sm font-semibold text-gray-700 mb-2'>
                    Patient <span className='text-red-500'>*</span>
                  </label>
                  <select
                    name='patient'
                    value={formData.patient}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-colors ${
                      errors.patient
                        ? 'border-red-300 focus:border-red-500'
                        : 'border-gray-200 focus:border-blue-500'
                    }`}
                  >
                    <option value=''>Select Patient</option>
                    {patients.map(patient => (
                      <option key={patient._id} value={patient._id}>
                        {patient.name} - {patient.nic}
                      </option>
                    ))}
                  </select>
                  {errors.patient && (
                    <p className='mt-1 text-sm text-red-500 flex items-center gap-1'>
                      <AlertCircle className='w-4 h-4' />
                      {errors.patient}
                    </p>
                  )}
                  {selectedPatient && (
                    <div className='mt-3 p-4 bg-green-50 rounded-xl'>
                      <p className='text-sm text-gray-700'>
                        <span className='font-semibold'>Email:</span>{' '}
                        {selectedPatient.email}
                      </p>
                      {selectedPatient.phone && (
                        <p className='text-sm text-gray-700 mt-1'>
                          <span className='font-semibold'>Phone:</span>{' '}
                          {selectedPatient.phone}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Test */}
                <div>
                  <label className='block text-sm font-semibold text-gray-700 mb-2'>
                    Lab Test <span className='text-red-500'>*</span>
                  </label>
                  <select
                    name='test'
                    value={formData.test}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-colors ${
                      errors.test
                        ? 'border-red-300 focus:border-red-500'
                        : 'border-gray-200 focus:border-blue-500'
                    }`}
                  >
                    <option value=''>Select Test</option>
                    {tests.map(test => (
                      <option key={test._id} value={test._id}>
                        {test.name} - ${test.price}
                      </option>
                    ))}
                  </select>
                  {errors.test && (
                    <p className='mt-1 text-sm text-red-500 flex items-center gap-1'>
                      <AlertCircle className='w-4 h-4' />
                      {errors.test}
                    </p>
                  )}
                  {selectedTest && (
                    <div className='mt-3 p-4 bg-blue-50 rounded-xl'>
                      <p className='text-sm text-gray-700'>
                        <span className='font-semibold'>Category:</span>{' '}
                        {selectedTest.category}
                      </p>
                      {selectedTest.description && (
                        <p className='text-sm text-gray-600 mt-1'>
                          {selectedTest.description}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Assignment & Priority */}
            <div className='p-8 border-b border-gray-100'>
              <h2 className='text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3'>
                <Activity className='w-7 h-7 text-purple-500' />
                Assignment & Priority
              </h2>

              <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                {/* Lab Technician */}
                <div>
                  <label className='block text-sm font-semibold text-gray-700 mb-2'>
                    Lab Technician
                  </label>
                  <select
                    name='labTechnician'
                    value={formData.labTechnician}
                    onChange={handleChange}
                    className='w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors'
                  >
                    <option value=''>Assign Later</option>
                    {technicians
                      .filter(tech => tech.status === 'AVAILABLE')
                      .map(tech => (
                        <option key={tech._id} value={tech._id}>
                          {tech.name}
                        </option>
                      ))}
                  </select>
                  <p className='mt-1 text-xs text-gray-500'>
                    Optional - Can be assigned later
                  </p>
                </div>

                {/* Status */}
                <div>
                  <label className='block text-sm font-semibold text-gray-700 mb-2'>
                    Status
                  </label>
                  <select
                    name='status'
                    value={formData.status}
                    onChange={handleChange}
                    className='w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors'
                  >
                    <option value='REQUESTED'>Requested</option>
                    <option value='IN_PROGRESS'>In Progress</option>
                    <option value='COMPLETED'>Completed</option>
                    <option value='CANCELLED'>Cancelled</option>
                  </select>
                </div>

                {/* Priority */}
                <div>
                  <label className='block text-sm font-semibold text-gray-700 mb-2'>
                    Priority
                  </label>
                  <select
                    name='priority'
                    value={formData.priority}
                    onChange={handleChange}
                    className='w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors'
                  >
                    <option value='NORMAL'>Normal</option>
                    <option value='HIGH'>High Priority</option>
                    <option value='CRITICAL'>Critical (STAT)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Dates */}
            <div className='p-8 border-b border-gray-100'>
              <h2 className='text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3'>
                <Calendar className='w-7 h-7 text-orange-500' />
                Schedule
              </h2>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                {/* Requested Date */}
                <div>
                  <label className='block text-sm font-semibold text-gray-700 mb-2'>
                    Requested Date <span className='text-red-500'>*</span>
                  </label>
                  <input
                    type='date'
                    name='requestedDate'
                    value={formData.requestedDate}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-colors ${
                      errors.requestedDate
                        ? 'border-red-300 focus:border-red-500'
                        : 'border-gray-200 focus:border-blue-500'
                    }`}
                  />
                  {errors.requestedDate && (
                    <p className='mt-1 text-sm text-red-500 flex items-center gap-1'>
                      <AlertCircle className='w-4 h-4' />
                      {errors.requestedDate}
                    </p>
                  )}
                </div>

                {/* Scheduled Date */}
                <div>
                  <label className='block text-sm font-semibold text-gray-700 mb-2'>
                    Scheduled Date
                  </label>
                  <input
                    type='date'
                    name='scheduledDate'
                    value={formData.scheduledDate}
                    onChange={handleChange}
                    min={formData.requestedDate}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-colors ${
                      errors.scheduledDate
                        ? 'border-red-300 focus:border-red-500'
                        : 'border-gray-200 focus:border-blue-500'
                    }`}
                  />
                  {errors.scheduledDate && (
                    <p className='mt-1 text-sm text-red-500 flex items-center gap-1'>
                      <AlertCircle className='w-4 h-4' />
                      {errors.scheduledDate}
                    </p>
                  )}
                  <p className='mt-1 text-xs text-gray-500'>
                    Optional - When the test will be performed
                  </p>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className='p-8 border-b border-gray-100'>
              <h2 className='text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3'>
                <FileText className='w-7 h-7 text-emerald-500' />
                Additional Information
              </h2>

              <div>
                <label className='block text-sm font-semibold text-gray-700 mb-2'>
                  Notes / Special Instructions
                </label>
                <textarea
                  name='notes'
                  value={formData.notes}
                  onChange={handleChange}
                  rows={4}
                  placeholder='Add any special instructions or notes about this test request...'
                  className='w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors resize-none'
                />
              </div>
            </div>

            {/* Submit Buttons */}
            <div className='p-8 bg-gray-50'>
              <div className='flex items-center justify-end gap-4'>
                <Link
                  href='/lab-test-requests'
                  className='px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-100 transition-all'
                >
                  Cancel
                </Link>
                <button
                  type='submit'
                  disabled={submitting}
                  className='px-8 py-3 bg-linear-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2'
                >
                  {submitting ? (
                    <>
                      <div className='w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin' />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Save className='w-5 h-5' />
                      Create Request
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
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

/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiArrowLeft as ArrowLeft,
  FiSearch as Search,
  FiCheckCircle as CheckCircle,
  FiClock as Clock,
  FiDollarSign as DollarSign,
  FiActivity as Activity,
  FiCalendar as Calendar,
  FiFileText as FileText,
  FiAlertCircle as AlertCircle,
  FiShoppingCart as ShoppingCart,
  FiInfo as Info,
  FiLayers as Layers,
} from 'react-icons/fi';
import Loading from '@/components/ui/Loading';
import Toast from '@/components/ui/Toast';

interface LabTest {
  _id: string;
  name: string;
  testCode: string;
  category: string;
  description?: string;
  price: number;
  sampleType?: string;
  processingTime?: string;
  normalRange?: string;
  preparationInstructions?: string;
  isActive: boolean;
}

interface BookingData {
  testId: string;
  priority: 'NORMAL' | 'HIGH' | 'CRITICAL';
  requestedDate: string;
  scheduledDate: string;
  notes: string;
}

const PRIORITY_CONFIG = {
  NORMAL: {
    label: 'Normal',
    description: 'Standard processing time',
    color: 'blue',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
  },
  HIGH: {
    label: 'High Priority',
    description: 'Expedited processing',
    color: 'orange',
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    border: 'border-orange-200',
  },
  CRITICAL: {
    label: 'Critical',
    description: 'Immediate attention required',
    color: 'red',
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
  },
};

const CATEGORIES = [
  'All',
  'Hematology',
  'Clinical Chemistry',
  'Microbiology',
  'Immunology',
  'Pathology',
  'Cytology',
  'Molecular Biology',
  'Blood Bank',
  'Toxicology',
  'Endocrinology',
  'Cardiology',
  'General Laboratory',
];

export default function PatientBookingPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [tests, setTests] = useState<LabTest[]>([]);
  const [filteredTests, setFilteredTests] = useState<LabTest[]>([]);
  const [selectedTest, setSelectedTest] = useState<LabTest | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [bookingData, setBookingData] = useState<BookingData>({
    testId: '',
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
    fetchTests();
  }, []);

  useEffect(() => {
    filterTests();
  }, [tests, searchQuery, filterCategory]);

  const fetchTests = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/lab/lab-tests?activeOnly=true');
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch tests');
      }

      setTests(result.tests || []);
    } catch (err: any) {
      setToast({
        show: true,
        message: err.message || 'Failed to load tests',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const filterTests = () => {
    let filtered = [...tests];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        test =>
          test.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          test.testCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          test.category?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply category filter
    if (filterCategory !== 'All') {
      filtered = filtered.filter(test => test.category === filterCategory);
    }

    setFilteredTests(filtered);
  };

  const handleSelectTest = (test: LabTest) => {
    setSelectedTest(test);
    setBookingData(prev => ({ ...prev, testId: test._id }));
    setErrors({});
  };

  const handleBookingDataChange = (field: keyof BookingData, value: any) => {
    setBookingData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateBooking = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!bookingData.testId) {
      newErrors.testId = 'Please select a test';
    }

    if (!bookingData.requestedDate) {
      newErrors.requestedDate = 'Requested date is required';
    }

    if (
      bookingData.scheduledDate &&
      new Date(bookingData.scheduledDate) < new Date(bookingData.requestedDate)
    ) {
      newErrors.scheduledDate =
        'Scheduled date cannot be before requested date';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateBooking()) {
      setToast({
        show: true,
        message: 'Please fix the errors in the form',
        type: 'error',
      });
      return;
    }

    if (!session?.user?.id) {
      setToast({
        show: true,
        message: 'Please login to book a test',
        type: 'error',
      });
      return;
    }

    try {
      setSubmitting(true);

      const submitData = {
        patient: session.user.id,
        test: bookingData.testId,
        priority: bookingData.priority,
        requestedDate: bookingData.requestedDate,
        scheduledDate: bookingData.scheduledDate || undefined,
        notes: bookingData.notes,
        status: 'REQUESTED',
      };

      const response = await fetch('/api/lab/lab-test-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to book test');
      }

      setToast({
        show: true,
        message: 'Test booked successfully! We will contact you soon.',
        type: 'success',
      });

      setTimeout(() => {
        router.push('/patient/appointments');
      }, 2000);
    } catch (err: any) {
      setToast({
        show: true,
        message: err.message || 'Failed to book test',
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

  return (
    <div className='min-h-screen bg-linear-to-br from-blue-50 via-white to-purple-50 py-8 px-4 sm:px-6 lg:px-8'>
      {/* Decorative background */}
      <div className='fixed inset-0 overflow-hidden pointer-events-none'>
        <div className='absolute -top-40 -right-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob'></div>
        <div className='absolute -bottom-40 -left-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000'></div>
      </div>

      {/* Header */}
      <div className='max-w-7xl mx-auto mb-8 relative z-10'>
        <div className='flex items-center gap-4 mb-6'>
          <Link
            href='/patient/dashboard'
            className='p-3 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-105'
          >
            <ArrowLeft className='w-6 h-6 text-gray-700' />
          </Link>
          <div>
            <h1 className='text-3xl sm:text-4xl font-bold bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent'>
              Book Lab Test
            </h1>
            <p className='text-gray-600 mt-1'>
              Select a test and schedule your appointment
            </p>
          </div>
        </div>
      </div>

      <div className='max-w-7xl mx-auto relative z-10'>
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
          {/* Left - Test Selection */}
          <div className='lg:col-span-2 space-y-6'>
            {/* Filters */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className='bg-white rounded-3xl shadow-xl p-6'
            >
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                {/* Search */}
                <div className='relative'>
                  <Search className='absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400' />
                  <input
                    type='text'
                    placeholder='Search tests...'
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className='w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors'
                  />
                </div>

                {/* Category Filter */}
                <div className='relative'>
                  <Layers className='absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400' />
                  <select
                    value={filterCategory}
                    onChange={e => setFilterCategory(e.target.value)}
                    className='w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors appearance-none bg-white'
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>
                        {cat === 'All' ? 'All Categories' : cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </motion.div>

            {/* Tests List */}
            <div className='space-y-4'>
              <AnimatePresence mode='wait'>
                {filteredTests.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className='bg-white rounded-3xl shadow-xl p-12 text-center'
                  >
                    <Activity className='w-16 h-16 text-gray-400 mx-auto mb-4' />
                    <h3 className='text-xl font-bold text-gray-800 mb-2'>
                      No Tests Found
                    </h3>
                    <p className='text-gray-600'>
                      Try adjusting your search or filters
                    </p>
                  </motion.div>
                ) : (
                  filteredTests.map((test, index) => (
                    <motion.div
                      key={test._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.05 }}
                      className={`bg-white rounded-2xl shadow-lg overflow-hidden cursor-pointer transition-all hover:shadow-xl ${
                        selectedTest?._id === test._id
                          ? 'ring-4 ring-blue-500'
                          : ''
                      }`}
                      onClick={() => handleSelectTest(test)}
                    >
                      <div className='p-6'>
                        <div className='flex items-start justify-between mb-4'>
                          <div className='flex-1'>
                            <h3 className='text-xl font-bold text-gray-800 mb-1'>
                              {test.name}
                            </h3>
                            <p className='text-sm text-gray-500 mb-2'>
                              {test.testCode}
                            </p>
                            <span className='inline-block px-3 py-1 bg-purple-50 text-purple-700 text-sm rounded-lg font-medium'>
                              {test.category}
                            </span>
                          </div>
                          <div className='text-right'>
                            <div className='flex items-center gap-1 text-emerald-600 mb-2'>
                              <DollarSign className='w-6 h-6' />
                              <span className='text-2xl font-bold'>
                                {test.price.toFixed(2)}
                              </span>
                            </div>
                            {selectedTest?._id === test._id && (
                              <CheckCircle className='w-6 h-6 text-blue-600 ml-auto' />
                            )}
                          </div>
                        </div>

                        {test.description && (
                          <p className='text-gray-600 text-sm mb-3 line-clamp-2'>
                            {test.description}
                          </p>
                        )}

                        <div className='flex flex-wrap gap-3 text-sm'>
                          {test.sampleType && (
                            <div className='flex items-center gap-2 text-gray-600'>
                              <Activity className='w-4 h-4' />
                              <span>{test.sampleType}</span>
                            </div>
                          )}
                          {test.processingTime && (
                            <div className='flex items-center gap-2 text-gray-600'>
                              <Clock className='w-4 h-4' />
                              <span>{test.processingTime}</span>
                            </div>
                          )}
                        </div>

                        {test.preparationInstructions && (
                          <div className='mt-3 p-3 bg-amber-50 rounded-lg border border-amber-200'>
                            <div className='flex items-start gap-2'>
                              <Info className='w-4 h-4 text-amber-600 shrink-0 mt-0.5' />
                              <p className='text-xs text-amber-800 line-clamp-2'>
                                {test.preparationInstructions}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Right - Booking Form */}
          <div className='lg:col-span-1'>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className='bg-white rounded-3xl shadow-xl p-6 sticky top-8'
            >
              <h2 className='text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2'>
                <ShoppingCart className='w-6 h-6 text-blue-600' />
                Booking Details
              </h2>

              {!selectedTest ? (
                <div className='text-center py-12'>
                  <FileText className='w-16 h-16 text-gray-300 mx-auto mb-4' />
                  <p className='text-gray-500'>
                    Select a test to continue booking
                  </p>
                </div>
              ) : (
                <div className='space-y-6'>
                  {/* Selected Test Summary */}
                  <div className='p-4 bg-blue-50 rounded-xl border-2 border-blue-200'>
                    <p className='text-sm text-gray-600 mb-1'>Selected Test</p>
                    <p className='font-bold text-gray-800'>
                      {selectedTest.name}
                    </p>
                    <div className='flex items-center justify-between mt-2'>
                      <span className='text-sm text-gray-600'>
                        {selectedTest.testCode}
                      </span>
                      <span className='text-lg font-bold text-emerald-600'>
                        ${selectedTest.price.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Priority Selection */}
                  <div>
                    <label className='block text-sm font-semibold text-gray-700 mb-3'>
                      Priority Level
                    </label>
                    <div className='space-y-2'>
                      {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
                        <button
                          key={key}
                          type='button'
                          onClick={() =>
                            handleBookingDataChange(
                              'priority',
                              key as BookingData['priority']
                            )
                          }
                          className={`w-full p-3 rounded-xl border-2 transition-all text-left ${
                            bookingData.priority === key
                              ? `${config.bg} ${config.border} ${config.text}`
                              : 'bg-white border-gray-200 text-gray-700'
                          }`}
                        >
                          <div className='flex items-center justify-between'>
                            <div>
                              <p className='font-semibold'>{config.label}</p>
                              <p className='text-xs opacity-75'>
                                {config.description}
                              </p>
                            </div>
                            {bookingData.priority === key && (
                              <CheckCircle className='w-5 h-5' />
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Requested Date */}
                  <div>
                    <label className='block text-sm font-semibold text-gray-700 mb-2'>
                      Requested Date <span className='text-red-500'>*</span>
                    </label>
                    <div className='relative'>
                      <Calendar className='absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400' />
                      <input
                        type='date'
                        value={bookingData.requestedDate}
                        onChange={e =>
                          handleBookingDataChange(
                            'requestedDate',
                            e.target.value
                          )
                        }
                        className={`w-full pl-11 pr-4 py-3 border-2 rounded-xl focus:outline-none transition-colors ${
                          errors.requestedDate
                            ? 'border-red-300 focus:border-red-500'
                            : 'border-gray-200 focus:border-blue-500'
                        }`}
                      />
                    </div>
                    {errors.requestedDate && (
                      <p className='mt-1 text-sm text-red-500 flex items-center gap-1'>
                        <AlertCircle className='w-4 h-4' />
                        {errors.requestedDate}
                      </p>
                    )}
                  </div>

                  {/* Preferred Date */}
                  <div>
                    <label className='block text-sm font-semibold text-gray-700 mb-2'>
                      Preferred Date (Optional)
                    </label>
                    <div className='relative'>
                      <Calendar className='absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400' />
                      <input
                        type='date'
                        value={bookingData.scheduledDate}
                        onChange={e =>
                          handleBookingDataChange(
                            'scheduledDate',
                            e.target.value
                          )
                        }
                        min={bookingData.requestedDate}
                        className={`w-full pl-11 pr-4 py-3 border-2 rounded-xl focus:outline-none transition-colors ${
                          errors.scheduledDate
                            ? 'border-red-300 focus:border-red-500'
                            : 'border-gray-200 focus:border-blue-500'
                        }`}
                      />
                    </div>
                    {errors.scheduledDate && (
                      <p className='mt-1 text-sm text-red-500 flex items-center gap-1'>
                        <AlertCircle className='w-4 h-4' />
                        {errors.scheduledDate}
                      </p>
                    )}
                  </div>

                  {/* Notes */}
                  <div>
                    <label className='block text-sm font-semibold text-gray-700 mb-2'>
                      Additional Notes
                    </label>
                    <textarea
                      value={bookingData.notes}
                      onChange={e =>
                        handleBookingDataChange('notes', e.target.value)
                      }
                      rows={3}
                      placeholder='Any special instructions or medical history...'
                      className='w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors resize-none'
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className='w-full py-4 bg-linear-to-r from-blue-500 to-purple-500 text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2'
                  >
                    {submitting ? (
                      <>
                        <div className='w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin' />
                        Booking...
                      </>
                    ) : (
                      <>
                        <CheckCircle className='w-5 h-5' />
                        Confirm Booking
                      </>
                    )}
                  </button>

                  {/* Info */}
                  <div className='p-4 bg-blue-50 rounded-xl border border-blue-200'>
                    <div className='flex items-start gap-2'>
                      <Info className='w-5 h-5 text-blue-600 shrink-0 mt-0.5' />
                      <p className='text-sm text-blue-800'>
                        After booking, our team will contact you to confirm the
                        appointment and provide further instructions.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
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

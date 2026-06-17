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
  FiFileText as FileText,
  FiCalendar as Calendar,
  FiAlertCircle as AlertCircle,
  FiActivity as Activity,
  FiInfo as Info,
  FiCheckCircle as CheckCircle,
} from 'react-icons/fi';
import Loading from '@/components/ui/Loading';
import Toast from '@/components/ui/Toast';

interface LabTest {
  _id: string;
  name: string;
  category: string;
  price: number;
  description?: string;
  preparationInstructions?: string;
}

interface FormData {
  appointmentType: string;
  reason: string;
  date: string;
  timeSlot: string;
  testId: string;
  notes: string;
}

interface TimeSlot {
  value: string;
  label: string;
  available: boolean;
}

export default function PatientBookLabTestPage() {
  const router = useRouter();
  const [tests, setTests] = useState<LabTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    appointmentType: 'BLOOD_TEST',
    reason: '',
    date: '',
    timeSlot: '',
    testId: '',
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

  // Available time slots
  const timeSlots: TimeSlot[] = [
    { value: '09:00', label: '9:00 AM', available: true },
    { value: '09:30', label: '9:30 AM', available: true },
    { value: '10:00', label: '10:00 AM', available: true },
    { value: '10:30', label: '10:30 AM', available: true },
    { value: '11:00', label: '11:00 AM', available: true },
    { value: '11:30', label: '11:30 AM', available: true },
    { value: '13:00', label: '1:00 PM', available: true },
    { value: '13:30', label: '1:30 PM', available: true },
    { value: '14:00', label: '2:00 PM', available: true },
    { value: '14:30', label: '2:30 PM', available: true },
    { value: '15:00', label: '3:00 PM', available: true },
    { value: '15:30', label: '3:30 PM', available: true },
  ];

  const appointmentTypes = [
    {
      value: 'BLOOD_TEST',
      label: 'Blood Test',
      icon: '🩸',
      description: 'Complete blood count, lipid profile, etc.',
    },
    {
      value: 'URINE_TEST',
      label: 'Urine Test',
      icon: '💧',
      description: 'Urinalysis, culture, etc.',
    },
    {
      value: 'XRAY',
      label: 'X-Ray',
      icon: '🩻',
      description: 'Chest, bone, dental X-rays',
    },
    {
      value: 'MRI',
      label: 'MRI',
      icon: '🧠',
      description: 'Magnetic Resonance Imaging',
    },
    {
      value: 'CT_SCAN',
      label: 'CT Scan',
      icon: '📊',
      description: 'Computed Tomography scan',
    },
    {
      value: 'ULTRASOUND',
      label: 'Ultrasound',
      icon: '👶',
      description: 'Abdominal, pelvic, pregnancy',
    },
    {
      value: 'ECG',
      label: 'ECG',
      icon: '❤️',
      description: 'Electrocardiogram',
    },
    {
      value: 'OTHER',
      label: 'Other',
      icon: '📋',
      description: 'Other lab tests',
    },
  ];

  // FIX 1: Removed redundant getElementById min-date setter — the input already
  // gets min={getMinDate()} directly, so the useEffect DOM manipulation was both
  // unnecessary and potentially unsafe (element may not exist yet).
  useEffect(() => {
    fetchTests();
  }, []);

  const fetchTests = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/lab/lab-tests');
      const data = await response.json();
      setTests(data.tests || []);
    } catch (err: any) {
      setToast({
        show: true,
        message: err.message || 'Failed to load lab tests',
        type: 'error',
      });
    } finally {
      setLoading(false);
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

    if (!formData.appointmentType) {
      newErrors.appointmentType = 'Please select an appointment type';
    }

    if (!formData.reason) {
      newErrors.reason = 'Please provide a reason for the test';
    } else if (formData.reason.length < 10) {
      newErrors.reason =
        'Please provide a more detailed reason (min 10 characters)';
    }

    if (!formData.date) {
      newErrors.date = 'Please select a date';
    } else {
      // FIX 2: Compare date strings directly (YYYY-MM-DD) to avoid UTC vs local
      // timezone mismatch. Previously, `new Date(formData.date)` parsed as UTC
      // midnight, which could be a day behind in negative-offset timezones,
      // causing a valid tomorrow date to fail validation.
      const todayStr = new Date().toISOString().split('T')[0];
      if (formData.date <= todayStr) {
        newErrors.date = 'Please select a future date';
      }
    }

    if (!formData.timeSlot) {
      newErrors.timeSlot = 'Please select a time slot';
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

      // FIX 3: Pass `test` and `notes` fields to the API so they are no longer
      // silently dropped. The route handler now uses body.test and body.notes.
      const submitData = {
        appointmentType: formData.appointmentType,
        reason: formData.reason,
        date: formData.date,
        timeSlot: formData.timeSlot,
        test: formData.testId || undefined,
        notes: formData.notes || undefined,
      };

      const response = await fetch('/api/lab/lab-test-requests/patient', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to book appointment');
      }

      setToast({
        show: true,
        message: 'Appointment booked successfully!',
        type: 'success',
      });

      setTimeout(() => {
        router.push('/labtestrequests/patient');
      }, 2000);
    } catch (err: any) {
      setToast({
        show: true,
        message: err.message || 'Failed to book appointment',
        type: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const selectedTest = tests.find(t => t._id === formData.testId);
  const selectedAppointmentType = appointmentTypes.find(
    t => t.value === formData.appointmentType
  );

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
      <div className='max-w-4xl mx-auto mb-8 relative z-10'>
        <div className='flex items-center gap-4 mb-6'>
          <Link
            href='/labtestrequests/patient'
            className='p-3 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-105'
          >
            <ArrowLeft className='w-6 h-6 text-gray-700' />
          </Link>
          <div>
            <h1
              className='text-3xl sm:text-4xl font-bold bg-linear
            -to-r from-blue-600 to-purple-600 bg-clip-text text-transparent'
            >
              Book Lab Test Appointment
            </h1>
            <p className='text-gray-600 mt-1'>
              Schedule your laboratory tests online
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
            {/* Appointment Type */}
            <div className='p-8 border-b border-gray-100'>
              <h2 className='text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3'>
                <Activity className='w-7 h-7 text-blue-500' />
                Appointment Details
              </h2>

              <div className='mb-6'>
                <label className='block text-sm font-semibold text-gray-700 mb-3'>
                  Test Type <span className='text-red-500'>*</span>
                </label>
                <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
                  {appointmentTypes.map(type => (
                    <button
                      key={type.value}
                      type='button'
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          appointmentType: type.value,
                        }));
                        if (errors.appointmentType) {
                          const newErrors = { ...errors };
                          delete newErrors.appointmentType;
                          setErrors(newErrors);
                        }
                      }}
                      className={`p-4 rounded-xl border-2 transition-all text-left ${
                        formData.appointmentType === type.value
                          ? 'border-blue-500 bg-blue-50 shadow-md'
                          : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50'
                      }`}
                    >
                      <div className='text-2xl mb-2'>{type.icon}</div>
                      <div className='font-semibold text-gray-800 text-sm'>
                        {type.label}
                      </div>
                      <div className='text-xs text-gray-500 mt-1'>
                        {type.description.substring(0, 30)}...
                      </div>
                    </button>
                  ))}
                </div>
                {errors.appointmentType && (
                  <p className='mt-2 text-sm text-red-500 flex items-center gap-1'>
                    <AlertCircle className='w-4 h-4' />
                    {errors.appointmentType}
                  </p>
                )}
              </div>

              {/* Reason */}
              <div className='mb-6'>
                <label className='block text-sm font-semibold text-gray-700 mb-2'>
                  Reason for Test <span className='text-red-500'>*</span>
                </label>
                <textarea
                  name='reason'
                  value={formData.reason}
                  onChange={handleChange}
                  rows={3}
                  placeholder='Please describe your symptoms or reason for requesting this test...'
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-colors resize-none ${
                    errors.reason
                      ? 'border-red-300 focus:border-red-500'
                      : 'border-gray-200 focus:border-blue-500'
                  }`}
                />
                {errors.reason && (
                  <p className='mt-1 text-sm text-red-500 flex items-center gap-1'>
                    <AlertCircle className='w-4 h-4' />
                    {errors.reason}
                  </p>
                )}
              </div>

              {/* Specific Test (Optional) */}
              <div>
                <label className='block text-sm font-semibold text-gray-700 mb-2'>
                  Specific Test (Optional)
                </label>
                <select
                  name='testId'
                  value={formData.testId}
                  onChange={handleChange}
                  className='w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors'
                >
                  <option value=''>Select a specific test (optional)</option>
                  {tests.map(test => (
                    <option key={test._id} value={test._id}>
                      {test.name} - {test.category} (LKR{test.price})
                    </option>
                  ))}
                </select>
                {selectedTest && selectedTest.preparationInstructions && (
                  <div className='mt-3 p-4 bg-blue-50 rounded-xl'>
                    <div className='flex items-start gap-2'>
                      <Info className='w-5 h-5 text-blue-600 mt-0.5' />
                      <div>
                        <p className='font-semibold text-blue-800 text-sm'>
                          Preparation Instructions:
                        </p>
                        <p className='text-sm text-blue-700'>
                          {selectedTest.preparationInstructions}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                <p className='mt-1 text-xs text-gray-500'>
                  You can select a specific test or leave it blank for general
                  consultation
                </p>
              </div>
            </div>

            {/* Schedule */}
            <div className='p-8 border-b border-gray-100'>
              <h2 className='text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3'>
                <Calendar className='w-7 h-7 text-orange-500' />
                Select Date & Time
              </h2>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                {/* Date */}
                <div>
                  <label className='block text-sm font-semibold text-gray-700 mb-2'>
                    Preferred Date <span className='text-red-500'>*</span>
                  </label>
                  <input
                    type='date'
                    name='date'
                    id='date'
                    value={formData.date}
                    onChange={handleChange}
                    min={getMinDate()}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-colors ${
                      errors.date
                        ? 'border-red-300 focus:border-red-500'
                        : 'border-gray-200 focus:border-blue-500'
                    }`}
                  />
                  {errors.date && (
                    <p className='mt-1 text-sm text-red-500 flex items-center gap-1'>
                      <AlertCircle className='w-4 h-4' />
                      {errors.date}
                    </p>
                  )}
                </div>

                {/* Time Slot */}
                <div>
                  <label className='block text-sm font-semibold text-gray-700 mb-2'>
                    Preferred Time <span className='text-red-500'>*</span>
                  </label>
                  <select
                    name='timeSlot'
                    value={formData.timeSlot}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-colors ${
                      errors.timeSlot
                        ? 'border-red-300 focus:border-red-500'
                        : 'border-gray-200 focus:border-blue-500'
                    }`}
                  >
                    <option value=''>Select Time Slot</option>
                    {timeSlots.map(slot => (
                      <option key={slot.value} value={slot.value}>
                        {slot.label}
                      </option>
                    ))}
                  </select>
                  {errors.timeSlot && (
                    <p className='mt-1 text-sm text-red-500 flex items-center gap-1'>
                      <AlertCircle className='w-4 h-4' />
                      {errors.timeSlot}
                    </p>
                  )}
                  <p className='mt-1 text-xs text-gray-500'>
                    Operating hours: 9:00 AM - 4:00 PM (Monday - Friday)
                  </p>
                </div>
              </div>
            </div>

            {/* Additional Notes */}
            <div className='p-8 border-b border-gray-100'>
              <h2 className='text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3'>
                <FileText className='w-7 h-7 text-emerald-500' />
                Additional Information
              </h2>

              <div>
                <label className='block text-sm font-semibold text-gray-700 mb-2'>
                  Additional Notes (Optional)
                </label>
                <textarea
                  name='notes'
                  value={formData.notes}
                  onChange={handleChange}
                  rows={3}
                  placeholder='Any additional information or special requirements...'
                  className='w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors resize-none'
                />
              </div>
            </div>

            {/* Summary */}
            <div className='p-8 bg-linear-to-r from-blue-50 to-purple-50'>
              <h2 className='text-2xl font-bold text-gray-800 mb-4 flex items-center gap-3'>
                <CheckCircle className='w-7 h-7 text-green-500' />
                Appointment Summary
              </h2>
              <div className='bg-white rounded-xl p-6 shadow-md'>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div>
                    <p className='text-sm text-gray-500'>Test Type</p>
                    <p className='font-semibold text-gray-800'>
                      {selectedAppointmentType?.label || 'Not selected'}
                    </p>
                  </div>
                  <div>
                    <p className='text-sm text-gray-500'>Selected Date</p>
                    <p className='font-semibold text-gray-800'>
                      {formData.date
                        ? new Date(
                            formData.date + 'T00:00:00'
                          ).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })
                        : 'Not selected'}
                    </p>
                  </div>
                  <div>
                    <p className='text-sm text-gray-500'>Selected Time</p>
                    <p className='font-semibold text-gray-800'>
                      {timeSlots.find(s => s.value === formData.timeSlot)
                        ?.label || 'Not selected'}
                    </p>
                  </div>
                  <div>
                    <p className='text-sm text-gray-500'>Specific Test</p>
                    <p className='font-semibold text-gray-800'>
                      {selectedTest?.name || 'None (General consultation)'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className='p-8 bg-gray-50'>
              <div className='flex items-center justify-end gap-4'>
                <Link
                  href='/patient/lab-test-requests'
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
                      Booking...
                    </>
                  ) : (
                    <>
                      <Save className='w-5 h-5' />
                      Book Appointment
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

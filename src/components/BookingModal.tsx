/* eslint-disable no-undef */
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { AnimatePresence } from 'framer-motion';
import {
  FiCalendar,
  FiClock,
  FiX,
  FiCheckCircle,
  FiAlertCircle,
} from 'react-icons/fi';
import { DoctorProfile, BookingFormData } from '@/types/booking';
import { modalVariants } from '@/animations/variants';

interface BookingModalProps {
  doctor: DoctorProfile;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: BookingFormData) => Promise<void>;
}

export const BookingModal = ({
  doctor,
  isOpen,
  onClose,
  onSubmit,
}: BookingModalProps) => {
  const [formData, setFormData] = useState<BookingFormData>({
    doctorId: doctor._id,
    appointmentDate: '',
    appointmentTime: '',
    reason: '',
    symptoms: '',
    notes: '',
    type: 'CONSULTATION',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.appointmentDate) {
      errors.appointmentDate = 'Please select a date';
    } else {
      const selectedDate = new Date(formData.appointmentDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (selectedDate < today) {
        errors.appointmentDate = 'Date cannot be in the past';
      }
    }

    if (!formData.appointmentTime) {
      errors.appointmentTime = 'Please select a time';
    }

    if (!formData.reason.trim()) {
      errors.reason = 'Please provide a reason for visit';
    }

    if (!formData.type) {
      errors.type = 'Please select appointment type';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 90);
    return maxDate.toISOString().split('T')[0];
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm'
        >
          <motion.div
            variants={modalVariants}
            initial='hidden'
            animate='visible'
            exit='exit'
            className='bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto'
          >
            {/* Modal Header */}
            <div className='sticky top-0 bg-white border-b border-gray-200 px-8 py-6 flex items-center justify-between rounded-t-2xl'>
              <div className='flex items-center gap-4'>
                <div className='w-12 h-12 bg-linear-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white text-xl font-bold'>
                  {doctor.name.charAt(0)}
                </div>
                <div>
                  <h2 className='text-2xl font-bold text-gray-900'>
                    Book Appointment
                  </h2>
                  <p className='text-sm text-gray-600'>
                    Dr. {doctor.name} • {doctor.specialization}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className='p-2 hover:bg-gray-100 rounded-lg transition-colors'
              >
                <FiX className='w-6 h-6' />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className='p-8 space-y-6'>
              {/* Doctor Info Card */}
              <div className='bg-linear-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-100'>
                <div className='flex justify-between items-start'>
                  <div>
                    <h3 className='font-semibold text-gray-900'>
                      Consultation Details
                    </h3>
                    <p className='text-sm text-gray-600 mt-1'>
                      {doctor.hospital}
                    </p>
                  </div>
                  <div className='text-right'>
                    <p className='text-2xl font-bold text-blue-600'>
                      LKR {doctor.consultationFee.toLocaleString()}
                    </p>
                    <p className='text-sm text-gray-500'>Consultation fee</p>
                  </div>
                </div>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                {/* Appointment Date */}
                <div>
                  <label className='block text-sm font-semibold text-gray-700 mb-3'>
                    <FiCalendar className='inline w-4 h-4 mr-2' />
                    Appointment Date *
                  </label>
                  <input
                    type='date'
                    name='appointmentDate'
                    value={formData.appointmentDate}
                    onChange={handleChange}
                    min={getMinDate()}
                    max={getMaxDate()}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      formErrors.appointmentDate
                        ? 'border-red-300 bg-red-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  />
                  {formErrors.appointmentDate && (
                    <p className='mt-2 text-sm text-red-600 flex items-center gap-1'>
                      <FiAlertCircle className='w-4 h-4' />
                      {formErrors.appointmentDate}
                    </p>
                  )}
                </div>

                {/* Appointment Time */}
                <div>
                  <label className='block text-sm font-semibold text-gray-700 mb-3'>
                    <FiClock className='inline w-4 h-4 mr-2' />
                    Appointment Time *
                  </label>
                  <input
                    type='time'
                    name='appointmentTime'
                    value={formData.appointmentTime}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      formErrors.appointmentTime
                        ? 'border-red-300 bg-red-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  />
                  {formErrors.appointmentTime && (
                    <p className='mt-2 text-sm text-red-600 flex items-center gap-1'>
                      <FiAlertCircle className='w-4 h-4' />
                      {formErrors.appointmentTime}
                    </p>
                  )}
                </div>
              </div>

              {/* Appointment Type */}
              <div>
                <label className='block text-sm font-semibold text-gray-700 mb-3'>
                  Appointment Type *
                </label>
                <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
                  {(
                    [
                      'CONSULTATION',
                      'FOLLOW_UP',
                      'CHECK_UP',
                      'EMERGENCY',
                    ] as const
                  ).map(type => (
                    <button
                      key={type}
                      type='button'
                      onClick={() => setFormData(prev => ({ ...prev, type }))}
                      className={`px-4 py-3 rounded-xl border-2 transition-all ${
                        formData.type === type
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700'
                      }`}
                    >
                      <div className='text-sm font-medium'>
                        {type.replace('_', ' ')}
                      </div>
                    </button>
                  ))}
                </div>
                {formErrors.type && (
                  <p className='mt-2 text-sm text-red-600'>{formErrors.type}</p>
                )}
              </div>

              {/* Reason for Visit */}
              <div>
                <label className='block text-sm font-semibold text-gray-700 mb-3'>
                  Reason for Visit *
                </label>
                <textarea
                  name='reason'
                  value={formData.reason}
                  onChange={handleChange}
                  rows={3}
                  placeholder='Brief description of your concern...'
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                    formErrors.reason
                      ? 'border-red-300 bg-red-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                />
                {formErrors.reason && (
                  <p className='mt-2 text-sm text-red-600'>
                    {formErrors.reason}
                  </p>
                )}
              </div>

              {/* Symptoms */}
              <div>
                <label className='block text-sm font-semibold text-gray-700 mb-3'>
                  Symptoms
                </label>
                <textarea
                  name='symptoms'
                  value={formData.symptoms}
                  onChange={handleChange}
                  rows={3}
                  placeholder="List any symptoms you're experiencing..."
                  className='w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all hover:border-gray-400'
                />
              </div>

              {/* Additional Notes */}
              <div>
                <label className='block text-sm font-semibold text-gray-700 mb-3'>
                  Additional Notes
                </label>
                <textarea
                  name='notes'
                  value={formData.notes}
                  onChange={handleChange}
                  rows={2}
                  placeholder='Any other information...'
                  className='w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all hover:border-gray-400'
                />
              </div>

              {/* Modal Actions */}
              <div className='flex gap-4 pt-6 border-t border-gray-200'>
                <button
                  type='button'
                  onClick={onClose}
                  disabled={isSubmitting}
                  className='flex-1 px-6 py-4 text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-all hover:shadow-md'
                >
                  Cancel
                </button>
                <button
                  type='submit'
                  disabled={isSubmitting}
                  className='flex-1 px-6 py-4 bg-linear-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 transition-all hover:shadow-lg transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 font-semibold'
                >
                  {isSubmitting ? (
                    <>
                      <div className='w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <FiCheckCircle className='w-5 h-5' />
                      Confirm Booking
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

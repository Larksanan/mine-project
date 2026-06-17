import React from 'react';
import { motion } from 'framer-motion';
import { FiCalendar, FiClock, FiFileText, FiAlertCircle } from 'react-icons/fi';
import { Appointment, AppointmentFormData } from '@/types/appointment';

interface EditAppointmentFormProps {
  appointment: Appointment;
  formData: AppointmentFormData;
  formErrors: Record<string, string>;
  updating: boolean;
  onChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  getMinDate: () => string;
}

const EditAppointmentForm: React.FC<EditAppointmentFormProps> = ({
  formData,
  formErrors,
  updating,
  onChange,
  onSubmit,
  onCancel,
  getMinDate,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'
    >
      <h2 className='text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2'>
        <FiCalendar className='w-5 h-5 text-blue-600' />
        Edit Appointment Details
      </h2>

      <form onSubmit={onSubmit} className='space-y-6'>
        {/* Date and Time */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Date *
            </label>
            <div className='relative'>
              <FiCalendar className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
              <input
                type='date'
                name='appointmentDate'
                value={formData.appointmentDate}
                onChange={onChange}
                min={getMinDate()}
                className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              />
            </div>
            {formErrors.appointmentDate && (
              <p className='mt-1 text-sm text-red-600 flex items-center gap-1'>
                <FiAlertCircle className='w-4 h-4' />
                {formErrors.appointmentDate}
              </p>
            )}
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Time *
            </label>
            <div className='relative'>
              <FiClock className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
              <input
                type='time'
                name='appointmentTime'
                value={formData.appointmentTime}
                onChange={onChange}
                className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              />
            </div>
            {formErrors.appointmentTime && (
              <p className='mt-1 text-sm text-red-600 flex items-center gap-1'>
                <FiAlertCircle className='w-4 h-4' />
                {formErrors.appointmentTime}
              </p>
            )}
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Duration (minutes) *
            </label>
            <select
              name='duration'
              value={formData.duration}
              onChange={onChange}
              className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
            >
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={45}>45 minutes</option>
              <option value={60}>60 minutes</option>
              <option value={90}>90 minutes</option>
              <option value={120}>120 minutes</option>
            </select>
          </div>
        </div>

        {/* Type and Status */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Appointment Type *
            </label>
            <select
              name='type'
              value={formData.type}
              onChange={onChange}
              className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
            >
              <option value='CONSULTATION'>Consultation</option>
              <option value='FOLLOW_UP'>Follow-up</option>
              <option value='CHECKUP'>Checkup</option>
              <option value='EMERGENCY'>Emergency</option>
              <option value='OTHER'>Other</option>
            </select>
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Status *
            </label>
            <select
              name='status'
              value={formData.status}
              onChange={onChange}
              className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
            >
              <option value='SCHEDULED'>Scheduled</option>
              <option value='CONFIRMED'>Confirmed</option>
              <option value='IN_PROGRESS'>In Progress</option>
              <option value='COMPLETED'>Completed</option>
              <option value='CANCELLED'>Cancelled</option>
              <option value='NO_SHOW'>No Show</option>
            </select>
          </div>
        </div>

        {/* Reason for Visit */}
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-2'>
            Reason for Visit *
          </label>
          <textarea
            name='reason'
            value={formData.reason}
            onChange={onChange}
            rows={3}
            placeholder='Describe the reason for this appointment...'
            className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none'
          />
          {formErrors.reason && (
            <p className='mt-1 text-sm text-red-600 flex items-center gap-1'>
              <FiAlertCircle className='w-4 h-4' />
              {formErrors.reason}
            </p>
          )}
        </div>

        {/* Symptoms */}
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-2'>
            Symptoms
          </label>
          <textarea
            name='symptoms'
            value={formData.symptoms}
            onChange={onChange}
            rows={3}
            placeholder='Describe any symptoms the patient is experiencing...'
            className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none'
          />
        </div>

        {/* Medical Information */}
        <div className='space-y-4'>
          <h3 className='text-lg font-semibold text-gray-900 flex items-center gap-2'>
            <FiFileText className='w-5 h-5 text-green-600' />
            Medical Information
          </h3>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Diagnosis
            </label>
            <textarea
              name='diagnosis'
              value={formData.diagnosis}
              onChange={onChange}
              rows={3}
              placeholder='Enter diagnosis...'
              className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none'
            />
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Prescription
            </label>
            <textarea
              name='prescription'
              value={formData.prescription}
              onChange={onChange}
              rows={3}
              placeholder='Enter prescription details...'
              className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none'
            />
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Doctor&apos;s Notes
            </label>
            <textarea
              name='notes'
              value={formData.notes}
              onChange={onChange}
              rows={4}
              placeholder='Additional notes and observations...'
              className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none'
            />
          </div>
        </div>

        {/* Form Actions */}
        <div className='flex justify-end gap-3 pt-6 border-t border-gray-200'>
          <button
            type='button'
            onClick={onCancel}
            disabled={updating}
            className='px-6 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors'
          >
            Cancel
          </button>
          <button
            type='submit'
            disabled={updating}
            className='px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2'
          >
            {updating ? (
              <>
                <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white'></div>
                Updating...
              </>
            ) : (
              'Update Appointment'
            )}
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default EditAppointmentForm;

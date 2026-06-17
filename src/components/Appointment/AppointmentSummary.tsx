import React from 'react';
import { motion } from 'framer-motion';
import { Patient, AppointmentFormData } from '@/types/appointment';
import { DoctorProfile } from '@/types/doctor';
import { formatAppointmentType, formatTime } from '@/utils/appointmentUtils';

interface AppointmentSummaryProps {
  formData: AppointmentFormData;
  selectedPatient: Patient | undefined;
  selectedDoctor?: DoctorProfile | undefined;
}

const AppointmentSummary: React.FC<AppointmentSummaryProps> = ({
  formData,
  selectedPatient,
  selectedDoctor,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'
    >
      <h2 className='text-lg font-semibold text-gray-900 mb-4'>
        Appointment Summary
      </h2>

      <div className='space-y-3 text-sm'>
        <div className='flex justify-between'>
          <span className='text-gray-500'>Status:</span>
          <span
            className={`font-medium ${
              formData.status === 'CONFIRMED'
                ? 'text-green-600'
                : 'text-blue-600'
            }`}
          >
            {formData.status === 'CONFIRMED' ? 'Confirmed' : 'Scheduled'}
          </span>
        </div>

        <div className='flex justify-between'>
          <span className='text-gray-500'>Duration:</span>
          <span className='font-medium'>{formData.duration} minutes</span>
        </div>

        <div className='flex justify-between'>
          <span className='text-gray-500'>Type:</span>
          <span className='font-medium capitalize'>
            {formatAppointmentType(formData.type)}
          </span>
        </div>

        {formData.appointmentDate && (
          <div className='flex justify-between'>
            <span className='text-gray-500'>Date:</span>
            <span className='font-medium'>
              {new Date(formData.appointmentDate).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </div>
        )}

        {formData.appointmentTime && (
          <div className='flex justify-between'>
            <span className='text-gray-500'>Time:</span>
            <span className='font-medium'>
              {formatTime(formData.appointmentTime)}
            </span>
          </div>
        )}

        {selectedPatient && (
          <div className='pt-3 border-t border-gray-200'>
            <p className='text-xs font-semibold text-gray-700 uppercase mb-2'>
              Patient Information
            </p>
            <div className='flex justify-between'>
              <span className='text-gray-500'>Name:</span>
              <span className='font-medium text-right'>
                {selectedPatient.firstName} {selectedPatient.lastName}
              </span>
            </div>
            <div className='flex justify-between mt-1'>
              <span className='text-gray-500'>NIC:</span>
              <span className='font-medium text-right'>
                {selectedPatient.nic}
              </span>
            </div>
            {selectedPatient.phone && (
              <div className='flex justify-between mt-1'>
                <span className='text-gray-500'>Phone:</span>
                <span className='font-medium text-right'>
                  {selectedPatient.phone}
                </span>
              </div>
            )}
          </div>
        )}

        {selectedDoctor && (
          <div className='pt-3 border-t border-gray-200'>
            <p className='text-xs font-semibold text-gray-700 uppercase mb-2'>
              Doctor Information
            </p>
            <div className='flex justify-between'>
              <span className='text-gray-500'>Name:</span>
              <span className='font-medium text-right'>
                Dr. {selectedDoctor.name}
              </span>
            </div>
            <div className='flex justify-between mt-1'>
              <span className='text-gray-500'>Specialization:</span>
              <span className='font-medium text-right'>
                {selectedDoctor.specialization}
              </span>
            </div>
            <div className='flex justify-between mt-1'>
              <span className='text-gray-500'>Department:</span>
              <span className='font-medium text-right'>
                {selectedDoctor.department}
              </span>
            </div>
            {selectedDoctor.consultationFee && (
              <div className='flex justify-between mt-1'>
                <span className='text-gray-500'>Fee:</span>
                <span className='font-medium text-right text-green-600'>
                  LKR {selectedDoctor.consultationFee.toLocaleString()}
                </span>
              </div>
            )}
          </div>
        )}

        {!selectedPatient && !selectedDoctor && (
          <div className='py-4 text-center text-gray-400 text-xs'>
            Select a patient and doctor to see summary
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default AppointmentSummary;

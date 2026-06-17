/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import {
  FiEye,
  FiEdit,
  FiTrash2,
  FiUser,
  FiCalendar,
  FiClock,
  FiActivity,
} from 'react-icons/fi';
import { Appointment } from '@/types/appointment';
import StatusBadge from './StatusBadge';
import TypeBadge from './TypeBadge';

interface AppointmentCardProps {
  appointment: Appointment;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function AppointmentCard({
  appointment,
  onView,
  onEdit,
  onDelete,
}: AppointmentCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-UK', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const calculateAge = (dateOfBirth: string | Date) => {
    const today = new Date();
    const birthDate =
      typeof dateOfBirth === 'string' ? new Date(dateOfBirth) : dateOfBirth;

    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age;
  };

  const getDoctorName = () => {
    if (!appointment.doctor) return 'N/A';
    const doctor = appointment.doctor as any;
    if (doctor.name) return doctor.name;
    if (doctor.firstName && doctor.lastName) {
      return `${doctor.firstName} ${doctor.lastName}`;
    }
    return doctor.firstName || doctor.lastName || 'N/A';
  };

  return (
    <div className='bg-white rounded-lg p-6 border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all'>
      <div className='flex flex-col gap-4'>
        {/* Header Row - Patient & Doctor Info Side by Side */}
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
          {/* Patient Info */}
          <div className='flex items-start gap-3'>
            <div className='w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center shrink-0'>
              <FiUser className='w-6 h-6 text-blue-600' />
            </div>

            <div className='flex-1 min-w-0'>
              <p className='text-xs text-gray-500 uppercase tracking-wide mb-1'>
                Patient
              </p>
              <h3 className='text-lg font-semibold text-gray-900 truncate'>
                {appointment.patient?.firstName} {appointment.patient?.lastName}
              </h3>
              <p className='text-sm text-gray-600'>
                {appointment.patient?.dateOfBirth && (
                  <>{calculateAge(appointment.patient.dateOfBirth)} years • </>
                )}
                {appointment.patient?.gender}
              </p>
              <p className='text-xs text-gray-500 truncate mt-1'>
                {appointment.patient?.email}
              </p>
            </div>
          </div>

          {/* Doctor Info */}
          <div className='flex items-start gap-3 bg-green-50 rounded-lg p-4'>
            <div className='w-12 h-12 bg-green-100 rounded-full flex items-center justify-center shrink-0'>
              <FiActivity className='w-6 h-6 text-green-600' />
            </div>

            <div className='flex-1 min-w-0'>
              <p className='text-xs text-gray-500 uppercase tracking-wide mb-1'>
                Doctor
              </p>
              <h4 className='text-lg font-semibold text-gray-900 truncate'>
                Dr. {getDoctorName()}
              </h4>
              {(appointment.doctor as any)?.specialization && (
                <p className='text-sm text-gray-600 truncate'>
                  {(appointment.doctor as any).specialization}
                </p>
              )}
              {(appointment.doctor as any)?.department && (
                <p className='text-xs text-gray-500 truncate mt-1'>
                  {(appointment.doctor as any).department}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Reason Section */}
        <div className='border-t border-gray-200 pt-3'>
          <p className='text-sm font-medium text-gray-700 mb-1'>
            Reason for Visit:
          </p>
          <p className='text-gray-900'>{appointment.reason}</p>
          {appointment.notes && (
            <p className='text-sm text-gray-600 mt-2 italic'>
              {appointment.notes}
            </p>
          )}
        </div>

        {/* Bottom Row - Date/Time, Status & Actions */}
        <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pt-3 border-t border-gray-200'>
          {/* Date & Time */}
          <div className='flex items-center gap-4'>
            <div className='flex items-center gap-2 text-sm text-gray-700'>
              <FiCalendar className='w-4 h-4 text-gray-500' />
              <span className='font-medium'>
                {formatDate(appointment.appointmentDate)}
              </span>
            </div>

            <div className='flex items-center gap-2 text-sm text-gray-700'>
              <FiClock className='w-4 h-4 text-gray-500' />
              <span className='font-medium'>
                {formatTime(appointment.appointmentTime)}
              </span>
              <span className='text-gray-400'>•</span>
              <span>{appointment.duration} min</span>
            </div>
          </div>

          {/* Status & Type Badges */}
          <div className='flex items-center gap-2 flex-wrap'>
            <StatusBadge status={appointment.status} />
            <TypeBadge type={appointment.type} />
          </div>

          {/* Action Buttons */}
          <div className='flex items-center gap-2'>
            <button
              onClick={onView}
              className='text-blue-600 hover:text-blue-900 p-2 transition-colors rounded-lg hover:bg-blue-50'
              title='View Details'
              aria-label='View appointment details'
            >
              <FiEye className='w-5 h-5' />
            </button>

            <button
              onClick={onEdit}
              className='text-green-600 hover:text-green-900 p-2 transition-colors rounded-lg hover:bg-green-50'
              title='Edit Appointment'
              aria-label='Edit appointment'
            >
              <FiEdit className='w-5 h-5' />
            </button>

            <button
              onClick={onDelete}
              className='text-red-600 hover:text-red-900 p-2 transition-colors rounded-lg hover:bg-red-50'
              title='Delete Appointment'
              aria-label='Delete appointment'
            >
              <FiTrash2 className='w-5 h-5' />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

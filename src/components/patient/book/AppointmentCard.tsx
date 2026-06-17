import {
  FiCalendar,
  FiUser,
  FiMapPin,
  FiFileText,
} from 'react-icons/fi';
import { Appointment } from '@/types/appointment';
import { STATUS_COLORS } from '@/constants/appointments';
import { formatDate, formatTime } from '@/utils/formatUtils';

interface AppointmentCardProps {
  appointment: Appointment;
}

export const AppointmentCard = ({ appointment }: AppointmentCardProps) => {
  const statusConfig =
    STATUS_COLORS[appointment.status as keyof typeof STATUS_COLORS] ||
    STATUS_COLORS.SCHEDULED;
  const StatusIcon = statusConfig.icon;

  return (
    <div className='bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow'>
      <div className='p-6'>
        {/* Header */}
        <div className='flex items-start justify-between mb-4'>
          <div className='flex-1'>
            <div className='flex items-center gap-3 mb-2'>
              <div className='w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-lg font-bold'>
                {appointment.doctor?.name?.charAt(0) || 'D'}
              </div>
              <div>
                <h3 className='text-lg font-semibold text-gray-900'>
                  Dr. {appointment.doctor?.name || 'Unknown Doctor'}
                </h3>
                <p className='text-sm text-gray-600'>
                  {appointment.doctor?.specialization || 'Specialist'}
                </p>
              </div>
            </div>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${statusConfig.bg} ${statusConfig.text}`}
          >
            <StatusIcon className='w-4 h-4' />
            {appointment.status.replace('_', ' ')}
          </span>
        </div>

        {/* Details Grid */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-4'>
          {/* Date & Time */}
          <div className='flex items-start gap-3'>
            <FiCalendar className='w-5 h-5 text-gray-400 mt-0.5' />
            <div>
              <p className='text-sm font-medium text-gray-700'>Date & Time</p>
              <p className='text-sm text-gray-600'>
                {formatDate(appointment.appointmentDate)}
              </p>
              <p className='text-sm text-gray-600'>
                {formatTime(appointment.appointmentTime)} (
                {appointment.duration} min)
              </p>
            </div>
          </div>

          {/* Type */}
          <div className='flex items-start gap-3'>
            <FiFileText className='w-5 h-5 text-gray-400 mt-0.5' />
            <div>
              <p className='text-sm font-medium text-gray-700'>
                Appointment Type
              </p>
              <p className='text-sm text-gray-600'>
                {appointment.type.replace('_', ' ')}
              </p>
            </div>
          </div>

          {/* Hospital */}
          {appointment.doctor?.hospital && (
            <div className='flex items-start gap-3'>
              <FiMapPin className='w-5 h-5 text-gray-400 mt-0.5' />
              <div>
                <p className='text-sm font-medium text-gray-700'>Location</p>
                <p className='text-sm text-gray-600'>
                  {appointment.doctor.hospital}
                </p>
              </div>
            </div>
          )}

          {/* Doctor Contact */}
          {appointment.doctor?.phone && (
            <div className='flex items-start gap-3'>
              <FiUser className='w-5 h-5 text-gray-400 mt-0.5' />
              <div>
                <p className='text-sm font-medium text-gray-700'>Contact</p>
                <p className='text-sm text-gray-600'>
                  {appointment.doctor.phone}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Reason */}
        {appointment.reason && (
          <div className='border-t border-gray-200 pt-4 mt-4'>
            <p className='text-sm font-medium text-gray-700 mb-1'>
              Reason for Visit
            </p>
            <p className='text-sm text-gray-600'>{appointment.reason}</p>
          </div>
        )}

        {/* Symptoms */}
        {appointment.symptoms && (
          <div className='mt-3'>
            <p className='text-sm font-medium text-gray-700 mb-1'>Symptoms</p>
            <p className='text-sm text-gray-600'>{appointment.symptoms}</p>
          </div>
        )}

        {/* Diagnosis (for completed appointments) */}
        {appointment.diagnosis && (
          <div className='border-t border-gray-200 pt-4 mt-4'>
            <p className='text-sm font-medium text-gray-700 mb-1'>Diagnosis</p>
            <p className='text-sm text-gray-600'>{appointment.diagnosis}</p>
          </div>
        )}

        {/* Prescription */}
        {appointment.prescription && (
          <div className='mt-3'>
            <p className='text-sm font-medium text-gray-700 mb-1'>
              Prescription
            </p>
            <p className='text-sm text-gray-600'>{appointment.prescription}</p>
          </div>
        )}

        {/* Notes */}
        {appointment.notes && (
          <div className='mt-3'>
            <p className='text-sm font-medium text-gray-700 mb-1'>
              Additional Notes
            </p>
            <p className='text-sm text-gray-600'>{appointment.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
};

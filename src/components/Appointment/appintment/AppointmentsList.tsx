import React from 'react';
import { motion } from 'framer-motion';
import { Appointment } from '@/types/appointment';
import AppointmentCard from './AppointmentCard';

interface AppointmentsListProps {
  appointments: Appointment[];
  onViewAppointment: (id: string) => void;
  onEditAppointment: (id: string) => void;
  onDeleteAppointment: (id: string) => void;
}

export default function AppointmentsList({
  appointments,
  onViewAppointment,
  onEditAppointment,
  onDeleteAppointment,
}: AppointmentsListProps) {
  // Helper to get appointment ID (handles both _id and id)
  const getAppointmentId = (appointment: Appointment): string => {
    return appointment._id || appointment.id || '';
  };

  return (
    <div className='space-y-4'>
      {appointments.map((appointment, index) => {
        const appointmentId = getAppointmentId(appointment);

        return (
          <motion.div
            key={appointmentId || `appointment-${index}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: index * 0.05, // Reduced delay for smoother appearance
              duration: 0.3,
            }}
          >
            <AppointmentCard
              appointment={appointment}
              onView={() => onViewAppointment(appointmentId)}
              onEdit={() => onEditAppointment(appointmentId)}
              onDelete={() => onDeleteAppointment(appointmentId)}
            />
          </motion.div>
        );
      })}
    </div>
  );
}

export interface Doctor {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  specialization?: string;
  phone?: string;
  isActive?: boolean;
}

export interface Patient {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: Date;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  nic: string;
}

export type AppointmentStatus =
  | 'scheduled'
  | 'completed'
  | 'cancelled'
  | 'no-show'
  | 'confirmed'
  | 'rescheduled';

export type AppointmentType =
  | 'checkup'
  | 'consultation'
  | 'follow-up'
  | 'surgery'
  | 'emergency'
  | 'routine'
  | 'vaccination'
  | 'therapy';

export interface Appointment {
  _id: string;
  appointmentDate: string;
  appointmentTime: string;
  doctorId: string;
  type: AppointmentType;
  status: AppointmentStatus;
  reason: string;
  duration: number; // in minutes
  notes?: string;

  // References
  patient: Patient;
  doctor: Doctor;

  // Metadata
  createdAt: string;
  updatedAt: string;
  createdBy?: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
}

export interface AppointmentFormData {
  appointmentDate: string;
  appointmentTime: string;
  type: AppointmentType;
  status: AppointmentStatus;
  reason: string;
  duration: number;
  notes?: string;
  patientId: string;
  doctorId: string;
}

export interface AppointmentStats {
  total: number;
  scheduled: number;
  completed: number;
  cancelled: number;
  noShow: number;
  today: number;
  upcoming: number;
  byType: Record<AppointmentType, number>;
  byStatus: Record<AppointmentStatus, number>;
}

export interface AppointmentFilter {
  dateRange?: {
    start: string;
    end: string;
  };
  status?: AppointmentStatus | 'all';
  type?: AppointmentType | 'all';
  doctorId?: string;
  patientId?: string;
  search?: string;
}

export interface CreateAppointmentResponse {
  success: boolean;
  data?: Appointment;
  message?: string;
  error?: string;
}

export interface UpdateAppointmentResponse {
  success: boolean;
  data?: Appointment;
  message?: string;
  error?: string;
}

export interface DeleteAppointmentResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export interface AppointmentsResponse {
  success: boolean;
  data: Appointment[];
  total: number;
  page?: number;
  limit?: number;
  stats?: AppointmentStats;
}

// Utility functions
export const appointmentToFormData = (
  appointment: Appointment
): AppointmentFormData => {
  return {
    appointmentDate: appointment.appointmentDate,
    appointmentTime: appointment.appointmentTime,
    type: appointment.type,
    status: appointment.status,
    reason: appointment.reason,
    duration: appointment.duration,
    notes: appointment.notes,
    patientId: appointment.patient._id,
    doctorId: appointment.doctor._id,
  };
};

export const calculateAppointmentEndTime = (
  startTime: string,
  duration: number
): string => {
  const [hours, minutes] = startTime.split(':').map(Number);
  const startDate = new Date();
  startDate.setHours(hours, minutes, 0, 0);

  const endDate = new Date(startDate.getTime() + duration * 60000);

  return endDate.toTimeString().slice(0, 5); // Returns HH:MM format
};

export const isAppointmentUpcoming = (appointment: Appointment): boolean => {
  const now = new Date();
  const appointmentDateTime = new Date(
    `${appointment.appointmentDate}T${appointment.appointmentTime}`
  );
  return appointmentDateTime > now && appointment.status === 'scheduled';
};

export const isAppointmentPast = (appointment: Appointment): boolean => {
  const now = new Date();
  const appointmentDateTime = new Date(
    `${appointment.appointmentDate}T${appointment.appointmentTime}`
  );
  return (
    appointmentDateTime <= now ||
    ['completed', 'cancelled', 'no-show'].includes(appointment.status)
  );
};

export const getAppointmentStatusColor = (
  status: AppointmentStatus
): string => {
  const colors = {
    scheduled: 'bg-blue-100 text-blue-800 border-blue-200',
    completed: 'bg-green-100 text-green-800 border-green-200',
    cancelled: 'bg-red-100 text-red-800 border-red-200',
    'no-show': 'bg-orange-100 text-orange-800 border-orange-200',
    confirmed: 'bg-teal-100 text-teal-800 border-teal-200',
    rescheduled: 'bg-purple-100 text-purple-800 border-purple-200',
  };
  return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
};

export const getAppointmentTypeColor = (type: AppointmentType): string => {
  const colors = {
    checkup: 'bg-purple-100 text-purple-800',
    consultation: 'bg-indigo-100 text-indigo-800',
    'follow-up': 'bg-cyan-100 text-cyan-800',
    surgery: 'bg-pink-100 text-pink-800',
    emergency: 'bg-red-100 text-red-800',
    routine: 'bg-green-100 text-green-800',
    vaccination: 'bg-yellow-100 text-yellow-800',
    therapy: 'bg-teal-100 text-teal-800',
  };
  return colors[type] || 'bg-gray-100 text-gray-800';
};

export const formatAppointmentDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatAppointmentTime = (timeString: string): string => {
  return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

export const validateAppointmentTime = (
  date: string,
  time: string
): boolean => {
  const appointmentDateTime = new Date(`${date}T${time}`);
  const now = new Date();

  // Appointment cannot be in the past
  return appointmentDateTime > now;
};

export const getAvailableTimeSlots = (
  existingAppointments: Appointment[],
  date: string,
  duration: number = 30
): string[] => {
  const slots: string[] = [];
  const startHour = 8; // 8 AM
  const endHour = 18; // 6 PM

  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += duration) {
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

      // Check if this time slot conflicts with existing appointments
      const hasConflict = existingAppointments.some(apt => {
        if (apt.appointmentDate !== date) return false;

        const aptStart = new Date(`${date}T${apt.appointmentTime}`);
        const aptEnd = new Date(aptStart.getTime() + apt.duration * 60000);

        const slotStart = new Date(`${date}T${timeString}`);
        const slotEnd = new Date(slotStart.getTime() + duration * 60000);

        return slotStart < aptEnd && slotEnd > aptStart;
      });

      if (!hasConflict) {
        slots.push(timeString);
      }
    }
  }

  return slots;
};

// Type guards
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isAppointment = (obj: any): obj is Appointment => {
  return (
    obj &&
    typeof obj._id === 'string' &&
    typeof obj.appointmentDate === 'string' &&
    typeof obj.appointmentTime === 'string' &&
    typeof obj.type === 'string' &&
    typeof obj.status === 'string' &&
    typeof obj.reason === 'string' &&
    typeof obj.duration === 'number' &&
    obj.patient &&
    obj.doctor
  );
};

export const isValidAppointmentFormData = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any
): data is AppointmentFormData => {
  return (
    data &&
    typeof data.appointmentDate === 'string' &&
    typeof data.appointmentTime === 'string' &&
    typeof data.type === 'string' &&
    typeof data.status === 'string' &&
    typeof data.reason === 'string' &&
    typeof data.duration === 'number' &&
    typeof data.patientId === 'string' &&
    typeof data.doctorId === 'string'
  );
};

export interface DoctorProfile {
  _id: string;
  name: string;
  email: string;
  phone: string;
  specialization: string;
  department: string;
  licenseNumber: string;
  hospital: string;
  experience: number;
  consultationFee: number;
  qualifications: string[];
  languages: string[];
  isVerified: boolean;
  rating?: {
    average: number;
    count: number;
  };
  availableHours?: {
    days: string[];
    start: string;
    end: string;
  };
  image?: string;
}

export interface BookingFormData {
  doctorId: string;
  appointmentDate: string;
  appointmentTime: string;
  reason: string;
  symptoms: string;
  notes: string;
  type: 'CONSULTATION' | 'FOLLOW_UP' | 'CHECK_UP' | 'EMERGENCY';
}

export type ToastType = 'success' | 'error' | 'info';

export interface ToastData {
  message: string;
  type: ToastType;
}

export type SortOption = 'name' | 'experience' | 'fee' | 'rating';

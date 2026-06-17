/* eslint-disable no-undef */
import { DoctorProfile } from '@/types/booking';
export interface IAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface IEmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  email?: string;
}

export interface IInsurance {
  provider: string;
  policyNumber: string;
  groupNumber?: string;
  validUntil: Date;
}

export interface Patient {
  userId: string;
  createdBy: string;
  id: string;
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  nic: string;
  dateOfBirth: Date;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  address?: IAddress;
  emergencyContact?: IEmergencyContact;
  medicalHistory?: string;
  allergies?: string[];
  medications?: string[];
  insurance?: IInsurance;
  bloodType?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
  height?: number;
  weight?: number;
  isActive?: boolean;
}

export interface AppointmentFormData {
  patientId: string;
  appointmentDate: string;
  appointmentTime: string;
  duration: number;
  type: 'CONSULTATION' | 'FOLLOW_UP' | 'CHECKUP' | 'EMERGENCY' | 'OTHER';
  status: 'SCHEDULED' | 'CONFIRMED';
  reason: string;
  doctorId: string;
  symptoms?: string;
  diagnosis: string;
  prescription: string;
  notes: string;
}

export interface Appointment {
  _id: string;
  id: string;
  patient: Patient; // Assuming Patient interface is defined elsewhere
  doctor: DoctorProfile; // Use DoctorProfile from booking.ts
  appointmentDate: string;
  appointmentTime: string;
  duration: number;
  status:
    | 'scheduled'
    | 'confirmed'
    | 'completed'
    | 'cancelled'
    | 'no-show'
    | 'in-progress';
  type: 'consultation' | 'follow-up' | 'check-up' | 'emergency' | 'other';
  reason: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  patientId: Patient;
  doctorId: string;
  symptoms?: string;
  diagnosis?: string;
  prescription?: string;
}

export interface AppointmentStats {
  total: number;
  scheduled: number;
  confirmed: number;
  completed: number;
  cancelled: number;
  noShow: number;
  today: number;
  upcoming: number;
  averageDuration: number;
  totalAppointments: number;
  completedAppointments: number;
  pendingAppointments: number;
  cancelledAppointments: number;
  todayAppointments: number;
  monthlyAppointments: number;
  totalRevenue: number;
  monthlyRevenue: number;
  appointmentTypes: {
    type: string;
    count: number;
    revenue: number;
  }[];
  weeklyTrend: {
    date: string;
    appointments: number;
    revenue: number;
  }[];
}

export interface TimeRange {
  value: 'week' | 'month' | 'year';
  label: string;
}

export interface Appointments {
  _id: string;
  id: string;
  patient: Patient; // Assuming Patient interface is defined elsewhere
  doctor: DoctorProfile; // Use DoctorProfile from booking.ts
  appointmentDate: string;
  appointmentTime: string;
  duration: number;
  status:
    | 'scheduled'
    | 'confirmed'
    | 'completed'
    | 'cancelled'
    | 'no-show'
    | 'in-progress';
  type: 'consultation' | 'follow-up' | 'check-up' | 'emergency' | 'other';
  reason: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  patientId: Patient;
  doctorId: string;
  symptoms?: string;
  diagnosis?: string;
  prescription?: string;
}

export interface DoctorInfo {
  _id: string;
  name: string;
  email: string;
  phone: string;
  specialization: string;
  department: string;
  hospital: string;
}

export interface StatusConfig {
  bg: string;
  text: string;
  icon: React.ComponentType<{ className?: string }>;
}

export type StatusType =
  | 'SCHEDULED'
  | 'CONFIRMED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW';

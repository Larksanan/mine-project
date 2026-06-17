import { IPatientFormData } from './patients';
import { DoctorProfile } from './doctors';

export interface PrescriptionStats {
  total: number;
  active: number;
  completed: number;
  cancelled: number;
  today: number;
  upcoming: number;
  byStatus: Record<string, number>;
  byPatient: Record<string, number>;
  byDoctor: Record<string, number>;
}

import { Medication } from './Medication';
export interface Prescription {
  _id: string;
  patientId: IPatientFormData;
  doctorId: DoctorProfile;
  diagnosis: string;
  medications: Medication[];
  notes: string;
  startDate: string;
  endDate: string;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
}

export interface PrescriptionFilters {
  status: string;
  patient: string;
  dateRange: {
    start: string;
    end: string;
  };
}

export interface PrescriptionFormData {
  patientId: string;
  diagnosis: string;
  medications: Medication[];
  notes: string;
  startDate: string;
  endDate: string;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
}

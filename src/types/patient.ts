export interface Address {
  street: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

export interface EmergencyContact {
  name?: string;
  phone?: string;
  relationship: string;
  email?: string;
}

export interface Insurance {
  provider?: string;
  policyNumber?: string;
  groupNumber?: string;
  validUntil: Date;
}

export interface Patient {
  _id: string;
  firstName: string;
  lastName: string;
  nic: string;
  email: string;
  phone: string;
  dateOfBirth: Date;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  address?: Address;
  emergencyContact?: EmergencyContact;
  medicalHistory?: string;
  allergies?: string[];
  medications?: string[];
  insurance?: Insurance;
  bloodType?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
  height?: number;
  weight?: number;
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy?: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
}

export interface PatientFormData {
  firstName: string;
  lastName: string;
  nic: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  address: Address;
  emergencyContact: EmergencyContact;
  medicalHistory?: string;
  allergies?: string[];
  medications?: string[];
  insurance?: Insurance;
  bloodType?: string;
  height?: number;
  weight?: number;
  isActive?: boolean;
}
export interface PatientData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  nic: string;
  dateOfBirth?: string;
  gender: string;
  address?: Address;
  emergencyContact?: EmergencyContact;
  medicalHistory?: string;
  allergies?: string[];
  medications?: string[];
  insurance?: Insurance;
  bloodType?: string;
  height?: number;
  weight?: number;
  maritalStatus?: string;
  occupation?: string;
  preferredLanguage?: string;
  lastVisit?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PatientStats {
  total: number;
  active: number;
  male: number;
  female: number;
  other: number;
  recent: number;
  adults: number;
  children: number;
  seniors: number;
  withInsurance: number;
  insuranceExpiring: number;
}

export interface Appointment {
  _id: string;
  appointmentDate: string;
  appointmentTime: string;
  type: string;
  status: string;
  reason: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export const patientToFormData = (patient: Patient): PatientFormData => {
  const getDateString = (date: Date): string => {
    try {
      return date.toISOString().split('T')[0];
    } catch {
      return '';
    }
  };

  return {
    firstName: patient.firstName || '',
    lastName: patient.lastName || '',
    nic: patient.nic || '',
    email: patient.email || '',
    phone: patient.phone || '',
    dateOfBirth: patient.dateOfBirth ? getDateString(patient.dateOfBirth) : '',
    gender: patient.gender || 'OTHER',
    address: patient.address || {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: '',
    },
    emergencyContact: patient.emergencyContact || {
      name: '',
      phone: '',
      relationship: '',
      email: '',
    },
    medicalHistory: patient.medicalHistory || '',
    allergies: patient.allergies || [],
    medications: patient.medications || [],
    insurance: patient.insurance || {
      provider: '',
      policyNumber: '',
      groupNumber: '',
      validUntil: new Date(),
    },
    bloodType: patient.bloodType || '',
    height: patient.height,
    weight: patient.weight,
    isActive: patient.isActive ?? true,
  };
};

export const calculateAge = (dateOfBirth: Date): number => {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
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

export const getAgeGroup = (
  dateOfBirth: Date
): 'CHILD' | 'ADULT' | 'SENIOR' => {
  const age = calculateAge(dateOfBirth);
  if (age < 18) return 'CHILD';
  if (age < 65) return 'ADULT';
  return 'SENIOR';
};

export const formatPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isPatient = (obj: any): obj is Patient => {
  return (
    obj &&
    typeof obj._id === 'string' &&
    typeof obj.firstName === 'string' &&
    typeof obj.lastName === 'string' &&
    typeof obj.email === 'string' &&
    obj.dateOfBirth instanceof Date
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isValidPatientFormData = (data: any): data is PatientFormData => {
  return (
    data &&
    typeof data.firstName === 'string' &&
    typeof data.lastName === 'string' &&
    typeof data.email === 'string' &&
    typeof data.phone === 'string' &&
    typeof data.dateOfBirth === 'string' &&
    ['MALE', 'FEMALE', 'OTHER'].includes(data.gender)
  );
};

// Additional utility functions that were missing
export const formatDate = (date: Date | string): string => {
  if (typeof date === 'string') {
    date = new Date(date);
  }
  return date.toLocaleDateString('en-lk', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const getGenderText = (gender: 'MALE' | 'FEMALE' | 'OTHER'): string => {
  const genderMap = {
    MALE: 'Male',
    FEMALE: 'Female',
    OTHER: 'Other',
  };
  return genderMap[gender];
};

export const validatePatientData = (data: Partial<Patient>): string[] => {
  const errors: string[] = [];

  if (!data.firstName?.trim()) errors.push('First name is required');
  if (!data.lastName?.trim()) errors.push('Last name is required');
  if (!data.email?.trim()) errors.push('Email is required');
  if (!data.phone?.trim()) errors.push('Phone number is required');
  if (!data.nic?.trim()) errors.push('NIC is required');
  if (!data.dateOfBirth) errors.push('Date of birth is required');

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (data.email && !emailRegex.test(data.email)) {
    errors.push('Invalid email format');
  }

  // Date validation
  if (data.dateOfBirth && new Date(data.dateOfBirth) > new Date()) {
    errors.push('Date of birth cannot be in the future');
  }

  return errors;
};

export const getPatientInitials = (patient: Patient): string => {
  return `${patient.firstName.charAt(0)}${patient.lastName.charAt(0)}`.toUpperCase();
};

export const isInsuranceExpiring = (
  insurance: Insurance,
  daysThreshold: number = 30
): boolean => {
  const today = new Date();
  const expirationDate = new Date(insurance.validUntil);
  const diffTime = expirationDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays <= daysThreshold && diffDays > 0;
};

export interface PatientSelectionProps {
  selectedPatient: Patient | null;
  onPatientSelect: (patient: Patient) => void;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
// Base User Information (from User model)
export interface DoctorUser {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  phone: string;
  image?: string;
  role?: string;
}

// Availability Structure (from MongoDB)
export interface Availability {
  days: string[];
  startTime: string;
  endTime: string;
}

// Alternative Availability Structure (for frontend)
export interface AvailableHours {
  days: string[];
  start: string;
  end: string;
}

// Rating Structure
export interface DoctorRating {
  average: number;
  count: number;
}

// Doctor Profile (from MongoDB profile field)
export interface IDoctorProfile {
  specialization: string;
  qualifications: string[];
  experience: number;
  consultationFee: number;
  availability: Availability;
  hospitalAffiliation?: string;
  department: string;
  licenseNumber: string;
  licenseExpiry: Date | string;
  languages: string[];
  services: string[];
  awards?: string[];
  publications?: string[];
  isVerified?: boolean;
  rating?: DoctorRating;
}

// Complete Doctor Document (from MongoDB)
export interface DoctorDocument {
  _id: string;
  id?: string;
  user: string | DoctorUser; // Can be populated or just ID
  profile: IDoctorProfile;
  appointments?: string[];
  patients?: string[];
  schedules?: string[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

// Doctor Profile (Flattened for Frontend Use)
export interface DoctorProfile {
  _id: string;
  id: string;
  name: string;
  email: string;
  phone: string;
  image?: string;
  specialization: string;
  department: string;
  licenseNumber: string;
  licenseExpiry?: Date | string;
  hospital: string;
  hospitalAffiliation?: string;
  experience: number;
  consultationFee: number;
  qualifications: string[];
  languages: string[];
  services?: string[];
  awards?: string[];
  publications?: string[];
  isVerified: boolean;
  rating?: DoctorRating;
  // Support both availability formats
  availability?: Availability;
  availableHours?: AvailableHours;
}

// Doctor Settings (for Profile Edit Forms)
export interface DoctorSettings {
  name: string;
  email: string;
  phone: string;
  specialization: string;
  licenseNumber: string;
  hospital: string;
  bio?: string;
  consultationFee: number;
  availableHours: {
    start: string;
    end: string;
  };
  workingDays: string[];
}

// Doctor Form Data (for Creating/Updating Doctors)
export interface IDoctorFormData {
  userId: string;
  profile: IDoctorProfile;
}

// Doctor Search/Filter Options
export interface DoctorFilters {
  specialization?: string;
  department?: string;
  hospital?: string;
  isVerified?: boolean;
  minExperience?: number;
  maxConsultationFee?: number;
  availableDay?: string;
  search?: string;
}

// Doctor Statistics
export interface DoctorStats {
  totalPatients: number;
  totalAppointments: number;
  upcomingAppointments: number;
  todayAppointments?: number;
  completedAppointments?: number;
  averageRating: number;
  totalRatings?: number;
  recentRecords?: number;
}

// Constants
export const SPECIALIZATIONS = [
  'Cardiology',
  'Dermatology',
  'Endocrinology',
  'Gastroenterology',
  'General Practice',
  'Neurology',
  'Obstetrics & Gynecology',
  'Oncology',
  'Ophthalmology',
  'Orthopedics',
  'Pediatrics',
  'Psychiatry',
  'Radiology',
  'Surgery',
  'Urology',
] as const;

export const DEPARTMENTS = [
  'Emergency',
  'Outpatient',
  'Inpatient',
  'Surgery',
  'Pediatrics',
  'Maternity',
  'Intensive Care',
  'Radiology',
  'Laboratory',
  'Pharmacy',
] as const;

export const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const;

// Type guards
export function isDoctorUser(user: any): user is DoctorUser {
  return user && typeof user === 'object' && 'name' in user && 'email' in user;
}

export function hasDoctorProfile(doctor: any): doctor is DoctorDocument {
  return doctor && typeof doctor === 'object' && 'profile' in doctor;
}

// Helper function to transform doctor data
export function transformDoctorData(doc: any): DoctorProfile {
  const user = isDoctorUser(doc.user) ? doc.user : null;
  const profile = doc.profile || {};

  // Transform availability to both formats
  const availability = profile.availability;
  const availableHours = availability
    ? {
        days: availability.days || [],
        start: availability.startTime || '',
        end: availability.endTime || '',
      }
    : undefined;

  return {
    _id: doc._id?.toString() || doc.id?.toString() || '',
    id: doc._id?.toString() || doc.id?.toString() || '',
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    image: user?.image,
    specialization: profile.specialization || '',
    department: profile.department || '',
    licenseNumber: profile.licenseNumber || '',
    licenseExpiry: profile.licenseExpiry,
    hospital: profile.hospitalAffiliation || 'Not specified',
    hospitalAffiliation: profile.hospitalAffiliation,
    experience: profile.experience || 0,
    consultationFee: profile.consultationFee || 0,
    qualifications: profile.qualifications || [],
    languages: profile.languages || [],
    services: profile.services || [],
    awards: profile.awards || [],
    publications: profile.publications || [],
    isVerified: profile.isVerified || false,
    rating: profile.rating || { average: 0, count: 0 },
    availability: availability,
    availableHours: availableHours,
  };
}

// Helper to get availability display text
export function getAvailabilityText(doctor: DoctorProfile): {
  days: string;
  timeRange: string;
} {
  const availability = doctor.availableHours || doctor.availability;

  if (!availability) {
    return {
      days: 'Not specified',
      timeRange: 'Not specified',
    };
  }

  const days =
    Array.isArray(availability.days) && availability.days.length > 0
      ? availability.days.join(', ')
      : 'Not specified';

  const start =
    (availability as any).start || (availability as any).startTime || '';
  const end = (availability as any).end || (availability as any).endTime || '';
  const timeRange = start && end ? `${start} - ${end}` : 'Not specified';

  return { days, timeRange };
}

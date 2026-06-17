/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-undef */

export type UserRole =
  | 'ADMIN'
  | 'DOCTOR'
  | 'NURSE'
  | 'PATIENT'
  | 'RECEPTIONIST'
  | 'LABTECH'
  | 'PHARMACIST'
  | 'STAFF'
  | 'USER';

// Notification Preferences
export interface NotificationPreferences {
  emailNotifications: boolean;
  pushNotifications: boolean;
  inAppNotifications: boolean;
  appointmentReminders: boolean;
  messageAlerts: boolean;
  systemUpdates: boolean;
  marketingEmails: boolean;
}

// Base User Profile Type
export interface UserProfile {
  nic: string;
  id: string;
  name: string;
  email: string;
  image?: string;
  phone?: string;
  department?: string;
  specialization?: string;
  address?: string;
  bio?: string;
  role: UserRole;
  emailVerified?: Date;
  createdAt: Date;
  updatedAt: Date;
  notificationPreferences?: NotificationPreferences;
  licenseNumber?: string;
  isActive?: boolean;
  lastLogin?: Date;
  displayName?: string;
  roleDisplayName?: string;
}

// Profile Form Data
export interface ProfileFormData {
  name: string;
  email: string;
  phone: string;
  department: string;
  specialization: string;
  address: string;
  bio: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface ProfileUpdateResponse {
  user: UserProfile;
  message: string;
}

// Hook Return Types
export interface UseProfileReturn {
  profile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  updateProfile: (data: Partial<ProfileFormData>) => Promise<void>;
  refetch: () => Promise<void>;
}

export interface UseProfileImageReturn {
  uploadImage: (file: File) => Promise<string>;
  removeImage: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

// Validation Error Type
export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  success: boolean;
  errors: ValidationError[];
  data?: any;
}

// Stats Types
export interface ProfileStats {
  appointmentsCount: number;
  patientsCount?: number;
  prescriptionsCount?: number;
  labReportsCount?: number;
  lastActive: Date;
  memberSince: Date;
}

// Form Hook Types
export interface UseProfileFormReturn {
  formData: ProfileFormData;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  updateField: (field: keyof ProfileFormData, value: string) => void;
  validateField: (field: keyof ProfileFormData, role?: string) => void;
  validateForm: (role?: string) => ValidationResult;
  markFieldAsTouched: (field: keyof ProfileFormData) => void;
  resetForm: (data?: Partial<ProfileFormData>) => void;
  setFormData: React.Dispatch<React.SetStateAction<ProfileFormData>>;
  hasErrors: boolean;
}

// Password Manager Types
export interface UsePasswordManagerReturn {
  updatePassword: (
    currentPassword: string,
    newPassword: string
  ) => Promise<boolean>;
  isLoading: boolean;
  error: string | null;
  success: string | null;
  clearMessages: () => void;
}

// Profile Stats Hook Types
export interface UseProfileStatsReturn {
  stats: ProfileStats | null;
  isLoading: boolean;
  error: string | null;
  refetch: (id?: string) => Promise<void>;
}

// Image Upload Types
export interface ImageUploadResult {
  success: boolean;
  imageUrl?: string;
  error?: string;
}

// Profile Update Types
export interface ProfileUpdateData {
  name?: string;
  phone?: string;
  department?: string;
  specialization?: string;
  address?: string;
  bio?: string;
  licenseNumber?: string;
}

// Session User Type (compatible with NextAuth)
export interface SessionUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: UserRole;
}

// Error Types
export interface ProfileError {
  code: string;
  message: string;
  field?: string;
  details?: unknown;
}

// Success Response Types
export interface ProfileSuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
}

// Pagination Types (for future use)
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Filter Types (for future use)
export interface ProfileFilters {
  role?: UserRole;
  department?: string;
  specialization?: string;
  search?: string;
  isActive?: boolean;
}

// Role-based utility types
export type MedicalStaffRole = 'DOCTOR' | 'NURSE' | 'LABTECH' | 'PHARMACIST';
export type AdministrativeRole = 'ADMIN' | 'RECEPTIONIST' | 'STAFF';
export type PatientRole = 'PATIENT';
export type GeneralRole = 'USER';

// Utility types for component props
export type ProfileComponentProps = {
  user: UserProfile;
  onUpdate?: (user: UserProfile) => void;
  onError?: (error: ProfileError) => void;
};

export type EditableProfileComponentProps = ProfileComponentProps & {
  isEditing: boolean;
  onEditToggle: () => void;
  onSave: () => void;
  onCancel: () => void;
};

// Type guards
export const isUserProfile = (obj: any): obj is UserProfile => {
  return (
    obj &&
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.email === 'string' &&
    typeof obj.role === 'string' &&
    obj.createdAt instanceof Date
  );
};

export const isProfileFormData = (obj: any): obj is ProfileFormData => {
  return (
    obj &&
    typeof obj.name === 'string' &&
    typeof obj.email === 'string' &&
    typeof obj.phone === 'string' &&
    typeof obj.department === 'string' &&
    typeof obj.specialization === 'string' &&
    typeof obj.address === 'string' &&
    typeof obj.bio === 'string'
  );
};

export const isMedicalStaff = (role: UserRole): role is MedicalStaffRole => {
  return ['DOCTOR', 'NURSE', 'LABTECH', 'PHARMACIST'].includes(role);
};

export const isAdministrative = (
  role: UserRole
): role is AdministrativeRole => {
  return ['ADMIN', 'RECEPTIONIST', 'STAFF'].includes(role);
};

export const isPatient = (role: UserRole): role is PatientRole => {
  return role === 'PATIENT';
};

// Default notification preferences
export const defaultNotificationPreferences: NotificationPreferences = {
  emailNotifications: true,
  pushNotifications: true,
  inAppNotifications: true,
  appointmentReminders: true,
  messageAlerts: true,
  systemUpdates: true,
  marketingEmails: false,
};

// Profile completion status
export interface ProfileCompletion {
  basicInfo: boolean;
  contactInfo: boolean;
  professionalInfo: boolean;
  bio: boolean;
  overall: number; // percentage
}

// Export all types for easy importing
export // You can also export validation types if needed
 type {};

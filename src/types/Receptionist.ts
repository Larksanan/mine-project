export enum ShiftType {
  MORNING = 'MORNING',
  EVENING = 'EVENING',
  NIGHT = 'NIGHT',
  FULL_DAY = 'FULL_DAY',
}

export enum EmploymentType {
  FULL_TIME = 'FULL_TIME',
  PART_TIME = 'PART_TIME',
  CONTRACT = 'CONTRACT',
  INTERN = 'INTERN',
}

export enum EmploymentStatus {
  ACTIVE = 'ACTIVE',
  ON_LEAVE = 'ON_LEAVE',
  SUSPENDED = 'SUSPENDED',
  TERMINATED = 'TERMINATED',
}

export enum PaymentFrequency {
  WEEKLY = 'WEEKLY',
  BI_WEEKLY = 'BI_WEEKLY',
  MONTHLY = 'MONTHLY',
}

export const SHIFT_TIMES: Record<ShiftType, { start: string; end: string }> = {
  [ShiftType.MORNING]: { start: '06:00', end: '14:00' },
  [ShiftType.EVENING]: { start: '14:00', end: '22:00' },
  [ShiftType.NIGHT]: { start: '22:00', end: '06:00' },
  [ShiftType.FULL_DAY]: { start: '08:00', end: '17:00' },
};

export interface IDaySchedule {
  active: boolean;
  start: string;
  end: string;
}

export interface IWorkSchedule {
  monday: IDaySchedule;
  tuesday: IDaySchedule;
  wednesday: IDaySchedule;
  thursday: IDaySchedule;
  friday: IDaySchedule;
  saturday: IDaySchedule;
  sunday: IDaySchedule;
}

export interface IEmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  email?: string;
}

export interface ISalary {
  basic: number;
  allowances?: number;
  deductions?: number;
  currency?: string;
  paymentFrequency: PaymentFrequency;
}

export interface IPermissions {
  canManageAppointments: boolean;
  canManagePatients: boolean;
  canManageBilling: boolean;
  canViewReports: boolean;
  canManageInventory: boolean;
  canHandleEmergency: boolean;
  canAccessMedicalRecords: boolean;
  canManagePrescriptions: boolean;
}

export interface IPerformanceMetrics {
  averageCheckInTime?: number;
  averageAppointmentTime?: number;
  patientSatisfactionScore?: number;
  totalAppointmentsHandled?: number;
  errorRate?: number;
}

export interface ITrainingRecord {
  courseName: string;
  completionDate: Date | string;
  expiryDate?: Date | string;
  certificateId?: string;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'EXPIRED';
}

export interface IUser {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  image?: string;
  role: string;
  nic?: string;
  department?: string;
}

export interface IReceptionistFormData {
  userId: string;
  employeeId: string;
  nic?: string;
  shift: ShiftType | '';
  workSchedule: IWorkSchedule;
  department: string;
  assignedDoctor?: string;
  maxAppointmentsPerDay: number;
  currentAppointmentsCount?: number;
  skills: string[];
  languages: string[];
  emergencyContact: IEmergencyContact;
  employmentStatus: EmploymentStatus;
  employmentType: EmploymentType | '';
  hireDate: string | Date;
  terminationDate?: string | Date;
  salary: ISalary;
  performanceMetrics?: IPerformanceMetrics;
  permissions: IPermissions;
  trainingRecords?: ITrainingRecord[];
  lastModifiedBy?: string;
  notes?: string;
}

// API Request type - same as form data
export interface ICreateReceptionistRequest {
  userId: string;
  employeeId: string;
  nic?: string;
  shift: ShiftType | '';
  workSchedule: IWorkSchedule;
  department: string;
  assignedDoctor?: string;
  maxAppointmentsPerDay: number;
  currentAppointmentsCount?: number;
  skills: string[];
  languages: string[];
  emergencyContact: IEmergencyContact;
  employmentStatus: EmploymentStatus;
  employmentType: EmploymentType | '';
  hireDate: string | Date;
  terminationDate?: string | Date;
  salary: ISalary;
  performanceMetrics?: IPerformanceMetrics;
  permissions: IPermissions;
  trainingRecords?: ITrainingRecord[];
  lastModifiedBy?: string;
  notes?: string;
}

export interface IReceptionistQuery {
  page?: number;
  limit?: number;
  search?: string;
  department?: string;
  employmentStatus?: EmploymentStatus;
  shift?: ShiftType;
  employmentType?: EmploymentType;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  populate?: boolean;
}

// Response type from API - has populated user and assignedDoctor
export interface IReceptionist {
  _id: string;
  user: IUser;
  name: IUser;
  employeeId: string;
  nic?: string;
  shift: ShiftType;
  workSchedule: IWorkSchedule;
  department: string;
  assignedDoctor?: IUser;
  maxAppointmentsPerDay: number;
  currentAppointmentsCount?: number;
  skills: string[];
  languages: string[];
  emergencyContact: IEmergencyContact;
  employmentStatus: EmploymentStatus;
  employmentType: EmploymentType;
  hireDate: Date | string;
  terminationDate?: Date | string;
  salary: ISalary;
  performanceMetrics?: IPerformanceMetrics;
  permissions: IPermissions;
  trainingRecords?: ITrainingRecord[];
  lastModifiedBy?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  fullName?: string;
  email?: string;
  phone?: string;
  isAvailable?: boolean;
}

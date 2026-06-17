export interface IDepartment {
  _id: string;
  name: string;
  code: string;
  description?: string;
  head?: string;
  location?: string;
  floor?: number;
  phoneExtension?: string;
  email?: string;
  isActive: boolean;
  staffCount?: number;
  specializations?: string[];
  workingHours?: {
    monday: { start: string; end: string; isOpen: boolean };
    tuesday: { start: string; end: string; isOpen: boolean };
    wednesday: { start: string; end: string; isOpen: boolean };
    thursday: { start: string; end: string; isOpen: boolean };
    friday: { start: string; end: string; isOpen: boolean };
    saturday: { start: string; end: string; isOpen: boolean };
    sunday: { start: string; end: string; isOpen: boolean };
  };
  facilities?: string[];
  emergencyContact?: {
    name: string;
    phone: string;
    email?: string;
  };
  budget?: {
    allocated: number;
    spent: number;
    currency: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ICreateDepartmentInput {
  name: string;
  code: string;
  description?: string;
  head?: string;
  location?: string;
  floor?: number;
  phoneExtension?: string;
  email?: string;
  isActive?: boolean;
  specializations?: string[];
  workingHours?: IDepartment['workingHours'];
  facilities?: string[];
  emergencyContact?: IDepartment['emergencyContact'];
  budget?: IDepartment['budget'];
}

export interface IUpdateDepartmentInput extends Partial<ICreateDepartmentInput> {
  _id: string;
}

export interface IDepartmentFilters {
  isActive?: boolean;
  search?: string;
  floor?: number;
  hasHead?: boolean;
}

export interface IDepartmentStats {
  totalDepartments: number;
  activeDepartments: number;
  inactiveDepartments: number;
  totalStaff: number;
  averageStaffPerDepartment: number;
  departmentsByFloor: Record<number, number>;
}

export interface IDepartmentResponse {
  success: boolean;
  department?: IDepartment;
  departments?: IDepartment[];
  stats?: IDepartmentStats;
  message?: string;
  error?: string;
}

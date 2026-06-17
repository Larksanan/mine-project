import { Types } from 'mongoose';

export interface User {
  id: string;
  name: string;
  email: string;
  nic: string;
}

export interface PharmacyAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface PharmacyContact {
  phone: string;
  email?: string;
  emergencyPhone?: string;
}

export interface OperatingHours {
  Monday: string;
  Tuesday: string;
  Wednesday: string;
  Thursday: string;
  Friday: string;
  Saturday: string;
  Sunday: string;
}

export interface PharmacistInfo {
  name: string;
  licenseNumber: string;
}

export interface PharmacyInventory {
  totalProducts: number;
  lowStockItems: number;
  outOfStockItems: number;
}

export interface Pharmacy {
  _id: string | Types.ObjectId;
  userID?: string;
  name: string;
  address: PharmacyAddress;
  contact: PharmacyContact;
  operatingHours: OperatingHours;
  services: string[];
  pharmacists?: PharmacistInfo[];
  inventory?: PharmacyInventory;
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
  is24Hours: boolean;
  description?: string;
  createdBy:
    | string
    | Types.ObjectId
    | {
        id: string;
        name?: string;
        email?: string;
        role?: string;
      };
  website?: string;
  createdAt?: Date;
  updatedAt?: Date;

  // Virtuals
  isOpen?: boolean;
  formattedHours?: string;
}

// For API responses
export interface PharmacyResponse {
  success: boolean;
  data?: {
    pharmacy?: Pharmacy;
    pharmacies?: Pharmacy[];
    total?: number;
    page?: number;
    limit?: number;
    pages?: number;
  };
  message?: string;
  error?: string;
}

// For form inputs
export interface PharmacyFormData {
  name: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  contact: {
    phone: string;
    email?: string;
    emergencyPhone?: string;
  };
  operatingHours: OperatingHours;
  services: string[];
  pharmacists?: Array<{
    name: string;
    licenseNumber: string;
  }>;
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
  is24Hours: boolean;
  description?: string;
  website?: string;
}

export interface PharmacyListItem {
  id: string;
  name: string;
  city: string;
  state: string;
  phone: string;
  status: string;
  isOpen: boolean;
  formattedHours: string;
  totalProducts: number;
}

export interface PharmacyFilterOptions {
  status?: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE' | 'ALL';
  is24Hours?: boolean;
  city?: string;
  state?: string;
  service?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'city' | 'createdAt' | 'status';
  sortOrder?: 'asc' | 'desc';
}

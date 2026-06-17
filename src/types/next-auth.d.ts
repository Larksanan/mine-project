/* eslint-disable @typescript-eslint/no-unused-vars */
import NextAuth from 'next-auth';
import { UserRole } from '@/models/User';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: UserRole;
      phone?: string;
      department?: string;
      specialization?: string;
      licenseNumber?: string;
      address?: string;
      bio?: string;
      isActive?: boolean;
      lastLogin?: Date;
    };
    accessToken?: string;
  }

  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: UserRole;
    phone?: string;
    department?: string;
    specialization?: string;
    licenseNumber?: string;
    address?: string;
    bio?: string;
    isActive?: boolean;
    lastLogin?: Date;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    name?: string | null;
    email?: string | null;
    picture?: string | null;
    role?: UserRole;
    phone?: string;
    department?: string;
    specialization?: string;
    licenseNumber?: string;
    address?: string;
    bio?: string;
    isActive?: boolean;
    lastLogin?: Date;
    accessToken?: string;
  }
}

export interface IUserCredentials {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: UserRole;
  phone?: string;
  department?: string;
  specialization?: string;
  licenseNumber?: string;
  address?: string;
  bio?: string;
  isActive?: boolean;
  lastLogin?: Date;
}

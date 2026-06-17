/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { UserRole } from '@/models/User';

export interface AuthUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: UserRole;
  phone?: string;
  department?: string;
  specialization?: string;
  address?: string;
  bio?: string;
  isActive?: boolean;
  lastLogin?: Date;
}

export function useAuth() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { data: session, status, update } = useSession();
  const router = useRouter();

  const user: AuthUser | undefined = session?.user;

  // Role-based dashboard routing
  const getDashboardRoute = (): string => {
    if (!user?.role) return '/dashboard';

    const roleRoutes: Record<UserRole, string> = {
      ADMIN: '/dashboard/admin',
      DOCTOR: '/dashboard/doctor',
      NURSE: '/dashboard/nurse',
      RECEPTIONIST: '/dashboard/receptionist',
      LABTECH: '/dashboard/lab',
      PHARMACIST: '/dashboard/Pharmacist',
      STAFF: '/dashboard/staff',
      PATIENT: '/dashboard/patient',
      USER: '/dashboard/user',
    };

    return roleRoutes[user.role] || '/dashboard/user';
  };

  // Navigate to user's dashboard
  const navigateToDashboard = () => {
    const route = getDashboardRoute();
    router.push(route);
  };

  // Get role display name for any role
  const getRoleDisplayNameForRole = (role: UserRole): string => {
    const roleNames: Record<UserRole, string> = {
      ADMIN: 'Administrator',
      DOCTOR: 'Medical Doctor',
      NURSE: 'Registered Nurse',
      PATIENT: 'Patient',
      RECEPTIONIST: 'Receptionist',
      LABTECH: 'Laboratory Technician',
      PHARMACIST: 'Pharmacist',
      STAFF: 'Staff Member',
      USER: 'User',
    };

    return roleNames[role] || role;
  };

  // Get role badge color for any role
  const getRoleBadgeColorForRole = (role: UserRole): string => {
    const roleColors: Record<UserRole, string> = {
      ADMIN: 'bg-red-100 text-red-800 border-red-200',
      DOCTOR: 'bg-blue-100 text-blue-800 border-blue-200',
      NURSE: 'bg-green-100 text-green-800 border-green-200',
      PATIENT: 'bg-purple-100 text-purple-800 border-purple-200',
      RECEPTIONIST: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      LABTECH: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      PHARMACIST: 'bg-pink-100 text-pink-800 border-pink-200',
      STAFF: 'bg-gray-100 text-gray-800 border-gray-200',
      USER: 'bg-gray-100 text-gray-800 border-gray-200',
    };

    return roleColors[role] || roleColors.USER;
  };

  return {
    // User data
    user,
    session,

    // Auth status
    isAuthenticated: !!session,
    isLoading: status === 'loading',
    isError: status === 'unauthenticated',

    // Auth methods
    signIn: (provider?: string, options?: any) =>
      signIn(provider, { callbackUrl: '/dashboard', ...options }),
    signOut: () => signOut({ callbackUrl: '/' }),

    // Role-based access control
    isAdmin: user?.role === 'ADMIN',
    isDoctor: user?.role === 'DOCTOR',
    isNurse: user?.role === 'NURSE',
    isPatient: user?.role === 'PATIENT',
    isReceptionist: user?.role === 'RECEPTIONIST',
    isLabTech: user?.role === 'LABTECH',
    isPharmacist: user?.role === 'PHARMACIST',
    isStaff: user?.role === 'STAFF',
    isUser: user?.role === 'USER',

    // Role checking utility
    hasRole: (role: UserRole | UserRole[]) => {
      if (!user?.role) return false;

      if (Array.isArray(role)) {
        return role.includes(user.role);
      }

      return user.role === role;
    },

    // Permission-based access
    canAccess: (requiredRole: UserRole | UserRole[]) => {
      if (!user?.role) return false;

      const roleHierarchy: Record<UserRole, number> = {
        ADMIN: 100,
        DOCTOR: 90,
        NURSE: 80,
        PHARMACIST: 70,
        LABTECH: 60,
        RECEPTIONIST: 50,
        STAFF: 40,
        USER: 30,
        PATIENT: 20,
      };

      const userRoleLevel = roleHierarchy[user.role] || 0;

      if (Array.isArray(requiredRole)) {
        return requiredRole.some(role => userRoleLevel >= roleHierarchy[role]);
      }

      return userRoleLevel >= roleHierarchy[requiredRole];
    },

    // Feature flags based on role
    features: {
      canManageUsers: user?.role === 'ADMIN',
      canViewPatients: ['ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST'].includes(
        user?.role || ''
      ),
      canManageAppointments: [
        'ADMIN',
        'DOCTOR',
        'NURSE',
        'RECEPTIONIST',
      ].includes(user?.role || ''),
      canAccessMedicalRecords: ['ADMIN', 'DOCTOR', 'NURSE'].includes(
        user?.role || ''
      ),
      canManagePharmacy: ['ADMIN', 'PHARMACIST'].includes(user?.role || ''),
      canManageLab: ['ADMIN', 'LABTECH', 'DOCTOR'].includes(user?.role || ''),
      canViewAnalytics: ['ADMIN', 'DOCTOR'].includes(user?.role || ''),
      canBookAppointments: ['PATIENT', 'USER'].includes(user?.role || ''),
      canViewOwnRecords: true, // All authenticated users
      canManageSettings: user?.role === 'ADMIN',
      canViewReports: ['ADMIN', 'DOCTOR', 'NURSE'].includes(user?.role || ''),
    },

    // User profile utilities
    getDisplayName: () => {
      if (!user) return 'Guest';

      if (user.role === 'DOCTOR') {
        return `Dr. ${user.name}`;
      }
      if (user.role === 'ADMIN') {
        return `Mr. ${user.name}`;
      }

      return user.name || 'User';
    },

    getRoleDisplayName: () => {
      if (!user?.role) return 'User';
      return getRoleDisplayNameForRole(user.role);
    },

    getRoleBadgeColor: () => {
      if (!user?.role) return 'bg-gray-100 text-gray-800 border-gray-200';
      return getRoleBadgeColorForRole(user.role);
    },

    // Dashboard navigation
    getDashboardRoute,
    navigateToDashboard,

    // Role utilities (for any role, not just current user)
    getRoleDisplayNameForRole,
    getRoleBadgeColorForRole,

    // Session management
    useSession,

    // Quick access to common user properties
    userId: user?.id,
    userName: user?.name,
    userEmail: user?.email,
    userRole: user?.role,
    userImage: user?.image,
    userPhone: user?.phone,
    userDepartment: user?.department,
    userSpecialization: user?.specialization,
    userAddress: user?.address,
    userBio: user?.bio,
    userIsActive: user?.isActive,
    userLastLogin: user?.lastLogin,
  };
}

// Export types for use in components
export type { UserRole };

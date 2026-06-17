import { UserRole } from '@/models/User';

export const getUserRoleHierarchy = (): Record<UserRole, number> => ({
  ADMIN: 100,
  DOCTOR: 90,
  NURSE: 80,
  PHARMACIST: 70,
  LABTECH: 60,
  RECEPTIONIST: 50,
  STAFF: 40,
  USER: 30,
  PATIENT: 20,
});

export const canAccess = (
  userRole: UserRole,
  requiredRole: UserRole | UserRole[]
): boolean => {
  const hierarchy = getUserRoleHierarchy();
  const userRoleLevel = hierarchy[userRole] || 0;

  if (Array.isArray(requiredRole)) {
    return requiredRole.some(role => userRoleLevel >= hierarchy[role]);
  }

  return userRoleLevel >= hierarchy[requiredRole];
};

export const getRoleColor = (role: UserRole): string => {
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

export const getRolePermissions = (role: UserRole) => {
  const permissions = {
    canManageUsers: role === 'ADMIN',
    canViewPatients: ['ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST'].includes(
      role
    ),
    canManageAppointments: [
      'ADMIN',
      'DOCTOR',
      'NURSE',
      'RECEPTIONIST',
    ].includes(role),
    canAccessMedicalRecords: ['ADMIN', 'DOCTOR', 'NURSE'].includes(role),
    canManagePharmacy: ['ADMIN', 'PHARMACIST'].includes(role),
    canManageLab: ['ADMIN', 'LABTECH', 'DOCTOR'].includes(role),
    canViewAnalytics: ['ADMIN', 'DOCTOR'].includes(role),
    canBookAppointments: ['PATIENT', 'USER'].includes(role),
    canViewOwnRecords: true, // All authenticated users
  };

  return permissions;
};

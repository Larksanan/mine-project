'use client';

import { motion } from 'framer-motion';

interface RoleBadgeProps {
  role: string;
}

export default function RoleBadge({ role }: RoleBadgeProps) {
  const roleColors: { [key: string]: string } = {
    ADMIN: 'bg-gradient-to-r from-red-500 to-pink-600 text-white',
    DOCTOR: 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white',
    NURSE: 'bg-gradient-to-r from-green-500 to-emerald-600 text-white',
    PATIENT: 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white',
    RECEPTIONIST: 'bg-gradient-to-r from-amber-500 to-orange-600 text-white',
    LABTECH: 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white',
    PHARMACIST: 'bg-gradient-to-r from-pink-500 to-rose-600 text-white',
    STAFF: 'bg-gradient-to-r from-gray-500 to-slate-600 text-white',
  };

  const roleNames: { [key: string]: string } = {
    ADMIN: 'Admin',
    DOCTOR: 'Doctor',
    NURSE: 'Nurse',
    PATIENT: 'Patient',
    RECEPTIONIST: 'Receptionist',
    LABTECH: 'Lab Tech',
    PHARMACIST: 'Pharmacist',
    STAFF: 'Staff',
  };

  return (
    <motion.span
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`px-3 py-1 rounded-full text-xs font-semibold ${
        roleColors[role] ||
        'bg-linear-to-r from-gray-500 to-slate-600 text-white'
      }`}
    >
      {roleNames[role] || role}
    </motion.span>
  );
}

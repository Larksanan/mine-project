'use client';

import { motion } from 'framer-motion';
import { FiShield } from 'react-icons/fi';

interface RoleBadgeProps {
  role: string;
}

export default function RoleBadge({ role }: RoleBadgeProps) {
  const roleColors = {
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

  const roleNames = {
    ADMIN: 'Administrator',
    DOCTOR: 'Medical Doctor',
    NURSE: 'Registered Nurse',
    PATIENT: 'Patient',
    RECEPTIONIST: 'Receptionist',
    LABTECH: 'Lab Technician',
    PHARMACIST: 'Pharmacist',
    STAFF: 'Staff Member',
    USER: 'User',
  };

  return (
    <motion.span
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: 'spring', stiffness: 200, delay: 0.6 }}
      whileHover={{ scale: 1.05, y: -2 }}
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${
        roleColors[role as keyof typeof roleColors] || roleColors.USER
      }`}
    >
      <motion.div
        animate={{ rotate: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity, repeatDelay: 5 }}
      >
        <FiShield className='mr-1 h-4 w-4' />
      </motion.div>
      {roleNames[role as keyof typeof roleNames] || role}
    </motion.span>
  );
}

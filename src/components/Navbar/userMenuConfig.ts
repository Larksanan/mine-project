/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  FiUser,
  FiMessageSquare,
  FiBell,
  FiDroplet,
  FiSettings,
  FiCalendar,
  FiUsers,
  FiClipboard,
  FiActivity,
  FiFileText,
  FiHome,
  FiStar,
} from 'react-icons/fi';
import { FaHospitalUser } from 'react-icons/fa6';
import { BsCart4 } from 'react-icons/bs';
import { FaUserMd, FaUserNurse } from 'react-icons/fa';

export const commonMenuItems = [
  { name: 'Profile', href: '/profile', icon: FiUser },
  { name: 'Messages', href: '/messages', icon: FiMessageSquare },
  { name: 'Notifications', href: '/notifications', icon: FiBell },
];

export const roleSpecificItems: Record<string, any[]> = {
  PATIENT: [
    {
      name: 'My Appointments',
      href: '/patient/appointments',
      icon: FiCalendar,
    },
    { name: 'My Cart', href: '/shop/my-cart', icon: BsCart4 },
    {
      name: 'Labtest Requests',
      href: '/labtestrequests/patient',
      icon: FiDroplet,
    },
    { name: 'Medical Records', href: '/records/patient', icon: FiFileText },
    { name: 'My Orders', href: '/my-orders', icon: BsCart4 },
  ],
  DOCTOR: [
    {
      name: 'My Schedule',
      href: '/doctor/schedule',
      icon: FiCalendar,
    },
    {
      name: 'Prescriptions',
      href: '/doctor/prescriptions',
      icon: FiClipboard,
    },
    {
      name: 'Test Queue New',
      href: '/labtestrequests/create',
      icon: FiDroplet,
    },
    {
      name: 'Reports',
      href: '/records',
      icon: FiFileText,
    },
  ],
  NURSE: [
    { name: 'Tasks', href: '/nurse/tasks', icon: FiClipboard },
    { name: 'Vitals', href: '/nurse/vitals', icon: FiActivity },
    {
      name: 'Reports',
      href: '/records',
      icon: FiFileText,
    },
  ],
  RECEPTIONIST: [
    {
      name: 'Reports',
      href: '/records',
      icon: FiFileText,
    },
  ],
  LABTECH: [
    { name: 'Lab Tests', href: '/lab-tests', icon: FiDroplet },
    { name: 'Test Queue', href: '/labtestrequests', icon: FiClipboard },
    { name: 'Results', href: '/records', icon: FiFileText },
  ],
  PHARMACIST: [
    {
      name: 'Prescriptions',
      href: '/prescriptions',
      icon: FiClipboard,
    },
    {
      name: 'Banner Manager',
      href: '/shop/BannerManager',
      icon: FiSettings,
    },
    {
      name: 'News Letter',
      href: '/shop/newsletter',
      icon: FiBell,
    },
    {
      name: 'Featured Products',
      href: '/shop/featured-products',
      icon: FiStar,
    },
    { name: 'Orders', href: '/pharmacist/orders', icon: FiFileText },
  ],
  ADMIN: [
    { name: 'Users', href: '/dashboard/admin/users', icon: FiUsers },
    { name: 'Departments', href: '/departments', icon: FiHome },
    { name: 'Receptionist', href: '/receptionist', icon: FaHospitalUser },
    { name: 'Doctor', href: '/doctors', icon: FaUserMd },
    { name: 'New Doctor', href: '/doctors/new', icon: FaUserMd },
    { name: 'Pharmacist', href: '/pharmacist/pharmacies', icon: FaUserNurse },
    { name: 'Lab Technicians', href: '/labtechnicians', icon: FiDroplet },
  ],
  STAFF: [
    { name: 'Dashboard', href: '/dashboard/staff', icon: FiHome },
    { name: 'Tasks', href: '/dashboard/staff/tasks', icon: FiClipboard },
  ],
};

export const getUserMenuItems = (role?: string) => {
  const roleItems = role ? roleSpecificItems[role] || [] : [];
  return [...commonMenuItems, ...roleItems];
};

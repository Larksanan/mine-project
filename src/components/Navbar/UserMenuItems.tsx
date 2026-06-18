/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import {
  FiUser,
  FiMessageSquare,
  FiBell,
  FiDroplet,
  FiSettings,
  FiLogOut,
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

import Image from 'next/image';
import RoleBadge from './RoleBadge';

interface UserMenuItemsProps {
  user: any;
  onItemClick: () => void;
}

export default function UserMenuItems({
  user,
  onItemClick,
}: UserMenuItemsProps) {
  const { signOut } = useAuth();

  // Common menu items for all users
  const commonMenuItems = [
    { name: 'Profile', href: '/profile', icon: FiUser },
    { name: 'Messages', href: '/messages', icon: FiMessageSquare },
    { name: 'Notifications', href: '/notifications', icon: FiBell },
    { name: 'Settings', href: '/settings', icon: FiSettings },
  ];

  // Role-specific menu items
  const roleSpecificItems: { [key: string]: any[] } = {
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
        name: 'My Patients',
        href: '/patients',
        icon: FiUsers,
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
      { name: 'Tasks', href: '/nurse/tasks', icon: FiClipboard },
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
      {
        name: 'Departments',
        href: '/departments',
        icon: FiHome,
      },
      {
        name: 'Receptionist',
        href: '/receptionist',
        icon: FaHospitalUser,
      },

      {
        name: 'Doctor',
        href: '/doctors',
        icon: FaUserMd,
      },
      {
        name: 'New Doctor',
        href: '/doctors/new',
        icon: FaUserMd,
      },
      {
        name: 'Pharmacist',
        href: '/pharmacist/pharmacies',
        icon: FaUserNurse,
      },
      { name: 'Lab Technicians', href: '/labtechnicians', icon: FiDroplet },
    ],
    STAFF: [
      { name: 'Dashboard', href: '/dashboard/staff', icon: FiHome },
      { name: 'Tasks', href: '/dashboard/staff/tasks', icon: FiClipboard },
    ],
  };

  // Get menu items based on user role
  const getUserMenuItems = () => {
    const roleItems = user?.role ? roleSpecificItems[user.role] || [] : [];
    return [...commonMenuItems, ...roleItems];
  };

  const userMenuItems = getUserMenuItems();

  const handleSignOut = async () => {
    try {
      await signOut();
      onItemClick();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <>
      {/* User Info Header */}
      <div className='p-4 bg-linear-to-r from-blue-50 to-purple-50 border-b border-gray-200'>
        <div className='flex items-center space-x-3'>
          {user?.image ? (
            <div className='relative h-12 w-12 rounded-full border-2 border-white shadow-md overflow-hidden'>
              <Image
                src={user.image}
                alt={user.name || 'User'}
                fill
                sizes='48px'
                className='object-cover'
              />
            </div>
          ) : (
            <div className='h-12 w-12 rounded-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center border-2 border-white shadow-md'>
              <FiUser className='h-6 w-6 text-white' />
            </div>
          )}
          <div className='flex-1 min-w-0'>
            <div className='text-sm font-semibold text-gray-900 truncate'>
              {user?.name || 'User'}
            </div>
            <div className='text-xs text-gray-600 truncate'>{user?.email}</div>
            {user?.role && (
              <div className='mt-1'>
                <RoleBadge role={user.role} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className='p-2 max-h-96 overflow-y-auto'>
        {userMenuItems.map((item, index) => {
          // Add divider after common items
          const showDivider =
            index === commonMenuItems.length - 1 &&
            userMenuItems.length > commonMenuItems.length;

          return (
            <div key={item.name}>
              <motion.div
                whileHover={{ x: 5 }}
                transition={{ type: 'spring', stiffness: 400, damping: 10 }}
              >
                <Link
                  href={item.href}
                  className='flex items-center space-x-3 px-3 py-3 text-sm text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200'
                  onClick={onItemClick}
                >
                  <item.icon className='h-4 w-4' />
                  <span>{item.name}</span>
                </Link>
              </motion.div>
              {showDivider && <div className='my-2 border-t border-gray-200' />}
            </div>
          );
        })}

        {/* Sign Out Button */}
        <div className='mt-2 pt-2 border-t border-gray-200'>
          <motion.button
            onClick={handleSignOut}
            whileHover={{ x: 5, backgroundColor: '#fef2f2' }}
            className='flex items-center space-x-3 w-full px-3 py-3 text-sm text-red-600 hover:text-red-700 rounded-xl transition-all duration-200 text-left'
          >
            <FiLogOut className='h-4 w-4' />
            <span>Sign Out</span>
          </motion.button>
        </div>
      </div>
    </>
  );
}

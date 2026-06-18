'use client';

import Link from 'next/link';
import { motion, Variants } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import {
  FiHome,
  FiActivity,
  FiCalendar,
  FiShoppingCart,
  FiUsers,
  FiClipboard,
  FiDroplet,
  FiFileText,
} from 'react-icons/fi';

interface NavItemsProps {
  mobile?: boolean;
  onItemClick?: () => void;
}

export default function NavItems({
  mobile = false,
  onItemClick,
}: NavItemsProps) {
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuth();

  const getDashboardLink = () => {
    if (!user?.role) return '/dashboard';

    const roleMap: { [key: string]: string } = {
      ADMIN: '/dashboard/admin',
      DOCTOR: '/dashboard/doctor',
      NURSE: '/dashboard/nurse',
      RECEPTIONIST: '/dashboard/receptionist',
      LABTECH: '/dashboard/labtech',
      PHARMACIST: '/dashboard/pharmacy',
      STAFF: '/dashboard/staff',
      PATIENT: '/dashboard/patient',
    };

    return roleMap[user.role] || '/dashboard';
  };

  const getRoleBasedNavigation = () => {
    const baseNavigation = [{ name: 'Home', href: '/', icon: FiHome }];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const roleSpecificItems: { [key: string]: any[] } = {
      PATIENT: [
        {
          name: 'Appointments',
          href: '/patient/appointments',
          icon: FiCalendar,
        },
        { name: 'Shop', href: '/shop/pharmacy', icon: FiShoppingCart },
        {
          name: 'Prescriptions',
          href: '/doctor/prescriptions/patient',
          icon: FiClipboard,
        },
      ],
      DOCTOR: [
        {
          name: 'Prescriptions',
          href: '/doctor/prescriptions',
          icon: FiClipboard,
        },
      ],
      NURSE: [
        {
          name: 'Patient Care',
          href: '/nurse/patients',
          icon: FiUsers,
        },
        {
          name: 'Appointments',
          href: '/nurse/appointments',
          icon: FiCalendar,
        },
      ],
      RECEPTIONIST: [
        {
          name: 'Appointments',
          href: '/appointments',
          icon: FiCalendar,
        },
        {
          name: 'Patients',
          href: '/patients',
          icon: FiUsers,
        },
      ],
      LABTECH: [
        { name: 'Test Queue', href: '/labtestrequests', icon: FiClipboard },
        { name: 'Lab Tests', href: '/lab-tests', icon: FiDroplet },
        { name: 'Results', href: '/records', icon: FiFileText },
      ],
      PHARMACIST: [
        {
          name: 'Prescriptions',
          href: '/pharmacist/prescriptions',
          icon: FiClipboard,
        },
        { name: 'Shop', href: '/pharmacist/shop', icon: FiShoppingCart },
      ],
      ADMIN: [
        { name: 'Users', href: '/admin/users', icon: FiUsers },
        {
          name: 'Departments',
          href: '/departments',
          icon: FiActivity,
        },
        {
          name: 'Reports',
          href: '/records',
          icon: FiFileText,
        },
      ],
      STAFF: [
        { name: 'Tasks', href: '/dashboard/staff/tasks', icon: FiClipboard },
        { name: 'Appointments', href: '/appointments', icon: FiCalendar },
      ],
    };

    const defaultItems = [
      { name: 'Shop', href: '/shop/pharmacy', icon: FiShoppingCart },
    ];

    const middleItems =
      isAuthenticated && user?.role
        ? roleSpecificItems[user.role] || defaultItems
        : defaultItems;

    const dashboardItem = isAuthenticated
      ? [{ name: 'Dashboard', href: getDashboardLink(), icon: FiActivity }]
      : [];

    return [...baseNavigation, ...middleItems, ...dashboardItem];
  };

  const navigation = getRoleBasedNavigation();

  const itemVariants: Variants = {
    hover: {
      scale: 1.05,
      transition: {
        type: 'spring',
        stiffness: 400,
        damping: 10,
      },
    },
  };

  const mobileItemVariants: Variants = {
    hover: {
      x: 5,
      transition: {
        type: 'spring',
        stiffness: 400,
        damping: 10,
      },
    },
  };

  const currentVariants = mobile ? mobileItemVariants : itemVariants;

  return (
    <>
      {navigation.map(item => {
        const isActive = pathname === item.href;
        const Icon = item.icon;

        return (
          <motion.div
            key={item.name}
            variants={currentVariants}
            whileHover='hover'
          >
            <Link
              href={item.href}
              onClick={onItemClick}
              className={`
                flex items-center space-x-2 px-4 py-2 rounded-lg
                transition-all duration-200
                ${
                  isActive
                    ? 'bg-linear-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                    : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                }
                ${mobile ? 'w-full' : ''}
              `}
            >
              <Icon className='h-5 w-5' />
              <span className='font-medium'>{item.name}</span>
            </Link>
          </motion.div>
        );
      })}
    </>
  );
}

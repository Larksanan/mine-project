import {
  FiHome,
  FiPackage,
  FiUsers,
  FiShoppingCart,
  FiBarChart2,
  FiSettings,
  FiCalendar,
  FiFileText,
} from 'react-icons/fi';

export const menuItems = [
  {
    name: 'Dashboard',
    href: '/Pharmacist/dashboard',
    icon: FiHome,
  },
  {
    name: 'Pharmacies',
    href: '/Pharmacist/pharmacies',
    icon: FiPackage,
  },
  {
    name: 'Products',
    href: '/Pharmacist/shop',
    icon: FiShoppingCart,
  },
  {
    name: 'Patients',
    href: '/Pharmacist/patients',
    icon: FiUsers,
  },
  {
    name: 'Orders',
    href: '/Pharmacist/orders',
    icon: FiFileText,
  },
  {
    name: 'Appointments',
    href: '/Pharmacist/appointments',
    icon: FiCalendar,
  },
  {
    name: 'Analytics',
    href: '/Pharmacist/analytics',
    icon: FiBarChart2,
  },
  {
    name: 'Settings',
    href: '/Pharmacist/settings',
    icon: FiSettings,
  },
];

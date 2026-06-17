'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  FiHome,
  FiPackage,
  FiUsers,
  FiShoppingCart,
  FiBarChart2,
  FiSettings,
  FiCalendar,
  FiFileText,
  FiChevronLeft,
  FiChevronRight,
} from 'react-icons/fi';
import Logo from '@/components/Logo.static';

const menuItems = [
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

export default function PharmacistSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLogoClick = () => {
    router.push('/Pharmacist/dashboard');
  };

  return (
    <div
      className={`bg-white border-r border-gray-200 transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}
    >
      {/* Header */}
      <div className='flex items-center justify-between p-4 border-b border-gray-200'>
        {!isCollapsed ? (
          // When expanded, use a button for the logo (not a Link)
          <button
            onClick={handleLogoClick}
            className='flex items-center space-x-3 hover:opacity-80 transition-opacity'
          >
            <Logo />
            <span className='text-xl font-bold text-gray-900'>PharmaCare</span>
          </button>
        ) : (
          // When collapsed, use a button for the logo
          <button
            onClick={handleLogoClick}
            className='flex justify-center hover:opacity-80 transition-opacity'
          >
            <Logo />
          </button>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className='p-2 rounded-lg hover:bg-gray-100 transition-colors'
        >
          {isCollapsed ? (
            <FiChevronRight className='w-4 h-4 text-gray-600' />
          ) : (
            <FiChevronLeft className='w-4 h-4 text-gray-600' />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className='p-4'>
        <ul className='space-y-2'>
          {menuItems.map(item => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + '/');
            const Icon = item.icon;

            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`flex items-center space-x-3 px-3 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 ${isActive ? 'text-blue-700' : 'text-gray-400'}`}
                  />
                  {!isCollapsed && (
                    <span className='font-medium'>{item.name}</span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Quick Actions - Only show when expanded */}
      {!isCollapsed && (
        <div className='p-4 border-t border-gray-200 mt-4'>
          <h3 className='text-sm font-semibold text-gray-900 mb-3'>
            Quick Actions
          </h3>
          <div className='space-y-2'>
            <Link
              href='/Pharmacist/add-new-pharmacy'
              className='block w-full text-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium'
            >
              Add Pharmacy
            </Link>
            <Link
              href='/Pharmacist/shop/add-product'
              className='block w-full text-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium'
            >
              Add Product
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

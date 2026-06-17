/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import Image from 'next/image';
import Logo from '../Logo.static';
import {
  FiUser,
  FiLogOut,
  FiSettings,
  FiHome,
  FiPackage,
  FiShoppingCart,
  FiUsers,
  FiFileText,
  FiCalendar,
  FiBarChart2,
} from 'react-icons/fi';

interface MenuItem {
  name: string;
  href: string;
  icon: any;
}

const menuItems: MenuItem[] = [
  { name: 'Dashboard', href: 'dashboard/Pharmacist', icon: FiHome },
  { name: 'Pharmacies', href: '/Pharmacist/pharmacies', icon: FiPackage },
  { name: 'Products', href: '/Pharmacist/shop', icon: FiShoppingCart },
  { name: 'Patients', href: '/Pharmacist/patients', icon: FiUsers },
  { name: 'Appointments', href: '/Pharmacist/appointments', icon: FiCalendar },
];

export default function Header() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <header className='bg-white shadow-sm sticky top-0 z-50'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16'>
          <Logo />
          {/* Placeholder for menu items */}
          <nav className='hidden md:flex space-x-6'>
            {menuItems.map(item => (
              <div
                key={item.name}
                className='flex items-center gap-1 px-3 py-2 rounded-lg bg-gray-100 text-transparent'
              >
                <div className='w-5 h-5 bg-gray-200 rounded' />
                {item.name}
              </div>
            ))}
          </nav>
          {/* Placeholder for user menu */}
          <div className='flex items-center gap-4'>
            <div className='w-8 h-8 rounded-full bg-gray-200 animate-pulse' />
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className='bg-white shadow-sm sticky top-0 z-50'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16'>
        {/* Left - Logo / Brand */}
        <Logo />

        {/* Center - Menu Items */}
        <nav className='hidden md:flex space-x-6'>
          {menuItems.map(item => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-1 px-3 py-2 rounded-lg transition-colors duration-200 ${
                  isActive
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Icon className='w-5 h-5' />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Right - Actions */}
        <div className='flex items-center gap-4 relative'>
          {/* User Menu */}
          <div className='relative'>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className='flex items-center gap-2 p-2 rounded-full hover:bg-gray-100 transition-all'
            >
              {session?.user?.image ? (
                <Image
                  src={session.user.image}
                  alt={session.user.name || 'User'}
                  width={32}
                  height={32}
                  className='rounded-full object-cover'
                />
              ) : (
                <FiUser className='w-5 h-5 text-gray-600' />
              )}
              <span className='hidden sm:inline text-gray-700 font-medium'>
                {session?.user?.name || 'Pharmacist'}
              </span>
            </button>

            {/* Dropdown */}
            {isDropdownOpen && (
              <div className='absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-xl border border-gray-100 overflow-hidden z-50'>
                <Link
                  href='/Pharmacist/settings'
                  className='flex items-center gap-2 px-4 py-3 hover:bg-gray-100 text-gray-700'
                  onClick={() => setIsDropdownOpen(false)}
                >
                  <FiSettings className='w-4 h-4' />
                  Settings
                </Link>
                <Link
                  href='/Pharmacist/analytics'
                  className='flex items-center gap-2 px-4 py-3 hover:bg-gray-100 text-gray-700'
                  onClick={() => setIsDropdownOpen(false)}
                >
                  <FiBarChart2 className='w-4 h-4' />
                  Analytics
                </Link>

                <Link
                  href='/Pharmacist/orders'
                  className='flex items-center gap-2 px-4 py-3 hover:bg-gray-100 text-gray-700'
                  onClick={() => setIsDropdownOpen(false)}
                >
                  <FiFileText className='w-4 h-4' />
                  Orders
                </Link>

                <button
                  onClick={() => signOut()}
                  className='flex items-center gap-2 w-full px-4 py-3 hover:bg-gray-100 text-gray-700'
                >
                  <FiLogOut className='w-4 h-4' />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

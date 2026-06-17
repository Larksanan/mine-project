'use client';

import React, { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import {
  FiBell,
  FiUser,
  FiSettings,
  FiLogOut,
  FiMenu,
  FiSearch,
} from 'react-icons/fi';

export default function PharmacistHeader() {
  const { data: session } = useSession();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  return (
    <header className='bg-white shadow-sm border-b border-gray-200'>
      <div className='flex items-center justify-between px-6 py-4'>
        {/* Left side - Search and navigation */}
        <div className='flex items-center space-x-4'>
          <button
            className='lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors'
            suppressHydrationWarning
          >
            <FiMenu className='w-5 h-5 text-gray-600' />
          </button>

          <div className='relative hidden md:block'>
            <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
              <FiSearch className='h-4 w-4 text-gray-400' />
            </div>
            <input
              type='text'
              placeholder='Search patients, medications...'
              className='pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64'
              suppressHydrationWarning
            />
          </div>
        </div>

        {/* Right side - User menu and notifications */}
        <div className='flex items-center space-x-4'>
          {/* Notifications */}
          <div className='relative'>
            <button
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className='p-2 rounded-lg hover:bg-gray-100 transition-colors relative'
              suppressHydrationWarning
            >
              <FiBell className='w-5 h-5 text-gray-600' />
              <span className='absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white'></span>
            </button>

            {isNotificationsOpen && (
              <div className='absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50'>
                <div className='p-4 border-b border-gray-200'>
                  <h3 className='font-semibold text-gray-900'>Notifications</h3>
                </div>
                <div className='max-h-96 overflow-y-auto'>
                  {/* Notification items */}
                  <div className='p-4 border-b border-gray-100 hover:bg-gray-50'>
                    <p className='text-sm text-gray-900'>
                      New prescription order received
                    </p>
                    <p className='text-xs text-gray-500 mt-1'>2 minutes ago</p>
                  </div>
                  <div className='p-4 border-b border-gray-100 hover:bg-gray-50'>
                    <p className='text-sm text-gray-900'>
                      Inventory low: Vitamin C tablets
                    </p>
                    <p className='text-xs text-gray-500 mt-1'>1 hour ago</p>
                  </div>
                  <div className='p-4 hover:bg-gray-50'>
                    <p className='text-sm text-gray-900'>
                      New patient registration
                    </p>
                    <p className='text-xs text-gray-500 mt-1'>3 hours ago</p>
                  </div>
                </div>
                <div className='p-4 border-t border-gray-200'>
                  <Link
                    href='/Pharmacist/notifications'
                    className='text-sm text-blue-600 hover:text-blue-700 font-medium'
                  >
                    View all notifications
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* User Profile */}
          <div className='relative'>
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className='flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors'
              suppressHydrationWarning
            >
              <div className='w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center'>
                <span className='text-white text-sm font-medium'>
                  {session?.user?.name?.charAt(0) || 'P'}
                </span>
              </div>
              <div className='hidden md:block text-left'>
                <p className='text-sm font-medium text-gray-900'>
                  {session?.user?.name || 'Pharmacist'}
                </p>
                <p className='text-xs text-gray-500 capitalize'>
                  {session?.user?.role?.toLowerCase() || 'pharmacist'}
                </p>
              </div>
            </button>

            {isProfileOpen && (
              <div className='absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50'>
                <div className='p-2'>
                  <Link
                    href='/Pharmacist/profile'
                    className='flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors'
                  >
                    <FiUser className='w-4 h-4' />
                    <span>My Profile</span>
                  </Link>
                  <Link
                    href='/Pharmacist/settings'
                    className='flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors'
                  >
                    <FiSettings className='w-4 h-4' />
                    <span>Settings</span>
                  </Link>
                  <button
                    onClick={() => signOut()}
                    className='flex items-center space-x-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors w-full text-left'
                    suppressHydrationWarning
                  >
                    <FiLogOut className='w-4 h-4' />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

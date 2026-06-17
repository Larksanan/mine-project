'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FiBell,
  FiShield,
  FiKey,
  FiTrash2,
  FiSettings as FiSettingsIcon,
} from 'react-icons/fi';
import {
  NotificationSettings,
  PrivacySettings,
  ChangePassword,
  DeleteAccount,
} from '@/components/settings';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('notifications');

  const tabs = [
    {
      id: 'notifications',
      label: 'Notifications',
      icon: FiBell,
      color: 'blue',
    },
    {
      id: 'privacy',
      label: 'Privacy',
      icon: FiShield,
      color: 'purple',
    },
    {
      id: 'password',
      label: 'Password',
      icon: FiKey,
      color: 'green',
    },
    {
      id: 'danger',
      label: 'Danger Zone',
      icon: FiTrash2,
      color: 'red',
    },
  ];

  return (
    <div className='min-h-screen bg-linear-to-br from-gray-50 via-blue-50 to-indigo-50 py-8'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Page Header */}
        <div className='mb-8'>
          <div className='flex items-center gap-3 mb-2'>
            <div className='w-12 h-12 bg-linear-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg'>
              <FiSettingsIcon className='w-6 h-6 text-white' />
            </div>
            <div>
              <h1 className='text-3xl font-bold text-gray-900'>Settings</h1>
              <p className='text-gray-600'>Manage your account preferences</p>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className='bg-white rounded-xl shadow-md mb-6 overflow-hidden'>
          <div className='flex overflow-x-auto'>
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const colorClasses = {
                blue: 'bg-blue-50 text-blue-600 border-blue-600',
                purple: 'bg-purple-50 text-purple-600 border-purple-600',
                green: 'bg-green-50 text-green-600 border-green-600',
                red: 'bg-red-50 text-red-600 border-red-600',
              };

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 min-w-35 flex items-center justify-center gap-2 px-6 py-4 font-medium transition-all relative ${
                    isActive
                      ? colorClasses[tab.color as keyof typeof colorClasses]
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className='w-5 h-5' />
                  <span className='hidden sm:inline'>{tab.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId='activeTabIndicator'
                      className={`absolute bottom-0 left-0 right-0 h-1 bg-${tab.color}-600`}
                      style={{
                        backgroundColor:
                          tab.color === 'blue'
                            ? '#2563eb'
                            : tab.color === 'purple'
                              ? '#9333ea'
                              : tab.color === 'green'
                                ? '#16a34a'
                                : '#dc2626',
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'notifications' && <NotificationSettings />}
          {activeTab === 'privacy' && <PrivacySettings />}
          {activeTab === 'password' && <ChangePassword />}
          {activeTab === 'danger' && <DeleteAccount />}
        </motion.div>
      </div>
    </div>
  );
}

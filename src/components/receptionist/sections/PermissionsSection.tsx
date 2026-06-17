import React from 'react';
import { IPermissions } from '@/types/Receptionist';
import {
  FiCalendar,
  FiUsers,
  FiDollarSign,
  FiBarChart2,
  FiPackage,
  FiAlertCircle,
  FiFileText,
  FiClipboard,
} from 'react-icons/fi';

interface PermissionsSectionProps {
  permissions: IPermissions;
  onPermissionChange: (field: string, value: boolean) => void;
}

const PermissionsSection: React.FC<PermissionsSectionProps> = ({
  permissions,
  onPermissionChange,
}) => {
  const permissionItems = [
    {
      key: 'canManageAppointments',
      label: 'Manage Appointments',
      description: 'Create, update, and cancel patient appointments',
      icon: FiCalendar,
      color: 'blue',
    },
    {
      key: 'canManagePatients',
      label: 'Manage Patients',
      description: 'Add and update patient information and records',
      icon: FiUsers,
      color: 'green',
    },
    {
      key: 'canManageBilling',
      label: 'Manage Billing',
      description:
        'Process payments, generate invoices, and handle transactions',
      icon: FiDollarSign,
      color: 'yellow',
    },
    {
      key: 'canViewReports',
      label: 'View Reports',
      description: 'Access system reports, analytics, and statistics',
      icon: FiBarChart2,
      color: 'purple',
    },
    {
      key: 'canManageInventory',
      label: 'Manage Inventory',
      description: 'Update inventory levels and manage supplies',
      icon: FiPackage,
      color: 'indigo',
    },
    {
      key: 'canHandleEmergency',
      label: 'Handle Emergency',
      description: 'Manage emergency cases and priority bookings',
      icon: FiAlertCircle,
      color: 'red',
    },
    {
      key: 'canAccessMedicalRecords',
      label: 'Access Medical Records',
      description: 'View patient medical history and health records',
      icon: FiFileText,
      color: 'pink',
    },
    {
      key: 'canManagePrescriptions',
      label: 'Manage Prescriptions',
      description: 'View, process, and manage patient prescriptions',
      icon: FiClipboard,
      color: 'teal',
    },
  ];

  const colorClasses: Record<
    string,
    { bg: string; text: string; border: string; iconBg: string }
  > = {
    blue: {
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      border: 'border-blue-200',
      iconBg: 'bg-blue-100',
    },
    green: {
      bg: 'bg-green-50',
      text: 'text-green-700',
      border: 'border-green-200',
      iconBg: 'bg-green-100',
    },
    yellow: {
      bg: 'bg-yellow-50',
      text: 'text-yellow-700',
      border: 'border-yellow-200',
      iconBg: 'bg-yellow-100',
    },
    purple: {
      bg: 'bg-purple-50',
      text: 'text-purple-700',
      border: 'border-purple-200',
      iconBg: 'bg-purple-100',
    },
    indigo: {
      bg: 'bg-indigo-50',
      text: 'text-indigo-700',
      border: 'border-indigo-200',
      iconBg: 'bg-indigo-100',
    },
    red: {
      bg: 'bg-red-50',
      text: 'text-red-700',
      border: 'border-red-200',
      iconBg: 'bg-red-100',
    },
    pink: {
      bg: 'bg-pink-50',
      text: 'text-pink-700',
      border: 'border-pink-200',
      iconBg: 'bg-pink-100',
    },
    teal: {
      bg: 'bg-teal-50',
      text: 'text-teal-700',
      border: 'border-teal-200',
      iconBg: 'bg-teal-100',
    },
  };

  const enabledCount = Object.values(permissions).filter(Boolean).length;
  const totalCount = permissionItems.length;

  const toggleAll = (enable: boolean) => {
    permissionItems.forEach(item => {
      onPermissionChange(item.key, enable);
    });
  };

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div>
        <div className='flex items-center justify-between'>
          <div>
            <h3 className='text-lg font-medium text-gray-900'>
              System Permissions
            </h3>
            <p className='text-sm text-gray-500 mt-1'>
              Configure what this receptionist can access in the system
            </p>
          </div>
          <div className='flex items-center gap-2'>
            <button
              type='button'
              onClick={() => toggleAll(true)}
              className='px-3 py-1.5 text-xs bg-green-50 text-green-600 rounded-lg hover:bg-green-100 font-medium'
            >
              Enable All
            </button>
            <button
              type='button'
              onClick={() => toggleAll(false)}
              className='px-3 py-1.5 text-xs bg-red-50 text-red-600 rounded-lg hover:bg-red-100 font-medium'
            >
              Disable All
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className='mt-4'>
          <div className='flex items-center justify-between text-sm mb-2'>
            <span className='text-gray-600'>Permissions Enabled</span>
            <span className='font-medium text-gray-900'>
              {enabledCount} / {totalCount}
            </span>
          </div>
          <div className='w-full bg-gray-200 rounded-full h-2'>
            <div
              className='bg-blue-600 h-2 rounded-full transition-all duration-300'
              style={{ width: `${(enabledCount / totalCount) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Permission Cards */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        {permissionItems.map(item => {
          const Icon = item.icon;
          const colors = colorClasses[item.color];
          const isEnabled = permissions[item.key as keyof IPermissions];

          return (
            <div
              key={item.key}
              className={`relative border rounded-lg p-4 transition-all cursor-pointer ${
                isEnabled
                  ? `${colors.bg} ${colors.border} shadow-sm`
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => onPermissionChange(item.key, !isEnabled)}
            >
              <div className='flex items-start gap-3'>
                {/* Checkbox */}
                <input
                  type='checkbox'
                  checked={isEnabled}
                  onChange={e => onPermissionChange(item.key, e.target.checked)}
                  className='mt-1 h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer'
                  onClick={e => e.stopPropagation()}
                />

                {/* Icon */}
                <div
                  className={`p-2 rounded-lg ${isEnabled ? colors.iconBg : 'bg-gray-100'}`}
                >
                  <Icon
                    className={`w-5 h-5 ${isEnabled ? colors.text : 'text-gray-400'}`}
                  />
                </div>

                {/* Content */}
                <div className='flex-1'>
                  <label className='block text-sm font-medium text-gray-900 cursor-pointer'>
                    {item.label}
                  </label>
                  <p className='text-xs text-gray-600 mt-1'>
                    {item.description}
                  </p>
                </div>
              </div>

              {/* Enabled Badge */}
              {isEnabled && (
                <div className='absolute top-2 right-2'>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colors.bg} ${colors.text}`}
                  >
                    Enabled
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Warning Message */}
      {enabledCount === 0 && (
        <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-4'>
          <div className='flex items-start gap-3'>
            <FiAlertCircle className='w-5 h-5 text-yellow-600 mt-0.5' />
            <div>
              <h4 className='text-sm font-medium text-yellow-800'>
                No Permissions Enabled
              </h4>
              <p className='text-sm text-yellow-700 mt-1'>
                This receptionist won&apos;t be able to perform any actions.
                Please enable at least one permission.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PermissionsSection;

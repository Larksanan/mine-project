import React from 'react';
import { IReceptionistFormData, ShiftType } from '@/types/Receptionist';

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  nic?: string;
}

interface BasicInfoSectionProps {
  formData: IReceptionistFormData;
  users: User[];
  loadingUsers: boolean;
  formErrors: Record<string, string>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onFieldChange: (field: string, value: any) => void;
}

const BasicInfoSection: React.FC<BasicInfoSectionProps> = ({
  formData,
  users,
  loadingUsers,
  formErrors,
  onFieldChange,
}) => {
  const departments = [
    'Reception',
    'Emergency',
    'OPD',
    'IPD',
    'Administration',
    'Billing',
    'Laboratory',
    'Pharmacy',
  ];

  return (
    <div className='space-y-6'>
      {/* User Selection */}
      <div>
        <label className='block text-sm font-medium text-gray-700 mb-2'>
          Select User <span className='text-red-500'>*</span>
        </label>
        {loadingUsers ? (
          <div className='flex items-center justify-center py-8'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
            <span className='ml-3 text-sm text-gray-500'>Loading users...</span>
          </div>
        ) : (
          <select
            value={formData.userId}
            onChange={e => onFieldChange('userId', e.target.value)}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              formErrors.userId ? 'border-red-500' : 'border-gray-300'
            }`}
            required
          >
            <option value=''>Select a user</option>
            {users.map(user => (
              <option key={user.id} value={user.id}>
                {user.name} - {user.email}
              </option>
            ))}
          </select>
        )}
        {formErrors.userId && (
          <p className='mt-1 text-sm text-red-600'>{formErrors.userId}</p>
        )}
        <p className='mt-1 text-xs text-gray-500'>
          Select a user account to create a receptionist profile for
        </p>
      </div>

      {/* Employee ID */}
      <div>
        <label className='block text-sm font-medium text-gray-700 mb-2'>
          Employee ID <span className='text-red-500'>*</span>
        </label>
        <input
          type='text'
          value={formData.employeeId}
          onChange={e =>
            onFieldChange('employeeId', e.target.value.toUpperCase())
          }
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            formErrors.employeeId ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder='REC-2024-0001'
          required
        />
        <p className='mt-1 text-xs text-gray-500'>Format: REC-YYYY-XXXX</p>
        {formErrors.employeeId && (
          <p className='mt-1 text-sm text-red-600'>{formErrors.employeeId}</p>
        )}
      </div>

      {/* NIC */}
      <div>
        <label className='block text-sm font-medium text-gray-700 mb-2'>
          NIC Number
        </label>
        <input
          type='text'
          value={formData.nic || ''}
          onChange={e => onFieldChange('nic', e.target.value)}
          className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
          placeholder='123456789V or 123456789012'
        />
        <p className='mt-1 text-xs text-gray-500'>
          Format: 9 digits + V/X or 12 digits
        </p>
      </div>

      {/* Department */}
      <div>
        <label className='block text-sm font-medium text-gray-700 mb-2'>
          Department <span className='text-red-500'>*</span>
        </label>
        <select
          value={formData.department}
          onChange={e => onFieldChange('department', e.target.value)}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            formErrors.department ? 'border-red-500' : 'border-gray-300'
          }`}
          required
        >
          <option value=''>Select department</option>
          {departments.map(dept => (
            <option key={dept} value={dept}>
              {dept}
            </option>
          ))}
        </select>
        {formErrors.department && (
          <p className='mt-1 text-sm text-red-600'>{formErrors.department}</p>
        )}
      </div>

      {/* Shift */}
      <div>
        <label className='block text-sm font-medium text-gray-700 mb-2'>
          Shift <span className='text-red-500'>*</span>
        </label>
        <select
          value={formData.shift}
          onChange={e => onFieldChange('shift', e.target.value)}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            formErrors.shift ? 'border-red-500' : 'border-gray-300'
          }`}
          required
        >
          <option value=''>Select shift</option>
          <option value={ShiftType.MORNING}>Morning (6:00 AM - 2:00 PM)</option>
          <option value={ShiftType.EVENING}>
            Evening (2:00 PM - 10:00 PM)
          </option>
          <option value={ShiftType.NIGHT}>Night (10:00 PM - 6:00 AM)</option>
          <option value={ShiftType.FULL_DAY}>
            Full Day (8:00 AM - 5:00 PM)
          </option>
        </select>
        {formErrors.shift && (
          <p className='mt-1 text-sm text-red-600'>{formErrors.shift}</p>
        )}
      </div>

      {/* Max Appointments Per Day */}
      <div>
        <label className='block text-sm font-medium text-gray-700 mb-2'>
          Max Appointments Per Day
        </label>
        <input
          type='number'
          min='1'
          max='100'
          value={formData.maxAppointmentsPerDay || 30}
          onChange={e =>
            onFieldChange(
              'maxAppointmentsPerDay',
              parseInt(e.target.value) || 30
            )
          }
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            formErrors.maxAppointmentsPerDay
              ? 'border-red-500'
              : 'border-gray-300'
          }`}
        />
        <p className='mt-1 text-xs text-gray-500'>
          Maximum number of appointments this receptionist can handle per day
        </p>
        {formErrors.maxAppointmentsPerDay && (
          <p className='mt-1 text-sm text-red-600'>
            {formErrors.maxAppointmentsPerDay}
          </p>
        )}
      </div>
    </div>
  );
};

export default BasicInfoSection;

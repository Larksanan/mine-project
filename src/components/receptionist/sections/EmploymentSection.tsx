import React from 'react';
import {
  IReceptionistFormData,
  EmploymentType,
  EmploymentStatus,
  PaymentFrequency,
} from '@/types/Receptionist';

interface EmploymentSectionProps {
  formData: IReceptionistFormData;
  formErrors: Record<string, string>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onFieldChange: (field: string, value: any) => void;
  onEmergencyContactChange: (field: string, value: string) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSalaryChange: (field: string, value: any) => void;
}

const EmploymentSection: React.FC<EmploymentSectionProps> = ({
  formData,
  formErrors,
  onFieldChange,
  onEmergencyContactChange,
  onSalaryChange,
}) => {
  return (
    <div className='space-y-8'>
      {/* Employment Details */}
      <div className='space-y-6'>
        <h3 className='text-lg font-medium text-gray-900'>
          Employment Details
        </h3>

        {/* Employment Type */}
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-2'>
            Employment Type <span className='text-red-500'>*</span>
          </label>
          <select
            value={formData.employmentType}
            onChange={e => onFieldChange('employmentType', e.target.value)}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              formErrors.employmentType ? 'border-red-500' : 'border-gray-300'
            }`}
            required
          >
            <option value=''>Select employment type</option>
            <option value={EmploymentType.FULL_TIME}>Full Time</option>
            <option value={EmploymentType.PART_TIME}>Part Time</option>
            <option value={EmploymentType.CONTRACT}>Contract</option>
            <option value={EmploymentType.INTERN}>Intern</option>
          </select>
          {formErrors.employmentType && (
            <p className='mt-1 text-sm text-red-600'>
              {formErrors.employmentType}
            </p>
          )}
        </div>

        {/* Employment Status */}
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-2'>
            Employment Status
          </label>
          <select
            value={formData.employmentStatus}
            onChange={e => onFieldChange('employmentStatus', e.target.value)}
            className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
          >
            <option value={EmploymentStatus.ACTIVE}>Active</option>
            <option value={EmploymentStatus.ON_LEAVE}>On Leave</option>
            <option value={EmploymentStatus.SUSPENDED}>Suspended</option>
            <option value={EmploymentStatus.TERMINATED}>Terminated</option>
          </select>
        </div>

        {/* Hire Date */}
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-2'>
            Hire Date <span className='text-red-500'>*</span>
          </label>
          <input
            type='date'
            value={
              formData.hireDate
                ? new Date(formData.hireDate).toISOString().split('T')[0]
                : ''
            }
            onChange={e => onFieldChange('hireDate', e.target.value)}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              formErrors.hireDate ? 'border-red-500' : 'border-gray-300'
            }`}
            required
          />
          {formErrors.hireDate && (
            <p className='mt-1 text-sm text-red-600'>{formErrors.hireDate}</p>
          )}
        </div>
      </div>

      {/* Salary Information */}
      <div className='space-y-6'>
        <h3 className='text-lg font-medium text-gray-900'>
          Salary Information
        </h3>

        <div className='grid grid-cols-2 gap-4'>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Basic Salary (LKR)
            </label>
            <input
              type='number'
              min='0'
              step='0.01'
              value={formData.salary?.basic || ''}
              onChange={e =>
                onSalaryChange('basic', parseFloat(e.target.value) || 0)
              }
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                formErrors.salaryBasic ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {formErrors.salaryBasic && (
              <p className='mt-1 text-sm text-red-600'>
                {formErrors.salaryBasic}
              </p>
            )}
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Allowances (LKR)
            </label>
            <input
              type='number'
              min='0'
              step='0.01'
              value={formData.salary?.allowances || ''}
              onChange={e =>
                onSalaryChange('allowances', parseFloat(e.target.value) || 0)
              }
              className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
            />
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Deductions (LKR)
            </label>
            <input
              type='number'
              min='0'
              step='0.01'
              value={formData.salary?.deductions || ''}
              onChange={e =>
                onSalaryChange('deductions', parseFloat(e.target.value) || 0)
              }
              className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
            />
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Payment Frequency
            </label>
            <select
              value={
                formData.salary?.paymentFrequency || PaymentFrequency.MONTHLY
              }
              onChange={e => onSalaryChange('paymentFrequency', e.target.value)}
              className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
            >
              <option value={PaymentFrequency.MONTHLY}>Monthly</option>
              <option value={PaymentFrequency.BI_WEEKLY}>Bi-Weekly</option>
              <option value={PaymentFrequency.WEEKLY}>Weekly</option>
            </select>
          </div>
        </div>
      </div>

      {/* Emergency Contact */}
      <div className='space-y-6'>
        <h3 className='text-lg font-medium text-gray-900'>Emergency Contact</h3>

        <div className='grid grid-cols-2 gap-4'>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Contact Name
            </label>
            <input
              type='text'
              value={formData.emergencyContact?.name || ''}
              onChange={e => onEmergencyContactChange('name', e.target.value)}
              className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              placeholder='Full name'
            />
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Relationship
            </label>
            <input
              type='text'
              value={formData.emergencyContact?.relationship || ''}
              onChange={e =>
                onEmergencyContactChange('relationship', e.target.value)
              }
              className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              placeholder='e.g., Spouse, Parent'
            />
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Phone Number
            </label>
            <input
              type='tel'
              value={formData.emergencyContact?.phone || ''}
              onChange={e => onEmergencyContactChange('phone', e.target.value)}
              className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              placeholder='+94XXXXXXXXX'
            />
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Email (Optional)
            </label>
            <input
              type='email'
              value={formData.emergencyContact?.email || ''}
              onChange={e => onEmergencyContactChange('email', e.target.value)}
              className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              placeholder='email@example.com'
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmploymentSection;

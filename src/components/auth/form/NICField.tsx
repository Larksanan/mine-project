'use client';

import { FieldError, UseFormRegister, Path } from 'react-hook-form';
import { MdCheckCircle, MdError } from 'react-icons/md';
import { FaIdCard } from 'react-icons/fa';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface NICFieldProps<T extends Record<string, any>> {
  register: UseFormRegister<T>;
  error?: FieldError;
  value?: string;
  label?: string;
  placeholder?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function NICField<T extends Record<string, any>>({
  register,
  error,
  value,
  label = 'National Identity Card (NIC)',
  placeholder = 'Enter your NIC number',
}: NICFieldProps<T>) {
  const hasValue = value && value.length > 0;

  return (
    <div className='space-y-2'>
      <label htmlFor='nic' className='block text-sm font-medium text-gray-700'>
        {label}
      </label>
      <div className='relative'>
        {/* Left Icon */}
        <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
          <FaIdCard className='h-5 w-5 text-gray-400' />
        </div>

        <input
          {...register('nic' as Path<T>)}
          type='text'
          id='nic'
          placeholder={placeholder}
          autoComplete='off'
          className={`w-full pl-10 pr-10 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 outline-none ${
            error
              ? 'border-red-500 bg-red-50'
              : hasValue
                ? 'border-green-500 bg-green-50'
                : 'border-gray-300 bg-white'
          }`}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? 'nic-error' : undefined}
        />

        {/* Success Icon */}
        {hasValue && !error && (
          <div className='absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none'>
            <MdCheckCircle className='h-5 w-5 text-green-500' />
          </div>
        )}

        {/* Error Icon */}
        {error && (
          <div className='absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none'>
            <MdError className='h-5 w-5 text-red-500' />
          </div>
        )}
      </div>

      {/* Helper Text */}
      {!error && (
        <p className='text-xs text-gray-500 mt-1'>
          Format: 9 digits + V/X (e.g., 123456789V) or 12 digits (e.g.,
          200012345678)
        </p>
      )}

      {/* Error Message */}
      {error && (
        <p
          id='nic-error'
          className='text-sm text-red-600 mt-1 flex items-center'
          role='alert'
        >
          <MdError className='h-4 w-4 mr-1' />
          {error.message}
        </p>
      )}
    </div>
  );
}

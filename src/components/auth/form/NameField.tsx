'use client';

import { UseFormRegister, FieldValues, Path } from 'react-hook-form';

// Icons
import { MdPerson, MdCheck } from 'react-icons/md';
import { FaExclamationTriangle } from 'react-icons/fa';

interface NameFieldProps<T extends FieldValues> {
  register: UseFormRegister<T>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error?: any;
  value?: string;
  placeholder?: string;
  label?: string;
}

export default function NameField<T extends FieldValues>({
  register,
  error,
  value,
  placeholder = 'Enter your full name',
  label = 'Full Name',
}: NameFieldProps<T>) {
  return (
    <div>
      <label
        htmlFor='name'
        className='block text-sm font-medium text-gray-700 mb-2'
      >
        {label}
      </label>
      <div className='relative'>
        <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
          <MdPerson className='h-5 w-5 text-gray-400' />
        </div>
        <input
          id='name'
          type='text'
          autoComplete='name'
          className={`block w-full pl-10 pr-3 py-3 border rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
            error
              ? 'border-red-300 bg-red-50'
              : 'border-gray-300 focus:border-blue-500'
          }`}
          placeholder={placeholder}
          suppressHydrationWarning
          {...register('name' as Path<T>)}
        />
        {!error && value && (
          <div className='absolute inset-y-0 right-0 pr-3 flex items-center'>
            <MdCheck className='h-5 w-5 text-green-500' />
          </div>
        )}
      </div>
      {error && (
        <p className='mt-1 text-sm text-red-600 flex items-center'>
          <FaExclamationTriangle className='mr-1 text-xs' />
          {error.message}
        </p>
      )}
    </div>
  );
}

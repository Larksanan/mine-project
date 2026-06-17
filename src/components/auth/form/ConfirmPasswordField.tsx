'use client';

import { useState } from 'react';
import { UseFormRegister, FieldValues, Path } from 'react-hook-form';

// Icons
import { MdPassword, MdCheck } from 'react-icons/md';
import { FaExclamationTriangle, FaEye, FaEyeSlash } from 'react-icons/fa';

interface ConfirmPasswordFieldProps<T extends FieldValues> {
  register: UseFormRegister<T>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error?: any;
  value?: string;
  passwordValue?: string;
  placeholder?: string;
  label?: string;
}

export default function ConfirmPasswordField<T extends FieldValues>({
  register,
  error,
  value,
  passwordValue,
  placeholder = 'Confirm your password',
  label = 'Confirm Password',
}: ConfirmPasswordFieldProps<T>) {
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <div>
      <label
        htmlFor='confirmPassword'
        className='block text-sm font-medium text-gray-700 mb-2'
      >
        {label}
      </label>
      <div className='relative'>
        <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
          <MdPassword className='h-5 w-5 text-gray-400' />
        </div>
        <input
          id='confirmPassword'
          type={showConfirmPassword ? 'text' : 'password'}
          autoComplete='new-password'
          className={`block w-full pl-10 pr-10 py-3 border rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
            error
              ? 'border-red-300 bg-red-50'
              : 'border-gray-300 focus:border-blue-500'
          }`}
          placeholder={placeholder}
          suppressHydrationWarning
          {...register('confirmPassword' as Path<T>)}
        />
        <button
          type='button'
          className='absolute inset-y-0 right-0 pr-3 flex items-center'
          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
        >
          {showConfirmPassword ? (
            <FaEyeSlash className='h-5 w-5 text-gray-400 hover:text-gray-600' />
          ) : (
            <FaEye className='h-5 w-5 text-gray-400 hover:text-gray-600' />
          )}
        </button>
        {!error && value && value === passwordValue && (
          <div className='absolute inset-y-0 right-8 pr-3 flex items-center'>
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

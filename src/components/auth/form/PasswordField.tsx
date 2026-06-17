'use client';

import { useState } from 'react';
import { UseFormRegister, FieldValues, Path } from 'react-hook-form';
import { MdPassword } from 'react-icons/md';
import { FaExclamationTriangle, FaEye, FaEyeSlash } from 'react-icons/fa';
import PasswordStrengthIndicator from './PasswordStrengthIndicator';
import Link from 'next/link';

interface PasswordFieldProps<T extends FieldValues> {
  register: UseFormRegister<T>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error?: any;
  value?: string;
  placeholder?: string;
  label?: string;
  showForgotPassword?: boolean;
  showStrengthIndicator?: boolean;
}

export default function PasswordField<T extends FieldValues>({
  register,
  error,
  value,
  placeholder = 'Enter your password',
  label = 'Password',
  showForgotPassword = true,
  showStrengthIndicator = false,
}: PasswordFieldProps<T>) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div>
      <div className='flex items-center justify-between mb-2'>
        <label
          htmlFor='password'
          className='block text-sm font-medium text-gray-700'
        >
          {label}
        </label>
        {showForgotPassword && (
          <Link
            href='/auth/forgot-password'
            className='text-sm text-blue-600 hover:text-blue-500 transition-colors'
          >
            Forgot password?
          </Link>
        )}
      </div>
      <div className='relative'>
        <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
          <MdPassword className='h-5 w-5 text-gray-400' />
        </div>
        <input
          id='password'
          type={showPassword ? 'text' : 'password'}
          autoComplete={
            showStrengthIndicator ? 'new-password' : 'current-password'
          }
          className={`block w-full pl-10 pr-10 py-3 border rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
            error
              ? 'border-red-300 bg-red-50'
              : 'border-gray-300 focus:border-blue-500'
          }`}
          placeholder={placeholder}
          suppressHydrationWarning
          {...register('password' as Path<T>)}
        />
        <button
          type='button'
          className='absolute inset-y-0 right-0 pr-3 flex items-center'
          onClick={() => setShowPassword(!showPassword)}
        >
          {showPassword ? (
            <FaEyeSlash className='h-5 w-5 text-gray-400 hover:text-gray-600' />
          ) : (
            <FaEye className='h-5 w-5 text-gray-400 hover:text-gray-600' />
          )}
        </button>
      </div>

      {/* Password Strength Indicator (for signup) */}
      {showStrengthIndicator && value && (
        <PasswordStrengthIndicator password={value} />
      )}

      {error && (
        <p className='mt-1 text-sm text-red-600 flex items-center'>
          <FaExclamationTriangle className='mr-1 text-xs' />
          {error.message}
        </p>
      )}
    </div>
  );
}

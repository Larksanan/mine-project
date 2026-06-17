'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MdArrowBack, MdError, MdPassword } from 'react-icons/md';
import { FaShieldAlt, FaEye, FaEyeSlash } from 'react-icons/fa';

// Components
import AuthHeader from './AuthHeader';
import SubmitButton from './form/SubmitButton';

interface ResetPasswordFormProps {
  loading: boolean;
  error: string;
  tokenValid: boolean;
  onSubmit: (password: string, confirmPassword: string) => void;
}

export default function ResetPasswordForm({
  loading,
  error,
  tokenValid,
  onSubmit,
}: ResetPasswordFormProps) {
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [localError, setLocalError] = useState('');

  const validateForm = (): string => {
    if (formData.password.length < 6) {
      return 'Password must be at least 6 characters long';
    }

    if (formData.password !== formData.confirmPassword) {
      return 'Passwords do not match';
    }

    return '';
  };

  // eslint-disable-next-line no-undef
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    const validationError = validateForm();
    if (validationError) {
      setLocalError(validationError);
      return;
    }

    onSubmit(formData.password, formData.confirmPassword);
  };

  // eslint-disable-next-line no-undef
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    // Clear local error when user starts typing
    if (localError) {
      setLocalError('');
    }
  };

  const displayError = localError || error;

  return (
    <>
      {/* Back Button */}
      <Link
        href='/auth/signin'
        className='inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6'
      >
        <MdArrowBack className='mr-2' />
        Back to sign in
      </Link>

      {/* Card */}
      <div className='bg-white rounded-2xl shadow-xl p-8 space-y-8 border border-gray-100'>
        {/* Header */}
        <div className='text-center'>
          <div className='mx-auto h-16 w-16 bg-linear-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg mb-4'>
            <FaShieldAlt className='text-xl text-white' />
          </div>
          <AuthHeader
            title='Set new password'
            subtitle='Create a new password for your account'
            showLogo={false}
          />
        </div>

        {/* Error Message */}
        {displayError && (
          <div className='rounded-lg bg-red-50 p-4 border border-red-200 flex items-start space-x-3'>
            <MdError className='text-red-500 mt-0.5 shrink-0' />
            <p className='text-red-800 text-sm'>{displayError}</p>
          </div>
        )}

        {/* Form */}
        <form className='space-y-6' onSubmit={handleSubmit}>
          {/* New Password */}
          <div>
            <label
              htmlFor='password'
              className='block text-sm font-medium text-gray-700 mb-2'
            >
              New Password
            </label>
            <div className='relative'>
              <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                <MdPassword className='h-5 w-5 text-gray-400' />
              </div>
              <input
                id='password'
                name='password'
                type={showPassword ? 'text' : 'password'}
                autoComplete='new-password'
                required
                value={formData.password}
                onChange={handleChange}
                className={`block w-full pl-10 pr-10 py-3 border rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                  localError
                    ? 'border-red-300 bg-red-50'
                    : 'border-gray-300 focus:border-blue-500'
                }`}
                placeholder='Enter new password'
                suppressHydrationWarning
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
            <p className='mt-1 text-xs text-gray-500'>
              Must be at least 6 characters long
            </p>
          </div>

          {/* Confirm Password */}
          <div>
            <label
              htmlFor='confirmPassword'
              className='block text-sm font-medium text-gray-700 mb-2'
            >
              Confirm New Password
            </label>
            <div className='relative'>
              <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                <MdPassword className='h-5 w-5 text-gray-400' />
              </div>
              <input
                id='confirmPassword'
                name='confirmPassword'
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete='new-password'
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`block w-full pl-10 pr-10 py-3 border rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                  localError
                    ? 'border-red-300 bg-red-50'
                    : 'border-gray-300 focus:border-blue-500'
                }`}
                placeholder='Confirm new password'
                suppressHydrationWarning
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
            </div>
          </div>

          <SubmitButton
            loading={loading}
            disabled={loading || !tokenValid}
            loadingText='Resetting password...'
            defaultText='Reset password'
            buttonType='default'
            gradient='from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700'
          />
        </form>
      </div>
    </>
  );
}

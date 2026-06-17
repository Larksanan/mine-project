/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import Link from 'next/link';
import { UseFormRegister, FieldErrors } from 'react-hook-form';
import { MdArrowBack, MdError } from 'react-icons/md';
import { FaExclamationTriangle, FaShieldAlt } from 'react-icons/fa';
import { FcUnlock } from 'react-icons/fc';

// Components
import AuthHeader from './AuthHeader';
import EmailField from './form/EmailField';
import SubmitButton from './form/SubmitButton';

interface ForgotPasswordFormProps {
  register: UseFormRegister<any>;
  errors: FieldErrors<any>;
  loading: boolean;
  isDirty: boolean;
  isValid: boolean;
  watchEmail: string;
  onSubmit: () => void;
}

export default function ForgotPasswordForm({
  register,
  errors,
  loading,
  isDirty,
  isValid,
  watchEmail,
  onSubmit,
}: ForgotPasswordFormProps) {
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
          <div className='flex justify-center mb-4'>
            <AuthHeader
              title='Reset your password'
              subtitle="Enter your email address and we'll send you a link to reset your password"
            />
          </div>
          <div className='mx-auto h-16 w-16 bg-linear-to-r from-orange-500 to-red-600 rounded-full flex items-center justify-center shadow-lg mb-4'>
            <FaShieldAlt className='text-xl text-white' />
          </div>
        </div>

        {/* Warning Message */}
        <div className='rounded-lg bg-yellow-50 p-4 border border-yellow-200 flex items-start space-x-3'>
          <FaExclamationTriangle className='text-yellow-500 mt-0.5 shrink-0' />
          <p className='text-yellow-800 text-sm'>
            You will receive an email with a password reset link. This link will
            expire in 1 hour.
          </p>
        </div>

        {/* Form */}
        <form className='space-y-6' onSubmit={onSubmit} noValidate>
          {/* Email Field */}
          <EmailField
            register={register}
            error={errors.email}
            value={watchEmail}
            placeholder='Enter your email address'
          />

          {/* Root Error Message */}
          {errors.root && (
            <div className='rounded-lg bg-red-50 p-4 border border-red-200 flex items-start space-x-3'>
              <MdError className='text-red-500 mt-0.5 shrink-0' />
              <p className='text-red-800 text-sm'>{errors.root.message}</p>
            </div>
          )}

          {/* Submit Button */}
          <SubmitButton
            loading={loading}
            disabled={loading || !isDirty || !isValid}
            loadingText='Sending reset link...'
            defaultText='Send reset link'
            buttonType='default'
            gradient='from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700'
            icon={<FcUnlock className='mr-2' />}
          />

          {/* Help Text */}
          <div className='text-center'>
            <p className='text-sm text-gray-600'>
              Remember your password?{' '}
              <Link
                href='/auth/signin'
                className='font-medium text-blue-600 hover:text-blue-500 transition-colors'
              >
                Back to sign in
              </Link>
            </p>
          </div>
        </form>
      </div>
    </>
  );
}

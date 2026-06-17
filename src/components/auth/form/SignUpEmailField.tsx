import { UseFormRegister } from 'react-hook-form';
import { MdEmail, MdCheck } from 'react-icons/md';
import { FaExclamationTriangle } from 'react-icons/fa';
import { SignUpFormData } from '@/app/auth/signup/SignUpClient';

interface SignUpEmailFieldProps {
  register: UseFormRegister<SignUpFormData>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error?: any;
  value?: string;
}

export default function SignUpEmailField({
  register,
  error,
  value,
}: SignUpEmailFieldProps) {
  return (
    <div>
      <label
        htmlFor='email'
        className='block text-sm font-medium text-gray-700 mb-2'
      >
        Email Address
      </label>
      <div className='relative'>
        <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
          <MdEmail className='h-5 w-5 text-gray-400' />
        </div>
        <input
          id='email'
          type='email'
          autoComplete='email'
          className={`block w-full pl-10 pr-3 py-3 border rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
            error
              ? 'border-red-300 bg-red-50'
              : 'border-gray-300 focus:border-blue-500'
          }`}
          placeholder='Enter your email address'
          suppressHydrationWarning
          {...register('email')}
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

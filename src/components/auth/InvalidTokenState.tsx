import Link from 'next/link';
import { MdArrowBack, MdError } from 'react-icons/md';

interface InvalidTokenStateProps {
  error: string;
}

export default function InvalidTokenState({ error }: InvalidTokenStateProps) {
  return (
    <div className='min-h-screen bg-linear-to-br from-red-50 to-orange-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8'>
      <div className='max-w-md w-full'>
        <Link
          href='/auth/signin'
          className='inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6'
        >
          <MdArrowBack className='mr-2' />
          Back to sign in
        </Link>

        <div className='bg-white rounded-2xl shadow-xl p-8 text-center border border-gray-100'>
          <div className='mx-auto h-20 w-20 bg-red-100 rounded-full flex items-center justify-center mb-6'>
            <MdError className='text-4xl text-red-600' />
          </div>

          <h2 className='text-2xl font-bold text-gray-900 mb-4'>
            Invalid Reset Link
          </h2>

          <p className='text-gray-600 mb-6'>
            {error || 'This password reset link is invalid or has expired.'}
          </p>

          <Link
            href='/auth/forgot-password'
            className='inline-flex items-center justify-center w-full py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-linear-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 transition-all duration-200'
          >
            Request New Reset Link
          </Link>
        </div>
      </div>
    </div>
  );
}

import Link from 'next/link';
import { MdArrowBack, MdCheckCircle } from 'react-icons/md';

interface SuccessStateProps {
  email: string;
}

export default function SuccessState({ email }: SuccessStateProps) {
  return (
    <div className='min-h-screen bg-linear-to-br from-green-50 to-blue-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8'>
      <div className='max-w-md w-full'>
        <Link
          href='/auth/signin'
          className='inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6'
        >
          <MdArrowBack className='mr-2' />
          Back to sign in
        </Link>

        <div className='bg-white rounded-2xl shadow-xl p-8 text-center border border-gray-100'>
          <div className='mx-auto h-20 w-20 bg-green-100 rounded-full flex items-center justify-center mb-6'>
            <MdCheckCircle className='text-4xl text-green-600' />
          </div>

          <h2 className='text-2xl font-bold text-gray-900 mb-4'>
            Check your email
          </h2>

          <p className='text-gray-600 mb-2'>
            We&apos;ve sent a password reset link to:
          </p>
          <p className='text-gray-900 font-medium mb-6'>{email}</p>

          <p className='text-sm text-gray-500 mb-6'>
            The link will expire in 1 hour. If you don&apos;t see the email,
            check your spam folder.
          </p>

          <div className='mt-6'>
            <Link
              href='/auth/signin'
              className='inline-flex items-center justify-center w-full py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-200'
            >
              Return to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

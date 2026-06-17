'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function AuthErrorClient() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case 'AccessDenied':
        return 'Access denied. You do not have permission to sign in.';
      case 'Configuration':
        return 'There is a problem with the server configuration.';
      case 'Verification':
        return 'The verification token has expired or has already been used.';
      default:
        return 'An unexpected error occurred during authentication.';
    }
  };

  return (
    <div className='min-h-screen flex items-center justify-center py-12 px-4'>
      <div className='max-w-md w-full space-y-8 text-center'>
        <h2 className='text-3xl font-extrabold text-gray-900'>
          Authentication Error
        </h2>

        <div className='bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded'>
          <p className='font-medium'>{getErrorMessage(error)}</p>
        </div>

        <div className='space-y-3'>
          <Link
            href='/auth/signin'
            className='block px-4 py-2 rounded-md text-white bg-blue-600 hover:bg-blue-700'
          >
            Return to Sign In
          </Link>

          <Link href='/' className='block text-blue-600 hover:text-blue-500'>
            Go back home
          </Link>
        </div>
      </div>
    </div>
  );
}

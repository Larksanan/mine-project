'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Unauthorized() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    if (status === 'loading') return;

    // Redirect authenticated users to their appropriate dashboard
    if (session?.user) {
      const timer = setTimeout(() => {
        switch (session.user.role) {
          case 'DOCTOR':
            router.push('/dashboar/doctor');
            break;
          case 'PATIENT':
            router.push('/dashboard/patient');
            break;
          case 'ADMIN':
            router.push('/dashboard/admin');
            break;
          default:
            router.push('/');
        }
      }, 10000);

      const countdownInterval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        clearTimeout(timer);
        clearInterval(countdownInterval);
      };
    }
  }, [session, status, router]);

  const handleQuickRedirect = (path: string) => {
    router.push(path);
  };

  if (status === 'loading') {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4 sm:px-6 lg:px-8'>
      <div className='max-w-md w-full space-y-8'>
        <div className='bg-white rounded-2xl shadow-xl p-8 sm:p-10'>
          {/* Icon */}
          <div className='flex justify-center'>
            <div className='w-20 h-20 bg-red-100 rounded-full flex items-center justify-center'>
              <svg
                className='w-10 h-10 text-red-600'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
                xmlns='http://www.w3.org/2000/svg'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z'
                />
              </svg>
            </div>
          </div>

          {/* Content */}
          <div className='text-center mt-6'>
            <h1 className='text-3xl font-bold text-gray-900'>Access Denied</h1>
            <p className='mt-4 text-lg text-gray-600'>
              You don&apos;t have permission to access this page.
            </p>

            {session?.user ? (
              <div className='mt-6'>
                <p className='text-sm text-gray-500 mb-4'>
                  Redirecting to your dashboard in{' '}
                  <span className='font-semibold text-blue-600'>
                    {countdown}
                  </span>{' '}
                  seconds...
                </p>

                <div className='space-y-3'>
                  <p className='text-sm font-medium text-gray-700'>
                    Quick redirect:
                  </p>
                  <div className='flex flex-col sm:flex-row gap-3 justify-center'>
                    {session.user.role === 'DOCTOR' && (
                      <button
                        onClick={() => handleQuickRedirect('/doctor/dashboard')}
                        className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                      >
                        Doctor Dashboard
                      </button>
                    )}
                    {session.user.role === 'PATIENT' && (
                      <button
                        onClick={() =>
                          handleQuickRedirect('/patient/dashboard')
                        }
                        className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500'
                      >
                        Patient Dashboard
                      </button>
                    )}
                    {session.user.role === 'ADMIN' && (
                      <button
                        onClick={() => handleQuickRedirect('/admin/dashboard')}
                        className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500'
                      >
                        Admin Dashboard
                      </button>
                    )}
                    <button
                      onClick={() => handleQuickRedirect('/')}
                      className='inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                    >
                      Home Page
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className='mt-6'>
                <p className='text-sm text-gray-500 mb-4'>
                  Please log in with an account that has the required
                  permissions.
                </p>
                <div className='space-y-3'>
                  <Link
                    href='/login'
                    className='w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                  >
                    Sign In
                  </Link>
                  <Link
                    href='/'
                    className='w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                  >
                    Go Home
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Additional Help */}
          <div className='mt-8 pt-6 border-t border-gray-200'>
            <div className='text-center'>
              <p className='text-sm text-gray-500'>
                Need help?{' '}
                <Link
                  href='/contact'
                  className='font-medium text-blue-600 hover:text-blue-500'
                >
                  Contact support
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Role Information */}
        {!session?.user && (
          <div className='bg-white rounded-2xl shadow-xl p-6'>
            <h3 className='text-lg font-medium text-gray-900 mb-4'>
              Available Roles
            </h3>
            <div className='space-y-4'>
              <div className='flex items-start space-x-3'>
                <div className='shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center'>
                  <svg
                    className='w-3 h-3 text-blue-600'
                    fill='currentColor'
                    viewBox='0 0 20 20'
                  >
                    <path
                      fillRule='evenodd'
                      d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                      clipRule='evenodd'
                    />
                  </svg>
                </div>
                <div>
                  <p className='font-medium text-gray-900'>Doctor</p>
                  <p className='text-sm text-gray-600'>
                    Access to patient records, appointments, and medical tools
                  </p>
                </div>
              </div>
              <div className='flex items-start space-x-3'>
                <div className='shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center'>
                  <svg
                    className='w-3 h-3 text-green-600'
                    fill='currentColor'
                    viewBox='0 0 20 20'
                  >
                    <path
                      fillRule='evenodd'
                      d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                      clipRule='evenodd'
                    />
                  </svg>
                </div>
                <div>
                  <p className='font-medium text-gray-900'>Patient</p>
                  <p className='text-sm text-gray-600'>
                    Access to personal health records and appointment scheduling
                  </p>
                </div>
              </div>
              <div className='flex items-start space-x-3'>
                <div className='shrink-0 w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center'>
                  <svg
                    className='w-3 h-3 text-purple-600'
                    fill='currentColor'
                    viewBox='0 0 20 20'
                  >
                    <path
                      fillRule='evenodd'
                      d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                      clipRule='evenodd'
                    />
                  </svg>
                </div>
                <div>
                  <p className='font-medium text-gray-900'>Administrator</p>
                  <p className='text-sm text-gray-600'>
                    Full system access and user management
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

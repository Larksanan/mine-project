import Link from 'next/link';
import { MdCheckCircle } from 'react-icons/md';

export default function SuccessState() {
  return (
    <div className='min-h-screen bg-linear-to-br from-green-50 to-blue-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8'>
      <div className='max-w-md w-full'>
        <div className='bg-white rounded-2xl shadow-xl p-8 text-center border border-gray-100'>
          <div className='mx-auto h-20 w-20 bg-green-100 rounded-full flex items-center justify-center mb-6'>
            <MdCheckCircle className='text-4xl text-green-600' />
          </div>

          <h2 className='text-2xl font-bold text-gray-900 mb-4'>
            Password reset successfully!
          </h2>

          <p className='text-gray-600 mb-6'>
            Your password has been updated successfully. You can now sign in
            with your new password.
          </p>

          <div className='bg-green-50 rounded-lg p-4 border border-green-200 mb-6'>
            <p className='text-sm text-green-800'>
              Redirecting to sign in page in 3 seconds...
            </p>
          </div>

          <Link
            href='/auth/signin'
            className='inline-flex items-center justify-center w-full py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-200'
          >
            Go to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}

import Link from 'next/link';

export default function TermsAndPrivacy() {
  return (
    <div className='text-center'>
      <p className='text-xs text-gray-500'>
        By creating an account, you agree to our{' '}
        <Link
          href='/terms'
          className='text-blue-600 hover:text-blue-500 transition-colors'
        >
          Terms of Service
        </Link>{' '}
        and{' '}
        <Link
          href='/privacy'
          className='text-blue-600 hover:text-blue-500 transition-colors'
        >
          Privacy Policy
        </Link>
      </p>
    </div>
  );
}

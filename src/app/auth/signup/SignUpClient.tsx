'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { z } from 'zod';

import AuthLayout from '@/components/auth/AuthLayout';
import AuthHeader from '@/components/auth/AuthHeader';
import OAuthButtons from '@/components/auth/OAuthButtons';
import AuthDivider from '@/components/auth/AuthDivider';
import SignUpForm from '@/components/auth/SignUpForm';
import StatusMessage from '@/components/ui/StatusMessage';
import Loading from '@/components/Loading';
import TermsAndPrivacy from '@/components/auth/TermsAndPrivacy';

export const signupSchema = z
  .object({
    name: z
      .string()
      .min(2, 'Name must be at least 2 characters')
      .max(50, 'Name must be less than 50 characters')
      .regex(/^[a-zA-Z\s]*$/, 'Name can only contain letters and spaces'),
    email: z
      .string()
      .email('Please enter a valid email address')
      .min(1, 'Email is required'),
    nic: z
      .string()
      .min(1, 'NIC is required')
      .regex(
        /^([0-9]{9}[vVxX]|[0-9]{12})$/,
        'NIC must be either 9 digits followed by V/X or 12 digits'
      ),
    password: z
      .string()
      .min(6, 'Password must be at least 6 characters')
      .max(100, 'Password is too long')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(
        /[^A-Za-z0-9]/,
        'Password must contain at least one special character'
      ),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type SignUpFormData = z.infer<typeof signupSchema>;

export default function SignUpClient() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [isMounted, setIsMounted] = useState(false);

  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  const message = searchParams.get('message');
  const oauthError = searchParams.get('error');

  useEffect(() => {
    const id = requestAnimationFrame(() => setIsMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    if (message) setSuccess(message);
    // eslint-disable-next-line react-hooks/immutability
    if (oauthError) setError(getOAuthErrorMessage(oauthError));
  }, [message, oauthError]);

  const getOAuthErrorMessage = (error: string) => {
    switch (error) {
      case 'OAuthSignin':
        return 'Error occurred during OAuth sign in. Please try again.';
      case 'OAuthCallback':
        return 'Error occurred during OAuth callback. Please try again.';
      case 'OAuthCreateAccount':
        return 'Could not create OAuth account. Please try again.';
      case 'OAuthAccountNotLinked':
        return 'This email is already associated with another account. Please sign in with your original provider.';
      case 'EmailSignin':
        return 'Error occurred during email sign in. Please check your email.';
      case 'CredentialsSignin':
        return 'Invalid email or password. Please try again.';
      case 'SessionRequired':
        return 'Please sign in to access this page.';
      case 'AccountDisabled':
        return 'Your account has been disabled. Please contact support.';
      case 'Configuration':
        return 'There is a problem with the server configuration.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  };

  const handleOAuthSignUp = async (provider: 'google' | 'github') => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await signIn(provider, {
        callbackUrl,
        redirect: true,
      });
    } catch (err) {
      console.error(`${provider} sign in error:`, err);
      setError(`Failed to sign in with ${provider}. Please try again.`);
      setLoading(false);
    }
  };

  const handleSignUpSuccess = (message: string) => {
    setSuccess(message);
    setError('');
  };

  const handleSignUpError = (errorMessage: string) => {
    setError(errorMessage);
    setSuccess('');
  };

  if (!isMounted) return <Loading />;

  return (
    <AuthLayout gradient='from-purple-50 to-blue-100'>
      <Link
        href='/'
        className='inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6 transition-colors duration-200'
      >
        <BackIcon className='mr-2' />
        Back to home
      </Link>

      <div className='bg-white rounded-2xl shadow-xl p-8 space-y-8 border border-gray-100'>
        <AuthHeader
          title='Join with us today'
          subtitle='Create your account to get started'
        />

        {error && <StatusMessage type='error' message={error} />}
        {success && <StatusMessage type='success' message={success} />}

        <OAuthButtons
          onGoogleSignIn={() => handleOAuthSignUp('google')}
          onGithubSignIn={() => handleOAuthSignUp('github')}
          loading={loading}
        />

        <AuthDivider />

        <SignUpForm
          onSuccess={handleSignUpSuccess}
          onError={handleSignUpError}
          onLoadingChange={setLoading}
        />

        <div className='text-center'>
          <p className='text-sm text-gray-600'>
            Already have an account?{' '}
            <Link
              href='/auth/signin'
              className='font-medium text-blue-600 hover:text-blue-500 transition-colors duration-200'
            >
              Sign in here
            </Link>
          </p>
        </div>

        <TermsAndPrivacy />
      </div>
    </AuthLayout>
  );
}

// Simple icon component
const BackIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill='none'
    stroke='currentColor'
    viewBox='0 0 24 24'
    width='16'
    height='16'
  >
    <path
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeWidth={2}
      d='M10 19l-7-7m0 0l7-7m-7 7h18'
    />
  </svg>
);

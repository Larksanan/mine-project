'use client';

import { useAuth } from '@/hooks/useAuth';
import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { z } from 'zod';

// Components
import AuthLayout from '@/components/auth/AuthLayout';
import OAuthButtons from '@/components/auth/OAuthButtons';
import SignInForm from '@/components/auth/SignInForm';
import StatusMessage from '@/components/ui/StatusMessage';
import AuthHeader from '@/components/auth/AuthHeader';
import AuthDivider from '@/components/auth/AuthDivider';

// Validation schema
const _signInSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export type SignInFormData = z.infer<typeof _signInSchema>;

export default function SignInClient() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const searchParams = useSearchParams();
  const router = useRouter();

  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  const error = searchParams.get('error');
  const message = searchParams.get('message');

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push(callbackUrl);
    }
  }, [user, callbackUrl, router]);

  // Show success message from query param
  useEffect(() => {
    if (message) {
      setSuccess(message);
    }
  }, [message]);

  const getErrorMessage = (error: string) => {
    switch (error) {
      case 'OAuthAccountNotLinked':
        return 'This email is already associated with another account.';
      case 'CredentialsSignin':
        return 'Invalid email or password.';
      case 'Configuration':
        return 'Server configuration error.';
      case 'AccessDenied':
        return 'Access denied.';
      case 'Verification':
        return 'Verification required. Check your email.';
      default:
        return 'An error occurred during sign in.';
    }
  };

  const handleSignIn = async (data: SignInFormData) => {
    setLoading(true);
    setSuccess('');

    try {
      const result = await signIn('credentials', {
        email: data.email.toLowerCase(),
        password: data.password,
        redirect: false,
        callbackUrl,
      });

      if (result?.error) {
        throw new Error(getErrorMessage(result.error));
      }

      setSuccess('Sign in successful! Redirecting...');
      setTimeout(() => router.push(callbackUrl), 1000);
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthSignIn = async (provider: 'google' | 'github') => {
    setSuccess('');
    await signIn(provider, { callbackUrl });
  };

  return (
    <AuthLayout>
      {/* Back button */}
      <Link
        href='/'
        className='inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6'
      >
        <BackIcon className='mr-2' />
        Back to home
      </Link>

      {/* Card */}
      <div className='bg-white rounded-2xl shadow-xl p-8 space-y-8'>
        <AuthHeader
          title='Log in or sign up'
          subtitle='You can connect with us'
        />

        {error && (
          <StatusMessage type='error' message={getErrorMessage(error)} />
        )}

        {success && <StatusMessage type='success' message={success} />}

        <OAuthButtons
          onGoogleSignIn={() => handleOAuthSignIn('google')}
          onGithubSignIn={() => handleOAuthSignIn('github')}
          loading={loading}
        />

        <AuthDivider />

        <SignInForm onSubmit={handleSignIn} loading={loading} />
      </div>
    </AuthLayout>
  );
}

// Back icon
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

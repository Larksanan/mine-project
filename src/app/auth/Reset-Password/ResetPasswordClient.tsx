'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import AuthLayout from '@/components/auth/AuthLayout';
import ResetPasswordForm from '@/components/auth/ResetPasswordForm';
import InvalidTokenState from '@/components/auth/InvalidTokenState';
import SuccessState from '@/components/auth/ResetPasswordSuccess';

export default function ResetPasswordClient() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [token, setToken] = useState('');
  const [tokenValid, setTokenValid] = useState<boolean>(false);

  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setError('Invalid or missing reset token');
      setTokenValid(false);
      return;
    }

    setToken(token);
    validateToken(token);
  }, [searchParams]);

  const validateToken = async (token: string) => {
    try {
      const response = await fetch(`/api/auth/reset-password?token=${token}`);
      const data = await response.json();

      if (data.valid) {
        setTokenValid(true);
      } else {
        setTokenValid(false);
        setError(data.error || 'Invalid or expired reset token');
      }
    } catch {
      setTokenValid(false);
      setError('Failed to validate token');
    }
  };

  const handleResetPassword = async (password: string) => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setSuccess(true);
      setTimeout(() => router.push('/auth/signin'), 3000);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  if (!tokenValid && error) return <InvalidTokenState error={error} />;
  if (success) return <SuccessState />;

  return (
    <AuthLayout gradient='from-blue-50 to-indigo-100'>
      <ResetPasswordForm
        loading={loading}
        error={error}
        tokenValid={tokenValid}
        onSubmit={handleResetPassword}
      />
    </AuthLayout>
  );
}

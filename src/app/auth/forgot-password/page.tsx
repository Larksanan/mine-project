/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Components
import AuthLayout from '@/components/auth/AuthLayout';
import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm';
import SuccessState from '@/components/auth/ForgotPasswordSuccess';
import LoadingSkeleton from '@/components/auth/LoadingSkeleton';

// Validation schema
const forgotPasswordSchema = z.object({
  email: z
    .string()
    .email('Please enter a valid email address')
    .min(1, 'Email is required'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // React Hook Form
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isDirty, isValid },
    setError,
    clearErrors,
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: 'onChange',
    defaultValues: {
      email: '',
    },
  });

  const watchEmail = watch('email');

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setLoading(true);
    clearErrors();

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: data.email.toLowerCase() }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send reset email');
      }

      setSuccess(true);
    } catch (err: any) {
      setError('root', {
        type: 'manual',
        message: err.message || 'Failed to send reset email. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  // Show loading skeleton during SSR
  if (!isMounted) {
    return <LoadingSkeleton />;
  }

  if (success) {
    return <SuccessState email={watchEmail} />;
  }

  return (
    <AuthLayout gradient='from-blue-50 to-indigo-100'>
      <ForgotPasswordForm
        register={register}
        errors={errors}
        loading={loading}
        isDirty={isDirty}
        isValid={isValid}
        watchEmail={watchEmail}
        onSubmit={handleSubmit(onSubmit)}
      />
    </AuthLayout>
  );
}

'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import EmailField from './form/EmailField';
import PasswordField from './form/PasswordField';
import SubmitButton from './form/SubmitButton';

const signInSchema = z.object({
  email: z
    .string()
    .email('Please enter a valid email address')
    .min(1, 'Email is required'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters'),
});

type SignInFormData = z.infer<typeof signInSchema>;

interface SignInFormProps {
  onSubmit: (data: SignInFormData) => Promise<void>;
  loading: boolean;
}

export default function SignInForm({ onSubmit, loading }: SignInFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty, isValid },
  } = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    mode: 'onChange',
    defaultValues: {
      email: '',
      password: '',
    },
  });

  return (
    <form className='space-y-6' onSubmit={handleSubmit(onSubmit)} noValidate>
      {/* Email Field */}
      <EmailField register={register} error={errors.email} />

      {/* Password Field */}
      <PasswordField register={register} error={errors.password} />

      {/* Submit Button */}
      <SubmitButton
        loading={loading}
        disabled={loading || !isDirty || !isValid}
        loadingText='sign in...'
        defaultText='sign in'
      />

      {/* Sign Up Link */}
      <div className='text-center'>
        <p className='text-sm text-gray-600'>
          Don&apos;t have an account?{' '}
          <Link
            href='/auth/signup'
            className='font-medium text-blue-600 hover:text-blue-500 transition-colors'
          >
            Sign up now
          </Link>
        </p>
      </div>
    </form>
  );
}

// src/app/auth/Reset-Password/page.tsx
import { Suspense } from 'react';
import ResetPasswordClient from './ResetPasswordClient';
import LoadingSkeleton from '@/components/auth/LoadingSkeleton';

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <ResetPasswordClient />
    </Suspense>
  );
}

import { Suspense } from 'react';
import AuthErrorClient from './AuthErrorClient';

export default function AuthErrorPage() {
  return (
    <Suspense fallback={<p className='text-center'>Loading...</p>}>
      <AuthErrorClient />
    </Suspense>
  );
}

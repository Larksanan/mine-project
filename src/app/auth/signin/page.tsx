import { Suspense } from 'react';
import SignInClient from './SignInClient';
import Loading from '@/components/Loading';

export default function SignInPage() {
  return (
    <Suspense fallback={<Loading />}>
      <SignInClient />
    </Suspense>
  );
}

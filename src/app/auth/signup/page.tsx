import { Suspense } from 'react';
import SignUpClient from './SignUpClient';
import Loading from '@/components/Loading';

export default function SignUpPage() {
  return (
    <Suspense fallback={<Loading />}>
      <SignUpClient />
    </Suspense>
  );
}

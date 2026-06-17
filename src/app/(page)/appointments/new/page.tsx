import React, { Suspense } from 'react';
import Loading from '@/components/Loading';
import NewAppointmentForm from './NewAppointmentForm';

export default function NewAppointmentPage() {
  return (
    <Suspense fallback={<Loading />}>
      <NewAppointmentForm />
    </Suspense>
  );
}

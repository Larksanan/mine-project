/* eslint-disable no-undef */
import type { Metadata } from 'next';

import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar/Navbar';

export const metadata: Metadata = {
  title: 'doctors Management System',
  description:
    'Manage patient appointments, records, and front desk operations efficiently',
};

export default function PatientCareLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />

      <main className='flex-1  w-full pt-6 overflow-auto '>
        {children}

        <Footer />
      </main>
    </>
  );
}

/* eslint-disable no-undef */
import type { Metadata } from 'next';

import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar/Navbar';

export const metadata: Metadata = {
  title: 'appointments Management System',
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

      <div className='flex h-screen bg-gray-50'>
        <div className='flex-1 flex flex-col overflow-hidden pt-6'>
          <main className='flex-1 overflow-auto w-full pt-6  '>
            {children}

            <Footer />
          </main>
        </div>
      </div>
    </>
  );
}

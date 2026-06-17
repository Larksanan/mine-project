/* eslint-disable no-undef */
import type { Metadata } from 'next';
import Footer from '@/components/Footer';
import dynamic from 'next/dynamic';

const Navbar = dynamic(() => import('@/components/Navbar/Navbar'), {
  loading: () => <div className='h-16 bg-white shadow-sm animate-pulse' />,
});

export const metadata: Metadata = {
  title: 'Management System',
  description:
    'Manage patient appointments, records, and front desk operations efficiently',
};

export default function PatientCareLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className='min-h-screen flex flex-col'>
      <Navbar />
      <main className='flex-1 w-full bg-linear-to-br from-gray-50 to-gray-100'>
        {children}
      </main>
      <Footer />
    </div>
  );
}

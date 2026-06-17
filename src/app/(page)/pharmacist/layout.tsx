/* eslint-disable no-undef */
import type { Metadata } from 'next';
import Navbar from '@/components/Navbar/Navbar';

import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Pharmacy Management System',
  description:
    'Manage your pharmacy operations, inventory, and patient services efficiently',
};

export default function PharmacistLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <main className='flex-1 overflow-auto p-6'>
        {children}
        <Footer />
      </main>
    </>
  );
}

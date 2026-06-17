import React from 'react';

import Navbar from '@/components/Navbar/Navbar';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'Admin Dashboard - Healthcare System',
  description: 'Administrative dashboard for healthcare management system',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <div className='py-6'>
        <div className='mx-auto px-4 sm:px-6 md:px-8'>{children}</div>
      </div>
      <Footer />
    </>
  );
}

/* eslint-disable no-undef */
import type { Metadata } from 'next';

import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar/Navbar';
import AnimatedContainer from '@/animations/AnimatedContainer';

export const metadata: Metadata = {
  title: 'Patient Care Management System',
  description:
    'Patient management system to efficiently manage patient appointments, records, and front desk operations',
};

export default function PatientCareLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className='flex flex-col min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-indigo-50'>
      {/* Navbar */}
      <Navbar />

      {/* Main Content */}
      <main className='grow w-full'>
        <div className='max-w-7xl mx-auto px-2 sm:px-4 lg:px-2 py-4'>
          <AnimatedContainer>
            {/* Content Container */}
            <div className='bg-white/80 backdrop-blur-sm    border border-white/50'>
              {children}
            </div>
          </AnimatedContainer>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}

import type { Metadata } from 'next';
import type React from 'react';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar/Navbar';

export const metadata: Metadata = {
  title: 'Authentication - jebarsanthatcroos',
  description:
    'Sign in or create an account to access your jebarsanthatcroos dashboard and services.',
  keywords: 'authentication, sign in, sign up, login, register, account',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className='min-h-screen bg-linear-to-br from-blue-50 via-white to-indigo-50'>
      <Navbar />
      {children}
      <Footer />
    </div>
  );
}

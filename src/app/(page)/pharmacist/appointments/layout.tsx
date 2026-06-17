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
  // eslint-disable-next-line no-undef
  children: React.ReactNode;
}) {
  return (
    <div className='flex h-screen bg-gray-50'>
      <div className='flex-1 flex flex-col overflow-hidden'>
        <Navbar />
        <main className='flex-1 overflow-auto p-6'>
          {children}

          <Footer />
        </main>
      </div>
    </div>
  );
}

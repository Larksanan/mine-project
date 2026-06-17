import type { Metadata } from 'next';
import type React from 'react';
import { Providers } from '@/components/providers';
import { CartProvider } from '@/context/CartContext';
import './globals.css';

export const metadata: Metadata = {
  title: 'Eastern Central - HOSPITAL|LABOTATORY|PHARMACY',
  description:
    'Eastern Central is a comprehensive healthcare management system that integrates hospital, laboratory, and pharmacy services into one platform. It simplifies patient management, appointment booking, and service coordination, ensuring smooth workflows for medical staff and a convenient experience for patients. With centralized access to records, lab results, and prescriptions, the system enhances efficiency, reduces errors, and improves overall healthcare delivery.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='en'>
      <body>
        <Providers>
          <CartProvider>{children}</CartProvider>
        </Providers>
      </body>
    </html>
  );
}

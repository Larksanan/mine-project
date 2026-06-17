import { ReactNode } from 'react';

interface AuthLayoutProps {
  children: ReactNode;
  gradient?: string;
}

export default function AuthLayout({
  children,
  gradient = 'from-blue-50 to-indigo-100',
}: AuthLayoutProps) {
  return (
    <div
      className={`min-h-screen bg-linear-to-br ${gradient} flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8`}
    >
      <div className='max-w-md w-full'>{children}</div>
    </div>
  );
}

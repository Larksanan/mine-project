import Image from 'next/image';
import Link from 'next/link';
import { FaHeartbeat } from 'react-icons/fa';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showImage?: boolean;
  className?: string;
  variant?: 'health';
}

const LogoStatic = ({
  size = 'md',
  showImage = true,
  className = '',
  variant = 'health',
}: LogoProps) => {
  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl',
  };

  const iconSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl',
  };

  // Healthcare Brand Design
  const HealthLogo = () => (
    <div className='flex items-center space-x-3'>
      {/* Medical Icon with Pulse */}
      <div className='relative'>
        <div className='w-12 h-12 bg-linear-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg'>
          <FaHeartbeat className={`text-white ${iconSizes[size]}`} />
        </div>
        <div className='absolute -top-1 -right-1 w-5 h-5 bg-green-400 rounded-full border-2 border-white flex items-center justify-center'>
          <div className='w-1.5 h-1.5 bg-white rounded-full'></div>
        </div>
      </div>

      {/* Company Name */}
      <div className='flex flex-col'>
        <h1
          className={`font-bold ${sizeClasses[size]} bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent`}
        >
          Eastern Central
        </h1>
        <p className='text-xs text-blue-600 font-stretch-50%'>
          HOSPITAL|LABOTATORY|PHARMACY
        </p>
      </div>
    </div>
  );

  // Choose which logo variant to render
  const renderLogo = () => {
    switch (variant) {
      case 'health':
        return <HealthLogo />;
    }
  };

  return (
    <Link
      href='/'
      className='inline-block hover:opacity-90 transition-opacity duration-200'
    >
      <div className={className}>
        {renderLogo()}

        {/* Optional Profile Image */}
        {showImage && variant === 'health' && (
          <div className='absolute top-2 right-2'>
            <Image
              src='/Logo.jpg'
              alt='Jebarsan Thatcroos'
              width={32}
              height={32}
              className='rounded-full shadow-lg border-2 border-white'
              priority
            />
          </div>
        )}
      </div>
    </Link>
  );
};

export default LogoStatic;

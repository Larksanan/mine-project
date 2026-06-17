import Logo from '@/components/Logo.static';

interface AuthHeaderProps {
  title: string;
  subtitle: string;
  showLogo?: boolean;
}

export default function AuthHeader({
  title,
  subtitle,
  showLogo = true,
}: AuthHeaderProps) {
  return (
    <div className='text-center'>
      {showLogo && (
        <div className='flex justify-center mb-4'>
          <Logo />
        </div>
      )}
      <h2 className='text-3xl font-bold bg-linear-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent'>
        {title}
      </h2>
      <p className='mt-2 text-sm text-gray-600'>{subtitle}</p>
    </div>
  );
}

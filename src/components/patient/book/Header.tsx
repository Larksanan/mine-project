interface HeaderProps {
  title: string;
  description?: string;
}

export const Header = ({ title, description }: HeaderProps) => {
  return (
    <div className='mb-8'>
      <h1 className='text-3xl font-bold text-gray-900'>{title}</h1>
      {description && <p className='mt-2 text-gray-600'>{description}</p>}
    </div>
  );
};

interface ProductListHeaderProps {
  title?: string;
  subtitle?: string;
  description?: string;
  productCount: number;
}

export default function ProductListHeader({
  title = 'Products',
  subtitle = 'Pharmacy Products',
  description = 'Discover our range of high-quality pharmacy products and medications.',
  productCount,
}: ProductListHeaderProps) {
  return (
    <div className='text-center p-10'>
      <h1 className='font-bold text-5xl text-gray-800 mb-4'>{title}</h1>
      <h2 className='font-semibold text-3xl text-gray-600'>{subtitle}</h2>
      <p className='text-lg text-gray-500 mt-2'>{description}</p>

      <div className='mt-5 mb-8'>
        <p className='text-sm text-gray-600'>
          Showing {productCount} product{productCount !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  );
}

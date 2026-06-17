import { Product } from '@/types/product';

interface ProductSpecificationsProps {
  product: Product;
}

const ProductSpecifications = ({ product }: ProductSpecificationsProps) => {
  return (
    <div className='mt-16 bg-white rounded-xl shadow-sm p-6 md:p-8'>
      <h2 className='text-2xl font-bold text-gray-900 mb-6'>Specifications</h2>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        <div>
          <h3 className='font-medium text-gray-900 mb-3'>General</h3>
          <div className='space-y-2'>
            <div className='flex justify-between border-b pb-2'>
              <span className='text-gray-600'>Manufacturer</span>
              <span className='text-gray-900 font-medium'>
                {product.manufacturer}
              </span>
            </div>
            <div className='flex justify-between border-b pb-2'>
              <span className='text-gray-600'>SKU</span>
              <span className='text-gray-900 font-medium'>{product.sku}</span>
            </div>
            <div className='flex justify-between border-b pb-2'>
              <span className='text-gray-600'>Barcode</span>
              <span className='text-gray-900 font-medium'>
                {product.barcode || 'N/A'}
              </span>
            </div>
            <div className='flex justify-between border-b pb-2'>
              <span className='text-gray-600'>Category</span>
              <span className='text-gray-900 font-medium capitalize'>
                {product.category}
              </span>
            </div>
          </div>
        </div>

        <div>
          <h3 className='font-medium text-gray-900 mb-3'>
            Medical Information
          </h3>
          <div className='space-y-2'>
            <div className='flex justify-between border-b pb-2'>
              <span className='text-gray-600'>Prescription Required</span>
              <span
                className={`font-medium ${
                  product.requiresPrescription
                    ? 'text-red-600'
                    : 'text-green-600'
                }`}
              >
                {product.requiresPrescription ? 'Yes' : 'No'}
              </span>
            </div>
            <div className='flex justify-between border-b pb-2'>
              <span className='text-gray-600'>Controlled Substance</span>
              <span
                className={`font-medium ${
                  product.isControlledSubstance
                    ? 'text-red-600'
                    : 'text-green-600'
                }`}
              >
                {product.isControlledSubstance ? 'Yes' : 'No'}
              </span>
            </div>
            {product.activeIngredients && (
              <div className='flex justify-between border-b pb-2'>
                <span className='text-gray-600'>Active Ingredients</span>
                <span className='text-gray-900 font-medium text-right max-w-xs'>
                  {product.activeIngredients}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductSpecifications;

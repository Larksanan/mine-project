import Link from 'next/link';
import ProductCard from '@/components/shop/ProductCard';
import { Product } from '@/types/product';

interface RelatedProductsProps {
  products: Product[];
}

const RelatedProducts = ({ products }: RelatedProductsProps) => {
  return (
    <div className='mt-16'>
      <div className='flex flex-col items-center mb-10'>
        <h2 className='text-2xl font-bold text-gray-900 mb-2'>
          You May Also Like
        </h2>
        <div className='w-16 h-1 bg-blue-600 rounded-full'></div>
      </div>

      {products.length > 0 ? (
        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6'>
          {products.map(prod => {
            // Ensure the product has a valid image string for ProductCard
            const productImage = Array.isArray(prod.image)
              ? prod.image[0] || '/placeholder-medicine.jpg'
              : prod.image || '/placeholder-medicine.jpg';

            return (
              <ProductCard
                key={prod._id}
                product={{
                  ...prod,
                  _id: prod._id || prod.id || '', // Ensure _id is always a string
                  image: productImage,
                }}
              />
            );
          })}
        </div>
      ) : (
        <div className='text-center py-8 text-gray-500'>
          No related products found
        </div>
      )}

      <div className='text-center mt-10'>
        <Link href='/shop/pharmacy'>
          <button className='px-8 py-3 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-md font-medium transition'>
            View All Products
          </button>
        </Link>
      </div>
    </div>
  );
};

export default RelatedProducts;

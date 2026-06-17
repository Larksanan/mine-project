/* eslint-disable @typescript-eslint/no-explicit-any */
import { motion } from 'framer-motion';
import Image from 'next/image';
import { FiEdit, FiTrash2 } from 'react-icons/fi';
import { Productpharmacy } from '@/types/product';
import { NextRouter } from 'next/router';

interface ProductCardProps {
  product: Productpharmacy;
  stockStatus: { text: string; color: string };
  handleDelete: (id: string) => void;
  deleteLoading: string | null;
  router: NextRouter;
  itemVariants: any;
}

const ProductCard = ({
  product,
  stockStatus,
  handleDelete,
  deleteLoading,
  router,
  itemVariants,
}: ProductCardProps) => {
  const productId = product.id || product._id || '';

  return (
    <motion.div
      layout
      variants={itemVariants}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      className='bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group border border-white/20'
    >
      {/* Product Image */}
      <ProductImage product={product} stockStatus={stockStatus} />

      {/* Product Details */}
      <div className='p-5'>
        <ProductInfo product={product} />
        <ProductMetrics product={product} />
        <ProductActions
          productId={productId}
          handleDelete={handleDelete}
          deleteLoading={deleteLoading}
          router={router}
        />
      </div>
    </motion.div>
  );
};

// Sub-components
interface ProductImageProps {
  product: Productpharmacy;
  stockStatus: { text: string; color: string };
}

const ProductImage = ({ product, stockStatus }: ProductImageProps) => (
  <div className='relative h-48 bg-linear-to-br from-gray-50 to-gray-100 overflow-hidden'>
    <Image
      src={product.image || '/placeholder-product.jpg'}
      alt={product.name}
      fill
      sizes='(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
      className='object-cover group-hover:scale-105 transition-transform duration-300'
      priority={false}
    />
    {product.requiresPrescription && (
      <motion.span
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        className='absolute top-3 left-3 bg-linear-to-r from-purple-600 to-pink-600 text-white text-xs px-3 py-1.5 rounded-full shadow-lg'
      >
        Prescription
      </motion.span>
    )}
    <motion.div
      className={`absolute top-3 right-3 text-xs px-3 py-1.5 rounded-full border ${stockStatus.color} backdrop-blur-sm`}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
    >
      {stockStatus.text}
    </motion.div>
  </div>
);

interface ProductInfoProps {
  product: Productpharmacy;
}

const ProductInfo = ({ product }: ProductInfoProps) => (
  <div className='mb-3'>
    <h3 className='font-semibold text-gray-900 line-clamp-2 text-lg mb-1 group-hover:text-blue-600 transition-colors'>
      {product.name}
    </h3>
    <p className='text-sm text-gray-600 line-clamp-2 leading-relaxed'>
      {product.description}
    </p>
  </div>
);

interface ProductMetricsProps {
  product: Productpharmacy;
}

const ProductMetrics = ({ product }: ProductMetricsProps) => (
  <div className='space-y-2 mb-4'>
    <div className='flex justify-between items-center text-sm'>
      <span className='text-gray-500'>SKU:</span>
      <span className='font-mono font-medium bg-gray-100 px-2 py-1 rounded'>
        {product.sku}
      </span>
    </div>
    <div className='flex justify-between items-center text-sm'>
      <span className='text-gray-500'>Stock:</span>
      <span className='font-semibold'>
        {product.stockQuantity} units
        {product.minStockLevel > 0 && (
          <span className='text-gray-500 text-xs ml-1'>
            (min: {product.minStockLevel})
          </span>
        )}
      </span>
    </div>
    <div className='flex justify-between items-center text-sm'>
      <span className='text-gray-500'>Category:</span>
      <span className='font-medium text-blue-600'>{product.category}</span>
    </div>
    <div className='flex justify-between items-center text-sm'>
      <span className='text-gray-500'>Price:</span>
      <span className='font-bold text-green-600 text-lg'>
        Rs. {product.price.toFixed(2)}
      </span>
    </div>
    {product.pharmacy?.name && (
      <div className='flex justify-between items-center text-sm'>
        <span className='text-gray-500'>Pharmacy:</span>
        <span className='font-medium'>{product.pharmacy.name}</span>
      </div>
    )}
  </div>
);

interface ProductActionsProps {
  productId: string;
  handleDelete: (id: string) => void;
  deleteLoading: string | null;
  router: NextRouter;
}

const ProductActions = ({
  productId,
  handleDelete,
  deleteLoading,
  router,
}: ProductActionsProps) => (
  <div className='flex gap-2'>
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => router.push(`/Pharmacist/shop/${productId}`)}
      disabled={!productId}
      className='flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed border border-blue-200'
    >
      <FiEdit className='text-sm' />
      Edit
    </motion.button>
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => handleDelete(productId)}
      disabled={!productId || deleteLoading === productId}
      className='flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed border border-red-200'
    >
      {deleteLoading === productId ? (
        <div className='w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin'></div>
      ) : (
        <FiTrash2 className='text-sm' />
      )}
    </motion.button>
  </div>
);

export default ProductCard;

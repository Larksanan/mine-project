'use client';
import { motion } from 'framer-motion';
import {
  BiStar,
  BiBraille,
  BiShoppingBag,
  BiCart,
  BiInfoCircle,
} from 'react-icons/bi';
import { Product } from '@/types/product';

interface ProductDetailsProps {
  product: Product;
  quantity: number;
  onQuantityChange: (quantity: number) => void;
  onAddToCart: () => void;
  onBuyNow: () => void;
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: 'LKR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
};

const ProductDetails = ({
  product,
  quantity,
  onQuantityChange,
  onAddToCart,
  onBuyNow,
}: ProductDetailsProps) => {
  const discountPercentage = product.discountPercentage || 0;
  const discountedPrice = product.price * (1 - discountPercentage / 100);
  const discountAmount = product.price - discountedPrice;

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, type: 'spring', delay: 0.2 }}
      className='space-y-6'
    >
      <div>
        <h1 className='text-3xl font-bold text-gray-900 mb-2'>
          {product.name}
        </h1>
        <div className='flex items-center gap-3 mb-3'>
          <div className='flex items-center gap-1 text-yellow-500'>
            {[...Array(5)].map((_, i) => (
              <BiStar key={i} size={18} className='fill-current' />
            ))}
          </div>
          <span className='text-gray-600 text-sm'>(42 reviews)</span>
        </div>
        <div className='flex items-center gap-2 text-sm text-gray-600'>
          <BiBraille size={16} />
          <span>SKU: {product.sku}</span>
          <span className='mx-2'>•</span>
          <span>Manufacturer: {product.manufacturer}</span>
          {product.pharmacy && (
            <>
              <span className='mx-2'>•</span>
              <span>Pharmacy: {product.pharmacy.name}</span>
            </>
          )}
        </div>
      </div>

      <div className='space-y-2'>
        <div className='flex items-center gap-4'>
          <p className='text-3xl font-bold text-gray-900'>
            {formatPrice(discountedPrice)}
          </p>
          {discountPercentage > 0 && (
            <p className='text-lg text-gray-500 line-through'>
              {formatPrice(product.price)}
            </p>
          )}
        </div>
        {discountPercentage > 0 && (
          <p className='text-green-600 text-sm'>
            You save {formatPrice(discountAmount)} ({discountPercentage}%)
          </p>
        )}
      </div>

      {product.description && (
        <p className='text-gray-700 leading-relaxed'>{product.description}</p>
      )}

      {/* Medical Information */}
      <div className='pt-4'>
        <h3 className='font-medium text-gray-900 mb-2 flex items-center gap-2'>
          <BiInfoCircle size={20} className='text-blue-600' />
          Product Information
        </h3>
        <ul className='space-y-2 text-gray-700'>
          {product.activeIngredients && (
            <li className='flex items-start'>
              <span className='text-blue-500 mr-2'>•</span>
              <span className='font-medium'>Active Ingredients:</span>
              <span className='ml-2'>{product.activeIngredients}</span>
            </li>
          )}
          {product.dosage && (
            <li className='flex items-start'>
              <span className='text-blue-500 mr-2'>•</span>
              <span className='font-medium'>Dosage:</span>
              <span className='ml-2'>{product.dosage}</span>
            </li>
          )}
          {product.sideEffects && (
            <li className='flex items-start'>
              <span className='text-blue-500 mr-2'>•</span>
              <span className='font-medium'>Side Effects:</span>
              <span className='ml-2'>{product.sideEffects}</span>
            </li>
          )}
        </ul>
      </div>

      <div className='pt-4'>
        <div className='flex items-center gap-4 mb-6'>
          <div className='flex flex-col gap-2'>
            <span className='text-sm text-gray-600'>Quantity</span>
            <div className='flex items-center border rounded-md overflow-hidden'>
              <button
                onClick={() => onQuantityChange(quantity - 1)}
                className='px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 disabled:opacity-50'
                aria-label='Decrease quantity'
                disabled={quantity <= 1}
              >
                -
              </button>
              <span className='px-4 py-2 bg-white w-12 text-center'>
                {quantity}
              </span>
              <button
                onClick={() => onQuantityChange(quantity + 1)}
                className='px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 disabled:opacity-50'
                aria-label='Increase quantity'
                disabled={quantity >= product.stockQuantity}
              >
                +
              </button>
            </div>
            {product.stockQuantity > 0 && (
              <span className='text-xs text-gray-500'>
                {product.stockQuantity} available
              </span>
            )}
          </div>

          <div className='flex-1 grid grid-cols-2 gap-3 mt-6'>
            <button
              onClick={onAddToCart}
              disabled={!product.inStock || product.requiresPrescription}
              className='py-3 bg-gray-900 text-white hover:bg-gray-800 transition flex items-center justify-center gap-2 font-medium disabled:bg-gray-400 disabled:cursor-not-allowed'
            >
              <BiCart size={20} />
              Buy Now
            </button>
            <button
              onClick={onBuyNow}
              disabled={!product.inStock || product.requiresPrescription}
              className='py-3 bg-blue-600 text-white hover:bg-blue-700 transition flex items-center justify-center gap-2 font-medium disabled:bg-blue-400 disabled:cursor-not-allowed'
            >
              <BiShoppingBag size={20} />
              Add to Cart
            </button>
          </div>
        </div>

        <div className='border-t pt-4'>
          <div className='flex items-center gap-4 text-sm text-gray-600'>
            <span className='font-medium'>Category:</span>
            <span>{product.category}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductDetails;

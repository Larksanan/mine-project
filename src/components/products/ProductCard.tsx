/* eslint-disable no-undef */
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { BiShoppingBag, BiMinus, BiPlus } from 'react-icons/bi';
import { Product } from '@/types/product';

interface ProductCardProps {
  product: Product;
  index: number;
  quantity: number;
  onQuantityChange: (quantity: number) => void;
  onAddToCart: () => void;
  onBuyNow: () => void;
}

export default function ProductCard({
  product,
  index,
  quantity,
  onQuantityChange,
  onBuyNow,
}: ProductCardProps) {
  const productId = product.id || product._id;
  const maxStock = product.stockQuantity || 1;

  const handleDecrement = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (quantity > 1) {
      onQuantityChange(quantity - 1);
    }
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (quantity < maxStock) {
      onQuantityChange(quantity + 1);
    }
  };

  const handleBuyNowClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onBuyNow();
  };

  return (
    <motion.div
      className='w-72 bg-white shadow-md rounded-xl duration-500 hover:scale-105 hover:shadow-xl'
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <Link href={`/shop/pharmacy/${productId}`}>
        <div className='cursor-pointer relative'>
          <Image
            src={product.image || '/placeholder-product.jpg'}
            alt={product.name}
            width={288}
            height={320}
            className='h-80 w-72 object-cover rounded-t-xl'
            priority={index < 4}
            onError={e => {
              e.currentTarget.src = '/placeholder-product.jpg';
            }}
          />
          {!product.inStock && (
            <div className='absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-semibold'>
              Out of Stock
            </div>
          )}
          {product.requiresPrescription && (
            <div className='absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded text-xs font-semibold'>
              Rx Required
            </div>
          )}
        </div>
      </Link>

      <div className='px-4 py-3 w-72'>
        <h2 className='text-xl font-semibold text-black mb-2 truncate'>
          {product.name}
        </h2>
        <p className='text-sm text-gray-600 mb-1 line-clamp-2 h-10'>
          {product.description}
        </p>
        <p className='text-sm text-gray-600 mb-1'>
          <span className='font-semibold'>Category:</span> {product.category}
        </p>
        <p className='text-sm text-gray-600 mb-1'>
          <span className='font-semibold'>Brand:</span> {product.manufacturer}
        </p>
        <p
          className={`text-sm mb-1 ${product.inStock ? 'text-green-600' : 'text-red-600'}`}
        >
          <span className='font-semibold'>Stock:</span>{' '}
          {product.inStock
            ? `${product.stockQuantity} available`
            : 'Out of Stock'}
        </p>

        <div className='flex items-center justify-between mt-3 mb-3'>
          <p className='text-lg font-bold text-black'>
            LKR.{product.price?.toFixed(2) || '0.00'}
          </p>

          {/* Quantity Selector */}
          {product.inStock && (
            <div className='flex items-center border border-gray-300 rounded-lg overflow-hidden'>
              <button
                onClick={handleDecrement}
                disabled={quantity <= 1}
                className='px-3 py-1 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
                aria-label='Decrease quantity'
              >
                <BiMinus className='text-sm' />
              </button>
              <span className='px-4 py-1 font-semibold text-gray-800 min-w-10 text-center'>
                {quantity}
              </span>
              <button
                onClick={handleIncrement}
                disabled={quantity >= maxStock}
                className='px-3 py-1 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
                aria-label='Increase quantity'
              >
                <BiPlus className='text-sm' />
              </button>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className='flex flex-col gap-2'>
          <motion.button
            className='flex items-center justify-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed w-full'
            whileHover={{ scale: product.inStock ? 1.02 : 1 }}
            whileTap={{ scale: product.inStock ? 0.98 : 1 }}
            disabled={!product.inStock}
            onClick={handleBuyNowClick}
          >
            <BiShoppingBag className='text-xl' />
            <span className='text-sm font-medium'>
              {product.inStock ? 'Add to Cart' : 'Unavailable'}
            </span>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

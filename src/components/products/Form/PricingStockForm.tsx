'use client';

import { FiAlertCircle, FiPercent, FiDollarSign } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { UseFormRegister, FieldErrors, Control } from 'react-hook-form';
import { ProductFormData } from '@/types/product';
import { useState, useEffect } from 'react';

interface PricingStockFormProps {
  register: UseFormRegister<ProductFormData>;
  errors: FieldErrors<ProductFormData>;
  control?: Control<ProductFormData>;
}

export default function PricingStockForm({
  register,
  errors,
}: PricingStockFormProps) {
  const [sellingPrice, setSellingPrice] = useState<number>(0);
  const [costPrice, setCostPrice] = useState<number>(0);
  const [profitMargin, setProfitMargin] = useState<number>(0);

  // Calculate profit margin when prices change
  useEffect(() => {
    if (sellingPrice > 0 && costPrice > 0) {
      const margin = ((sellingPrice - costPrice) / costPrice) * 100;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setProfitMargin(margin);
    } else {
      setProfitMargin(0);
    }
  }, [sellingPrice, costPrice]);

  return (
    <motion.div className='bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20'>
      <h2 className='text-2xl font-semibold mb-6 text-gray-800'>
        Pricing & Stock
      </h2>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        {/* Selling Price */}
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-2'>
            Selling Price (Rs.) *
          </label>
          <div className='relative'>
            <FiDollarSign className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400' />
            <input
              type='number'
              {...register('price', {
                onChange: e => setSellingPrice(parseFloat(e.target.value) || 0),
              })}
              min='0'
              step='0.01'
              className='w-full pl-10 pr-4 py-3 border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm transition-all duration-200'
              placeholder='0.00'
            />
          </div>
          {errors.price && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className='text-red-500 text-sm mt-2 flex items-center gap-2'
            >
              <FiAlertCircle />
              {errors.price.message}
            </motion.p>
          )}
        </div>

        {/* Cost Price */}
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-2'>
            Cost Price (Rs.)
          </label>
          <div className='relative'>
            <FiDollarSign className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400' />
            <input
              type='number'
              {...register('costPrice', {
                onChange: e => setCostPrice(parseFloat(e.target.value) || 0),
              })}
              min='0'
              step='0.01'
              className='w-full pl-10 pr-4 py-3 border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm transition-all duration-200'
              placeholder='0.00'
            />
          </div>
        </div>

        {/* Profit Margin Display */}
        <div className='md:col-span-2'>
          <div className='p-4 bg-linear-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <FiPercent className='text-blue-600' />
                <span className='text-sm font-medium text-blue-800'>
                  Profit Margin
                </span>
              </div>
              <span
                className={`text-lg font-bold ${
                  profitMargin >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {profitMargin.toFixed(2)}%
              </span>
            </div>
            <div className='mt-2 w-full bg-gray-200 rounded-full h-2'>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(profitMargin, 100)}%` }}
                className={`h-2 rounded-full ${
                  profitMargin >= 30
                    ? 'bg-green-500'
                    : profitMargin >= 10
                      ? 'bg-yellow-500'
                      : profitMargin > 0
                        ? 'bg-red-500'
                        : 'bg-gray-300'
                }`}
              />
            </div>
            <p className='text-xs text-gray-600 mt-2'>
              {profitMargin >= 30
                ? 'Excellent profit margin'
                : profitMargin >= 10
                  ? 'Good profit margin'
                  : profitMargin > 0
                    ? 'Low profit margin'
                    : 'No profit or loss'}
            </p>
          </div>
        </div>

        {/* Stock Quantity */}
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-2'>
            Stock Quantity *
          </label>
          <input
            type='number'
            {...register('stockQuantity')}
            min='0'
            className='w-full px-4 py-3 border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm transition-all duration-200'
            placeholder='0'
          />
          {errors.stockQuantity && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className='text-red-500 text-sm mt-2 flex items-center gap-2'
            >
              <FiAlertCircle />
              {errors.stockQuantity.message}
            </motion.p>
          )}
        </div>

        {/* Min Stock Level */}
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-2'>
            Min Stock Level
          </label>
          <input
            type='number'
            {...register('minStockLevel')}
            min='0'
            className='w-full px-4 py-3 border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm transition-all duration-200'
            placeholder='10'
          />
        </div>

        {/* Stock Status */}
        <div className='md:col-span-2 mt-4 p-4 bg-linear-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200'>
          <div className='grid grid-cols-2 gap-4'>
            <div className='flex items-center space-x-3'>
              <input
                type='checkbox'
                {...register('inStock')}
                className='w-5 h-5 text-blue-600 rounded-lg focus:ring-blue-500 border-gray-300/50'
                id='inStock'
              />
              <label
                htmlFor='inStock'
                className='text-sm font-medium text-gray-700 cursor-pointer'
              >
                Product is in stock
              </label>
            </div>

            {/* Stock Status Indicator */}
            <div className='flex items-center justify-end'>
              <div
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  sellingPrice > 0 && costPrice > 0 && profitMargin >= 0
                    ? 'bg-green-100 text-green-800 border border-green-200'
                    : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                }`}
              >
                {sellingPrice > 0 && costPrice > 0 && profitMargin >= 0
                  ? 'Profitable'
                  : 'Check Pricing'}
              </div>
            </div>
          </div>
        </div>

        {/* Price Validation Message */}
        {sellingPrice > 0 && costPrice > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className='md:col-span-2 mt-4 p-4 bg-linear-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200'
          >
            <div className='flex items-center gap-3'>
              {profitMargin >= 30 ? (
                <FiAlertCircle className='text-green-500' />
              ) : profitMargin >= 10 ? (
                <FiAlertCircle className='text-yellow-500' />
              ) : profitMargin > 0 ? (
                <FiAlertCircle className='text-orange-500' />
              ) : (
                <FiAlertCircle className='text-red-500' />
              )}
              <div>
                <p className='text-sm font-medium text-gray-800'>
                  {profitMargin >= 30
                    ? 'Excellent Pricing'
                    : profitMargin >= 10
                      ? 'Good Pricing'
                      : profitMargin > 0
                        ? 'Low Margin'
                        : 'Loss Making'}
                </p>
                <p className='text-xs text-gray-600 mt-1'>
                  {profitMargin >= 30
                    ? 'This product has a healthy profit margin.'
                    : profitMargin >= 10
                      ? 'This product has a reasonable profit margin.'
                      : profitMargin > 0
                        ? 'Consider increasing the selling price for better margins.'
                        : 'The selling price is below cost price. This will result in losses.'}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

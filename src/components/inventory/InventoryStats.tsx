'use client';
import {
  FiPackage,
  FiTrendingUp,
  FiAlertTriangle,
  FiShoppingCart,
} from 'react-icons/fi';
import { InventoryStats as InventoryStatsType } from '@/types/Inventory';

interface InventoryStatsProps {
  stats: InventoryStatsType;
  formatCurrency: (amount: number) => string;
}

export default function InventoryStats({
  stats,
  formatCurrency,
}: InventoryStatsProps) {
  return (
    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8'>
      <div className='bg-white rounded-xl p-4 md:p-6 shadow-sm border border-gray-200'>
        <div className='flex items-center justify-between'>
          <div>
            <p className='text-sm font-medium text-gray-600'>Total Items</p>
            <p className='text-xl md:text-2xl font-bold text-gray-900 mt-1'>
              {stats.totalItems}
            </p>
          </div>
          <div className='w-10 h-10 md:w-12 md:h-12 bg-blue-100 rounded-xl flex items-center justify-center'>
            <FiPackage className='w-5 h-5 md:w-6 md:h-6 text-blue-600' />
          </div>
        </div>
      </div>

      <div className='bg-white rounded-xl p-4 md:p-6 shadow-sm border border-gray-200'>
        <div className='flex items-center justify-between'>
          <div>
            <p className='text-sm font-medium text-gray-600'>Inventory Value</p>
            <p className='text-xl md:text-2xl font-bold text-gray-900 mt-1'>
              {formatCurrency(stats.totalValue)}
            </p>
          </div>
          <div className='w-10 h-10 md:w-12 md:h-12 bg-green-100 rounded-xl flex items-center justify-center'>
            <FiTrendingUp className='w-5 h-5 md:w-6 md:h-6 text-green-600' />
          </div>
        </div>
      </div>

      <div className='bg-white rounded-xl p-4 md:p-6 shadow-sm border border-gray-200'>
        <div className='flex items-center justify-between'>
          <div>
            <p className='text-sm font-medium text-gray-600'>Low Stock</p>
            <p className='text-xl md:text-2xl font-bold text-yellow-600 mt-1'>
              {stats.lowStockCount}
            </p>
          </div>
          <div className='w-10 h-10 md:w-12 md:h-12 bg-yellow-100 rounded-xl flex items-center justify-center'>
            <FiAlertTriangle className='w-5 h-5 md:w-6 md:h-6 text-yellow-600' />
          </div>
        </div>
      </div>

      <div className='bg-white rounded-xl p-4 md:p-6 shadow-sm border border-gray-200'>
        <div className='flex items-center justify-between'>
          <div>
            <p className='text-sm font-medium text-gray-600'>Out of Stock</p>
            <p className='text-xl md:text-2xl font-bold text-red-600 mt-1'>
              {stats.outOfStockCount}
            </p>
          </div>
          <div className='w-10 h-10 md:w-12 md:h-12 bg-red-100 rounded-xl flex items-center justify-center'>
            <FiShoppingCart className='w-5 h-5 md:w-6 md:h-6 text-red-600' />
          </div>
        </div>
      </div>
    </div>
  );
}

/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { FiAlertCircle } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { UseFormRegister, FieldErrors } from 'react-hook-form';
import { ProductFormData } from '@/types/product';
import { Pharmacy } from '@/types/pharmacy';

interface BasicInformationFormProps {
  register: UseFormRegister<ProductFormData>;
  errors: FieldErrors<ProductFormData>;
  pharmacies: Array<{
    _id: string | { toString(): string };
    id?: string;
    name: string;
    address: any;
    formattedAddress?: string;
  }>;
  pharmaciesLoading: boolean;
  pharmaciesError: string;
  categories: readonly string[];
  selectedPharmacy?: Pharmacy | null;
  formatAddress: (address: any) => string;
}

export default function BasicInformationForm({
  register,
  errors,
  pharmacies,
  pharmaciesLoading,
  pharmaciesError,
  categories,
  selectedPharmacy,
  formatAddress,
}: BasicInformationFormProps) {
  return (
    <motion.div className='bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20'>
      <h2 className='text-2xl font-semibold mb-6 text-gray-800'>
        Basic Information
      </h2>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        <div className='md:col-span-2'>
          <label className='block text-sm font-medium text-gray-700 mb-2'>
            Product Name *
          </label>
          <input
            {...register('name')}
            className='w-full px-4 py-3 border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm transition-all duration-200'
            placeholder='Enter product name'
          />
          {errors.name && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className='text-red-500 text-sm mt-2 flex items-center gap-2'
            >
              <FiAlertCircle />
              {errors.name.message}
            </motion.p>
          )}
        </div>

        <div className='md:col-span-2'>
          <label className='block text-sm font-medium text-gray-700 mb-2'>
            Description *
          </label>
          <textarea
            {...register('description')}
            rows={3}
            className='w-full px-4 py-3 border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm transition-all duration-200 resize-none'
            placeholder='Enter product description'
          />
          {errors.description && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className='text-red-500 text-sm mt-2 flex items-center gap-2'
            >
              <FiAlertCircle />
              {errors.description.message}
            </motion.p>
          )}
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-700 mb-2'>
            Manufacturer *
          </label>
          <input
            {...register('manufacturer')}
            className='w-full px-4 py-3 border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm transition-all duration-200'
            placeholder='Enter manufacturer name'
          />
          {errors.manufacturer && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className='text-red-500 text-sm mt-2 flex items-center gap-2'
            >
              <FiAlertCircle />
              {errors.manufacturer.message}
            </motion.p>
          )}
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-700 mb-2'>
            Category *
          </label>
          <select
            {...register('category')}
            className='w-full px-4 py-3 border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm transition-all duration-200'
          >
            <option value=''>Select Category</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          {errors.category && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className='text-red-500 text-sm mt-2 flex items-center gap-2'
            >
              <FiAlertCircle />
              {errors.category.message}
            </motion.p>
          )}
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-700 mb-2'>
            Pharmacy *
          </label>
          {pharmaciesLoading ? (
            <div className='w-full px-4 py-3 border border-gray-300/50 rounded-xl bg-gray-100/50 animate-pulse'>
              <div className='flex items-center gap-2'>
                <div className='w-6 h-6 bg-gray-200 rounded-full animate-pulse'></div>
                <span className='text-gray-500'>Loading pharmacies...</span>
              </div>
            </div>
          ) : pharmaciesError ? (
            <div className='flex items-center gap-2 text-sm text-yellow-700 bg-yellow-50/50 p-3 rounded-xl border border-yellow-200'>
              <FiAlertCircle />
              <span>{pharmaciesError}</span>
            </div>
          ) : pharmacies.length === 0 ? (
            <div className='flex items-center gap-2 text-sm text-red-700 bg-red-50/50 p-3 rounded-xl border border-red-200'>
              <FiAlertCircle />
              <span>No pharmacies available. Please add a pharmacy first.</span>
            </div>
          ) : (
            <select
              {...register('pharmacy')}
              className='w-full px-4 py-3 border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm transition-all duration-200'
            >
              <option value=''>Select Pharmacy</option>
              {pharmacies.map(pharmacy => {
                const pharmacyId =
                  typeof pharmacy._id === 'object'
                    ? pharmacy._id.toString()
                    : pharmacy._id;
                return (
                  <option key={pharmacyId} value={pharmacyId}>
                    {pharmacy.name} -{' '}
                    {pharmacy.formattedAddress ||
                      formatAddress(pharmacy.address)}
                  </option>
                );
              })}
            </select>
          )}
          {errors.pharmacy && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className='text-red-500 text-sm mt-2 flex items-center gap-2'
            >
              <FiAlertCircle />
              {errors.pharmacy.message}
            </motion.p>
          )}
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-700 mb-2'>
            SKU (Auto-generated)
          </label>
          <input
            {...register('sku')}
            className='w-full px-4 py-3 border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50/50 backdrop-blur-sm transition-all duration-200'
            readOnly
          />
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-700 mb-2'>
            Barcode *
          </label>
          <input
            {...register('barcode')}
            className='w-full px-4 py-3 border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm transition-all duration-200'
            placeholder='Enter product barcode'
          />
          {errors.barcode && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className='text-red-500 text-sm mt-2 flex items-center gap-2'
            >
              <FiAlertCircle />
              {errors.barcode.message}
            </motion.p>
          )}
        </div>

        {/* Selected Pharmacy Info */}
        {selectedPharmacy && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className='md:col-span-2 mt-4 p-4 bg-blue-50/50 rounded-xl border border-blue-200'
          >
            <h3 className='text-sm font-medium text-blue-800 mb-2'>
              Selected Pharmacy Information
            </h3>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
              <div>
                <p className='text-xs text-blue-600'>Pharmacy Name</p>
                <p className='text-sm font-medium text-gray-800'>
                  {selectedPharmacy.name}
                </p>
              </div>
              <div>
                <p className='text-xs text-blue-600'>Address</p>
                <p className='text-sm font-medium text-gray-800'>
                  {formatAddress(selectedPharmacy.address)}
                </p>
              </div>
              {selectedPharmacy.contact?.phone && (
                <div>
                  <p className='text-xs text-blue-600'>Contact</p>
                  <p className='text-sm font-medium text-gray-800'>
                    {selectedPharmacy.contact.phone}
                  </p>
                </div>
              )}
              {selectedPharmacy.isOpen !== undefined && (
                <div>
                  <p className='text-xs text-blue-600'>Status</p>
                  <p
                    className={`text-sm font-medium ${
                      selectedPharmacy.isOpen
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    {selectedPharmacy.isOpen ? 'Open' : 'Closed'}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

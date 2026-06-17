'use client';

import { FiUpload, FiX, FiAlertCircle } from 'react-icons/fi';
import Image from 'next/image';
import { motion } from 'framer-motion';

interface ProductImageUploadProps {
  imagePreview: string;
  // eslint-disable-next-line no-undef
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: () => void;
  error?: string;
}

export default function ProductImageUpload({
  imagePreview,
  onImageUpload,
  onRemoveImage,
  error,
}: ProductImageUploadProps) {
  return (
    <div className='bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 sticky top-6 border border-white/20'>
      <h2 className='text-xl font-semibold mb-4 text-gray-800'>
        Product Image *
      </h2>

      <div className='space-y-4'>
        <div className='relative h-80 bg-linear-to-br from-gray-50 to-gray-100 rounded-xl overflow-hidden border-2 border-dashed border-gray-300/50 hover:border-blue-400/50 transition-all duration-300 group'>
          {imagePreview ? (
            <>
              <div className='relative w-full h-full'>
                <Image
                  src={imagePreview}
                  alt='Product preview'
                  fill
                  style={{ objectFit: 'cover' }}
                />
              </div>
              <button
                type='button'
                onClick={onRemoveImage}
                className='absolute top-3 right-3 bg-red-500 text-white p-2 rounded-full shadow-lg hover:bg-red-600 transition-colors duration-200'
              >
                <FiX className='text-sm' />
              </button>
            </>
          ) : (
            <div className='absolute inset-0 flex flex-col items-center justify-center text-gray-400 group-hover:text-blue-400 transition-colors duration-300'>
              <FiUpload className='text-5xl mb-3' />
              <p className='text-center text-sm'>
                Click to upload
                <br />
                product image
              </p>
            </div>
          )}
        </div>

        <label className='cursor-pointer flex items-center justify-center gap-3 w-full px-4 py-4 border-2 border-dashed border-gray-300/50 rounded-xl hover:border-blue-500 hover:bg-blue-50/50 transition-all duration-300 group'>
          <FiUpload className='text-blue-500 group-hover:scale-110 transition-transform duration-200' />
          <span className='text-blue-600 font-medium'>
            Choose Product Image
          </span>
          <input
            type='file'
            accept='image/*'
            onChange={onImageUpload}
            className='hidden'
          />
        </label>

        <div className='text-xs text-gray-500 text-center space-y-1'>
          <p>Recommended: 500x500px, JPG or PNG</p>
          <p>Max file size: 5MB</p>
        </div>

        {error && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className='text-red-500 text-sm flex items-center gap-2'
          >
            <FiAlertCircle />
            {error}
          </motion.p>
        )}
      </div>
    </div>
  );
}

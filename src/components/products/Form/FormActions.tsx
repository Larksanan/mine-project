'use client';

import { FiSave, FiX, FiCheck, FiAlertCircle } from 'react-icons/fi';
import { motion } from 'framer-motion';

interface FormActionsProps {
  loading: boolean;
  isDirty: boolean;
  isValid: boolean;
  pharmaciesLoading: boolean;
  onSubmit: () => void;
  onCancel: () => void;
}

export default function FormActions({
  loading,
  isDirty,
  isValid,
  pharmaciesLoading,
  onSubmit,
  onCancel,
}: FormActionsProps) {
  const isDisabled = loading || pharmaciesLoading || !isDirty || !isValid;

  return (
    <motion.div
      className='bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20'
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <div className='flex flex-col sm:flex-row gap-4 justify-between items-center'>
        {/* Left side: Status indicators */}
        <div className='w-full sm:w-auto'>
          <div className='flex flex-wrap gap-3 items-center'>
            {/* Form Status */}
            <div className='flex items-center gap-2'>
              <div
                className={`w-2 h-2 rounded-full ${
                  isDirty ? 'bg-yellow-500 animate-pulse' : 'bg-gray-300'
                }`}
              />
              <span className='text-xs font-medium text-gray-600'>
                {isDirty ? 'Unsaved changes' : 'No changes'}
              </span>
            </div>

            {/* Validation Status */}
            <div className='flex items-center gap-2'>
              <div
                className={`w-2 h-2 rounded-full ${
                  isValid ? 'bg-green-500' : 'bg-red-500'
                }`}
              />
              <span className='text-xs font-medium text-gray-600'>
                {isValid ? 'All valid' : 'Check errors'}
              </span>
            </div>

            {/* Pharmacy Status */}
            <div className='flex items-center gap-2'>
              <div
                className={`w-2 h-2 rounded-full ${
                  !pharmaciesLoading
                    ? 'bg-green-500'
                    : 'bg-yellow-500 animate-pulse'
                }`}
              />
              <span className='text-xs font-medium text-gray-600'>
                {pharmaciesLoading
                  ? 'Loading pharmacies...'
                  : 'Pharmacies loaded'}
              </span>
            </div>
          </div>
        </div>

        {/* Right side: Action buttons */}
        <div className='flex flex-col sm:flex-row gap-4 w-full sm:w-auto'>
          {/* Cancel Button */}
          <motion.button
            type='button'
            onClick={onCancel}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className='w-full sm:w-auto px-6 py-3 border border-gray-300/50 rounded-xl hover:bg-gray-50/50 transition-all duration-200 font-medium text-gray-700 flex items-center justify-center gap-2'
          >
            <FiX className='text-lg' />
            Cancel
          </motion.button>

          {/* Save Draft Button (Optional) */}
          <motion.button
            type='button'
            onClick={() => {
              // Optional: Save as draft functionality
              alert('Draft saved!');
            }}
            disabled={!isDirty}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className='w-full sm:w-auto px-6 py-3 border border-blue-300/50 text-blue-600 rounded-xl hover:bg-blue-50/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium flex items-center justify-center gap-2'
          >
            <FiSave className='text-lg' />
            Save Draft
          </motion.button>

          {/* Submit Button */}
          <motion.button
            type='button'
            onClick={onSubmit}
            disabled={isDisabled}
            whileHover={{ scale: isDisabled ? 1 : 1.02 }}
            whileTap={{ scale: isDisabled ? 1 : 0.98 }}
            className={`w-full sm:w-auto px-8 py-3 rounded-xl font-medium shadow-lg transition-all duration-200 flex items-center justify-center gap-3 ${
              isDisabled
                ? 'bg-linear-to-r from-gray-400 to-gray-500 text-gray-300 cursor-not-allowed'
                : 'bg-linear-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 hover:shadow-xl'
            }`}
          >
            {loading ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    ease: 'linear',
                  }}
                  className='w-5 h-5 border-2 border-white border-t-transparent rounded-full'
                />
                <span>Adding Product...</span>
              </>
            ) : (
              <>
                <FiCheck className='text-lg' />
                <span>Add Product</span>
              </>
            )}
          </motion.button>
        </div>
      </div>

      {/* Error/Warning Messages */}
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{
          opacity: isDisabled && !loading ? 1 : 0,
          height: isDisabled && !loading ? 'auto' : 0,
        }}
        className='mt-4 overflow-hidden'
      >
        <div className='p-4 bg-yellow-50/50 border border-yellow-200 rounded-xl'>
          <div className='flex items-start gap-3'>
            <FiAlertCircle className='text-yellow-600 shrink-0 mt-0.5' />
            <div>
              <h4 className='text-sm font-medium text-yellow-800 mb-1'>
                Cannot submit form
              </h4>
              <ul className='text-xs text-yellow-700 space-y-1'>
                {pharmaciesLoading && (
                  <li>• Still loading pharmacy information</li>
                )}
                {!isDirty && <li>• No changes have been made to the form</li>}
                {!isValid && <li>• Please fix all validation errors</li>}
                {loading && <li>• Currently processing your request</li>}
              </ul>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

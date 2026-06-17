/* eslint-disable no-undef */
import { motion } from 'framer-motion';
import Image from 'next/image';
import { BiShoppingBag } from 'react-icons/bi';
import { FiAlertCircle } from 'react-icons/fi';
import { BiUpload } from 'react-icons/bi';
import type { ShippingInfo } from '@/validation/checkout';
import type { CartItem } from '@/context/CartContext';

interface ReviewStepProps {
  cart: CartItem[];
  shippingInfo: ShippingInfo;
  hasRxItems: boolean;
  prescriptionFiles: File[];
  onPrescriptionUpload: (files: File[]) => void;
  onEditAddress: () => void;
  onNext: () => void;
}

export default function ReviewStep({
  cart,
  shippingInfo,
  hasRxItems,
  prescriptionFiles,
  onPrescriptionUpload,
  onEditAddress,
  onNext,
}: ReviewStepProps) {
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      onPrescriptionUpload(Array.from(e.target.files));
    }
  };

  return (
    <motion.div
      key='step2'
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className='bg-white rounded-2xl shadow-xl p-8'
    >
      <h2 className='text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2'>
        <BiShoppingBag className='text-blue-600' />
        Review Your Order
      </h2>

      {/* Order Items */}
      <div className='space-y-4 mb-6'>
        {cart.map(item => (
          <div
            key={item._id}
            className='flex items-center gap-4 p-4 bg-gray-50 rounded-xl'
          >
            <div className='relative w-20 h-20 shrink-0 rounded-lg overflow-hidden'>
              <Image
                src={item.image || '/placeholder-product.jpg'}
                alt={item.name}
                fill
                className='object-cover'
                sizes='80px'
              />
            </div>
            <div className='flex-1'>
              <h3 className='font-semibold text-gray-900'>{item.name}</h3>
              {item.requiresPrescription && (
                <span className='inline-block bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full font-medium mb-1'>
                  Rx Required
                </span>
              )}
              <p className='text-sm text-gray-600'>
                Qty: {item.quantity} × ${item.price.toFixed(2)}
              </p>
            </div>
            <p className='font-bold text-gray-900'>
              ${(item.price * item.quantity).toFixed(2)}
            </p>
          </div>
        ))}
      </div>

      {/* Prescription Upload */}
      {hasRxItems && (
        <div className='mb-6 p-6 bg-yellow-50 border-2 border-yellow-300 rounded-xl'>
          <h3 className='font-bold text-yellow-900 mb-3 flex items-center gap-2'>
            <FiAlertCircle className='text-xl' />
            Prescription Required
          </h3>
          <p className='text-sm text-yellow-800 mb-4'>
            Please upload your prescription for items that require it. Accepted
            formats: JPG, PNG, PDF (Max 5MB each)
          </p>
          <label className='flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-dashed border-yellow-400 rounded-xl cursor-pointer hover:bg-yellow-50 transition-colors'>
            <BiUpload className='text-xl text-yellow-700' />
            <span className='font-semibold text-yellow-700'>
              {prescriptionFiles.length > 0
                ? `${prescriptionFiles.length} file(s) selected`
                : 'Upload Prescription'}
            </span>
            <input
              type='file'
              multiple
              accept='image/*,.pdf'
              onChange={handleFileUpload}
              className='hidden'
            />
          </label>
          {prescriptionFiles.length > 0 && (
            <div className='mt-4'>
              <h4 className='font-medium text-yellow-900 mb-2'>
                Uploaded Files:
              </h4>
              <ul className='space-y-1'>
                {prescriptionFiles.map((file, index) => (
                  <li
                    key={index}
                    className='text-sm text-yellow-800 bg-yellow-100 px-3 py-2 rounded-lg'
                  >
                    ✅ {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Shipping Address */}
      <div className='mb-6 p-6 bg-gray-50 rounded-xl'>
        <div className='flex justify-between items-start mb-3'>
          <h3 className='font-bold text-gray-900'>Shipping Address</h3>
          <button
            onClick={onEditAddress}
            className='text-blue-600 hover:text-blue-700 font-semibold text-sm'
          >
            Edit
          </button>
        </div>
        <div className='text-gray-700 space-y-1'>
          <p className='font-medium'>{shippingInfo.fullName}</p>
          <p>{shippingInfo.address}</p>
          <p>
            {shippingInfo.city}, {shippingInfo.state} {shippingInfo.zipCode}
          </p>
          <p>{shippingInfo.country}</p>
          <p className='pt-2'>
            <span className='font-medium'>Phone:</span> {shippingInfo.phone}
          </p>
          <p>
            <span className='font-medium'>Email:</span> {shippingInfo.email}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className='flex gap-4'>
        <button
          onClick={onEditAddress}
          className='flex-1 bg-gray-200 text-gray-800 py-4 rounded-xl font-bold hover:bg-gray-300 transition-colors'
        >
          Back
        </button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onNext}
          disabled={hasRxItems && prescriptionFiles.length === 0}
          className='flex-1 bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
        >
          Continue to Payment
        </motion.button>
      </div>
    </motion.div>
  );
}

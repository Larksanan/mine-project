import { motion } from 'framer-motion';
import { BiUser, BiEnvelope, BiPhone, BiMap } from 'react-icons/bi';
import { UseFormRegister, FieldErrors } from 'react-hook-form';
import type { ShippingInfo } from '@/validation/checkout';

interface ShippingStepProps {
  register: UseFormRegister<ShippingInfo>;
  errors: FieldErrors<ShippingInfo>;
  onNext: () => void;
}

export default function ShippingStep({
  register,
  errors,
  onNext,
}: ShippingStepProps) {
  return (
    <motion.div
      key='step1'
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className='bg-white rounded-2xl shadow-xl p-8'
    >
      <h2 className='text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2'>
        <BiUser className='text-blue-600' />
        Shipping Information
      </h2>

      <div className='space-y-4'>
        {/* Full Name Field */}
        <div>
          <label className='block text-sm font-semibold text-gray-700 mb-2'>
            Full Name *
          </label>
          <input
            {...register('fullName')}
            type='text'
            className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
              errors.fullName ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder='J.A.Jebarsan ThacroosS'
          />
          {errors.fullName && (
            <p className='text-red-600 text-xs mt-1'>
              {errors.fullName.message}
            </p>
          )}
        </div>

        {/* Email and Phone Row */}
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
          <div>
            <label className='block text-sm font-semibold text-gray-700 mb-2'>
              Email *
            </label>
            <div className='relative'>
              <BiEnvelope className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl' />
              <input
                {...register('email')}
                type='email'
                className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder='jebarsanthacroos@example.com'
              />
            </div>
            {errors.email && (
              <p className='text-red-600 text-xs mt-1'>
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label className='block text-sm font-semibold text-gray-700 mb-2'>
              Phone *
            </label>
            <div className='relative'>
              <BiPhone className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl' />
              <input
                {...register('phone')}
                type='tel'
                className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                  errors.phone ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder='+94 233 127 061'
              />
            </div>
            {errors.phone && (
              <p className='text-red-600 text-xs mt-1'>
                {errors.phone.message}
              </p>
            )}
          </div>
        </div>

        {/* Address Field */}
        <div>
          <label className='block text-sm font-semibold text-gray-700 mb-2'>
            Address *
          </label>
          <div className='relative'>
            <BiMap className='absolute left-3 top-4 text-gray-400 text-xl' />
            <input
              {...register('address')}
              type='text'
              className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                errors.address ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder='Main street batticalo road,Pandirupu,Kalmunai.'
            />
          </div>
          {errors.address && (
            <p className='text-red-600 text-xs mt-1'>
              {errors.address.message}
            </p>
          )}
        </div>

        {/* City and State Row */}
        <div className='grid grid-cols-2 gap-4'>
          <div>
            <label className='block text-sm font-semibold text-gray-700 mb-2'>
              City *
            </label>
            <input
              {...register('city')}
              type='text'
              className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                errors.city ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder='Kalmunai'
            />
            {errors.city && (
              <p className='text-red-600 text-xs mt-1'>{errors.city.message}</p>
            )}
          </div>

          <div>
            <label className='block text-sm font-semibold text-gray-700 mb-2'>
              State/Province *
            </label>
            <input
              {...register('state')}
              type='text'
              className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                errors.state ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder='Eastern'
            />
            {errors.state && (
              <p className='text-red-600 text-xs mt-1'>
                {errors.state.message}
              </p>
            )}
          </div>
        </div>

        {/* ZIP Code and Country Row */}
        <div className='grid grid-cols-2 gap-4'>
          <div>
            <label className='block text-sm font-semibold text-gray-700 mb-2'>
              ZIP Code *
            </label>
            <input
              {...register('zipCode')}
              type='text'
              className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                errors.zipCode ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder='10100'
            />
            {errors.zipCode && (
              <p className='text-red-600 text-xs mt-1'>
                {errors.zipCode.message}
              </p>
            )}
          </div>

          <div>
            <label className='block text-sm font-semibold text-gray-700 mb-2'>
              Country
            </label>
            <select
              {...register('country')}
              className='w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all'
            >
              <option value='Sri Lanka'>Sri Lanka</option>
              <option value='India'>India</option>
              <option value='USA'>USA</option>
              <option value='UK'>UK</option>
            </select>
          </div>
        </div>
      </div>

      {/* Continue Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onNext}
        className='w-full mt-6 bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition-colors'
      >
        Continue to Review
      </motion.button>
    </motion.div>
  );
}

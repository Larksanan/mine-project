/* eslint-disable no-undef */
import { motion } from 'framer-motion';
import { BiCreditCard, BiLock } from 'react-icons/bi';
import { FieldError, UseFormRegister, UseFormSetValue } from 'react-hook-form';
import type { PaymentInfo } from '@/validation/checkout';

interface PaymentStepProps {
  register: UseFormRegister<PaymentInfo>;
  errors: Partial<Record<keyof PaymentInfo, FieldError>>;
  paymentMethod: 'cash' | 'card' | 'insurance';
  setPaymentValue: UseFormSetValue<PaymentInfo>;
  isProcessing: boolean;
  onBack: () => void;
  onSubmit: () => void;
  total: number;
}

export default function PaymentStep({
  register,
  errors,
  paymentMethod,
  setPaymentValue,
  isProcessing,
  onBack,
  onSubmit,
  total,
}: PaymentStepProps) {
  const formatCardNumber = (value: string) => {
    return value
      .replace(/\s/g, '')
      .replace(/(\d{4})/g, '$1 ')
      .trim()
      .slice(0, 19);
  };

  const formatExpiryDate = (value: string) => {
    value = value.replace(/\D/g, '');
    if (value.length >= 2) {
      value = value.slice(0, 2) + '/' + value.slice(2, 4);
    }
    return value.slice(0, 5);
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    setPaymentValue('cardNumber', formatted, { shouldValidate: true });
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatExpiryDate(e.target.value);
    setPaymentValue('expiryDate', formatted, { shouldValidate: true });
  };

  const handleCVVChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 3);
    setPaymentValue('cvv', value, { shouldValidate: true });
  };

  return (
    <motion.div
      key='step3'
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className='bg-white rounded-2xl shadow-xl p-8'
    >
      <h2 className='text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2'>
        <BiCreditCard className='text-blue-600' />
        Payment Method
      </h2>

      <div className='mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-3'>
        <BiLock className='text-blue-600 text-2xl' />
        <p className='text-sm text-blue-800'>
          Your payment information is encrypted and secure
        </p>
      </div>

      {/* Payment Method Selection */}
      <div className='mb-6'>
        <label className='block text-sm font-semibold text-gray-700 mb-3'>
          Select Payment Method *
        </label>
        <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
          <button
            type='button'
            onClick={() => setPaymentValue('paymentMethod', 'card')}
            className={`p-4 border-2 rounded-xl transition-all ${
              paymentMethod === 'card'
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-300 hover:border-blue-400'
            }`}
          >
            <BiCreditCard className='text-3xl mx-auto mb-2 text-blue-600' />
            <p className='font-bold text-sm'>Credit/Debit Card</p>
            <p className='text-xs text-gray-600 mt-1'>Visa, MasterCard</p>
          </button>

          <button
            type='button'
            onClick={() => setPaymentValue('paymentMethod', 'cash')}
            className={`p-4 border-2 rounded-xl transition-all ${
              paymentMethod === 'cash'
                ? 'border-green-600 bg-green-50'
                : 'border-gray-300 hover:border-green-400'
            }`}
          >
            <span className='text-3xl block mx-auto mb-2'>💵</span>
            <p className='font-bold text-sm'>Cash on Delivery</p>
            <p className='text-xs text-gray-600 mt-1'>Pay when delivered</p>
          </button>

          <button
            type='button'
            onClick={() => setPaymentValue('paymentMethod', 'insurance')}
            className={`p-4 border-2 rounded-xl transition-all ${
              paymentMethod === 'insurance'
                ? 'border-purple-600 bg-purple-50'
                : 'border-gray-300 hover:border-purple-400'
            }`}
          >
            <span className='text-3xl block mx-auto mb-2'>🏥</span>
            <p className='font-bold text-sm'>Insurance</p>
            <p className='text-xs text-gray-600 mt-1'>Health insurance</p>
          </button>
        </div>
        {errors.paymentMethod && (
          <p className='text-red-600 text-xs mt-2'>
            {errors.paymentMethod.message}
          </p>
        )}
      </div>

      {/* Card Payment Fields */}
      {paymentMethod === 'card' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className='space-y-4'
        >
          <div>
            <label className='block text-sm font-semibold text-gray-700 mb-2'>
              Card Number *
            </label>
            <input
              {...register('cardNumber')}
              onChange={handleCardNumberChange}
              maxLength={19}
              className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                errors.cardNumber ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder='1234 5678 9012 3456'
            />
            {errors.cardNumber && (
              <p className='text-red-600 text-xs mt-1'>
                {errors.cardNumber.message}
              </p>
            )}
          </div>

          <div>
            <label className='block text-sm font-semibold text-gray-700 mb-2'>
              Cardholder Name *
            </label>
            <input
              {...register('cardName')}
              className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                errors.cardName ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder='JOHN DOE'
            />
            {errors.cardName && (
              <p className='text-red-600 text-xs mt-1'>
                {errors.cardName.message}
              </p>
            )}
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div>
              <label className='block text-sm font-semibold text-gray-700 mb-2'>
                Expiry Date *
              </label>
              <input
                {...register('expiryDate')}
                onChange={handleExpiryChange}
                className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                  errors.expiryDate ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder='MM/YY'
              />
              {errors.expiryDate && (
                <p className='text-red-600 text-xs mt-1'>
                  {errors.expiryDate.message}
                </p>
              )}
            </div>

            <div>
              <label className='block text-sm font-semibold text-gray-700 mb-2'>
                CVV *
              </label>
              <input
                {...register('cvv')}
                onChange={handleCVVChange}
                type='password'
                maxLength={3}
                className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                  errors.cvv ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder='123'
              />
              {errors.cvv && (
                <p className='text-red-600 text-xs mt-1'>
                  {errors.cvv.message}
                </p>
              )}
            </div>
          </div>

          <div className='flex items-center gap-2 p-3 bg-gray-50 rounded-lg'>
            <div className='flex gap-2'>
              <div className='w-10 h-7 bg-blue-600 rounded'></div>
              <div className='w-10 h-7 bg-red-600 rounded'></div>
            </div>
            <p className='text-xs text-gray-600'>
              We accept Visa, MasterCard, and American Express
            </p>
          </div>
        </motion.div>
      )}

      {/* Cash on Delivery Info */}
      {paymentMethod === 'cash' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className='p-6 bg-green-50 border-2 border-green-300 rounded-xl'
        >
          <h3 className='font-bold text-green-900 mb-2 flex items-center gap-2'>
            ✅ Cash on Delivery Selected
          </h3>
          <p className='text-sm text-green-800'>
            You will pay in cash when your order is delivered to your address.
            Please keep the exact amount ready for a smooth delivery experience.
          </p>
          <p className='text-sm text-green-800 mt-2 font-semibold'>
            Total Amount: LKR {total.toFixed(2)}
          </p>
          <div className='mt-4 p-3 bg-green-100 rounded-lg'>
            <p className='text-xs text-green-900'>
              <strong>Note:</strong> Delivery personnel will carry a POS machine
              for card payments if you change your mind.
            </p>
          </div>
        </motion.div>
      )}

      {/* Insurance Fields */}
      {paymentMethod === 'insurance' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className='space-y-4'
        >
          <div>
            <label className='block text-sm font-semibold text-gray-700 mb-2'>
              Insurance Provider *
            </label>
            <select
              {...register('insuranceProvider')}
              className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                errors.insuranceProvider ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value=''>Select provider</option>
              <option value='Aetna Sri Lanka'>Aetna Sri Lanka</option>
              <option value='Union Assurance'>Union Assurance</option>
              <option value='Ceylinco Insurance'>Ceylinco Insurance</option>
              <option value='AIA Insurance'>AIA Insurance</option>
              <option value='Other'>Other</option>
            </select>
            {errors.insuranceProvider && (
              <p className='text-red-600 text-xs mt-1'>
                {errors.insuranceProvider.message}
              </p>
            )}
          </div>

          <div>
            <label className='block text-sm font-semibold text-gray-700 mb-2'>
              Policy Number *
            </label>
            <input
              {...register('insurancePolicyNumber')}
              className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                errors.insurancePolicyNumber
                  ? 'border-red-500'
                  : 'border-gray-300'
              }`}
              placeholder='Enter your policy number'
            />
            {errors.insurancePolicyNumber && (
              <p className='text-red-600 text-xs mt-1'>
                {errors.insurancePolicyNumber.message}
              </p>
            )}
          </div>

          <div className='p-4 bg-purple-50 border border-purple-200 rounded-xl'>
            <p className='text-sm text-purple-800'>
              <strong>Note:</strong> Insurance claims will be processed after
              delivery. You may need to provide additional documentation such as
              doctor&lsquo;s prescription and medical reports.
            </p>
          </div>
        </motion.div>
      )}

      {/* Action Buttons */}
      <div className='flex gap-4 mt-6'>
        <button
          onClick={onBack}
          className='flex-1 bg-gray-200 text-gray-800 py-4 rounded-xl font-bold hover:bg-gray-300 transition-colors'
        >
          Back
        </button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onSubmit}
          disabled={isProcessing}
          className='flex-1 bg-linear-to-r from-green-600 to-green-700 text-white py-4 rounded-xl font-bold hover:from-green-700 hover:to-green-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2'
        >
          {isProcessing ? (
            <>
              <div className='animate-spin rounded-full h-5 w-5 border-b-2 border-white'></div>
              Processing...
            </>
          ) : (
            <>
              <BiLock />
              Place Order ${total.toFixed(2)}
            </>
          )}
        </motion.button>
      </div>
    </motion.div>
  );
}

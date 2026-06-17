/* eslint-disable no-undef */
import { useState } from 'react';
import {
  FiAlertCircle,
  FiCheck,
  FiEye,
  FiEyeOff,
  FiKey,
  FiLock,
} from 'react-icons/fi';
import { motion } from 'framer-motion';

export function ChangePassword() {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await fetch('/api/profile/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        setMessage({ type: 'success', text: 'Password changed successfully!' });
        setFormData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      } else {
        setMessage({
          type: 'error',
          text: result.error || 'Failed to change password',
        });
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to change password' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className='bg-white rounded-xl shadow-md p-6'>
      <div className='flex items-center gap-3 mb-6'>
        <div className='w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center'>
          <FiKey className='w-5 h-5 text-green-600' />
        </div>
        <div>
          <h2 className='text-2xl font-bold text-gray-900'>Change Password</h2>
          <p className='text-sm text-gray-600'>
            Update your password to keep your account secure
          </p>
        </div>
      </div>

      {message.text && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
            message.type === 'success'
              ? 'bg-green-50 border-l-4 border-green-500'
              : 'bg-red-50 border-l-4 border-red-500'
          }`}
        >
          {message.type === 'success' ? (
            <FiCheck className='w-5 h-5 text-green-600' />
          ) : (
            <FiAlertCircle className='w-5 h-5 text-red-600' />
          )}
          <p
            className={
              message.type === 'success' ? 'text-green-800' : 'text-red-800'
            }
          >
            {message.text}
          </p>
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className='space-y-6'>
        {/* Current Password */}
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-2'>
            Current Password
          </label>
          <div className='relative'>
            <input
              type={showPasswords.current ? 'text' : 'password'}
              value={formData.currentPassword}
              onChange={e =>
                setFormData({ ...formData, currentPassword: e.target.value })
              }
              className='w-full px-4 py-3 pr-12 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500'
              placeholder='Enter current password'
              required
            />
            <button
              type='button'
              onClick={() =>
                setShowPasswords({
                  ...showPasswords,
                  current: !showPasswords.current,
                })
              }
              className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700'
            >
              {showPasswords.current ? (
                <FiEyeOff className='w-5 h-5' />
              ) : (
                <FiEye className='w-5 h-5' />
              )}
            </button>
          </div>
        </div>

        {/* New Password */}
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-2'>
            New Password
          </label>
          <div className='relative'>
            <input
              type={showPasswords.new ? 'text' : 'password'}
              value={formData.newPassword}
              onChange={e =>
                setFormData({ ...formData, newPassword: e.target.value })
              }
              className='w-full px-4 py-3 pr-12 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500'
              placeholder='Enter new password'
              required
            />
            <button
              type='button'
              onClick={() =>
                setShowPasswords({ ...showPasswords, new: !showPasswords.new })
              }
              className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700'
            >
              {showPasswords.new ? (
                <FiEyeOff className='w-5 h-5' />
              ) : (
                <FiEye className='w-5 h-5' />
              )}
            </button>
          </div>
          <p className='text-xs text-gray-500 mt-1'>
            Must be at least 8 characters with uppercase, lowercase, number, and
            special character
          </p>
        </div>

        {/* Confirm Password */}
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-2'>
            Confirm New Password
          </label>
          <div className='relative'>
            <input
              type={showPasswords.confirm ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={e =>
                setFormData({ ...formData, confirmPassword: e.target.value })
              }
              className='w-full px-4 py-3 pr-12 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500'
              placeholder='Confirm new password'
              required
            />
            <button
              type='button'
              onClick={() =>
                setShowPasswords({
                  ...showPasswords,
                  confirm: !showPasswords.confirm,
                })
              }
              className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700'
            >
              {showPasswords.confirm ? (
                <FiEyeOff className='w-5 h-5' />
              ) : (
                <FiEye className='w-5 h-5' />
              )}
            </button>
          </div>
        </div>

        <div className='flex justify-end'>
          <button
            type='submit'
            disabled={isSubmitting}
            className='inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium shadow-lg shadow-green-600/30 disabled:opacity-50'
          >
            <FiLock className='w-4 h-4' />
            {isSubmitting ? 'Changing...' : 'Change Password'}
          </button>
        </div>
      </form>
    </div>
  );
}

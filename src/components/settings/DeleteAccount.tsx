import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import {
  FiAlertCircle,
  FiCheck,
  FiEye,
  FiEyeOff,
  FiTrash2,
} from 'react-icons/fi';

export function DeleteAccount() {
  const [formData, setFormData] = useState({
    password: '',
    confirmText: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleDelete = async () => {
    setIsDeleting(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await fetch('/api/profile/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        setMessage({
          type: 'success',
          text: 'Account deleted successfully. Redirecting...',
        });
        setTimeout(() => {
          window.location.href = '/auth/signin';
        }, 2000);
      } else {
        setMessage({
          type: 'error',
          text: result.error || 'Failed to delete account',
        });
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete account' });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className='bg-white rounded-xl shadow-md p-6 border-2 border-red-200'>
        <div className='flex items-center gap-3 mb-6'>
          <div className='w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center'>
            <FiTrash2 className='w-5 h-5 text-red-600' />
          </div>
          <div>
            <h2 className='text-2xl font-bold text-gray-900'>Delete Account</h2>
            <p className='text-sm text-red-600'>This action cannot be undone</p>
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

        <div className='bg-red-50 border border-red-200 rounded-lg p-4 mb-6'>
          <h3 className='font-semibold text-red-900 mb-2'>Warning</h3>
          <ul className='text-sm text-red-700 space-y-1 list-disc list-inside'>
            <li>All your data will be permanently deleted</li>
            <li>Your appointments will be cancelled</li>
            <li>You will lose access to your medical records</li>
            <li>This action cannot be reversed</li>
          </ul>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className='w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium shadow-lg shadow-red-600/30'
        >
          <FiTrash2 className='w-4 h-4' />
          Delete My Account
        </button>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showModal && (
          <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50'>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className='bg-white rounded-2xl shadow-2xl max-w-md w-full p-6'
            >
              <div className='flex items-center gap-3 mb-4'>
                <div className='w-12 h-12 bg-red-100 rounded-full flex items-center justify-center'>
                  <FiAlertCircle className='w-6 h-6 text-red-600' />
                </div>
                <h3 className='text-xl font-bold text-gray-900'>
                  Confirm Account Deletion
                </h3>
              </div>

              <p className='text-gray-600 mb-6'>
                This action is permanent and cannot be undone. Please confirm by
                entering your password and typing <strong>DELETE</strong> below.
              </p>

              <div className='space-y-4 mb-6'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Password
                  </label>
                  <div className='relative'>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={e =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      className='w-full px-4 py-3 pr-12 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-500'
                      placeholder='Enter your password'
                    />
                    <button
                      type='button'
                      onClick={() => setShowPassword(!showPassword)}
                      className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700'
                    >
                      {showPassword ? (
                        <FiEyeOff className='w-5 h-5' />
                      ) : (
                        <FiEye className='w-5 h-5' />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Type &quot;DELETE&quot; to confirm
                  </label>
                  <input
                    type='text'
                    value={formData.confirmText}
                    onChange={e =>
                      setFormData({ ...formData, confirmText: e.target.value })
                    }
                    className='w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-500'
                    placeholder='Type DELETE'
                  />
                </div>
              </div>

              <div className='flex gap-3'>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setFormData({ password: '', confirmText: '' });
                  }}
                  className='flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium'
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={
                    isDeleting ||
                    !formData.password ||
                    formData.confirmText !== 'DELETE'
                  }
                  className='flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50'
                >
                  {isDeleting ? 'Deleting...' : 'Delete Account'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { FiAlertCircle, FiCheck, FiSave, FiShield } from 'react-icons/fi';

export function PrivacySettings() {
  const [settings, setSettings] = useState({
    profileVisibility: 'contacts',
    showOnlineStatus: true,
    allowMessaging: 'everyone',
    dataSharing: false,
    analytics: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/profile/privacy-settings');
      const result = await response.json();
      if (result.success) {
        setSettings(result.data);
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load settings' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await fetch('/api/profile/privacy-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      const result = await response.json();

      if (result.success) {
        setMessage({ type: 'success', text: 'Settings saved successfully!' });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to save' });
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className='flex items-center justify-center py-12'>
        <div className='w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin'></div>
      </div>
    );
  }

  return (
    <div className='bg-white rounded-xl shadow-md p-6'>
      <div className='flex items-center gap-3 mb-6'>
        <div className='w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center'>
          <FiShield className='w-5 h-5 text-purple-600' />
        </div>
        <div>
          <h2 className='text-2xl font-bold text-gray-900'>Privacy Settings</h2>
          <p className='text-sm text-gray-600'>
            Control your privacy and data preferences
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

      <div className='space-y-6 mb-6'>
        {/* Profile Visibility */}
        <div className='p-4 border border-gray-200 rounded-lg'>
          <label className='block font-medium text-gray-900 mb-2'>
            Profile Visibility
          </label>
          <select
            value={settings.profileVisibility}
            onChange={e =>
              setSettings({ ...settings, profileVisibility: e.target.value })
            }
            className='w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500'
          >
            <option value='public'>Public - Anyone can view</option>
            <option value='contacts'>Contacts Only</option>
            <option value='private'>Private - Only me</option>
          </select>
        </div>

        {/* Show Online Status */}
        <div className='flex items-center justify-between p-4 border border-gray-200 rounded-lg'>
          <div>
            <h3 className='font-medium text-gray-900'>Show Online Status</h3>
            <p className='text-sm text-gray-600'>
              Let others see when you&apos;re online
            </p>
          </div>
          <button
            onClick={() =>
              setSettings({
                ...settings,
                showOnlineStatus: !settings.showOnlineStatus,
              })
            }
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.showOnlineStatus ? 'bg-blue-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.showOnlineStatus ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Allow Messaging */}
        <div className='p-4 border border-gray-200 rounded-lg'>
          <label className='block font-medium text-gray-900 mb-2'>
            Who Can Message You
          </label>
          <select
            value={settings.allowMessaging}
            onChange={e =>
              setSettings({ ...settings, allowMessaging: e.target.value })
            }
            className='w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500'
          >
            <option value='everyone'>Everyone</option>
            <option value='contacts'>Contacts Only</option>
            <option value='none'>No One</option>
          </select>
        </div>

        {/* Data Sharing */}
        <div className='flex items-center justify-between p-4 border border-gray-200 rounded-lg'>
          <div>
            <h3 className='font-medium text-gray-900'>Data Sharing</h3>
            <p className='text-sm text-gray-600'>
              Share anonymized data for research
            </p>
          </div>
          <button
            onClick={() =>
              setSettings({ ...settings, dataSharing: !settings.dataSharing })
            }
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.dataSharing ? 'bg-blue-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.dataSharing ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Analytics */}
        <div className='flex items-center justify-between p-4 border border-gray-200 rounded-lg'>
          <div>
            <h3 className='font-medium text-gray-900'>Usage Analytics</h3>
            <p className='text-sm text-gray-600'>
              Help improve the app with usage data
            </p>
          </div>
          <button
            onClick={() =>
              setSettings({ ...settings, analytics: !settings.analytics })
            }
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.analytics ? 'bg-blue-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.analytics ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      <div className='flex justify-end'>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className='inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium shadow-lg shadow-purple-600/30 disabled:opacity-50'
        >
          <FiSave className='w-4 h-4' />
          {isSaving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Loading from '@/components/Loading';
import Link from 'next/link';
import ErrorComponent from '@/components/Error';
import Image from 'next/image';
import {
  FiUser,
  FiSave,
  FiArrowLeft,
  FiAlertCircle,
  FiRefreshCw,
  FiShield,
  FiCheckCircle,
} from 'react-icons/fi';

interface User {
  _id: string;
  name?: string;
  email?: string;
  phone?: string;
  image?: string;
  role?: string;
  status?: string;
  isEmailVerified?: boolean;
}

interface FormData {
  name: string;
  phone: string;
  image: string;
  role: string;
  status: string;
  isEmailVerified: boolean;
}

export default function UserEditPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params?.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState<FormData>({
    name: '',
    phone: '',
    image: '',
    role: 'PATIENT',
    status: 'ACTIVE',
    isEmailVerified: false,
  });

  const [formErrors, setFormErrors] = useState<Partial<FormData>>({});

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/admin/users/${userId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch user');
        }

        setUser(data.data);
        setFormData({
          name: data.data.name || '',
          phone: data.data.phone || '',
          image: data.data.image || '',
          role: data.data.role || 'PATIENT',
          status: data.data.status || 'ACTIVE',
          isEmailVerified: data.data.isEmailVerified || false,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUser();
    }
  }, [userId]);

  const validateForm = (): boolean => {
    const errors: Partial<FormData> = {};

    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }

    if (!formData.role) {
      errors.role = 'Role is required';
    }

    if (!formData.status) {
      errors.status = 'Status is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);

      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update user');
      }

      setSuccessMessage('User updated successfully!');
      setTimeout(() => {
        router.push(`/admin/users/${userId}`);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked =
      type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    // Clear error for this field
    if (formErrors[name as keyof FormData]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  if (loading) {
    return <Loading />;
  }

  if (error && !user) {
    return <ErrorComponent message={error} />;
  }

  return (
    <div className='min-h-screen bg-gray-50 p-6'>
      <div className='max-w-4xl mx-auto'>
        {/* Header */}
        <div className='mb-6'>
          <Link href={`/admin/users/${userId}`}>
            <button className='flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4'>
              <FiArrowLeft className='w-5 h-5' />
              Back to User Details
            </button>
          </Link>

          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-3xl font-bold text-gray-900 flex items-center gap-2'>
                <FiUser className='w-8 h-8' />
                Edit User
              </h1>
              <p className='text-gray-600 mt-1'>
                Update user information and settings
              </p>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className='mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3'>
            <FiCheckCircle className='w-5 h-5 text-green-600' />
            <p className='text-green-800'>{successMessage}</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className='mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3'>
            <FiAlertCircle className='w-5 h-5 text-red-600' />
            <p className='text-red-800'>{error}</p>
          </div>
        )}

        {/* Edit Form */}
        <form onSubmit={handleSubmit} className='space-y-6'>
          {/* Basic Information Card */}
          <div className='bg-white rounded-lg shadow p-6'>
            <h2 className='text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2'>
              <FiUser className='w-6 h-6' />
              Basic Information
            </h2>

            <div className='space-y-4'>
              {/* Current User Info */}
              <div className='p-4 bg-gray-50 rounded-lg'>
                <div className='flex items-center gap-4'>
                  {user?.image ? (
                    <Image
                      className='h-16 w-16 rounded-full object-cover'
                      src={user.image}
                      alt={user.name || 'User'}
                      width={64}
                      height={64}
                    />
                  ) : (
                    <div className='h-16 w-16 rounded-full bg-gray-300 flex items-center justify-center'>
                      <span className='text-2xl text-gray-600 font-medium'>
                        {user?.name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className='font-medium text-gray-900'>{user?.name}</p>
                    <p className='text-sm text-gray-600'>{user?.email}</p>
                    <p className='text-xs text-gray-500'>ID: {user?._id}</p>
                  </div>
                </div>
              </div>

              {/* Name */}
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Full Name *
                </label>
                <input
                  type='text'
                  name='name'
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    formErrors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder='Enter full name'
                />
                {formErrors.name && (
                  <p className='mt-1 text-sm text-red-600'>{formErrors.name}</p>
                )}
              </div>

              {/* Email (Read-only) */}
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Email Address
                </label>
                <input
                  type='email'
                  value={user?.email || ''}
                  disabled
                  className='w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed'
                  placeholder='Email cannot be changed'
                />
                <p className='mt-1 text-xs text-gray-500'>
                  Email addresses cannot be modified
                </p>
              </div>

              {/* Phone */}
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Phone Number
                </label>
                <input
                  type='tel'
                  name='phone'
                  value={formData.phone}
                  onChange={handleInputChange}
                  className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                  placeholder='Enter phone number'
                />
              </div>

              {/* Image URL */}
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Profile Image URL
                </label>
                <input
                  type='url'
                  name='image'
                  value={formData.image}
                  onChange={handleInputChange}
                  className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                  placeholder='https://example.com/image.jpg'
                />
                {formData.image && (
                  <div className='mt-2'>
                    <Image
                      src={formData.image}
                      alt='Preview'
                      width={80}
                      height={80}
                      className='h-20 w-20 rounded-full object-cover'
                      onError={e => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Account Settings Card */}
          <div className='bg-white rounded-lg shadow p-6'>
            <h2 className='text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2'>
              <FiShield className='w-6 h-6' />
              Account Settings
            </h2>

            <div className='space-y-4'>
              {/* Role */}
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Role *
                </label>
                <select
                  name='role'
                  value={formData.role}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    formErrors.role ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value='ADMIN'>Admin</option>
                  <option value='DOCTOR'>Doctor</option>
                  <option value='PATIENT'>Patient</option>
                  <option value='NURSE'>Nurse</option>
                  <option value='RECEPTIONIST'>Receptionist</option>
                  <option value='PHARMACIST'>Pharmacist</option>
                </select>
                {formErrors.role && (
                  <p className='mt-1 text-sm text-red-600'>{formErrors.role}</p>
                )}
                <p className='mt-1 text-xs text-gray-500'>
                  Changing the role will create/delete role-specific profiles
                </p>
              </div>

              {/* Status */}
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Status *
                </label>
                <select
                  name='status'
                  value={formData.status}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    formErrors.status ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value='ACTIVE'>Active</option>
                  <option value='INACTIVE'>Inactive</option>
                  <option value='SUSPENDED'>Suspended</option>
                </select>
                {formErrors.status && (
                  <p className='mt-1 text-sm text-red-600'>
                    {formErrors.status}
                  </p>
                )}
              </div>

              {/* Email Verified */}
              <div className='flex items-center gap-3'>
                <input
                  type='checkbox'
                  id='isEmailVerified'
                  name='isEmailVerified'
                  checked={formData.isEmailVerified}
                  onChange={handleInputChange}
                  className='w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500'
                />
                <label
                  htmlFor='isEmailVerified'
                  className='text-sm font-medium text-gray-700'
                >
                  Email Verified
                </label>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className='flex items-center justify-between bg-white rounded-lg shadow p-6'>
            <Link href={`/admin/users/${userId}`}>
              <button
                type='button'
                className='px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition'
              >
                Cancel
              </button>
            </Link>

            <button
              type='submit'
              disabled={saving}
              className='flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed'
            >
              {saving ? (
                <>
                  <FiRefreshCw className='w-5 h-5 animate-spin' />
                  Saving...
                </>
              ) : (
                <>
                  <FiSave className='w-5 h-5' />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>

        {/* Warning Message */}
        <div className='mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg'>
          <div className='flex items-start gap-3'>
            <FiAlertCircle className='w-5 h-5 text-yellow-600 shrink-0 mt-0.5' />
            <div>
              <h3 className='text-sm font-semibold text-yellow-800 mb-1'>
                Important Notes
              </h3>
              <ul className='text-sm text-yellow-700 space-y-1 list-disc list-inside'>
                <li>Email addresses cannot be changed for security reasons</li>
                <li>
                  Changing the role will automatically create or delete
                  role-specific profiles
                </li>
                <li>
                  Suspending or deactivating a user will prevent them from
                  logging in
                </li>
                <li>All changes are logged for audit purposes</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

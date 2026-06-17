'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  FiUser,
  FiMail,
  FiLock,
  FiUserPlus,
  FiArrowLeft,
  FiAlertCircle,
  FiCheckCircle,
} from 'react-icons/fi';

type UserRole = 'PATIENT' | 'DOCTOR' | 'RECEPTIONIST' | 'ADMIN';

interface FormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: UserRole;
}

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  role?: string;
  general?: string;
}

export default function CreateUserPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'PATIENT',
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])/.test(formData.password)) {
      newErrors.password =
        'Password must contain at least one lowercase letter';
    } else if (!/(?=.*[A-Z])/.test(formData.password)) {
      newErrors.password =
        'Password must contain at least one uppercase letter';
    } else if (!/(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one number';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Role validation
    if (!formData.role) {
      newErrors.role = 'Role is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for this field when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
          role: formData.role,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create user');
      }

      setSuccess(true);

      // Redirect to users list after 2 seconds
      setTimeout(() => {
        router.push('/admin/users');
      }, 2000);
    } catch (err) {
      setErrors({
        general: err instanceof Error ? err.message : 'An error occurred',
      });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center p-6'>
        <div className='bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center'>
          <div className='flex justify-center mb-4'>
            <FiCheckCircle className='w-16 h-16 text-green-600' />
          </div>
          <h2 className='text-2xl font-bold text-gray-900 mb-2'>
            User Created Successfully!
          </h2>
          <p className='text-gray-600 mb-4'>
            The user has been created and can now log in to the system.
          </p>
          <p className='text-sm text-gray-500'>Redirecting to users list...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50 p-6'>
      <div className='max-w-3xl mx-auto'>
        <div className='mb-6'>
          <Link href='/admin/users'>
            <button className='flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4'>
              <FiArrowLeft className='w-5 h-5' />
              Back to Users
            </button>
          </Link>

          <h1 className='text-3xl font-bold text-gray-900 flex items-center gap-2'>
            <FiUserPlus className='w-8 h-8' />
            Create New User
          </h1>
          <p className='text-gray-600 mt-1'>Add a new user to the system</p>
        </div>

        {errors.general && (
          <div className='bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3'>
            <FiAlertCircle className='w-5 h-5 text-red-600 shrink-0 mt-0.5' />
            <div>
              <h3 className='font-semibold text-red-900'>Error</h3>
              <p className='text-sm text-red-700'>{errors.general}</p>
            </div>
          </div>
        )}

        <div className='bg-white rounded-lg shadow-lg p-6'>
          <form onSubmit={handleSubmit} className='space-y-6'>
            {/* Name Field */}
            <div>
              <label
                htmlFor='name'
                className='block text-sm font-medium text-gray-700 mb-2'
              >
                Full Name <span className='text-red-500'>*</span>
              </label>
              <div className='relative'>
                <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                  <FiUser className='h-5 w-5 text-gray-400' />
                </div>
                <input
                  type='text'
                  id='name'
                  name='name'
                  value={formData.name}
                  onChange={handleChange}
                  className={`block w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.name ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder='John Doe'
                  disabled={loading}
                />
              </div>
              {errors.name && (
                <p className='mt-1 text-sm text-red-600'>{errors.name}</p>
              )}
            </div>

            {/* Email Field */}
            <div>
              <label
                htmlFor='email'
                className='block text-sm font-medium text-gray-700 mb-2'
              >
                Email Address <span className='text-red-500'>*</span>
              </label>
              <div className='relative'>
                <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                  <FiMail className='h-5 w-5 text-gray-400' />
                </div>
                <input
                  type='email'
                  id='email'
                  name='email'
                  value={formData.email}
                  onChange={handleChange}
                  className={`block w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.email
                      ? 'border-red-300 bg-red-50'
                      : 'border-gray-300'
                  }`}
                  placeholder='john@example.com'
                  disabled={loading}
                />
              </div>
              {errors.email && (
                <p className='mt-1 text-sm text-red-600'>{errors.email}</p>
              )}
            </div>

            {/* Role Field */}
            <div>
              <label
                htmlFor='role'
                className='block text-sm font-medium text-gray-700 mb-2'
              >
                User Role <span className='text-red-500'>*</span>
              </label>
              <select
                id='role'
                name='role'
                value={formData.role}
                onChange={handleChange}
                className={`block w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.role ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                disabled={loading}
              >
                <option value='PATIENT'>Patient</option>
                <option value='DOCTOR'>Doctor</option>
                <option value='RECEPTIONIST'>Receptionist</option>
                <option value='ADMIN'>Admin</option>
              </select>
              {errors.role && (
                <p className='mt-1 text-sm text-red-600'>{errors.role}</p>
              )}
              <p className='mt-1 text-sm text-gray-500'>
                {formData.role === 'PATIENT' &&
                  'Patients can book appointments and manage their medical records.'}
                {formData.role === 'DOCTOR' &&
                  'Doctors can view appointments and manage patient consultations.'}
                {formData.role === 'RECEPTIONIST' &&
                  'Receptionists can manage appointments and assist patients.'}
                {formData.role === 'ADMIN' &&
                  'Admins have full access to all system features.'}
              </p>
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor='password'
                className='block text-sm font-medium text-gray-700 mb-2'
              >
                Password <span className='text-red-500'>*</span>
              </label>
              <div className='relative'>
                <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                  <FiLock className='h-5 w-5 text-gray-400' />
                </div>
                <input
                  type='password'
                  id='password'
                  name='password'
                  value={formData.password}
                  onChange={handleChange}
                  className={`block w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.password
                      ? 'border-red-300 bg-red-50'
                      : 'border-gray-300'
                  }`}
                  placeholder='••••••••'
                  disabled={loading}
                />
              </div>
              {errors.password && (
                <p className='mt-1 text-sm text-red-600'>{errors.password}</p>
              )}
              <p className='mt-1 text-sm text-gray-500'>
                Must be at least 8 characters with uppercase, lowercase, and
                numbers.
              </p>
            </div>

            {/* Confirm Password Field */}
            <div>
              <label
                htmlFor='confirmPassword'
                className='block text-sm font-medium text-gray-700 mb-2'
              >
                Confirm Password <span className='text-red-500'>*</span>
              </label>
              <div className='relative'>
                <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                  <FiLock className='h-5 w-5 text-gray-400' />
                </div>
                <input
                  type='password'
                  id='confirmPassword'
                  name='confirmPassword'
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`block w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.confirmPassword
                      ? 'border-red-300 bg-red-50'
                      : 'border-gray-300'
                  }`}
                  placeholder='••••••••'
                  disabled={loading}
                />
              </div>
              {errors.confirmPassword && (
                <p className='mt-1 text-sm text-red-600'>
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <div className='flex items-center gap-4 pt-4'>
              <button
                type='submit'
                disabled={loading}
                className='flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 disabled:opacity-50 disabled:cursor-not-allowed font-medium'
              >
                {loading ? (
                  <>
                    <div className='animate-spin rounded-full h-5 w-5 border-b-2 border-white'></div>
                    Creating User...
                  </>
                ) : (
                  <>
                    <FiUserPlus className='w-5 h-5' />
                    Create User
                  </>
                )}
              </button>

              <Link href='/admin/users'>
                <button
                  type='button'
                  disabled={loading}
                  className='px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:ring-4 focus:ring-gray-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium'
                >
                  Cancel
                </button>
              </Link>
            </div>
          </form>
        </div>

        {/* Information Box */}
        <div className='mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4'>
          <div className='flex items-start gap-3'>
            <FiAlertCircle className='w-5 h-5 text-blue-600 shrink-0 mt-0.5' />
            <div>
              <h3 className='font-semibold text-blue-900 mb-1'>
                Important Information
              </h3>
              <ul className='text-sm text-blue-700 space-y-1'>
                <li>• The user will receive their credentials via email</li>
                <li>• They will be required to verify their email address</li>
                <li>• Initial password should be changed on first login</li>
                <li>• Role-specific profiles will be created automatically</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  FiArrowLeft,
  FiSave,
  FiUser,
  FiMapPin,
  FiPhone,
  FiAlertCircle,
  FiLoader,
} from 'react-icons/fi';
import Loading from '@/components/ui/Loading';
import Toast from '@/components/ui/Toast';

interface PatientProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  bloodType: string;
  maritalStatus: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
    email: string;
  };
  allergies: string[];
  medications: string[];
  medicalHistory: string;
}

export default function EditPatientProfilePage() {
  const router = useRouter();
  const { data: _session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<PatientProfile>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    bloodType: '',
    maritalStatus: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: '',
    },
    emergencyContact: {
      name: '',
      phone: '',
      relationship: '',
      email: '',
    },
    allergies: [],
    medications: [],
    medicalHistory: '',
  });

  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({
    show: false,
    message: '',
    type: 'info',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated') {
      fetchProfile();
    }
  }, [status, router]);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/patients/profile');
      if (!response.ok) throw new Error('Failed to fetch profile');
      const result = await response.json();

      if (result.success && result.data) {
        const data = result.data;
        setFormData({
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          email: data.email || '',
          phone: data.phone || '',
          dateOfBirth: data.dateOfBirth
            ? new Date(data.dateOfBirth).toISOString().split('T')[0]
            : '',
          gender: data.gender || '',
          bloodType: data.bloodType || '',
          maritalStatus: data.maritalStatus || '',
          address: {
            street: data.address?.street || '',
            city: data.address?.city || '',
            state: data.address?.state || '',
            zipCode: data.address?.zipCode || '',
            country: data.address?.country || '',
          },
          emergencyContact: {
            name: data.emergencyContact?.name || '',
            phone: data.emergencyContact?.phone || '',
            relationship: data.emergencyContact?.relationship || '',
            email: data.emergencyContact?.email || '',
          },
          allergies: data.allergies || [],
          medications: data.medications || [],
          medicalHistory: data.medicalHistory || '',
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ...(prev as any)[parent],
          [child]: value,
        },
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/patients/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to update profile');
      }

      setToast({
        show: true,
        message: 'Profile updated successfully',
        type: 'success',
      });

      setTimeout(() => {
        router.push('/profile');
      }, 1500);
    } catch (error) {
      console.error('Error updating profile:', error);
      setError(
        error instanceof Error ? error.message : 'Failed to update profile'
      );
      setToast({
        show: true,
        message: 'Failed to update profile',
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className='min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8'>
      <div className='max-w-4xl mx-auto'>
        <div className='mb-8 flex items-center justify-between'>
          <div>
            <h1 className='text-3xl font-bold text-gray-900'>Edit Profile</h1>
            <p className='mt-2 text-gray-600'>
              Update your personal and medical information
            </p>
          </div>
          <button
            onClick={() => router.back()}
            className='flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors'
          >
            <FiArrowLeft className='w-5 h-5' />
            Back
          </button>
        </div>

        {error && (
          <div className='mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700'>
            <FiAlertCircle className='w-5 h-5 shrink-0' />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className='space-y-6'>
          {/* Personal Information */}
          <div className='bg-white shadow rounded-xl overflow-hidden'>
            <div className='px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center gap-3'>
              <FiUser className='w-5 h-5 text-blue-600' />
              <h2 className='text-lg font-semibold text-gray-900'>
                Personal Information
              </h2>
            </div>
            <div className='p-6 grid grid-cols-1 md:grid-cols-2 gap-6'>
              {/* ... (Fields for Personal Info) ... */}
              {/* I'll include the full form fields here for completeness */}
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  First Name
                </label>
                <input
                  type='text'
                  name='firstName'
                  value={formData.firstName}
                  onChange={handleChange}
                  className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  required
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Last Name
                </label>
                <input
                  type='text'
                  name='lastName'
                  value={formData.lastName}
                  onChange={handleChange}
                  className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  required
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Email
                </label>
                <input
                  type='email'
                  name='email'
                  value={formData.email}
                  disabled
                  className='w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Phone
                </label>
                <input
                  type='tel'
                  name='phone'
                  value={formData.phone}
                  onChange={handleChange}
                  className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Date of Birth
                </label>
                <input
                  type='date'
                  name='dateOfBirth'
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Gender
                </label>
                <select
                  name='gender'
                  value={formData.gender}
                  onChange={handleChange}
                  className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                >
                  <option value=''>Select Gender</option>
                  <option value='MALE'>Male</option>
                  <option value='FEMALE'>Female</option>
                  <option value='OTHER'>Other</option>
                </select>
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Marital Status
                </label>
                <select
                  name='maritalStatus'
                  value={formData.maritalStatus}
                  onChange={handleChange}
                  className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                >
                  <option value=''>Select Status</option>
                  <option value='SINGLE'>Single</option>
                  <option value='MARRIED'>Married</option>
                  <option value='DIVORCED'>Divorced</option>
                  <option value='WIDOWED'>Widowed</option>
                </select>
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Blood Type
                </label>
                <select
                  name='bloodType'
                  value={formData.bloodType}
                  onChange={handleChange}
                  className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                >
                  <option value=''>Select Blood Type</option>
                  <option value='A+'>A+</option>
                  <option value='A-'>A-</option>
                  <option value='B+'>B+</option>
                  <option value='B-'>B-</option>
                  <option value='AB+'>AB+</option>
                  <option value='AB-'>AB-</option>
                  <option value='O+'>O+</option>
                  <option value='O-'>O-</option>
                </select>
              </div>
            </div>
          </div>

          {/* Address */}
          <div className='bg-white shadow rounded-xl overflow-hidden'>
            <div className='px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center gap-3'>
              <FiMapPin className='w-5 h-5 text-green-600' />
              <h2 className='text-lg font-semibold text-gray-900'>Address</h2>
            </div>
            <div className='p-6 grid grid-cols-1 md:grid-cols-2 gap-6'>
              <div className='md:col-span-2'>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Street Address
                </label>
                <input
                  type='text'
                  name='address.street'
                  value={formData.address.street}
                  onChange={handleChange}
                  className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  City
                </label>
                <input
                  type='text'
                  name='address.city'
                  value={formData.address.city}
                  onChange={handleChange}
                  className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  State/Province
                </label>
                <input
                  type='text'
                  name='address.state'
                  value={formData.address.state}
                  onChange={handleChange}
                  className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  ZIP/Postal Code
                </label>
                <input
                  type='text'
                  name='address.zipCode'
                  value={formData.address.zipCode}
                  onChange={handleChange}
                  className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Country
                </label>
                <input
                  type='text'
                  name='address.country'
                  value={formData.address.country}
                  onChange={handleChange}
                  className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                />
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          <div className='bg-white shadow rounded-xl overflow-hidden'>
            <div className='px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center gap-3'>
              <FiPhone className='w-5 h-5 text-red-600' />
              <h2 className='text-lg font-semibold text-gray-900'>
                Emergency Contact
              </h2>
            </div>
            <div className='p-6 grid grid-cols-1 md:grid-cols-2 gap-6'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Contact Name
                </label>
                <input
                  type='text'
                  name='emergencyContact.name'
                  value={formData.emergencyContact.name}
                  onChange={handleChange}
                  className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Relationship
                </label>
                <input
                  type='text'
                  name='emergencyContact.relationship'
                  value={formData.emergencyContact.relationship}
                  onChange={handleChange}
                  className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Phone Number
                </label>
                <input
                  type='tel'
                  name='emergencyContact.phone'
                  value={formData.emergencyContact.phone}
                  onChange={handleChange}
                  className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Email (Optional)
                </label>
                <input
                  type='email'
                  name='emergencyContact.email'
                  value={formData.emergencyContact.email}
                  onChange={handleChange}
                  className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                />
              </div>
            </div>
          </div>

          <div className='flex justify-end gap-4'>
            <button
              type='button'
              onClick={() => router.back()}
              className='px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors'
            >
              Cancel
            </button>
            <button
              type='submit'
              disabled={saving}
              className='px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed'
            >
              {saving ? (
                <>
                  <FiLoader className='animate-spin' />
                  Saving...
                </>
              ) : (
                <>
                  <FiSave />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(prev => ({ ...prev, show: false }))}
        />
      )}
    </div>
  );
}

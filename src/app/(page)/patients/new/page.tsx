/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PatientForm from '../Form/PatientForm';
import { IPatientFormData } from '@/types/patients';
import {
  FiArrowLeft,
  FiUserPlus,
  FiAlertCircle,
  FiCheckCircle,
} from 'react-icons/fi';

export default function NewPatientPage() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users?role=USER&limit=100');
      if (!response.ok) throw new Error('Failed to fetch users');
      const result = await response.json();
      setUsers(result.data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to load users');
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleCancel = () => {
    if (
      window.confirm(
        'Are you sure you want to cancel? Any unsaved changes will be lost.'
      )
    ) {
      router.push('/patients');
    }
  };

  const handleSubmit = async (formData: IPatientFormData) => {
    setError(null);
    setSuccess(null);

    try {
      // Prepare data for API
      const apiData = {
        ...formData,
        user: formData.userId,
        dateOfBirth: new Date(formData.dateOfBirth).toISOString(),
        insurance: {
          ...formData.insurance,
          validUntil: formData.insurance?.validUntil
            ? new Date(formData.insurance?.validUntil).toISOString()
            : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        },
        createdBy: users.length > 0 ? users[0]._id : undefined,
      };

      console.log('Sending data to API:', apiData);

      const response = await fetch('/api/admin/patient', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create patient profile');
      }

      if (result.success) {
        setSuccess('Patient created successfully!');
        setTimeout(() => {
          router.push('/patients?success=true');
        }, 2000);
      }
    } catch (error) {
      console.error('Error creating patient:', error);
      setError(
        error instanceof Error
          ? error.message
          : 'Failed to create patient profile'
      );
      throw error;
    }
  };

  return (
    <div className='min-h-screen bg-linear-to-br from-gray-50 to-blue-50 py-8'>
      <div className='max-w-6xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Header */}
        <div className='mb-8'>
          <button
            onClick={() => router.push('/patients')}
            className='inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-6 transition-colors'
          >
            <FiArrowLeft size={20} />
            <span className='font-medium'>Back to Patients</span>
          </button>

          <div className='flex items-start gap-4'>
            <div className='p-3 bg-blue-100 rounded-lg'>
              <FiUserPlus size={24} className='text-blue-600' />
            </div>
            <div>
              <h1 className='text-3xl font-bold text-gray-900'>
                Create New Patient
              </h1>
              <p className='text-gray-600 mt-2'>
                Fill in the patient information to create a new medical record
              </p>
            </div>
          </div>

          {/* Stats Overview */}
          <div className='mt-6 grid grid-cols-1 md:grid-cols-4 gap-4'>
            <div className='bg-white p-4 rounded-lg border border-gray-200 shadow-sm'>
              <p className='text-sm text-gray-600'>Required Fields</p>
              <p className='text-2xl font-bold text-gray-900'>7</p>
            </div>
            <div className='bg-white p-4 rounded-lg border border-gray-200 shadow-sm'>
              <p className='text-sm text-gray-600'>Optional Fields</p>
              <p className='text-2xl font-bold text-gray-900'>12</p>
            </div>
            <div className='bg-white p-4 rounded-lg border border-gray-200 shadow-sm'>
              <p className='text-sm text-gray-600'>Estimated Time</p>
              <p className='text-2xl font-bold text-gray-900'>5 min</p>
            </div>
            <div className='p-4 rounded-lg border border-blue-200 shadow-sm bg-blue-50'>
              <p className='text-sm text-blue-700'>Status</p>
              <p className='text-2xl font-bold text-blue-900'>Draft</p>
            </div>
          </div>
        </div>

        {/* Quick Alerts */}
        {error && (
          <div className='mb-6 p-4 bg-red-50 border border-red-200 rounded-lg'>
            <div className='flex items-center gap-3'>
              <FiAlertCircle size={20} className='text-red-600 shrink-0' />
              <div>
                <p className='font-medium text-red-800'>Error</p>
                <p className='text-red-700 mt-1'>{error}</p>
              </div>
            </div>
          </div>
        )}

        {success && (
          <div className='mb-6 p-4 bg-green-50 border border-green-200 rounded-lg'>
            <div className='flex items-center gap-3'>
              <FiCheckCircle size={20} className='text-green-600 shrink-0' />
              <div>
                <p className='font-medium text-green-800'>Success!</p>
                <p className='text-green-700 mt-1'>{success}</p>
              </div>
            </div>
          </div>
        )}

        {/* Main Form */}
        <div className='bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden'>
          <PatientForm
            users={users}
            loadingUsers={loadingUsers}
            error={error}
            success={success}
            onCancel={handleCancel}
            onSubmit={handleSubmit}
            onErrorChange={setError}
            onSuccessChange={setSuccess}
          />
        </div>

        {/* Footer Note */}
        <div className='mt-8 p-4 bg-gray-50 border border-gray-200 rounded-lg'>
          <p className='text-sm text-gray-600'>
            <strong>Note:</strong> All patient information is encrypted and
            stored securely. Required fields are marked with an asterisk (*).
            You can save and continue later by clicking &quot;Save Draft&quot;
            in the top right corner.
          </p>
        </div>
      </div>
    </div>
  );
}

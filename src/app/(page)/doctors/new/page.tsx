/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DoctorForm from '@/components/Doctor/Form/DoctorForm';
import { IDoctorFormData } from '@/types/doctors';

export default function NewDoctorPage() {
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
      router.push('/doctors');
    }
  };

  const handleSubmit = async (formData: IDoctorFormData) => {
    setError(null);
    setSuccess(null);

    try {
      const apiData = {
        userId: formData.userId,
        profile: {
          ...formData.profile,
          qualifications: formData.profile.qualifications.filter(q => q.trim()),
          languages: formData.profile.languages.filter(l => l.trim()),
          services: formData.profile.services.filter(s => s.trim()),
          awards: formData.profile.awards?.filter(a => a.trim()) || [],
          publications:
            formData.profile.publications?.filter(p => p.trim()) || [],
        },
      };

      console.log('Sending data to API:', apiData);

      const response = await fetch('/api/admin/doctor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create doctor profile');
      }

      if (result.success) {
        setSuccess('Doctor profile created successfully!');
        setTimeout(() => {
          router.push('/doctors?success=true');
        }, 2000);
      }
    } catch (error) {
      console.error('Error creating doctor:', error);
      setError(
        error instanceof Error
          ? error.message
          : 'Failed to create doctor profile'
      );
      throw error;
    }
  };

  return (
    <div className='min-h-screen bg-gray-50 py-8'>
      <div className='max-w-6xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Header */}
        <div className='mb-8'>
          <button
            onClick={() => router.push('/doctors')}
            className='text-blue-600 hover:text-blue-800 mb-4 flex items-center gap-2'
          >
            ← Back to Doctors
          </button>
          <h1 className='text-3xl font-bold text-gray-900'>
            Create New Doctor Profile
          </h1>
          <p className='text-gray-600 mt-2'>
            Fill in the information to create a new doctor profile
          </p>
        </div>

        <DoctorForm
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
    </div>
  );
}

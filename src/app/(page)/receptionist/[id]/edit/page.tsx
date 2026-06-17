/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import ReceptionistForm from '@/components/receptionist/Form/Receptionist';
import { IReceptionistFormData } from '@/types/Receptionist';
import Spinner from '@/components/ui/Spinner';

export default function EditReceptionistPage() {
  const router = useRouter();
  const params = useParams();
  const [receptionist, setReceptionist] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loadingReceptionist, setLoadingReceptionist] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (params?.id) {
      fetchReceptionist();
      fetchUsers();
    }
  }, [params?.id]);

  const fetchReceptionist = async () => {
    try {
      const response = await fetch(`/api/admin/receptionist/${params.id}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Receptionist not found');
        }
        throw new Error('Failed to fetch receptionist details');
      }

      const result = await response.json();

      if (result.success) {
        setReceptionist(result.data);
        console.log('✅ Loaded receptionist:', result.data);
      }
    } catch (error) {
      console.error('Error fetching receptionist:', error);
      setError(
        error instanceof Error
          ? error.message
          : 'Failed to load receptionist details'
      );
    } finally {
      setLoadingReceptionist(false);
    }
  };

  const fetchUsers = async () => {
    try {
      // Fetch users without receptionist profiles
      const response = await fetch('/api/users?role=USER&limit=100');

      if (!response.ok) throw new Error('Failed to fetch users');
      const result = await response.json();

      // Map users to include id field
      const mappedUsers = (result.data || []).map((user: any) => ({
        id: user._id || user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        nic: user.nic,
      }));

      setUsers(mappedUsers);
      console.log('✅ Loaded users:', mappedUsers.length);
    } catch (error) {
      console.error('Error fetching users:', error);
      // Don't set error state as this is not critical
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
      router.push('/receptionist');
    }
  };

  const handleSubmit = async (formData: IReceptionistFormData) => {
    setError(null);
    setSuccess(null);

    try {
      // Prepare data for API - only send fields that should be updated
      const apiData = {
        employeeId: formData.employeeId.toUpperCase(),
        shift: formData.shift,
        workSchedule: formData.workSchedule,
        department: formData.department,
        assignedDoctor: formData.assignedDoctor || undefined,
        maxAppointmentsPerDay: formData.maxAppointmentsPerDay || 30,
        skills: (formData.skills || []).filter((s: string) => s.trim()),
        languages: (formData.languages || []).filter((l: string) => l.trim()),
        emergencyContact: formData.emergencyContact,
        employmentStatus: formData.employmentStatus,
        employmentType: formData.employmentType,
        hireDate: formData.hireDate,
        terminationDate: formData.terminationDate || undefined,
        salary: {
          basic: formData.salary?.basic || 0,
          allowances: formData.salary?.allowances || 0,
          deductions: formData.salary?.deductions || 0,
          currency: formData.salary?.currency || 'LKR',
          paymentFrequency: formData.salary?.paymentFrequency || 'MONTHLY',
        },
        performanceMetrics: formData.performanceMetrics,
        permissions: formData.permissions,
        trainingRecords: formData.trainingRecords || [],
        notes: formData.notes || '',
      };

      console.log('📤 Updating receptionist data:', {
        id: params.id,
        employeeId: apiData.employeeId,
        shift: apiData.shift,
        department: apiData.department,
      });

      const response = await fetch(`/api/admin/receptionist/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiData),
      });

      const result = await response.json();

      console.log('📥 Server response:', {
        status: response.status,
        success: result.success,
        error: result.error,
      });

      if (!response.ok) {
        // Handle different error types
        if (response.status === 409) {
          // Conflict - duplicate found
          throw new Error(result.error || 'This employee ID already exists');
        } else if (response.status === 400) {
          // Validation error
          if (result.details && Array.isArray(result.details)) {
            const errorMessages = result.details
              .map((err: any) => `${err.field}: ${err.message}`)
              .join('\n');
            throw new Error(`Validation failed:\n${errorMessages}`);
          } else {
            throw new Error(result.error || 'Validation failed');
          }
        } else if (response.status === 404) {
          throw new Error('Receptionist not found');
        } else {
          throw new Error(
            result.error || 'Failed to update receptionist profile'
          );
        }
      }

      if (result.success) {
        setSuccess('✅ Receptionist profile updated successfully!');
        console.log('✅ Updated receptionist:', result.data);

        // Show success for 2 seconds then redirect
        setTimeout(() => {
          router.push('/receptionist?updated=true');
        }, 2000);
      }
    } catch (error) {
      console.error('❌ Error updating receptionist:', error);

      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to update receptionist profile';

      setError(errorMessage);

      // Scroll to top to show error
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Show loading spinner while fetching receptionist
  if (loadingReceptionist) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <Spinner size='lg' label='Loading receptionist details...' />
      </div>
    );
  }

  // Show error if receptionist not found
  if (!receptionist && !loadingReceptionist) {
    return (
      <div className='min-h-screen bg-gray-50 py-8'>
        <div className='max-w-6xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg'>
            <div className='flex items-start gap-3'>
              <svg
                className='w-5 h-5 shrink-0 mt-0.5'
                fill='currentColor'
                viewBox='0 0 20 20'
              >
                <path
                  fillRule='evenodd'
                  d='M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z'
                  clipRule='evenodd'
                />
              </svg>
              <div className='flex-1'>
                <h3 className='font-medium mb-1'>Receptionist Not Found</h3>
                <p className='text-sm'>
                  {error ||
                    'The receptionist you are looking for does not exist.'}
                </p>
              </div>
            </div>
            <div className='mt-4'>
              <button
                onClick={() => router.push('/receptionist')}
                className='text-sm font-medium text-red-700 hover:text-red-900 underline'
              >
                ← Back to Receptionists
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Convert receptionist data to form format
  const initialFormData: IReceptionistFormData = {
    userId: receptionist.user?._id || receptionist.user,
    employeeId: receptionist.employeeId,
    nic: receptionist.nic,
    shift: receptionist.shift,
    workSchedule: receptionist.workSchedule,
    department: receptionist.department,
    assignedDoctor:
      receptionist.assignedDoctor?._id || receptionist.assignedDoctor,
    maxAppointmentsPerDay: receptionist.maxAppointmentsPerDay || 30,
    currentAppointmentsCount: receptionist.currentAppointmentsCount || 0,
    skills: receptionist.skills || [],
    languages: receptionist.languages || [],
    emergencyContact: receptionist.emergencyContact,
    employmentStatus: receptionist.employmentStatus,
    employmentType: receptionist.employmentType,
    hireDate: receptionist.hireDate,
    terminationDate: receptionist.terminationDate,
    salary: receptionist.salary,
    performanceMetrics: receptionist.performanceMetrics,
    permissions: receptionist.permissions,
    trainingRecords: receptionist.trainingRecords || [],
    notes: receptionist.notes || '',
  };

  return (
    <div className='min-h-screen bg-gray-50 py-8'>
      <div className='max-w-6xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Header */}
        <div className='mb-8'>
          <button
            onClick={() => router.push('/receptionist')}
            className='text-blue-600 hover:text-blue-800 mb-4 flex items-center gap-2 transition-colors'
          >
            <svg
              className='w-5 h-5'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M15 19l-7-7 7-7'
              />
            </svg>
            Back to Receptionists
          </button>
          <h1 className='text-3xl font-bold text-gray-900'>
            Edit Receptionist Profile
          </h1>
          <p className='text-gray-600 mt-2'>
            Update the information for{' '}
            {receptionist.user?.name || 'receptionist'}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className='mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg'>
            <div className='flex items-start gap-3'>
              <svg
                className='w-5 h-5 shrink-0 mt-0.5'
                fill='currentColor'
                viewBox='0 0 20 20'
              >
                <path
                  fillRule='evenodd'
                  d='M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z'
                  clipRule='evenodd'
                />
              </svg>
              <div className='flex-1'>
                <h3 className='font-medium mb-1'>Error Updating Profile</h3>
                <pre className='text-sm whitespace-pre-wrap font-mono'>
                  {error}
                </pre>
              </div>
              <button
                onClick={() => setError(null)}
                className='text-red-400 hover:text-red-600'
              >
                <svg
                  className='w-5 h-5'
                  fill='currentColor'
                  viewBox='0 0 20 20'
                >
                  <path
                    fillRule='evenodd'
                    d='M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z'
                    clipRule='evenodd'
                  />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className='mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-3'>
            <svg
              className='w-5 h-5 shrink-0'
              fill='currentColor'
              viewBox='0 0 20 20'
            >
              <path
                fillRule='evenodd'
                d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                clipRule='evenodd'
              />
            </svg>
            <div className='flex-1'>
              <p className='font-medium'>{success}</p>
              <p className='text-sm mt-1'>
                Redirecting to receptionists list...
              </p>
            </div>
          </div>
        )}

        {/* Form */}
        <ReceptionistForm
          initialData={initialFormData}
          isEditMode={true}
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

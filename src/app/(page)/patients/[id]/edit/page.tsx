/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import PatientForm from '../../Form/PatientForm';
import { IPatientFormData } from '@/types/patients';
import Toast from '@/components/ui/Toast';
import {
  FiArrowLeft,
  FiEdit3,
  FiAlertCircle,
  FiCheckCircle,
  FiLoader,
} from 'react-icons/fi';

export default function EditPatientPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [users, setUsers] = useState<any[]>([]);
  const [patient, setPatient] = useState<any>(null);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingPatient, setLoadingPatient] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({
    show: false,
    message: '',
    type: 'info',
  });

  const fetchUsers = useCallback(async () => {
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
  }, []);

  const fetchPatient = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/patient/${id}`);
      if (!response.ok) throw new Error('Failed to fetch patient');
      const result = await response.json();
      setPatient(result.data);
    } catch (error) {
      console.error('Error fetching patient:', error);
      setError('Failed to load patient data');
    } finally {
      setLoadingPatient(false);
    }
  }, [id]);

  useEffect(() => {
    Promise.all([fetchUsers(), fetchPatient()]);
  }, [fetchUsers, fetchPatient]);

  const handleCancel = () => {
    if (
      window.confirm(
        'Are you sure you want to cancel? Any unsaved changes will be lost.'
      )
    ) {
      router.push(`/patients/${id}`);
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
        bloodType: formData.bloodType || undefined,
        maritalStatus: formData.maritalStatus || undefined,
        insurance: {
          ...formData.insurance,
          validUntil: formData.insurance?.validUntil
            ? new Date(formData.insurance?.validUntil).toISOString()
            : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        },
      };

      console.log('Updating patient with data:', apiData);

      const response = await fetch(`/api/admin/patient/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update patient profile');
      }

      if (result.success) {
        setSuccess('Patient updated successfully!');
        setToast({
          show: true,
          message: 'Patient updated successfully!',
          type: 'success',
        });
        setTimeout(() => {
          router.push(`/patients/${id}?success=updated`);
        }, 2000);
      }
    } catch (error) {
      console.error('Error updating patient:', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to update patient profile';
      setError(errorMessage);
      setToast({
        show: true,
        message: errorMessage,
        type: 'error',
      });
      throw error;
    }
  };

  // Convert patient data to form format
  const getInitialFormData = (): IPatientFormData | undefined => {
    if (!patient) return undefined;

    return {
      _id: patient._id || patient.id || id,
      id: patient._id || patient.id || id,

      // Basic Information
      firstName: patient.firstName || '',
      lastName: patient.lastName || '',
      dateOfBirth: patient.dateOfBirth
        ? new Date(patient.dateOfBirth).toISOString().split('T')[0]
        : '',
      gender: patient.gender || 'MALE',
      email: patient.email || '',
      phone: patient.phone || '',
      nic: patient.nic || '',
      bloodType: patient.bloodType || '',
      maritalStatus: patient.maritalStatus || '',

      // Address
      address: {
        street: patient.address?.street || '',
        city: patient.address?.city || '',
        state: patient.address?.state || '',
        zipCode: patient.address?.zipCode || '',
        country: patient.address?.country || 'Sri Lanka',
      },

      // Emergency Contact
      emergencyContact: {
        name: patient.emergencyContact?.name || '',
        relationship: patient.emergencyContact?.relationship || '',
        phone: patient.emergencyContact?.phone || '',
        email: patient.emergencyContact?.email || '',
      },

      // Insurance
      insurance: {
        provider: patient.insurance?.provider || '',
        policyNumber: patient.insurance?.policyNumber || '',
        groupNumber: patient.insurance?.groupNumber || '',
        validUntil: patient.insurance?.validUntil
          ? new Date(patient.insurance.validUntil).toISOString().split('T')[0]
          : '',
      },

      // Medical Information
      medicalHistory: patient.medicalHistory || '',
      allergies: Array.isArray(patient.allergies) ? patient.allergies : [],
      medications: Array.isArray(patient.medications)
        ? patient.medications
        : [],
      chronicConditions: Array.isArray(patient.chronicConditions)
        ? patient.chronicConditions
        : [],

      // Additional fields
      medicalRecordNumber: patient.medicalRecordNumber || '',

      // User association
      userId: patient.user?._id || patient.user || '',
    };
  };

  if (loadingPatient) {
    return (
      <div className='min-h-screen bg-linear-to-br from-gray-50 to-blue-50 py-8'>
        <div className='max-w-6xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex items-center justify-center min-h-[60vh]'>
            <div className='text-center'>
              <FiLoader
                size={40}
                className='text-blue-600 animate-spin mx-auto mb-4'
              />
              <p className='text-gray-600'>Loading patient data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!patient && !loadingPatient) {
    return (
      <div className='min-h-screen bg-linear-to-br from-gray-50 to-blue-50 py-8'>
        <div className='max-w-6xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='bg-white rounded-xl shadow-lg border border-gray-200 p-8 text-center'>
            <FiAlertCircle size={48} className='text-red-500 mx-auto mb-4' />
            <h2 className='text-2xl font-bold text-gray-900 mb-2'>
              Patient Not Found
            </h2>
            <p className='text-gray-600 mb-6'>
              The patient you&apos;re trying to edit doesn&apos;t exist or you
              don&apos;t have permission to access it.
            </p>
            <button
              onClick={() => router.push('/patients')}
              className='inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
            >
              <FiArrowLeft size={20} />
              Back to Patients
            </button>
          </div>
        </div>
      </div>
    );
  }

  const initialFormData = getInitialFormData();

  return (
    <div className='min-h-screen bg-linear-to-br from-gray-50 to-blue-50 py-8'>
      <div className='max-w-6xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className='mb-8'
        >
          <button
            onClick={() => router.push(`/patients/${id}`)}
            className='inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-6 transition-colors'
          >
            <FiArrowLeft size={20} />
            <span className='font-medium'>Back to Patient Details</span>
          </button>

          <div className='flex items-start gap-4'>
            <div className='p-3 bg-blue-100 rounded-lg'>
              <FiEdit3 size={24} className='text-blue-600' />
            </div>
            <div>
              <h1 className='text-3xl font-bold text-gray-900'>
                Edit Patient: {patient?.firstName} {patient?.lastName}
              </h1>
              <p className='text-gray-600 mt-2'>
                Update patient information and medical records
              </p>
            </div>
          </div>

          {/* Stats Overview */}
          <div className='mt-6 grid grid-cols-1 md:grid-cols-4 gap-4'>
            <div className='bg-white p-4 rounded-lg border border-gray-200 shadow-sm'>
              <p className='text-sm text-gray-600'>Patient ID</p>
              <p className='text-sm font-mono text-gray-900 mt-1 truncate'>
                {id}
              </p>
            </div>
            <div className='bg-white p-4 rounded-lg border border-gray-200 shadow-sm'>
              <p className='text-sm text-gray-600'>Last Updated</p>
              <p className='text-sm font-medium text-gray-900 mt-1'>
                {patient?.updatedAt
                  ? new Date(patient.updatedAt).toLocaleDateString()
                  : 'N/A'}
              </p>
            </div>
            <div className='bg-white p-4 rounded-lg border border-gray-200 shadow-sm'>
              <p className='text-sm text-gray-600'>Created</p>
              <p className='text-sm font-medium text-gray-900 mt-1'>
                {patient?.createdAt
                  ? new Date(patient.createdAt).toLocaleDateString()
                  : 'N/A'}
              </p>
            </div>
            <div className='p-4 rounded-lg border border-yellow-200 shadow-sm bg-yellow-50'>
              <p className='text-sm text-yellow-700'>Status</p>
              <p className='text-2xl font-bold text-yellow-900'>Editing</p>
            </div>
          </div>
        </motion.div>

        {/* Quick Alerts */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className='mb-6 p-4 bg-red-50 border border-red-200 rounded-lg'
          >
            <div className='flex items-center gap-3'>
              <FiAlertCircle size={20} className='text-red-600 shrink-0' />
              <div>
                <p className='font-medium text-red-800'>Error</p>
                <p className='text-red-700 mt-1'>{error}</p>
              </div>
            </div>
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className='mb-6 p-4 bg-green-50 border border-green-200 rounded-lg'
          >
            <div className='flex items-center gap-3'>
              <FiCheckCircle size={20} className='text-green-600 shrink-0' />
              <div>
                <p className='font-medium text-green-800'>Success!</p>
                <p className='text-green-700 mt-1'>{success}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Main Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className='bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden'
        >
          {initialFormData && (
            <PatientForm
              users={users}
              loadingUsers={loadingUsers}
              error={error}
              success={success}
              onCancel={handleCancel}
              onSubmit={handleSubmit}
              onErrorChange={setError}
              onSuccessChange={setSuccess}
              initialData={initialFormData}
              isEditing={true}
            />
          )}
        </motion.div>

        {/* Footer Note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className='mt-8 p-4 bg-gray-50 border border-gray-200 rounded-lg'
        >
          <p className='text-sm text-gray-600'>
            <strong>Note:</strong> All changes are tracked and logged. You can
            view the audit trail in the patient&apos;s history. Required fields
            are marked with an asterisk (*).
          </p>
        </motion.div>

        {/* Toast */}
        {toast.show && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(prev => ({ ...prev, show: false }))}
          />
        )}
      </div>
    </div>
  );
}

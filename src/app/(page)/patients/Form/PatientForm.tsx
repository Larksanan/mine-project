'use client';

import React, { useState } from 'react';
import { FiAlertTriangle, FiCheckCircle } from 'react-icons/fi';
import PersonalInfoTab from './BasicInfoSection';
import ContactTab from './ContactTab';
import MedicalInfoTab from './MedicalInfoTab';
import InsuranceTab from './InsuranceTab';
import { IPatientFormData } from '@/types/patients';

interface User {
  id: string;
  name: string;
  nic: string;
  email: string;
}

interface PatientFormProps {
  users: User[];
  loadingUsers: boolean;
  error: string | null;
  success: string | null;
  onCancel: () => void;
  onSubmit: (formData: IPatientFormData) => Promise<void>;
  onErrorChange: (error: string | null) => void;
  onSuccessChange: (success: string | null) => void;
  initialData?: IPatientFormData;
  isEditing?: boolean;
}

const tabs = [
  { id: 'personal', label: 'Personal Info', icon: '👤' },
  { id: 'contact', label: 'Contact & Address', icon: '📍' },
  { id: 'medical', label: 'Medical Info', icon: '❤️' },
  { id: 'insurance', label: 'Insurance', icon: '💳' },
];

export default function PatientForm({
  users,
  loadingUsers,
  error,
  success,
  onCancel,
  onSubmit,
  onErrorChange,
  onSuccessChange,
  initialData,
  isEditing = false,
}: PatientFormProps) {
  const [formData, setFormData] = useState<IPatientFormData>(
    initialData || {
      _id: '',
      id: '',
      medicalRecordNumber: '',
      chronicConditions: [] as string[],
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      nic: '',
      dateOfBirth: '',
      gender: 'MALE',
      bloodType: '',
      height: undefined,
      weight: undefined,
      maritalStatus: '',
      occupation: '',
      preferredLanguage: 'en',
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: '',
        province: '',
        addressLine2: '',
        district: '',
      },
      emergencyContact: {
        name: '',
        phone: '',
        email: '',
        relationship: '',
        additionalPhone: '',
      },
      medicalHistory: '',
      allergies: [''],
      medications: [''],
      insurance: {
        coverageDetails: '',
        provider: '',
        policyNumber: '',
        groupNumber: '',
        validUntil: '',
      },
    }
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form before submission
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      onErrorChange('Please fix the errors in the form');
      return;
    }

    setIsSubmitting(true);
    onErrorChange(null);
    onSuccessChange(null);
    setFormErrors({});

    try {
      // Filter out empty array items
      const submitData = {
        ...formData,
        allergies: formData.allergies.filter(item => item.trim()),
        medications: formData.medications.filter(item => item.trim()),
      };

      await onSubmit(submitData);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateFormData = (updates: Partial<IPatientFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
    if (error) onErrorChange(null);
    // Clear errors for updated fields
    const updatedFields = Object.keys(updates);
    const newErrors = { ...formErrors };
    updatedFields.forEach(field => {
      delete newErrors[field];
    });
    setFormErrors(newErrors);
  };

  const handleUserIdChange = (userId: string) => {
    // Handle user ID change logic here if needed
    updateFormData({ userId });
  };

  const validateForm = (): Record<string, string> => {
    const errors: Record<string, string> = {};

    // Basic info validation
    if (!formData.firstName?.trim())
      errors.firstName = 'First name is required';
    if (!formData.lastName?.trim()) errors.lastName = 'Last name is required';
    if (!formData.email?.trim()) errors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Invalid email format';
    }
    if (!formData.phone?.trim()) errors.phone = 'Phone number is required';
    if (!formData.nic?.trim()) errors.nic = 'NIC is required';
    if (!formData.dateOfBirth) errors.dateOfBirth = 'Date of birth is required';
    if (!formData.gender) errors.gender = 'Gender is required';

    return errors;
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'personal':
        return (
          <PersonalInfoTab
            formData={formData}
            users={users}
            loadingUsers={loadingUsers}
            formErrors={formErrors}
            onFormDataChange={updateFormData}
            onUserIdChange={handleUserIdChange}
          />
        );
      case 'contact':
        return (
          <ContactTab
            formData={formData}
            formErrors={formErrors}
            onFormDataChange={updateFormData}
          />
        );
      case 'medical':
        return (
          <MedicalInfoTab
            formData={formData}
            formErrors={formErrors}
            onFormDataChange={updateFormData}
          />
        );
      case 'insurance':
        return (
          <InsuranceTab
            formData={formData}
            formErrors={formErrors}
            onFormDataChange={updateFormData}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className='bg-white rounded-lg shadow-md overflow-hidden'>
      {/* Tabs */}
      <div className='border-b border-gray-200'>
        <div className='flex overflow-x-auto'>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              type='button'
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className='p-6'>
        {/* Error/Success Messages */}
        {error && (
          <div className='mb-6 p-4 bg-red-50 border border-red-200 rounded-lg'>
            <div className='flex items-center gap-2 text-red-800'>
              <FiAlertTriangle size={20} />
              <p className='font-medium'>{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className='mb-6 p-4 bg-green-50 border border-green-200 rounded-lg'>
            <div className='flex items-center gap-2 text-green-800'>
              <FiCheckCircle size={20} />
              <p className='font-medium'>{success}</p>
            </div>
          </div>
        )}

        {/* Tab Content */}
        <div className='min-h-125'>{renderTabContent()}</div>

        {/* Navigation and Submit */}
        <div className='mt-8 pt-6 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4'>
          <div className='flex gap-2'>
            <button
              type='button'
              onClick={onCancel}
              className='px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors'
            >
              Cancel
            </button>
            {activeTab !== 'personal' && (
              <button
                type='button'
                onClick={() => {
                  const currentIndex = tabs.findIndex(
                    tab => tab.id === activeTab
                  );
                  if (currentIndex > 0) setActiveTab(tabs[currentIndex - 1].id);
                }}
                className='px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors'
              >
                Previous
              </button>
            )}
          </div>

          <div className='flex gap-2'>
            {activeTab !== 'insurance' && (
              <button
                type='button'
                onClick={() => {
                  const currentIndex = tabs.findIndex(
                    tab => tab.id === activeTab
                  );
                  if (currentIndex < tabs.length - 1)
                    setActiveTab(tabs[currentIndex + 1].id);
                }}
                className='px-4 py-2 text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors'
              >
                Next
              </button>
            )}
            <button
              type='submit'
              disabled={isSubmitting}
              className='px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
            >
              {isSubmitting
                ? isEditing
                  ? 'Updating...'
                  : 'Creating...'
                : isEditing
                  ? 'Update Patient'
                  : 'Create Patient'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

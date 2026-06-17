import React, { useState } from 'react';
import { FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import FormSection from '@/components/Doctor/Form/FormSection';
import FormNavigation from '@/components/Doctor/Form/FormNavigation';
import {
  IDoctorFormData,
  IDoctorProfile,
  initialProfile,
  DAYS_OF_WEEK,
  SPECIALIZATIONS,
  DEPARTMENTS,
} from '@/types/doctors';

interface User {
  id: string;
  name: string;
  email: string;
}

interface DoctorFormProps {
  users: User[];
  loadingUsers: boolean;
  error: string | null;
  success: string | null;
  onCancel: () => void;
  onSubmit: (formData: IDoctorFormData) => Promise<void>;
  onErrorChange: (error: string | null) => void;
  onSuccessChange: (success: string | null) => void;
}

const DoctorForm: React.FC<DoctorFormProps> = ({
  users,
  loadingUsers,
  error,
  success,
  onCancel,
  onSubmit,
  onErrorChange,
}) => {
  const [formData, setFormData] = useState<IDoctorFormData>({
    userId: '',
    profile: initialProfile,
  });
  const [saving, setSaving] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [activeSection, setActiveSection] = useState('basic');

  const handleProfileChange = (
    field: keyof IDoctorProfile,
    value: string | number | string[] | Date
  ) => {
    setFormData(prev => ({
      ...prev,
      profile: {
        ...prev.profile,
        [field]: value,
      },
    }));

    if (formErrors[field]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleAvailabilityChange = (
    field: 'days' | 'startTime' | 'endTime',
    value: string[] | string
  ) => {
    setFormData(prev => ({
      ...prev,
      profile: {
        ...prev.profile,
        availability: {
          ...prev.profile.availability,
          [field]: value,
        },
      },
    }));
  };

  const handleDayToggle = (day: string) => {
    const currentDays = formData.profile.availability.days;
    const newDays = currentDays.includes(day)
      ? currentDays.filter(d => d !== day)
      : [...currentDays, day];
    handleAvailabilityChange('days', newDays);
  };

  const handleArrayFieldChange = (
    field:
      | 'qualifications'
      | 'languages'
      | 'services'
      | 'awards'
      | 'publications',
    index: number,
    value: string
  ) => {
    const currentArray = formData.profile[field] || [];
    const newArray = [...currentArray];
    newArray[index] = value;
    handleProfileChange(field, newArray);
  };

  const handleAddArrayField = (
    field:
      | 'qualifications'
      | 'languages'
      | 'services'
      | 'awards'
      | 'publications'
  ) => {
    const currentArray = formData.profile[field] || [];
    handleProfileChange(field, [...currentArray, '']);
  };

  const handleRemoveArrayField = (
    field:
      | 'qualifications'
      | 'languages'
      | 'services'
      | 'awards'
      | 'publications',
    index: number
  ) => {
    const currentArray = formData.profile[field] || [];
    const newArray = currentArray.filter((_, i) => i !== index);
    handleProfileChange(field, newArray);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.userId) {
      errors.userId = 'Please select a user';
    }

    if (!formData.profile.specialization) {
      errors.specialization = 'Specialization is required';
    }

    if (!formData.profile.qualifications.filter(q => q.trim()).length) {
      errors.qualifications = 'At least one qualification is required';
    }

    if (formData.profile.experience < 0) {
      errors.experience = 'Experience cannot be negative';
    }

    if (formData.profile.consultationFee < 0) {
      errors.consultationFee = 'Consultation fee cannot be negative';
    }

    if (!formData.profile.availability.days.length) {
      errors.availabilityDays = 'At least one day must be selected';
    }

    if (!formData.profile.department) {
      errors.department = 'Department is required';
    }

    if (!formData.profile.licenseNumber) {
      errors.licenseNumber = 'License number is required';
    }

    if (!formData.profile.licenseExpiry) {
      errors.licenseExpiry = 'License expiry date is required';
    }

    if (!formData.profile.languages.filter(l => l.trim()).length) {
      errors.languages = 'At least one language is required';
    }

    if (!formData.profile.services.filter(s => s.trim()).length) {
      errors.services = 'At least one service is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      onErrorChange('Please fix all form errors before submitting');
      return;
    }

    setSaving(true);
    try {
      await onSubmit(formData);
    } catch {
      // Error is already handled in parent component
    } finally {
      setSaving(false);
    }
  };

  const sections = [
    { id: 'basic', label: 'Basic Information' },
    { id: 'availability', label: 'Availability' },
    { id: 'credentials', label: 'Credentials' },
    { id: 'additional', label: 'Additional Info' },
  ];

  return (
    <>
      {/* Success Message */}
      {success && (
        <div className='mb-6 bg-green-50 border border-green-200 rounded-lg p-4'>
          <div className='flex items-center gap-2 text-green-800'>
            <FiCheckCircle className='w-5 h-5' />
            <span className='font-medium'>{success}</span>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className='mb-6 bg-red-50 border border-red-200 rounded-lg p-4'>
          <div className='flex items-center gap-2 text-red-800'>
            <FiAlertCircle className='w-5 h-5' />
            <span className='font-medium'>Error: {error}</span>
          </div>
          <button
            onClick={() => onErrorChange(null)}
            className='mt-2 text-sm text-red-600 hover:text-red-800 underline'
          >
            Dismiss
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className='grid grid-cols-1 lg:grid-cols-4 gap-8'>
          {/* Sidebar Navigation */}
          <FormNavigation
            sections={sections}
            activeSection={activeSection}
            onSectionChange={setActiveSection}
          />

          {/* Main Form Content */}
          <div className='lg:col-span-3'>
            <div className='bg-white rounded-lg shadow-sm border border-gray-200'>
              <div className='p-6 border-b border-gray-200'>
                <h2 className='text-xl font-semibold text-gray-900'>
                  {sections.find(s => s.id === activeSection)?.label}
                </h2>
              </div>

              <div className='p-6'>
                <FormSection
                  activeSection={activeSection}
                  formData={formData}
                  users={users}
                  loadingUsers={loadingUsers}
                  formErrors={formErrors}
                  daysOfWeek={DAYS_OF_WEEK}
                  specializations={SPECIALIZATIONS}
                  departments={DEPARTMENTS}
                  onProfileChange={handleProfileChange}
                  onAvailabilityChange={handleAvailabilityChange}
                  onDayToggle={handleDayToggle}
                  onArrayFieldChange={handleArrayFieldChange}
                  onAddArrayField={handleAddArrayField}
                  onRemoveArrayField={handleRemoveArrayField}
                  onUserIdChange={userId =>
                    setFormData(prev => ({ ...prev, userId }))
                  }
                />
              </div>

              {/* Form Actions */}
              <div className='px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg flex justify-between'>
                <button
                  type='button'
                  onClick={onCancel}
                  className='px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium'
                >
                  Cancel
                </button>

                <div className='flex gap-3'>
                  {activeSection !== 'basic' && (
                    <button
                      type='button'
                      onClick={() => {
                        const currentIndex = sections.findIndex(
                          s => s.id === activeSection
                        );
                        if (currentIndex > 0) {
                          setActiveSection(sections[currentIndex - 1].id);
                        }
                      }}
                      className='px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium'
                    >
                      Previous
                    </button>
                  )}

                  {activeSection !== sections[sections.length - 1].id ? (
                    <button
                      type='button'
                      onClick={() => {
                        const currentIndex = sections.findIndex(
                          s => s.id === activeSection
                        );
                        if (currentIndex < sections.length - 1) {
                          setActiveSection(sections[currentIndex + 1].id);
                        }
                      }}
                      className='px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium'
                    >
                      Next
                    </button>
                  ) : (
                    <button
                      type='submit'
                      disabled={saving}
                      className='px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed'
                    >
                      {saving ? 'Creating...' : 'Create Doctor Profile'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </>
  );
};

export default DoctorForm;

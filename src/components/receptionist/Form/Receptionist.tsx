/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState } from 'react';
import {
  IReceptionistFormData,
  ShiftType,
  EmploymentType,
  EmploymentStatus,
  PaymentFrequency,
} from '@/types/Receptionist';
import FormSection from './FormSection';
import { FiSave, FiX } from 'react-icons/fi';

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  nic?: string;
}

interface ReceptionistFormProps {
  users: User[];
  loadingUsers: boolean;
  error: string | null;
  success: string | null;
  onCancel: () => void;
  onSubmit: (formData: IReceptionistFormData) => Promise<void>;
  onErrorChange: (error: string | null) => void;
  onSuccessChange: (success: string | null) => void;
  initialData?: IReceptionistFormData;
  isEditMode?: boolean;
}

const ReceptionistForm: React.FC<ReceptionistFormProps> = ({
  users,
  loadingUsers,
  error: _error,
  success: _success,
  onCancel,
  onSubmit,
  onErrorChange,
  onSuccessChange,
  initialData,
  isEditMode = false,
}) => {
  const [activeSection, setActiveSection] = useState('basic');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<IReceptionistFormData>(
    initialData || {
      userId: '',
      employeeId: '',
      shift: '' as ShiftType,
      workSchedule: {
        monday: { active: true, start: '08:00', end: '17:00' },
        tuesday: { active: true, start: '08:00', end: '17:00' },
        wednesday: { active: true, start: '08:00', end: '17:00' },
        thursday: { active: true, start: '08:00', end: '17:00' },
        friday: { active: true, start: '08:00', end: '17:00' },
        saturday: { active: false, start: '09:00', end: '13:00' },
        sunday: { active: false, start: '09:00', end: '13:00' },
      },
      department: '',
      maxAppointmentsPerDay: 30,
      currentAppointmentsCount: 0,
      skills: [''],
      languages: [''],
      emergencyContact: {
        name: '',
        relationship: '',
        phone: '',
        email: '',
      },
      employmentStatus: EmploymentStatus.ACTIVE,
      employmentType: '' as EmploymentType,
      hireDate: new Date().toISOString().split('T')[0],
      salary: {
        basic: 0,
        allowances: 0,
        deductions: 0,
        currency: 'LKR',
        paymentFrequency: PaymentFrequency.MONTHLY,
      },
      performanceMetrics: {
        averageCheckInTime: 0,
        averageAppointmentTime: 0,
        patientSatisfactionScore: 0,
        totalAppointmentsHandled: 0,
        errorRate: 0,
      },
      permissions: {
        canManageAppointments: true,
        canManagePatients: true,
        canManageBilling: true,
        canViewReports: false,
        canManageInventory: false,
        canHandleEmergency: true,
        canAccessMedicalRecords: false,
        canManagePrescriptions: false,
      },
      trainingRecords: [],
      notes: '',
    }
  );

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const sections = [
    { id: 'basic', label: 'Basic Information' },
    { id: 'schedule', label: 'Work Schedule' },
    { id: 'employment', label: 'Employment Details' },
    { id: 'permissions', label: 'Permissions' },
    { id: 'additional', label: 'Additional Info' },
  ];

  const handleFieldChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleWorkScheduleChange = (day: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      workSchedule: {
        ...prev.workSchedule,
        [day]: {
          ...prev.workSchedule[day as keyof typeof prev.workSchedule],
          [field]: value,
        },
      },
    }));
  };

  const handleEmergencyContactChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      emergencyContact: {
        ...prev.emergencyContact,
        [field]: value,
      },
    }));
  };

  const handleSalaryChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      salary: {
        ...prev.salary,
        [field]: value,
      },
    }));
  };

  const handlePermissionChange = (field: string, value: boolean) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [field]: value,
      },
    }));
  };

  const handleArrayFieldChange = (
    field: 'skills' | 'languages',
    index: number,
    value: string
  ) => {
    setFormData(prev => {
      const newArray = [...(prev[field] || [''])];
      newArray[index] = value;
      return { ...prev, [field]: newArray };
    });
  };

  const handleAddArrayField = (field: 'skills' | 'languages') => {
    setFormData(prev => ({
      ...prev,
      [field]: [...(prev[field] || ['']), ''],
    }));
  };

  const handleRemoveArrayField = (
    field: 'skills' | 'languages',
    index: number
  ) => {
    setFormData(prev => {
      const newArray = [...(prev[field] || [''])];
      newArray.splice(index, 1);
      return { ...prev, [field]: newArray.length ? newArray : [''] };
    });
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Basic validations
    if (!formData.userId) errors.userId = 'Please select a user';
    if (!formData.employeeId) errors.employeeId = 'Employee ID is required';

    // Validate Employee ID format
    const employeeIdRegex = /^REC-\d{4}-\d{4}$/;
    if (formData.employeeId && !employeeIdRegex.test(formData.employeeId)) {
      errors.employeeId =
        'Employee ID must be in format REC-YYYY-XXXX (e.g., REC-2024-0001)';
    }

    if (!formData.department) errors.department = 'Department is required';
    if (!formData.shift) errors.shift = 'Shift is required';
    if (!formData.employmentType)
      errors.employmentType = 'Employment type is required';
    if (!formData.hireDate) errors.hireDate = 'Hire date is required';

    // Validate hire date is not in future
    if (formData.hireDate) {
      const hireDate = new Date(formData.hireDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (hireDate > today) {
        errors.hireDate = 'Hire date cannot be in the future';
      }
    }

    // Validate languages (at least one non-empty)
    const validLanguages = (formData.languages || ['']).filter(
      lang => lang.trim() !== ''
    );
    if (validLanguages.length === 0) {
      errors.languages = 'At least one language is required';
    }

    // Validate work schedule (at least one day active)
    const hasActiveDay = Object.values(formData.workSchedule).some(
      day => day.active
    );
    if (!hasActiveDay) {
      errors.workSchedule = 'At least one working day must be active';
    }

    // Validate salary
    if (formData.salary?.basic !== undefined && formData.salary.basic < 0) {
      errors.salaryBasic = 'Basic salary cannot be negative';
    }

    // Validate max appointments
    if (
      formData.maxAppointmentsPerDay < 1 ||
      formData.maxAppointmentsPerDay > 100
    ) {
      errors.maxAppointmentsPerDay =
        'Max appointments must be between 1 and 100';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    onErrorChange(null);
    onSuccessChange(null);

    if (!validateForm()) {
      onErrorChange('Please fix the errors in the form');
      // Scroll to first error
      const firstErrorSection = sections.find(section => {
        const sectionFields = getSectionFields(section.id);
        return sectionFields.some(field => formErrors[field]);
      });
      if (firstErrorSection) {
        setActiveSection(firstErrorSection.id);
      }
      return;
    }

    setIsSubmitting(true);

    try {
      // Clean up form data
      const cleanedData: IReceptionistFormData = {
        ...formData,
        skills: (formData.skills || ['']).filter(s => s.trim() !== ''),
        languages: (formData.languages || ['']).filter(l => l.trim() !== ''),
        employeeId: formData.employeeId.toUpperCase(),
      };

      await onSubmit(cleanedData);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSectionFields = (sectionId: string): string[] => {
    switch (sectionId) {
      case 'basic':
        return [
          'userId',
          'employeeId',
          'department',
          'shift',
          'maxAppointmentsPerDay',
        ];
      case 'schedule':
        return ['workSchedule'];
      case 'employment':
        return ['employmentType', 'hireDate', 'salaryBasic'];
      case 'additional':
        return ['languages'];
      default:
        return [];
    }
  };

  const getSectionCompletion = (sectionId: string): boolean => {
    const fields = getSectionFields(sectionId);
    if (fields.length === 0) return true;

    return fields.every(field => {
      if (field === 'workSchedule') {
        return Object.values(formData.workSchedule).some(day => day.active);
      }
      if (field === 'languages') {
        return (formData.languages || ['']).some(lang => lang.trim() !== '');
      }
      return formData[field as keyof IReceptionistFormData];
    });
  };

  return (
    <form onSubmit={handleSubmit} className='space-y-6'>
      <div className='grid grid-cols-1 lg:grid-cols-4 gap-6'>
        {/* Navigation Sidebar */}
        <div className='lg:col-span-1'>
          <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-4'>
            <h3 className='text-lg font-medium text-gray-900 mb-4'>
              {isEditMode ? 'Edit Profile' : 'New Profile'}
            </h3>
            <nav className='space-y-2'>
              {sections.map(section => {
                const isComplete = getSectionCompletion(section.id);
                const hasError = getSectionFields(section.id).some(
                  field => formErrors[field]
                );

                return (
                  <button
                    key={section.id}
                    type='button'
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-between ${
                      activeSection === section.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <span>{section.label}</span>
                    {hasError && (
                      <span className='w-2 h-2 bg-red-500 rounded-full' />
                    )}
                    {!hasError &&
                      isComplete &&
                      activeSection !== section.id && (
                        <span className='text-green-500'>✓</span>
                      )}
                  </button>
                );
              })}
            </nav>

            {/* Summary */}
            <div className='mt-6 pt-6 border-t border-gray-200'>
              <div className='text-xs text-gray-500 space-y-2'>
                <div className='flex justify-between'>
                  <span>Completed:</span>
                  <span className='font-medium text-gray-900'>
                    {sections.filter(s => getSectionCompletion(s.id)).length} /{' '}
                    {sections.length}
                  </span>
                </div>
                {Object.keys(formErrors).length > 0 && (
                  <div className='flex justify-between text-red-600'>
                    <span>Errors:</span>
                    <span className='font-medium'>
                      {Object.keys(formErrors).length}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Form Content */}
        <div className='lg:col-span-3'>
          <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
            <FormSection
              activeSection={activeSection}
              formData={formData}
              users={users}
              loadingUsers={loadingUsers}
              formErrors={formErrors}
              onFieldChange={handleFieldChange}
              onWorkScheduleChange={handleWorkScheduleChange}
              onEmergencyContactChange={handleEmergencyContactChange}
              onSalaryChange={handleSalaryChange}
              onPermissionChange={handlePermissionChange}
              onArrayFieldChange={handleArrayFieldChange}
              onAddArrayField={handleAddArrayField}
              onRemoveArrayField={handleRemoveArrayField}
            />
          </div>

          {/* Form Actions */}
          <div className='flex justify-between items-center mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4'>
            <button
              type='button'
              onClick={onCancel}
              disabled={isSubmitting}
              className='px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2'
            >
              <FiX className='w-4 h-4' />
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
                  disabled={isSubmitting}
                  className='px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  Previous
                </button>
              )}

              {activeSection !== 'additional' ? (
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
                  disabled={isSubmitting}
                  className='px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  Next
                </button>
              ) : (
                <button
                  type='submit'
                  disabled={isSubmitting}
                  className='px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2'
                >
                  {isSubmitting ? (
                    <>
                      <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white' />
                      {isEditMode ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    <>
                      <FiSave className='w-4 h-4' />
                      {isEditMode ? 'Update Profile' : 'Create Profile'}
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};

export default ReceptionistForm;

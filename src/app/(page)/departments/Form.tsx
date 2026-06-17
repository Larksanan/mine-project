/* eslint-disable no-undef */
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useDepartment } from '@/hooks/usedepartment';
import { useToast } from '@/hooks/useToast';
import {
  FiSave,
  FiX,
  FiMapPin,
  FiMail,
  FiPhone,
  FiDollarSign,
  FiClock,
  FiAlertCircle,
} from 'react-icons/fi';
import { ICreateDepartmentInput } from '@/types/department';

export default function DepartmentForm() {
  const router = useRouter();
  const params = useParams();
  const isEdit = !!params?.id;
  const toast = useToast();

  const {
    department,
    createDepartment,
    updateDepartment,
    fetchDepartmentById,
    loading,
  } = useDepartment();

  const [formData, setFormData] = useState<ICreateDepartmentInput>({
    name: '',
    code: '',
    description: '',
    location: '',
    floor: undefined,
    phoneExtension: '',
    email: '',
    isActive: true,
    specializations: [],
    facilities: [],
    workingHours: {
      monday: { start: '08:00', end: '17:00', isOpen: true },
      tuesday: { start: '08:00', end: '17:00', isOpen: true },
      wednesday: { start: '08:00', end: '17:00', isOpen: true },
      thursday: { start: '08:00', end: '17:00', isOpen: true },
      friday: { start: '08:00', end: '17:00', isOpen: true },
      saturday: { start: '09:00', end: '13:00', isOpen: false },
      sunday: { start: '09:00', end: '13:00', isOpen: false },
    },
    emergencyContact: {
      name: '',
      phone: '',
      email: '',
    },
    budget: {
      allocated: 0,
      spent: 0,
      currency: 'LKR',
    },
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<'basic' | 'schedule' | 'budget'>(
    'basic'
  );

  useEffect(() => {
    if (isEdit && params.id) {
      fetchDepartmentById(params.id as string);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, params.id]);

  useEffect(() => {
    if (department && isEdit) {
      setFormData(prev => ({
        ...prev,
        name: department.name || '',
        code: department.code || '',
        description: department.description || '',
        location: department.location || '',
        floor: department.floor,
        phoneExtension: department.phoneExtension || '',
        email: department.email || '',
        isActive: department.isActive ?? true,
        specializations: department.specializations || [],
        facilities: department.facilities || [],
        workingHours: department.workingHours || prev.workingHours,
        emergencyContact: department.emergencyContact || prev.emergencyContact,
        budget: department.budget || prev.budget,
      }));
    }
  }, [department, isEdit]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Department name is required';
    }

    if (!formData.code.trim()) {
      newErrors.code = 'Department code is required';
    } else if (!/^[A-Z0-9-]+$/.test(formData.code)) {
      newErrors.code =
        'Code must contain only uppercase letters, numbers, and hyphens';
    }

    if (formData.email && !/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = 'Invalid email address';
    }

    if (
      formData.emergencyContact?.email &&
      !/^\S+@\S+\.\S+$/.test(formData.emergencyContact.email)
    ) {
      newErrors.emergencyEmail = 'Invalid emergency contact email';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.showToast('Please fix the errors in the form', 'error');
      return;
    }

    try {
      if (isEdit && params.id) {
        const updated = await updateDepartment(params.id as string, formData);
        if (updated) {
          router.push('/departments');
        }
      } else {
        const created = await createDepartment(formData);
        if (created) {
          router.push('/departments');
        }
      }
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleWorkingHoursChange = (
    day: keyof typeof formData.workingHours,
    field: 'start' | 'end' | 'isOpen',
    value: string | boolean
  ) => {
    setFormData(prev => ({
      ...prev,
      workingHours: {
        ...(prev.workingHours || {}),
        [day]: {
          ...(prev.workingHours?.[day] || {}),
          [field]: value,
        },
      } as NonNullable<ICreateDepartmentInput['workingHours']>,
    }));
  };

  return (
    <div className='min-h-screen bg-gray-50 dark:bg-gray-900 py-8'>
      <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Header */}
        <div className='mb-8'>
          <div className='flex items-center gap-4'>
            <button
              onClick={() => router.back()}
              className='p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors'
            >
              <FiX className='w-6 h-6' />
            </button>
            <div>
              <h1 className='text-3xl font-bold text-gray-900 dark:text-white'>
                {isEdit ? 'Edit Department' : 'Create New Department'}
              </h1>
              <p className='mt-1 text-sm text-gray-500 dark:text-gray-400'>
                {isEdit
                  ? 'Update department information'
                  : 'Add a new department to the system'}
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className='space-y-6'>
          {/* Tabs */}
          <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden'>
            <div className='border-b border-gray-200 dark:border-gray-700'>
              <nav className='flex -mb-px'>
                <button
                  type='button'
                  onClick={() => setActiveTab('basic')}
                  className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'basic'
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                  }`}
                >
                  Basic Information
                </button>
                <button
                  type='button'
                  onClick={() => setActiveTab('schedule')}
                  className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'schedule'
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                  }`}
                >
                  Working Hours
                </button>
                <button
                  type='button'
                  onClick={() => setActiveTab('budget')}
                  className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'budget'
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                  }`}
                >
                  Budget & Contacts
                </button>
              </nav>
            </div>

            <div className='p-6'>
              {/* Basic Information Tab */}
              {activeTab === 'basic' && (
                <div className='space-y-6'>
                  {/* Name & Code */}
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                        Department Name <span className='text-red-500'>*</span>
                      </label>
                      <input
                        type='text'
                        value={formData.name}
                        onChange={e => handleChange('name', e.target.value)}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                          errors.name
                            ? 'border-red-500'
                            : 'border-gray-300 dark:border-gray-600'
                        }`}
                        placeholder='e.g., Cardiology'
                      />
                      {errors.name && (
                        <p className='mt-1 text-sm text-red-500 flex items-center gap-1'>
                          <FiAlertCircle className='w-4 h-4' />
                          {errors.name}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                        Department Code <span className='text-red-500'>*</span>
                      </label>
                      <input
                        type='text'
                        value={formData.code}
                        onChange={e =>
                          handleChange('code', e.target.value.toUpperCase())
                        }
                        className={`w-full px-4 py-2 border rounded-lg font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                          errors.code
                            ? 'border-red-500'
                            : 'border-gray-300 dark:border-gray-600'
                        }`}
                        placeholder='e.g., CARD-001'
                      />
                      {errors.code && (
                        <p className='mt-1 text-sm text-red-500 flex items-center gap-1'>
                          <FiAlertCircle className='w-4 h-4' />
                          {errors.code}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={e =>
                        handleChange('description', e.target.value)
                      }
                      rows={3}
                      className='w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white'
                      placeholder='Brief description of the department...'
                    />
                  </div>

                  {/* Location & Floor */}
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                        <FiMapPin className='inline w-4 h-4 mr-1' />
                        Location
                      </label>
                      <input
                        type='text'
                        value={formData.location}
                        onChange={e => handleChange('location', e.target.value)}
                        className='w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white'
                        placeholder='e.g., North Wing'
                      />
                    </div>

                    <div>
                      <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                        Floor
                      </label>
                      <input
                        type='number'
                        value={formData.floor || ''}
                        onChange={e =>
                          handleChange(
                            'floor',
                            parseInt(e.target.value) || undefined
                          )
                        }
                        className='w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white'
                        placeholder='e.g., 3'
                        min='0'
                      />
                    </div>
                  </div>

                  {/* Email & Phone */}
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                        <FiMail className='inline w-4 h-4 mr-1' />
                        Email
                      </label>
                      <input
                        type='email'
                        value={formData.email}
                        onChange={e => handleChange('email', e.target.value)}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                          errors.email
                            ? 'border-red-500'
                            : 'border-gray-300 dark:border-gray-600'
                        }`}
                        placeholder='department@hospital.com'
                      />
                      {errors.email && (
                        <p className='mt-1 text-sm text-red-500'>
                          {errors.email}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                        <FiPhone className='inline w-4 h-4 mr-1' />
                        Phone Extension
                      </label>
                      <input
                        type='text'
                        value={formData.phoneExtension}
                        onChange={e =>
                          handleChange('phoneExtension', e.target.value)
                        }
                        className='w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white'
                        placeholder='e.g., 1234'
                      />
                    </div>
                  </div>

                  {/* Status */}
                  <div className='flex items-center gap-3'>
                    <input
                      type='checkbox'
                      id='isActive'
                      checked={formData.isActive}
                      onChange={e => handleChange('isActive', e.target.checked)}
                      className='w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500'
                    />
                    <label
                      htmlFor='isActive'
                      className='text-sm font-medium text-gray-700 dark:text-gray-300'
                    >
                      Department is active
                    </label>
                  </div>
                </div>
              )}

              {/* Working Hours Tab */}
              {activeTab === 'schedule' && (
                <div className='space-y-4'>
                  <div className='flex items-center gap-2 mb-4'>
                    <FiClock className='w-5 h-5 text-gray-400' />
                    <h3 className='text-lg font-medium text-gray-900 dark:text-white'>
                      Working Hours
                    </h3>
                  </div>

                  {Object.entries(formData.workingHours!).map(
                    ([day, hours]) => (
                      <div
                        key={day}
                        className='flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg'
                      >
                        <div className='flex items-center gap-3 w-32'>
                          <input
                            type='checkbox'
                            checked={hours.isOpen}
                            onChange={e =>
                              handleWorkingHoursChange(
                                day as keyof typeof formData.workingHours,
                                'isOpen',
                                e.target.checked
                              )
                            }
                            className='w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500'
                          />
                          <label className='text-sm font-medium text-gray-700 dark:text-gray-300 capitalize'>
                            {day}
                          </label>
                        </div>

                        {hours.isOpen && (
                          <div className='flex items-center gap-2 flex-1'>
                            <input
                              type='time'
                              value={hours.start}
                              onChange={e =>
                                handleWorkingHoursChange(
                                  day as keyof typeof formData.workingHours,
                                  'start',
                                  e.target.value
                                )
                              }
                              className='px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:text-white'
                            />
                            <span className='text-gray-500 dark:text-gray-400'>
                              to
                            </span>
                            <input
                              type='time'
                              value={hours.end}
                              onChange={e =>
                                handleWorkingHoursChange(
                                  day as keyof typeof formData.workingHours,
                                  'end',
                                  e.target.value
                                )
                              }
                              className='px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:text-white'
                            />
                          </div>
                        )}

                        {!hours.isOpen && (
                          <span className='text-sm text-gray-500 dark:text-gray-400 flex-1'>
                            Closed
                          </span>
                        )}
                      </div>
                    )
                  )}
                </div>
              )}

              {/* Budget & Contacts Tab */}
              {activeTab === 'budget' && (
                <div className='space-y-6'>
                  {/* Budget Section */}
                  <div>
                    <div className='flex items-center gap-2 mb-4'>
                      <FiDollarSign className='w-5 h-5 text-gray-400' />
                      <h3 className='text-lg font-medium text-gray-900 dark:text-white'>
                        Budget Information
                      </h3>
                    </div>

                    <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                      <div>
                        <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                          Allocated Budget
                        </label>
                        <input
                          type='number'
                          value={formData.budget?.allocated || 0}
                          onChange={e =>
                            setFormData(prev => ({
                              ...prev,
                              budget: {
                                ...prev.budget!,
                                allocated: parseFloat(e.target.value) || 0,
                              },
                            }))
                          }
                          className='w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white'
                          min='0'
                          step='0.01'
                        />
                      </div>

                      <div>
                        <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                          Spent
                        </label>
                        <input
                          type='number'
                          value={formData.budget?.spent || 0}
                          onChange={e =>
                            setFormData(prev => ({
                              ...prev,
                              budget: {
                                ...prev.budget!,
                                spent: parseFloat(e.target.value) || 0,
                              },
                            }))
                          }
                          className='w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white'
                          min='0'
                          step='0.01'
                        />
                      </div>

                      <div>
                        <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                          Currency
                        </label>
                        <select
                          value={formData.budget?.currency || 'LKR'}
                          onChange={e =>
                            setFormData(prev => ({
                              ...prev,
                              budget: {
                                ...prev.budget!,
                                currency: e.target.value,
                              },
                            }))
                          }
                          className='w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white'
                        >
                          <option value='LKR'>LKR</option>
                          <option value='USD'>USD</option>
                          <option value='EUR'>EUR</option>
                          <option value='GBP'>GBP</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Emergency Contact Section */}
                  <div>
                    <div className='flex items-center gap-2 mb-4'>
                      <FiPhone className='w-5 h-5 text-gray-400' />
                      <h3 className='text-lg font-medium text-gray-900 dark:text-white'>
                        Emergency Contact
                      </h3>
                    </div>

                    <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                      <div>
                        <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                          Contact Name
                        </label>
                        <input
                          type='text'
                          value={formData.emergencyContact?.name || ''}
                          onChange={e =>
                            setFormData(prev => ({
                              ...prev,
                              emergencyContact: {
                                ...prev.emergencyContact!,
                                name: e.target.value,
                              },
                            }))
                          }
                          className='w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white'
                          placeholder='Contact person name'
                        />
                      </div>

                      <div>
                        <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                          Phone Number
                        </label>
                        <input
                          type='tel'
                          value={formData.emergencyContact?.phone || ''}
                          onChange={e =>
                            setFormData(prev => ({
                              ...prev,
                              emergencyContact: {
                                ...prev.emergencyContact!,
                                phone: e.target.value,
                              },
                            }))
                          }
                          className='w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white'
                          placeholder='+94 XX XXX XXXX'
                        />
                      </div>

                      <div>
                        <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                          Email
                        </label>
                        <input
                          type='email'
                          value={formData.emergencyContact?.email || ''}
                          onChange={e =>
                            setFormData(prev => ({
                              ...prev,
                              emergencyContact: {
                                ...prev.emergencyContact!,
                                email: e.target.value,
                              },
                            }))
                          }
                          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${
                            errors.emergencyEmail
                              ? 'border-red-500'
                              : 'border-gray-300 dark:border-gray-600'
                          }`}
                          placeholder='emergency@hospital.com'
                        />
                        {errors.emergencyEmail && (
                          <p className='mt-1 text-sm text-red-500'>
                            {errors.emergencyEmail}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className='flex items-center justify-end gap-4'>
            <button
              type='button'
              onClick={() => router.back()}
              className='px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors'
            >
              Cancel
            </button>
            <button
              type='submit'
              disabled={loading}
              className='inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
            >
              {loading ? (
                <>
                  <div className='w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin' />
                  Saving...
                </>
              ) : (
                <>
                  <FiSave className='w-5 h-5' />
                  {isEdit ? 'Update' : 'Create'} Department
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

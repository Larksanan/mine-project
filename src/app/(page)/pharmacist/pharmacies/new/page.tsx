/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  FiArrowLeft,
  FiPlus,
  FiMapPin,
  FiPhone,
  FiMail,
  FiClock,
  FiUser,
  FiShield,
  FiGlobe,
  FiAlertCircle,
  FiTrash2,
} from 'react-icons/fi';

interface User {
  id: string;
  name: string;
  email: string;
  nic: string;
}

interface PharmacyFormData {
  userId?: string;
  name: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  contact: {
    phone: string;
    email?: string;
    emergencyPhone?: string;
  };
  operatingHours: {
    Monday: string;
    Tuesday: string;
    Wednesday: string;
    Thursday: string;
    Friday: string;
    Saturday: string;
    Sunday: string;
  };
  services: string[];
  pharmacists: Array<{
    name: string;
    phone?: string;
    licenseNumber: string;
  }>;
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
  is24Hours: boolean;
  description?: string;
  website?: string;
}

interface FormErrors {
  name?: string;
  'address.street'?: string;
  'address.city'?: string;
  'address.state'?: string;
  'address.zipCode'?: string;
  'contact.phone'?: string;
  'contact.email'?: string;
  pharmacists?: string;
  [key: string]: string | undefined;
}

export default function AddNewPharmacy() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [formData, setFormData] = useState<PharmacyFormData>({
    userId: '',
    name: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'Sri Lanka',
    },
    contact: {
      phone: '',
      email: '',
      emergencyPhone: '',
    },
    operatingHours: {
      Monday: '09:00 AM - 06:00 PM',
      Tuesday: '09:00 AM - 06:00 PM',
      Wednesday: '09:00 AM - 06:00 PM',
      Thursday: '09:00 AM - 06:00 PM',
      Friday: '09:00 AM - 06:00 PM',
      Saturday: '10:00 AM - 04:00 PM',
      Sunday: 'Closed',
    },
    services: [],
    pharmacists: [{ name: '', phone: '', licenseNumber: '' }],
    status: 'ACTIVE',
    is24Hours: false,
    description: '',
    website: '',
  });

  // Fetch users on component mount
  useEffect(() => {
    const fetchUsers = async () => {
      setLoadingUsers(true);
      try {
        const response = await fetch('/api/users?role=USER&limit=100');
        if (!response.ok) throw new Error('Failed to fetch users');
        const result = await response.json();
        setUsers(result.data || []);
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();
  }, []);

  const serviceOptions = [
    'Prescription Dispensing',
    'Medication Counseling',
    'Health Screening',
    'Vaccinations',
    'Home Delivery',
    'Compounding Services',
    'Chronic Disease Management',
    'Emergency Supply',
    'Blood Pressure Monitoring',
    'Diabetes Care',
    'Smoking Cessation',
    'Travel Health',
    'Weight Management',
    'First Aid Supplies',
  ];

  const sriLankanProvinces = [
    'Western',
    'Central',
    'Southern',
    'Northern',
    'Eastern',
    'North Western',
    'North Central',
    'Uva',
    'Sabaragamuwa',
  ];

  const daysOfWeek = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
  ];

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Pharmacy name is required';
    }

    if (!formData.address.street.trim()) {
      newErrors['address.street'] = 'Street address is required';
    }

    if (!formData.address.city.trim()) {
      newErrors['address.city'] = 'City is required';
    }

    if (!formData.address.state.trim()) {
      newErrors['address.state'] = 'Province is required';
    }

    if (!formData.address.zipCode.trim()) {
      newErrors['address.zipCode'] = 'Postal code is required';
    }

    if (!formData.contact.phone.trim()) {
      newErrors['contact.phone'] = 'Phone number is required';
    } else if (!/^[\d\s\-()]+$/.test(formData.contact.phone)) {
      newErrors['contact.phone'] = 'Please enter a valid phone number';
    }

    if (
      formData.pharmacists.length === 0 ||
      !formData.pharmacists[0].name.trim()
    ) {
      newErrors.pharmacists = 'At least one pharmacist is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handleNestedInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    const [parent, child] = name.split('.');

    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...(prev as any)[parent],
        [child]: value,
      },
    }));

    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handleOperatingHoursChange = (day: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      operatingHours: {
        ...prev.operatingHours,
        [day]: value,
      },
    }));
  };

  const handleServiceToggle = (service: string) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter(s => s !== service)
        : [...prev.services, service],
    }));
  };

  const handlePharmacistChange = (
    index: number,
    field: string,
    value: string
  ) => {
    const newPharmacists = [...formData.pharmacists];
    newPharmacists[index] = {
      ...newPharmacists[index],
      [field]: value,
    };
    setFormData(prev => ({
      ...prev,
      pharmacists: newPharmacists,
    }));
  };

  const addPharmacist = () => {
    setFormData(prev => ({
      ...prev,
      pharmacists: [
        ...prev.pharmacists,
        { name: '', phone: '', licenseNumber: '' },
      ],
    }));
  };

  const removePharmacist = (index: number) => {
    if (formData.pharmacists.length > 1) {
      setFormData(prev => ({
        ...prev,
        pharmacists: prev.pharmacists.filter((_, i) => i !== index),
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/pharmacy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        alert('Pharmacy added successfully!');
        router.push('/pharmacist/pharmacies');
      } else {
        alert('Failed to add pharmacy: ' + result.message);
      }
    } catch (error) {
      console.error('Error adding pharmacy:', error);
      alert('Failed to add pharmacy. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='min-h-screen bg-gray-50 py-8'>
      <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Header */}
        <div className='mb-8'>
          <div className='flex items-center gap-4 mb-6'>
            <Link
              href='/Pharmacist/dashboard'
              className='flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors'
            >
              <FiArrowLeft className='w-5 h-5' />
              Back to Dashboard
            </Link>
          </div>

          <div className='text-center'>
            <div className='flex items-center justify-center gap-3 mb-4'>
              <div className='p-3 bg-blue-100 rounded-full'>
                <FiPlus className='w-8 h-8 text-blue-600' />
              </div>
              <h1 className='text-3xl font-bold text-gray-900'>
                Add New Pharmacy
              </h1>
            </div>
            <p className='text-gray-600 max-w-2xl mx-auto'>
              Register your pharmacy to start managing medications, inventory,
              and patient services.
            </p>
          </div>
        </div>

        {/* Form */}
        <div className='bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden'>
          <form onSubmit={handleSubmit} className='p-8'>
            <div className='space-y-8'>
              {/* User Selection */}
              <section>
                <h2 className='text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2'>
                  <FiUser className='w-5 h-5 text-indigo-600' />
                  Associated User
                </h2>

                <div>
                  <label
                    htmlFor='userId'
                    className='block text-sm font-medium text-gray-700 mb-2'
                  >
                    Select User (Optional)
                  </label>
                  <select
                    id='userId'
                    name='userId'
                    value={formData.userId}
                    onChange={handleInputChange}
                    disabled={loadingUsers}
                    className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors'
                  >
                    <option value=''>-- Select a user --</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.email})
                      </option>
                    ))}
                  </select>
                  {loadingUsers && (
                    <p className='mt-1 text-sm text-gray-500'>
                      Loading users...
                    </p>
                  )}
                </div>
              </section>

              {/* Pharmacy Basic Information */}
              <section>
                <h2 className='text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2'>
                  <FiMapPin className='w-5 h-5 text-blue-600' />
                  Pharmacy Information
                </h2>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  <div className='md:col-span-2'>
                    <label
                      htmlFor='name'
                      className='block text-sm font-medium text-gray-700 mb-2'
                    >
                      Pharmacy Name *
                    </label>
                    <input
                      type='text'
                      id='name'
                      name='name'
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                        errors.name ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder='Enter pharmacy name'
                    />
                    {errors.name && (
                      <p className='mt-1 text-sm text-red-600 flex items-center gap-1'>
                        <FiAlertCircle className='w-4 h-4' />
                        {errors.name}
                      </p>
                    )}
                  </div>

                  <div className='md:col-span-2'>
                    <label
                      htmlFor='address.street'
                      className='block text-sm font-medium text-gray-700 mb-2'
                    >
                      Street Address *
                    </label>
                    <input
                      type='text'
                      id='address.street'
                      name='address.street'
                      required
                      value={formData.address.street}
                      onChange={handleNestedInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                        errors['address.street']
                          ? 'border-red-300'
                          : 'border-gray-300'
                      }`}
                      placeholder='Enter street address'
                    />
                    {errors['address.street'] && (
                      <p className='mt-1 text-sm text-red-600 flex items-center gap-1'>
                        <FiAlertCircle className='w-4 h-4' />
                        {errors['address.street']}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor='address.city'
                      className='block text-sm font-medium text-gray-700 mb-2'
                    >
                      City *
                    </label>
                    <input
                      type='text'
                      id='address.city'
                      name='address.city'
                      required
                      value={formData.address.city}
                      onChange={handleNestedInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                        errors['address.city']
                          ? 'border-red-300'
                          : 'border-gray-300'
                      }`}
                      placeholder='e.g., Mannar, Batticaloa, Kalmunai'
                    />
                    {errors['address.city'] && (
                      <p className='mt-1 text-sm text-red-600 flex items-center gap-1'>
                        <FiAlertCircle className='w-4 h-4' />
                        {errors['address.city']}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor='address.state'
                      className='block text-sm font-medium text-gray-700 mb-2'
                    >
                      Province *
                    </label>
                    <select
                      id='address.state'
                      name='address.state'
                      required
                      value={formData.address.state}
                      onChange={handleNestedInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                        errors['address.state']
                          ? 'border-red-300'
                          : 'border-gray-300'
                      }`}
                    >
                      <option value=''>-- Select Province --</option>
                      {sriLankanProvinces.map(province => (
                        <option key={province} value={province}>
                          {province}
                        </option>
                      ))}
                    </select>
                    {errors['address.state'] && (
                      <p className='mt-1 text-sm text-red-600 flex items-center gap-1'>
                        <FiAlertCircle className='w-4 h-4' />
                        {errors['address.state']}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor='address.zipCode'
                      className='block text-sm font-medium text-gray-700 mb-2'
                    >
                      Postal Code *
                    </label>
                    <input
                      type='text'
                      id='address.zipCode'
                      name='address.zipCode'
                      required
                      value={formData.address.zipCode}
                      onChange={handleNestedInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                        errors['address.zipCode']
                          ? 'border-red-300'
                          : 'border-gray-300'
                      }`}
                      placeholder='e.g., 10100'
                    />
                    {errors['address.zipCode'] && (
                      <p className='mt-1 text-sm text-red-600 flex items-center gap-1'>
                        <FiAlertCircle className='w-4 h-4' />
                        {errors['address.zipCode']}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor='address.country'
                      className='block text-sm font-medium text-gray-700 mb-2'
                    >
                      Country
                    </label>
                    <input
                      type='text'
                      id='address.country'
                      name='address.country'
                      value={formData.address.country}
                      onChange={handleNestedInputChange}
                      className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-gray-50'
                      readOnly
                    />
                  </div>
                </div>
              </section>

              {/* Contact Information */}
              <section>
                <h2 className='text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2'>
                  <FiPhone className='w-5 h-5 text-green-600' />
                  Contact Information
                </h2>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  <div>
                    <label
                      htmlFor='contact.phone'
                      className='block text-sm font-medium text-gray-700 mb-2'
                    >
                      Phone Number *
                    </label>
                    <div className='relative'>
                      <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                        <FiPhone className='h-5 w-5 text-gray-400' />
                      </div>
                      <input
                        type='tel'
                        id='contact.phone'
                        name='contact.phone'
                        required
                        value={formData.contact.phone}
                        onChange={handleNestedInputChange}
                        className={`w-full pl-10 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                          errors['contact.phone']
                            ? 'border-red-300'
                            : 'border-gray-300'
                        }`}
                        placeholder='023-1234567'
                      />
                    </div>
                    {errors['contact.phone'] && (
                      <p className='mt-1 text-sm text-red-600 flex items-center gap-1'>
                        <FiAlertCircle className='w-4 h-4' />
                        {errors['contact.phone']}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor='contact.email'
                      className='block text-sm font-medium text-gray-700 mb-2'
                    >
                      Email Address
                    </label>
                    <div className='relative'>
                      <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                        <FiMail className='h-5 w-5 text-gray-400' />
                      </div>
                      <input
                        type='email'
                        id='contact.email'
                        name='contact.email'
                        value={formData.contact.email}
                        onChange={handleNestedInputChange}
                        className='w-full pl-10 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors'
                        placeholder='gwu-hict-2021-42@gwu.ac.lk'
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor='contact.emergencyPhone'
                      className='block text-sm font-medium text-gray-700 mb-2'
                    >
                      Emergency Contact
                    </label>
                    <div className='relative'>
                      <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                        <FiPhone className='h-5 w-5 text-gray-400' />
                      </div>
                      <input
                        type='tel'
                        id='contact.emergencyPhone'
                        name='contact.emergencyPhone'
                        value={formData.contact.emergencyPhone}
                        onChange={handleNestedInputChange}
                        className='w-full pl-10 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors'
                        placeholder='077-1234567'
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor='website'
                      className='block text-sm font-medium text-gray-700 mb-2'
                    >
                      Website
                    </label>
                    <div className='relative'>
                      <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                        <FiGlobe className='h-5 w-5 text-gray-400' />
                      </div>
                      <input
                        type='url'
                        id='website'
                        name='website'
                        value={formData.website}
                        onChange={handleInputChange}
                        className='w-full pl-10 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors'
                        placeholder='https://jebarsanthatcroos.com.lk'
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* Pharmacist Information */}
              <section>
                <div className='flex items-center justify-between mb-6'>
                  <h2 className='text-xl font-semibold text-gray-900 flex items-center gap-2'>
                    <FiUser className='w-5 h-5 text-purple-600' />
                    Pharmacist Information
                  </h2>
                  <button
                    type='button'
                    onClick={addPharmacist}
                    className='flex items-center gap-2 px-4 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors'
                  >
                    <FiPlus className='w-4 h-4' />
                    Add Pharmacist
                  </button>
                </div>

                {formData.pharmacists.map((pharmacist, index) => (
                  <div
                    key={index}
                    className='mb-6 p-6 border border-gray-200 rounded-lg bg-gray-50'
                  >
                    <div className='flex items-center justify-between mb-4'>
                      <h3 className='text-sm font-medium text-gray-700'>
                        Pharmacist {index + 1}
                      </h3>
                      {formData.pharmacists.length > 1 && (
                        <button
                          type='button'
                          onClick={() => removePharmacist(index)}
                          className='text-red-600 hover:text-red-700'
                        >
                          <FiTrash2 className='w-4 h-4' />
                        </button>
                      )}
                    </div>

                    <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>
                          Name *
                        </label>
                        <input
                          type='text'
                          required
                          value={pharmacist.name}
                          onChange={e =>
                            handlePharmacistChange(
                              index,
                              'name',
                              e.target.value
                            )
                          }
                          className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors'
                          placeholder='Full name'
                        />
                      </div>

                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>
                          Phone
                        </label>
                        <input
                          type='tel'
                          value={pharmacist.phone}
                          onChange={e =>
                            handlePharmacistChange(
                              index,
                              'phone',
                              e.target.value
                            )
                          }
                          className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors'
                          placeholder='077-1234567'
                        />
                      </div>

                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>
                          License Number *
                        </label>
                        <input
                          type='text'
                          required
                          value={pharmacist.licenseNumber}
                          onChange={e =>
                            handlePharmacistChange(
                              index,
                              'licenseNumber',
                              e.target.value
                            )
                          }
                          className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors'
                          placeholder='License number'
                        />
                      </div>
                    </div>
                  </div>
                ))}

                {errors.pharmacists && (
                  <p className='mt-2 text-sm text-red-600 flex items-center gap-1'>
                    <FiAlertCircle className='w-4 h-4' />
                    {errors.pharmacists}
                  </p>
                )}
              </section>

              {/* Operating Hours */}
              <section>
                <div className='flex items-center justify-between mb-6'>
                  <h2 className='text-xl font-semibold text-gray-900 flex items-center gap-2'>
                    <FiClock className='w-5 h-5 text-orange-600' />
                    Operating Hours
                  </h2>
                  <label className='flex items-center gap-2'>
                    <input
                      type='checkbox'
                      name='is24Hours'
                      checked={formData.is24Hours}
                      onChange={handleInputChange}
                      className='w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
                    />
                    <span className='text-sm font-medium text-gray-700'>
                      24 Hours Open
                    </span>
                  </label>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  {daysOfWeek.map(day => (
                    <div key={day}>
                      <label className='block text-sm font-medium text-gray-700 mb-2'>
                        {day}
                      </label>
                      <input
                        type='text'
                        value={
                          formData.operatingHours[
                            day as keyof typeof formData.operatingHours
                          ]
                        }
                        onChange={e =>
                          handleOperatingHoursChange(day, e.target.value)
                        }
                        disabled={formData.is24Hours}
                        className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors disabled:bg-gray-100'
                        placeholder='e.g., 09:00 AM - 06:00 PM or Closed'
                      />
                    </div>
                  ))}
                </div>
              </section>

              {/* Services */}
              <section>
                <h2 className='text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2'>
                  <FiShield className='w-5 h-5 text-teal-600' />
                  Services Offered
                </h2>

                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                  {serviceOptions.map(service => (
                    <div key={service} className='flex items-center'>
                      <input
                        type='checkbox'
                        id={`service-${service}`}
                        checked={formData.services.includes(service)}
                        onChange={() => handleServiceToggle(service)}
                        className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
                      />
                      <label
                        htmlFor={`service-${service}`}
                        className='ml-3 text-sm text-gray-700'
                      >
                        {service}
                      </label>
                    </div>
                  ))}
                </div>
                {formData.services.length > 0 && (
                  <p className='mt-4 text-sm text-gray-600'>
                    Selected services: {formData.services.join(', ')}
                  </p>
                )}
              </section>

              {/* Status */}
              <section>
                <h2 className='text-xl font-semibold text-gray-900 mb-6'>
                  Status
                </h2>

                <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                  {['ACTIVE', 'INACTIVE', 'MAINTENANCE'].map(status => (
                    <label
                      key={status}
                      className={`flex items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        formData.status === status
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type='radio'
                        name='status'
                        value={status}
                        checked={formData.status === status}
                        onChange={handleInputChange}
                        className='sr-only'
                      />
                      <span
                        className={`text-sm font-medium ${
                          formData.status === status
                            ? 'text-blue-700'
                            : 'text-gray-700'
                        }`}
                      >
                        {status}
                      </span>
                    </label>
                  ))}
                </div>
              </section>

              {/* Description */}
              <section>
                <h2 className='text-xl font-semibold text-gray-900 mb-6'>
                  Additional Information
                </h2>

                <div>
                  <label
                    htmlFor='description'
                    className='block text-sm font-medium text-gray-700 mb-2'
                  >
                    Pharmacy Description
                  </label>
                  <textarea
                    id='description'
                    name='description'
                    rows={4}
                    value={formData.description}
                    onChange={handleInputChange}
                    className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors'
                    placeholder='Describe your pharmacy, specializations, areas of expertise, or any additional information...'
                  />
                  <p className='mt-2 text-sm text-gray-500'>
                    {formData.description?.length || 0}/500 characters
                  </p>
                </div>
              </section>

              {/* Submit Button */}
              <div className='flex justify-end gap-4 pt-6 border-t border-gray-200'>
                <Link
                  href='/Pharmacist/dashboard'
                  className='px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors'
                >
                  Cancel
                </Link>
                <button
                  type='submit'
                  disabled={loading}
                  className='px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2'
                >
                  {loading ? (
                    <>
                      <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' />
                      Adding Pharmacy...
                    </>
                  ) : (
                    <>
                      <FiPlus className='w-4 h-4' />
                      Add Pharmacy
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Help Text */}
        <div className='mt-6 text-center'>
          <p className='text-sm text-gray-500'>
            Need help? Contact support at gwu-hict-2021-42@gwu.ac.lk or call +94
            702 397 952
          </p>
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  FiArrowLeft,
  FiSave,
  FiUpload,
  FiFile,
  FiImage,
  FiX,
  FiUser,
  FiFileText,
  FiAlertCircle,
} from 'react-icons/fi';
import Loading from '@/components/Loading';
import ErrorComponent from '@/components/Error';

interface Patient {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth: string;
  gender: string;
}

interface MedicalRecordFormData {
  patientId: string;
  recordType: string;
  title: string;
  description: string;
  date: string;
  status: string;
  doctorNotes: string;
  attachments: File[];
}

export default function NewMedicalRecordPage() {
  const router = useRouter();

  const [formData, setFormData] = useState<MedicalRecordFormData>({
    patientId: '',
    recordType: '',
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    status: 'ACTIVE',
    doctorNotes: '',
    attachments: [],
  });

  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [dragActive, setDragActive] = useState(false);
  const [nicSearch, setNicSearch] = useState('');
  const [searchingNic, setSearchingNic] = useState(false);
  const [selectedPatientDetails, setSelectedPatientDetails] =
    useState<Patient | null>(null);

  const recordTypes = [
    { value: 'CONSULTATION', label: 'Consultation Note' },
    { value: 'LAB_RESULT', label: 'Lab Result' },
    { value: 'IMAGING', label: 'Imaging Report' },
    { value: 'ECG', label: 'ECG Report' },
    { value: 'PRESCRIPTION', label: 'Prescription' },
    { value: 'PROGRESS_NOTE', label: 'Progress Note' },
    { value: 'SURGICAL_REPORT', label: 'Surgical Report' },
    { value: 'DISCHARGE_SUMMARY', label: 'Discharge Summary' },
    { value: 'OTHER', label: 'Other' },
  ];

  const statusOptions = [
    { value: 'ACTIVE', label: 'Active' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'ARCHIVED', label: 'Archived' },
  ];

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/patients');

      if (!response.ok) throw new Error('Failed to fetch patients');

      const result = await response.json();
      if (result.success) {
        setPatients(result.data);
      } else {
        throw new Error(result.message || 'Failed to fetch patients');
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
      setError('Failed to load patients');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.patientId) errors.patientId = 'Patient is required';
    if (!formData.recordType) errors.recordType = 'Record type is required';
    if (!formData.title.trim()) errors.title = 'Title is required';
    if (!formData.date) errors.date = 'Date is required';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setSaving(true);
    setError(null);

    try {
      const submitData = new FormData();
      submitData.append('patientId', formData.patientId);
      submitData.append('recordType', formData.recordType);
      submitData.append('title', formData.title);
      submitData.append('description', formData.description);
      submitData.append('date', formData.date);
      submitData.append('status', formData.status);
      submitData.append('doctorNotes', formData.doctorNotes);

      formData.attachments.forEach(file => {
        submitData.append('attachments', file);
      });

      const response = await fetch('/api/records', {
        method: 'POST',
        body: submitData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create record');
      }

      const result = await response.json();

      if (result.success) {
        router.push('/records');
      } else {
        throw new Error(result.message || 'Failed to create record');
      }
    } catch (error) {
      console.error('Error creating record:', error);
      setError(
        error instanceof Error ? error.message : 'Failed to create record'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Update selected patient details when patient is selected from dropdown
    if (name === 'patientId') {
      const patient = patients.find(p => p._id === value);
      setSelectedPatientDetails(patient || null);
    }

    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleNicSearch = async () => {
    if (!nicSearch.trim()) {
      setError('Please enter a NIC number');
      return;
    }

    try {
      setSearchingNic(true);
      setError(null);

      const response = await fetch(`/api/patients/search?nic=${nicSearch}`);

      if (!response.ok) {
        throw new Error('Patient not found');
      }

      const result = await response.json();

      if (result.success && result.data) {
        // Set the patient in the form
        setFormData(prev => ({ ...prev, patientId: result.data._id }));
        setSelectedPatientDetails(result.data);
        setNicSearch('');
      } else {
        throw new Error('Patient not found with this NIC');
      }
    } catch (error) {
      console.error('Error searching patient:', error);
      setError(error instanceof Error ? error.message : 'Patient not found');
      setSelectedPatientDetails(null);
    } finally {
      setSearchingNic(false);
    }
  };

  const calculateAge = (dateOfBirth: string) => {
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setFormData(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...files],
    }));
  };

  const removeFile = (index: number) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index),
    }));
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    const validFiles = files.filter(
      file =>
        file.type.startsWith('image/') ||
        file.type === 'application/pdf' ||
        file.type.startsWith('text/')
    );

    setFormData(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...validFiles],
    }));
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <FiImage className='w-4 h-4' />;
    if (file.type === 'application/pdf')
      return <FiFileText className='w-4 h-4' />;
    return <FiFile className='w-4 h-4' />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) return <Loading />;
  if (error) return <ErrorComponent message={error} />;

  return (
    <div className='min-h-screen bg-gray-50 py-8'>
      <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Header */}
        <div className='mb-8'>
          <button
            onClick={() => router.push('/records')}
            className='flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors'
          >
            <FiArrowLeft className='w-5 h-5' />
            Back to Records
          </button>

          <div className='flex justify-between items-start'>
            <div>
              <h1 className='text-3xl font-bold text-gray-900'>
                New Medical Record
              </h1>
              <p className='text-gray-600 mt-2'>
                Create a new medical record for a patient
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className='mb-6 bg-red-50 border border-red-200 rounded-lg p-4'>
            <div className='flex items-center gap-2 text-red-800'>
              <FiAlertCircle className='w-5 h-5' />
              <span className='font-medium'>Error: {error}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
            {/* Main Form */}
            <div className='lg:col-span-2 space-y-6'>
              {/* Patient Selection */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'
              >
                <h2 className='text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2'>
                  <FiUser className='w-5 h-5 text-blue-600' />
                  Patient Information
                </h2>

                {/* NIC Search */}
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Search by NIC Number *
                  </label>
                  <div className='flex gap-2'>
                    <input
                      type='text'
                      value={nicSearch}
                      onChange={e => setNicSearch(e.target.value)}
                      placeholder='Enter NIC number...'
                      className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        formErrors.patientId
                          ? 'border-red-300'
                          : 'border-gray-300'
                      }`}
                      onKeyPress={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleNicSearch();
                        }
                      }}
                    />
                    <button
                      type='button'
                      onClick={handleNicSearch}
                      disabled={searchingNic}
                      className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors'
                    >
                      {searchingNic ? 'Searching...' : 'Search'}
                    </button>
                  </div>
                  {formErrors.patientId && !selectedPatientDetails && (
                    <p className='mt-1 text-sm text-red-600'>
                      {formErrors.patientId}
                    </p>
                  )}
                </div>

                {/* Selected Patient Details */}
                {selectedPatientDetails && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className='mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg'
                  >
                    <div className='flex items-center justify-between mb-3'>
                      <h3 className='font-semibold text-blue-900'>
                        Patient Details
                      </h3>
                      <button
                        type='button'
                        onClick={() => {
                          setSelectedPatientDetails(null);
                          setFormData(prev => ({ ...prev, patientId: '' }));
                          setNicSearch('');
                        }}
                        className='text-blue-600 hover:text-blue-800 text-sm'
                      >
                        Change Patient
                      </button>
                    </div>
                    <div className='grid grid-cols-2 gap-3 text-sm'>
                      <div>
                        <p className='text-blue-600 font-medium'>Name</p>
                        <p className='text-blue-900'>
                          {selectedPatientDetails.firstName}{' '}
                          {selectedPatientDetails.lastName}
                        </p>
                      </div>
                      <div>
                        <p className='text-blue-600 font-medium'>Email</p>
                        <p className='text-blue-900'>
                          {selectedPatientDetails.email}
                        </p>
                      </div>
                      <div>
                        <p className='text-blue-600 font-medium'>Age</p>
                        <p className='text-blue-900'>
                          {calculateAge(selectedPatientDetails.dateOfBirth)}{' '}
                          years
                        </p>
                      </div>
                      <div>
                        <p className='text-blue-600 font-medium'>Gender</p>
                        <p className='text-blue-900 capitalize'>
                          {selectedPatientDetails.gender.toLowerCase()}
                        </p>
                      </div>
                      <div className='col-span-2'>
                        <p className='text-blue-600 font-medium'>
                          Date of Birth
                        </p>
                        <p className='text-blue-900'>
                          {new Date(
                            selectedPatientDetails.dateOfBirth
                          ).toLocaleDateString('en-LK', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>

              {/* Record Details */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'
              >
                <h2 className='text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2'>
                  <FiFileText className='w-5 h-5 text-green-600' />
                  Record Details
                </h2>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Record Type *
                    </label>
                    <select
                      name='recordType'
                      value={formData.recordType}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        formErrors.recordType
                          ? 'border-red-300'
                          : 'border-gray-300'
                      }`}
                    >
                      <option value=''>Select record type...</option>
                      {recordTypes.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                    {formErrors.recordType && (
                      <p className='mt-1 text-sm text-red-600'>
                        {formErrors.recordType}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Status
                    </label>
                    <select
                      name='status'
                      value={formData.status}
                      onChange={handleChange}
                      className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                    >
                      {statusOptions.map(status => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className='md:col-span-2'>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Title *
                    </label>
                    <input
                      type='text'
                      name='title'
                      value={formData.title}
                      onChange={handleChange}
                      placeholder='Enter record title...'
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        formErrors.title ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {formErrors.title && (
                      <p className='mt-1 text-sm text-red-600'>
                        {formErrors.title}
                      </p>
                    )}
                  </div>

                  <div className='md:col-span-2'>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Date *
                    </label>
                    <input
                      type='date'
                      name='date'
                      value={formData.date}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        formErrors.date ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {formErrors.date && (
                      <p className='mt-1 text-sm text-red-600'>
                        {formErrors.date}
                      </p>
                    )}
                  </div>

                  <div className='md:col-span-2'>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Description
                    </label>
                    <textarea
                      name='description'
                      value={formData.description}
                      onChange={handleChange}
                      rows={3}
                      placeholder='Enter record description...'
                      className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                    />
                  </div>
                </div>
              </motion.div>

              {/* File Attachments */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'
              >
                <h2 className='text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2'>
                  <FiUpload className='w-5 h-5 text-purple-600' />
                  File Attachments
                </h2>

                <div
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                    dragActive
                      ? 'border-blue-400 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <FiUpload className='w-8 h-8 text-gray-400 mx-auto mb-3' />
                  <p className='text-gray-600 mb-2'>
                    Drag and drop files here, or click to browse
                  </p>
                  <p className='text-sm text-gray-500 mb-4'>
                    Supports PDF, images (JPG, PNG), ECG reports, X-Ray images,
                    lab reports
                  </p>
                  <input
                    type='file'
                    multiple
                    accept='.pdf,.jpg,.jpeg,.png,.gif,.txt,.doc,.docx'
                    onChange={handleFileChange}
                    className='hidden'
                    id='file-upload'
                  />
                  <label
                    htmlFor='file-upload'
                    className='inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors'
                  >
                    <FiUpload className='w-4 h-4' />
                    Browse Files
                  </label>
                </div>

                {/* File List */}
                {formData.attachments.length > 0 && (
                  <div className='mt-4 space-y-2'>
                    <h3 className='font-medium text-gray-900'>
                      Selected Files:
                    </h3>
                    {formData.attachments.map((file, index) => (
                      <div
                        key={index}
                        className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'
                      >
                        <div className='flex items-center gap-3'>
                          {getFileIcon(file)}
                          <div>
                            <p className='font-medium text-gray-900'>
                              {file.name}
                            </p>
                            <p className='text-sm text-gray-500'>
                              {formatFileSize(file.size)}
                            </p>
                          </div>
                        </div>
                        <button
                          type='button'
                          onClick={() => removeFile(index)}
                          className='text-red-600 hover:text-red-700 p-1'
                        >
                          <FiX className='w-4 h-4' />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>

              {/* Doctor Notes */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'
              >
                <h2 className='text-xl font-semibold text-gray-900 mb-4'>
                  Doctor Notes
                </h2>
                <textarea
                  name='doctorNotes'
                  value={formData.doctorNotes}
                  onChange={handleChange}
                  rows={4}
                  placeholder='Enter your notes, observations, or recommendations...'
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                />
              </motion.div>
            </div>

            {/* Sidebar */}
            <div className='space-y-6'>
              {/* Record Summary */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'
              >
                <h2 className='text-lg font-semibold text-gray-900 mb-4'>
                  Record Summary
                </h2>

                <div className='space-y-3 text-sm'>
                  <div className='flex justify-between'>
                    <span className='text-gray-500'>Files:</span>
                    <span className='font-medium'>
                      {formData.attachments.length}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-gray-500'>Status:</span>
                    <span className='font-medium text-blue-600 capitalize'>
                      {formData.status.toLowerCase()}
                    </span>
                  </div>
                  {formData.date && (
                    <div className='flex justify-between'>
                      <span className='text-gray-500'>Date:</span>
                      <span className='font-medium'>
                        {new Date(formData.date).toLocaleDateString('en-LK', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Actions */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'
              >
                <div className='space-y-3'>
                  <button
                    type='submit'
                    disabled={saving}
                    className='w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors'
                  >
                    <FiSave className='w-4 h-4' />
                    {saving ? 'Creating Record...' : 'Create Medical Record'}
                  </button>

                  <button
                    type='button'
                    onClick={() => router.push('/records')}
                    className='w-full px-4 py-3 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors'
                  >
                    Cancel
                  </button>
                </div>

                <div className='mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg'>
                  <p className='text-xs text-yellow-800'>
                    <strong>Note:</strong> All uploaded files will be securely
                    stored and accessible to authorized medical staff.
                  </p>
                </div>
              </motion.div>

              {/* Supported Formats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className='bg-blue-50 border border-blue-200 rounded-xl p-6'
              >
                <h3 className='font-semibold text-blue-900 mb-3'>
                  Supported Formats
                </h3>
                <ul className='space-y-2 text-sm text-blue-800'>
                  <li className='flex items-center gap-2'>
                    <FiFileText className='w-4 h-4' />
                    <span>PDF Documents</span>
                  </li>
                  <li className='flex items-center gap-2'>
                    <FiImage className='w-4 h-4' />
                    <span>Images (JPG, PNG, GIF)</span>
                  </li>
                  <li className='flex items-center gap-2'>
                    <FiFile className='w-4 h-4' />
                    <span>Text Documents</span>
                  </li>
                  <li className='flex items-center gap-2'>
                    <FiFile className='w-4 h-4' />
                    <span>ECG Reports</span>
                  </li>
                  <li className='flex items-center gap-2'>
                    <FiFile className='w-4 h-4' />
                    <span>X-Ray Images</span>
                  </li>
                </ul>
              </motion.div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

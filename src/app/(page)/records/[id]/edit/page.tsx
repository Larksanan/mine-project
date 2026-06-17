'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
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
  FiDownload,
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
  existingAttachments: string[];
}

export default function EditMedicalRecordPage() {
  const router = useRouter();
  const params = useParams();
  const recordId = params.id as string;

  const [formData, setFormData] = useState<MedicalRecordFormData>({
    patientId: '',
    recordType: '',
    title: '',
    description: '',
    date: '',
    status: 'ACTIVE',
    doctorNotes: '',
    attachments: [],
    existingAttachments: [],
  });

  const [originalData, setOriginalData] =
    useState<MedicalRecordFormData | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [dragActive, setDragActive] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

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
    if (recordId) {
      fetchRecord();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recordId]);

  useEffect(() => {
    if (originalData) {
      const isChanged =
        JSON.stringify(formData) !== JSON.stringify(originalData);
      setHasChanges(isChanged);
    }
  }, [formData, originalData]);

  const fetchRecord = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/records/${recordId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch record');
      }

      const result = await response.json();

      if (result.success) {
        const recordData = result.data;
        setFormData({
          patientId: recordData.patientId._id,
          recordType: recordData.recordType,
          title: recordData.title,
          description: recordData.description || '',
          date: recordData.date.split('T')[0],
          status: recordData.status,
          doctorNotes: recordData.doctorNotes || '',
          attachments: [],
          existingAttachments: recordData.attachments || [],
        });
        setOriginalData({
          patientId: recordData.patientId._id,
          recordType: recordData.recordType,
          title: recordData.title,
          description: recordData.description || '',
          date: recordData.date.split('T')[0],
          status: recordData.status,
          doctorNotes: recordData.doctorNotes || '',
          attachments: [],
          existingAttachments: recordData.attachments || [],
        });
        setPatient(recordData.patientId);
      } else {
        throw new Error(result.message || 'Failed to fetch record');
      }
    } catch (error) {
      console.error('Error fetching record:', error);
      setError('Failed to load record');
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
      submitData.append('recordType', formData.recordType);
      submitData.append('title', formData.title);
      submitData.append('description', formData.description);
      submitData.append('date', formData.date);
      submitData.append('status', formData.status);
      submitData.append('doctorNotes', formData.doctorNotes);

      formData.attachments.forEach(file => {
        submitData.append('attachments', file);
      });

      const response = await fetch(`/api/records/${recordId}`, {
        method: 'PUT',
        body: submitData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update record');
      }

      const result = await response.json();

      if (result.success) {
        router.push(`/records/${recordId}`);
      } else {
        throw new Error(result.message || 'Failed to update record');
      }
    } catch (error) {
      console.error('Error updating record:', error);
      setError(
        error instanceof Error ? error.message : 'Failed to update record'
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

    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setFormData(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...files],
    }));
  };

  const removeNewFile = (index: number) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index),
    }));
  };

  const removeExistingFile = (filename: string) => {
    setFormData(prev => ({
      ...prev,
      existingAttachments: prev.existingAttachments.filter(
        file => file !== filename
      ),
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

  const handleDownload = async (filename: string) => {
    try {
      const response = await fetch(
        `/api/records/download?filename=${filename}`
      );

      if (!response.ok) {
        throw new Error('Failed to download file');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading file:', error);
      setError('Failed to download file');
    }
  };

  const getFileIcon = (filename: string) => {
    const extension = filename.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp'].includes(extension || '')) {
      return <FiImage className='w-4 h-4 text-green-500' />;
    } else if (extension === 'pdf') {
      return <FiFileText className='w-4 h-4 text-red-500' />;
    } else {
      return <FiFile className='w-4 h-4 text-blue-500' />;
    }
  };

  const getFileIconForFile = (file: File) => {
    if (file.type.startsWith('image/'))
      return <FiImage className='w-4 h-4 text-green-500' />;
    if (file.type === 'application/pdf')
      return <FiFileText className='w-4 h-4 text-red-500' />;
    return <FiFile className='w-4 h-4 text-blue-500' />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleCancel = () => {
    if (hasChanges) {
      const confirmLeave = confirm(
        'You have unsaved changes. Are you sure you want to leave?'
      );
      if (confirmLeave) {
        router.push(`/records/${recordId}`);
      }
    } else {
      router.push(`/records/${recordId}`);
    }
  };

  if (loading) return <Loading />;
  if (error) return <ErrorComponent message={error} />;

  return (
    <div className='min-h-screen bg-gray-50 py-8'>
      <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Header */}
        <div className='mb-8'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-4'>
              <button
                onClick={handleCancel}
                className='flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors'
              >
                <FiArrowLeft className='w-5 h-5' />
                Back to Record
              </button>
              <div className='w-px h-6 bg-gray-300'></div>
              <div>
                <h1 className='text-3xl font-bold text-gray-900'>
                  Edit Medical Record
                </h1>
                <p className='text-gray-600 mt-1'>
                  Update record for {patient?.firstName} {patient?.lastName}
                </p>
              </div>
            </div>

            {hasChanges && (
              <div className='flex items-center gap-2 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm'>
                <FiAlertCircle className='w-4 h-4' />
                Unsaved changes
              </div>
            )}
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
              {/* Patient Information */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'
              >
                <h2 className='text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2'>
                  <FiUser className='w-5 h-5 text-blue-600' />
                  Patient Information
                </h2>

                {patient && (
                  <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
                    <h3 className='font-medium text-blue-900 mb-3'>
                      Patient Details
                    </h3>
                    <div className='grid grid-cols-2 gap-4 text-sm'>
                      <div>
                        <span className='text-blue-700'>Name:</span>
                        <p className='text-blue-900 font-medium'>
                          {patient.firstName} {patient.lastName}
                        </p>
                      </div>
                      <div>
                        <span className='text-blue-700'>Email:</span>
                        <p className='text-blue-900'>{patient.email}</p>
                      </div>
                      <div>
                        <span className='text-blue-700'>Age:</span>
                        <p className='text-blue-900'>
                          {new Date().getFullYear() -
                            new Date(patient.dateOfBirth).getFullYear()}{' '}
                          years
                        </p>
                      </div>
                      <div>
                        <span className='text-blue-700'>Gender:</span>
                        <p className='text-blue-900 capitalize'>
                          {patient.gender.toLowerCase()}
                        </p>
                      </div>
                    </div>
                  </div>
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

                {/* Existing Files */}
                {formData.existingAttachments.length > 0 && (
                  <div className='mb-6'>
                    <h3 className='font-medium text-gray-900 mb-3'>
                      Existing Files
                    </h3>
                    <div className='space-y-2'>
                      {formData.existingAttachments.map((filename, index) => (
                        <div
                          key={index}
                          className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'
                        >
                          <div className='flex items-center gap-3'>
                            {getFileIcon(filename)}
                            <div>
                              <p className='font-medium text-gray-900'>
                                {filename}
                              </p>
                            </div>
                          </div>
                          <div className='flex items-center gap-2'>
                            <button
                              type='button'
                              onClick={() => handleDownload(filename)}
                              className='flex items-center gap-1 px-2 py-1 text-green-600 hover:bg-green-50 rounded transition-colors'
                              title='Download File'
                            >
                              <FiDownload className='w-4 h-4' />
                            </button>
                            <button
                              type='button'
                              onClick={() => removeExistingFile(filename)}
                              className='flex items-center gap-1 px-2 py-1 text-red-600 hover:bg-red-50 rounded transition-colors'
                              title='Remove File'
                            >
                              <FiX className='w-4 h-4' />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* New File Upload */}
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
                    Add More Files
                  </label>
                </div>

                {/* New File List */}
                {formData.attachments.length > 0 && (
                  <div className='mt-4 space-y-2'>
                    <h3 className='font-medium text-gray-900'>
                      New Files to Upload:
                    </h3>
                    {formData.attachments.map((file, index) => (
                      <div
                        key={index}
                        className='flex items-center justify-between p-3 bg-green-50 rounded-lg'
                      >
                        <div className='flex items-center gap-3'>
                          {getFileIconForFile(file)}
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
                          onClick={() => removeNewFile(index)}
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
                    <span className='text-gray-500'>Existing Files:</span>
                    <span className='font-medium'>
                      {formData.existingAttachments.length}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-gray-500'>New Files:</span>
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
                        {new Date(formData.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
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
                    disabled={saving || !hasChanges}
                    className='w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
                  >
                    <FiSave className='w-4 h-4' />
                    {saving ? 'Saving Changes...' : 'Update Medical Record'}
                  </button>

                  <button
                    type='button'
                    onClick={handleCancel}
                    className='w-full px-4 py-3 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors'
                  >
                    Cancel
                  </button>
                </div>

                {!hasChanges && (
                  <div className='mt-4 p-3 bg-gray-100 border border-gray-200 rounded-lg'>
                    <p className='text-xs text-gray-600 text-center'>
                      No changes made to the record
                    </p>
                  </div>
                )}

                <div className='mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg'>
                  <p className='text-xs text-yellow-800'>
                    <strong>Note:</strong> Removing existing files will
                    permanently delete them from the system.
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

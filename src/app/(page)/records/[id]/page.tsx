'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  FiArrowLeft,
  FiEdit,
  FiTrash2,
  FiDownload,
  FiUser,
  FiFileText,
  FiImage,
  FiAlertCircle,
  FiEye,
  FiPrinter,
} from 'react-icons/fi';
import Loading from '@/components/Loading';
import ErrorComponent from '@/components/Error';

interface Patient {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  allergies?: string[];
  medications?: string[];
}

interface MedicalRecord {
  _id: string;
  patientId: Patient;
  recordType: string;
  title: string;
  description: string;
  date: string;
  status: string;
  attachments: string[];
  createdAt: string;
  updatedAt: string;
  doctorNotes?: string;
}

export default function MedicalRecordDetailPage() {
  const router = useRouter();
  const params = useParams();
  const recordId = params.id as string;

  const [record, setRecord] = useState<MedicalRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [imagePreview, setImagePreview] = useState<{
    url: string;
    name: string;
  } | null>(null);

  useEffect(() => {
    if (recordId) {
      fetchRecord();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recordId]);

  const fetchRecord = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/records/${recordId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch record');
      }

      const result = await response.json();

      if (result.success) {
        setRecord(result.data);
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

  const handleDelete = async () => {
    try {
      setDeleteLoading(true);
      const response = await fetch(`/api/records/${recordId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete record');
      }

      const result = await response.json();

      if (result.success) {
        router.push('/records');
      } else {
        throw new Error(result.message || 'Failed to delete record');
      }
    } catch (error) {
      console.error('Error deleting record:', error);
      setError('Failed to delete record. Please try again.');
    } finally {
      setDeleteLoading(false);
      setShowDeleteConfirm(false);
    }
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

  const handleViewImage = (filename: string) => {
    const imageUrl = `/uploads/records/${filename}`;
    setImagePreview({ url: imageUrl, name: filename });
  };

  const getFileIcon = (filename: string) => {
    const extension = filename.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp'].includes(extension || '')) {
      return <FiImage className='w-5 h-5 text-green-500' />;
    } else if (extension === 'pdf') {
      return <FiFileText className='w-5 h-5 text-red-500' />;
    } else {
      return <FiFileText className='w-5 h-5 text-blue-500' />;
    }
  };

  const isImageFile = (filename: string) => {
    const extension = filename.split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'bmp'].includes(extension || '');
  };

  const getRecordTypeLabel = (type: string) => {
    const types: { [key: string]: string } = {
      CONSULTATION: 'Consultation Note',
      LAB_RESULT: 'Lab Result',
      IMAGING: 'Imaging Report',
      ECG: 'ECG Report',
      PRESCRIPTION: 'Prescription',
      PROGRESS_NOTE: 'Progress Note',
      SURGICAL_REPORT: 'Surgical Report',
      DISCHARGE_SUMMARY: 'Discharge Summary',
      OTHER: 'Other',
    };
    return types[type] || type;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-LK', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
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

  if (loading) return <Loading />;
  if (error) return <ErrorComponent message={error} />;
  if (!record) return <ErrorComponent message='Record not found' />;

  return (
    <div className='min-h-screen bg-gray-50 py-8'>
      <div className='max-w-6xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Header */}
        <div className='mb-8'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-4'>
              <button
                onClick={() => router.push('/records')}
                className='flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors'
              >
                <FiArrowLeft className='w-5 h-5' />
                Back to Records
              </button>
              <div className='w-px h-6 bg-gray-300'></div>
              <div>
                <h1 className='text-3xl font-bold text-gray-900'>
                  {record.title}
                </h1>
                <p className='text-gray-600 mt-1'>
                  {getRecordTypeLabel(record.recordType)} •{' '}
                  {formatDate(record.date)}
                </p>
              </div>
            </div>

            <div className='flex items-center gap-3'>
              <button
                onClick={() => window.print()}
                className='flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors'
              >
                <FiPrinter className='w-4 h-4' />
                Print
              </button>
              <button
                onClick={() => router.push(`/records/${recordId}/edit`)}
                className='flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
              >
                <FiEdit className='w-4 h-4' />
                Edit
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className='flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors'
              >
                <FiTrash2 className='w-4 h-4' />
                Delete
              </button>
            </div>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className='bg-white rounded-xl p-6 max-w-md w-full'
            >
              <div className='flex items-center gap-3 mb-4'>
                <FiAlertCircle className='w-6 h-6 text-red-500' />
                <h3 className='text-lg font-semibold text-gray-900'>
                  Delete Medical Record
                </h3>
              </div>

              <p className='text-gray-600 mb-6'>
                Are you sure you want to delete this medical record? This action
                cannot be undone and will permanently remove the record and all
                associated files.
              </p>

              <div className='flex gap-3 justify-end'>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className='px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors'
                  disabled={deleteLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleteLoading}
                  className='flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors'
                >
                  <FiTrash2 className='w-4 h-4' />
                  {deleteLoading ? 'Deleting...' : 'Delete Record'}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Image Preview Modal */}
        {imagePreview && (
          <div className='fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4'>
            <div className='max-w-4xl max-h-full'>
              <div className='flex justify-between items-center mb-4'>
                <h3 className='text-white text-lg font-medium'>
                  {imagePreview.name}
                </h3>
                <button
                  onClick={() => setImagePreview(null)}
                  className='text-white hover:text-gray-300 text-2xl'
                >
                  &times;
                </button>
              </div>
              <img
                src={imagePreview.url}
                alt={imagePreview.name}
                className='max-w-full max-h-[80vh] object-contain'
              />
              <div className='flex justify-center mt-4'>
                <button
                  onClick={() => handleDownload(imagePreview.name)}
                  className='flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700'
                >
                  <FiDownload className='w-4 h-4' />
                  Download
                </button>
              </div>
            </div>
          </div>
        )}

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
          {/* Main Content */}
          <div className='lg:col-span-2 space-y-6'>
            {/* Record Details */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'
            >
              <h2 className='text-xl font-semibold text-gray-900 mb-4'>
                Record Details
              </h2>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Record Type
                  </label>
                  <p className='text-gray-900 font-medium'>
                    {getRecordTypeLabel(record.recordType)}
                  </p>
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Status
                  </label>
                  <p className='text-gray-900 font-medium capitalize'>
                    {record.status.toLowerCase()}
                  </p>
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Record Date
                  </label>
                  <p className='text-gray-900'>{formatDate(record.date)}</p>
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Created
                  </label>
                  <p className='text-gray-900'>
                    {formatDate(record.createdAt)}
                  </p>
                </div>

                <div className='md:col-span-2'>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Description
                  </label>
                  <p className='text-gray-900'>{record.description}</p>
                </div>
              </div>
            </motion.div>

            {/* Patient Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'
            >
              <h2 className='text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2'>
                <FiUser className='w-5 h-5 text-blue-600' />
                Patient Information
              </h2>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div className='space-y-4'>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      Full Name
                    </label>
                    <p className='text-gray-900 font-medium'>
                      {record.patientId.firstName} {record.patientId.lastName}
                    </p>
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      Date of Birth & Age
                    </label>
                    <p className='text-gray-900'>
                      {formatDate(record.patientId.dateOfBirth)} (
                      {calculateAge(record.patientId.dateOfBirth)} years)
                    </p>
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      Gender
                    </label>
                    <p className='text-gray-900 capitalize'>
                      {record.patientId.gender.toLowerCase()}
                    </p>
                  </div>
                </div>

                <div className='space-y-4'>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      Email
                    </label>
                    <p className='text-gray-900'>{record.patientId.email}</p>
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      Phone
                    </label>
                    <p className='text-gray-900'>{record.patientId.phone}</p>
                  </div>

                  {record.patientId.address && (
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>
                        Address
                      </label>
                      <p className='text-gray-900'>
                        {record.patientId.address.street}
                        <br />
                        {record.patientId.address.city},{' '}
                        {record.patientId.address.state}{' '}
                        {record.patientId.address.zipCode}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Medical Information */}
              <div className='mt-6 pt-6 border-t border-gray-200'>
                <h3 className='text-lg font-medium text-gray-900 mb-4'>
                  Medical Information
                </h3>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Allergies
                    </label>
                    <div className='flex flex-wrap gap-2'>
                      {record.patientId.allergies &&
                      record.patientId.allergies.length > 0 ? (
                        record.patientId.allergies.map((allergy, index) => (
                          <span
                            key={index}
                            className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800'
                          >
                            {allergy}
                          </span>
                        ))
                      ) : (
                        <p className='text-gray-500 text-sm'>
                          No allergies recorded
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Current Medications
                    </label>
                    <div className='space-y-1'>
                      {record.patientId.medications &&
                      record.patientId.medications.length > 0 ? (
                        record.patientId.medications.map((med, index) => (
                          <p key={index} className='text-sm text-gray-600'>
                            {med}
                          </p>
                        ))
                      ) : (
                        <p className='text-gray-500 text-sm'>
                          No current medications
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* File Attachments */}
            {record.attachments && record.attachments.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'
              >
                <h2 className='text-xl font-semibold text-gray-900 mb-4'>
                  File Attachments ({record.attachments.length})
                </h2>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  {record.attachments.map((filename, index) => (
                    <div
                      key={index}
                      className='flex items-center justify-between p-4 border border-gray-200 rounded-lg'
                    >
                      <div className='flex items-center gap-3'>
                        {getFileIcon(filename)}
                        <div>
                          <p className='font-medium text-gray-900'>
                            {filename}
                          </p>
                          <p className='text-sm text-gray-500'>
                            {isImageFile(filename) ? 'Image' : 'Document'}
                          </p>
                        </div>
                      </div>
                      <div className='flex items-center gap-2'>
                        {isImageFile(filename) && (
                          <button
                            onClick={() => handleViewImage(filename)}
                            className='flex items-center gap-1 px-2 py-1 text-blue-600 hover:bg-blue-50 rounded transition-colors'
                            title='View Image'
                          >
                            <FiEye className='w-4 h-4' />
                          </button>
                        )}
                        <button
                          onClick={() => handleDownload(filename)}
                          className='flex items-center gap-1 px-2 py-1 text-green-600 hover:bg-green-50 rounded transition-colors'
                          title='Download File'
                        >
                          <FiDownload className='w-4 h-4' />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Doctor Notes */}
            {record.doctorNotes && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'
              >
                <h2 className='text-xl font-semibold text-gray-900 mb-4'>
                  Doctor Notes
                </h2>
                <p className='text-gray-700 leading-relaxed whitespace-pre-wrap'>
                  {record.doctorNotes}
                </p>
              </motion.div>
            )}
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
                  <span className='text-gray-500'>Record ID:</span>
                  <span className='font-mono text-gray-900 text-xs'>
                    {record._id.slice(-8)}
                  </span>
                </div>

                <div className='flex justify-between'>
                  <span className='text-gray-500'>Type:</span>
                  <span className='font-medium'>
                    {getRecordTypeLabel(record.recordType)}
                  </span>
                </div>

                <div className='flex justify-between'>
                  <span className='text-gray-500'>Status:</span>
                  <span className='font-medium capitalize text-blue-600'>
                    {record.status.toLowerCase()}
                  </span>
                </div>

                <div className='flex justify-between'>
                  <span className='text-gray-500'>Attachments:</span>
                  <span className='font-medium'>
                    {record.attachments.length}
                  </span>
                </div>

                <div className='flex justify-between'>
                  <span className='text-gray-500'>Created:</span>
                  <span className='font-medium'>
                    {formatDate(record.createdAt)}
                  </span>
                </div>

                <div className='flex justify-between'>
                  <span className='text-gray-500'>Last Updated:</span>
                  <span className='font-medium'>
                    {formatDate(record.updatedAt)}
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'
            >
              <h2 className='text-lg font-semibold text-gray-900 mb-4'>
                Quick Actions
              </h2>

              <div className='space-y-3'>
                <button
                  onClick={() => router.push(`/records/${recordId}/edit`)}
                  className='w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
                >
                  <FiEdit className='w-4 h-4' />
                  Edit Record
                </button>

                <button
                  onClick={() => window.print()}
                  className='w-full flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors'
                >
                  <FiPrinter className='w-4 h-4' />
                  Print Record
                </button>

                <button
                  onClick={() => router.push('/records')}
                  className='w-full flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors'
                >
                  <FiArrowLeft className='w-4 h-4' />
                  Back to List
                </button>
              </div>
            </motion.div>

            {/* Download All */}
            {record.attachments.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className='bg-green-50 border border-green-200 rounded-xl p-6'
              >
                <h3 className='font-semibold text-green-900 mb-3'>
                  Download All Files
                </h3>
                <p className='text-sm text-green-800 mb-4'>
                  Download all attached files as a ZIP archive.
                </p>
                <button
                  onClick={() => {
                    record.attachments.forEach(file => handleDownload(file));
                  }}
                  className='w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors'
                >
                  <FiDownload className='w-4 h-4' />
                  Download All ({record.attachments.length})
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

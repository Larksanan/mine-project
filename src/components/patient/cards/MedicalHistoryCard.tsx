'use client';

import React, { useState, useEffect } from 'react';
import {
  FiActivity,
  FiPlus,
  FiEdit,
  FiTrash2,
  FiCalendar,
  FiUser,
  FiAlertCircle,
  FiChevronDown,
  FiChevronUp,
  FiSave,
  FiX,
  FiClock,
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { Patient } from '@/types/patient';

interface MedicalHistoryCardProps {
  patient: Patient;
  expanded?: boolean;
}

interface MedicalHistoryEntry {
  _id: string;
  patientId: string;
  condition: string;
  diagnosisDate: string;
  status: 'active' | 'resolved' | 'chronic';
  severity: 'mild' | 'moderate' | 'severe';
  description?: string;
  treatment?: string;
  doctor?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: {
    _id: string;
    name: string;
    email: string;
  };
}

interface MedicalHistoryFormData {
  condition: string;
  diagnosisDate: string;
  status: 'active' | 'resolved' | 'chronic';
  severity: 'mild' | 'moderate' | 'severe';
  description: string;
  treatment: string;
  doctor: string;
  notes: string;
}

const MedicalHistoryCard: React.FC<MedicalHistoryCardProps> = ({
  patient,
  expanded = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(expanded);
  const [medicalHistory, setMedicalHistory] = useState<MedicalHistoryEntry[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingEntry, setEditingEntry] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState<MedicalHistoryFormData>({
    condition: '',
    diagnosisDate: new Date().toISOString().split('T')[0],
    status: 'active',
    severity: 'mild',
    description: '',
    treatment: '',
    doctor: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isExpanded) {
      fetchMedicalHistory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patient._id, isExpanded]);

  const fetchMedicalHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/medicalHistory?patientId=${patient._id}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch medical history');
      }

      const result = await response.json();

      if (result.success) {
        setMedicalHistory(result.data);
      } else {
        throw new Error(result.message || 'Failed to fetch medical history');
      }
    } catch (error) {
      console.error('Error fetching medical history:', error);
      setError('Failed to load medical history');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.condition.trim()) {
      errors.condition = 'Condition is required';
    }

    if (!formData.diagnosisDate) {
      errors.diagnosisDate = 'Diagnosis date is required';
    } else {
      const diagnosisDate = new Date(formData.diagnosisDate);
      const today = new Date();
      if (diagnosisDate > today) {
        errors.diagnosisDate = 'Diagnosis date cannot be in the future';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const getStatusColor = (status: MedicalHistoryEntry['status']) => {
    switch (status) {
      case 'active':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'resolved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'chronic':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSeverityColor = (severity: MedicalHistoryEntry['severity']) => {
    switch (severity) {
      case 'mild':
        return 'bg-green-100 text-green-800 border border-green-200';
      case 'moderate':
        return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      case 'severe':
        return 'bg-red-100 text-red-800 border border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  const getSeverityIcon = (severity: MedicalHistoryEntry['severity']) => {
    switch (severity) {
      case 'mild':
        return '🟢';
      case 'moderate':
        return '🟡';
      case 'severe':
        return '🔴';
      default:
        return '⚪';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const calculateDuration = (diagnosisDate: string) => {
    const diagnosed = new Date(diagnosisDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - diagnosed.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);

    if (diffYears > 0) {
      return `${diffYears} year${diffYears > 1 ? 's' : ''}`;
    } else if (diffMonths > 0) {
      return `${diffMonths} month${diffMonths > 1 ? 's' : ''}`;
    } else {
      return `${diffDays} day${diffDays > 1 ? 's' : ''}`;
    }
  };

  const handleAddNew = () => {
    setShowAddForm(true);
    setEditingEntry(null);
    setFormData({
      condition: '',
      diagnosisDate: new Date().toISOString().split('T')[0],
      status: 'active',
      severity: 'mild',
      description: '',
      treatment: '',
      doctor: '',
      notes: '',
    });
    setFormErrors({});
  };

  const handleEdit = (entry: MedicalHistoryEntry) => {
    setEditingEntry(entry._id);
    setShowAddForm(false);
    setFormData({
      condition: entry.condition,
      diagnosisDate: entry.diagnosisDate.split('T')[0],
      status: entry.status,
      severity: entry.severity,
      description: entry.description || '',
      treatment: entry.treatment || '',
      doctor: entry.doctor || '',
      notes: entry.notes || '',
    });
    setFormErrors({});
  };

  const handleCancel = () => {
    setEditingEntry(null);
    setShowAddForm(false);
    setFormData({
      condition: '',
      diagnosisDate: new Date().toISOString().split('T')[0],
      status: 'active',
      severity: 'mild',
      description: '',
      treatment: '',
      doctor: '',
      notes: '',
    });
    setFormErrors({});
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const payload = {
        ...formData,
        patientId: patient._id,
      };

      const url = editingEntry
        ? `/api/medicalHistory/${editingEntry}`
        : '/api/medicalHistory';

      const method = editingEntry ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(
          result.message ||
            `Failed to ${editingEntry ? 'update' : 'create'} medical history`
        );
      }

      // Refresh the list
      await fetchMedicalHistory();

      // Reset form
      handleCancel();
    } catch (error) {
      console.error('Error saving medical history:', error);
      setError(
        `Failed to ${editingEntry ? 'update' : 'create'} medical history`
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (
      !confirm(
        'Are you sure you want to delete this medical history entry? This action cannot be undone.'
      )
    ) {
      return;
    }

    try {
      setError(null);

      const response = await fetch(`/api/medicalHistory/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to delete medical history');
      }

      // Refresh the list
      await fetchMedicalHistory();
    } catch (error) {
      console.error('Error deleting medical history:', error);
      setError('Failed to delete medical history');
    }
  };

  const handleInputChange = (
    field: keyof MedicalHistoryFormData,
    value: string
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  const getActiveConditionsCount = () => {
    return medicalHistory.filter(entry => entry.status === 'active').length;
  };

  const getChronicConditionsCount = () => {
    return medicalHistory.filter(entry => entry.status === 'chronic').length;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className='bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden'
    >
      {/* Header */}
      <div className='px-6 py-4 border-b border-gray-100'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            <div className='flex items-center gap-2'>
              <FiActivity className='w-5 h-5 text-blue-600' />
              <h3 className='text-lg font-semibold text-gray-900'>
                Medical History
              </h3>
            </div>
            <div className='flex items-center gap-2'>
              <span className='bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded-full'>
                {medicalHistory.length} conditions
              </span>
              {getActiveConditionsCount() > 0 && (
                <span className='bg-red-100 text-red-800 text-sm px-2 py-1 rounded-full'>
                  {getActiveConditionsCount()} active
                </span>
              )}
              {getChronicConditionsCount() > 0 && (
                <span className='bg-orange-100 text-orange-800 text-sm px-2 py-1 rounded-full'>
                  {getChronicConditionsCount()} chronic
                </span>
              )}
            </div>
          </div>

          <div className='flex items-center gap-2'>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className='p-2 text-gray-400 hover:text-gray-600 transition-colors'
            >
              {isExpanded ? (
                <FiChevronUp className='w-5 h-5' />
              ) : (
                <FiChevronDown className='w-5 h-5' />
              )}
            </button>
            <button
              onClick={handleAddNew}
              className='flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm'
            >
              <FiPlus className='w-4 h-4' />
              Add Condition
            </button>
          </div>
        </div>

        <p className='text-sm text-gray-500 mt-1'>
          Patient&apos;s medical conditions and treatment history
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className='mx-6 mt-4 bg-red-50 border border-red-200 rounded-lg p-4'>
          <div className='flex items-center gap-2 text-red-800'>
            <FiAlertCircle className='w-4 h-4' />
            <span className='text-sm font-medium'>{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className='mt-2 text-sm text-red-600 hover:text-red-800 underline'
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Add/Edit Form */}
      <AnimatePresence>
        {(showAddForm || editingEntry) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className='border-b border-gray-100 bg-gray-50'
          >
            <div className='p-6'>
              <h4 className='text-lg font-medium text-gray-900 mb-4'>
                {editingEntry
                  ? 'Edit Medical Condition'
                  : 'Add New Medical Condition'}
              </h4>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                {/* Condition */}
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Condition *
                  </label>
                  <input
                    type='text'
                    value={formData.condition}
                    onChange={e =>
                      handleInputChange('condition', e.target.value)
                    }
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      formErrors.condition
                        ? 'border-red-300'
                        : 'border-gray-300'
                    }`}
                    placeholder='e.g., Hypertension, Diabetes'
                  />
                  {formErrors.condition && (
                    <p className='mt-1 text-sm text-red-600'>
                      {formErrors.condition}
                    </p>
                  )}
                </div>

                {/* Diagnosis Date */}
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Diagnosis Date *
                  </label>
                  <input
                    type='date'
                    value={formData.diagnosisDate}
                    onChange={e =>
                      handleInputChange('diagnosisDate', e.target.value)
                    }
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      formErrors.diagnosisDate
                        ? 'border-red-300'
                        : 'border-gray-300'
                    }`}
                  />
                  {formErrors.diagnosisDate && (
                    <p className='mt-1 text-sm text-red-600'>
                      {formErrors.diagnosisDate}
                    </p>
                  )}
                </div>

                {/* Status */}
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Status *
                  </label>
                  <select
                    value={formData.status}
                    onChange={e => handleInputChange('status', e.target.value)}
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                  >
                    <option value='active'>Active</option>
                    <option value='resolved'>Resolved</option>
                    <option value='chronic'>Chronic</option>
                  </select>
                </div>

                {/* Severity */}
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Severity *
                  </label>
                  <select
                    value={formData.severity}
                    onChange={e =>
                      handleInputChange('severity', e.target.value)
                    }
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                  >
                    <option value='mild'>Mild</option>
                    <option value='moderate'>Moderate</option>
                    <option value='severe'>Severe</option>
                  </select>
                </div>

                {/* Description */}
                <div className='md:col-span-2'>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={e =>
                      handleInputChange('description', e.target.value)
                    }
                    rows={2}
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                    placeholder='Describe the condition...'
                  />
                </div>

                {/* Treatment */}
                <div className='md:col-span-2'>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Treatment
                  </label>
                  <textarea
                    value={formData.treatment}
                    onChange={e =>
                      handleInputChange('treatment', e.target.value)
                    }
                    rows={2}
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                    placeholder='Current treatment plan...'
                  />
                </div>

                {/* Doctor */}
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Treating Doctor
                  </label>
                  <input
                    type='text'
                    value={formData.doctor}
                    onChange={e => handleInputChange('doctor', e.target.value)}
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                    placeholder='Dr. Name'
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Notes
                  </label>
                  <input
                    type='text'
                    value={formData.notes}
                    onChange={e => handleInputChange('notes', e.target.value)}
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                    placeholder='Additional notes...'
                  />
                </div>
              </div>

              <div className='flex justify-end gap-3 mt-6'>
                <button
                  onClick={handleCancel}
                  disabled={saving}
                  className='flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors'
                >
                  <FiX className='w-4 h-4' />
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className='flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
                >
                  <FiSave className='w-4 h-4' />
                  {saving
                    ? 'Saving...'
                    : editingEntry
                      ? 'Update'
                      : 'Save Condition'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            {loading ? (
              <div className='flex justify-center items-center py-12'>
                <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
              </div>
            ) : medicalHistory.length === 0 ? (
              <div className='text-center py-12'>
                <FiActivity className='w-16 h-16 text-gray-400 mx-auto mb-4' />
                <h4 className='text-lg font-medium text-gray-900 mb-2'>
                  No Medical History
                </h4>
                <p className='text-gray-500 mb-6 max-w-md mx-auto'>
                  No medical conditions have been recorded for{' '}
                  {patient.firstName} {patient.lastName}.
                </p>
                <button
                  onClick={handleAddNew}
                  className='inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
                >
                  <FiPlus className='w-4 h-4' />
                  Add First Condition
                </button>
              </div>
            ) : (
              <div className='p-6 space-y-4'>
                {medicalHistory.map((entry, index) => (
                  <motion.div
                    key={entry._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className='border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white'
                  >
                    <div className='flex items-start justify-between'>
                      <div className='flex-1'>
                        <div className='flex items-center gap-3 mb-2'>
                          <h4 className='text-lg font-semibold text-gray-900'>
                            {entry.condition}
                          </h4>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(entry.status)}`}
                          >
                            {entry.status.charAt(0).toUpperCase() +
                              entry.status.slice(1)}
                          </span>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(entry.severity)}`}
                          >
                            {getSeverityIcon(entry.severity)}{' '}
                            {entry.severity.charAt(0).toUpperCase() +
                              entry.severity.slice(1)}
                          </span>
                        </div>

                        <div className='flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3'>
                          <div className='flex items-center gap-1'>
                            <FiCalendar className='w-4 h-4' />
                            Diagnosed: {formatDate(entry.diagnosisDate)}
                          </div>
                          <div className='flex items-center gap-1'>
                            <FiClock className='w-4 h-4' />
                            Duration: {calculateDuration(entry.diagnosisDate)}
                          </div>
                          {entry.doctor && (
                            <div className='flex items-center gap-1'>
                              <FiUser className='w-4 h-4' />
                              Doctor: {entry.doctor}
                            </div>
                          )}
                        </div>

                        {entry.description && (
                          <p className='text-sm text-gray-700 mb-2'>
                            {entry.description}
                          </p>
                        )}

                        {entry.treatment && (
                          <div className='bg-blue-50 border border-blue-200 rounded-lg p-3 mb-2'>
                            <p className='text-sm font-medium text-blue-900 mb-1'>
                              Treatment Plan
                            </p>
                            <p className='text-sm text-blue-800'>
                              {entry.treatment}
                            </p>
                          </div>
                        )}

                        {entry.notes && (
                          <p className='text-sm text-gray-600 italic'>
                            Notes: {entry.notes}
                          </p>
                        )}
                      </div>

                      <div className='flex items-center gap-2 ml-4'>
                        <button
                          onClick={() => handleEdit(entry)}
                          className='p-2 text-gray-400 hover:text-blue-600 transition-colors rounded-lg hover:bg-blue-50'
                          title='Edit'
                        >
                          <FiEdit className='w-4 h-4' />
                        </button>
                        <button
                          onClick={() => handleDelete(entry._id)}
                          className='p-2 text-gray-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50'
                          title='Delete'
                        >
                          <FiTrash2 className='w-4 h-4' />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default MedicalHistoryCard;

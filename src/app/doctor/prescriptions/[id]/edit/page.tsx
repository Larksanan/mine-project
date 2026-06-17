'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  FiArrowLeft,
  FiSave,
  FiPlus,
  FiTrash2,
  FiUser,
  FiFileText,
  FiAlertCircle,
} from 'react-icons/fi';
import Loading from '@/components/Loading';
import ErrorComponent from '@/components/Error';
import { IPatientFormData } from '@/types/patients';
import { PrescriptionFormData } from '@/types/Prescription';
import { Medication } from '@/types/Medication';

export default function EditPrescriptionPage() {
  const router = useRouter();
  const params = useParams();
  const prescriptionId = params.id as string;

  const [formData, setFormData] = useState<PrescriptionFormData>({
    patientId: '',
    diagnosis: '',
    medications: [
      {
        name: '',
        dosage: '',
        frequency: '',
        duration: '',
        instructions: '',
        quantity: 30,
        refills: 0,
      },
    ],
    notes: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    status: 'ACTIVE',
  });

  const [originalData, setOriginalData] = useState<PrescriptionFormData | null>(
    null
  );
  const [patient, setPatient] = useState<IPatientFormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);

  // Common medication options
  const commonMedications = [
    'Amoxicillin',
    'Lisinopril',
    'Atorvastatin',
    'Metformin',
    'Levothyroxine',
    'Albuterol',
    'Omeprazole',
    'Losartan',
    'Sertraline',
    'Simvastatin',
    'Metoprolol',
    'Amlodipine',
    'Hydrochlorothiazide',
    'Azithromycin',
    'Prednisone',
  ];

  const dosageOptions = [
    '250mg',
    '500mg',
    '10mg',
    '20mg',
    '25mg',
    '50mg',
    '100mg',
    '200mg',
    '40mg',
    '80mg',
    '5mg',
    '2.5mg',
  ];

  const frequencyOptions = [
    'Once daily',
    'Twice daily',
    'Three times daily',
    'Four times daily',
    'Every 6 hours',
    'Every 8 hours',
    'Every 12 hours',
    'Once weekly',
    'As needed',
    'Before meals',
    'After meals',
    'At bedtime',
  ];

  const durationOptions = [
    '7 days',
    '10 days',
    '14 days',
    '30 days',
    '60 days',
    '90 days',
    'Until finished',
    'As directed',
  ];

  const statusOptions = [
    { value: 'ACTIVE', label: 'Active' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'CANCELLED', label: 'Cancelled' },
  ];

  useEffect(() => {
    if (prescriptionId) {
      fetchPrescription();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prescriptionId]);

  useEffect(() => {
    // Check if form has changes compared to original data
    if (originalData) {
      const isChanged =
        JSON.stringify(formData) !== JSON.stringify(originalData);
      setHasChanges(isChanged);
    }
  }, [formData, originalData]);

  const fetchPrescription = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/doctor/prescriptions/${prescriptionId}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch prescription');
      }

      const result = await response.json();

      if (result.success) {
        const prescriptionData = result.data;
        setFormData({
          patientId: prescriptionData.patientId._id,
          diagnosis: prescriptionData.diagnosis,
          medications: prescriptionData.medications,
          notes: prescriptionData.notes || '',
          startDate: prescriptionData.startDate.split('T')[0],
          endDate: prescriptionData.endDate
            ? prescriptionData.endDate.split('T')[0]
            : '',
          status: prescriptionData.status,
        });
        setOriginalData({
          patientId: prescriptionData.patientId._id,
          diagnosis: prescriptionData.diagnosis,
          medications: prescriptionData.medications,
          notes: prescriptionData.notes || '',
          startDate: prescriptionData.startDate.split('T')[0],
          endDate: prescriptionData.endDate
            ? prescriptionData.endDate.split('T')[0]
            : '',
          status: prescriptionData.status,
        });
        setPatient(prescriptionData.patientId);
      } else {
        throw new Error(result.message || 'Failed to fetch prescription');
      }
    } catch (error) {
      console.error('Error fetching prescription:', error);
      setError('Failed to load prescription');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.patientId) {
      errors.patientId = 'Please select a patient';
    }

    if (!formData.diagnosis.trim()) {
      errors.diagnosis = 'Diagnosis is required';
    }

    if (!formData.startDate) {
      errors.startDate = 'Start date is required';
    }

    // Validate medications
    formData.medications.forEach((med, index) => {
      if (!med.name.trim()) {
        errors[`medication_${index}_name`] = 'Medication name is required';
      }
      if (!med.dosage.trim()) {
        errors[`medication_${index}_dosage`] = 'Dosage is required';
      }
      if (!med.frequency.trim()) {
        errors[`medication_${index}_frequency`] = 'Frequency is required';
      }
      if (!med.duration.trim()) {
        errors[`medication_${index}_duration`] = 'Duration is required';
      }
      if (med.quantity <= 0) {
        errors[`medication_${index}_quantity`] =
          'Quantity must be greater than 0';
      }
      if (med.refills < 0) {
        errors[`medication_${index}_refills`] = 'Refills cannot be negative';
      }
    });

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/doctor/prescriptions/${prescriptionId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update prescription');
      }

      const result = await response.json();

      if (result.success) {
        router.push(`/doctor/prescriptions/${prescriptionId}`);
      } else {
        throw new Error(result.message || 'Failed to update prescription');
      }
    } catch (error) {
      console.error('Error updating prescription:', error);
      setError(
        error instanceof Error ? error.message : 'Failed to update prescription'
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
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleMedicationChange = (
    index: number,
    field: keyof Medication,
    value: string | number
  ) => {
    setFormData(prev => ({
      ...prev,
      medications: prev.medications.map((med, i) =>
        i === index ? { ...med, [field]: value } : med
      ),
    }));

    // Clear error when user starts typing
    const errorKey = `medication_${index}_${field}`;
    if (formErrors[errorKey]) {
      setFormErrors(prev => ({
        ...prev,
        [errorKey]: '',
      }));
    }
  };

  const addMedication = () => {
    setFormData(prev => ({
      ...prev,
      medications: [
        ...prev.medications,
        {
          name: '',
          dosage: '',
          frequency: '',
          duration: '',
          instructions: '',
          quantity: 30,
          refills: 0,
        },
      ],
    }));
  };

  const removeMedication = (index: number) => {
    if (formData.medications.length > 1) {
      setFormData(prev => ({
        ...prev,
        medications: prev.medications.filter((_, i) => i !== index),
      }));
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

  const handleCancel = () => {
    if (hasChanges) {
      const confirmLeave = confirm(
        'You have unsaved changes. Are you sure you want to leave?'
      );
      if (confirmLeave) {
        router.push(`/doctor/prescriptions/${prescriptionId}`);
      }
    } else {
      router.push(`/doctor/prescriptions/${prescriptionId}`);
    }
  };

  const calculateEndDate = (startDate: string, duration: string) => {
    if (!startDate || !duration) return '';

    const start = new Date(startDate);
    const days = parseInt(duration) || 0;
    const endDate = new Date(start);
    endDate.setDate(start.getDate() + days);

    return endDate.toISOString().split('T')[0];
  };

  // Auto-calculate end date when start date or duration changes
  useEffect(() => {
    if (formData.startDate && formData.medications[0]?.duration) {
      const days = parseInt(formData.medications[0].duration) || 0;
      if (days > 0) {
        const endDate = calculateEndDate(
          formData.startDate,
          formData.medications[0].duration
        );
        setFormData(prev => ({ ...prev, endDate }));
      }
    }
  }, [formData.medications, formData.startDate]);

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
                Back to Prescription
              </button>
              <div className='w-px h-6 bg-gray-300'></div>
              <div>
                <h1 className='text-3xl font-bold text-gray-900'>
                  Edit Prescription
                </h1>
                <p className='text-gray-600 mt-1'>
                  Update prescription details for {patient?.firstName}{' '}
                  {patient?.lastName}
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
                  <div className='space-y-4'>
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
                            {calculateAge(patient.dateOfBirth)} years
                          </p>
                        </div>
                        <div>
                          <span className='text-blue-700'>Gender:</span>
                          <p className='text-blue-900 capitalize'>
                            {patient.gender.toLowerCase()}
                          </p>
                        </div>
                        <div className='col-span-2'>
                          <span className='text-blue-700'>Allergies:</span>
                          <p className='text-blue-900'>
                            {patient.allergies?.length
                              ? patient.allergies.join(', ')
                              : 'None recorded'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>

              {/* Diagnosis Information */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'
              >
                <h2 className='text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2'>
                  <FiFileText className='w-5 h-5 text-green-600' />
                  Diagnosis & Treatment
                </h2>

                <div className='space-y-4'>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Diagnosis *
                    </label>
                    <input
                      type='text'
                      name='diagnosis'
                      value={formData.diagnosis}
                      onChange={handleChange}
                      placeholder='Enter primary diagnosis...'
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        formErrors.diagnosis
                          ? 'border-red-300'
                          : 'border-gray-300'
                      }`}
                    />
                    {formErrors.diagnosis && (
                      <p className='mt-1 text-sm text-red-600'>
                        {formErrors.diagnosis}
                      </p>
                    )}
                  </div>

                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-2'>
                        Start Date *
                      </label>
                      <input
                        type='date'
                        name='startDate'
                        value={formData.startDate}
                        onChange={handleChange}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          formErrors.startDate
                            ? 'border-red-300'
                            : 'border-gray-300'
                        }`}
                      />
                      {formErrors.startDate && (
                        <p className='mt-1 text-sm text-red-600'>
                          {formErrors.startDate}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-2'>
                        End Date
                      </label>
                      <input
                        type='date'
                        name='endDate'
                        value={formData.endDate}
                        onChange={handleChange}
                        className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                      />
                    </div>
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
                      {statusOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </motion.div>

              {/* Medications */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'
              >
                <div className='flex justify-between items-center mb-4'>
                  <h2 className='text-xl font-semibold text-gray-900 flex items-center gap-2'>
                    Medications
                  </h2>
                  <button
                    type='button'
                    onClick={addMedication}
                    className='flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
                  >
                    <FiPlus className='w-4 h-4' />
                    Add Medication
                  </button>
                </div>

                <div className='space-y-6'>
                  {formData.medications.map((medication, index) => (
                    <div
                      key={index}
                      className='border border-gray-200 rounded-lg p-4'
                    >
                      <div className='flex justify-between items-center mb-4'>
                        <h3 className='font-medium text-gray-900'>
                          Medication #{index + 1}
                        </h3>
                        {formData.medications.length > 1 && (
                          <button
                            type='button'
                            onClick={() => removeMedication(index)}
                            className='text-red-600 hover:text-red-700 p-1'
                          >
                            <FiTrash2 className='w-4 h-4' />
                          </button>
                        )}
                      </div>

                      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        <div>
                          <label className='block text-sm font-medium text-gray-700 mb-2'>
                            Medication Name *
                          </label>
                          <input
                            type='text'
                            value={medication.name}
                            onChange={e =>
                              handleMedicationChange(
                                index,
                                'name',
                                e.target.value
                              )
                            }
                            list={`common-medications-${index}`}
                            placeholder='Enter medication name...'
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                              formErrors[`medication_${index}_name`]
                                ? 'border-red-300'
                                : 'border-gray-300'
                            }`}
                          />
                          <datalist id={`common-medications-${index}`}>
                            {commonMedications.map(med => (
                              <option key={med} value={med} />
                            ))}
                          </datalist>
                          {formErrors[`medication_${index}_name`] && (
                            <p className='mt-1 text-sm text-red-600'>
                              {formErrors[`medication_${index}_name`]}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className='block text-sm font-medium text-gray-700 mb-2'>
                            Dosage *
                          </label>
                          <input
                            type='text'
                            value={medication.dosage}
                            onChange={e =>
                              handleMedicationChange(
                                index,
                                'dosage',
                                e.target.value
                              )
                            }
                            list={`dosage-options-${index}`}
                            placeholder='Enter dosage...'
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                              formErrors[`medication_${index}_dosage`]
                                ? 'border-red-300'
                                : 'border-gray-300'
                            }`}
                          />
                          <datalist id={`dosage-options-${index}`}>
                            {dosageOptions.map(dosage => (
                              <option key={dosage} value={dosage} />
                            ))}
                          </datalist>
                          {formErrors[`medication_${index}_dosage`] && (
                            <p className='mt-1 text-sm text-red-600'>
                              {formErrors[`medication_${index}_dosage`]}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className='block text-sm font-medium text-gray-700 mb-2'>
                            Frequency *
                          </label>
                          <select
                            value={medication.frequency}
                            onChange={e =>
                              handleMedicationChange(
                                index,
                                'frequency',
                                e.target.value
                              )
                            }
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                              formErrors[`medication_${index}_frequency`]
                                ? 'border-red-300'
                                : 'border-gray-300'
                            }`}
                          >
                            <option value=''>Select frequency...</option>
                            {frequencyOptions.map(freq => (
                              <option key={freq} value={freq}>
                                {freq}
                              </option>
                            ))}
                          </select>
                          {formErrors[`medication_${index}_frequency`] && (
                            <p className='mt-1 text-sm text-red-600'>
                              {formErrors[`medication_${index}_frequency`]}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className='block text-sm font-medium text-gray-700 mb-2'>
                            Duration *
                          </label>
                          <select
                            value={medication.duration}
                            onChange={e =>
                              handleMedicationChange(
                                index,
                                'duration',
                                e.target.value
                              )
                            }
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                              formErrors[`medication_${index}_duration`]
                                ? 'border-red-300'
                                : 'border-gray-300'
                            }`}
                          >
                            <option value=''>Select duration...</option>
                            {durationOptions.map(duration => (
                              <option key={duration} value={duration}>
                                {duration}
                              </option>
                            ))}
                          </select>
                          {formErrors[`medication_${index}_duration`] && (
                            <p className='mt-1 text-sm text-red-600'>
                              {formErrors[`medication_${index}_duration`]}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className='block text-sm font-medium text-gray-700 mb-2'>
                            Quantity *
                          </label>
                          <input
                            type='number'
                            value={medication.quantity}
                            onChange={e =>
                              handleMedicationChange(
                                index,
                                'quantity',
                                parseInt(e.target.value) || 0
                              )
                            }
                            min='1'
                            max='1000'
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                              formErrors[`medication_${index}_quantity`]
                                ? 'border-red-300'
                                : 'border-gray-300'
                            }`}
                          />
                          {formErrors[`medication_${index}_quantity`] && (
                            <p className='mt-1 text-sm text-red-600'>
                              {formErrors[`medication_${index}_quantity`]}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className='block text-sm font-medium text-gray-700 mb-2'>
                            Refills
                          </label>
                          <input
                            type='number'
                            value={medication.refills}
                            onChange={e =>
                              handleMedicationChange(
                                index,
                                'refills',
                                parseInt(e.target.value) || 0
                              )
                            }
                            min='0'
                            max='12'
                            className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                          />
                        </div>

                        <div className='md:col-span-2'>
                          <label className='block text-sm font-medium text-gray-700 mb-2'>
                            Special Instructions
                          </label>
                          <textarea
                            value={medication.instructions}
                            onChange={e =>
                              handleMedicationChange(
                                index,
                                'instructions',
                                e.target.value
                              )
                            }
                            rows={2}
                            placeholder='Enter special instructions for this medication...'
                            className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Additional Notes */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'
              >
                <h2 className='text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2'>
                  Additional Notes
                </h2>

                <textarea
                  name='notes'
                  value={formData.notes}
                  onChange={handleChange}
                  rows={4}
                  placeholder='Enter any additional notes or instructions for the patient...'
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                />
              </motion.div>
            </div>

            {/* Sidebar */}
            <div className='space-y-6'>
              {/* Prescription Summary */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'
              >
                <h2 className='text-lg font-semibold text-gray-900 mb-4'>
                  Prescription Summary
                </h2>

                <div className='space-y-3 text-sm'>
                  {patient && (
                    <div className='flex justify-between'>
                      <span className='text-gray-500'>Patient:</span>
                      <span className='font-medium text-right'>
                        {patient.firstName} {patient.lastName}
                      </span>
                    </div>
                  )}

                  <div className='flex justify-between'>
                    <span className='text-gray-500'>Medications:</span>
                    <span className='font-medium'>
                      {formData.medications.length}
                    </span>
                  </div>

                  <div className='flex justify-between'>
                    <span className='text-gray-500'>Status:</span>
                    <span className='font-medium capitalize text-blue-600'>
                      {formData.status.toLowerCase()}
                    </span>
                  </div>

                  {formData.startDate && (
                    <div className='flex justify-between'>
                      <span className='text-gray-500'>Start Date:</span>
                      <span className='font-medium'>
                        {new Date(formData.startDate).toLocaleDateString(
                          'en-US',
                          {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          }
                        )}
                      </span>
                    </div>
                  )}

                  {formData.endDate && (
                    <div className='flex justify-between'>
                      <span className='text-gray-500'>End Date:</span>
                      <span className='font-medium'>
                        {new Date(formData.endDate).toLocaleDateString(
                          'en-US',
                          {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          }
                        )}
                      </span>
                    </div>
                  )}

                  {formData.diagnosis && (
                    <div className='pt-3 border-t border-gray-200'>
                      <div className='flex justify-between'>
                        <span className='text-gray-500'>Diagnosis:</span>
                        <span className='font-medium text-right text-blue-600'>
                          {formData.diagnosis}
                        </span>
                      </div>
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
                    {saving ? 'Saving Changes...' : 'Update Prescription'}
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
                      No changes made to the prescription
                    </p>
                  </div>
                )}

                <div className='mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg'>
                  <p className='text-xs text-yellow-800'>
                    <strong>Note:</strong> Updating this prescription will
                    notify the patient and pharmacy of the changes.
                  </p>
                </div>
              </motion.div>

              {/* Patient Allergies Warning */}
              {patient?.allergies && patient.allergies.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className='bg-red-50 border border-red-200 rounded-xl p-6'
                >
                  <h3 className='font-semibold text-red-900 mb-3 flex items-center gap-2'>
                    <FiAlertCircle className='w-4 h-4' />
                    Patient Allergies
                  </h3>
                  <div className='space-y-2 text-sm text-red-800'>
                    <p className='font-medium'>Known allergies:</p>
                    <div className='flex flex-wrap gap-1'>
                      {patient.allergies.map((allergy, index) => (
                        <span
                          key={index}
                          className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200'
                        >
                          {allergy}
                        </span>
                      ))}
                    </div>
                    <p className='text-xs mt-2'>
                      Please verify that prescribed medications do not conflict
                      with these allergies.
                    </p>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

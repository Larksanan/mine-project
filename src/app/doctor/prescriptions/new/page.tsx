'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiArrowLeft,
  FiSave,
  FiPlus,
  FiTrash2,
  FiUser,
  FiAlertCircle,
  FiFileText,
  FiCheck,
  FiX,
  FiSearch,
  FiPackage,
  FiClock,
  FiActivity,
  FiAlertTriangle,
  FiInfo,
  FiChevronDown,
  FiChevronUp,
  FiCalendar,
} from 'react-icons/fi';
import { IPatientFormData } from '@/types/patients';
import { PrescriptionFormData } from '@/types/Prescription';
import { Medication } from '@/types/Medication';
import Toast from '@/components/ui/Toast';

export default function NewPrescriptionPage() {
  const router = useRouter();

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

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [nicSearch, setNicSearch] = useState('');
  const [searchingNic, setSearchingNic] = useState(false);
  const [selectedPatientDetails, setSelectedPatientDetails] =
    useState<IPatientFormData | null>(null);
  const [expandedMedications, setExpandedMedications] = useState<number[]>([0]);
  const [showTips, setShowTips] = useState(true);
  const [activeStep, setActiveStep] = useState(1);
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({
    show: false,
    message: '',
    type: 'info',
  });

  // Common medication options with categories
  const medicationCategories = {
    Antibiotics: [
      'Amoxicillin',
      'Azithromycin',
      'Ciprofloxacin',
      'Doxycycline',
    ],
    Cardiovascular: ['Lisinopril', 'Atorvastatin', 'Metoprolol', 'Amlodipine'],
    Diabetes: ['Metformin', 'Insulin', 'Glipizide'],
    Respiratory: ['Albuterol', 'Montelukast', 'Fluticasone'],
    Gastrointestinal: ['Omeprazole', 'Pantoprazole', 'Ranitidine'],
    Other: ['Levothyroxine', 'Sertraline', 'Prednisone'],
  };

  const dosageOptions = [
    '2.5mg',
    '5mg',
    '10mg',
    '20mg',
    '25mg',
    '40mg',
    '50mg',
    '80mg',
    '100mg',
    '200mg',
    '250mg',
    '500mg',
    '1000mg',
  ];

  const frequencyOptions = [
    { value: 'Once daily', icon: '1×', description: 'Take once per day' },
    { value: 'Twice daily', icon: '2×', description: 'Take twice per day' },
    {
      value: 'Three times daily',
      icon: '3×',
      description: 'Take three times per day',
    },
    {
      value: 'Four times daily',
      icon: '4×',
      description: 'Take four times per day',
    },
    { value: 'Every 6 hours', icon: '6h', description: 'Every 6 hours' },
    { value: 'Every 8 hours', icon: '8h', description: 'Every 8 hours' },
    { value: 'Every 12 hours', icon: '12h', description: 'Every 12 hours' },
    { value: 'As needed', icon: 'PRN', description: 'As needed' },
    { value: 'Before meals', icon: 'AC', description: 'Before meals' },
    { value: 'After meals', icon: 'PC', description: 'After meals' },
    { value: 'At bedtime', icon: 'HS', description: 'At bedtime' },
  ];

  const durationOptions = [
    { value: '3 days', label: '3 Days', days: 3 },
    { value: '5 days', label: '5 Days', days: 5 },
    { value: '7 days', label: '7 Days (1 Week)', days: 7 },
    { value: '10 days', label: '10 Days', days: 10 },
    { value: '14 days', label: '14 Days (2 Weeks)', days: 14 },
    { value: '30 days', label: '30 Days (1 Month)', days: 30 },
    { value: '60 days', label: '60 Days (2 Months)', days: 60 },
    { value: '90 days', label: '90 Days (3 Months)', days: 90 },
  ];

  const steps = [
    {
      number: 1,
      title: 'Patient',
      icon: FiUser,
      completed: !!formData.patientId,
    },
    {
      number: 2,
      title: 'Diagnosis',
      icon: FiFileText,
      completed: !!formData.diagnosis,
    },
    {
      number: 3,
      title: 'Medications',
      icon: FiPackage,
      completed: formData.medications.every(m => m.name && m.dosage),
    },
    { number: 4, title: 'Review', icon: FiCheck, completed: false },
  ];

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.patientId) errors.patientId = 'Patient is required';
    if (!formData.diagnosis) errors.diagnosis = 'Diagnosis is required';
    if (!formData.startDate) errors.startDate = 'Start date is required';

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
    });

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      setToast({
        show: true,
        message: 'Please fix the errors in the form',
        type: 'error',
      });
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/doctor/prescriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create prescription');
      }

      const result = await response.json();

      if (result.success) {
        setToast({
          show: true,
          message: 'Prescription created successfully',
          type: 'success',
        });

        setTimeout(() => {
          router.push('/doctor/prescriptions');
        }, 1500);
      } else {
        throw new Error(result.message || 'Failed to create prescription');
      }
    } catch (error) {
      console.error('Error creating prescription:', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to create prescription';
      setError(errorMessage);
      setToast({
        show: true,
        message: errorMessage,
        type: 'error',
      });
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

    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleNicSearch = async () => {
    if (!nicSearch.trim()) {
      setToast({
        show: true,
        message: 'Please enter a NIC number',
        type: 'error',
      });
      return;
    }

    try {
      setSearchingNic(true);
      setError(null);

      const response = await fetch(
        `/api/patients?search=${encodeURIComponent(nicSearch)}`
      );

      if (!response.ok) {
        throw new Error('Patient not found');
      }

      const result = await response.json();

      const patients = result.data || result.patients;
      if (patients && patients.length > 0) {
        const patient = patients[0];
        setFormData(prev => ({ ...prev, patientId: patient._id }));
        setSelectedPatientDetails(patient);
        setNicSearch('');
        setActiveStep(2);
        setToast({
          show: true,
          message: `Patient found: ${patient.firstName} ${patient.lastName}`,
          type: 'success',
        });
      } else {
        setToast({
          show: true,
          message: 'Patient not found with this NIC',
          type: 'error',
        });
        setSelectedPatientDetails(null);
      }
    } catch (error) {
      console.error('Error searching patient:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Patient not found';
      setToast({
        show: true,
        message: errorMessage,
        type: 'error',
      });
      setSelectedPatientDetails(null);
    } finally {
      setSearchingNic(false);
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

    const errorKey = `medication_${index}_${field}`;
    if (formErrors[errorKey]) {
      setFormErrors(prev => ({
        ...prev,
        [errorKey]: '',
      }));
    }
  };

  const addMedication = () => {
    const newIndex = formData.medications.length;
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
    setExpandedMedications(prev => [...prev, newIndex]);
  };

  const removeMedication = (index: number) => {
    if (formData.medications.length > 1) {
      setFormData(prev => ({
        ...prev,
        medications: prev.medications.filter((_, i) => i !== index),
      }));
      setExpandedMedications(prev => prev.filter(i => i !== index));
    }
  };

  const toggleMedication = (index: number) => {
    setExpandedMedications(prev =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
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

  useEffect(() => {
    if (formData.startDate && formData.medications[0]?.duration) {
      const durationMatch = formData.medications[0].duration.match(/\d+/);
      const days = durationMatch ? parseInt(durationMatch[0]) : 0;

      if (days > 0) {
        const start = new Date(formData.startDate);
        const end = new Date(start);
        end.setDate(start.getDate() + days);
        setFormData(prev => ({
          ...prev,
          endDate: end.toISOString().split('T')[0],
        }));
      }
    }
  }, [formData.medications, formData.startDate]);

  return (
    <div className='min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-indigo-50'>
      <div className='fixed inset-0 overflow-hidden pointer-events-none'>
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'linear',
          }}
          className='absolute -top-40 -right-40 w-96 h-96 bg-linear-to-br from-blue-200/30 to-purple-200/30 rounded-full blur-3xl'
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [90, 0, 90],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: 'linear',
          }}
          className='absolute -bottom-40 -left-40 w-96 h-96 bg-linear-to-br from-indigo-200/30 to-blue-200/30 rounded-full blur-3xl'
        />
      </div>

      <div className='relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {/* Enhanced Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className='mb-8'
        >
          <motion.button
            whileHover={{ x: -5 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push('/doctor/prescriptions')}
            className='group flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6 transition-colors'
          >
            <motion.div
              whileHover={{ x: -3 }}
              className='p-2 bg-white rounded-lg shadow-sm group-hover:shadow-md transition-all'
            >
              <FiArrowLeft className='w-5 h-5' />
            </motion.div>
            <span className='font-medium'>Back to Prescriptions</span>
          </motion.button>

          <div className='flex items-start justify-between'>
            <div>
              <h1 className='text-4xl font-bold bg-linear-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2'>
                New Prescription
              </h1>
              <p className='text-slate-600'>
                Create a comprehensive prescription for your patient
              </p>
            </div>

            {/* Steps Progress */}
            <div className='hidden lg:flex items-center gap-2'>
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isActive = activeStep === step.number;
                const isCompleted = step.completed;

                return (
                  <React.Fragment key={step.number}>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/50'
                          : isCompleted
                            ? 'bg-green-100 text-green-700'
                            : 'bg-white text-slate-400'
                      }`}
                    >
                      <Icon className='w-4 h-4' />
                      <span className='text-sm font-medium'>{step.title}</span>
                      {isCompleted && <FiCheck className='w-4 h-4' />}
                    </motion.div>
                    {index < steps.length - 1 && (
                      <div
                        className={`h-0.5 w-8 ${isCompleted ? 'bg-green-300' : 'bg-slate-200'}`}
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Error Alert */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              className='mb-6 overflow-hidden'
            >
              <div className='bg-red-50 border-l-4 border-red-500 rounded-r-xl p-4 shadow-lg'>
                <div className='flex items-center gap-3'>
                  <div className='p-2 bg-red-100 rounded-lg'>
                    <FiAlertCircle className='w-5 h-5 text-red-600' />
                  </div>
                  <div>
                    <h3 className='font-semibold text-red-900'>Error</h3>
                    <p className='text-sm text-red-700'>{error}</p>
                  </div>
                  <button
                    onClick={() => setError(null)}
                    className='ml-auto p-1 hover:bg-red-100 rounded-lg transition-colors'
                  >
                    <FiX className='w-5 h-5 text-red-600' />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit}>
          <div className='grid grid-cols-1 xl:grid-cols-3 gap-6'>
            {/* Main Content */}
            <div className='xl:col-span-2 space-y-6'>
              {/* Step 1: Patient Selection */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className='group bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/50 overflow-hidden hover:shadow-2xl transition-all duration-300'
              >
                <div className='bg-linear-to-r from-blue-500 to-indigo-500 p-6'>
                  <div className='flex items-center gap-3 text-white'>
                    <div className='p-3 bg-white/20 backdrop-blur-sm rounded-xl'>
                      <FiUser className='w-6 h-6' />
                    </div>
                    <div>
                      <h2 className='text-2xl font-bold'>
                        Patient Information
                      </h2>
                      <p className='text-blue-100 text-sm'>
                        Search and select patient
                      </p>
                    </div>
                    {selectedPatientDetails && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className='ml-auto p-2 bg-green-500 rounded-full'
                      >
                        <FiCheck className='w-5 h-5' />
                      </motion.div>
                    )}
                  </div>
                </div>

                <div className='p-6'>
                  <div className='relative'>
                    <label className='block text-sm font-semibold text-slate-700 mb-3'>
                      <span className='flex items-center gap-2'>
                        <FiSearch className='w-4 h-4' />
                        Search by NIC Number
                        <span className='text-red-500'>*</span>
                      </span>
                    </label>
                    <div className='flex gap-3'>
                      <div className='relative flex-1'>
                        <FiSearch className='absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5' />
                        <input
                          type='text'
                          value={nicSearch}
                          onChange={e => setNicSearch(e.target.value)}
                          placeholder='Enter NIC number (e.g., 200269700372)'
                          className={`w-full pl-12 pr-4 py-3.5 border-2 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                            formErrors.patientId
                              ? 'border-red-300 bg-red-50'
                              : 'border-slate-200 bg-white'
                          }`}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleNicSearch();
                            }
                          }}
                        />
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type='button'
                        onClick={handleNicSearch}
                        disabled={searchingNic}
                        className='px-6 py-3.5 bg-linear-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2'
                      >
                        {searchingNic ? (
                          <>
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{
                                duration: 1,
                                repeat: Infinity,
                                ease: 'linear',
                              }}
                              className='w-5 h-5 border-2 border-white border-t-transparent rounded-full'
                            />
                            Searching...
                          </>
                        ) : (
                          <>
                            <FiSearch className='w-5 h-5' />
                            Search
                          </>
                        )}
                      </motion.button>
                    </div>
                    {formErrors.patientId && !selectedPatientDetails && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className='mt-2 text-sm text-red-600 flex items-center gap-1'
                      >
                        <FiAlertCircle className='w-4 h-4' />
                        {formErrors.patientId}
                      </motion.p>
                    )}
                  </div>

                  {/* Selected Patient Card */}
                  <AnimatePresence mode='wait'>
                    {selectedPatientDetails && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className='mt-6 overflow-hidden'
                      >
                        <div className='relative p-6 bg-linear-to-br from-blue-50 via-indigo-50 to-purple-50 border-2 border-blue-200 rounded-2xl'>
                          <div className='absolute top-0 right-0 w-32 h-32 bg-linear-to-br from-blue-400/10 to-purple-400/10 rounded-bl-full' />

                          <div className='relative'>
                            <div className='flex items-start justify-between mb-4'>
                              <div className='flex items-center gap-3'>
                                <div className='p-3 bg-blue-600 rounded-xl'>
                                  <FiUser className='w-6 h-6 text-white' />
                                </div>
                                <div>
                                  <h3 className='text-xl font-bold text-slate-900'>
                                    {selectedPatientDetails.firstName}{' '}
                                    {selectedPatientDetails.lastName}
                                  </h3>
                                  <p className='text-sm text-slate-600'>
                                    Patient Details
                                  </p>
                                </div>
                              </div>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                type='button'
                                onClick={() => {
                                  setSelectedPatientDetails(null);
                                  setFormData(prev => ({
                                    ...prev,
                                    patientId: '',
                                  }));
                                  setNicSearch('');
                                  setActiveStep(1);
                                }}
                                className='px-4 py-2 bg-white hover:bg-red-50 text-red-600 rounded-lg transition-colors font-medium text-sm border border-red-200'
                              >
                                Change
                              </motion.button>
                            </div>

                            <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                              <div className='p-3 bg-white/80 backdrop-blur-sm rounded-xl'>
                                <p className='text-xs font-medium text-slate-500 mb-1'>
                                  Email
                                </p>
                                <p className='text-sm font-semibold text-slate-900 truncate'>
                                  {selectedPatientDetails.email}
                                </p>
                              </div>
                              <div className='p-3 bg-white/80 backdrop-blur-sm rounded-xl'>
                                <p className='text-xs font-medium text-slate-500 mb-1'>
                                  Age
                                </p>
                                <p className='text-sm font-semibold text-slate-900'>
                                  {calculateAge(
                                    selectedPatientDetails.dateOfBirth
                                  )}{' '}
                                  years
                                </p>
                              </div>
                              <div className='p-3 bg-white/80 backdrop-blur-sm rounded-xl'>
                                <p className='text-xs font-medium text-slate-500 mb-1'>
                                  Gender
                                </p>
                                <p className='text-sm font-semibold text-slate-900 capitalize'>
                                  {selectedPatientDetails.gender.toLowerCase()}
                                </p>
                              </div>
                              <div className='p-3 bg-white/80 backdrop-blur-sm rounded-xl'>
                                <p className='text-xs font-medium text-slate-500 mb-1'>
                                  DOB
                                </p>
                                <p className='text-sm font-semibold text-slate-900'>
                                  {new Date(
                                    selectedPatientDetails.dateOfBirth
                                  ).toLocaleDateString('en-LK')}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>

              {/* Step 2: Diagnosis */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className='bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/50 overflow-hidden hover:shadow-2xl transition-all duration-300'
              >
                <div className='bg-linear-to-r from-green-500 to-emerald-500 p-6'>
                  <div className='flex items-center gap-3 text-white'>
                    <div className='p-3 bg-white/20 backdrop-blur-sm rounded-xl'>
                      <FiFileText className='w-6 h-6' />
                    </div>
                    <div>
                      <h2 className='text-2xl font-bold'>
                        Diagnosis & Treatment
                      </h2>
                      <p className='text-green-100 text-sm'>
                        Primary diagnosis and dates
                      </p>
                    </div>
                  </div>
                </div>

                <div className='p-6 space-y-6'>
                  <div>
                    <label className='block text-sm font-semibold text-slate-700 mb-2'>
                      Primary Diagnosis <span className='text-red-500'>*</span>
                    </label>
                    <input
                      type='text'
                      name='diagnosis'
                      value={formData.diagnosis}
                      onChange={handleChange}
                      placeholder='Enter primary diagnosis (e.g., Acute Bronchitis, Type 2 Diabetes)'
                      className={`w-full px-4 py-3.5 border-2 rounded-xl focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all ${
                        formErrors.diagnosis
                          ? 'border-red-300 bg-red-50'
                          : 'border-slate-200'
                      }`}
                    />
                    {formErrors.diagnosis && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className='mt-2 text-sm text-red-600 flex items-center gap-1'
                      >
                        <FiAlertCircle className='w-4 h-4' />
                        {formErrors.diagnosis}
                      </motion.p>
                    )}
                  </div>

                  <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                    <div>
                      <label className='block text-sm font-semibold text-slate-700 mb-2'>
                        <span className='flex items-center gap-2'>
                          <FiCalendar className='w-4 h-4' />
                          Start Date
                          <span className='text-red-500'>*</span>
                        </span>
                      </label>
                      <input
                        type='date'
                        name='startDate'
                        value={formData.startDate}
                        onChange={handleChange}
                        className={`w-full px-4 py-3.5 border-2 rounded-xl focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all ${
                          formErrors.startDate
                            ? 'border-red-300 bg-red-50'
                            : 'border-slate-200'
                        }`}
                      />
                      {formErrors.startDate && (
                        <motion.p
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className='mt-2 text-sm text-red-600 flex items-center gap-1'
                        >
                          <FiAlertCircle className='w-4 h-4' />
                          {formErrors.startDate}
                        </motion.p>
                      )}
                    </div>

                    <div>
                      <label className='block text-sm font-semibold text-slate-700 mb-2'>
                        <span className='flex items-center gap-2'>
                          <FiCalendar className='w-4 h-4' />
                          End Date
                          <span className='text-xs text-slate-500 font-normal'>
                            (Auto-calculated)
                          </span>
                        </span>
                      </label>
                      <input
                        type='date'
                        name='endDate'
                        value={formData.endDate}
                        onChange={handleChange}
                        className='w-full px-4 py-3.5 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all'
                      />
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Step 3: Medications */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className='bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/50 overflow-hidden hover:shadow-2xl transition-all duration-300'
              >
                <div className='bg-linear-to-r from-purple-500 to-pink-500 p-6'>
                  <div className='flex items-center justify-between text-white'>
                    <div className='flex items-center gap-3'>
                      <div className='p-3 bg-white/20 backdrop-blur-sm rounded-xl'>
                        <FiPackage className='w-6 h-6' />
                      </div>
                      <div>
                        <h2 className='text-2xl font-bold'>Medications</h2>
                        <p className='text-purple-100 text-sm'>
                          {formData.medications.length} medication(s) prescribed
                        </p>
                      </div>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      type='button'
                      onClick={addMedication}
                      className='px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-xl transition-all flex items-center gap-2 font-medium'
                    >
                      <FiPlus className='w-5 h-5' />
                      Add Medication
                    </motion.button>
                  </div>
                </div>

                <div className='p-6 space-y-4'>
                  <AnimatePresence mode='popLayout'>
                    {formData.medications.map((medication, index) => {
                      const isExpanded = expandedMedications.includes(index);
                      const hasErrors = Object.keys(formErrors).some(key =>
                        key.startsWith(`medication_${index}_`)
                      );

                      return (
                        <motion.div
                          key={index}
                          layout
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9, x: -50 }}
                          className={`border-2 rounded-2xl overflow-hidden transition-all ${
                            hasErrors
                              ? 'border-red-300 bg-red-50/50'
                              : isExpanded
                                ? 'border-purple-300 bg-linear-to-br from-purple-50 to-pink-50'
                                : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                        >
                          {/* Medication Header */}
                          <div
                            className='flex items-center justify-between p-4 cursor-pointer'
                            onClick={() => toggleMedication(index)}
                          >
                            <div className='flex items-center gap-3'>
                              <div
                                className={`p-2 rounded-lg ${
                                  hasErrors ? 'bg-red-100' : 'bg-purple-100'
                                }`}
                              >
                                <FiPackage
                                  className={`w-5 h-5 ${
                                    hasErrors
                                      ? 'text-red-600'
                                      : 'text-purple-600'
                                  }`}
                                />
                              </div>
                              <div>
                                <h3 className='font-bold text-slate-900'>
                                  {medication.name ||
                                    `Medication #${index + 1}`}
                                </h3>
                                {medication.dosage && (
                                  <p className='text-sm text-slate-600'>
                                    {medication.dosage} • {medication.frequency}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className='flex items-center gap-2'>
                              {formData.medications.length > 1 && (
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  type='button'
                                  onClick={e => {
                                    e.stopPropagation();
                                    removeMedication(index);
                                  }}
                                  className='p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors'
                                >
                                  <FiTrash2 className='w-5 h-5' />
                                </motion.button>
                              )}
                              <motion.div
                                animate={{ rotate: isExpanded ? 180 : 0 }}
                                className='p-2'
                              >
                                {isExpanded ? (
                                  <FiChevronUp className='w-5 h-5 text-slate-400' />
                                ) : (
                                  <FiChevronDown className='w-5 h-5 text-slate-400' />
                                )}
                              </motion.div>
                            </div>
                          </div>

                          {/* Medication Details */}
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className='overflow-hidden'
                              >
                                <div className='px-4 pb-4 space-y-4'>
                                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                                    {/* Medication Name */}
                                    <div>
                                      <label className='block text-sm font-semibold text-slate-700 mb-2'>
                                        Medication Name{' '}
                                        <span className='text-red-500'>*</span>
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
                                        placeholder='Enter medication name'
                                        list={`medications-${index}`}
                                        className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all ${
                                          formErrors[`medication_${index}_name`]
                                            ? 'border-red-300 bg-red-50'
                                            : 'border-slate-200'
                                        }`}
                                      />
                                      <datalist id={`medications-${index}`}>
                                        {Object.entries(
                                          medicationCategories
                                        ).map(([category, meds]) =>
                                          meds.map(med => (
                                            <option key={med} value={med}>
                                              {category}
                                            </option>
                                          ))
                                        )}
                                      </datalist>
                                      {formErrors[
                                        `medication_${index}_name`
                                      ] && (
                                        <p className='mt-1 text-sm text-red-600'>
                                          {
                                            formErrors[
                                              `medication_${index}_name`
                                            ]
                                          }
                                        </p>
                                      )}
                                    </div>

                                    {/* Dosage */}
                                    <div>
                                      <label className='block text-sm font-semibold text-slate-700 mb-2'>
                                        Dosage{' '}
                                        <span className='text-red-500'>*</span>
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
                                        placeholder='e.g., 500mg, 10mg'
                                        list={`dosages-${index}`}
                                        className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all ${
                                          formErrors[
                                            `medication_${index}_dosage`
                                          ]
                                            ? 'border-red-300 bg-red-50'
                                            : 'border-slate-200'
                                        }`}
                                      />
                                      <datalist id={`dosages-${index}`}>
                                        {dosageOptions.map(dosage => (
                                          <option key={dosage} value={dosage} />
                                        ))}
                                      </datalist>
                                      {formErrors[
                                        `medication_${index}_dosage`
                                      ] && (
                                        <p className='mt-1 text-sm text-red-600'>
                                          {
                                            formErrors[
                                              `medication_${index}_dosage`
                                            ]
                                          }
                                        </p>
                                      )}
                                    </div>

                                    {/* Frequency */}
                                    <div>
                                      <label className='block text-sm font-semibold text-slate-700 mb-2'>
                                        Frequency{' '}
                                        <span className='text-red-500'>*</span>
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
                                        className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all ${
                                          formErrors[
                                            `medication_${index}_frequency`
                                          ]
                                            ? 'border-red-300 bg-red-50'
                                            : 'border-slate-200'
                                        }`}
                                      >
                                        <option value=''>
                                          Select frequency...
                                        </option>
                                        {frequencyOptions.map(freq => (
                                          <option
                                            key={freq.value}
                                            value={freq.value}
                                          >
                                            {freq.icon} - {freq.value}
                                          </option>
                                        ))}
                                      </select>
                                      {formErrors[
                                        `medication_${index}_frequency`
                                      ] && (
                                        <p className='mt-1 text-sm text-red-600'>
                                          {
                                            formErrors[
                                              `medication_${index}_frequency`
                                            ]
                                          }
                                        </p>
                                      )}
                                    </div>

                                    {/* Duration */}
                                    <div>
                                      <label className='block text-sm font-semibold text-slate-700 mb-2'>
                                        Duration{' '}
                                        <span className='text-red-500'>*</span>
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
                                        className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all ${
                                          formErrors[
                                            `medication_${index}_duration`
                                          ]
                                            ? 'border-red-300 bg-red-50'
                                            : 'border-slate-200'
                                        }`}
                                      >
                                        <option value=''>
                                          Select duration...
                                        </option>
                                        {durationOptions.map(duration => (
                                          <option
                                            key={duration.value}
                                            value={duration.value}
                                          >
                                            {duration.label}
                                          </option>
                                        ))}
                                      </select>
                                      {formErrors[
                                        `medication_${index}_duration`
                                      ] && (
                                        <p className='mt-1 text-sm text-red-600'>
                                          {
                                            formErrors[
                                              `medication_${index}_duration`
                                            ]
                                          }
                                        </p>
                                      )}
                                    </div>

                                    {/* Quantity */}
                                    <div>
                                      <label className='block text-sm font-semibold text-slate-700 mb-2'>
                                        Quantity{' '}
                                        <span className='text-red-500'>*</span>
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
                                        className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all ${
                                          formErrors[
                                            `medication_${index}_quantity`
                                          ]
                                            ? 'border-red-300 bg-red-50'
                                            : 'border-slate-200'
                                        }`}
                                      />
                                      {formErrors[
                                        `medication_${index}_quantity`
                                      ] && (
                                        <p className='mt-1 text-sm text-red-600'>
                                          {
                                            formErrors[
                                              `medication_${index}_quantity`
                                            ]
                                          }
                                        </p>
                                      )}
                                    </div>

                                    {/* Refills */}
                                    <div>
                                      <label className='block text-sm font-semibold text-slate-700 mb-2'>
                                        Refills Allowed
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
                                        className='w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all'
                                      />
                                    </div>
                                  </div>

                                  {/* Special Instructions */}
                                  <div>
                                    <label className='block text-sm font-semibold text-slate-700 mb-2'>
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
                                      placeholder='e.g., Take with food, Avoid alcohol, Take before bedtime'
                                      className='w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all resize-none'
                                    />
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </motion.div>

              {/* Additional Notes */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className='bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/50 p-6 hover:shadow-2xl transition-all duration-300'
              >
                <label className='block text-sm font-semibold text-slate-700 mb-3 items-center gap-2'>
                  <FiFileText className='w-5 h-5 text-orange-500' />
                  Additional Notes & Instructions
                </label>
                <textarea
                  name='notes'
                  value={formData.notes}
                  onChange={handleChange}
                  rows={4}
                  placeholder='Enter any additional notes, warnings, or instructions for the patient...'
                  className='w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 transition-all resize-none'
                />
              </motion.div>
            </div>
            <div className='space-y-6'>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className='sticky top-6 bg-linear-to-br from-white to-slate-50 rounded-2xl shadow-xl border border-slate-200/50 overflow-hidden'
              >
                <div className='bg-linear-to-r from-slate-900 to-slate-700 p-6'>
                  <h2 className='text-xl font-bold text-white flex items-center gap-2'>
                    <FiActivity className='w-6 h-6' />
                    Prescription Summary
                  </h2>
                </div>

                <div className='p-6 space-y-4'>
                  {selectedPatientDetails ? (
                    <div className='p-4 bg-linear-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200'>
                      <div className='flex items-center gap-2 mb-2'>
                        <FiCheck className='w-5 h-5 text-blue-600' />
                        <span className='font-semibold text-blue-900'>
                          Patient Selected
                        </span>
                      </div>
                      <p className='text-sm text-blue-700'>
                        {selectedPatientDetails.firstName}{' '}
                        {selectedPatientDetails.lastName}
                      </p>
                    </div>
                  ) : (
                    <div className='p-4 bg-yellow-50 rounded-xl border border-yellow-200'>
                      <div className='flex items-center gap-2 mb-2'>
                        <FiAlertTriangle className='w-5 h-5 text-yellow-600' />
                        <span className='font-semibold text-yellow-900'>
                          No Patient Selected
                        </span>
                      </div>
                      <p className='text-sm text-yellow-700'>
                        Search and select a patient to continue
                      </p>
                    </div>
                  )}

                  <div className='space-y-3'>
                    <div className='flex justify-between items-center py-2 border-b border-slate-200'>
                      <span className='text-slate-600 text-sm'>
                        Medications
                      </span>
                      <span className='font-bold text-slate-900'>
                        {formData.medications.length}
                      </span>
                    </div>

                    {formData.diagnosis && (
                      <div className='p-3 bg-green-50 rounded-lg'>
                        <p className='text-xs text-green-600 font-medium mb-1'>
                          Diagnosis
                        </p>
                        <p className='text-sm text-green-900 font-semibold'>
                          {formData.diagnosis}
                        </p>
                      </div>
                    )}

                    {formData.startDate && (
                      <div className='flex justify-between items-center py-2'>
                        <span className='text-slate-600 text-sm flex items-center gap-1'>
                          <FiClock className='w-4 h-4' />
                          Start Date
                        </span>
                        <span className='font-semibold text-slate-900 text-sm'>
                          {new Date(formData.startDate).toLocaleDateString()}
                        </span>
                      </div>
                    )}

                    {formData.endDate && (
                      <div className='flex justify-between items-center py-2'>
                        <span className='text-slate-600 text-sm flex items-center gap-1'>
                          <FiClock className='w-4 h-4' />
                          End Date
                        </span>
                        <span className='font-semibold text-slate-900 text-sm'>
                          {new Date(formData.endDate).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className='space-y-3 pt-4'>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type='submit'
                      disabled={saving}
                      className='w-full py-4 bg-linear-to-r from-blue-600 via-indigo-600 to-purple-600 text-white font-bold rounded-xl hover:shadow-2xl hover:shadow-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 relative overflow-hidden group'
                    >
                      <motion.div
                        className='absolute inset-0 bg-linear-to-r from-white/0 via-white/20 to-white/0'
                        animate={{
                          x: ['-100%', '100%'],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: 'linear',
                        }}
                      />
                      {saving ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{
                              duration: 1,
                              repeat: Infinity,
                              ease: 'linear',
                            }}
                            className='w-5 h-5 border-2 border-white border-t-transparent rounded-full'
                          />
                          Creating Prescription...
                        </>
                      ) : (
                        <>
                          <FiSave className='w-5 h-5' />
                          Create Prescription
                        </>
                      )}
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type='button'
                      onClick={() => router.push('/doctor/prescriptions')}
                      className='w-full py-3 text-slate-700 border-2 border-slate-300 font-semibold rounded-xl hover:bg-slate-50 transition-all'
                    >
                      Cancel
                    </motion.button>
                  </div>

                  <div className='p-4 bg-linear-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-200'>
                    <div className='flex items-start gap-2'>
                      <FiInfo className='w-5 h-5 text-amber-600 shrink-0 mt-0.5' />
                      <p className='text-xs text-amber-800'>
                        <strong>Note:</strong> This prescription will be
                        immediately available to the patient and pharmacy upon
                        creation.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Tips */}
              <AnimatePresence>
                {showTips && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: 0.5 }}
                    className='bg-linear-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-lg border border-blue-200 overflow-hidden'
                  >
                    <div className='p-6'>
                      <div className='flex items-start justify-between mb-4'>
                        <h3 className='font-bold text-blue-900 flex items-center gap-2'>
                          <FiInfo className='w-5 h-5' />
                          Prescription Tips
                        </h3>
                        <button
                          onClick={() => setShowTips(false)}
                          className='p-1 hover:bg-blue-100 rounded-lg transition-colors'
                        >
                          <FiX className='w-4 h-4 text-blue-600' />
                        </button>
                      </div>
                      <ul className='space-y-3'>
                        {[
                          'Check patient allergies before prescribing',
                          'Include clear dosage instructions',
                          'Specify duration and refills clearly',
                          'Review drug interactions for multiple medications',
                          'Add special instructions for complex regimens',
                        ].map((tip, index) => (
                          <motion.li
                            key={index}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.6 + index * 0.1 }}
                            className='flex items-start gap-2 text-sm text-blue-800'
                          >
                            <FiCheck className='w-4 h-4 text-blue-600 shrink-0 mt-0.5' />
                            <span>{tip}</span>
                          </motion.li>
                        ))}
                      </ul>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </form>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast.show && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(prev => ({ ...prev, show: false }))}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

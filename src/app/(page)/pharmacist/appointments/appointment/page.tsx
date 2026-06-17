/* eslint-disable no-undef */
/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  FiArrowLeft,
  FiSave,
  FiUser,
  FiCalendar,
  FiClock,
  FiMapPin,
  FiFileText,
  FiX,
  FiSearch,
} from 'react-icons/fi';
import Loading from '@/components/Loading';
import { IPatientFormData } from '@/types/patients';

interface Pharmacy {
  id: string;
  name: string;
  address: string;
  phone: string;
}

interface AppointmentFormData {
  patientId: string;
  pharmacyId: string;
  appointmentDate: string;
  appointmentTime: string;
  duration: number;
  serviceType: string;
  reason: string;
  notes: string;
}

const serviceTypes = [
  { value: 'MEDICATION_REVIEW', label: 'Medication Review' },
  { value: 'CHRONIC_DISEASE_MANAGEMENT', label: 'Chronic Disease Management' },
  { value: 'VACCINATION', label: 'Vaccination' },
  { value: 'HEALTH_SCREENING', label: 'Health Screening' },
  { value: 'PRESCRIPTION_CONSULTATION', label: 'Prescription Consultation' },
  { value: 'OTHER', label: 'Other' },
];

const timeSlots = [
  '09:00',
  '09:30',
  '10:00',
  '10:30',
  '11:00',
  '11:30',
  '12:00',
  '12:30',
  '13:00',
  '13:30',
  '14:00',
  '14:30',
  '15:00',
  '15:30',
  '16:00',
  '16:30',
  '17:00',
  '17:30',
];

const durationOptions = [
  { value: 15, label: '15 minutes' },
  { value: 30, label: '30 minutes' },
  { value: 45, label: '45 minutes' },
  { value: 60, label: '60 minutes' },
  { value: 90, label: '90 minutes' },
];

export default function NewAppointmentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [patients, setPatients] = useState<IPatientFormData[]>([]);
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [showPatientSearch, setShowPatientSearch] = useState(false);
  const [patientSearch, setPatientSearch] = useState('');
  const [selectedPatient, setSelectedPatient] =
    useState<IPatientFormData | null>(null);

  const [formData, setFormData] = useState<AppointmentFormData>({
    patientId: '',
    pharmacyId: '',
    appointmentDate: '',
    appointmentTime: '',
    duration: 30,
    serviceType: 'MEDICATION_REVIEW',
    reason: '',
    notes: '',
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch patients and pharmacies in parallel
      const [patientsResponse, pharmaciesResponse] = await Promise.all([
        fetch('/api/patient/?limit=100'),
        fetch('/api/pharmacy'),
      ]);

      if (!patientsResponse.ok || !pharmaciesResponse.ok) {
        throw new Error('Failed to fetch initial data');
      }

      const patientsData = await patientsResponse.json();
      const pharmaciesData = await pharmaciesResponse.json();

      if (patientsData.success) {
        setPatients(patientsData.data.patients || []);
      }

      if (pharmaciesData.success) {
        setPharmacies(pharmaciesData.data.pharmacies || []);

        // Auto-select the first pharmacy if available
        if (pharmaciesData.data.pharmacies?.length > 0) {
          setFormData(prev => ({
            ...prev,
            pharmacyId: pharmaciesData.data.pharmacies[0].id,
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching initial data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load data');

      // Load mock data for development
      setPatients(getMockPatients());
      setPharmacies(getMockPharmacies());
      setFormData(prev => ({
        ...prev,
        pharmacyId: 'pharmacy1',
      }));
    } finally {
      setLoading(false);
    }
  };

  // Mock data for development
  const getMockPatients = (): IPatientFormData[] => [];

  const getMockPharmacies = (): Pharmacy[] => [
    {
      id: 'pharmacy1',
      name: 'Main Street Pharmacy',
      address: 'thalaimanar,mannar',
      phone: '076239795',
    },
    {
      id: 'pharmacy2',
      name: 'Health Plus Pharmacy',
      address: 'batticaloa road,kalkuthavelai',
      phone: '+1234567891',
    },
  ];

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'duration' ? parseInt(value) : value,
    }));
  };

  const handlePatientSelect = (patient: IPatientFormData) => {
    setSelectedPatient(patient);
    setFormData(prev => ({
      ...prev,
      patientId: patient.userId || '',
    }));
    setShowPatientSearch(false);
    setPatientSearch('');
  };

  const clearSelectedPatient = () => {
    setSelectedPatient(null);
    setFormData(prev => ({
      ...prev,
      patientId: '',
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.patientId) {
      setError('Please select a patient');
      return;
    }

    if (!formData.pharmacyId) {
      setError('Please select a pharmacy');
      return;
    }

    if (!formData.appointmentDate || !formData.appointmentTime) {
      setError('Please select appointment date and time');
      return;
    }

    if (!formData.reason.trim()) {
      setError('Please provide a reason for the appointment');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const response = await fetch('/api/pharmacy/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create appointment');
      }

      if (data.success) {
        router.push('/pharmacy/appointments');
        router.refresh();
      } else {
        throw new Error(data.error || 'Failed to create appointment');
      }
    } catch (error) {
      console.error('Error creating appointment:', error);
      setError(
        error instanceof Error ? error.message : 'Failed to create appointment'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const filteredPatients = patients.filter(
    patient =>
      patient.firstName.toLowerCase().includes(patientSearch.toLowerCase()) ||
      patient.lastName.toLowerCase().includes(patientSearch.toLowerCase()) ||
      String(patient.medicalRecordNumber || '')
        .toLowerCase()
        .includes(patientSearch.toLowerCase()) ||
      patient.email.toLowerCase().includes(patientSearch.toLowerCase())
  );

  if (loading) return <Loading />;

  return (
    <div className='min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 p-4 sm:p-6'>
      <div className='max-w-4xl mx-auto'>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className='mb-8'
        >
          <button
            onClick={() => router.push('/Pharmacist/appointments')}
            className='flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors'
          >
            <FiArrowLeft />
            Back to Appointments
          </button>

          <div className='text-center'>
            <h1 className='text-3xl sm:text-4xl font-bold text-gray-900 bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text'>
              New Appointment
            </h1>
            <p className='text-gray-600 mt-2'>
              Schedule a new patient consultation
            </p>
          </div>
        </motion.div>

        {/* Error Alert */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className='mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3'
          >
            <FiX className='text-red-500 text-xl shrink-0' />
            <div className='flex-1'>
              <p className='text-red-800 text-sm'>{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className='text-red-600 hover:text-red-800 text-sm font-medium shrink-0'
            >
              Dismiss
            </button>
          </motion.div>
        )}

        {/* Appointment Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className='bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm p-6 border border-white/20'
        >
          <form onSubmit={handleSubmit} className='space-y-6'>
            {/* Patient Selection */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-3'>
                Select Patient *
              </label>

              {selectedPatient ? (
                <div className='bg-blue-50 border border-blue-200 rounded-xl p-4'>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-3'>
                      <div className='p-2 bg-blue-100 rounded-lg'>
                        <FiUser className='text-blue-600' />
                      </div>
                      <div>
                        <h4 className='font-semibold text-gray-900'>
                          {selectedPatient.firstName} {selectedPatient.lastName}
                        </h4>
                        <p className='text-sm text-gray-600'>
                          {selectedPatient.nic} • {selectedPatient.email}
                        </p>
                        <p className='text-xs text-gray-500 mt-1'>
                          DOB:{' '}
                          {new Date(
                            selectedPatient.dateOfBirth
                          ).toLocaleDateString()}{' '}
                          • Phone: {selectedPatient.phone}
                        </p>
                      </div>
                    </div>
                    <button
                      type='button'
                      onClick={clearSelectedPatient}
                      className='text-gray-400 hover:text-gray-600 transition-colors'
                    >
                      <FiX className='text-lg' />
                    </button>
                  </div>

                  {/* Patient Medical Info */}
                  <div className='mt-3 pt-3 border-t border-blue-200'>
                    <div className='flex flex-wrap gap-2'>
                      {selectedPatient.allergies.length > 0 && (
                        <div>
                          <span className='text-xs font-medium text-red-600'>
                            Allergies:
                          </span>
                          <span className='text-xs text-gray-600 ml-1'>
                            {selectedPatient.allergies.join(', ')}
                          </span>
                        </div>
                      )}
                      {selectedPatient.chronicConditions.length > 0 && (
                        <div>
                          <span className='text-xs font-medium text-orange-600'>
                            Conditions:
                          </span>
                          <span className='text-xs text-gray-600 ml-1'>
                            {selectedPatient.chronicConditions.join(', ')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className='relative'>
                  <button
                    type='button'
                    onClick={() => setShowPatientSearch(true)}
                    className='w-full flex items-center gap-3 p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-500 hover:bg-blue-50/50 transition-all duration-300 text-left'
                  >
                    <FiUser className='text-gray-400 text-xl' />
                    <div>
                      <p className='font-medium text-gray-700'>
                        Select a patient
                      </p>
                      <p className='text-sm text-gray-500'>
                        Click to search and select patient
                      </p>
                    </div>
                  </button>

                  {/* Patient Search Modal */}
                  {showPatientSearch && (
                    <div className='absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-10 max-h-96 overflow-y-auto'>
                      <div className='p-3 border-b border-gray-200'>
                        <div className='relative'>
                          <FiSearch className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400' />
                          <input
                            type='text'
                            placeholder='Search patients by name, MRN, or email...'
                            value={patientSearch}
                            onChange={e => setPatientSearch(e.target.value)}
                            className='w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                            autoFocus
                          />
                        </div>
                      </div>

                      <div className='p-2'>
                        {filteredPatients.length === 0 ? (
                          <div className='text-center py-4 text-gray-500'>
                            No patients found
                          </div>
                        ) : (
                          filteredPatients.map(patient => (
                            <button
                              key={patient.id}
                              type='button'
                              onClick={() => handlePatientSelect(patient)}
                              className='w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0'
                            >
                              <div className='flex items-center gap-3'>
                                <div className='p-2 bg-gray-100 rounded-lg'>
                                  <FiUser className='text-gray-600' />
                                </div>
                                <div className='flex-1'>
                                  <h4 className='font-semibold text-gray-900'>
                                    {patient.firstName} {patient.lastName}
                                  </h4>
                                  <p className='text-sm text-gray-600'>
                                    {patient.nic} • {patient.email}
                                  </p>
                                  <p className='text-xs text-gray-500'>
                                    DOB:{' '}
                                    {new Date(
                                      patient.dateOfBirth
                                    ).toLocaleDateString()}{' '}
                                    • Phone: {patient.phone}
                                  </p>
                                </div>
                              </div>
                            </button>
                          ))
                        )}
                      </div>

                      <div className='p-3 border-t border-gray-200'>
                        <button
                          type='button'
                          onClick={() => setShowPatientSearch(false)}
                          className='w-full text-center text-gray-600 hover:text-gray-800 py-2'
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Pharmacy Selection */}
            <div>
              <label
                htmlFor='pharmacyId'
                className='block text-sm font-medium text-gray-700 mb-2'
              >
                Pharmacy Location *
              </label>
              <div className='relative'>
                <FiMapPin className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400' />
                <select
                  id='pharmacyId'
                  name='pharmacyId'
                  value={formData.pharmacyId}
                  onChange={handleInputChange}
                  required
                  className='w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm transition-all duration-300'
                >
                  <option value=''>Select a pharmacy</option>
                  {pharmacies.map(pharmacy => (
                    <option key={`pharmacy-${pharmacy.id}`} value={pharmacy.id}>
                      {pharmacy.name} - {pharmacy.address}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Date and Time */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <label
                  htmlFor='appointmentDate'
                  className='block text-sm font-medium text-gray-700 mb-2'
                >
                  Appointment Date *
                </label>
                <div className='relative'>
                  <FiCalendar className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400' />
                  <input
                    type='date'
                    id='appointmentDate'
                    name='appointmentDate'
                    value={formData.appointmentDate}
                    onChange={handleInputChange}
                    min={getMinDate()}
                    required
                    className='w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm transition-all duration-300'
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor='appointmentTime'
                  className='block text-sm font-medium text-gray-700 mb-2'
                >
                  Appointment Time *
                </label>
                <div className='relative'>
                  <FiClock className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400' />
                  <select
                    id='appointmentTime'
                    name='appointmentTime'
                    value={formData.appointmentTime}
                    onChange={handleInputChange}
                    required
                    className='w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm transition-all duration-300'
                  >
                    <option value=''>Select time</option>
                    {timeSlots.map((time, index) => (
                      <option key={`time-${index}`} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Duration and Service Type */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <label
                  htmlFor='duration'
                  className='block text-sm font-medium text-gray-700 mb-2'
                >
                  Duration (minutes) *
                </label>
                <select
                  id='duration'
                  name='duration'
                  value={formData.duration}
                  onChange={handleInputChange}
                  required
                  className='w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm transition-all duration-300'
                >
                  {durationOptions.map(option => (
                    <option
                      key={`duration-${option.value}`}
                      value={option.value}
                    >
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor='serviceType'
                  className='block text-sm font-medium text-gray-700 mb-2'
                >
                  Service Type *
                </label>
                <select
                  id='serviceType'
                  name='serviceType'
                  value={formData.serviceType}
                  onChange={handleInputChange}
                  required
                  className='w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm transition-all duration-300'
                >
                  {serviceTypes.map(service => (
                    <option
                      key={`service-${service.value}`}
                      value={service.value}
                    >
                      {service.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Reason */}
            <div>
              <label
                htmlFor='reason'
                className='block text-sm font-medium text-gray-700 mb-2'
              >
                Reason for Appointment *
              </label>
              <div className='relative'>
                <FiFileText className='absolute left-3 top-3 text-gray-400' />
                <textarea
                  id='reason'
                  name='reason'
                  value={formData.reason}
                  onChange={handleInputChange}
                  required
                  rows={3}
                  placeholder='Please describe the reason for this appointment...'
                  className='w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm transition-all duration-300 resize-none'
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label
                htmlFor='notes'
                className='block text-sm font-medium text-gray-700 mb-2'
              >
                Additional Notes
              </label>
              <textarea
                id='notes'
                name='notes'
                value={formData.notes}
                onChange={handleInputChange}
                rows={2}
                placeholder='Any additional information or special requirements...'
                className='w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm transition-all duration-300 resize-none'
              />
            </div>

            {/* Submit Button */}
            <div className='flex gap-4 pt-6 border-t border-gray-200'>
              <button
                type='button'
                onClick={() => router.push('/Pharmacist/appointments')}
                className='flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-300'
              >
                Cancel
              </button>
              <button
                type='submit'
                disabled={submitting}
                className='flex-1 flex items-center justify-center gap-2 bg-linear-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 transition-all duration-300 shadow-lg hover:shadow-xl'
              >
                {submitting ? (
                  <>
                    <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' />
                    Creating...
                  </>
                ) : (
                  <>
                    <FiSave />
                    Create Appointment
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}

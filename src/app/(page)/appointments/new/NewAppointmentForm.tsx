'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import { Patient, AppointmentFormData } from '@/types/appointment';
import { DoctorProfile } from '@/types/doctor';
import Loading from '@/components/Loading';
import ErrorComponent from '@/components/Error';

import NewAppointmentHeader from '@/components/Appointment/NewAppointmentHeader';
import PatientSelection from '@/components/Appointment/PatientSelection';
import DoctorSelection from '@/components/Appointment/doctorSelection';
import AppointmentDetailsForm from '@/components/Appointment/Form/AppointmentDetailsForm';
import MedicalInfoForm from '@/components/Appointment/Form/MedicalInfoForm';
import AppointmentSummary from '@/components/Appointment/AppointmentSummary';
import AppointmentFormActions from '@/components/Appointment/Form/AppointmentFormActions';
import HelpTips from '@/components/Appointment/HelpTips';

const initialFormData: AppointmentFormData = {
  patientId: '',
  doctorId: '',
  appointmentDate: '',
  appointmentTime: '',
  duration: 30,
  type: 'CONSULTATION',
  status: 'SCHEDULED',
  reason: '',
  notes: '',
  diagnosis: '',
  prescription: '',
};

export default function NewAppointmentForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formData, setFormData] =
    useState<AppointmentFormData>(initialFormData);

  // Patient state
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);

  // Doctor state
  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [filteredDoctors, setFilteredDoctors] = useState<DoctorProfile[]>([]);
  const [doctorSearchTerm, setDoctorSearchTerm] = useState('');
  const [showDoctorDropdown, setShowDoctorDropdown] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Handle success message from URL params
  useEffect(() => {
    const successParam = searchParams.get('success');
    if (successParam === 'true') {
      setSuccess('Appointment created successfully!');
      const timer = setTimeout(() => {
        setSuccess(null);
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('success');
        window.history.replaceState({}, '', newUrl.toString());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  // Fetch patients and doctors on mount
  useEffect(() => {
    fetchPatientsAndDoctors();
  }, []);

  // Filter patients based on search term
  useEffect(() => {
    if (patientSearchTerm.trim()) {
      const filtered = patients.filter(
        patient =>
          `${patient.firstName} ${patient.lastName}`
            .toLowerCase()
            .includes(patientSearchTerm.toLowerCase()) ||
          patient.email
            ?.toLowerCase()
            .includes(patientSearchTerm.toLowerCase()) ||
          (patient.nic &&
            patient.nic.toLowerCase().includes(patientSearchTerm.toLowerCase()))
      );
      setFilteredPatients(filtered);
    } else {
      setFilteredPatients(patients);
    }
  }, [patientSearchTerm, patients]);

  // Filter doctors based on search term
  useEffect(() => {
    if (doctorSearchTerm.trim()) {
      const filtered = doctors.filter(doctor => {
        const searchLower = doctorSearchTerm.toLowerCase();

        // Safe access with optional chaining and nullish coalescing
        const name = doctor.name?.toLowerCase() || '';
        const specialization = doctor.specialization?.toLowerCase() || '';
        const licenseNumber = doctor.licenseNumber?.toLowerCase() || '';
        const department = doctor.department?.toLowerCase() || '';

        return (
          name.includes(searchLower) ||
          specialization.includes(searchLower) ||
          licenseNumber.includes(searchLower) ||
          department.includes(searchLower)
        );
      });
      setFilteredDoctors(filtered);
    } else {
      setFilteredDoctors(doctors);
    }
  }, [doctorSearchTerm, doctors]);

  const fetchPatientsAndDoctors = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch both patients and doctors in parallel
      const [patientsResponse, doctorsResponse] = await Promise.all([
        fetch('/api/patients'),
        fetch('/api/admin/doctor'),
      ]);

      if (!patientsResponse.ok) {
        throw new Error('Failed to fetch patients');
      }
      if (!doctorsResponse.ok) {
        throw new Error('Failed to fetch doctors');
      }

      const patientsResult = await patientsResponse.json();
      const doctorsResult = await doctorsResponse.json();

      console.log('Doctors API response:', doctorsResult);

      if (patientsResult.success) {
        setPatients(patientsResult.data || []);
        setFilteredPatients(patientsResult.data || []);
      }

      if (doctorsResult.success) {
        const transformedDoctors = (doctorsResult.data || []).map(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (doc: any) => {
            // Extract availability data
            const availability = doc.profile?.availability;

            // Create both formats for maximum compatibility
            const availableHours = availability
              ? {
                  days: availability.days || [],
                  start: availability.startTime || '',
                  end: availability.endTime || '',
                }
              : null;

            return {
              _id: doc.id || doc._id,
              id: doc.id || doc._id,
              name: doc.user?.name || '',
              email: doc.user?.email || '',
              phone: doc.user?.phone || '',
              image: doc.user?.image || '',
              specialization: doc.profile?.specialization || '',
              department: doc.profile?.department || '',
              licenseNumber: doc.profile?.licenseNumber || '',
              hospital: doc.profile?.hospitalAffiliation || 'Not specified',
              experience: doc.profile?.experience || 0,
              consultationFee: doc.profile?.consultationFee || 0,
              qualifications: doc.profile?.qualifications || [],
              languages: doc.profile?.languages || [],
              isVerified: doc.profile?.isVerified || false,
              rating: doc.profile?.rating || { average: 0, count: 0 },
              // Include both formats
              availability: availability || null,
              availableHours: availableHours,
            };
          }
        );

        console.log('Transformed doctors:', transformedDoctors);
        setDoctors(transformedDoctors);
        setFilteredDoctors(transformedDoctors);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load patients and doctors');
      setPatients([]);
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.patientId || formData.patientId === '') {
      errors.patientId = 'Please select a patient';
    }

    if (!formData.doctorId || formData.doctorId === '') {
      errors.doctorId = 'Please select a doctor';
    }

    if (!formData.appointmentDate) {
      errors.appointmentDate = 'Appointment date is required';
    } else {
      const selectedDate = new Date(formData.appointmentDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (selectedDate < today) {
        errors.appointmentDate = 'Appointment date cannot be in the past';
      }
    }

    if (!formData.appointmentTime) {
      errors.appointmentTime = 'Appointment time is required';
    }

    if (!formData.reason.trim()) {
      errors.reason = 'Reason for visit is required';
    }

    if (!formData.type) {
      errors.type = 'Appointment type is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      const firstError = Object.keys(formErrors)[0];
      if (firstError) {
        const element = document.querySelector(`[name="${firstError}"]`);
        element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/appointments/new', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          appointmentDate: new Date(formData.appointmentDate).toISOString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create appointment');
      }

      const result = await response.json();

      if (result.success) {
        router.push('/appointments?success=true');
      } else {
        throw new Error(result.message || 'Failed to create appointment');
      }
    } catch (error) {
      console.error('Error creating appointment:', error);
      setError(
        error instanceof Error ? error.message : 'Failed to create appointment'
      );
      window.scrollTo({ top: 0, behavior: 'smooth' });
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

  const handlePatientSelect = (patient: Patient) => {
    setFormData(prev => ({
      ...prev,
      patientId: patient._id,
    }));
    setPatientSearchTerm(`${patient.firstName} ${patient.lastName}`);
    setShowPatientDropdown(false);

    if (formErrors.patientId) {
      setFormErrors(prev => ({
        ...prev,
        patientId: '',
      }));
    }
  };

  const handleDoctorSelect = (doctor: DoctorProfile) => {
    const doctorId = doctor._id || doctor.id;
    setFormData(prev => ({
      ...prev,
      doctorId: doctorId,
    }));
    setDoctorSearchTerm(`Dr. ${doctor.name}`);
    setShowDoctorDropdown(false);

    if (formErrors.doctorId) {
      setFormErrors(prev => ({
        ...prev,
        doctorId: '',
      }));
    }
  };

  const getSelectedPatient = () => {
    return patients.find(patient => patient._id === formData.patientId);
  };

  const getSelectedDoctor = () => {
    return doctors.find(
      doctor =>
        doctor._id === formData.doctorId || doctor.id === formData.doctorId
    );
  };

  // Handle click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.patient-search-container')) {
        setShowPatientDropdown(false);
      }
      if (!target.closest('.doctor-search-container')) {
        setShowDoctorDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (loading) return <Loading />;
  if (error && !patients.length && !doctors.length) {
    return <ErrorComponent message={error} />;
  }

  return (
    <div className='min-h-screen bg-gray-50 py-8'>
      <div className='max-w-6xl mx-auto px-4 sm:px-6 lg:px-8'>
        <NewAppointmentHeader onBack={() => router.push('/appointments')} />

        {/* Success Message */}
        {success && (
          <div className='mb-6 bg-green-50 border border-green-200 rounded-lg p-4'>
            <div className='flex items-center gap-2 text-green-800'>
              <FiCheckCircle className='w-5 h-5' />
              <span className='font-medium'>{success}</span>
            </div>
            <button
              onClick={() => setSuccess(null)}
              className='mt-2 text-sm text-green-600 hover:text-green-800 underline'
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className='mb-6 bg-red-50 border border-red-200 rounded-lg p-4'>
            <div className='flex items-center gap-2 text-red-800'>
              <FiAlertCircle className='w-5 h-5' />
              <span className='font-medium'>Error: {error}</span>
            </div>
            <button
              onClick={() => setError(null)}
              className='mt-2 text-sm text-red-600 hover:text-red-800 underline'
            >
              Dismiss
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
            {/* Main Form */}
            <div className='lg:col-span-2 space-y-6'>
              {/* Patient Selection */}
              <div className='patient-search-container'>
                <PatientSelection
                  formData={formData}
                  patients={patients}
                  filteredPatients={filteredPatients}
                  searchTerm={patientSearchTerm}
                  showPatientDropdown={showPatientDropdown}
                  formErrors={formErrors}
                  onSearchChange={setPatientSearchTerm}
                  onPatientSelect={handlePatientSelect}
                  onShowDropdown={setShowPatientDropdown}
                  getSelectedPatient={getSelectedPatient}
                />
              </div>

              {/* Doctor Selection */}
              <div className='doctor-search-container'>
                <DoctorSelection
                  formData={formData}
                  doctorProfiles={doctors}
                  filteredDoctorProfiles={filteredDoctors}
                  searchTerm={doctorSearchTerm}
                  showDoctorDropdown={showDoctorDropdown}
                  formErrors={formErrors}
                  onSearchChange={setDoctorSearchTerm}
                  onDoctorSelect={handleDoctorSelect}
                  onShowDropdown={setShowDoctorDropdown}
                  getSelectedDoctor={getSelectedDoctor}
                />
              </div>

              <AppointmentDetailsForm
                formData={formData}
                formErrors={formErrors}
                onChange={handleChange}
              />

              <MedicalInfoForm
                formData={formData}
                formErrors={formErrors}
                onChange={handleChange}
              />
            </div>

            {/* Sidebar */}
            <div className='space-y-6'>
              <AppointmentSummary
                formData={formData}
                selectedPatient={getSelectedPatient()}
                selectedDoctor={getSelectedDoctor()}
              />

              <AppointmentFormActions
                onCancel={() => router.push('/appointments')}
                saving={saving}
              />

              <HelpTips />
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

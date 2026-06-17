'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  FiArrowLeft,
  FiEdit,
  FiUser,
  FiCalendar,
  FiPhone,
  FiMail,
  FiDroplet,
  FiHeart,
  FiAlertCircle,
  FiFileText,
  FiShield,
  FiActivity,
} from 'react-icons/fi';
import Loading from '@/components/Loading';
import ErrorComponent from '@/components/Error';

interface Patient {
  _id: string;
  id: string;
  userId?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  medicalRecordNumber?: string;
  dateOfBirth?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  bloodType?: string;
  height?: number;
  weight?: number;
  allergies?: string[];
  chronicConditions?: string[];
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
    email?: string;
  };
  insurance?: {
    provider: string;
    policyNumber: string;
    groupNumber?: string;
    expiryDate?: string;
  };
  primaryPhysician?: {
    _id: string;
    firstName: string;
    lastName: string;
    specialty?: string;
  };
  notes?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  age?: number;
  bmi?: number;
  name?: string;
}

export default function PatientDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params.id) {
      fetchPatient(params.id as string);
    }
  }, [params.id]);

  const fetchPatient = async (patientId: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/pharmacy/patients/${patientId}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch patient');
      }

      const data = await response.json();

      // Validate the patient data structure
      if (!data.data) {
        throw new Error('Invalid patient data received');
      }

      setPatient(data.data);
    } catch (err) {
      console.error('Error fetching patient:', err);
      setError(err instanceof Error ? err.message : 'Failed to load patient');
    } finally {
      setLoading(false);
    }
  };

  // Safe data access functions
  const getPatientName = () => {
    if (!patient) return 'Unknown Patient';
    if (patient.userId && patient.userId.firstName && patient.userId.lastName) {
      return `${patient.userId.firstName} ${patient.userId.lastName}`;
    }
    return patient.name || 'Unknown Patient';
  };

  const getPatientEmail = () => {
    return patient?.userId?.email || 'No email provided';
  };

  const getPatientPhone = () => {
    return patient?.userId?.phone || 'No phone provided';
  };

  const getPatientGender = () => {
    return patient?.gender ? patient.gender.toLowerCase() : 'Not specified';
  };

  const getPatientMRN = () => {
    return patient?.medicalRecordNumber || 'Not assigned';
  };

  const getPatientAge = () => {
    return patient?.age ? `${patient.age} years` : 'Unknown';
  };

  const getPatientDOB = () => {
    return patient?.dateOfBirth
      ? new Date(patient.dateOfBirth).toLocaleDateString()
      : 'Not specified';
  };

  const getPatientStatus = () => {
    return patient?.isActive ? 'Active' : 'Inactive';
  };

  const getPatientAllergies = () => {
    return patient?.allergies || [];
  };

  const getPatientConditions = () => {
    return patient?.chronicConditions || [];
  };

  const getBMICategory = (bmi?: number) => {
    if (!bmi) return null;
    if (bmi < 18.5)
      return {
        category: 'Underweight',
        color: 'text-yellow-600 bg-yellow-100',
      };
    if (bmi < 25)
      return {
        category: 'Normal weight',
        color: 'text-green-600 bg-green-100',
      };
    if (bmi < 30)
      return { category: 'Overweight', color: 'text-orange-600 bg-orange-100' };
    return { category: 'Obese', color: 'text-red-600 bg-red-100' };
  };

  const isInsuranceValid = (expiryDate?: string) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) > new Date();
  };

  const getCreatedDate = () => {
    return patient?.createdAt
      ? new Date(patient.createdAt).toLocaleDateString()
      : 'Unknown';
  };

  const getUpdatedDate = () => {
    return patient?.updatedAt
      ? new Date(patient.updatedAt).toLocaleDateString()
      : 'Unknown';
  };

  if (loading) return <Loading />;
  if (error) return <ErrorComponent message={error} />;
  if (!patient) return <ErrorComponent message='Patient not found' />;

  const bmiInfo = getBMICategory(patient.bmi);

  return (
    <div className='min-h-screen bg-gray-50 p-6'>
      <div className='max-w-6xl mx-auto'>
        {/* Header */}
        <div className='mb-8'>
          <div className='flex items-center gap-4 mb-6'>
            <button
              onClick={() => router.back()}
              className='flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors'
            >
              <FiArrowLeft className='w-5 h-5' />
              Back to Patients
            </button>
          </div>

          <div className='flex justify-between items-start'>
            <div className='flex items-center gap-4'>
              <div className='w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center'>
                <FiUser className='w-8 h-8 text-blue-600' />
              </div>
              <div>
                <h1 className='text-3xl font-bold text-gray-900'>
                  {getPatientName()}
                </h1>
                <p className='text-gray-600 mt-1'>
                  {getPatientMRN()} • {getPatientAge()} • {getPatientGender()}
                </p>
              </div>
            </div>
            <div className='flex gap-3'>
              <button
                onClick={() =>
                  router.push(`/Pharmacist/patients/${patient._id}/edit`)
                }
                className='flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors'
              >
                <FiEdit className='w-4 h-4' />
                Edit Patient
              </button>
            </div>
          </div>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          {/* Left Column - Personal Information */}
          <div className='lg:col-span-2 space-y-6'>
            {/* Basic Information Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'
            >
              <h2 className='text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2'>
                <FiUser className='w-5 h-5 text-blue-600' />
                Personal Information
              </h2>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div className='space-y-4'>
                  <div>
                    <label className='text-sm font-medium text-gray-500'>
                      Full Name
                    </label>
                    <p className='text-gray-900 font-medium'>
                      {getPatientName()}
                    </p>
                  </div>
                  <div>
                    <label className='text-sm font-medium text-gray-500'>
                      Date of Birth
                    </label>
                    <p className='text-gray-900 flex items-center gap-2'>
                      <FiCalendar className='w-4 h-4 text-gray-400' />
                      {getPatientDOB()}
                    </p>
                  </div>
                  <div>
                    <label className='text-sm font-medium text-gray-500'>
                      Gender
                    </label>
                    <p className='text-gray-900 capitalize'>
                      {getPatientGender()}
                    </p>
                  </div>
                </div>

                <div className='space-y-4'>
                  <div>
                    <label className='text-sm font-medium text-gray-500'>
                      Email
                    </label>
                    <p className='text-gray-900 flex items-center gap-2'>
                      <FiMail className='w-4 h-4 text-gray-400' />
                      {getPatientEmail()}
                    </p>
                  </div>
                  <div>
                    <label className='text-sm font-medium text-gray-500'>
                      Phone
                    </label>
                    <p className='text-gray-900 flex items-center gap-2'>
                      <FiPhone className='w-4 h-4 text-gray-400' />
                      {getPatientPhone()}
                    </p>
                  </div>
                  <div>
                    <label className='text-sm font-medium text-gray-500'>
                      Status
                    </label>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        patient.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {getPatientStatus()}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Medical Information Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'
            >
              <h2 className='text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2'>
                <FiActivity className='w-5 h-5 text-green-600' />
                Medical Information
              </h2>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div className='space-y-4'>
                  <div>
                    <label className='text-sm font-medium text-gray-500'>
                      Blood Type
                    </label>
                    {patient.bloodType ? (
                      <p className='text-gray-900 flex items-center gap-2'>
                        <FiDroplet className='w-4 h-4 text-red-500' />
                        {patient.bloodType}
                      </p>
                    ) : (
                      <p className='text-gray-500 italic'>Not specified</p>
                    )}
                  </div>
                  <div>
                    <label className='text-sm font-medium text-gray-500'>
                      Height
                    </label>
                    <p className='text-gray-900'>
                      {patient.height
                        ? `${patient.height} cm`
                        : 'Not specified'}
                    </p>
                  </div>
                </div>

                <div className='space-y-4'>
                  <div>
                    <label className='text-sm font-medium text-gray-500'>
                      Weight
                    </label>
                    <p className='text-gray-900'>
                      {patient.weight
                        ? `${patient.weight} kg`
                        : 'Not specified'}
                    </p>
                  </div>
                  <div>
                    <label className='text-sm font-medium text-gray-500'>
                      BMI
                    </label>
                    {patient.bmi ? (
                      <div className='flex items-center gap-2'>
                        <FiHeart className='w-4 h-4 text-green-500' />
                        <span className='text-gray-900 font-medium'>
                          {patient.bmi}
                        </span>
                        {bmiInfo && (
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${bmiInfo.color}`}
                          >
                            {bmiInfo.category}
                          </span>
                        )}
                      </div>
                    ) : (
                      <p className='text-gray-500 italic'>Not calculated</p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Allergies & Conditions Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'
            >
              <h2 className='text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2'>
                <FiAlertCircle className='w-5 h-5 text-red-600' />
                Health Conditions
              </h2>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div>
                  <h3 className='font-medium text-gray-900 mb-3'>Allergies</h3>
                  {getPatientAllergies().length > 0 ? (
                    <div className='flex flex-wrap gap-2'>
                      {getPatientAllergies().map((allergy, index) => (
                        <span
                          key={index}
                          className='px-3 py-1 bg-red-100 text-red-800 text-sm rounded-full'
                        >
                          {allergy}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className='text-gray-500 italic'>
                      No allergies recorded
                    </p>
                  )}
                </div>

                <div>
                  <h3 className='font-medium text-gray-900 mb-3'>
                    Chronic Conditions
                  </h3>
                  {getPatientConditions().length > 0 ? (
                    <div className='flex flex-wrap gap-2'>
                      {getPatientConditions().map((condition, index) => (
                        <span
                          key={index}
                          className='px-3 py-1 bg-orange-100 text-orange-800 text-sm rounded-full'
                        >
                          {condition}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className='text-gray-500 italic'>
                      No chronic conditions recorded
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Column - Additional Information */}
          <div className='space-y-6'>
            {/* Emergency Contact Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'
            >
              <h2 className='text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2'>
                <FiUser className='w-5 h-5 text-orange-600' />
                Emergency Contact
              </h2>

              {patient.emergencyContact ? (
                <div className='space-y-3'>
                  <div>
                    <label className='text-sm font-medium text-gray-500'>
                      Name
                    </label>
                    <p className='text-gray-900'>
                      {patient.emergencyContact.name}
                    </p>
                  </div>
                  <div>
                    <label className='text-sm font-medium text-gray-500'>
                      Relationship
                    </label>
                    <p className='text-gray-900'>
                      {patient.emergencyContact.relationship}
                    </p>
                  </div>
                  <div>
                    <label className='text-sm font-medium text-gray-500'>
                      Phone
                    </label>
                    <p className='text-gray-900'>
                      {patient.emergencyContact.phone}
                    </p>
                  </div>
                  {patient.emergencyContact.email && (
                    <div>
                      <label className='text-sm font-medium text-gray-500'>
                        Email
                      </label>
                      <p className='text-gray-900'>
                        {patient.emergencyContact.email}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <p className='text-gray-500 italic'>
                  No emergency contact information
                </p>
              )}
            </motion.div>

            {/* Insurance Information Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'
            >
              <h2 className='text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2'>
                <FiShield className='w-5 h-5 text-purple-600' />
                Insurance Information
              </h2>

              {patient.insurance ? (
                <div className='space-y-3'>
                  <div>
                    <label className='text-sm font-medium text-gray-500'>
                      Provider
                    </label>
                    <p className='text-gray-900'>
                      {patient.insurance.provider}
                    </p>
                  </div>
                  <div>
                    <label className='text-sm font-medium text-gray-500'>
                      Policy Number
                    </label>
                    <p className='text-gray-900 font-mono'>
                      {patient.insurance.policyNumber}
                    </p>
                  </div>
                  {patient.insurance.groupNumber && (
                    <div>
                      <label className='text-sm font-medium text-gray-500'>
                        Group Number
                      </label>
                      <p className='text-gray-900'>
                        {patient.insurance.groupNumber}
                      </p>
                    </div>
                  )}
                  {patient.insurance.expiryDate && (
                    <div>
                      <label className='text-sm font-medium text-gray-500'>
                        Expiry Date
                      </label>
                      <div className='flex items-center gap-2'>
                        <p className='text-gray-900'>
                          {new Date(
                            patient.insurance.expiryDate
                          ).toLocaleDateString()}
                        </p>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            isInsuranceValid(patient.insurance.expiryDate)
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {isInsuranceValid(patient.insurance.expiryDate)
                            ? 'Valid'
                            : 'Expired'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className='text-gray-500 italic'>No insurance information</p>
              )}
            </motion.div>

            {/* Notes Card */}
            {patient.notes && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'
              >
                <h2 className='text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2'>
                  <FiFileText className='w-5 h-5 text-gray-600' />
                  Additional Notes
                </h2>
                <p className='text-gray-700 whitespace-pre-wrap'>
                  {patient.notes}
                </p>
              </motion.div>
            )}

            {/* System Information Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'
            >
              <h2 className='text-xl font-semibold text-gray-900 mb-4'>
                System Information
              </h2>
              <div className='space-y-2 text-sm'>
                <div className='flex justify-between'>
                  <span className='text-gray-500'>Created</span>
                  <span className='text-gray-900'>{getCreatedDate()}</span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-gray-500'>Last Updated</span>
                  <span className='text-gray-900'>{getUpdatedDate()}</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

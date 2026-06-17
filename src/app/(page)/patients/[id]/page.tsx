/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { FiUser, FiMapPin, FiMail, FiPhone } from 'react-icons/fi';
import Loading from '@/components/ui/Loading';
import ErrorComponent from '@/components/Error';
import { PatientHeader } from '@/components/patient/id/PatientHeader';
import { InfoCard } from '@/components/patient/id/InfoCard';
import { EmergencyContactCard } from '@/components/patient/id/EmergencyContact';
import { InsuranceCard } from '@/components/patient/id/InsuranceCard';
import { QuickStatsCard } from '@/components/patient/id/QuickStatsCard';
import { MedicalInfoCard } from '@/components/patient/id/MedicalInfoCard';
import { usePatient, usePatientCalculations } from '@/hooks/usePatient';
import { staggerContainer } from '@/animations/variants';

export default function PatientDetailPage() {
  const router = useRouter();
  const params = useParams();
  const patientId = params?.id as string;

  const { patient, loading, error } = usePatient(patientId);
  const { formatDate, calculateAge } = usePatientCalculations();

  if (loading) return <Loading />;
  if (error || !patient)
    return <ErrorComponent message={error || 'Patient not found'} />;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className='min-h-screen bg-gray-50 py-8'
    >
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <PatientHeader
          patient={patient}
          onBack={() => router.push('/patients')}
          onEdit={() => router.push(`/patients/${patientId}/edit`)}
          calculateAge={calculateAge}
        />

        <motion.div
          variants={staggerContainer}
          initial='initial'
          animate='animate'
          className='grid grid-cols-1 lg:grid-cols-3 gap-6'
        >
          {/* Main Content - 2/3 width */}
          <div className='lg:col-span-2 space-y-6'>
            {/* Basic Information */}
            <InfoCard
              title='Basic Information'
              icon={<FiUser className='w-5 h-5' />}
            >
              <BasicInformation patient={patient} formatDate={formatDate} />
            </InfoCard>

            {/* Address */}
            {patient.address && (
              <InfoCard title='Address' icon={<FiMapPin className='w-5 h-5' />}>
                <AddressInfo address={patient.address} />
              </InfoCard>
            )}

            {/* Medical Information */}
            <MedicalInfoCard patient={patient} />
          </div>

          {/* Sidebar - 1/3 width */}
          <div className='space-y-6'>
            {patient.emergencyContact && (
              <EmergencyContactCard contact={patient.emergencyContact} />
            )}

            {patient.insurance && (
              <InsuranceCard
                insurance={patient.insurance}
                formatDate={formatDate}
              />
            )}

            <QuickStatsCard
              lastVisit={patient.lastVisit}
              createdAt={patient.createdAt}
              updatedAt={patient.updatedAt}
              formatDate={formatDate}
            />
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

const BasicInformation = ({ patient, formatDate }: any) => (
  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
    <InfoField label='First Name' value={patient.firstName} />
    <InfoField label='Last Name' value={patient.lastName} />
    <InfoField label='Email' value={patient.email} icon={<FiMail />} />
    <InfoField label='Phone' value={patient.phone} icon={<FiPhone />} />
    <InfoField label='Date of Birth' value={formatDate(patient.dateOfBirth)} />
    <InfoField label='Gender' value={patient.gender} />
    {patient.maritalStatus && (
      <InfoField label='Marital Status' value={patient.maritalStatus} />
    )}
    {patient.occupation && (
      <InfoField label='Occupation' value={patient.occupation} />
    )}
  </div>
);

const AddressInfo = ({ address }: any) => (
  <div className='text-gray-900'>
    <p>{address.street}</p>
    <p>
      {address.city}, {address.state} {address.zipCode}
    </p>
    <p>{address.country}</p>
  </div>
);

const InfoField = ({ label, value, icon }: any) => (
  <div>
    <label className='text-sm font-medium text-gray-500'>{label}</label>
    <p className='text-gray-900 flex items-center gap-2'>
      {icon && <span className='w-4 h-4 text-gray-400'>{icon}</span>}
      {value || 'N/A'}
    </p>
  </div>
);

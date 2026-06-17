import React from 'react';
import { motion } from 'framer-motion';
import { FiUser, FiMail, FiPhone, FiMapPin, FiCalendar } from 'react-icons/fi';
import { Patient } from '@/types/patient';

interface PersonalInfoCardProps {
  patient: Patient;
}

const PersonalInfoCard: React.FC<PersonalInfoCardProps> = ({ patient }) => {
  const formatDate = (date: Date | string): string => {
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return 'Invalid date';
    }
  };

  const calculateAge = (dateOfBirth: Date | string): number => {
    try {
      const birthDate =
        typeof dateOfBirth === 'string' ? new Date(dateOfBirth) : dateOfBirth;
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
    } catch {
      return 0;
    }
  };
  const getGenderText = (gender: string): string => {
    const genderMap: { [key: string]: string } = {
      MALE: 'Male',
      FEMALE: 'Female',
      OTHER: 'Other',
      male: 'Male',
      female: 'Female',
      other: 'Other',
    };
    return genderMap[gender] || gender;
  };

  const formatPhoneNumber = (phone: string): string => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'
    >
      <h2 className='text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2'>
        <FiUser className='w-5 h-5 text-blue-600' />
        Personal Information
      </h2>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
        {/* Basic Information */}
        <div className='space-y-4'>
          <h3 className='text-lg font-medium text-gray-900 flex items-center gap-2'>
            <FiUser className='w-4 h-4 text-gray-400' />
            Basic Information
          </h3>

          <div className='space-y-3'>
            <div className='flex justify-between items-center py-2 border-b border-gray-100'>
              <span className='text-sm font-medium text-gray-500'>
                Full Name
              </span>
              <span className='text-gray-900 font-medium text-right'>
                {patient.firstName} {patient.lastName}
              </span>
            </div>

            <div className='flex justify-between items-center py-2 border-b border-gray-100'>
              <span className='text-sm font-medium text-gray-500'>
                NIC Number
              </span>
              <span className='text-gray-900 font-mono'>{patient.nic}</span>
            </div>

            <div className='flex justify-between items-center py-2 border-b border-gray-100'>
              <span className='text-sm font-medium text-gray-500'>
                Date of Birth
              </span>
              <div className='flex items-center gap-2 text-gray-900'>
                <FiCalendar className='w-4 h-4 text-gray-400' />
                {formatDate(patient.dateOfBirth)}
              </div>
            </div>

            <div className='flex justify-between items-center py-2 border-b border-gray-100'>
              <span className='text-sm font-medium text-gray-500'>Age</span>
              <span className='text-gray-900 font-medium'>
                {calculateAge(patient.dateOfBirth)} years
              </span>
            </div>

            <div className='flex justify-between items-center py-2 border-b border-gray-100'>
              <span className='text-sm font-medium text-gray-500'>Gender</span>
              <span className='text-gray-900 capitalize'>
                {getGenderText(patient.gender).toLowerCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className='space-y-4'>
          <h3 className='text-lg font-medium text-gray-900 flex items-center gap-2'>
            <FiMail className='w-4 h-4 text-gray-400' />
            Contact Information
          </h3>

          <div className='space-y-3'>
            <div className='flex items-start gap-3 py-2 border-b border-gray-100'>
              <FiMail className='w-4 h-4 text-gray-400 mt-1' />
              <div className='flex-1'>
                <div className='text-sm font-medium text-gray-500'>Email</div>
                <div className='text-gray-900 break-all'>{patient.email}</div>
              </div>
            </div>

            <div className='flex items-start gap-3 py-2 border-b border-gray-100'>
              <FiPhone className='w-4 h-4 text-gray-400 mt-1' />
              <div className='flex-1'>
                <div className='text-sm font-medium text-gray-500'>Phone</div>
                <div className='text-gray-900'>
                  {formatPhoneNumber(patient.phone)}
                </div>
              </div>
            </div>

            {patient.address && (
              <div className='flex items-start gap-3 py-2'>
                <FiMapPin className='w-4 h-4 text-gray-400 mt-1' />
                <div className='flex-1'>
                  <div className='text-sm font-medium text-gray-500'>
                    Address
                  </div>
                  <div className='text-gray-900 space-y-1'>
                    <div>{patient.address.street}</div>
                    <div>
                      {patient.address.city}, {patient.address.state}{' '}
                      {patient.address.zipCode}
                    </div>
                    <div className='text-gray-600'>
                      {patient.address.country}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Additional Information */}
      {(patient.bloodType || patient.height || patient.weight) && (
        <div className='mt-6 pt-6 border-t border-gray-200'>
          <h3 className='text-lg font-medium text-gray-900 mb-4'>
            Medical Details
          </h3>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            {patient.bloodType && (
              <div className='text-center p-3 bg-blue-50 rounded-lg'>
                <div className='text-sm font-medium text-blue-900'>
                  Blood Type
                </div>
                <div className='text-lg font-semibold text-blue-700'>
                  {patient.bloodType}
                </div>
              </div>
            )}
            {patient.height && (
              <div className='text-center p-3 bg-green-50 rounded-lg'>
                <div className='text-sm font-medium text-green-900'>Height</div>
                <div className='text-lg font-semibold text-green-700'>
                  {patient.height} cm
                </div>
              </div>
            )}
            {patient.weight && (
              <div className='text-center p-3 bg-purple-50 rounded-lg'>
                <div className='text-sm font-medium text-purple-900'>
                  Weight
                </div>
                <div className='text-lg font-semibold text-purple-700'>
                  {patient.weight} kg
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default PersonalInfoCard;

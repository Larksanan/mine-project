'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { DoctorProfile, getAvailabilityText } from '@/types/doctors';
import { format } from 'date-fns';
import {
  FaUser,
  FaEnvelope,
  FaIdCard,
  FaClock,
  FaBriefcase,
  FaCalendar,
  FaBuilding,
  FaPhone,
  FaLanguage,
  FaStethoscope,
  FaDollarSign,
  FaStar,
  FaAward,
  FaBook,
  FaCheckCircle,
  FaHospital,
} from 'react-icons/fa';
import Card from '@/components/ui/Card';
import CardHeader from '@/components/ui/CardHeader';
import CardBody from '@/components/ui/CardBody';
import Chip from '@/components/ui/Chip';
import Spinner from '@/components/ui/Spinner';

interface DoctorDetailCardProps {
  doctor: DoctorProfile | null;
  loading?: boolean;
}

const DoctorDetailCard: React.FC<DoctorDetailCardProps> = ({
  doctor,
  loading = false,
}) => {
  if (loading || !doctor) {
    return (
      <div className='flex justify-center items-center min-h-screen'>
        <Spinner label='Loading doctor details...' />
      </div>
    );
  }

  const availability = getAvailabilityText(doctor);

  // Safe accessor functions
  const getDoctorName = () => doctor?.name || 'Unknown Doctor';
  const getInitial = () => {
    const name = getDoctorName();
    return name?.charAt(0)?.toUpperCase() || '?';
  };
  const getEmail = () => doctor?.email || 'Not provided';
  const getPhone = () => doctor?.phone || 'Not provided';
  const getLicenseNumber = () => doctor?.licenseNumber || 'Not provided';
  const getDepartment = () => doctor?.department || 'Not specified';
  const getSpecialization = () => doctor?.specialization || 'Not specified';
  const getExperience = () => doctor?.experience || 0;
  const getConsultationFee = () => doctor?.consultationFee || 0;
  const getHospital = () => doctor?.hospital || 'Not specified';
  const getRatingAverage = () => doctor?.rating?.average || 0;
  const getRatingCount = () => doctor?.rating?.count || 0;

  return (
    <div className='p-4 md:p-6 max-w-7xl mx-auto'>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className='mb-6'
      >
        <div className='flex items-center gap-4'>
          <div className='relative'>
            {doctor.image ? (
              <img
                src={doctor.image}
                alt={getDoctorName()}
                className='w-20 h-20 rounded-full object-cover border-4 border-blue-500'
              />
            ) : (
              <div className='w-20 h-20 rounded-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold border-4 border-blue-500'>
                {getInitial()}
              </div>
            )}
            {doctor.isVerified && (
              <div className='absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1'>
                <FaCheckCircle className='text-white text-sm' />
              </div>
            )}
          </div>
          <div>
            <h1 className='text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100'>
              Dr. {getDoctorName()}
            </h1>
            <p className='text-lg text-blue-600 dark:text-blue-400 font-medium'>
              {getSpecialization()}
            </p>
            <div className='flex items-center gap-2 mt-1'>
              {doctor.rating && (
                <div className='flex items-center gap-1'>
                  <FaStar className='text-yellow-500' />
                  <span className='font-semibold'>
                    {getRatingAverage().toFixed(1)}
                  </span>
                  <span className='text-gray-500 text-sm'>
                    ({getRatingCount()} reviews)
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* Personal Information */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className='lg:col-span-2'
        >
          <Card shadow='lg'>
            <CardHeader>
              <h2 className='text-xl font-semibold'>Personal Information</h2>
            </CardHeader>
            <CardBody>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div className='flex items-start space-x-3'>
                  <FaUser className='text-blue-600 dark:text-blue-400 mt-1 shrink-0' />
                  <div>
                    <p className='text-sm text-gray-600 dark:text-gray-400'>
                      Full Name
                    </p>
                    <p className='font-semibold text-gray-900 dark:text-gray-100'>
                      Dr. {getDoctorName()}
                    </p>
                  </div>
                </div>

                <div className='flex items-start space-x-3'>
                  <FaEnvelope className='text-blue-600 dark:text-blue-400 mt-1 shrink-0' />
                  <div>
                    <p className='text-sm text-gray-600 dark:text-gray-400'>
                      Email Address
                    </p>
                    <p className='font-semibold text-gray-900 dark:text-gray-100 break-all'>
                      {getEmail()}
                    </p>
                  </div>
                </div>

                <div className='flex items-start space-x-3'>
                  <FaPhone className='text-blue-600 dark:text-blue-400 mt-1 shrink-0' />
                  <div>
                    <p className='text-sm text-gray-600 dark:text-gray-400'>
                      Phone Number
                    </p>
                    <p className='font-semibold text-gray-900 dark:text-gray-100'>
                      {getPhone()}
                    </p>
                  </div>
                </div>

                <div className='flex items-start space-x-3'>
                  <FaIdCard className='text-blue-600 dark:text-blue-400 mt-1 shrink-0' />
                  <div>
                    <p className='text-sm text-gray-600 dark:text-gray-400'>
                      License Number
                    </p>
                    <p className='font-semibold text-gray-900 dark:text-gray-100'>
                      {getLicenseNumber()}
                    </p>
                  </div>
                </div>

                {doctor.licenseExpiry && (
                  <div className='flex items-start space-x-3'>
                    <FaCalendar className='text-blue-600 dark:text-blue-400 mt-1 shrink-0' />
                    <div>
                      <p className='text-sm text-gray-600 dark:text-gray-400'>
                        License Expiry
                      </p>
                      <p className='font-semibold text-gray-900 dark:text-gray-100'>
                        {format(new Date(doctor.licenseExpiry), 'dd MMM yyyy')}
                      </p>
                    </div>
                  </div>
                )}

                <div className='flex items-start space-x-3'>
                  <FaBuilding className='text-blue-600 dark:text-blue-400 mt-1 shrink-0' />
                  <div>
                    <p className='text-sm text-gray-600 dark:text-gray-400'>
                      Department
                    </p>
                    <p className='font-semibold text-gray-900 dark:text-gray-100'>
                      {getDepartment()}
                    </p>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </motion.div>

        {/* Professional Info */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card shadow='lg'>
            <CardHeader>
              <h2 className='text-xl font-semibold'>Professional Info</h2>
            </CardHeader>
            <CardBody>
              <div className='space-y-4'>
                <div className='flex items-start space-x-3'>
                  <FaStethoscope className='text-green-600 dark:text-green-400 mt-1 shrink-0' />
                  <div>
                    <p className='text-sm text-gray-600 dark:text-gray-400'>
                      Specialization
                    </p>
                    <p className='font-semibold text-gray-900 dark:text-gray-100'>
                      {getSpecialization()}
                    </p>
                  </div>
                </div>

                <div className='flex items-start space-x-3'>
                  <FaBriefcase className='text-green-600 dark:text-green-400 mt-1 shrink-0' />
                  <div>
                    <p className='text-sm text-gray-600 dark:text-gray-400'>
                      Experience
                    </p>
                    <p className='font-semibold text-gray-900 dark:text-gray-100'>
                      {getExperience()} years
                    </p>
                  </div>
                </div>

                <div className='flex items-start space-x-3'>
                  <FaDollarSign className='text-green-600 dark:text-green-400 mt-1 shrink-0' />
                  <div>
                    <p className='text-sm text-gray-600 dark:text-gray-400'>
                      Consultation Fee
                    </p>
                    <p className='font-semibold text-gray-900 dark:text-gray-100'>
                      LKR {getConsultationFee().toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className='flex items-start space-x-3'>
                  <FaHospital className='text-green-600 dark:text-green-400 mt-1 shrink-0' />
                  <div>
                    <p className='text-sm text-gray-600 dark:text-gray-400'>
                      Hospital
                    </p>
                    <p className='font-semibold text-gray-900 dark:text-gray-100'>
                      {getHospital()}
                    </p>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </motion.div>
      </div>

      {/* Availability */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
        className='mt-6'
      >
        <Card shadow='lg'>
          <CardHeader>
            <div className='flex items-center space-x-2'>
              <FaClock className='text-blue-600 dark:text-blue-400' />
              <h2 className='text-xl font-semibold'>Availability</h2>
            </div>
          </CardHeader>
          <CardBody>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <div>
                <p className='text-sm text-gray-600 dark:text-gray-400 mb-2'>
                  Available Days
                </p>
                <p className='font-semibold text-gray-900 dark:text-gray-100'>
                  {availability?.days || 'Not specified'}
                </p>
              </div>
              <div>
                <p className='text-sm text-gray-600 dark:text-gray-400 mb-2'>
                  Time Range
                </p>
                <p className='font-semibold text-gray-900 dark:text-gray-100'>
                  {availability?.timeRange || 'Not specified'}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      </motion.div>

      {/* Qualifications & Languages */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.4 }}
        className='mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6'
      >
        {doctor.qualifications && doctor.qualifications.length > 0 && (
          <Card shadow='lg'>
            <CardHeader>
              <div className='flex items-center space-x-2'>
                <FaAward className='text-purple-600 dark:text-purple-400' />
                <h2 className='text-xl font-semibold'>Qualifications</h2>
              </div>
            </CardHeader>
            <CardBody>
              <div className='space-y-2'>
                {doctor.qualifications.map((qual, index) => (
                  <div
                    key={index}
                    className='flex items-center space-x-2 text-gray-700 dark:text-gray-300'
                  >
                    <FaCheckCircle className='text-green-500 shrink-0' />
                    <span>{qual}</span>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        )}

        {doctor.languages && doctor.languages.length > 0 && (
          <Card shadow='lg'>
            <CardHeader>
              <div className='flex items-center space-x-2'>
                <FaLanguage className='text-purple-600 dark:text-purple-400' />
                <h2 className='text-xl font-semibold'>Languages</h2>
              </div>
            </CardHeader>
            <CardBody>
              <div className='flex flex-wrap gap-2'>
                {doctor.languages.map((language, index) => (
                  <Chip key={index} color='default' variant='flat'>
                    {language}
                  </Chip>
                ))}
              </div>
            </CardBody>
          </Card>
        )}
      </motion.div>

      {/* Services */}
      {doctor.services && doctor.services.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.5 }}
          className='mt-6'
        >
          <Card shadow='lg'>
            <CardHeader>
              <h2 className='text-xl font-semibold'>Services Offered</h2>
            </CardHeader>
            <CardBody>
              <div className='flex flex-wrap gap-2'>
                {doctor.services.map((service, index) => (
                  <Chip key={index} color='primary' variant='flat'>
                    {service}
                  </Chip>
                ))}
              </div>
            </CardBody>
          </Card>
        </motion.div>
      )}

      {/* Awards & Publications */}
      {((doctor.awards && doctor.awards.length > 0) ||
        (doctor.publications && doctor.publications.length > 0)) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.6 }}
          className='mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6'
        >
          {doctor.awards && doctor.awards.length > 0 && (
            <Card shadow='lg'>
              <CardHeader>
                <div className='flex items-center space-x-2'>
                  <FaAward className='text-yellow-600 dark:text-yellow-400' />
                  <h2 className='text-xl font-semibold'>Awards</h2>
                </div>
              </CardHeader>
              <CardBody>
                <ul className='space-y-2'>
                  {doctor.awards.map((award, index) => (
                    <li
                      key={index}
                      className='text-gray-700 dark:text-gray-300'
                    >
                      • {award}
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          )}

          {doctor.publications && doctor.publications.length > 0 && (
            <Card shadow='lg'>
              <CardHeader>
                <div className='flex items-center space-x-2'>
                  <FaBook className='text-indigo-600 dark:text-indigo-400' />
                  <h2 className='text-xl font-semibold'>Publications</h2>
                </div>
              </CardHeader>
              <CardBody>
                <ul className='space-y-2'>
                  {doctor.publications.map((pub, index) => (
                    <li
                      key={index}
                      className='text-gray-700 dark:text-gray-300'
                    >
                      • {pub}
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default DoctorDetailCard;

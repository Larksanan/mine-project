'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { IReceptionist } from '@/types/Receptionist';
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
  FaTools,
  FaDollarSign,
  FaUserMd,
  FaShieldAlt,
} from 'react-icons/fa';
import Card from '@/components/ui/Card';
import CardHeader from '@/components/ui/CardHeader';
import CardBody from '@/components/ui/CardBody';
import Chip from '@/components/ui/Chip';
import Spinner from '@/components/ui/Spinner';

interface ReceptionistDetailCardProps {
  receptionist: IReceptionist | null;
  loading?: boolean;
}

const statusColorMap: Record<
  string,
  'success' | 'warning' | 'danger' | 'default'
> = {
  ACTIVE: 'success',
  ON_LEAVE: 'warning',
  SUSPENDED: 'danger',
  TERMINATED: 'default',
};

const shiftColorMap: Record<string, string> = {
  MORNING:
    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  EVENING:
    'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  NIGHT:
    'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  FULL_DAY: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
};

const ReceptionistDetailCard: React.FC<ReceptionistDetailCardProps> = ({
  receptionist,
  loading = false,
}) => {
  if (loading || !receptionist) {
    return (
      <div className='flex justify-center items-center min-h-screen'>
        <Spinner label='Loading receptionist details...' />
      </div>
    );
  }

  const getUserName = () => {
    if (
      receptionist.user &&
      typeof receptionist.user === 'object' &&
      'name' in receptionist.user
    ) {
      return receptionist.user.name || 'N/A';
    }
    return 'N/A';
  };

  const getUserEmail = () => {
    if (
      receptionist.user &&
      typeof receptionist.user === 'object' &&
      'email' in receptionist.user
    ) {
      return receptionist.user.email || 'N/A';
    }
    return 'N/A';
  };

  const getUserPhone = () => {
    if (
      receptionist.user &&
      typeof receptionist.user === 'object' &&
      'phone' in receptionist.user
    ) {
      return receptionist.user.phone || 'N/A';
    }
    return 'N/A';
  };

  const getAssignedDoctor = () => {
    if (
      receptionist.assignedDoctor &&
      typeof receptionist.assignedDoctor === 'object' &&
      'name' in receptionist.assignedDoctor
    ) {
      return receptionist.assignedDoctor.name || 'Not Assigned';
    }
    return 'Not Assigned';
  };

  return (
    <div className='p-4 md:p-6 max-w-7xl mx-auto'>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className='mb-6'
      >
        <h1 className='text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100'>
          Receptionist Profile
        </h1>
        <p className='text-gray-600 dark:text-gray-400 mt-2'>
          Complete information for {getUserName()}
        </p>
      </motion.div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* Main Info Card */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className='lg:col-span-2'
        >
          <Card shadow='lg'>
            <CardHeader>
              <div className='flex items-center justify-between w-full'>
                <h2 className='text-xl font-semibold'>Personal Information</h2>
                <Chip
                  color={statusColorMap[receptionist.employmentStatus]}
                  size='lg'
                  variant='flat'
                >
                  {receptionist.employmentStatus}
                </Chip>
              </div>
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
                      {getUserName()}
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
                      {getUserEmail()}
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
                      {getUserPhone()}
                    </p>
                  </div>
                </div>

                <div className='flex items-start space-x-3'>
                  <FaIdCard className='text-blue-600 dark:text-blue-400 mt-1 shrink-0' />
                  <div>
                    <p className='text-sm text-gray-600 dark:text-gray-400'>
                      Employee ID
                    </p>
                    <p className='font-semibold text-gray-900 dark:text-gray-100'>
                      {receptionist.employeeId}
                    </p>
                  </div>
                </div>

                {receptionist.nic && (
                  <div className='flex items-start space-x-3'>
                    <FaIdCard className='text-blue-600 dark:text-blue-400 mt-1 shrink-0' />
                    <div>
                      <p className='text-sm text-gray-600 dark:text-gray-400'>
                        NIC Number
                      </p>
                      <p className='font-semibold text-gray-900 dark:text-gray-100'>
                        {receptionist.nic}
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
                      {receptionist.department || 'Not Assigned'}
                    </p>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </motion.div>

        {/* Employment Status Card */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card shadow='lg'>
            <CardHeader>
              <h2 className='text-xl font-semibold'>Employment Status</h2>
            </CardHeader>
            <CardBody>
              <div className='space-y-4'>
                <div className='flex items-start space-x-3'>
                  <FaClock className='text-green-600 dark:text-green-400 mt-1 shrink-0' />
                  <div>
                    <p className='text-sm text-gray-600 dark:text-gray-400'>
                      Shift
                    </p>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-sm font-medium mt-1 ${
                        shiftColorMap[receptionist.shift] ||
                        'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {receptionist.shift}
                    </span>
                  </div>
                </div>

                <div className='flex items-start space-x-3'>
                  <FaBriefcase className='text-green-600 dark:text-green-400 mt-1 shrink-0' />
                  <div>
                    <p className='text-sm text-gray-600 dark:text-gray-400'>
                      Employment Type
                    </p>
                    <p className='font-semibold text-gray-900 dark:text-gray-100'>
                      {receptionist.employmentType}
                    </p>
                  </div>
                </div>

                <div className='flex items-start space-x-3'>
                  <FaCalendar className='text-green-600 dark:text-green-400 mt-1 shrink-0' />
                  <div>
                    <p className='text-sm text-gray-600 dark:text-gray-400'>
                      Hire Date
                    </p>
                    <p className='font-semibold text-gray-900 dark:text-gray-100'>
                      {format(new Date(receptionist.hireDate), 'dd MMM yyyy')}
                    </p>
                  </div>
                </div>

                {receptionist.assignedDoctor && (
                  <div className='flex items-start space-x-3'>
                    <FaUserMd className='text-green-600 dark:text-green-400 mt-1 shrink-0' />
                    <div>
                      <p className='text-sm text-gray-600 dark:text-gray-400'>
                        Assigned Doctor
                      </p>
                      <p className='font-semibold text-gray-900 dark:text-gray-100'>
                        {getAssignedDoctor()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
        </motion.div>
      </div>

      {/* Skills & Languages */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
        className='mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6'
      >
        {receptionist.skills && receptionist.skills.length > 0 && (
          <Card shadow='lg'>
            <CardHeader>
              <div className='flex items-center space-x-2'>
                <FaTools className='text-purple-600 dark:text-purple-400' />
                <h2 className='text-xl font-semibold'>Skills</h2>
              </div>
            </CardHeader>
            <CardBody>
              <div className='flex flex-wrap gap-2'>
                {receptionist.skills.map((skill, index) => (
                  <Chip key={index} color='default' variant='flat'>
                    {skill}
                  </Chip>
                ))}
              </div>
            </CardBody>
          </Card>
        )}

        {receptionist.languages && receptionist.languages.length > 0 && (
          <Card shadow='lg'>
            <CardHeader>
              <div className='flex items-center space-x-2'>
                <FaLanguage className='text-purple-600 dark:text-purple-400' />
                <h2 className='text-xl font-semibold'>Languages</h2>
              </div>
            </CardHeader>
            <CardBody>
              <div className='flex flex-wrap gap-2'>
                {receptionist.languages.map((language, index) => (
                  <Chip key={index} color='default' variant='flat'>
                    {language}
                  </Chip>
                ))}
              </div>
            </CardBody>
          </Card>
        )}
      </motion.div>

      {/* Salary & Permissions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.4 }}
        className='mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6'
      >
        {receptionist.salary && (
          <Card shadow='lg'>
            <CardHeader>
              <div className='flex items-center space-x-2'>
                <FaDollarSign className='text-green-600 dark:text-green-400' />
                <h2 className='text-xl font-semibold'>Salary Information</h2>
              </div>
            </CardHeader>
            <CardBody>
              <div className='space-y-3'>
                <div className='flex justify-between items-center'>
                  <span className='text-gray-600 dark:text-gray-400'>
                    Basic Salary
                  </span>
                  <span className='font-semibold text-gray-900 dark:text-gray-100'>
                    {receptionist.salary.currency || 'LKR'}{' '}
                    {receptionist.salary.basic.toLocaleString()}
                  </span>
                </div>
                {receptionist.salary.allowances && (
                  <div className='flex justify-between items-center'>
                    <span className='text-gray-600 dark:text-gray-400'>
                      Allowances
                    </span>
                    <span className='font-semibold text-green-600'>
                      +{receptionist.salary.currency || 'LKR'}{' '}
                      {receptionist.salary.allowances.toLocaleString()}
                    </span>
                  </div>
                )}
                {receptionist.salary.deductions && (
                  <div className='flex justify-between items-center'>
                    <span className='text-gray-600 dark:text-gray-400'>
                      Deductions
                    </span>
                    <span className='font-semibold text-red-600'>
                      -{receptionist.salary.currency || 'LKR'}{' '}
                      {receptionist.salary.deductions.toLocaleString()}
                    </span>
                  </div>
                )}
                <div className='pt-3 border-t border-gray-200 dark:border-gray-700'>
                  <div className='flex justify-between items-center'>
                    <span className='text-gray-900 dark:text-gray-100 font-semibold'>
                      Payment Frequency
                    </span>
                    <span className='font-semibold text-gray-900 dark:text-gray-100'>
                      {receptionist.salary.paymentFrequency}
                    </span>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        )}

        {receptionist.permissions && (
          <Card shadow='lg'>
            <CardHeader>
              <div className='flex items-center space-x-2'>
                <FaShieldAlt className='text-blue-600 dark:text-blue-400' />
                <h2 className='text-xl font-semibold'>Permissions</h2>
              </div>
            </CardHeader>
            <CardBody>
              <div className='grid grid-cols-2 gap-3'>
                {Object.entries(receptionist.permissions).map(
                  ([key, value]) => (
                    <div key={key} className='flex items-center space-x-2'>
                      <div
                        className={`w-3 h-3 rounded-full ${
                          value ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      />
                      <span className='text-sm text-gray-700 dark:text-gray-300'>
                        {key
                          .replace(/([A-Z])/g, ' $1')
                          .replace(/^./, str => str.toUpperCase())
                          .replace('can ', '')}
                      </span>
                    </div>
                  )
                )}
              </div>
            </CardBody>
          </Card>
        )}
      </motion.div>

      {/* Emergency Contact */}
      {receptionist.emergencyContact && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.5 }}
          className='mt-6'
        >
          <Card shadow='lg'>
            <CardHeader>
              <h2 className='text-xl font-semibold'>Emergency Contact</h2>
            </CardHeader>
            <CardBody>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                <div>
                  <p className='text-sm text-gray-600 dark:text-gray-400'>
                    Name
                  </p>
                  <p className='font-semibold text-gray-900 dark:text-gray-100'>
                    {receptionist.emergencyContact.name}
                  </p>
                </div>
                <div>
                  <p className='text-sm text-gray-600 dark:text-gray-400'>
                    Relationship
                  </p>
                  <p className='font-semibold text-gray-900 dark:text-gray-100'>
                    {receptionist.emergencyContact.relationship}
                  </p>
                </div>
                <div>
                  <p className='text-sm text-gray-600 dark:text-gray-400'>
                    Phone
                  </p>
                  <p className='font-semibold text-gray-900 dark:text-gray-100'>
                    {receptionist.emergencyContact.phone}
                  </p>
                </div>
                {receptionist.emergencyContact.email && (
                  <div>
                    <p className='text-sm text-gray-600 dark:text-gray-400'>
                      Email
                    </p>
                    <p className='font-semibold text-gray-900 dark:text-gray-100'>
                      {receptionist.emergencyContact.email}
                    </p>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
        </motion.div>
      )}

      {/* Notes */}
      {receptionist.notes && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.6 }}
          className='mt-6'
        >
          <Card shadow='lg'>
            <CardHeader>
              <h2 className='text-xl font-semibold'>Additional Notes</h2>
            </CardHeader>
            <CardBody>
              <p className='text-gray-700 dark:text-gray-300 whitespace-pre-wrap'>
                {receptionist.notes}
              </p>
            </CardBody>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

export default ReceptionistDetailCard;

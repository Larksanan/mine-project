'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiUser,
  FiMail,
  FiPhone,
  FiMapPin,
  FiCalendar,
  FiActivity,
  FiHeart,
  FiAlertCircle,
  FiEdit,
  FiShield,
  FiUsers,
  FiFileText,
  FiTrendingUp,
  FiAlertTriangle,
  FiDownload,
} from 'react-icons/fi';
import Loading from '@/components/ui/Loading';
import ErrorComponent from '@/components/ui/Error';
import Toast from '@/components/ui/Toast';

interface PatientProfile {
  _id: string;
  user: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  nic: string;
  dateOfBirth: string;
  gender: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
    email: string;
  };
  medicalHistory: string;
  allergies: string[];
  medications: string[];
  insurance: {
    provider: string;
    policyNumber: string;
    groupNumber: string;
    validUntil: string;
  };
  bloodType: string;
  height: number;
  weight: number;
  maritalStatus: string;
  occupation: string;
  preferredLanguage: string;
  age: number;
  createdAt: string;
  updatedAt: string;
}

export default function PatientProfilePage() {
  const { data: _session, status } = useSession();
  const router = useRouter();

  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({
    show: false,
    message: '',
    type: 'info',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated') {
      fetchProfile();
    }
  }, [status, router]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/patients/profile');

      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }

      const result = await response.json();

      if (result.success && result.data) {
        setProfile(result.data);
      } else {
        throw new Error(result.message || 'Failed to load profile');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError('Failed to load your profile. Please try again.');
      setToast({
        show: true,
        message: 'Failed to load profile',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateBMI = (weight: number, height: number) => {
    if (!weight || !height) return null;
    const heightInMeters = height / 100;
    const bmi = weight / (heightInMeters * heightInMeters);
    return bmi.toFixed(1);
  };

  const getBMICategory = (bmi: number) => {
    if (bmi < 18.5) return { label: 'Underweight', color: 'blue' };
    if (bmi < 25) return { label: 'Normal', color: 'green' };
    if (bmi < 30) return { label: 'Overweight', color: 'yellow' };
    return { label: 'Obese', color: 'red' };
  };

  const handlePrint = () => {
    window.print();
  };

  if (status === 'loading' || loading) return <Loading />;
  if (error) return <ErrorComponent message={error} />;
  if (!profile) return <ErrorComponent message='Profile not found' />;

  const bmi = calculateBMI(profile.weight, profile.height);
  const bmiCategory = bmi ? getBMICategory(parseFloat(bmi)) : null;

  return (
    <div className='min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-indigo-50'>
      {/* Animated Background */}
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
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className='mb-8'
        >
          <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
            <div>
              <h1 className='text-4xl font-bold bg-linear-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2'>
                My Profile
              </h1>
              <p className='text-slate-600 flex items-center gap-2'>
                <FiActivity className='w-4 h-4' />
                Your complete medical profile and health information
              </p>
            </div>

            <div className='flex items-center gap-3'>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handlePrint}
                className='p-3 bg-white hover:bg-slate-50 text-slate-700 rounded-xl shadow-lg hover:shadow-xl transition-all border border-slate-200'
                title='Print Profile'
              >
                <FiDownload className='w-5 h-5' />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/profile/edit')}
                className='flex items-center gap-2 px-6 py-3 bg-linear-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all'
              >
                <FiEdit className='w-5 h-5' />
                Edit Profile
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className='grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
          {[
            {
              label: 'Age',
              value: `${profile.age} years`,
              icon: FiCalendar,
              color: 'blue',
              gradient: 'from-blue-500 to-indigo-500',
            },
            {
              label: 'Blood Type',
              value: profile.bloodType || 'N/A',
              icon: FiHeart,
              color: 'red',
              gradient: 'from-red-500 to-pink-500',
            },
            {
              label: 'Height',
              value: profile.height ? `${profile.height} cm` : 'N/A',
              icon: FiActivity,
              color: 'green',
              gradient: 'from-green-500 to-emerald-500',
            },
            {
              label: 'Weight',
              value: profile.weight ? `${profile.weight} kg` : 'N/A',
              icon: FiTrendingUp,
              color: 'purple',
              gradient: 'from-purple-500 to-pink-500',
            },
          ].map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05, y: -5 }}
                className='bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/50 p-6 cursor-pointer'
              >
                <div className='flex items-center justify-between mb-4'>
                  <div
                    className={`p-3 bg-linear-to-br ${stat.gradient} rounded-xl text-white shadow-lg`}
                  >
                    <Icon className='w-6 h-6' />
                  </div>
                </div>
                <p className='text-sm font-medium text-slate-600 mb-1'>
                  {stat.label}
                </p>
                <p className='text-3xl font-bold text-slate-900'>
                  {stat.value}
                </p>
              </motion.div>
            );
          })}
        </div>

        {/* Main Content */}
        <div className='grid grid-cols-1 xl:grid-cols-3 gap-6'>
          {/* Left Column - Profile Card */}
          <div className='space-y-6'>
            {/* Profile Card */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className='bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/50 overflow-hidden'
            >
              <div className='bg-linear-to-r from-blue-500 to-indigo-500 p-6 text-center'>
                <div className='w-32 h-32 bg-white rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg'>
                  <FiUser className='w-16 h-16 text-indigo-600' />
                </div>
                <h2 className='text-2xl font-bold text-white mb-1'>
                  {profile.firstName} {profile.lastName}
                </h2>
                <p className='text-blue-100 text-sm'>
                  Patient ID: {profile._id.slice(-8)}
                </p>
              </div>

              <div className='p-6 space-y-4'>
                <div className='flex items-center gap-3 p-3 bg-slate-50 rounded-xl'>
                  <FiUser className='w-5 h-5 text-purple-600' />
                  <div>
                    <p className='text-xs text-slate-600'>Gender</p>
                    <p className='text-sm font-bold text-slate-900 capitalize'>
                      {profile.gender.toLowerCase()}
                    </p>
                  </div>
                </div>

                <div className='flex items-center gap-3 p-3 bg-slate-50 rounded-xl'>
                  <FiUsers className='w-5 h-5 text-green-600' />
                  <div>
                    <p className='text-xs text-slate-600'>Marital Status</p>
                    <p className='text-sm font-bold text-slate-900'>
                      {profile.maritalStatus || 'Not specified'}
                    </p>
                  </div>
                </div>

                {profile.occupation && (
                  <div className='flex items-center gap-3 p-3 bg-slate-50 rounded-xl'>
                    <FiFileText className='w-5 h-5 text-blue-600' />
                    <div>
                      <p className='text-xs text-slate-600'>Occupation</p>
                      <p className='text-sm font-bold text-slate-900'>
                        {profile.occupation}
                      </p>
                    </div>
                  </div>
                )}

                {bmi && bmiCategory && (
                  <div
                    className={`flex items-center gap-3 p-3 bg-${bmiCategory.color}-50 rounded-xl border border-${bmiCategory.color}-200`}
                  >
                    <FiActivity
                      className={`w-5 h-5 text-${bmiCategory.color}-600`}
                    />
                    <div>
                      <p className={`text-xs text-${bmiCategory.color}-600`}>
                        BMI
                      </p>
                      <p
                        className={`text-sm font-bold text-${bmiCategory.color}-900`}
                      >
                        {bmi} - {bmiCategory.label}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Health Alerts */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className='bg-linear-to-br from-white to-slate-50 rounded-2xl shadow-xl border border-slate-200/50 p-6'
            >
              <h3 className='font-bold text-slate-900 mb-4 flex items-center gap-2'>
                <FiAlertCircle className='w-5 h-5 text-orange-500' />
                Health Summary
              </h3>
              <div className='space-y-3'>
                <div className='flex justify-between items-center py-2'>
                  <span className='text-sm font-medium text-slate-600'>
                    Allergies:
                  </span>
                  <span
                    className={`text-lg font-bold ${profile.allergies?.length ? 'text-red-600' : 'text-green-600'}`}
                  >
                    {profile.allergies?.length || 0}
                  </span>
                </div>
                <div className='flex justify-between items-center py-2'>
                  <span className='text-sm font-medium text-slate-600'>
                    Medications:
                  </span>
                  <span className='text-lg font-bold text-blue-600'>
                    {profile.medications?.length || 0}
                  </span>
                </div>
                <div className='flex justify-between items-center py-2'>
                  <span className='text-sm font-medium text-slate-600'>
                    Last Updated:
                  </span>
                  <span className='text-sm font-bold text-slate-900'>
                    {new Date(profile.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Middle & Right Columns */}
          <div className='xl:col-span-2 space-y-6'>
            {/* Contact Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className='bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/50 overflow-hidden'
            >
              <div className='bg-linear-to-r from-green-500 to-emerald-500 p-6'>
                <h2 className='text-2xl font-bold text-white flex items-center gap-3'>
                  <FiMail className='w-7 h-7' />
                  Contact Information
                </h2>
              </div>

              <div className='p-6 grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div className='p-4 bg-slate-50 rounded-xl'>
                  <label className='text-sm font-semibold text-slate-600 mb-2 flex items-center gap-2'>
                    <FiMail className='w-4 h-4' />
                    Email
                  </label>
                  <p className='text-slate-900 font-medium break-all'>
                    {profile.email}
                  </p>
                </div>

                <div className='p-4 bg-slate-50 rounded-xl'>
                  <label className='text-sm font-semibold text-slate-600 mb-2 flex items-center gap-2'>
                    <FiPhone className='w-4 h-4' />
                    Phone
                  </label>
                  <p className='text-slate-900 font-medium'>{profile.phone}</p>
                </div>

                <div className='p-4 bg-slate-50 rounded-xl'>
                  <label className='text-sm font-semibold text-slate-600 mb-2 flex items-center gap-2'>
                    <FiFileText className='w-4 h-4' />
                    NIC Number
                  </label>
                  <p className='text-slate-900 font-medium'>{profile.nic}</p>
                </div>

                <div className='p-4 bg-slate-50 rounded-xl'>
                  <label className='text-sm font-semibold text-slate-600 mb-2 flex items-center gap-2'>
                    <FiCalendar className='w-4 h-4' />
                    Date of Birth
                  </label>
                  <p className='text-slate-900 font-medium'>
                    {new Date(profile.dateOfBirth).toLocaleDateString()}
                  </p>
                </div>

                <div className='md:col-span-2 p-4 bg-slate-50 rounded-xl'>
                  <label className='text-sm font-semibold text-slate-600 mb-2 flex items-center gap-2'>
                    <FiMapPin className='w-4 h-4' />
                    Address
                  </label>
                  <p className='text-slate-900 font-medium text-sm leading-relaxed'>
                    {profile.address.street}
                    <br />
                    {profile.address.city}, {profile.address.state}{' '}
                    {profile.address.zipCode}
                    <br />
                    {profile.address.country}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Medical Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className='bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/50 overflow-hidden'
            >
              <div className='bg-linear-to-r from-purple-500 to-pink-500 p-6'>
                <h2 className='text-2xl font-bold text-white flex items-center gap-3'>
                  <FiHeart className='w-7 h-7' />
                  Medical Information
                </h2>
              </div>

              <div className='p-6 space-y-6'>
                {profile.allergies && profile.allergies.length > 0 && (
                  <div className='p-4 bg-red-50 rounded-xl border border-red-200'>
                    <label className='text-sm font-semibold text-red-900 mb-3 flex items-center gap-2'>
                      <FiAlertTriangle className='w-4 h-4' />
                      Allergies
                    </label>
                    <div className='flex flex-wrap gap-2'>
                      {profile.allergies.map((allergy, index) => (
                        <span
                          key={index}
                          className='px-3 py-1 bg-red-100 text-red-800 text-sm font-medium rounded-lg'
                        >
                          {allergy}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {profile.medications && profile.medications.length > 0 && (
                  <div className='p-4 bg-blue-50 rounded-xl border border-blue-200'>
                    <label className='text-sm font-semibold text-blue-900 mb-3 flex items-center gap-2'>
                      <FiActivity className='w-4 h-4' />
                      Current Medications
                    </label>
                    <div className='space-y-1'>
                      {profile.medications.map((med, index) => (
                        <p
                          key={index}
                          className='text-sm text-blue-800 font-medium'
                        >
                          • {med}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {profile.medicalHistory && (
                  <div className='p-4 bg-slate-50 rounded-xl'>
                    <label className='text-sm font-semibold text-slate-600 mb-2 flex items-center gap-2'>
                      <FiFileText className='w-4 h-4' />
                      Medical History
                    </label>
                    <p className='text-slate-800 leading-relaxed'>
                      {profile.medicalHistory}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Emergency Contact */}
            {profile.emergencyContact && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className='bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/50 overflow-hidden'
              >
                <div className='bg-linear-to-r from-orange-500 to-red-500 p-6'>
                  <h2 className='text-2xl font-bold text-white flex items-center gap-3'>
                    <FiAlertCircle className='w-7 h-7' />
                    Emergency Contact
                  </h2>
                </div>

                <div className='p-6 grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div className='p-4 bg-orange-50 rounded-xl'>
                    <label className='text-sm font-semibold text-orange-900 mb-2'>
                      Name
                    </label>
                    <p className='text-orange-900 font-bold'>
                      {profile.emergencyContact.name}
                    </p>
                  </div>

                  <div className='p-4 bg-orange-50 rounded-xl'>
                    <label className='text-sm font-semibold text-orange-900 mb-2'>
                      Relationship
                    </label>
                    <p className='text-orange-900 font-bold'>
                      {profile.emergencyContact.relationship}
                    </p>
                  </div>

                  <div className='p-4 bg-orange-50 rounded-xl'>
                    <label className='text-sm font-semibold text-orange-900 mb-2'>
                      Phone
                    </label>
                    <p className='text-orange-900 font-bold'>
                      {profile.emergencyContact.phone}
                    </p>
                  </div>

                  {profile.emergencyContact.email && (
                    <div className='p-4 bg-orange-50 rounded-xl'>
                      <label className='text-sm font-semibold text-orange-900 mb-2'>
                        Email
                      </label>
                      <p className='text-orange-900 font-bold break-all'>
                        {profile.emergencyContact.email}
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Insurance Information */}
            {profile.insurance && profile.insurance.provider && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
                className='bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/50 overflow-hidden'
              >
                <div className='bg-linear-to-r from-indigo-500 to-purple-500 p-6'>
                  <h2 className='text-2xl font-bold text-white flex items-center gap-3'>
                    <FiShield className='w-7 h-7' />
                    Insurance Information
                  </h2>
                </div>

                <div className='p-6 grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div className='p-4 bg-indigo-50 rounded-xl'>
                    <label className='text-sm font-semibold text-indigo-900 mb-2'>
                      Provider
                    </label>
                    <p className='text-indigo-900 font-bold'>
                      {profile.insurance.provider}
                    </p>
                  </div>

                  <div className='p-4 bg-indigo-50 rounded-xl'>
                    <label className='text-sm font-semibold text-indigo-900 mb-2'>
                      Policy Number
                    </label>
                    <p className='text-indigo-900 font-bold'>
                      {profile.insurance.policyNumber}
                    </p>
                  </div>

                  {profile.insurance.groupNumber && (
                    <div className='p-4 bg-indigo-50 rounded-xl'>
                      <label className='text-sm font-semibold text-indigo-900 mb-2'>
                        Group Number
                      </label>
                      <p className='text-indigo-900 font-bold'>
                        {profile.insurance.groupNumber}
                      </p>
                    </div>
                  )}

                  {profile.insurance.validUntil && (
                    <div className='p-4 bg-indigo-50 rounded-xl'>
                      <label className='text-sm font-semibold text-indigo-900 mb-2'>
                        Valid Until
                      </label>
                      <p className='text-indigo-900 font-bold'>
                        {new Date(
                          profile.insurance.validUntil
                        ).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </div>
        </div>
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

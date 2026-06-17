/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiUser,
  FiBook,
  FiCalendar,
  FiDollarSign,
  FiEdit2,
  FiSave,
  FiX,
  FiClock,
  FiMail,
  FiAward,
  FiCheckCircle,
  FiUpload,
  FiExternalLink,
  FiBell,
  FiShield,
  FiKey,
  FiClock as FiClockIcon,
  FiDollarSign as FiDollarIcon,
  FiActivity,
  FiDatabase,
} from 'react-icons/fi';
import {
  MdMedicalServices,
  MdOutlineSchool,
  MdOutlineWork,
  MdLocationOn,
  MdVerified,
  MdOutlineEditCalendar,
  MdSecurity,
  MdNotifications,
  MdPrivacyTip,
  MdPalette,
} from 'react-icons/md';

interface DoctorProfile {
  _id: string;
  name: string;
  email: string;
  nic: string;
  role: string;
  emailVerified: string | null;
  isActive: boolean;
  lastLogin: string;
  createdAt: string;
  updatedAt: string;
  displayName: string;
  roleDisplayName: string;
  id: string;
  availableHours: {
    start: string;
    end: string;
  };
  workingDays: string[];
  consultationFee: number;
  bio: string;
  specialization: string;
  hospital: string;
  licenseNumber: string;
  experience: number;
  education: string[];
  awards: string[];
  profilePicture: string | null;
  notificationPreferences: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    inAppNotifications: boolean;
    appointmentReminders: boolean;
    messageAlerts: boolean;
    systemUpdates: boolean;
    marketingEmails: boolean;
  };
  settings: {
    notifications: {
      email: boolean;
      push: boolean;
      sms: boolean;
      desktop: boolean;
      appointmentReminders: boolean;
      prescriptionUpdates: boolean;
      labResults: boolean;
      billingAlerts: boolean;
      marketingEmails: boolean;
      newsletter: boolean;
    };
    privacy: {
      profileVisibility: string;
      showOnlineStatus: boolean;
      allowMessaging: string;
      dataSharing: boolean;
      analytics: boolean;
    };
    security: {
      twoFactorAuth: boolean;
      loginAlerts: boolean;
      sessionTimeout: number;
      passwordExpiry: number;
    };
    theme: string;
    language: string;
    timezone: string;
    dateFormat: string;
    timeFormat: string;
  };
}

export default function DoctorProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<DoctorProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [activeSettingsTab, setActiveSettingsTab] = useState('notifications');

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/auth/signin?callbackUrl=/dashboard/doctor/profile');
      return;
    }

    if (session.user?.role !== 'DOCTOR') {
      router.push('/dashboard');
      return;
    }

    fetchDoctorProfile();
  }, [session, status, router]);

  const fetchDoctorProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/doctor/profile');
      const data = await response.json();

      if (data.success) {
        setProfile(data.data);
      } else {
        console.error('Failed to fetch profile:', data.error);
      }
    } catch (error) {
      console.error('Error fetching doctor profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (updatedProfile: Partial<DoctorProfile>) => {
    try {
      const response = await fetch('/api/doctor/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedProfile),
      });

      const data = await response.json();
      if (data.success) {
        setProfile(data.data);
        setIsEditing(false);
      } else {
        console.error('Failed to update profile:', data.error);
      }
    } catch (error) {
      console.error('Error updating doctor profile:', error);
    }
  };

  const handleImageUpload = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (data.success && profile) {
        await handleSaveProfile({ ...profile, profilePicture: data.url });
      }
    } catch (error) {
      console.error('Error uploading image:', error);
    }
  };

  const toggleNotification = async (
    category: string,
    setting: string,
    value: boolean
  ) => {
    if (!profile) return;

    const updatedProfile = { ...profile };
    if (category === 'notificationPreferences') {
      updatedProfile.notificationPreferences = {
        ...updatedProfile.notificationPreferences,
        [setting]: value,
      };
    } else if (category === 'settings') {
      updatedProfile.settings.notifications = {
        ...updatedProfile.settings.notifications,
        [setting]: value,
      };
    }

    await handleSaveProfile(updatedProfile);
  };

  const togglePrivacySetting = async (setting: string, value: any) => {
    if (!profile) return;

    const updatedProfile = { ...profile };
    updatedProfile.settings.privacy = {
      ...updatedProfile.settings.privacy,
      [setting]: value,
    };

    await handleSaveProfile(updatedProfile);
  };

  const toggleSecuritySetting = async (setting: string, value: any) => {
    if (!profile) return;

    const updatedProfile = { ...profile };
    updatedProfile.settings.security = {
      ...updatedProfile.settings.security,
      [setting]: value,
    };

    await handleSaveProfile(updatedProfile);
  };

  if (loading) {
    return (
      <div className='min-h-screen bg-linear-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center'>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className='w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full'
        />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className='min-h-screen bg-linear-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center'>
        <div className='text-center'>
          <div className='w-20 h-20 bg-linear-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4'>
            <MdMedicalServices className='w-10 h-10 text-white' />
          </div>
          <h2 className='text-2xl font-bold text-gray-800 mb-2'>
            Profile Not Found
          </h2>
          <p className='text-gray-600 mb-6'>
            Unable to load your doctor profile
          </p>
          <button
            onClick={() => window.location.reload()}
            className='bg-linear-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl'
          >
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className='min-h-screen bg-linear-to-br from-blue-50 via-white to-cyan-50'>
      {/* Floating Background Elements */}
      <div className='fixed inset-0 overflow-hidden pointer-events-none'>
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className='absolute w-64 h-64 rounded-full bg-linear-to-r from-blue-100/20 to-cyan-100/20'
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              x: [0, Math.sin(i) * 50, 0],
              y: [0, Math.cos(i) * 50, 0],
              rotate: 360,
            }}
            transition={{
              duration: 20 + i * 2,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        ))}
      </div>

      {/* Main Content */}
      <div className='relative z-10 max-w-7xl mx-auto px-4 py-8'>
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className='mb-8'
        >
          <div className='bg-linear-to-r from-blue-600 via-purple-600 to-cyan-600 rounded-3xl p-8 shadow-2xl'>
            <div className='flex flex-col lg:flex-row items-start lg:items-center gap-8'>
              {/* Profile Picture */}
              <div className='relative'>
                <div className='relative w-40 h-40 rounded-2xl overflow-hidden border-4 border-white/30 shadow-2xl'>
                  {profile.profilePicture ? (
                    <img
                      src={profile.profilePicture}
                      alt={profile.name}
                      className='w-full h-full object-cover'
                    />
                  ) : (
                    <div className='w-full h-full bg-linear-to-br from-blue-400 to-cyan-400 flex items-center justify-center'>
                      <FiUser className='w-20 h-20 text-white' />
                    </div>
                  )}
                  {isEditing && (
                    <label className='absolute inset-0 bg-black/50 flex items-center justify-center cursor-pointer transition-opacity hover:bg-black/60'>
                      <FiUpload className='w-8 h-8 text-white' />
                      <input
                        type='file'
                        className='hidden'
                        accept='image/*'
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload(file);
                        }}
                      />
                    </label>
                  )}
                </div>
                <div className='absolute -bottom-4 -right-4 bg-linear-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-xl font-semibold flex items-center gap-2 shadow-lg'>
                  <MdVerified className='w-5 h-5' />
                  Verified
                </div>
              </div>

              {/* Profile Info */}
              <div className='flex-1 text-white'>
                <div className='flex justify-between items-start'>
                  <div>
                    <h1 className='text-4xl font-bold mb-2'>
                      {profile.displayName}
                    </h1>
                    <div className='flex items-center gap-4 mb-4'>
                      <div className='flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl'>
                        <MdMedicalServices className='w-5 h-5' />
                        <span className='font-semibold'>
                          {profile.specialization}
                        </span>
                      </div>
                      <div className='flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl'>
                        <MdLocationOn className='w-5 h-5' />
                        <span className='font-semibold'>
                          {profile.hospital}
                        </span>
                      </div>
                      <div className='flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl'>
                        <FiKey className='w-5 h-5' />
                        <span className='font-semibold'>
                          License: {profile.licenseNumber}
                        </span>
                      </div>
                    </div>
                    <div className='flex items-center gap-6'>
                      <div className='flex items-center gap-2'>
                        <FiClockIcon className='w-5 h-5' />
                        <span>Last login: {formatTime(profile.lastLogin)}</span>
                      </div>
                      <div className='flex items-center gap-2'>
                        <MdOutlineWork className='w-5 h-5' />
                        <span>{profile.experience}+ years experience</span>
                      </div>
                      <div className='flex items-center gap-2'>
                        <FiDollarIcon className='w-5 h-5' />
                        <span>${profile.consultationFee}/consultation</span>
                      </div>
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsEditing(!isEditing)}
                    className='bg-white/20 hover:bg-white/30 backdrop-blur-sm px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-colors border border-white/30'
                  >
                    {isEditing ? (
                      <FiX className='w-5 h-5' />
                    ) : (
                      <FiEdit2 className='w-5 h-5' />
                    )}
                    {isEditing ? 'Cancel Edit' : 'Edit Profile'}
                  </motion.button>
                </div>

                {/* Account Status */}
                <div className='mt-6 flex flex-wrap gap-4'>
                  <div className='flex items-center gap-2'>
                    <FiCheckCircle
                      className={`w-5 h-5 ${profile.isActive ? 'text-green-300' : 'text-red-300'}`}
                    />
                    <span>
                      Account: {profile.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <FiMail className='w-5 h-5' />
                    <span>
                      Email:{' '}
                      {profile.emailVerified ? 'Verified' : 'Not Verified'}
                    </span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <FiKey className='w-5 h-5' />
                    <span>NIC: {profile.nic}</span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <FiActivity className='w-5 h-5' />
                    <span>Member since: {formatDate(profile.createdAt)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className='mb-8'>
          <div className='flex space-x-1 bg-white rounded-2xl p-2 shadow-lg'>
            {[
              'overview',
              'schedule',
              'education',
              'achievements',
              'settings',
            ].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all ${
                  activeTab === tab
                    ? 'bg-linear-to-r from-blue-600 to-purple-600 text-white shadow-md'
                    : 'text-gray-600 hover:text-blue-600'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
          {/* Left Column - Main Content */}
          <div className='lg:col-span-2'>
            <AnimatePresence mode='wait'>
              {activeTab === 'overview' && (
                <motion.div
                  key='overview'
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className='space-y-8'
                >
                  {/* Account Summary */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className='bg-white rounded-3xl shadow-2xl p-8'
                  >
                    <h2 className='text-2xl font-bold text-gray-900 mb-6'>
                      Account Summary
                    </h2>
                    <div className='grid grid-cols-2 gap-6'>
                      <div className='space-y-4'>
                        <div>
                          <label className='block text-sm font-medium text-gray-500 mb-2'>
                            Full Name
                          </label>
                          <div className='p-4 bg-linear-to-r from-blue-50 to-cyan-50 rounded-xl'>
                            <span className='font-semibold text-gray-900'>
                              {profile.name}
                            </span>
                          </div>
                        </div>
                        <div>
                          <label className='block text-sm font-medium text-gray-500 mb-2'>
                            Email Address
                          </label>
                          <div className='p-4 bg-linear-to-r from-blue-50 to-cyan-50 rounded-xl'>
                            <span className='font-semibold text-gray-900'>
                              {profile.email}
                            </span>
                          </div>
                        </div>
                        <div>
                          <label className='block text-sm font-medium text-gray-500 mb-2'>
                            Role
                          </label>
                          <div className='p-4 bg-linear-to-r from-blue-50 to-cyan-50 rounded-xl'>
                            <span className='font-semibold text-gray-900'>
                              {profile.roleDisplayName}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className='space-y-4'>
                        <div>
                          <label className='block text-sm font-medium text-gray-500 mb-2'>
                            Account Created
                          </label>
                          <div className='p-4 bg-linear-to-r from-blue-50 to-cyan-50 rounded-xl'>
                            <span className='font-semibold text-gray-900'>
                              {formatDate(profile.createdAt)}
                            </span>
                          </div>
                        </div>
                        <div>
                          <label className='block text-sm font-medium text-gray-500 mb-2'>
                            Last Login
                          </label>
                          <div className='p-4 bg-linear-to-r from-blue-50 to-cyan-50 rounded-xl'>
                            <span className='font-semibold text-gray-900'>
                              {formatDate(profile.lastLogin)} at{' '}
                              {formatTime(profile.lastLogin)}
                            </span>
                          </div>
                        </div>
                        <div>
                          <label className='block text-sm font-medium text-gray-500 mb-2'>
                            Account Status
                          </label>
                          <div className='p-4 bg-linear-to-r from-blue-50 to-cyan-50 rounded-xl'>
                            <div className='flex items-center gap-2'>
                              <div
                                className={`w-3 h-3 rounded-full ${profile.isActive ? 'bg-green-500' : 'bg-red-500'}`}
                              />
                              <span className='font-semibold text-gray-900'>
                                {profile.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Professional Details */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className='bg-white rounded-3xl shadow-2xl p-8'
                  >
                    <h2 className='text-2xl font-bold text-gray-900 mb-6'>
                      Professional Details
                    </h2>

                    <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                      <div className='space-y-6'>
                        <div>
                          <label className='block text-sm font-medium text-gray-500 mb-2'>
                            Specialization
                          </label>
                          <div className='flex items-center gap-3 p-4 bg-linear-to-r from-blue-50 to-cyan-50 rounded-xl'>
                            <MdMedicalServices className='w-6 h-6 text-blue-600' />
                            <span className='font-semibold text-gray-900'>
                              {profile.specialization}
                            </span>
                          </div>
                        </div>

                        <div>
                          <label className='block text-sm font-medium text-gray-500 mb-2'>
                            Hospital/Clinic
                          </label>
                          <div className='flex items-center gap-3 p-4 bg-linear-to-r from-blue-50 to-cyan-50 rounded-xl'>
                            <MdLocationOn className='w-6 h-6 text-blue-600' />
                            <span className='font-semibold text-gray-900'>
                              {profile.hospital}
                            </span>
                          </div>
                        </div>

                        <div>
                          <label className='block text-sm font-medium text-gray-500 mb-2'>
                            Experience
                          </label>
                          <div className='flex items-center gap-3 p-4 bg-linear-to-r from-blue-50 to-cyan-50 rounded-xl'>
                            <MdOutlineWork className='w-6 h-6 text-blue-600' />
                            <span className='font-semibold text-gray-900'>
                              {profile.experience} years
                            </span>
                          </div>
                        </div>

                        <div>
                          <label className='block text-sm font-medium text-gray-500 mb-2'>
                            License Number
                          </label>
                          <div className='flex items-center gap-3 p-4 bg-linear-to-r from-blue-50 to-cyan-50 rounded-xl'>
                            <FiKey className='w-6 h-6 text-blue-600' />
                            <span className='font-semibold text-gray-900'>
                              {profile.licenseNumber}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className='space-y-6'>
                        <div>
                          <label className='block text-sm font-medium text-gray-500 mb-2'>
                            Consultation Fee
                          </label>
                          <div className='flex items-center gap-3 p-4 bg-linear-to-r from-blue-50 to-cyan-50 rounded-xl'>
                            <FiDollarSign className='w-6 h-6 text-blue-600' />
                            <span className='font-semibold text-gray-900'>
                              ${profile.consultationFee}
                            </span>
                          </div>
                        </div>

                        <div>
                          <label className='block text-sm font-medium text-gray-500 mb-2'>
                            Working Hours
                          </label>
                          <div className='p-4 bg-linear-to-r from-blue-50 to-cyan-50 rounded-xl'>
                            <div className='flex items-center gap-3 mb-2'>
                              <FiClock className='w-6 h-6 text-blue-600' />
                              <span className='font-semibold text-gray-900'>
                                {profile.availableHours.start} -{' '}
                                {profile.availableHours.end}
                              </span>
                            </div>
                            <div className='flex flex-wrap gap-2 mt-3'>
                              {profile.workingDays.map(day => (
                                <span
                                  key={day}
                                  className='px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium'
                                >
                                  {day.charAt(0).toUpperCase() + day.slice(1)}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        {profile.bio && (
                          <div>
                            <label className='block text-sm font-medium text-gray-500 mb-2'>
                              Bio
                            </label>
                            <div className='p-4 bg-linear-to-r from-blue-50 to-cyan-50 rounded-xl'>
                              <p className='text-gray-900 leading-relaxed'>
                                {profile.bio}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              )}

              {activeTab === 'education' && (
                <motion.div
                  key='education'
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className='bg-white rounded-3xl shadow-2xl p-8'
                >
                  <h2 className='text-2xl font-bold text-gray-900 mb-6'>
                    Education & Qualifications
                  </h2>
                  <div className='space-y-6'>
                    {profile.education.length > 0 ? (
                      profile.education.map((edu, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className='flex gap-4 p-6 bg-linear-to-r from-blue-50 to-cyan-50 rounded-2xl'
                        >
                          <div className='w-12 h-12 bg-linear-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shrink-0'>
                            <MdOutlineSchool className='w-6 h-6 text-white' />
                          </div>
                          <div>
                            <h3 className='font-bold text-gray-900 text-lg'>
                              {edu}
                            </h3>
                            <p className='text-gray-600 mt-1'>
                              Medical Education
                            </p>
                            <div className='flex items-center gap-4 mt-3'>
                              <span className='text-sm text-gray-500'>
                                2015 - 2020
                              </span>
                              <span className='px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium'>
                                Degree
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <div className='text-center py-12'>
                        <FiBook className='w-16 h-16 text-gray-300 mx-auto mb-4' />
                        <p className='text-gray-500 mb-4'>
                          No education information added
                        </p>
                        {isEditing && (
                          <button className='text-blue-600 hover:text-blue-700 font-medium'>
                            Add Education
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {activeTab === 'achievements' && (
                <motion.div
                  key='achievements'
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className='bg-white rounded-3xl shadow-2xl p-8'
                >
                  <h2 className='text-2xl font-bold text-gray-900 mb-6'>
                    Awards & Achievements
                  </h2>
                  <div className='space-y-6'>
                    {profile.awards.length > 0 ? (
                      profile.awards.map((award, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className='flex gap-4 p-6 bg-linear-to-r from-yellow-50 to-amber-50 rounded-2xl'
                        >
                          <div className='w-12 h-12 bg-linear-to-br from-yellow-500 to-amber-500 rounded-xl flex items-center justify-center shrink-0'>
                            <FiAward className='w-6 h-6 text-white' />
                          </div>
                          <div>
                            <h3 className='font-bold text-gray-900 text-lg'>
                              {award}
                            </h3>
                            <p className='text-gray-600 mt-1'>
                              Professional Recognition
                            </p>
                            <div className='flex items-center gap-4 mt-3'>
                              <span className='text-sm text-gray-500'>
                                2023
                              </span>
                              <span className='px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium'>
                                Award
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <div className='text-center py-12'>
                        <FiAward className='w-16 h-16 text-gray-300 mx-auto mb-4' />
                        <p className='text-gray-500 mb-4'>
                          No awards or achievements added
                        </p>
                        {isEditing && (
                          <button className='text-blue-600 hover:text-blue-700 font-medium'>
                            Add Award
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {activeTab === 'schedule' && (
                <motion.div
                  key='schedule'
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className='bg-white rounded-3xl shadow-2xl p-8'
                >
                  <div className='flex justify-between items-center mb-6'>
                    <h2 className='text-2xl font-bold text-gray-900'>
                      Weekly Schedule
                    </h2>
                    {isEditing && (
                      <button className='flex items-center gap-2 px-4 py-2 bg-linear-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-cyan-700 transition-all'>
                        <MdOutlineEditCalendar className='w-5 h-5' />
                        Edit Schedule
                      </button>
                    )}
                  </div>

                  <div className='space-y-4'>
                    {[
                      'monday',
                      'tuesday',
                      'wednesday',
                      'thursday',
                      'friday',
                      'saturday',
                      'sunday',
                    ].map(day => {
                      const isWorkingDay = profile.workingDays.includes(day);
                      const hours = profile.availableHours;

                      return (
                        <div
                          key={day}
                          className={`flex items-center justify-between p-6 rounded-2xl transition-all ${
                            isWorkingDay
                              ? 'bg-linear-to-r from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100'
                              : 'bg-gray-50'
                          }`}
                        >
                          <div className='flex items-center gap-4'>
                            <div
                              className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                                isWorkingDay
                                  ? 'bg-linear-to-r from-blue-500 to-cyan-500'
                                  : 'bg-gray-300'
                              }`}
                            >
                              <FiCalendar
                                className={`w-6 h-6 ${isWorkingDay ? 'text-white' : 'text-gray-500'}`}
                              />
                            </div>
                            <div>
                              <h3 className='font-bold text-gray-900 text-lg capitalize'>
                                {day}
                              </h3>
                              <p
                                className={`mt-1 ${isWorkingDay ? 'text-gray-600' : 'text-gray-400'}`}
                              >
                                {isWorkingDay
                                  ? `${hours.start} - ${hours.end}`
                                  : 'Day Off'}
                              </p>
                            </div>
                          </div>

                          <div
                            className={`px-4 py-2 rounded-full font-medium ${
                              isWorkingDay
                                ? 'bg-linear-to-r from-green-100 to-emerald-100 text-green-800'
                                : 'bg-linear-to-r from-red-100 to-pink-100 text-red-800'
                            }`}
                          >
                            {isWorkingDay ? 'Working' : 'Not Available'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {activeTab === 'settings' && (
                <motion.div
                  key='settings'
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className='bg-white rounded-3xl shadow-2xl p-8'
                >
                  {/* Settings Tabs */}
                  <div className='flex space-x-1 bg-gray-100 rounded-xl p-1 mb-8'>
                    {[
                      'notifications',
                      'privacy',
                      'security',
                      'preferences',
                    ].map(tab => (
                      <button
                        key={tab}
                        onClick={() => setActiveSettingsTab(tab)}
                        className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                          activeSettingsTab === tab
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-gray-600 hover:text-blue-600'
                        }`}
                      >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                      </button>
                    ))}
                  </div>

                  <AnimatePresence mode='wait'>
                    {/* Notifications Settings */}
                    {activeSettingsTab === 'notifications' && (
                      <motion.div
                        key='notifications'
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className='space-y-6'
                      >
                        <h3 className='text-xl font-bold text-gray-900 mb-4 flex items-center gap-3'>
                          <MdNotifications className='text-blue-600' />
                          Notification Settings
                        </h3>

                        <div className='space-y-4'>
                          <div className='flex items-center justify-between p-4 bg-gray-50 rounded-xl'>
                            <div>
                              <div className='font-medium text-gray-900'>
                                Email Notifications
                              </div>
                              <div className='text-sm text-gray-600'>
                                Receive notifications via email
                              </div>
                            </div>
                            <label className='relative inline-flex items-center cursor-pointer'>
                              <input
                                type='checkbox'
                                checked={
                                  profile.notificationPreferences
                                    .emailNotifications
                                }
                                onChange={e =>
                                  toggleNotification(
                                    'notificationPreferences',
                                    'emailNotifications',
                                    e.target.checked
                                  )
                                }
                                className='sr-only peer'
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                          </div>

                          <div className='flex items-center justify-between p-4 bg-gray-50 rounded-xl'>
                            <div>
                              <div className='font-medium text-gray-900'>
                                Push Notifications
                              </div>
                              <div className='text-sm text-gray-600'>
                                Receive push notifications
                              </div>
                            </div>
                            <label className='relative inline-flex items-center cursor-pointer'>
                              <input
                                type='checkbox'
                                checked={
                                  profile.notificationPreferences
                                    .pushNotifications
                                }
                                onChange={e =>
                                  toggleNotification(
                                    'notificationPreferences',
                                    'pushNotifications',
                                    e.target.checked
                                  )
                                }
                                className='sr-only peer'
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                          </div>

                          <div className='flex items-center justify-between p-4 bg-gray-50 rounded-xl'>
                            <div>
                              <div className='font-medium text-gray-900'>
                                Appointment Reminders
                              </div>
                              <div className='text-sm text-gray-600'>
                                Get reminded about upcoming appointments
                              </div>
                            </div>
                            <label className='relative inline-flex items-center cursor-pointer'>
                              <input
                                type='checkbox'
                                checked={
                                  profile.notificationPreferences
                                    .appointmentReminders
                                }
                                onChange={e =>
                                  toggleNotification(
                                    'notificationPreferences',
                                    'appointmentReminders',
                                    e.target.checked
                                  )
                                }
                                className='sr-only peer'
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                          </div>

                          <div className='flex items-center justify-between p-4 bg-gray-50 rounded-xl'>
                            <div>
                              <div className='font-medium text-gray-900'>
                                Message Alerts
                              </div>
                              <div className='text-sm text-gray-600'>
                                Get notified about new messages
                              </div>
                            </div>
                            <label className='relative inline-flex items-center cursor-pointer'>
                              <input
                                type='checkbox'
                                checked={
                                  profile.notificationPreferences.messageAlerts
                                }
                                onChange={e =>
                                  toggleNotification(
                                    'notificationPreferences',
                                    'messageAlerts',
                                    e.target.checked
                                  )
                                }
                                className='sr-only peer'
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Privacy Settings */}
                    {activeSettingsTab === 'privacy' && (
                      <motion.div
                        key='privacy'
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className='space-y-6'
                      >
                        <h3 className='text-xl font-bold text-gray-900 mb-4 flex items-center gap-3'>
                          <MdPrivacyTip className='text-green-600' />
                          Privacy Settings
                        </h3>

                        <div className='space-y-4'>
                          <div className='p-4 bg-gray-50 rounded-xl'>
                            <div className='font-medium text-gray-900 mb-2'>
                              Profile Visibility
                            </div>
                            <div className='text-sm text-gray-600 mb-3'>
                              Who can see your profile
                            </div>
                            <select
                              value={profile.settings.privacy.profileVisibility}
                              onChange={e =>
                                togglePrivacySetting(
                                  'profileVisibility',
                                  e.target.value
                                )
                              }
                              className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                            >
                              <option value='public'>Everyone</option>
                              <option value='contacts'>Contacts Only</option>
                              <option value='private'>Private</option>
                            </select>
                          </div>

                          <div className='flex items-center justify-between p-4 bg-gray-50 rounded-xl'>
                            <div>
                              <div className='font-medium text-gray-900'>
                                Show Online Status
                              </div>
                              <div className='text-sm text-gray-600'>
                                Display when you&apos;re online
                              </div>
                            </div>
                            <label className='relative inline-flex items-center cursor-pointer'>
                              <input
                                type='checkbox'
                                checked={
                                  profile.settings.privacy.showOnlineStatus
                                }
                                onChange={e =>
                                  togglePrivacySetting(
                                    'showOnlineStatus',
                                    e.target.checked
                                  )
                                }
                                className='sr-only peer'
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                            </label>
                          </div>

                          <div className='p-4 bg-gray-50 rounded-xl'>
                            <div className='font-medium text-gray-900 mb-2'>
                              Allow Messaging From
                            </div>
                            <div className='text-sm text-gray-600 mb-3'>
                              Control who can message you
                            </div>
                            <select
                              value={profile.settings.privacy.allowMessaging}
                              onChange={e =>
                                togglePrivacySetting(
                                  'allowMessaging',
                                  e.target.value
                                )
                              }
                              className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                            >
                              <option value='everyone'>Everyone</option>
                              <option value='contacts'>Contacts Only</option>
                              <option value='none'>No One</option>
                            </select>
                          </div>

                          <div className='flex items-center justify-between p-4 bg-gray-50 rounded-xl'>
                            <div>
                              <div className='font-medium text-gray-900'>
                                Data Sharing
                              </div>
                              <div className='text-sm text-gray-600'>
                                Allow anonymous data sharing for improvements
                              </div>
                            </div>
                            <label className='relative inline-flex items-center cursor-pointer'>
                              <input
                                type='checkbox'
                                checked={profile.settings.privacy.dataSharing}
                                onChange={e =>
                                  togglePrivacySetting(
                                    'dataSharing',
                                    e.target.checked
                                  )
                                }
                                className='sr-only peer'
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                            </label>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Security Settings */}
                    {activeSettingsTab === 'security' && (
                      <motion.div
                        key='security'
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className='space-y-6'
                      >
                        <h3 className='text-xl font-bold text-gray-900 mb-4 flex items-center gap-3'>
                          <MdSecurity className='text-red-600' />
                          Security Settings
                        </h3>

                        <div className='space-y-4'>
                          <div className='flex items-center justify-between p-4 bg-gray-50 rounded-xl'>
                            <div>
                              <div className='font-medium text-gray-900'>
                                Two-Factor Authentication
                              </div>
                              <div className='text-sm text-gray-600'>
                                Add an extra layer of security
                              </div>
                            </div>
                            <label className='relative inline-flex items-center cursor-pointer'>
                              <input
                                type='checkbox'
                                checked={
                                  profile.settings.security.twoFactorAuth
                                }
                                onChange={e =>
                                  toggleSecuritySetting(
                                    'twoFactorAuth',
                                    e.target.checked
                                  )
                                }
                                className='sr-only peer'
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                            </label>
                          </div>

                          <div className='flex items-center justify-between p-4 bg-gray-50 rounded-xl'>
                            <div>
                              <div className='font-medium text-gray-900'>
                                Login Alerts
                              </div>
                              <div className='text-sm text-gray-600'>
                                Get notified about new logins
                              </div>
                            </div>
                            <label className='relative inline-flex items-center cursor-pointer'>
                              <input
                                type='checkbox'
                                checked={profile.settings.security.loginAlerts}
                                onChange={e =>
                                  toggleSecuritySetting(
                                    'loginAlerts',
                                    e.target.checked
                                  )
                                }
                                className='sr-only peer'
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                            </label>
                          </div>

                          <div className='p-4 bg-gray-50 rounded-xl'>
                            <div className='font-medium text-gray-900 mb-2'>
                              Session Timeout
                            </div>
                            <div className='text-sm text-gray-600 mb-3'>
                              Auto-logout after inactivity
                            </div>
                            <select
                              value={profile.settings.security.sessionTimeout}
                              onChange={e =>
                                toggleSecuritySetting(
                                  'sessionTimeout',
                                  parseInt(e.target.value)
                                )
                              }
                              className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                            >
                              <option value={15}>15 minutes</option>
                              <option value={30}>30 minutes</option>
                              <option value={60}>1 hour</option>
                              <option value={120}>2 hours</option>
                            </select>
                          </div>

                          <div className='p-4 bg-gray-50 rounded-xl'>
                            <div className='font-medium text-gray-900 mb-2'>
                              Password Expiry
                            </div>
                            <div className='text-sm text-gray-600 mb-3'>
                              Require password change after
                            </div>
                            <select
                              value={profile.settings.security.passwordExpiry}
                              onChange={e =>
                                toggleSecuritySetting(
                                  'passwordExpiry',
                                  parseInt(e.target.value)
                                )
                              }
                              className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                            >
                              <option value={30}>30 days</option>
                              <option value={60}>60 days</option>
                              <option value={90}>90 days</option>
                              <option value={180}>180 days</option>
                            </select>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Preferences */}
                    {activeSettingsTab === 'preferences' && (
                      <motion.div
                        key='preferences'
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className='space-y-6'
                      >
                        <h3 className='text-xl font-bold text-gray-900 mb-4 flex items-center gap-3'>
                          <MdPalette className='text-purple-600' />
                          Preferences
                        </h3>

                        <div className='space-y-4'>
                          <div className='p-4 bg-gray-50 rounded-xl'>
                            <div className='font-medium text-gray-900 mb-2'>
                              Theme
                            </div>
                            <div className='text-sm text-gray-600 mb-3'>
                              Choose your preferred theme
                            </div>
                            <select
                              value={profile.settings.theme}
                              onChange={e =>
                                handleSaveProfile({
                                  ...profile,
                                  settings: {
                                    ...profile.settings,
                                    theme: e.target.value,
                                  },
                                })
                              }
                              className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                            >
                              <option value='light'>Light</option>
                              <option value='dark'>Dark</option>
                              <option value='system'>System</option>
                            </select>
                          </div>

                          <div className='p-4 bg-gray-50 rounded-xl'>
                            <div className='font-medium text-gray-900 mb-2'>
                              Language
                            </div>
                            <div className='text-sm text-gray-600 mb-3'>
                              Choose your preferred language
                            </div>
                            <select
                              value={profile.settings.language}
                              onChange={e =>
                                handleSaveProfile({
                                  ...profile,
                                  settings: {
                                    ...profile.settings,
                                    language: e.target.value,
                                  },
                                })
                              }
                              className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                            >
                              <option value='en'>English</option>
                              <option value='si'>Sinhala</option>
                              <option value='ta'>Tamil</option>
                            </select>
                          </div>

                          <div className='p-4 bg-gray-50 rounded-xl'>
                            <div className='font-medium text-gray-900 mb-2'>
                              Timezone
                            </div>
                            <div className='text-sm text-gray-600 mb-3'>
                              Set your timezone
                            </div>
                            <select
                              value={profile.settings.timezone}
                              onChange={e =>
                                handleSaveProfile({
                                  ...profile,
                                  settings: {
                                    ...profile.settings,
                                    timezone: e.target.value,
                                  },
                                })
                              }
                              className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                            >
                              <option value='Asia/Colombo'>
                                Colombo (GMT+5:30)
                              </option>
                              <option value='UTC'>UTC</option>
                              <option value='America/New_York'>
                                New York (GMT-5)
                              </option>
                              <option value='Europe/London'>
                                London (GMT+0)
                              </option>
                            </select>
                          </div>

                          <div className='grid grid-cols-2 gap-4'>
                            <div className='p-4 bg-gray-50 rounded-xl'>
                              <div className='font-medium text-gray-900 mb-2'>
                                Date Format
                              </div>
                              <select
                                value={profile.settings.dateFormat}
                                onChange={e =>
                                  handleSaveProfile({
                                    ...profile,
                                    settings: {
                                      ...profile.settings,
                                      dateFormat: e.target.value,
                                    },
                                  })
                                }
                                className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                              >
                                <option value='DD/MM/YYYY'>DD/MM/YYYY</option>
                                <option value='MM/DD/YYYY'>MM/DD/YYYY</option>
                                <option value='YYYY-MM-DD'>YYYY-MM-DD</option>
                              </select>
                            </div>

                            <div className='p-4 bg-gray-50 rounded-xl'>
                              <div className='font-medium text-gray-900 mb-2'>
                                Time Format
                              </div>
                              <select
                                value={profile.settings.timeFormat}
                                onChange={e =>
                                  handleSaveProfile({
                                    ...profile,
                                    settings: {
                                      ...profile.settings,
                                      timeFormat: e.target.value,
                                    },
                                  })
                                }
                                className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                              >
                                <option value='12h'>12-hour</option>
                                <option value='24h'>24-hour</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right Column - Stats & Actions */}
          <div className='space-y-8'>
            {/* Account Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className='bg-linear-to-br from-blue-600 to-purple-600 rounded-3xl p-6 text-white shadow-2xl'
            >
              <h3 className='text-xl font-bold mb-6'>Account Statistics</h3>
              <div className='space-y-4'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-3'>
                    <div className='w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center'>
                      <FiDatabase className='w-5 h-5' />
                    </div>
                    <div>
                      <div className='font-medium'>Account Age</div>
                      <div className='text-sm opacity-90'>
                        {Math.floor(
                          (new Date().getTime() -
                            new Date(profile.createdAt).getTime()) /
                            (1000 * 60 * 60 * 24)
                        )}{' '}
                        days
                      </div>
                    </div>
                  </div>
                </div>

                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-3'>
                    <div className='w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center'>
                      <FiActivity className='w-5 h-5' />
                    </div>
                    <div>
                      <div className='font-medium'>Last Activity</div>
                      <div className='text-sm opacity-90'>
                        {formatTime(profile.lastLogin)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-3'>
                    <div className='w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center'>
                      <FiShield className='w-5 h-5' />
                    </div>
                    <div>
                      <div className='font-medium'>Security Score</div>
                      <div className='text-sm opacity-90'>
                        {profile.settings.security.twoFactorAuth
                          ? 'High'
                          : 'Medium'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-3'>
                    <div className='w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center'>
                      <FiBell className='w-5 h-5' />
                    </div>
                    <div>
                      <div className='font-medium'>Active Notifications</div>
                      <div className='text-sm opacity-90'>
                        {
                          Object.values(profile.notificationPreferences).filter(
                            v => v
                          ).length
                        }{' '}
                        of 7
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className='bg-white rounded-3xl shadow-2xl p-6'
            >
              <h3 className='text-xl font-bold text-gray-900 mb-6'>
                Quick Actions
              </h3>
              <div className='space-y-4'>
                <button className='w-full flex items-center justify-between p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-all group'>
                  <div className='flex items-center gap-3'>
                    <div className='w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200'>
                      <FiEdit2 className='w-5 h-5 text-blue-600' />
                    </div>
                    <span className='font-semibold text-gray-900'>
                      Update Profile
                    </span>
                  </div>
                  <FiExternalLink className='w-5 h-5 text-gray-400 group-hover:text-blue-600' />
                </button>

                <button className='w-full flex items-center justify-between p-4 bg-green-50 rounded-xl hover:bg-green-100 transition-all group'>
                  <div className='flex items-center gap-3'>
                    <div className='w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200'>
                      <FiKey className='w-5 h-5 text-green-600' />
                    </div>
                    <span className='font-semibold text-gray-900'>
                      Change Password
                    </span>
                  </div>
                  <FiExternalLink className='w-5 h-5 text-gray-400 group-hover:text-green-600' />
                </button>

                <button className='w-full flex items-center justify-between p-4 bg-purple-50 rounded-xl hover:bg-purple-100 transition-all group'>
                  <div className='flex items-center gap-3'>
                    <div className='w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200'>
                      <FiBell className='w-5 h-5 text-purple-600' />
                    </div>
                    <span className='font-semibold text-gray-900'>
                      Notification Settings
                    </span>
                  </div>
                  <FiExternalLink className='w-5 h-5 text-gray-400 group-hover:text-purple-600' />
                </button>

                <button className='w-full flex items-center justify-between p-4 bg-red-50 rounded-xl hover:bg-red-100 transition-all group'>
                  <div className='flex items-center gap-3'>
                    <div className='w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center group-hover:bg-red-200'>
                      <FiShield className='w-5 h-5 text-red-600' />
                    </div>
                    <span className='font-semibold text-gray-900'>
                      Privacy & Security
                    </span>
                  </div>
                  <FiExternalLink className='w-5 h-5 text-gray-400 group-hover:text-red-600' />
                </button>
              </div>
            </motion.div>

            {/* Email Verification Status */}
            {!profile.emailVerified && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className='bg-linear-to-r from-yellow-500 to-amber-500 rounded-3xl p-6 text-white shadow-2xl'
              >
                <div className='flex items-start gap-4'>
                  <div className='w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center shrink-0'>
                    <FiMail className='w-6 h-6' />
                  </div>
                  <div>
                    <h4 className='font-bold text-lg mb-2'>
                      Verify Your Email
                    </h4>
                    <p className='text-white/90 mb-4'>
                      Please verify your email address to access all features.
                    </p>
                    <button className='w-full bg-white text-amber-600 hover:bg-gray-100 px-4 py-2 rounded-lg font-semibold transition-colors'>
                      Send Verification Email
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {isEditing && (
        <div className='fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4'>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className='bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto'
          >
            <div className='p-8'>
              <div className='flex justify-between items-center mb-8'>
                <h2 className='text-2xl font-bold text-gray-900'>
                  Edit Profile
                </h2>
                <button
                  onClick={() => setIsEditing(false)}
                  className='p-2 hover:bg-gray-100 rounded-full transition-colors'
                >
                  <FiX className='w-6 h-6 text-gray-500' />
                </button>
              </div>

              <form className='space-y-6'>
                <div className='grid grid-cols-2 gap-6'>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Specialization
                    </label>
                    <input
                      type='text'
                      defaultValue={profile.specialization}
                      className='w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                    />
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Hospital/Clinic
                    </label>
                    <input
                      type='text'
                      defaultValue={profile.hospital}
                      className='w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                    />
                  </div>
                </div>

                <div className='grid grid-cols-2 gap-6'>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Experience (years)
                    </label>
                    <input
                      type='number'
                      defaultValue={profile.experience}
                      min='0'
                      className='w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                    />
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Consultation Fee ($)
                    </label>
                    <input
                      type='number'
                      defaultValue={profile.consultationFee}
                      min='0'
                      step='0.01'
                      className='w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                    />
                  </div>
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Bio
                  </label>
                  <textarea
                    defaultValue={profile.bio}
                    rows={4}
                    className='w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none'
                    placeholder='Tell us about yourself...'
                  />
                </div>

                <div className='flex justify-end gap-4 pt-8 border-t border-gray-200'>
                  <button
                    type='button'
                    onClick={() => setIsEditing(false)}
                    className='px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors'
                  >
                    Cancel
                  </button>
                  <button
                    type='submit'
                    className='px-6 py-3 bg-linear-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-cyan-700 transition-colors flex items-center gap-2'
                  >
                    <FiSave className='w-5 h-5' />
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

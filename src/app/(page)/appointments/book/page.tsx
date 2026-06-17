/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  FiCalendar,
  FiUser,
  FiSearch,
  FiMapPin,
  FiDollarSign,
  FiCheckCircle,
  FiAlertCircle,
  FiX,
  FiStar,
  FiClock,
  FiFilter,
  FiChevronDown,
  FiHeart,
  FiInfo,
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

interface DoctorProfile {
  _id: string;
  name: string;
  email: string;
  phone: string;
  specialization: string;
  department: string;
  licenseNumber: string;
  hospital: string;
  experience: number;
  consultationFee: number;
  qualifications: string[];
  languages: string[];
  isVerified: boolean;
  rating?: {
    average: number;
    count: number;
  };
  availableHours?: {
    days: string[];
    start: string;
    end: string;
  };
  image?: string;
}

interface BookingFormData {
  doctorId: string;
  appointmentDate: string;
  appointmentTime: string;
  reason: string;
  symptoms: string;
  notes: string;
  type: 'CONSULTATION' | 'FOLLOW_UP' | 'CHECK_UP' | 'EMERGENCY';
}

// Animation variants with proper TypeScript typing
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 100,
      damping: 12,
    },
  },
};

const cardHoverVariants = {
  rest: { scale: 1, y: 0 },
  hover: {
    scale: 1.02,
    y: -8,
    transition: {
      type: 'spring' as const,
      stiffness: 300,
      damping: 20,
    },
  },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 100,
      damping: 20,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    transition: {
      duration: 0.2,
    },
  },
};

// Custom Toast Component
const Toast = ({
  message,
  type,
  onClose,
}: {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  }[type];

  const iconColor = {
    success: 'text-green-500',
    error: 'text-red-500',
    info: 'text-blue-500',
  }[type];

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`fixed top-6 right-6 z-50 border rounded-lg p-4 shadow-lg ${bgColor} min-w-75`}
    >
      <div className='flex items-center gap-3'>
        {type === 'success' && (
          <FiCheckCircle className={`w-5 h-5 ${iconColor}`} />
        )}
        {type === 'error' && (
          <FiAlertCircle className={`w-5 h-5 ${iconColor}`} />
        )}
        {type === 'info' && <FiInfo className={`w-5 h-5 ${iconColor}`} />}
        <span className='font-medium'>{message}</span>
        <button
          onClick={onClose}
          className='ml-auto opacity-70 hover:opacity-100'
        >
          <FiX className='w-4 h-4' />
        </button>
      </div>
    </motion.div>
  );
};

export default function PatientBookAppointment() {
  const router = useRouter();
  const { status } = useSession();

  // State
  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [filteredDoctors, setFilteredDoctors] = useState<DoctorProfile[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorProfile | null>(
    null
  );
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  // Search and filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialization, setSelectedSpecialization] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [minExperience, setMinExperience] = useState<number>(0);
  const [maxFee, setMaxFee] = useState<number>(10000);
  const [sortBy, setSortBy] = useState<
    'name' | 'experience' | 'fee' | 'rating'
  >('name');

  // Form data
  const [formData, setFormData] = useState<BookingFormData>({
    doctorId: '',
    appointmentDate: '',
    appointmentTime: '',
    reason: '',
    symptoms: '',
    notes: '',
    type: 'CONSULTATION',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/patient/book-appointment');
    }
  }, [status, router]);

  // Fetch doctors
  useEffect(() => {
    if (status === 'authenticated') {
      fetchDoctors();
    }
  }, [status]);

  // Filter and sort doctors
  useEffect(() => {
    let filtered = [...doctors];

    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        doctor =>
          doctor.name.toLowerCase().includes(searchLower) ||
          doctor.specialization.toLowerCase().includes(searchLower) ||
          doctor.hospital.toLowerCase().includes(searchLower)
      );
    }

    if (selectedSpecialization) {
      filtered = filtered.filter(
        doctor => doctor.specialization === selectedSpecialization
      );
    }

    if (selectedDepartment) {
      filtered = filtered.filter(
        doctor => doctor.department === selectedDepartment
      );
    }

    if (minExperience > 0) {
      filtered = filtered.filter(doctor => doctor.experience >= minExperience);
    }

    filtered = filtered.filter(doctor => doctor.consultationFee <= maxFee);

    // Sort doctors
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'experience':
          return b.experience - a.experience;
        case 'fee':
          return a.consultationFee - b.consultationFee;
        case 'rating':
          return (b.rating?.average || 0) - (a.rating?.average || 0);
        default:
          return a.name.localeCompare(b.name);
      }
    });

    setFilteredDoctors(filtered);
  }, [
    searchTerm,
    selectedSpecialization,
    selectedDepartment,
    minExperience,
    maxFee,
    sortBy,
    doctors,
  ]);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/doctor');

      if (!response.ok) {
        throw new Error('Failed to fetch doctors');
      }

      const result = await response.json();

      if (result.success) {
        const transformedDoctors = (result.data || []).map(
          (doc: {
            id?: string;
            _id?: string;
            user?: {
              name?: string;
              email?: string;
              phone?: string;
              image?: string;
            };
            profile?: {
              specialization?: string;
              department?: string;
              licenseNumber?: string;
              hospitalAffiliation?: string;
              experience?: number;
              consultationFee?: number;
              qualifications?: string[];
              languages?: string[];
              isVerified?: boolean;
              rating?: {
                average: number;
                count: number;
              };
              availability?: {
                days?: string[];
                startTime?: string;
                endTime?: string;
              };
            };
          }) => {
            const availability = doc.profile?.availability;
            const availableHours = availability
              ? {
                  days: availability.days || [],
                  start: availability.startTime || '',
                  end: availability.endTime || '',
                }
              : null;

            return {
              _id: doc.id || doc._id,
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
              availableHours: availableHours,
            };
          }
        );

        setDoctors(transformedDoctors);
        setFilteredDoctors(transformedDoctors);
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
      showToast('Failed to load doctors', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDoctor = (doctor: DoctorProfile) => {
    setSelectedDoctor(doctor);
    setFormData(prev => ({ ...prev, doctorId: doctor._id }));
    setShowBookingModal(true);
  };

  const handleCloseModal = () => {
    setShowBookingModal(false);
    setSelectedDoctor(null);
    setFormData({
      doctorId: '',
      appointmentDate: '',
      appointmentTime: '',
      reason: '',
      symptoms: '',
      notes: '',
      type: 'CONSULTATION',
    });
    setFormErrors({});
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.appointmentDate) {
      errors.appointmentDate = 'Please select a date';
    } else {
      const selectedDate = new Date(formData.appointmentDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (selectedDate < today) {
        errors.appointmentDate = 'Date cannot be in the past';
      }
    }

    if (!formData.appointmentTime) {
      errors.appointmentTime = 'Please select a time';
    }

    if (!formData.reason.trim()) {
      errors.reason = 'Please provide a reason for visit';
    }

    if (!formData.type) {
      errors.type = 'Please select appointment type';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({ message, type });
  };

  const handleFavorite = (doctorId: string) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(doctorId)) {
      newFavorites.delete(doctorId);
      showToast('Removed from favorites', 'info');
    } else {
      newFavorites.add(doctorId);
      showToast('Added to favorites', 'success');
    }
    setFavorites(newFavorites);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSaving(true);

    try {
      const response = await fetch('/api/appointments/patient/book', {
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
        throw new Error(errorData.message || 'Failed to book appointment');
      }

      const result = await response.json();

      if (result.success) {
        showToast('Appointment booked successfully!', 'success');
        setTimeout(() => {
          router.push('/patient/appointments');
        }, 2000);
      }
    } catch (error) {
      console.error('Error booking appointment:', error);
      showToast(
        error instanceof Error ? error.message : 'Failed to book appointment',
        'error'
      );
    } finally {
      setSaving(false);
    }
  };

  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 90);
    return maxDate.toISOString().split('T')[0];
  };

  const specializations = Array.from(
    new Set(doctors.map(d => d.specialization))
  ).sort();

  const departments = Array.from(
    new Set(doctors.map(d => d.department))
  ).sort();

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <FiStar
        key={i}
        className={`w-4 h-4 shrink-0 ${
          i < Math.floor(rating)
            ? 'text-yellow-400 fill-yellow-400'
            : 'text-gray-300'
        }`}
      />
    ));
  };

  if (status === 'loading' || loading) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 to-gray-50'>
        <div className='text-center'>
          <div className='relative'>
            <div className='w-20 h-20 border-4 border-blue-200 rounded-full'></div>
            <div className='absolute top-0 left-0 w-20 h-20 border-4 border-blue-600 rounded-full border-t-transparent animate-spin'></div>
          </div>
          <p className='mt-4 text-gray-600 font-medium'>Loading doctors...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      <div className='min-h-screen bg-linear-to-br from-blue-50 via-gray-50 to-blue-50 py-8'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          {/* Header with Animation */}
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className='mb-8 text-center'
          >
            <h1 className='text-4xl font-bold text-transparent bg-clip-text bg-linear-to-r from-blue-600 to-purple-600'>
              Book an Appointment
            </h1>
            <p className='mt-3 text-gray-600 max-w-2xl mx-auto'>
              Find and book appointments with our trusted healthcare specialists
            </p>
          </motion.div>

          {/* Advanced Search and Filters */}
          <motion.div
            initial='hidden'
            animate='visible'
            variants={containerVariants}
            className='space-y-6 mb-8'
          >
            {/* Main Search */}
            <motion.div variants={itemVariants} className='relative'>
              <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                <FiSearch className='h-5 w-5 text-gray-400' />
              </div>
              <input
                type='text'
                placeholder='Search doctors, specializations, or hospitals...'
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className='block w-full pl-10 pr-4 py-4 border border-gray-300 rounded-xl bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300'
              />
            </motion.div>

            {/* Filters Toggle */}
            <motion.div variants={itemVariants}>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className='flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors'
              >
                <FiFilter className='w-4 h-4' />
                <span>Filters</span>
                <FiChevronDown
                  className={`w-4 h-4 transition-transform ${
                    showFilters ? 'rotate-180' : ''
                  }`}
                />
              </button>
            </motion.div>

            {/* Advanced Filters */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className='overflow-hidden'
                >
                  <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6 grid grid-cols-1 md:grid-cols-4 gap-4'>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-2'>
                        Specialization
                      </label>
                      <select
                        value={selectedSpecialization}
                        onChange={e =>
                          setSelectedSpecialization(e.target.value)
                        }
                        className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                      >
                        <option value=''>All</option>
                        {specializations.map(spec => (
                          <option key={spec} value={spec}>
                            {spec}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-2'>
                        Department
                      </label>
                      <select
                        value={selectedDepartment}
                        onChange={e => setSelectedDepartment(e.target.value)}
                        className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                      >
                        <option value=''>All</option>
                        {departments.map(dept => (
                          <option key={dept} value={dept}>
                            {dept}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-2'>
                        Min Experience: {minExperience}+ years
                      </label>
                      <input
                        type='range'
                        min='0'
                        max='50'
                        value={minExperience}
                        onChange={e =>
                          setMinExperience(parseInt(e.target.value))
                        }
                        className='w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer'
                      />
                    </div>

                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-2'>
                        Max Fee: LKR {maxFee.toLocaleString()}
                      </label>
                      <input
                        type='range'
                        min='0'
                        max='50000'
                        step='1000'
                        value={maxFee}
                        onChange={e => setMaxFee(parseInt(e.target.value))}
                        className='w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer'
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Sort Options */}
            <motion.div
              variants={itemVariants}
              className='flex items-center gap-4'
            >
              <span className='text-sm font-medium text-gray-700'>
                Sort by:
              </span>
              <div className='flex gap-2'>
                {(['name', 'experience', 'fee', 'rating'] as const).map(
                  option => (
                    <button
                      key={option}
                      onClick={() => setSortBy(option)}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                        sortBy === option
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {option.charAt(0).toUpperCase() + option.slice(1)}
                    </button>
                  )
                )}
              </div>
            </motion.div>
          </motion.div>

          {/* Doctors Grid */}
          <motion.div
            initial='hidden'
            animate='visible'
            variants={containerVariants}
            className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
          >
            {filteredDoctors.map(doctor => (
              <motion.div
                key={doctor._id}
                variants={itemVariants}
                whileHover='hover'
                initial='rest'
                animate='rest'
              >
                <motion.div
                  variants={cardHoverVariants}
                  className='bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300'
                >
                  {/* Doctor Image/Initial */}
                  <div className='relative'>
                    <div className='h-48 bg-linear-to-r from-blue-500 to-purple-500 relative overflow-hidden'>
                      {doctor.image ? (
                        <img
                          src={doctor.image}
                          alt={doctor.name}
                          className='w-full h-full object-cover'
                        />
                      ) : (
                        <div className='w-full h-full flex items-center justify-center text-white text-5xl font-bold'>
                          {doctor.name.charAt(0)}
                        </div>
                      )}

                      {/* Badges */}
                      <div className='absolute top-4 left-4 flex gap-2'>
                        {doctor.isVerified && (
                          <span className='px-3 py-1 bg-white text-blue-600 text-xs font-semibold rounded-full flex items-center gap-1'>
                            <FiCheckCircle className='w-3 h-3' />
                            Verified
                          </span>
                        )}
                        <span className='px-3 py-1 bg-white text-gray-700 text-xs font-semibold rounded-full'>
                          {doctor.experience}+ yrs
                        </span>
                      </div>

                      {/* Favorite Button */}
                      <button
                        onClick={() => handleFavorite(doctor._id)}
                        className='absolute top-4 right-4 p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors'
                      >
                        <FiHeart
                          className={`w-5 h-5 ${
                            favorites.has(doctor._id)
                              ? 'text-red-500 fill-red-500'
                              : 'text-gray-400'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Rating */}
                    {doctor.rating && doctor.rating.count > 0 && (
                      <div className='absolute -bottom-4 right-6 bg-white px-3 py-2 rounded-lg shadow-lg flex items-center gap-2'>
                        <div className='flex'>
                          {renderStars(doctor.rating.average)}
                        </div>
                        <span className='text-sm font-semibold text-gray-900'>
                          {doctor.rating.average.toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Doctor Info */}
                  <div className='p-6 pt-8'>
                    <div className='mb-4'>
                      <h3 className='text-xl font-bold text-gray-900 mb-1'>
                        Dr. {doctor.name}
                      </h3>
                      <p className='text-blue-600 font-medium'>
                        {doctor.specialization}
                      </p>
                      <p className='text-sm text-gray-500'>
                        {doctor.department}
                      </p>
                    </div>

                    {/* Details */}
                    <div className='space-y-3 mb-6'>
                      <div className='flex items-center gap-3 text-sm text-gray-600'>
                        <FiMapPin className='w-4 h-4 shrink-0' />
                        <span className='truncate'>{doctor.hospital}</span>
                      </div>

                      <div className='flex items-center gap-3 text-sm text-gray-600'>
                        <FiClock className='w-4 h-4' />
                        <span>
                          {doctor.availableHours?.days
                            ?.slice(0, 3)
                            .join(', ') || 'Not specified'}
                          {doctor.availableHours?.days &&
                            doctor.availableHours.days.length > 3 &&
                            '...'}
                        </span>
                      </div>

                      <div className='flex items-center gap-3 text-sm text-gray-600'>
                        <FiDollarSign className='w-4 h-4' />
                        <span className='font-semibold text-green-600'>
                          LKR {doctor.consultationFee.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Languages */}
                    {doctor.languages.length > 0 && (
                      <div className='mb-6'>
                        <p className='text-xs font-medium text-gray-500 mb-2'>
                          Speaks
                        </p>
                        <div className='flex flex-wrap gap-2'>
                          {doctor.languages.slice(0, 3).map((lang, index) => (
                            <span
                              key={index}
                              className='px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded'
                            >
                              {lang}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className='flex gap-3'>
                      <button
                        onClick={() => handleSelectDoctor(doctor)}
                        className='flex-1 px-4 py-3 bg-linear-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 font-semibold'
                      >
                        <FiCalendar className='w-4 h-4' />
                        Book Now
                      </button>

                      <button
                        onClick={() => {
                          /* Add view profile functionality */
                        }}
                        className='px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors'
                      >
                        <FiInfo className='w-4 h-4 text-gray-600' />
                      </button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </motion.div>

          {/* No Results */}
          {filteredDoctors.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className='text-center py-16'
            >
              <div className='inline-flex items-center justify-center w-24 h-24 bg-linear-to-br from-blue-100 to-purple-100 rounded-full mb-6'>
                <FiUser className='w-12 h-12 text-blue-600' />
              </div>
              <h3 className='text-2xl font-bold text-gray-900 mb-3'>
                No doctors found
              </h3>
              <p className='text-gray-600 mb-6 max-w-md mx-auto'>
                Try adjusting your search criteria or clear filters to see all
                available doctors.
              </p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedSpecialization('');
                  setSelectedDepartment('');
                  setMinExperience(0);
                  setMaxFee(10000);
                }}
                className='px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors'
              >
                Clear All Filters
              </button>
            </motion.div>
          )}
        </div>

        {/* Booking Modal */}
        <AnimatePresence>
          {showBookingModal && selectedDoctor && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm'
            >
              <motion.div
                variants={modalVariants}
                initial='hidden'
                animate='visible'
                exit='exit'
                className='bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto'
              >
                {/* Modal Header */}
                <div className='sticky top-0 bg-white border-b border-gray-200 px-8 py-6 flex items-center justify-between rounded-t-2xl'>
                  <div className='flex items-center gap-4'>
                    <div className='w-12 h-12 bg-linear-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white text-xl font-bold'>
                      {selectedDoctor.name.charAt(0)}
                    </div>
                    <div>
                      <h2 className='text-2xl font-bold text-gray-900'>
                        Book Appointment
                      </h2>
                      <p className='text-sm text-gray-600'>
                        Dr. {selectedDoctor.name} •{' '}
                        {selectedDoctor.specialization}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleCloseModal}
                    className='p-2 hover:bg-gray-100 rounded-lg transition-colors'
                  >
                    <FiX className='w-6 h-6' />
                  </button>
                </div>

                {/* Modal Body */}
                <form onSubmit={handleSubmit} className='p-8 space-y-6'>
                  {/* Doctor Info Card */}
                  <div className='bg-linear-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-100'>
                    <div className='flex justify-between items-start'>
                      <div>
                        <h3 className='font-semibold text-gray-900'>
                          Consultation Details
                        </h3>
                        <p className='text-sm text-gray-600 mt-1'>
                          {selectedDoctor.hospital}
                        </p>
                      </div>
                      <div className='text-right'>
                        <p className='text-2xl font-bold text-blue-600'>
                          LKR {selectedDoctor.consultationFee.toLocaleString()}
                        </p>
                        <p className='text-sm text-gray-500'>
                          Consultation fee
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                    {/* Appointment Date */}
                    <div>
                      <label className='block text-sm font-semibold text-gray-700 mb-3'>
                        <FiCalendar className='inline w-4 h-4 mr-2' />
                        Appointment Date *
                      </label>
                      <input
                        type='date'
                        name='appointmentDate'
                        value={formData.appointmentDate}
                        onChange={handleChange}
                        min={getMinDate()}
                        max={getMaxDate()}
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                          formErrors.appointmentDate
                            ? 'border-red-300 bg-red-50'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      />
                      {formErrors.appointmentDate && (
                        <p className='mt-2 text-sm text-red-600 flex items-center gap-1'>
                          <FiAlertCircle className='w-4 h-4' />
                          {formErrors.appointmentDate}
                        </p>
                      )}
                    </div>

                    {/* Appointment Time */}
                    <div>
                      <label className='block text-sm font-semibold text-gray-700 mb-3'>
                        <FiClock className='inline w-4 h-4 mr-2' />
                        Appointment Time *
                      </label>
                      <input
                        type='time'
                        name='appointmentTime'
                        value={formData.appointmentTime}
                        onChange={handleChange}
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                          formErrors.appointmentTime
                            ? 'border-red-300 bg-red-50'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      />
                      {formErrors.appointmentTime && (
                        <p className='mt-2 text-sm text-red-600 flex items-center gap-1'>
                          <FiAlertCircle className='w-4 h-4' />
                          {formErrors.appointmentTime}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Appointment Type */}
                  <div>
                    <label className='block text-sm font-semibold text-gray-700 mb-3'>
                      Appointment Type *
                    </label>
                    <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
                      {(
                        [
                          'CONSULTATION',
                          'FOLLOW_UP',
                          'CHECK_UP',
                          'EMERGENCY',
                        ] as const
                      ).map(type => (
                        <button
                          key={type}
                          type='button'
                          onClick={() =>
                            setFormData(prev => ({ ...prev, type }))
                          }
                          className={`px-4 py-3 rounded-xl border-2 transition-all ${
                            formData.type === type
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-200 hover:border-gray-300 text-gray-700'
                          }`}
                        >
                          <div className='text-sm font-medium'>
                            {type.replace('_', ' ')}
                          </div>
                        </button>
                      ))}
                    </div>
                    {formErrors.type && (
                      <p className='mt-2 text-sm text-red-600'>
                        {formErrors.type}
                      </p>
                    )}
                  </div>

                  {/* Reason for Visit */}
                  <div>
                    <label className='block text-sm font-semibold text-gray-700 mb-3'>
                      Reason for Visit *
                    </label>
                    <textarea
                      name='reason'
                      value={formData.reason}
                      onChange={handleChange}
                      rows={3}
                      placeholder='Brief description of your concern...'
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                        formErrors.reason
                          ? 'border-red-300 bg-red-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    />
                    {formErrors.reason && (
                      <p className='mt-2 text-sm text-red-600'>
                        {formErrors.reason}
                      </p>
                    )}
                  </div>

                  {/* Symptoms */}
                  <div>
                    <label className='block text-sm font-semibold text-gray-700 mb-3'>
                      Symptoms
                    </label>
                    <textarea
                      name='symptoms'
                      value={formData.symptoms}
                      onChange={handleChange}
                      rows={3}
                      placeholder="List any symptoms you're experiencing..."
                      className='w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all hover:border-gray-400'
                    />
                  </div>

                  {/* Additional Notes */}
                  <div>
                    <label className='block text-sm font-semibold text-gray-700 mb-3'>
                      Additional Notes
                    </label>
                    <textarea
                      name='notes'
                      value={formData.notes}
                      onChange={handleChange}
                      rows={2}
                      placeholder='Any other information...'
                      className='w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all hover:border-gray-400'
                    />
                  </div>

                  {/* Modal Actions */}
                  <div className='flex gap-4 pt-6 border-t border-gray-200'>
                    <button
                      type='button'
                      onClick={handleCloseModal}
                      disabled={saving}
                      className='flex-1 px-6 py-4 text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-all hover:shadow-md'
                    >
                      Cancel
                    </button>
                    <button
                      type='submit'
                      disabled={saving}
                      className='flex-1 px-6 py-4 bg-linear-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 transition-all hover:shadow-lg transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 font-semibold'
                    >
                      {saving ? (
                        <>
                          <div className='w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
                          Processing...
                        </>
                      ) : (
                        <>
                          <FiCheckCircle className='w-5 h-5' />
                          Confirm Booking
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}

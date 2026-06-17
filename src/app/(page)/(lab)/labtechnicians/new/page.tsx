/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { motion, AnimatePresence } from 'framer-motion';
import {
  FiArrowLeft as ArrowLeft,
  FiSave as Save,
  FiUser as User,
  FiMail as Mail,
  FiPhone as Phone,
  FiBriefcase as Briefcase,
  FiAward as Award,
  FiClock as Clock,
  FiAlertCircle as AlertCircle,
  FiPlus as Plus,
  FiX as X,
  FiCheckCircle as CheckCircle,
  FiDatabase as Database,
  FiCalendar as Calendar,
  FiHash as Hash,
} from 'react-icons/fi';
import Toast from '@/components/ui/Toast';
import Loading from '@/components/ui/Loading';

export interface UserTechnician {
  _id: string;
  name: string;
  email: string;
  nic: string;
  phone?: string;
}

// Status options
const STATUS_OPTIONS = ['AVAILABLE', 'BUSY', 'OFFLINE', 'ON_LEAVE'] as const;
const SHIFT_OPTIONS = ['GENERAL', 'MORNING', 'EVENING', 'NIGHT'] as const;

// Form schema - updated to match model field names
const technicianSchema = z.object({
  user: z.string().optional(),
  name: z.string().min(1, 'Name is required'),
  employeeId: z.string().min(1, 'Employee ID is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(1, 'Phone number is required'),
  specialization: z.string().min(1, 'Specialization is required'),
  qualification: z.string().min(1, 'Qualification is required'),
  yearsOfExperience: z
    .number()
    .min(0, 'Experience must be a positive number')
    .max(50, 'Experience cannot exceed 50 years'),
  status: z.enum(STATUS_OPTIONS),
  shift: z.enum(SHIFT_OPTIONS),
  maxConcurrentTests: z
    .number()
    .min(1, 'Max concurrent tests must be at least 1'),
  joinedDate: z.string().min(1, 'Joined date is required'),
  certifications: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

type TechnicianFormData = z.infer<typeof technicianSchema>;

// Specialization options
const SPECIALIZATIONS = [
  'Hematology',
  'Clinical Chemistry',
  'Microbiology',
  'Immunology',
  'Pathology',
  'Cytology',
  'Molecular Biology',
  'Blood Bank',
  'General Laboratory',
];

// Qualification options
const QUALIFICATIONS = [
  'Bachelor of Medical Laboratory Science',
  'Diploma in Medical Laboratory Technology',
  'Master of Science in Clinical Laboratory Science',
  'PhD in Laboratory Medicine',
  'Certified Medical Laboratory Technician',
  'Medical Laboratory Assistant',
];

const STATUS_CONFIG = {
  AVAILABLE: { color: 'emerald', icon: '●', label: 'Available' },
  BUSY: { color: 'amber', icon: '●', label: 'Busy' },
  OFFLINE: { color: 'slate', icon: '●', label: 'Offline' },
  ON_LEAVE: { color: 'orange', icon: '●', label: 'On Leave' },
};

const SHIFT_CONFIG = {
  GENERAL: { label: 'General', color: 'blue' },
  MORNING: { label: 'Morning', color: 'amber' },
  EVENING: { label: 'Evening', color: 'purple' },
  NIGHT: { label: 'Night', color: 'indigo' },
};

export default function NewTechnicianPage() {
  const router = useRouter();

  const [certifications, setCertifications] = useState<string[]>([]);
  const [newCertification, setNewCertification] = useState('');
  const [showCertificationInput, setShowCertificationInput] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // User selection state
  const [users, setUsers] = useState<UserTechnician[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [userError, setUserError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserTechnician | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<any[]>([]);
  const [creating, setCreating] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TechnicianFormData>({
    resolver: zodResolver(technicianSchema),
    defaultValues: {
      user: '',
      name: '',
      employeeId: '',
      email: '',
      phone: '',
      specialization: 'General Laboratory',
      qualification: '',
      yearsOfExperience: 0,
      status: 'AVAILABLE',
      shift: 'GENERAL',
      maxConcurrentTests: 10,
      joinedDate: new Date().toISOString().split('T')[0],
      certifications: [],
      notes: '',
    },
  });

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      setUserError(null);
      const response = await fetch('/api/users?role=USER&limit=100');
      if (!response.ok) throw new Error('Failed to fetch users');
      const result = await response.json();

      if (result.success && result.data) {
        setUsers(result.data);
      } else if (result.users) {
        setUsers(result.users);
      } else if (Array.isArray(result)) {
        setUsers(result);
      } else {
        setUsers([]);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setUserError('Failed to load users');
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleUserSelect = (userId: string) => {
    const user = users.find(u => u._id === userId);
    setSelectedUser(user || null);
    setValue('user', userId);

    if (user) {
      setValue('name', user.name);
      setValue('email', user.email);
      if (user.phone) {
        setValue('phone', user.phone);
      }
    }
  };

  const status = watch('status');
  const shift = watch('shift');

  const addCertification = () => {
    if (newCertification.trim()) {
      const updated = [...certifications, newCertification.trim()];
      setCertifications(updated);
      setValue('certifications', updated);
      setNewCertification('');
      setShowCertificationInput(false);
    }
  };

  const removeCertification = (index: number) => {
    const updated = certifications.filter((_, i) => i !== index);
    setCertifications(updated);
    setValue('certifications', updated);
  };

  const onSubmit = async (data: TechnicianFormData) => {
    setApiError(null);
    setValidationErrors([]);
    setCreating(true);

    try {
      // Prepare data for API - using exact model field names
      const submitData = {
        user: selectedUser?._id,
        name: data.name,
        employeeId: data.employeeId,
        email: data.email,
        phone: data.phone,
        specialization: data.specialization,
        qualification: data.qualification,
        yearsOfExperience: data.yearsOfExperience,
        status: data.status,
        shift: data.shift,
        maxConcurrentTests: data.maxConcurrentTests,
        joinedDate: data.joinedDate,
        certifications: data.certifications || [],
        notes: data.notes || '',
      };

      // Make the API call
      const response = await fetch('/api/lab/lab-technicians', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      const result = await response.json();

      if (!response.ok) {
        // Handle error response
        throw {
          response: {
            data: result,
            status: response.status,
          },
        };
      }

      if (result.success || result.technician) {
        setShowSuccess(true);
        setTimeout(() => {
          router.refresh();
          router.push('/labtechnicians');
        }, 2000);
      }
    } catch (error: any) {
      console.error('Failed to create technician:', error);

      // Handle validation errors from API
      if (error.response?.data?.details) {
        setValidationErrors(error.response.data.details);
      } else if (error.response?.data?.error) {
        // Show specific API error messages
        const errorMsg = error.response.data.error;

        // Enhance duplicate user error message
        if (errorMsg.includes('user') && errorMsg.includes('already')) {
          setApiError(
            `This user is already linked to another technician. Please select a different user or create a technician without linking to a user account.`
          );
        } else if (
          errorMsg.includes('Employee ID') &&
          errorMsg.includes('exists')
        ) {
          setApiError(
            `Employee ID "${data.employeeId}" is already in use. Please choose a different employee ID.`
          );
        } else {
          setApiError(errorMsg);
        }
      } else {
        setApiError(error.message || 'Failed to create technician');
      }
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className='min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-slate-50'>
      {/* Decorative background elements */}
      <div className='fixed inset-0 overflow-hidden pointer-events-none'>
        <div className='absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse' />
        <div
          className='absolute top-40 -left-40 w-96 h-96 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse'
          style={{ animationDelay: '2s' }}
        />
        <div
          className='absolute -bottom-40 right-1/3 w-80 h-80 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse'
          style={{ animationDelay: '4s' }}
        />
      </div>

      <div className='relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12'>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className='mb-10'
        >
          <Link
            href='/labtechnicians'
            className='inline-flex items-center text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors mb-6 group'
          >
            <ArrowLeft className='w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform' />
            Back to Technicians
          </Link>
          <div className='flex items-start gap-4'>
            <div className='shrink-0 w-14 h-14 bg-linear-to-br from-blue-500 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30'>
              <User className='w-7 h-7 text-white' />
            </div>
            <div>
              <h1 className='text-4xl font-bold text-slate-900 tracking-tight'>
                Add New Technician
              </h1>
              <p className='mt-2 text-slate-600 text-lg'>
                Create a new laboratory technician profile
              </p>
            </div>
          </div>
        </motion.div>

        {/* Validation Errors */}
        <AnimatePresence>
          {validationErrors.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className='mb-6 p-5 bg-linear-to-r from-amber-50 to-yellow-50 border-2 border-amber-200 rounded-2xl shadow-lg shadow-amber-500/10'
            >
              <h3 className='text-sm font-bold text-amber-900 mb-3 flex items-center gap-2'>
                <AlertCircle className='w-5 h-5' />
                Please fix the following errors:
              </h3>
              <ul className='space-y-2'>
                {validationErrors.map((err, index) => (
                  <li
                    key={index}
                    className='text-sm text-amber-800 flex items-start gap-2'
                  >
                    <span className='text-amber-500 mt-0.5'>•</span>
                    <span>
                      <strong>{err.field}:</strong> {err.message}
                    </span>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
          {/* User Selection - Optional */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className='bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200/50 p-8 hover:shadow-2xl transition-shadow duration-300'
          >
            <div className='flex items-center gap-3 mb-6'>
              <div className='w-10 h-10 bg-linear-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center'>
                <Database className='w-5 h-5 text-white' />
              </div>
              <div>
                <h2 className='text-xl font-bold text-slate-900'>
                  Link to Existing User
                </h2>
                <p className='text-sm text-slate-500'>Optional</p>
              </div>
            </div>

            <div>
              <label className='block text-sm font-semibold text-slate-700 mb-3'>
                Select User
              </label>

              {loadingUsers ? (
                <div className='flex items-center justify-center gap-3 text-slate-500 py-8'>
                  <Loading size='sm' fullScreen={false} />
                  <span className='text-sm font-medium'>Loading users...</span>
                </div>
              ) : userError ? (
                <div className='p-4 bg-red-50 border-2 border-red-200 rounded-xl'>
                  <p className='text-sm text-red-600 mb-3'>{userError}</p>
                  <button
                    type='button'
                    onClick={fetchUsers}
                    className='text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors'
                  >
                    Try Again →
                  </button>
                </div>
              ) : !users || users.length === 0 ? (
                <p className='text-sm text-slate-500 py-4'>
                  No users available
                </p>
              ) : (
                <>
                  <div className='relative'>
                    <User className='absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none' />
                    <select
                      onChange={e => handleUserSelect(e.target.value)}
                      value={selectedUser?._id || ''}
                      className='w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-slate-900 font-medium hover:border-slate-300'
                    >
                      <option value=''>Select a user to link (optional)</option>
                      {users.map(user => (
                        <option key={user._id} value={user._id}>
                          {user.name} — {user.email}
                        </option>
                      ))}
                    </select>
                  </div>

                  <AnimatePresence>
                    {selectedUser && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className='mt-3 p-4 bg-linear-to-r from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-xl'
                      >
                        <p className='text-sm text-emerald-700 font-medium flex items-center gap-2'>
                          <CheckCircle className='w-4 h-4 shrink-0' />
                          User linked! Name and email will be auto-filled from
                          this account.
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              )}

              <div className='mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200'>
                <div className='space-y-1.5 text-xs text-slate-600'>
                  <p className='flex items-start gap-2'>
                    <span className='text-blue-500 mt-0.5'>•</span>
                    <span>
                      Linking a user allows the technician to log in with their
                      account
                    </span>
                  </p>
                  <p className='flex items-start gap-2'>
                    <span className='text-blue-500 mt-0.5'>•</span>
                    <span>
                      If no user is selected, a technician-only record will be
                      created
                    </span>
                  </p>
                  <p className='flex items-start gap-2'>
                    <span className='text-blue-500 mt-0.5'>•</span>
                    <span>
                      Name and email will be auto-filled when a user is selected
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Personal Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className='bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200/50 p-8 hover:shadow-2xl transition-shadow duration-300'
          >
            <div className='flex items-center gap-3 mb-6'>
              <div className='w-10 h-10 bg-linear-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center'>
                <User className='w-5 h-5 text-white' />
              </div>
              <h2 className='text-xl font-bold text-slate-900'>
                Personal Information
              </h2>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              {/* Full Name */}
              <div className='md:col-span-2'>
                <label className='block text-sm font-semibold text-slate-700 mb-2'>
                  Full Name <span className='text-red-500'>*</span>
                </label>
                <div className='relative'>
                  <User className='absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none' />
                  <input
                    type='text'
                    {...register('name')}
                    className={`w-full pl-12 pr-4 py-3.5 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-slate-900 font-medium ${
                      selectedUser
                        ? 'bg-slate-50 border-slate-200'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    } ${errors.name ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
                    placeholder='Enter full name'
                    readOnly={!!selectedUser}
                  />
                </div>
                {errors.name && (
                  <p className='mt-2 text-sm text-red-600 flex items-center gap-1.5 font-medium'>
                    <AlertCircle className='w-4 h-4 shrink-0' />
                    {errors.name.message}
                  </p>
                )}
              </div>

              {/* Employee ID */}
              <div>
                <label className='block text-sm font-semibold text-slate-700 mb-2'>
                  Employee ID <span className='text-red-500'>*</span>
                </label>
                <div className='relative'>
                  <Hash className='absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none' />
                  <input
                    type='text'
                    {...register('employeeId')}
                    className={`w-full pl-12 pr-4 py-3.5 bg-white border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-slate-900 font-medium hover:border-slate-300 ${errors.employeeId ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-slate-200'}`}
                    placeholder='e.g., EMP001'
                  />
                </div>
                {errors.employeeId && (
                  <p className='mt-2 text-sm text-red-600 font-medium'>
                    {errors.employeeId.message}
                  </p>
                )}
              </div>

              {/* Joined Date */}
              <div>
                <label className='block text-sm font-semibold text-slate-700 mb-2'>
                  Joined Date <span className='text-red-500'>*</span>
                </label>
                <div className='relative'>
                  <Calendar className='absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none' />
                  <input
                    type='date'
                    {...register('joinedDate')}
                    className={`w-full pl-12 pr-4 py-3.5 bg-white border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-slate-900 font-medium hover:border-slate-300 ${errors.joinedDate ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-slate-200'}`}
                  />
                </div>
                {errors.joinedDate && (
                  <p className='mt-2 text-sm text-red-600 font-medium'>
                    {errors.joinedDate.message}
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className='block text-sm font-semibold text-slate-700 mb-2'>
                  Email <span className='text-red-500'>*</span>
                </label>
                <div className='relative'>
                  <Mail className='absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none' />
                  <input
                    type='email'
                    {...register('email')}
                    className={`w-full pl-12 pr-4 py-3.5 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-slate-900 font-medium ${
                      selectedUser
                        ? 'bg-slate-50 border-slate-200'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    } ${errors.email ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
                    placeholder='technician@example.com'
                    readOnly={!!selectedUser}
                  />
                </div>
                {errors.email && (
                  <p className='mt-2 text-sm text-red-600 font-medium'>
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className='block text-sm font-semibold text-slate-700 mb-2'>
                  Phone <span className='text-red-500'>*</span>
                </label>
                <div className='relative'>
                  <Phone className='absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none' />
                  <input
                    type='tel'
                    {...register('phone')}
                    className={`w-full pl-12 pr-4 py-3.5 bg-white border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-slate-900 font-medium hover:border-slate-300 ${errors.phone ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-slate-200'}`}
                    placeholder='+94 77 123 4567'
                  />
                </div>
                {errors.phone && (
                  <p className='mt-2 text-sm text-red-600 font-medium'>
                    {errors.phone.message}
                  </p>
                )}
              </div>
            </div>
          </motion.div>

          {/* Professional Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className='bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200/50 p-8 hover:shadow-2xl transition-shadow duration-300'
          >
            <div className='flex items-center gap-3 mb-6'>
              <div className='w-10 h-10 bg-linear-to-br from-violet-500 to-purple-500 rounded-xl flex items-center justify-center'>
                <Briefcase className='w-5 h-5 text-white' />
              </div>
              <h2 className='text-xl font-bold text-slate-900'>
                Professional Information
              </h2>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              {/* Specialization */}
              <div>
                <label className='block text-sm font-semibold text-slate-700 mb-2'>
                  Specialization <span className='text-red-500'>*</span>
                </label>
                <select
                  {...register('specialization')}
                  className='w-full px-4 py-3.5 bg-white border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-slate-900 font-medium hover:border-slate-300'
                >
                  {SPECIALIZATIONS.map(spec => (
                    <option key={spec} value={spec}>
                      {spec}
                    </option>
                  ))}
                </select>
                {errors.specialization && (
                  <p className='mt-2 text-sm text-red-600 font-medium'>
                    {errors.specialization.message}
                  </p>
                )}
              </div>

              {/* Qualification */}
              <div>
                <label className='block text-sm font-semibold text-slate-700 mb-2'>
                  Qualification <span className='text-red-500'>*</span>
                </label>
                <select
                  {...register('qualification')}
                  className={`w-full px-4 py-3.5 bg-white border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-slate-900 font-medium hover:border-slate-300 ${errors.qualification ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-slate-200'}`}
                >
                  <option value=''>Select qualification</option>
                  {QUALIFICATIONS.map(qual => (
                    <option key={qual} value={qual}>
                      {qual}
                    </option>
                  ))}
                </select>
                {errors.qualification && (
                  <p className='mt-2 text-sm text-red-600 font-medium'>
                    {errors.qualification.message}
                  </p>
                )}
              </div>

              {/* Years of Experience */}
              <div>
                <label className='block text-sm font-semibold text-slate-700 mb-2'>
                  Years of Experience <span className='text-red-500'>*</span>
                </label>
                <input
                  type='number'
                  {...register('yearsOfExperience', { valueAsNumber: true })}
                  className={`w-full px-4 py-3.5 bg-white border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-slate-900 font-medium hover:border-slate-300 ${errors.yearsOfExperience ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-slate-200'}`}
                  min='0'
                  max='50'
                  step='0.5'
                  placeholder='e.g., 5'
                />
                {errors.yearsOfExperience && (
                  <p className='mt-2 text-sm text-red-600 font-medium'>
                    {errors.yearsOfExperience.message}
                  </p>
                )}
              </div>

              {/* Max Concurrent Tests */}
              <div>
                <label className='block text-sm font-semibold text-slate-700 mb-2'>
                  Max Concurrent Tests <span className='text-red-500'>*</span>
                </label>
                <input
                  type='number'
                  {...register('maxConcurrentTests', { valueAsNumber: true })}
                  className='w-full px-4 py-3.5 bg-white border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-slate-900 font-medium hover:border-slate-300'
                  min='1'
                  max='50'
                  placeholder='e.g., 10'
                />
                {errors.maxConcurrentTests && (
                  <p className='mt-2 text-sm text-red-600 font-medium'>
                    {errors.maxConcurrentTests.message}
                  </p>
                )}
              </div>
            </div>
          </motion.div>

          {/* Certifications */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className='bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200/50 p-8 hover:shadow-2xl transition-shadow duration-300'
          >
            <div className='flex items-center gap-3 mb-6'>
              <div className='w-10 h-10 bg-linear-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center'>
                <Award className='w-5 h-5 text-white' />
              </div>
              <h2 className='text-xl font-bold text-slate-900'>
                Certifications
              </h2>
            </div>

            {/* Certifications List */}
            <AnimatePresence>
              {certifications.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className='space-y-3 mb-6'
                >
                  {certifications.map((cert, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className='flex items-center justify-between p-4 bg-linear-to-r from-slate-50 to-blue-50 border-2 border-slate-200 rounded-xl group hover:border-blue-300 transition-all'
                    >
                      <span className='text-sm font-medium text-slate-700'>
                        {cert}
                      </span>
                      <button
                        type='button'
                        onClick={() => removeCertification(index)}
                        className='p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all'
                      >
                        <X className='w-4 h-4' />
                      </button>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Add Certification */}
            <AnimatePresence mode='wait'>
              {showCertificationInput ? (
                <motion.div
                  key='input'
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className='flex gap-3'
                >
                  <input
                    type='text'
                    value={newCertification}
                    onChange={e => setNewCertification(e.target.value)}
                    onKeyDown={e =>
                      e.key === 'Enter' &&
                      (e.preventDefault(), addCertification())
                    }
                    className='flex-1 px-4 py-3.5 bg-white border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-slate-900 font-medium'
                    placeholder='Enter certification name'
                    autoFocus
                  />
                  <button
                    type='button'
                    onClick={addCertification}
                    className='px-6 py-3.5 bg-linear-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg shadow-blue-500/30'
                  >
                    Add
                  </button>
                  <button
                    type='button'
                    onClick={() => setShowCertificationInput(false)}
                    className='px-6 py-3.5 border-2 border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-all'
                  >
                    Cancel
                  </button>
                </motion.div>
              ) : (
                <motion.button
                  key='button'
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  type='button'
                  onClick={() => setShowCertificationInput(true)}
                  className='inline-flex items-center px-6 py-3.5 border-2 border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 hover:border-blue-300 transition-all group'
                >
                  <Plus className='w-5 h-5 mr-2 group-hover:rotate-90 transition-transform' />
                  Add Certification
                </motion.button>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Status & Availability */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className='bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200/50 p-8 hover:shadow-2xl transition-shadow duration-300'
          >
            <div className='flex items-center gap-3 mb-6'>
              <div className='w-10 h-10 bg-linear-to-br from-teal-500 to-emerald-500 rounded-xl flex items-center justify-center'>
                <Clock className='w-5 h-5 text-white' />
              </div>
              <h2 className='text-xl font-bold text-slate-900'>
                Status & Availability
              </h2>
            </div>

            <div>
              <label className='block text-sm font-semibold text-slate-700 mb-4'>
                Current Status
              </label>
              <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
                {STATUS_OPTIONS.map(s => {
                  const config = STATUS_CONFIG[s];
                  const isSelected = status === s;
                  return (
                    <motion.button
                      key={s}
                      type='button'
                      onClick={() => setValue('status', s)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`relative p-4 border-2 rounded-xl text-center transition-all ${
                        isSelected
                          ? `border-${config.color}-500 bg-${config.color}-50 shadow-lg shadow-${config.color}-500/20`
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className='flex flex-col items-center gap-2'>
                        <span
                          className={`text-2xl ${isSelected ? `text-${config.color}-500` : 'text-slate-300'}`}
                        >
                          {config.icon}
                        </span>
                        <span
                          className={`text-sm font-semibold ${
                            isSelected
                              ? `text-${config.color}-700`
                              : 'text-slate-600'
                          }`}
                        >
                          {config.label}
                        </span>
                      </div>
                      {isSelected && (
                        <motion.div
                          layoutId='status-indicator'
                          className='absolute -top-1 -right-1 w-6 h-6 bg-linear-to-br from-blue-500 to-teal-500 rounded-full flex items-center justify-center shadow-lg'
                        >
                          <CheckCircle className='w-4 h-4 text-white' />
                        </motion.div>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            <div className='mt-8'>
              <label className='block text-sm font-semibold text-slate-700 mb-4'>
                Work Shift
              </label>
              <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
                {SHIFT_OPTIONS.map(s => {
                  const config = SHIFT_CONFIG[s];
                  const isSelected = shift === s;
                  return (
                    <motion.button
                      key={s}
                      type='button'
                      onClick={() => setValue('shift', s)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`relative p-3 border-2 rounded-xl text-center transition-all ${
                        isSelected
                          ? `border-${config.color}-500 bg-${config.color}-50 shadow-lg shadow-${config.color}-500/20`
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <span
                        className={`text-sm font-semibold ${
                          isSelected
                            ? `text-${config.color}-700`
                            : 'text-slate-600'
                        }`}
                      >
                        {config.label}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </motion.div>

          {/* Notes */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className='bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200/50 p-8 hover:shadow-2xl transition-shadow duration-300'
          >
            <h2 className='text-xl font-bold text-slate-900 mb-4'>
              Additional Notes
            </h2>
            <textarea
              {...register('notes')}
              rows={4}
              className='w-full px-4 py-4 bg-white border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-slate-900 resize-none hover:border-slate-300'
              placeholder='Enter any additional notes about the technician...'
            />
          </motion.div>

          {/* Form Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className='flex items-center justify-end gap-4 pt-8'
          >
            <Link
              href='/labtechnicians'
              className='px-8 py-4 border-2 border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-all'
            >
              Cancel
            </Link>
            <motion.button
              type='submit'
              disabled={creating}
              whileHover={{ scale: creating ? 1 : 1.02 }}
              whileTap={{ scale: creating ? 1 : 0.98 }}
              className='px-8 py-4 bg-linear-to-r from-blue-500 to-teal-500 text-white font-bold rounded-xl hover:from-blue-600 hover:to-teal-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 shadow-xl shadow-blue-500/30 transition-all'
            >
              {creating ? (
                <>
                  <Loading size='sm' fullScreen={false} />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Save className='w-5 h-5' />
                  <span>Create Technician</span>
                </>
              )}
            </motion.button>
          </motion.div>
        </form>

        {/* Toast Notifications */}
        {showSuccess && (
          <Toast
            message='Technician created successfully. Redirecting...'
            type='success'
            onClose={() => setShowSuccess(false)}
          />
        )}
        {apiError && (
          <Toast
            message={apiError}
            type='error'
            onClose={() => setApiError(null)}
          />
        )}
      </div>
    </div>
  );
}

/* eslint-disable no-undef */
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiSearch,
  FiPlus,
  FiEdit,
  FiTrash2,
  FiFilter,
  FiUser,
  FiAlertCircle,
  FiCalendar,
  FiPhone,
  FiMail,
  FiRefreshCw,
  FiUsers,
  FiActivity,
  FiTrendingUp,
  FiEye,
  FiDroplet,
  FiHeart,
  FiX,
  FiDownload,
} from 'react-icons/fi';
import Loading from '@/components/Loading';
import ErrorComponent from '@/components/Error';

interface Patient {
  _id: string;
  userId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  medicalRecordNumber: string;
  dateOfBirth: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  bloodType?: string;
  height?: number;
  weight?: number;
  allergies: string[];
  chronicConditions: string[];
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
    email?: string;
  };
  insurance?: {
    provider: string;
    policyNumber: string;
    expiryDate?: string;
  };
  primaryPhysician?: {
    _id: string;
    firstName: string;
    lastName: string;
    specialty?: string;
  };
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  age?: number;
  bmi?: number;
}

export default function PatientsPage() {
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filterGender, setFilterGender] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filterBloodType, setFilterBloodType] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPatients, setTotalPatients] = useState(0);

  const patientsPerPage = 9;

  useEffect(() => {
    fetchPatients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      setError(null);
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: patientsPerPage.toString(),
      });

      if (searchTerm) queryParams.set('search', searchTerm);

      const response = await fetch(`/api/pharmacy/patients?${queryParams}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch patients');
      }

      const data = await response.json();
      if (data.success) {
        setPatients(data.data.patients || []);
        setTotalPatients(data.data.pagination.total);
        setTotalPages(data.data.pagination.totalPages);
      } else {
        throw new Error(data.message || 'Failed to fetch patients');
      }
    } catch (err) {
      console.error('Error fetching patients:', err);
      setError(err instanceof Error ? err.message : 'Failed to load patients');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchPatients();
  };

  const handleDelete = async (patientId: string) => {
    try {
      setDeleting(true);
      const response = await fetch(`/api/pharmacy/patients/${patientId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete patient');
      }

      setPatients(prev => prev.filter(patient => patient._id !== patientId));
      setShowDeleteModal(false);
      setSelectedPatient(null);
      setTotalPatients(prev => prev - 1);
      fetchPatients(); // Refresh the list
    } catch (err) {
      console.error('Error deleting patient:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete patient');
    } finally {
      setDeleting(false);
    }
  };

  // Filter and sort patients
  const filteredAndSortedPatients = patients
    .filter(patient => {
      const matchesSearch =
        patient.userId.firstName
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        patient.userId.lastName
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        patient.medicalRecordNumber
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        patient.userId.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.userId.phone.includes(searchTerm);

      const matchesGender =
        filterGender === 'all' || patient.gender === filterGender;

      const matchesStatus =
        filterStatus === 'all' ||
        (filterStatus === 'active' ? patient.isActive : !patient.isActive);

      const matchesBloodType =
        filterBloodType === 'all' || patient.bloodType === filterBloodType;

      return (
        matchesSearch && matchesGender && matchesStatus && matchesBloodType
      );
    })
    .sort((a, b) => {
      let compareValue = 0;

      switch (sortBy) {
        case 'name': {
          const nameA =
            `${a.userId.firstName} ${a.userId.lastName}`.toLowerCase();
          const nameB =
            `${b.userId.firstName} ${b.userId.lastName}`.toLowerCase();
          compareValue = nameA.localeCompare(nameB);
          break;
        }
        case 'age':
          compareValue = (a.age || 0) - (b.age || 0);
          break;
        case 'mrn':
          compareValue = a.medicalRecordNumber.localeCompare(
            b.medicalRecordNumber
          );
          break;
        case 'createdAt':
          compareValue =
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        default:
          compareValue = 0;
      }

      return sortOrder === 'asc' ? compareValue : -compareValue;
    });

  const getBMICategory = (bmi?: number) => {
    if (!bmi) return null;
    if (bmi < 18.5)
      return {
        category: 'Underweight',
        color: 'text-yellow-600 bg-yellow-100',
      };
    if (bmi < 25)
      return { category: 'Normal', color: 'text-green-600 bg-green-100' };
    if (bmi < 30)
      return { category: 'Overweight', color: 'text-orange-600 bg-orange-100' };
    return { category: 'Obese', color: 'text-red-600 bg-red-100' };
  };

  const getBloodTypeColor = (bloodType?: string) => {
    const colors: { [key: string]: string } = {
      'A+': 'bg-red-100 text-red-800',
      'A-': 'bg-red-50 text-red-700',
      'B+': 'bg-blue-100 text-blue-800',
      'B-': 'bg-blue-50 text-blue-700',
      'AB+': 'bg-purple-100 text-purple-800',
      'AB-': 'bg-purple-50 text-purple-700',
      'O+': 'bg-green-100 text-green-800',
      'O-': 'bg-green-50 text-green-700',
    };
    return bloodType ? colors[bloodType] || 'bg-gray-100 text-gray-800' : '';
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setFilterGender('all');
    setFilterStatus('all');
    setFilterBloodType('all');
    setSortBy('name');
    setSortOrder('asc');
    setCurrentPage(1);
  };

  const hasActiveFilters =
    searchTerm !== '' ||
    filterGender !== 'all' ||
    filterStatus !== 'all' ||
    filterBloodType !== 'all';

  // Calculate statistics
  const activePatients = patients.filter(p => p.isActive).length;
  const patientsWithAllergies = patients.filter(
    p => p.allergies.length > 0
  ).length;
  const averageAge =
    patients.length > 0
      ? Math.round(
          patients.reduce((sum, p) => sum + (p.age || 0), 0) / patients.length
        )
      : 0;

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchPatients();
  };

  if (loading && !refreshing) return <Loading />;
  if (error) return <ErrorComponent message={error} />;

  return (
    <div className='min-h-screen bg-gray-50 p-4 md:p-6'>
      <div className='max-w-7xl mx-auto'>
        {/* Header */}
        <div className='mb-6 md:mb-8'>
          <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
            <div>
              <h1 className='text-2xl md:text-3xl font-bold text-gray-900'>
                Patients Management
              </h1>
              <p className='text-gray-600 mt-1 md:mt-2'>
                Manage patient records and medical information
              </p>
            </div>
            <div className='flex flex-wrap gap-2 md:gap-3'>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className='flex items-center gap-2 px-3 md:px-4 py-2 md:py-3 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors text-sm md:text-base'
              >
                <FiRefreshCw
                  className={`w-4 h-4 md:w-5 md:h-5 ${refreshing ? 'animate-spin' : ''}`}
                />
                <span className='hidden sm:inline'>Refresh</span>
              </button>
              <button
                onClick={() => router.push('/Pharmacist/patients/new')}
                className='flex items-center gap-2 bg-blue-600 text-white px-4 md:px-6 py-2 md:py-3 rounded-lg hover:bg-blue-700 transition-colors text-sm md:text-base'
              >
                <FiPlus className='w-4 h-4 md:w-5 md:h-5' />
                Add Patient
              </button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8'>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className='bg-white rounded-lg p-4 md:p-6 shadow-sm border border-gray-200'
          >
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-600'>
                  Total Patients
                </p>
                <p className='text-2xl md:text-3xl font-bold text-gray-900 mt-1 md:mt-2'>
                  {totalPatients}
                </p>
              </div>
              <div className='w-10 h-10 md:w-12 md:h-12 bg-blue-100 rounded-full flex items-center justify-center'>
                <FiUsers className='w-5 h-5 md:w-6 md:h-6 text-blue-600' />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className='bg-white rounded-lg p-4 md:p-6 shadow-sm border border-gray-200'
          >
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-600'>
                  Active Patients
                </p>
                <p className='text-2xl md:text-3xl font-bold text-gray-900 mt-1 md:mt-2'>
                  {activePatients}
                </p>
              </div>
              <div className='w-10 h-10 md:w-12 md:h-12 bg-green-100 rounded-full flex items-center justify-center'>
                <FiActivity className='w-5 h-5 md:w-6 md:h-6 text-green-600' />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className='bg-white rounded-lg p-4 md:p-6 shadow-sm border border-gray-200'
          >
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-600'>
                  With Allergies
                </p>
                <p className='text-2xl md:text-3xl font-bold text-gray-900 mt-1 md:mt-2'>
                  {patientsWithAllergies}
                </p>
              </div>
              <div className='w-10 h-10 md:w-12 md:h-12 bg-red-100 rounded-full flex items-center justify-center'>
                <FiAlertCircle className='w-5 h-5 md:w-6 md:h-6 text-red-600' />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className='bg-white rounded-lg p-4 md:p-6 shadow-sm border border-gray-200'
          >
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-600'>Average Age</p>
                <p className='text-2xl md:text-3xl font-bold text-gray-900 mt-1 md:mt-2'>
                  {averageAge}
                </p>
                <p className='text-xs md:text-sm text-gray-500'>years</p>
              </div>
              <div className='w-10 h-10 md:w-12 md:h-12 bg-purple-100 rounded-full flex items-center justify-center'>
                <FiTrendingUp className='w-5 h-5 md:w-6 md:h-6 text-purple-600' />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Search and Filters */}
        <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6 mb-6'>
          <form onSubmit={handleSearch} className='flex flex-col gap-4'>
            {/* Top Row - Search and Basic Filters */}
            <div className='flex flex-col lg:flex-row gap-4'>
              {/* Search */}
              <div className='flex-1 relative'>
                <FiSearch className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5' />
                <input
                  type='text'
                  placeholder='Search patients by name, MRN, email, or phone...'
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className='w-full pl-10 pr-4 py-2 md:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm md:text-base'
                />
              </div>

              {/* Basic Filters */}
              <div className='flex flex-wrap gap-2'>
                <select
                  value={filterGender}
                  onChange={e => setFilterGender(e.target.value)}
                  className='flex-1 min-w-35 px-3 py-2 md:px-4 md:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm md:text-base'
                >
                  <option value='all'>All Genders</option>
                  <option value='MALE'>Male</option>
                  <option value='FEMALE'>Female</option>
                  <option value='OTHER'>Other</option>
                </select>

                <select
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}
                  className='flex-1 min-w-35 px-3 py-2 md:px-4 md:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm md:text-base'
                >
                  <option value='all'>All Status</option>
                  <option value='active'>Active</option>
                  <option value='inactive'>Inactive</option>
                </select>

                <button
                  type='button'
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className={`flex items-center gap-2 px-3 py-2 md:px-4 md:py-3 border rounded-lg transition-colors text-sm md:text-base ${
                    showAdvancedFilters
                      ? 'bg-blue-50 border-blue-300 text-blue-700'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <FiFilter className='w-4 h-4 md:w-5 md:h-5' />
                  Filters
                </button>
              </div>
            </div>

            {/* Advanced Filters */}
            <AnimatePresence>
              {showAdvancedFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className='overflow-hidden'
                >
                  <div className='pt-4 border-t border-gray-200'>
                    <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>
                          Blood Type
                        </label>
                        <select
                          value={filterBloodType}
                          onChange={e => setFilterBloodType(e.target.value)}
                          className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm'
                        >
                          <option value='all'>All Blood Types</option>
                          <option value='A+'>A+</option>
                          <option value='A-'>A-</option>
                          <option value='B+'>B+</option>
                          <option value='B-'>B-</option>
                          <option value='AB+'>AB+</option>
                          <option value='AB-'>AB-</option>
                          <option value='O+'>O+</option>
                          <option value='O-'>O-</option>
                        </select>
                      </div>

                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>
                          Sort By
                        </label>
                        <select
                          value={sortBy}
                          onChange={e => setSortBy(e.target.value)}
                          className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm'
                        >
                          <option value='name'>Name</option>
                          <option value='age'>Age</option>
                          <option value='mrn'>Medical Record Number</option>
                          <option value='createdAt'>Date Added</option>
                        </select>
                      </div>

                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>
                          Sort Order
                        </label>
                        <select
                          value={sortOrder}
                          onChange={e =>
                            setSortOrder(e.target.value as 'asc' | 'desc')
                          }
                          className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm'
                        >
                          <option value='asc'>Ascending</option>
                          <option value='desc'>Descending</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Active Filters Display */}
            {hasActiveFilters && (
              <div className='flex items-center gap-2 flex-wrap'>
                <span className='text-sm text-gray-600'>Active filters:</span>
                {searchTerm && (
                  <span className='px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full flex items-center gap-1'>
                    Search: {searchTerm}
                    <button
                      type='button'
                      onClick={() => setSearchTerm('')}
                      className='ml-1'
                    >
                      <FiX className='w-3 h-3' />
                    </button>
                  </span>
                )}
                {filterGender !== 'all' && (
                  <span className='px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full flex items-center gap-1'>
                    Gender: {filterGender}
                    <button
                      type='button'
                      onClick={() => setFilterGender('all')}
                      className='ml-1'
                    >
                      <FiX className='w-3 h-3' />
                    </button>
                  </span>
                )}
                {filterStatus !== 'all' && (
                  <span className='px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full flex items-center gap-1'>
                    Status: {filterStatus}
                    <button
                      type='button'
                      onClick={() => setFilterStatus('all')}
                      className='ml-1'
                    >
                      <FiX className='w-3 h-3' />
                    </button>
                  </span>
                )}
                {filterBloodType !== 'all' && (
                  <span className='px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full flex items-center gap-1'>
                    Blood: {filterBloodType}
                    <button
                      type='button'
                      onClick={() => setFilterBloodType('all')}
                      className='ml-1'
                    >
                      <FiX className='w-3 h-3' />
                    </button>
                  </span>
                )}
                <button
                  type='button'
                  onClick={clearAllFilters}
                  className='text-sm text-blue-600 hover:text-blue-700 font-medium'
                >
                  Clear all
                </button>
              </div>
            )}

            {/* Search Button for Mobile */}
            <div className='lg:hidden'>
              <button
                type='submit'
                className='w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors'
              >
                Apply Search
              </button>
            </div>
          </form>
        </div>

        {/* Results Count and Controls */}
        <div className='mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2'>
          <p className='text-sm text-gray-600'>
            Showing {filteredAndSortedPatients.length} of {totalPatients}{' '}
            patients • Page {currentPage} of {totalPages}
          </p>
          <div className='flex gap-2'>
            <button
              className='flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors'
              onClick={() => {
                /* Export functionality */
              }}
            >
              <FiDownload className='w-4 h-4' />
              <span className='hidden sm:inline'>Export</span>
            </button>
          </div>
        </div>

        {/* Patients Grid */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6'>
          <AnimatePresence mode='popLayout'>
            {filteredAndSortedPatients.map((patient, index) => (
              <motion.div
                key={patient._id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2, delay: index * 0.02 }}
                className='bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow'
              >
                {/* Patient Card Header */}
                <div className='p-4 md:p-6 border-b border-gray-200'>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-3'>
                      <div className='w-10 h-10 md:w-12 md:h-12 bg-blue-100 rounded-full flex items-center justify-center'>
                        <FiUser className='w-5 h-5 md:w-6 md:h-6 text-blue-600' />
                      </div>
                      <div>
                        <h3 className='font-semibold text-gray-900 text-sm md:text-base'>
                          {patient.userId.firstName} {patient.userId.lastName}
                        </h3>
                        <p className='text-xs md:text-sm text-gray-500'>
                          {patient.age || 'Unknown'} years •{' '}
                          {patient.gender.toLowerCase()}
                        </p>
                      </div>
                    </div>
                    <div className='flex gap-1'>
                      <button
                        onClick={() =>
                          router.push(`/Pharmacist/patients/${patient._id}`)
                        }
                        className='p-1 md:p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors'
                        title='View Details'
                      >
                        <FiEye className='w-3 h-3 md:w-4 md:h-4' />
                      </button>
                      <button
                        onClick={() =>
                          router.push(
                            `/Pharmacist/patients/${patient._id}/edit`
                          )
                        }
                        className='p-1 md:p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors'
                        title='Edit Patient'
                      >
                        <FiEdit className='w-3 h-3 md:w-4 md:h-4' />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedPatient(patient);
                          setShowDeleteModal(true);
                        }}
                        className='p-1 md:p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors'
                        title='Delete Patient'
                      >
                        <FiTrash2 className='w-3 h-3 md:w-4 md:h-4' />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Patient Details */}
                <div className='p-4 md:p-6'>
                  <div className='space-y-2 md:space-y-3 mb-3 md:mb-4'>
                    <div className='flex items-center justify-between text-xs md:text-sm'>
                      <span className='text-gray-500'>MRN:</span>
                      <span className='font-mono text-gray-900'>
                        {patient.medicalRecordNumber}
                      </span>
                    </div>
                    <div className='flex items-center gap-2 md:gap-3 text-xs md:text-sm'>
                      <FiMail className='w-3 h-3 md:w-4 md:h-4 text-gray-400' />
                      <span className='text-gray-600 truncate'>
                        {patient.userId.email}
                      </span>
                    </div>
                    <div className='flex items-center gap-2 md:gap-3 text-xs md:text-sm'>
                      <FiPhone className='w-3 h-3 md:w-4 md:h-4 text-gray-400' />
                      <span className='text-gray-600'>
                        {patient.userId.phone}
                      </span>
                    </div>
                    <div className='flex items-center gap-2 md:gap-3 text-xs md:text-sm'>
                      <FiCalendar className='w-3 h-3 md:w-4 md:h-4 text-gray-400' />
                      <span className='text-gray-600'>
                        {new Date(patient.dateOfBirth).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Medical Information */}
                  <div className='grid grid-cols-2 gap-2 md:gap-3 mb-3 md:mb-4'>
                    {patient.bloodType && (
                      <div className='flex items-center gap-1 md:gap-2'>
                        <FiDroplet className='w-3 h-3 md:w-4 md:h-4 text-red-500' />
                        <span
                          className={`px-1 py-0.5 md:px-2 md:py-1 text-xs font-medium rounded-full ${getBloodTypeColor(patient.bloodType)}`}
                        >
                          {patient.bloodType}
                        </span>
                      </div>
                    )}
                    {patient.bmi && (
                      <div className='flex items-center gap-1 md:gap-2'>
                        <FiHeart className='w-3 h-3 md:w-4 md:h-4 text-green-500' />
                        <span
                          className={`px-1 py-0.5 md:px-2 md:py-1 text-xs font-medium rounded-full ${getBMICategory(patient.bmi)?.color}`}
                        >
                          BMI: {patient.bmi}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Allergies & Conditions */}
                  <div className='space-y-2'>
                    {patient.allergies.length > 0 && (
                      <div>
                        <p className='text-xs font-medium text-gray-500 mb-1'>
                          Allergies
                        </p>
                        <div className='flex flex-wrap gap-1'>
                          {patient.allergies.slice(0, 2).map((allergy, idx) => (
                            <span
                              key={idx}
                              className='px-1.5 py-0.5 bg-red-100 text-red-800 text-xs rounded-full'
                            >
                              {allergy}
                            </span>
                          ))}
                          {patient.allergies.length > 2 && (
                            <span className='px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full'>
                              +{patient.allergies.length - 2} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {patient.chronicConditions.length > 0 && (
                      <div>
                        <p className='text-xs font-medium text-gray-500 mb-1'>
                          Conditions
                        </p>
                        <div className='flex flex-wrap gap-1'>
                          {patient.chronicConditions
                            .slice(0, 2)
                            .map((condition, idx) => (
                              <span
                                key={idx}
                                className='px-1.5 py-0.5 bg-orange-100 text-orange-800 text-xs rounded-full'
                              >
                                {condition}
                              </span>
                            ))}
                          {patient.chronicConditions.length > 2 && (
                            <span className='px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full'>
                              +{patient.chronicConditions.length - 2} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Status Badge */}
                  <div className='mt-3 md:mt-4 flex justify-between items-center'>
                    <span
                      className={`px-1.5 py-0.5 md:px-2 md:py-1 text-xs font-medium rounded-full ${
                        patient.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {patient.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <button
                      onClick={() =>
                        router.push(`/Pharmacist/patients/${patient._id}`)
                      }
                      className='text-blue-600 hover:text-blue-700 text-xs md:text-sm font-medium transition-colors'
                    >
                      View Full Profile →
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className='mt-6 md:mt-8 flex justify-center'>
            <nav className='flex items-center gap-2'>
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className='px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm'
              >
                Previous
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`px-3 py-2 border rounded-lg text-sm ${
                      currentPage === pageNum
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className='px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm'
              >
                Next
              </button>
            </nav>
          </div>
        )}

        {/* Empty State */}
        {filteredAndSortedPatients.length === 0 && (
          <div className='text-center py-8 md:py-12 bg-white rounded-lg border border-gray-200 mt-6'>
            <div className='w-16 h-16 md:w-24 md:h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4'>
              <FiUser className='w-8 h-8 md:w-12 md:h-12 text-gray-400' />
            </div>
            <h3 className='text-base md:text-lg font-semibold text-gray-900 mb-1 md:mb-2'>
              {hasActiveFilters
                ? 'No patients match your criteria'
                : 'No patients found'}
            </h3>
            <p className='text-gray-600 mb-4 md:mb-6 text-sm md:text-base'>
              {hasActiveFilters
                ? 'Try adjusting your search or filters.'
                : 'Get started by adding your first patient.'}
            </p>
            {hasActiveFilters ? (
              <button
                onClick={clearAllFilters}
                className='bg-blue-600 text-white px-4 py-2 md:px-6 md:py-3 rounded-lg hover:bg-blue-700 transition-colors text-sm md:text-base'
              >
                Clear All Filters
              </button>
            ) : (
              <button
                onClick={() => router.push('/Pharmacist/patients/new')}
                className='bg-blue-600 text-white px-4 py-2 md:px-6 md:py-3 rounded-lg hover:bg-blue-700 transition-colors text-sm md:text-base'
              >
                Add New Patient
              </button>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && selectedPatient && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'
            onClick={() => {
              setShowDeleteModal(false);
              setSelectedPatient(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className='bg-white rounded-lg p-4 md:p-6 max-w-md w-full'
            >
              <div className='flex items-center gap-3 mb-4'>
                <div className='w-8 h-8 md:w-10 md:h-10 bg-red-100 rounded-full flex items-center justify-center'>
                  <FiAlertCircle className='w-4 h-4 md:w-5 md:h-5 text-red-600' />
                </div>
                <h3 className='text-base md:text-lg font-semibold text-gray-900'>
                  Delete Patient
                </h3>
              </div>

              <p className='text-gray-600 mb-4 md:mb-6 text-sm md:text-base'>
                Are you sure you want to delete{' '}
                <strong>
                  {selectedPatient.userId.firstName}{' '}
                  {selectedPatient.userId.lastName}
                </strong>
                ? This action cannot be undone and all associated medical
                records will be permanently removed.
              </p>

              <div className='flex gap-2 md:gap-3 justify-end'>
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedPatient(null);
                  }}
                  className='px-3 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm md:text-base'
                  disabled={deleting}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(selectedPatient._id)}
                  disabled={deleting}
                  className='px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors text-sm md:text-base'
                >
                  {deleting ? 'Deleting...' : 'Delete Patient'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

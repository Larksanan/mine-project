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
  FiMapPin,
  FiPhone,
  FiMail,
  FiClock,
  FiAlertCircle,
  FiRefreshCw,
  FiPackage,
  FiTrendingUp,
  FiEye,
} from 'react-icons/fi';
import Loading from '@/components/Loading';
import ErrorComponent from '@/components/Error';

interface Pharmacy {
  _id: string;
  id: string;
  name?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  contact?: {
    phone?: string;
    email?: string;
    emergencyPhone?: string;
  };
  operatingHours?: {
    Monday?: string;
    Tuesday?: string;
    Wednesday?: string;
    Thursday?: string;
    Friday?: string;
    Saturday?: string;
    Sunday?: string;
  };
  services?: string[];
  pharmacists?: Array<{
    _id: string;
    name: string;
    licenseNumber: string;
  }>;
  inventory?: {
    totalProducts?: number;
    lowStockItems?: number;
    outOfStockItems?: number;
  };
  status?: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
  is24Hours?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export default function PharmaciesPage() {
  const router = useRouter();
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedPharmacy, setSelectedPharmacy] = useState<Pharmacy | null>(
    null
  );
  const [deleting, setDeleting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterService, setFilterService] = useState('all');

  useEffect(() => {
    fetchPharmacies();
  }, []);

  const fetchPharmacies = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/pharmacy');

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch pharmacies');
      }

      const data = await response.json();
      setPharmacies(data.data?.pharmacies || data.pharmacies || []);
    } catch (err) {
      console.error('Error fetching pharmacies:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to load pharmacies'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchPharmacies();
  };

  const handleDelete = async (pharmacyId: string) => {
    try {
      setDeleting(true);
      const response = await fetch(`/api/pharmacy/${pharmacyId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete pharmacy');
      }

      setPharmacies(prev =>
        prev.filter(pharmacy => pharmacy._id !== pharmacyId)
      );
      setShowDeleteModal(false);
      setSelectedPharmacy(null);
    } catch (err) {
      console.error('Error deleting pharmacy:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to delete pharmacy'
      );
    } finally {
      setDeleting(false);
    }
  };

  // Safe data access functions
  const getPharmacyName = (pharmacy: Pharmacy) => {
    return pharmacy?.name || 'Unnamed Pharmacy';
  };

  const getPharmacyCity = (pharmacy: Pharmacy) => {
    return pharmacy?.address?.city || 'Unknown City';
  };

  const getPharmacyState = (pharmacy: Pharmacy) => {
    return pharmacy?.address?.state || '';
  };

  const getPharmacyPhone = (pharmacy: Pharmacy) => {
    return pharmacy?.contact?.phone || 'No phone';
  };

  const getPharmacyEmail = (pharmacy: Pharmacy) => {
    return pharmacy?.contact?.email || 'No email';
  };

  const getPharmacyAddress = (pharmacy: Pharmacy) => {
    if (!pharmacy?.address) return 'Address not available';
    const { street, city } = pharmacy.address;
    return `${street || ''}, ${city || ''}`.trim();
  };

  const getPharmacyServices = (pharmacy: Pharmacy) => {
    return pharmacy?.services || [];
  };

  const getPharmacyStatus = (pharmacy: Pharmacy) => {
    return pharmacy?.status || 'UNKNOWN';
  };

  const getPharmacyInventory = (pharmacy: Pharmacy) => {
    return (
      pharmacy?.inventory || {
        totalProducts: 0,
        lowStockItems: 0,
        outOfStockItems: 0,
      }
    );
  };

  const getPharmacyIs24Hours = (pharmacy: Pharmacy) => {
    return pharmacy?.is24Hours || false;
  };

  // Filter pharmacies based on search and filters
  const filteredPharmacies = pharmacies.filter(pharmacy => {
    const matchesSearch =
      getPharmacyName(pharmacy)
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      getPharmacyCity(pharmacy)
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      getPharmacyPhone(pharmacy).includes(searchTerm);

    const matchesStatus =
      filterStatus === 'all' || getPharmacyStatus(pharmacy) === filterStatus;

    const matchesService =
      filterService === 'all' ||
      (filterService && getPharmacyServices(pharmacy).includes(filterService));

    return matchesSearch && matchesStatus && matchesService;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'INACTIVE':
        return 'bg-red-100 text-red-800';
      case 'MAINTENANCE':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'Active';
      case 'INACTIVE':
        return 'Inactive';
      case 'MAINTENANCE':
        return 'Maintenance';
      default:
        return 'Unknown';
    }
  };

  // Calculate statistics
  const totalPharmacies = pharmacies.length;
  const activePharmacies = pharmacies.filter(
    p => getPharmacyStatus(p) === 'ACTIVE'
  ).length;
  const totalProducts = pharmacies.reduce(
    (sum, p) => sum + (getPharmacyInventory(p).totalProducts || 0),
    0
  );
  const lowStockItems = pharmacies.reduce(
    (sum, p) => sum + (getPharmacyInventory(p).lowStockItems || 0),
    0
  );

  // Get unique services for filter
  const allServices = Array.from(
    new Set(pharmacies.flatMap(p => getPharmacyServices(p)))
  );

  if (loading) return <Loading />;
  if (error) return <ErrorComponent message={error} />;

  return (
    <div className='min-h-screen bg-gray-50 p-6'>
      <div className='max-w-7xl mx-auto'>
        {/* Header */}
        <div className='mb-8'>
          <div className='flex justify-between items-center'>
            <div>
              <h1 className='text-3xl font-bold text-gray-900'>
                Pharmacies Management
              </h1>
              <p className='text-gray-600 mt-2'>
                Manage pharmacy locations, inventory, and operations
              </p>
            </div>
            <div className='flex gap-3'>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className='flex items-center gap-2 px-4 py-3 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors'
              >
                <FiRefreshCw
                  className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`}
                />
                Refresh
              </button>
              <button
                onClick={() => router.push('/pharmacist/pharmacies/new')}
                className='flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors'
              >
                <FiPlus className='w-5 h-5' />
                Add Pharmacy
              </button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
          <div className='bg-white rounded-lg p-6 shadow-sm border border-gray-200'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-600'>
                  Total Pharmacies
                </p>
                <p className='text-3xl font-bold text-gray-900 mt-2'>
                  {totalPharmacies}
                </p>
              </div>
              <div className='w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center'>
                <FiPackage className='w-6 h-6 text-blue-600' />
              </div>
            </div>
          </div>

          <div className='bg-white rounded-lg p-6 shadow-sm border border-gray-200'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-600'>
                  Active Pharmacies
                </p>
                <p className='text-3xl font-bold text-gray-900 mt-2'>
                  {activePharmacies}
                </p>
              </div>
              <div className='w-12 h-12 bg-green-100 rounded-full flex items-center justify-center'>
                <FiTrendingUp className='w-6 h-6 text-green-600' />
              </div>
            </div>
          </div>

          <div className='bg-white rounded-lg p-6 shadow-sm border border-gray-200'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-600'>
                  Total Products
                </p>
                <p className='text-3xl font-bold text-gray-900 mt-2'>
                  {totalProducts.toLocaleString()}
                </p>
              </div>
              <div className='w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center'>
                <FiPackage className='w-6 h-6 text-purple-600' />
              </div>
            </div>
          </div>

          <div className='bg-white rounded-lg p-6 shadow-sm border border-gray-200'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-600'>
                  Low Stock Items
                </p>
                <p className='text-3xl font-bold text-gray-900 mt-2'>
                  {lowStockItems}
                </p>
              </div>
              <div className='w-12 h-12 bg-red-100 rounded-full flex items-center justify-center'>
                <FiAlertCircle className='w-6 h-6 text-red-600' />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6'>
          <div className='flex flex-col lg:flex-row gap-4'>
            {/* Search */}
            <div className='flex-1 relative'>
              <FiSearch className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5' />
              <input
                type='text'
                placeholder='Search pharmacies by name, city, or phone...'
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className='w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
              />
            </div>

            {/* Filters */}
            <div className='flex gap-2'>
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className='px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
              >
                <option value='all'>All Status</option>
                <option value='ACTIVE'>Active</option>
                <option value='INACTIVE'>Inactive</option>
                <option value='MAINTENANCE'>Maintenance</option>
              </select>

              <select
                value={filterService}
                onChange={e => setFilterService(e.target.value)}
                className='px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
              >
                <option value='all'>All Services</option>
                {allServices.map(service => (
                  <option key={service} value={service}>
                    {service}
                  </option>
                ))}
              </select>

              <button className='flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors'>
                <FiFilter className='w-5 h-5' />
                More Filters
              </button>
            </div>
          </div>
        </div>

        {/* Pharmacies Grid */}
        <div className='grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6'>
          <AnimatePresence>
            {filteredPharmacies.map((pharmacy, index) => (
              <motion.div
                key={pharmacy._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className='bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow'
              >
                {/* Pharmacy Card Header */}
                <div className='p-6 border-b border-gray-200'>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-3'>
                      <div className='w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center'>
                        <FiPackage className='w-6 h-6 text-blue-600' />
                      </div>
                      <div>
                        <h3 className='font-semibold text-gray-900'>
                          {getPharmacyName(pharmacy)}
                        </h3>
                        <p className='text-sm text-gray-500'>
                          {getPharmacyCity(pharmacy)}
                          {getPharmacyState(pharmacy)
                            ? `, ${getPharmacyState(pharmacy)}`
                            : ''}
                        </p>
                      </div>
                    </div>
                    <div className='flex gap-1'>
                      <button
                        onClick={() =>
                          router.push(`/pharmacist/pharmacies/${pharmacy._id}`)
                        }
                        className='p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors'
                        title='View Details'
                      >
                        <FiEye className='w-4 h-4' />
                      </button>
                      <button
                        onClick={() =>
                          router.push(
                            `/pharmacist/pharmacies/${pharmacy._id}/edit`
                          )
                        }
                        className='p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors'
                        title='Edit Pharmacy'
                      >
                        <FiEdit className='w-4 h-4' />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedPharmacy(pharmacy);
                          setShowDeleteModal(true);
                        }}
                        className='p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors'
                        title='Delete Pharmacy'
                      >
                        <FiTrash2 className='w-4 h-4' />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Pharmacy Details */}
                <div className='p-6'>
                  <div className='space-y-3 mb-4'>
                    <div className='flex items-center gap-3 text-sm'>
                      <FiMapPin className='w-4 h-4 text-gray-400' />
                      <span className='text-gray-600'>
                        {getPharmacyAddress(pharmacy)}
                      </span>
                    </div>
                    <div className='flex items-center gap-3 text-sm'>
                      <FiPhone className='w-4 h-4 text-gray-400' />
                      <span className='text-gray-600'>
                        {getPharmacyPhone(pharmacy)}
                      </span>
                    </div>
                    <div className='flex items-center gap-3 text-sm'>
                      <FiMail className='w-4 h-4 text-gray-400' />
                      <span className='text-gray-600'>
                        {getPharmacyEmail(pharmacy)}
                      </span>
                    </div>
                    <div className='flex items-center gap-3 text-sm'>
                      <FiClock className='w-4 h-4 text-gray-400' />
                      <span className='text-gray-600'>
                        {getPharmacyIs24Hours(pharmacy)
                          ? '24/7'
                          : 'Standard Hours'}
                      </span>
                    </div>
                  </div>

                  {/* Services */}
                  <div className='mb-4'>
                    <p className='text-xs font-medium text-gray-500 mb-2'>
                      Services
                    </p>
                    <div className='flex flex-wrap gap-1'>
                      {getPharmacyServices(pharmacy)
                        .slice(0, 3)
                        .map((service, idx) => (
                          <span
                            key={idx}
                            className='px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full'
                          >
                            {service}
                          </span>
                        ))}
                      {getPharmacyServices(pharmacy).length > 3 && (
                        <span className='px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full'>
                          +{getPharmacyServices(pharmacy).length - 3} more
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Inventory Stats */}
                  <div className='grid grid-cols-3 gap-2 mb-4'>
                    <div className='text-center'>
                      <p className='text-lg font-bold text-gray-900'>
                        {getPharmacyInventory(pharmacy).totalProducts || 0}
                      </p>
                      <p className='text-xs text-gray-500'>Products</p>
                    </div>
                    <div className='text-center'>
                      <p className='text-lg font-bold text-yellow-600'>
                        {getPharmacyInventory(pharmacy).lowStockItems || 0}
                      </p>
                      <p className='text-xs text-gray-500'>Low Stock</p>
                    </div>
                    <div className='text-center'>
                      <p className='text-lg font-bold text-red-600'>
                        {getPharmacyInventory(pharmacy).outOfStockItems || 0}
                      </p>
                      <p className='text-xs text-gray-500'>Out of Stock</p>
                    </div>
                  </div>

                  {/* Status & Actions */}
                  <div className='flex justify-between items-center'>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(getPharmacyStatus(pharmacy))}`}
                    >
                      {getStatusText(getPharmacyStatus(pharmacy))}
                    </span>
                    <button
                      onClick={() =>
                        router.push(`/pharmacist/pharmacies/${pharmacy._id}`)
                      }
                      className='text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors'
                    >
                      View Details →
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Empty State */}
        {filteredPharmacies.length === 0 && (
          <div className='text-center py-12'>
            <div className='w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4'>
              <FiPackage className='w-12 h-12 text-gray-400' />
            </div>
            <h3 className='text-lg font-semibold text-gray-900 mb-2'>
              {searchTerm || filterStatus !== 'all' || filterService !== 'all'
                ? 'No pharmacies match your criteria'
                : 'No pharmacies found'}
            </h3>
            <p className='text-gray-600 mb-6'>
              {searchTerm || filterStatus !== 'all' || filterService !== 'all'
                ? 'Try adjusting your search or filters.'
                : 'Get started by adding your first pharmacy.'}
            </p>
            {searchTerm || filterStatus !== 'all' || filterService !== 'all' ? (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterStatus('all');
                  setFilterService('all');
                }}
                className='bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors'
              >
                Clear Filters
              </button>
            ) : (
              <button
                onClick={() => router.push('/pharmacist/pharmacies/new')}
                className='bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors'
              >
                Add New Pharmacy
              </button>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && selectedPharmacy && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className='bg-white rounded-lg p-6 max-w-md w-full'
            >
              <div className='flex items-center gap-3 mb-4'>
                <div className='w-10 h-10 bg-red-100 rounded-full flex items-center justify-center'>
                  <FiAlertCircle className='w-5 h-5 text-red-600' />
                </div>
                <h3 className='text-lg font-semibold text-gray-900'>
                  Delete Pharmacy
                </h3>
              </div>

              <p className='text-gray-600 mb-6'>
                Are you sure you want to delete{' '}
                <strong>{getPharmacyName(selectedPharmacy)}</strong>? This
                action cannot be undone and all associated inventory and staff
                records will be permanently removed.
              </p>

              <div className='flex gap-3 justify-end'>
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedPharmacy(null);
                  }}
                  className='px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors'
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(selectedPharmacy._id)}
                  disabled={deleting}
                  className='px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors'
                >
                  {deleting ? 'Deleting...' : 'Delete Pharmacy'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

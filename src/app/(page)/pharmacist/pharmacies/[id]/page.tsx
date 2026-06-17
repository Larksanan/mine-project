/* eslint-disable react-hooks/exhaustive-deps */
'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  FiArrowLeft,
  FiEdit,
  FiMapPin,
  FiPhone,
  FiMail,
  FiClock,
  FiPackage,
  FiUser,
  FiAlertCircle,
  FiTrendingUp,
  FiShoppingCart,
  FiStar,
  FiCalendar,
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
  description?: string;
  website?: string;
  createdAt?: string;
  updatedAt?: string;
}

export default function PharmacyDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const pharmacyId = params.id as string;

  const [pharmacy, setPharmacy] = useState<Pharmacy | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (pharmacyId) {
      fetchPharmacy();
    }
  }, [pharmacyId]);

  const fetchPharmacy = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/pharmacy/${pharmacyId}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch pharmacy');
      }

      const data = await response.json();
      setPharmacy(data.data || data.pharmacy);
    } catch (err) {
      console.error('Error fetching pharmacy:', err);
      setError(err instanceof Error ? err.message : 'Failed to load pharmacy');
    } finally {
      setLoading(false);
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
    const { street, city, state, zipCode } = pharmacy.address;
    return `${street || ''}, ${city || ''}, ${state || ''} ${zipCode || ''}`.trim();
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

  const getPharmacyPharmacists = (pharmacy: Pharmacy) => {
    return pharmacy?.pharmacists || [];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'INACTIVE':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'MAINTENANCE':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
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

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) return <Loading />;
  if (error) return <ErrorComponent message={error} />;
  if (!pharmacy) return <ErrorComponent message='Pharmacy not found' />;

  const inventory = getPharmacyInventory(pharmacy);
  const pharmacists = getPharmacyPharmacists(pharmacy);

  return (
    <div className='min-h-screen bg-gray-50 py-8'>
      <div className='max-w-6xl mx-auto px-6'>
        {/* Header */}
        <div className='mb-8'>
          <button
            onClick={() => router.push('/pharmacist/pharmacies')}
            className='flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors'
          >
            <FiArrowLeft className='w-5 h-5' />
            Back to Pharmacies
          </button>

          <div className='flex justify-between items-start'>
            <div>
              <div className='flex items-center gap-4 mb-4'>
                <div className='w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center'>
                  <FiPackage className='w-8 h-8 text-blue-600' />
                </div>
                <div>
                  <h1 className='text-3xl font-bold text-gray-900'>
                    {getPharmacyName(pharmacy)}
                  </h1>
                  <p className='text-gray-600 mt-1'>
                    {getPharmacyCity(pharmacy)}
                    {getPharmacyState(pharmacy) &&
                      `, ${getPharmacyState(pharmacy)}`}
                  </p>
                </div>
              </div>

              <div className='flex items-center gap-3'>
                <span
                  className={`px-3 py-1 text-sm font-medium rounded-full border ${getStatusColor(getPharmacyStatus(pharmacy))}`}
                >
                  {getStatusText(getPharmacyStatus(pharmacy))}
                </span>
                {getPharmacyIs24Hours(pharmacy) && (
                  <span className='px-3 py-1 bg-purple-100 text-purple-800 text-sm font-medium rounded-full border border-purple-200'>
                    24/7
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={() =>
                router.push(`/pharmacist/pharmacies/${pharmacyId}/edit`)
              }
              className='flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors'
            >
              <FiEdit className='w-5 h-5' />
              Edit Pharmacy
            </button>
          </div>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
          {/* Main Content */}
          <div className='lg:col-span-2 space-y-6'>
            {/* Overview Cards */}
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              <div className='bg-white rounded-lg p-6 shadow-sm border border-gray-200'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm font-medium text-gray-600'>
                      Total Products
                    </p>
                    <p className='text-2xl font-bold text-gray-900 mt-1'>
                      {inventory.totalProducts?.toLocaleString() || 0}
                    </p>
                  </div>
                  <div className='w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center'>
                    <FiPackage className='w-5 h-5 text-blue-600' />
                  </div>
                </div>
              </div>

              <div className='bg-white rounded-lg p-6 shadow-sm border border-gray-200'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm font-medium text-gray-600'>
                      Low Stock
                    </p>
                    <p className='text-2xl font-bold text-yellow-600 mt-1'>
                      {inventory.lowStockItems || 0}
                    </p>
                  </div>
                  <div className='w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center'>
                    <FiAlertCircle className='w-5 h-5 text-yellow-600' />
                  </div>
                </div>
              </div>

              <div className='bg-white rounded-lg p-6 shadow-sm border border-gray-200'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm font-medium text-gray-600'>
                      Out of Stock
                    </p>
                    <p className='text-2xl font-bold text-red-600 mt-1'>
                      {inventory.outOfStockItems || 0}
                    </p>
                  </div>
                  <div className='w-10 h-10 bg-red-100 rounded-full flex items-center justify-center'>
                    <FiShoppingCart className='w-5 h-5 text-red-600' />
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
              <h2 className='text-xl font-semibold text-gray-900 mb-6'>
                Contact Information
              </h2>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div className='space-y-4'>
                  <div className='flex items-center gap-3'>
                    <div className='w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center'>
                      <FiMapPin className='w-5 h-5 text-blue-600' />
                    </div>
                    <div>
                      <p className='text-sm font-medium text-gray-500'>
                        Address
                      </p>
                      <p className='text-gray-900'>
                        {getPharmacyAddress(pharmacy)}
                      </p>
                    </div>
                  </div>

                  <div className='flex items-center gap-3'>
                    <div className='w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center'>
                      <FiPhone className='w-5 h-5 text-green-600' />
                    </div>
                    <div>
                      <p className='text-sm font-medium text-gray-500'>Phone</p>
                      <p className='text-gray-900'>
                        {getPharmacyPhone(pharmacy)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className='space-y-4'>
                  <div className='flex items-center gap-3'>
                    <div className='w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center'>
                      <FiMail className='w-5 h-5 text-purple-600' />
                    </div>
                    <div>
                      <p className='text-sm font-medium text-gray-500'>Email</p>
                      <p className='text-gray-900'>
                        {getPharmacyEmail(pharmacy)}
                      </p>
                    </div>
                  </div>

                  {pharmacy.contact?.emergencyPhone && (
                    <div className='flex items-center gap-3'>
                      <div className='w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center'>
                        <FiAlertCircle className='w-5 h-5 text-red-600' />
                      </div>
                      <div>
                        <p className='text-sm font-medium text-gray-500'>
                          Emergency Phone
                        </p>
                        <p className='text-gray-900'>
                          {pharmacy.contact.emergencyPhone}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {pharmacy.website && (
                <div className='mt-6 pt-6 border-t border-gray-200'>
                  <div className='flex items-center gap-3'>
                    <div className='w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center'>
                      <FiTrendingUp className='w-5 h-5 text-indigo-600' />
                    </div>
                    <div>
                      <p className='text-sm font-medium text-gray-500'>
                        Website
                      </p>
                      <a
                        href={pharmacy.website}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='text-blue-600 hover:text-blue-700 hover:underline'
                      >
                        {pharmacy.website}
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Operating Hours */}
            <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
              <h2 className='text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2'>
                <FiClock className='w-5 h-5 text-orange-600' />
                Operating Hours
              </h2>

              {getPharmacyIs24Hours(pharmacy) ? (
                <div className='text-center py-8'>
                  <div className='w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                    <FiClock className='w-8 h-8 text-green-600' />
                  </div>
                  <h3 className='text-lg font-semibold text-gray-900'>
                    Open 24/7
                  </h3>
                  <p className='text-gray-600'>
                    This pharmacy operates 24 hours a day, 7 days a week
                  </p>
                </div>
              ) : (
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  {pharmacy.operatingHours &&
                    Object.entries(pharmacy.operatingHours).map(
                      ([day, hours]) => (
                        <div
                          key={day}
                          className='flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0'
                        >
                          <span className='font-medium text-gray-700 capitalize'>
                            {day}
                          </span>
                          <span
                            className={`${hours === 'Closed' ? 'text-red-600' : 'text-gray-600'}`}
                          >
                            {hours}
                          </span>
                        </div>
                      )
                    )}
                </div>
              )}
            </div>

            {/* Services */}
            {getPharmacyServices(pharmacy).length > 0 && (
              <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
                <h2 className='text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2'>
                  <FiStar className='w-5 h-5 text-yellow-600' />
                  Services Offered
                </h2>

                <div className='flex flex-wrap gap-2'>
                  {getPharmacyServices(pharmacy).map((service, index) => (
                    <span
                      key={index}
                      className='px-3 py-2 bg-blue-100 text-blue-800 text-sm font-medium rounded-lg'
                    >
                      {service}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            {pharmacy.description && (
              <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
                <h2 className='text-xl font-semibold text-gray-900 mb-4'>
                  Description
                </h2>
                <p className='text-gray-700 leading-relaxed'>
                  {pharmacy.description}
                </p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className='space-y-6'>
            {/* Pharmacists */}
            {pharmacists.length > 0 && (
              <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
                <h2 className='text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2'>
                  <FiUser className='w-5 h-5 text-green-600' />
                  Pharmacists
                </h2>

                <div className='space-y-3'>
                  {pharmacists.map((pharmacist, index) => (
                    <div
                      key={pharmacist._id || index}
                      className='p-3 bg-gray-50 rounded-lg'
                    >
                      <p className='font-medium text-gray-900'>
                        {pharmacist.name}
                      </p>
                      <p className='text-sm text-gray-600'>
                        License: {pharmacist.licenseNumber}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pharmacy Information */}
            <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
              <h2 className='text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2'>
                <FiCalendar className='w-5 h-5 text-gray-600' />
                Pharmacy Information
              </h2>

              <div className='space-y-3'>
                <div className='flex justify-between'>
                  <span className='text-sm text-gray-500'>Created</span>
                  <span className='text-sm font-medium text-gray-900'>
                    {formatDate(pharmacy.createdAt)}
                  </span>
                </div>

                <div className='flex justify-between'>
                  <span className='text-sm text-gray-500'>Last Updated</span>
                  <span className='text-sm font-medium text-gray-900'>
                    {formatDate(pharmacy.updatedAt)}
                  </span>
                </div>

                <div className='flex justify-between'>
                  <span className='text-sm text-gray-500'>Pharmacy ID</span>
                  <span className='text-sm font-medium text-gray-900 font-mono'>
                    {pharmacyId.slice(-8)}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className='bg-blue-50 border border-blue-200 rounded-lg p-6'>
              <h3 className='font-semibold text-blue-900 mb-3'>
                Quick Actions
              </h3>

              <div className='space-y-2'>
                <button
                  onClick={() =>
                    router.push(`/pharmacist/pharmacies/${pharmacyId}/edit`)
                  }
                  className='w-full text-blue-700 bg-white border border-blue-300 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium'
                >
                  Edit Pharmacy Details
                </button>

                <button
                  onClick={() =>
                    router.push(`/pharmacist/inventory?pharmacy=${pharmacyId}`)
                  }
                  className='w-full text-blue-700 bg-white border border-blue-300 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium'
                >
                  Manage Inventory
                </button>

                <button
                  onClick={() =>
                    router.push(`/pharmacist/orders?pharmacy=${pharmacyId}`)
                  }
                  className='w-full text-blue-700 bg-white border border-blue-300 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium'
                >
                  View Orders
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

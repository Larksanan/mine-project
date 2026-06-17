'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Loading from '@/components/Loading';
import Link from 'next/link';
import ErrorComponent from '@/components/Error';
import Image from 'next/image';
import {
  FiUser,
  FiMail,
  FiPhone,
  FiEdit,
  FiTrash2,
  FiArrowLeft,
  FiCheckCircle,
  FiXCircle,
  FiAlertCircle,
  FiShield,
  FiActivity,
  FiFileText,
  FiSettings,
  FiRefreshCw,
} from 'react-icons/fi';

interface User {
  _id: string;
  name?: string;
  email?: string;
  phone?: string;
  image?: string;
  role?: string;
  status?: string;
  isEmailVerified?: boolean;
  createdAt?: string;
  updatedAt?: string;
  lastLogin?: string;
  createdAtFormatted?: string;
  updatedAtFormatted?: string;
  lastLoginFormatted?: string;
  relatedData?: {
    profile?: boolean;
    totalAppointments?: number;
    totalPatients?: number;
    currentAppointments?: number;
  };
}

export default function UserDetailPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params?.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const fetchUser = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/admin/users/${userId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch user');
      }

      setUser(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchUser();
    }
  }, [userId, fetchUser]);

  const handleDelete = async () => {
    try {
      setActionLoading(true);
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete user');
      }

      router.push('/admin/users');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusUpdate = async (action: string) => {
    try {
      setActionLoading(true);
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update user');
      }

      fetchUser();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update user');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <Loading />;
  }

  if (error || !user) {
    return <ErrorComponent message={error || 'User not found'} />;
  }

  const getRoleBadgeColor = (role?: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-100 text-purple-800';
      case 'DOCTOR':
        return 'bg-blue-100 text-blue-800';
      case 'PATIENT':
        return 'bg-green-100 text-green-800';
      case 'NURSE':
        return 'bg-pink-100 text-pink-800';
      case 'RECEPTIONIST':
        return 'bg-yellow-100 text-yellow-800';
      case 'PHARMACIST':
        return 'bg-indigo-100 text-indigo-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusBadgeColor = (status?: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'INACTIVE':
        return 'bg-gray-100 text-gray-800';
      case 'SUSPENDED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className='min-h-screen bg-gray-50 p-6'>
      <div className='max-w-7xl mx-auto'>
        {/* Header */}
        <div className='mb-6'>
          <Link href='/admin/users'>
            <button className='flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4'>
              <FiArrowLeft className='w-5 h-5' />
              Back to Users
            </button>
          </Link>

          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-3xl font-bold text-gray-900 flex items-center gap-2'>
                <FiUser className='w-8 h-8' />
                User Details
              </h1>
              <p className='text-gray-600 mt-1'>
                View and manage user information
              </p>
            </div>
            <div className='flex items-center gap-3'>
              <Link href={`/admin/users/${userId}/edit`}>
                <button className='flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition'>
                  <FiEdit className='w-5 h-5' />
                  Edit User
                </button>
              </Link>
              <button
                onClick={() => setShowDeleteModal(true)}
                className='flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition'
              >
                <FiTrash2 className='w-5 h-5' />
                Delete
              </button>
            </div>
          </div>
        </div>

        {/* User Profile Card */}
        <div className='bg-white rounded-lg shadow mb-6'>
          <div className='p-6 border-b'>
            <div className='flex items-start gap-6'>
              <div className='shrink-0'>
                {user.image ? (
                  <Image
                    className='h-24 w-24 rounded-full object-cover'
                    src={user.image}
                    alt={user.name || 'User'}
                    width={96}
                    height={96}
                  />
                ) : (
                  <div className='h-24 w-24 rounded-full bg-gray-300 flex items-center justify-center'>
                    <span className='text-3xl text-gray-600 font-medium'>
                      {user.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>

              <div className='flex-1'>
                <div className='flex items-center gap-3 mb-2'>
                  <h2 className='text-2xl font-bold text-gray-900'>
                    {user.name}
                  </h2>
                  <span
                    className={`px-3 py-1 text-sm font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}
                  >
                    {user.role}
                  </span>
                  <span
                    className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusBadgeColor(user.status)}`}
                  >
                    {user.status}
                  </span>
                </div>

                <div className='flex items-center gap-2 text-gray-600 mb-4'>
                  <FiMail className='w-4 h-4' />
                  <span>{user.email}</span>
                  {user.isEmailVerified ? (
                    <FiCheckCircle className='w-4 h-4 text-green-600' />
                  ) : (
                    <FiXCircle className='w-4 h-4 text-gray-400' />
                  )}
                </div>

                {user.phone && (
                  <div className='flex items-center gap-2 text-gray-600 mb-4'>
                    <FiPhone className='w-4 h-4' />
                    <span>{user.phone}</span>
                  </div>
                )}

                <div className='text-sm text-gray-500'>
                  <p>User ID: {user._id}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className='p-6 bg-gray-50'>
            <h3 className='text-sm font-semibold text-gray-700 mb-3'>
              Quick Actions
            </h3>
            <div className='flex flex-wrap gap-2'>
              {user.status === 'ACTIVE' ? (
                <>
                  <button
                    onClick={() => handleStatusUpdate('suspend')}
                    disabled={actionLoading}
                    className='px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition disabled:opacity-50'
                  >
                    Suspend User
                  </button>
                  <button
                    onClick={() => handleStatusUpdate('deactivate')}
                    disabled={actionLoading}
                    className='px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition disabled:opacity-50'
                  >
                    Deactivate
                  </button>
                </>
              ) : user.status === 'SUSPENDED' ? (
                <button
                  onClick={() => handleStatusUpdate('activate')}
                  disabled={actionLoading}
                  className='px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50'
                >
                  Activate User
                </button>
              ) : (
                <button
                  onClick={() => handleStatusUpdate('activate')}
                  disabled={actionLoading}
                  className='px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50'
                >
                  Activate User
                </button>
              )}

              {!user.isEmailVerified && (
                <button
                  onClick={() => handleStatusUpdate('verify-email')}
                  disabled={actionLoading}
                  className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50'
                >
                  Verify Email
                </button>
              )}
            </div>
          </div>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
          {/* Account Information */}
          <div className='bg-white rounded-lg shadow p-6'>
            <h3 className='text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2'>
              <FiShield className='w-5 h-5' />
              Account Information
            </h3>
            <div className='space-y-4'>
              <div>
                <label className='text-sm font-medium text-gray-500'>
                  User ID
                </label>
                <p className='text-gray-900'>{user._id}</p>
              </div>

              <div>
                <label className='text-sm font-medium text-gray-500'>
                  Role
                </label>
                <p className='text-gray-900'>{user.role}</p>
              </div>

              <div>
                <label className='text-sm font-medium text-gray-500'>
                  Status
                </label>
                <p className='text-gray-900'>{user.status}</p>
              </div>

              <div>
                <label className='text-sm font-medium text-gray-500'>
                  Email Verified
                </label>
                <p className='text-gray-900'>
                  {user.isEmailVerified ? 'Yes' : 'No'}
                </p>
              </div>
            </div>
          </div>

          {/* Activity Information */}
          <div className='bg-white rounded-lg shadow p-6'>
            <h3 className='text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2'>
              <FiActivity className='w-5 h-5' />
              Activity Information
            </h3>
            <div className='space-y-4'>
              <div>
                <label className='text-sm font-medium text-gray-500'>
                  Created At
                </label>
                <p className='text-gray-900'>
                  {user.createdAtFormatted
                    ? new Date(user.createdAtFormatted).toLocaleString()
                    : 'N/A'}
                </p>
              </div>

              <div>
                <label className='text-sm font-medium text-gray-500'>
                  Last Updated
                </label>
                <p className='text-gray-900'>
                  {user.updatedAtFormatted
                    ? new Date(user.updatedAtFormatted).toLocaleString()
                    : 'N/A'}
                </p>
              </div>

              <div>
                <label className='text-sm font-medium text-gray-500'>
                  Last Login
                </label>
                <p className='text-gray-900'>
                  {user.lastLoginFormatted
                    ? new Date(user.lastLoginFormatted).toLocaleString()
                    : 'Never'}
                </p>
              </div>
            </div>
          </div>

          {/* Role-Specific Information */}
          {user.relatedData?.profile && (
            <div className='bg-white rounded-lg shadow p-6 lg:col-span-2'>
              <h3 className='text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2'>
                <FiFileText className='w-5 h-5' />
                {user.role} Profile
              </h3>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                {user.relatedData.totalAppointments !== undefined && (
                  <div className='p-4 bg-blue-50 rounded-lg'>
                    <p className='text-sm text-gray-600'>Total Appointments</p>
                    <p className='text-2xl font-bold text-blue-600'>
                      {user.relatedData.totalAppointments}
                    </p>
                  </div>
                )}

                {user.relatedData.totalPatients !== undefined && (
                  <div className='p-4 bg-green-50 rounded-lg'>
                    <p className='text-sm text-gray-600'>Total Patients</p>
                    <p className='text-2xl font-bold text-green-600'>
                      {user.relatedData.totalPatients}
                    </p>
                  </div>
                )}

                {user.relatedData.currentAppointments !== undefined && (
                  <div className='p-4 bg-purple-50 rounded-lg'>
                    <p className='text-sm text-gray-600'>
                      Current Appointments
                    </p>
                    <p className='text-2xl font-bold text-purple-600'>
                      {user.relatedData.currentAppointments}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Additional Actions */}
        <div className='mt-6 bg-white rounded-lg shadow p-6'>
          <h3 className='text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2'>
            <FiSettings className='w-5 h-5' />
            Additional Actions
          </h3>
          <div className='flex flex-wrap gap-3'>
            <Link href={`/admin/users/${userId}/stats`}>
              <button className='px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition'>
                View Statistics
              </button>
            </Link>
            <button
              onClick={fetchUser}
              disabled={loading}
              className='px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 flex items-center gap-2'
            >
              <FiRefreshCw
                className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
              />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <div className='bg-white rounded-lg p-6 max-w-md w-full mx-4'>
            <div className='flex items-center gap-3 mb-4'>
              <FiAlertCircle className='w-6 h-6 text-red-600' />
              <h3 className='text-lg font-semibold'>Confirm Deletion</h3>
            </div>
            <p className='text-gray-600 mb-6'>
              Are you sure you want to delete this user? This action cannot be
              undone and will remove all associated data.
            </p>
            <div className='flex gap-3 justify-end'>
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={actionLoading}
                className='px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50'
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={actionLoading}
                className='px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2'
              >
                {actionLoading && (
                  <FiRefreshCw className='w-4 h-4 animate-spin' />
                )}
                Delete User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { useState, useEffect, useCallback } from 'react';
// import { useRouter } from 'next/navigation'; // Unused import removed
import Loading from '@/components/Loading';
import Link from 'next/link';
import ErrorComponent from '@/components/Error';
import Image from 'next/image';
import {
  FiUsers,
  FiSearch,
  FiFilter,
  FiDownload,
  FiPlus,
  FiEdit,
  FiTrash2,
  FiEye,
  FiCheckCircle,
  FiXCircle,
  FiAlertCircle,
  FiRefreshCw,
  FiUserCheck,
  FiMail,
  FiPhone,
} from 'react-icons/fi';
import { FaIdCard } from 'react-icons/fa';

interface User {
  _id: string;
  name?: string;
  email?: string;
  phone?: string;
  image?: string;
  role?: string;
  nic?: string;
  status?: string;
  isEmailVerified?: boolean;
  createdAt?: string;
  updatedAt?: string;
  lastLogin?: string;
  createdAtFormatted?: string;
  lastLoginFormatted?: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface Statistics {
  total: number;
  active: number;
  inactive: number;
  suspended: number;
  verified: number;
  unverified: number;
  roles: Record<string, number>;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [statistics, setStatistics] = useState<Statistics | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [verifiedFilter, setVerifiedFilter] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [showFilters, setShowFilters] = useState(false);
  const [sortOrder, setSortOrder] = useState('ASC'); // Define sortOrder with an initial value

  // Example usage of setSortOrder
  const toggleSortOrder = () => {
    setSortOrder(prev => (prev === 'ASC' ? 'DESC' : 'ASC'));
  };

  // UI States
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch users
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        sortBy,
        sortOrder, // This line remains unchanged as sortOrder is now defined
      });

      if (searchQuery) params.append('search', searchQuery);
      if (roleFilter !== 'ALL') params.append('role', roleFilter);
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (verifiedFilter) params.append('isEmailVerified', verifiedFilter);

      const response = await fetch(`/api/admin/users?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch users');
      }

      setUsers(data.data || []);
      setPagination(data.pagination);
      setStatistics(data.statistics);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [
    pagination.page,
    pagination.limit,
    searchQuery,
    roleFilter,
    statusFilter,
    verifiedFilter,
    sortBy,
    sortOrder, // Added sortOrder to dependencies
  ]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (pagination.page !== 1) {
        setPagination(prev => ({ ...prev, page: 1 }));
      } else {
        fetchUsers();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, fetchUsers, pagination.page]);

  // Delete user
  const handleDeleteUser = async (userId: string) => {
    try {
      setActionLoading(true);
      const response = await fetch(`/api/admin/users?userId=${userId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete user');
      }

      setShowDeleteModal(false);
      setUserToDelete(null);
      fetchUsers();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete user');
    } finally {
      setActionLoading(false);
    }
  };

  // Export to CSV
  const handleExport = () => {
    const csv = [
      [
        'Name',
        'Email',
        'Phone',
        'nic',
        'Role',
        'Status',
        'Verified',
        'Created At',
      ],
      ...users.map(user => [
        user.name || '',
        user.email || '',
        user.phone || '',
        user.nic || '',
        user.role || '',
        user.status || '',
        user.isEmailVerified ? 'Yes' : 'No',
        user.createdAtFormatted || '',
      ]),
    ]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users-${new Date().toISOString()}.csv`;
    a.click();
  };

  // Get role badge color
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

  // Get status badge color
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

  if (loading && users.length === 0) {
    return <Loading />;
  }

  if (error && users.length === 0) {
    return <ErrorComponent message={error} />;
  }

  return (
    <div className='min-h-screen bg-gray-50 p-6'>
      <div className='max-w-7xl mx-auto'>
        {/* Header */}
        <div className='mb-6'>
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-3xl font-bold text-gray-900 flex items-center gap-2'>
                <FiUsers className='w-8 h-8' />
                User Management
              </h1>
              <p className='text-gray-600 mt-1'>
                Manage all system users and their roles
              </p>
            </div>
            <Link href='/admin/users/create'>
              <button className='flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition'>
                <FiPlus className='w-5 h-5' />
                Add User
              </button>
            </Link>
          </div>
        </div>

        {/* Statistics Cards */}
        {statistics && (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6'>
            <div className='bg-white rounded-lg shadow p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm text-gray-600'>Total Users</p>
                  <p className='text-2xl font-bold text-gray-900'>
                    {statistics.total}
                  </p>
                </div>
                <FiUsers className='w-10 h-10 text-blue-600' />
              </div>
            </div>

            <div className='bg-white rounded-lg shadow p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm text-gray-600'>Active Users</p>
                  <p className='text-2xl font-bold text-green-600'>
                    {statistics.active}
                  </p>
                </div>
                <FiUserCheck className='w-10 h-10 text-green-600' />
              </div>
            </div>

            <div className='bg-white rounded-lg shadow p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm text-gray-600'>Verified</p>
                  <p className='text-2xl font-bold text-blue-600'>
                    {statistics.verified}
                  </p>
                </div>
                <FiCheckCircle className='w-10 h-10 text-blue-600' />
              </div>
            </div>

            <div className='bg-white rounded-lg shadow p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm text-gray-600'>Suspended</p>
                  <p className='text-2xl font-bold text-red-600'>
                    {statistics.suspended}
                  </p>
                </div>
                <FiAlertCircle className='w-10 h-10 text-red-600' />
              </div>
            </div>
          </div>
        )}

        {/* Filters and Search */}
        <div className='bg-white rounded-lg shadow mb-6 p-4'>
          <div className='flex flex-col lg:flex-row gap-4'>
            {/* Search */}
            <div className='flex-1'>
              <div className='relative'>
                <FiSearch className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5' />
                <input
                  type='text'
                  placeholder='Search by name, email, or phone...'
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                />
              </div>
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className='flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50'
            >
              <FiFilter className='w-5 h-5' />
              Filters
            </button>

            {/* Export */}
            <button
              onClick={handleExport}
              className='flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50'
            >
              <FiDownload className='w-5 h-5' />
              Export
            </button>

            {/* Refresh */}
            <button
              onClick={fetchUsers}
              disabled={loading}
              className='flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50'
            >
              <FiRefreshCw
                className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`}
              />
              Refresh
            </button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mt-4 pt-4 border-t'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Role
                </label>
                <select
                  value={roleFilter}
                  onChange={e => setRoleFilter(e.target.value)}
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500'
                >
                  <option value='ALL'>All Roles</option>
                  <option value='ADMIN'>Admin</option>
                  <option value='DOCTOR'>Doctor</option>
                  <option value='PATIENT'>Patient</option>
                  <option value='NURSE'>Nurse</option>
                  <option value='RECEPTIONIST'>Receptionist</option>
                  <option value='PHARMACIST'>Pharmacist</option>
                </select>
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500'
                >
                  <option value='ALL'>All Status</option>
                  <option value='ACTIVE'>Active</option>
                  <option value='INACTIVE'>Inactive</option>
                  <option value='SUSPENDED'>Suspended</option>
                </select>
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Verified
                </label>
                <select
                  value={verifiedFilter}
                  onChange={e => setVerifiedFilter(e.target.value)}
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500'
                >
                  <option value=''>All</option>
                  <option value='true'>Verified</option>
                  <option value='false'>Unverified</option>
                </select>
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value)}
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500'
                >
                  <option value='createdAt'>Created Date</option>
                  <option value='name'>Name</option>
                  <option value='email'>Email</option>
                  <option value='lastLogin'>Last Login</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Users Table */}
        <div className='bg-white rounded-lg shadow overflow-hidden'>
          {loading ? (
            <div className='flex items-center justify-center h-64'>
              <FiRefreshCw className='w-8 h-8 text-blue-600 animate-spin' />
            </div>
          ) : error ? (
            <div className='flex items-center justify-center h-64 text-red-600'>
              <FiAlertCircle className='w-6 h-6 mr-2' />
              {error}
            </div>
          ) : users.length === 0 ? (
            <div className='flex flex-col items-center justify-center h-64 text-gray-500'>
              <FiUsers className='w-12 h-12 mb-2' />
              <p>No users found</p>
            </div>
          ) : (
            <>
              <div className='overflow-x-auto'>
                <table className='w-full'>
                  <thead className='bg-gray-50 border-b'>
                    <tr>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        User
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        Contact
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        NIC number
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        Role
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        Status
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        phone number
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        Created
                      </th>
                      <th className='px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className='bg-white divide-y divide-gray-200'>
                    {users.map(user => (
                      <tr key={user._id} className='hover:bg-gray-50'>
                        <td className='px-6 py-4 whitespace-nowrap'>
                          <div className='flex items-center'>
                            <div className='shrink-0 h-10 w-10'>
                              {user.image ? (
                                <Image
                                  className='h-10 w-10 rounded-full object-cover'
                                  src={user.image}
                                  alt={user.name || 'User'}
                                  width={40}
                                  height={40}
                                />
                              ) : (
                                <div className='h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center'>
                                  <span className='text-gray-600 font-medium'>
                                    {user.name?.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className='ml-4'>
                              <div className='text-sm font-medium text-gray-900'>
                                {user.name}
                              </div>
                              <div className='text-sm text-gray-500'>
                                {user._id}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap'>
                          <div className='text-sm text-gray-900 flex items-center gap-1'>
                            <FiMail className='w-4 h-4' />
                            {user.email}
                          </div>
                          {user.phone && (
                            <div className='text-sm text-gray-500 flex items-center gap-1'>
                              <FiPhone className='w-4 h-4' />
                              {user.phone}
                            </div>
                          )}
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap'>
                          <div className='text-sm text-gray-900 flex items-center gap-1'>
                            <FaIdCard className='w-4 h-4' />
                            {user.nic}
                          </div>
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap'>
                          <span
                            className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}
                          >
                            {user.role}
                          </span>
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap'>
                          <span
                            className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(user.status)}`}
                          >
                            {user.status}
                          </span>
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap'>
                          {user.isEmailVerified ? (
                            <FiCheckCircle className='w-5 h-5 text-green-600' />
                          ) : (
                            <FiXCircle className='w-5 h-5 text-gray-400' />
                          )}
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                          {user.createdAtFormatted
                            ? new Date(
                                user.createdAtFormatted
                              ).toLocaleDateString()
                            : 'N/A'}
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap text-right text-sm font-medium'>
                          <div className='flex items-center justify-end gap-2'>
                            <Link href={`/admin/users/${user._id}`}>
                              <button
                                className='text-blue-600 hover:text-blue-900'
                                title='View Details'
                              >
                                <FiEye className='w-5 h-5' />
                              </button>
                            </Link>
                            <Link href={`/admin/users/${user._id}/edit`}>
                              <button
                                className='text-green-600 hover:text-green-900'
                                title='Edit User'
                              >
                                <FiEdit className='w-5 h-5' />
                              </button>
                            </Link>
                            <button
                              onClick={() => {
                                setUserToDelete(user._id);
                                setShowDeleteModal(true);
                              }}
                              className='text-red-600 hover:text-red-900'
                              title='Delete User'
                            >
                              <FiTrash2 className='w-5 h-5' />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className='bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6'>
                <div className='flex-1 flex justify-between sm:hidden'>
                  <button
                    onClick={() =>
                      setPagination(prev => ({ ...prev, page: prev.page - 1 }))
                    }
                    disabled={!pagination.hasPrevPage}
                    className='relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50'
                  >
                    Previous
                  </button>
                  <button
                    onClick={() =>
                      setPagination(prev => ({ ...prev, page: prev.page + 1 }))
                    }
                    disabled={!pagination.hasNextPage}
                    className='ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50'
                  >
                    Next
                  </button>
                </div>
                <div className='hidden sm:flex-1 sm:flex sm:items-center sm:justify-between'>
                  <div>
                    <p className='text-sm text-gray-700'>
                      Showing{' '}
                      <span className='font-medium'>
                        {(pagination.page - 1) * pagination.limit + 1}
                      </span>{' '}
                      to{' '}
                      <span className='font-medium'>
                        {Math.min(
                          pagination.page * pagination.limit,
                          pagination.total
                        )}
                      </span>{' '}
                      of <span className='font-medium'>{pagination.total}</span>{' '}
                      results
                    </p>
                  </div>
                  <div>
                    <nav className='relative z-0 inline-flex rounded-md shadow-sm -space-x-px'>
                      <button
                        onClick={() =>
                          setPagination(prev => ({
                            ...prev,
                            page: prev.page - 1,
                          }))
                        }
                        disabled={!pagination.hasPrevPage}
                        className='relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50'
                      >
                        Previous
                      </button>
                      {Array.from(
                        { length: Math.min(pagination.pages, 5) },
                        (_, i) => {
                          const pageNum = pagination.page - 2 + i;
                          if (pageNum < 1 || pageNum > pagination.pages)
                            return null;
                          return (
                            <button
                              key={pageNum}
                              onClick={() =>
                                setPagination(prev => ({
                                  ...prev,
                                  page: pageNum,
                                }))
                              }
                              className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium ${
                                pageNum === pagination.page
                                  ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                  : 'bg-white text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        }
                      )}
                      <button
                        onClick={() =>
                          setPagination(prev => ({
                            ...prev,
                            page: prev.page + 1,
                          }))
                        }
                        disabled={!pagination.hasNextPage}
                        className='relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50'
                      >
                        Next
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            </>
          )}
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
              undone.
            </p>
            <div className='flex gap-3 justify-end'>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setUserToDelete(null);
                }}
                disabled={actionLoading}
                className='px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50'
              >
                Cancel
              </button>
              <button
                onClick={() => userToDelete && handleDeleteUser(userToDelete)}
                disabled={actionLoading}
                className='px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2'
              >
                {actionLoading && (
                  <FiRefreshCw className='w-4 h-4 animate-spin' />
                )}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from 'next-auth/react';
import Loading from '@/components/ui/Loading';
import { useRouter } from 'next/navigation';
import {
  FiUsers,
  FiMail,
  FiTag,
  FiTrash2,
  FiCheckCircle,
  FiXCircle,
  FiSearch,
  FiDownload,
  FiRefreshCw,
  FiUserCheck,
  FiUserX,
  FiPercent,
} from 'react-icons/fi';

interface Subscriber {
  _id: string;
  email: string;
  subscribedAt: string;
  isActive: boolean;
  couponCode: string;
  couponUsed: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Stats {
  total: number;
  active: number;
  inactive: number;
  couponUsed: number;
  couponUnused: number;
}

interface Notification {
  type: 'success' | 'error' | 'info';
  message: string;
}

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [notification, setNotification] = useState<Notification | null>(null);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    active: 0,
    inactive: 0,
    couponUsed: 0,
    couponUnused: 0,
  });
  const [selectedSubscribers, setSelectedSubscribers] = useState<string[]>([]);
  const [filterActive, setFilterActive] = useState<string>('all');

  // Show notification
  const showNotification = (
    type: 'success' | 'error' | 'info',
    message: string
  ) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  // Check authentication
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated') {
      const userRole = session?.user?.role;
      if (userRole !== 'ADMIN' && userRole !== 'PHARMACIST') {
        router.push('/');
        showNotification('error', 'Access denied. Admin only area.');
      }
    }
  }, [status, session, router]);

  const fetchSubscribers = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(searchTerm && { search: searchTerm }),
        ...(filterActive !== 'all' && {
          isActive: filterActive === 'active' ? 'true' : 'false',
        }),
      });

      const response = await fetch(`/api/allproduct/subscribe?${params}`);
      const data = await response.json();

      if (data.success) {
        setSubscribers(data.data);
        setTotalPages(data.totalPages);
        updateStats(data.data, data.total);
      } else {
        showNotification(
          'error',
          data.message || 'Failed to fetch subscribers'
        );
      }
    } catch {
      showNotification('error', 'Failed to fetch subscribers');
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, filterActive]);

  const updateStats = (subs: Subscriber[], total: number) => {
    const active = subs.filter(s => s.isActive).length;
    const inactive = subs.filter(s => !s.isActive).length;
    const couponUsed = subs.filter(s => s.couponUsed).length;
    const couponUnused = subs.filter(s => !s.couponUsed && s.couponCode).length;

    setStats({
      total,
      active,
      inactive,
      couponUsed,
      couponUnused,
    });
  };

  useEffect(() => {
    if (status === 'authenticated') {
      fetchSubscribers();
    }
  }, [fetchSubscribers, status]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this subscriber?')) return;

    try {
      const response = await fetch(`/api/allproduct/subscribe?id=${id}`, {
        method: 'DELETE',
      });
      const data = await response.json();

      if (data.success) {
        showNotification('success', 'Subscriber deleted successfully');
        fetchSubscribers();
      } else {
        showNotification(
          'error',
          data.message || 'Failed to delete subscriber'
        );
      }
    } catch {
      showNotification('error', 'Failed to delete subscriber');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedSubscribers.length === 0) {
      showNotification('error', 'No subscribers selected');
      return;
    }

    if (!confirm(`Delete ${selectedSubscribers.length} subscribers?`)) return;

    try {
      const promises = selectedSubscribers.map(id =>
        fetch(`/api/newsletter?id=${id}`, { method: 'DELETE' })
      );
      await Promise.all(promises);
      showNotification(
        'success',
        `${selectedSubscribers.length} subscribers deleted`
      );
      setSelectedSubscribers([]);
      fetchSubscribers();
    } catch {
      showNotification('error', 'Failed to delete subscribers');
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/allproduct/subscribe ?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      const data = await response.json();

      if (data.success) {
        showNotification(
          'success',
          `Subscriber ${!currentStatus ? 'activated' : 'deactivated'}`
        );
        fetchSubscribers();
      } else {
        showNotification('error', data.message || 'Failed to update status');
      }
    } catch {
      showNotification('error', 'Failed to update status');
    }
  };

  const exportToCSV = () => {
    const headers = [
      'Email',
      'Subscribed Date',
      'Status',
      'Coupon Code',
      'Coupon Used',
    ];
    const csvData = subscribers.map(sub => [
      sub.email,
      new Date(sub.subscribedAt).toLocaleDateString(),
      sub.isActive ? 'Active' : 'Inactive',
      sub.couponCode || 'N/A',
      sub.couponUsed ? 'Yes' : 'No',
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.join(','))
      .join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `newsletter-subscribers-${new Date().toISOString()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification('success', 'Export started');
  };

  const StatCard = ({ title, value, icon: Icon, color }: any) => (
    <motion.div
      whileHover={{ y: -5 }}
      className='bg-white rounded-xl shadow-md p-6 border border-gray-100'
    >
      <div className='flex items-center justify-between'>
        <div>
          <p className='text-gray-500 text-sm font-medium'>{title}</p>
          <p className='text-2xl font-bold text-gray-800 mt-2'>{value}</p>
        </div>
        <div className={`p-3 rounded-full bg-${color}-100`}>
          <Icon className={`w-6 h-6 text-${color}-600`} />
        </div>
      </div>
    </motion.div>
  );

  if (status === 'loading') {
    return <Loading />;
  }

  if (status === 'unauthenticated') {
    return null;
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='container mx-auto px-4 py-8 max-w-7xl'>
        {/* Notification */}
        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
                notification.type === 'success'
                  ? 'bg-green-500 text-white'
                  : notification.type === 'error'
                    ? 'bg-red-500 text-white'
                    : 'bg-blue-500 text-white'
              }`}
            >
              <div className='flex items-center gap-2'>
                {notification.type === 'success' && (
                  <FiCheckCircle className='w-5 h-5' />
                )}
                {notification.type === 'error' && (
                  <FiXCircle className='w-5 h-5' />
                )}
                <span>{notification.message}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <div className='mb-8'>
          <h1 className='text-3xl font-bold text-gray-800'>Admin Dashboard</h1>
          <p className='text-gray-600 mt-1'>
            Manage newsletter subscribers and coupons
          </p>
        </div>

        {/* Stats Grid */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
          <StatCard
            title='Total Subscribers'
            value={stats.total}
            icon={FiUsers}
            color='blue'
          />
          <StatCard
            title='Active Subscribers'
            value={stats.active}
            icon={FiUserCheck}
            color='green'
          />
          <StatCard
            title='Inactive Subscribers'
            value={stats.inactive}
            icon={FiUserX}
            color='red'
          />
          <StatCard
            title='Coupons Issued'
            value={stats.couponUnused}
            icon={FiPercent}
            color='orange'
          />
        </div>

        {/* Actions Bar */}
        <div className='bg-white rounded-lg shadow-md p-4 mb-6'>
          <div className='flex flex-wrap gap-4 items-center justify-between'>
            <div className='flex flex-wrap gap-3 items-center'>
              <div className='relative'>
                <FiSearch className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400' />
                <input
                  type='text'
                  placeholder='Search by email...'
                  value={searchTerm}
                  onChange={e => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className='pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500'
                />
              </div>

              <select
                value={filterActive}
                onChange={e => {
                  setFilterActive(e.target.value);
                  setCurrentPage(1);
                }}
                className='px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500'
              >
                <option value='all'>All Status</option>
                <option value='active'>Active Only</option>
                <option value='inactive'>Inactive Only</option>
              </select>

              <button
                onClick={fetchSubscribers}
                className='px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition flex items-center gap-2'
              >
                <FiRefreshCw className='w-4 h-4' />
                Refresh
              </button>

              <button
                onClick={exportToCSV}
                className='px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2'
              >
                <FiDownload className='w-4 h-4' />
                Export CSV
              </button>
            </div>

            {selectedSubscribers.length > 0 && (
              <button
                onClick={handleBulkDelete}
                className='px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2'
              >
                <FiTrash2 className='w-4 h-4' />
                Delete Selected ({selectedSubscribers.length})
              </button>
            )}
          </div>
        </div>

        {/* Subscribers Table */}
        <div className='bg-white rounded-lg shadow-md overflow-hidden'>
          <div className='overflow-x-auto'>
            <table className='min-w-full divide-y divide-gray-200'>
              <thead className='bg-gray-50'>
                <tr>
                  <th className='px-6 py-3 text-left'>
                    <input
                      type='checkbox'
                      checked={
                        selectedSubscribers.length === subscribers.length &&
                        subscribers.length > 0
                      }
                      onChange={e => {
                        if (e.target.checked) {
                          setSelectedSubscribers(subscribers.map(s => s._id));
                        } else {
                          setSelectedSubscribers([]);
                        }
                      }}
                      className='rounded border-gray-300 text-orange-600 focus:ring-orange-500'
                    />
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Email
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Subscribed Date
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Status
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Coupon Code
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Coupon Used
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className='bg-white divide-y divide-gray-200'>
                {loading ? (
                  <tr>
                    <td colSpan={7} className='px-6 py-12 text-center'>
                      <div className='flex justify-center'>
                        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600'></div>
                      </div>
                    </td>
                  </tr>
                ) : subscribers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className='px-6 py-12 text-center text-gray-500'
                    >
                      No subscribers found
                    </td>
                  </tr>
                ) : (
                  <AnimatePresence>
                    {subscribers.map(subscriber => (
                      <motion.tr
                        key={subscriber._id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className='hover:bg-gray-50 transition'
                      >
                        <td className='px-6 py-4'>
                          <input
                            type='checkbox'
                            checked={selectedSubscribers.includes(
                              subscriber._id
                            )}
                            onChange={e => {
                              if (e.target.checked) {
                                setSelectedSubscribers([
                                  ...selectedSubscribers,
                                  subscriber._id,
                                ]);
                              } else {
                                setSelectedSubscribers(
                                  selectedSubscribers.filter(
                                    id => id !== subscriber._id
                                  )
                                );
                              }
                            }}
                            className='rounded border-gray-300 text-orange-600 focus:ring-orange-500'
                          />
                        </td>
                        <td className='px-6 py-4'>
                          <div className='flex items-center gap-2'>
                            <FiMail className='text-gray-400' />
                            <span className='text-sm text-gray-900'>
                              {subscriber.email}
                            </span>
                          </div>
                        </td>
                        <td className='px-6 py-4 text-sm text-gray-500'>
                          {new Date(
                            subscriber.subscribedAt
                          ).toLocaleDateString()}
                        </td>
                        <td className='px-6 py-4'>
                          <button
                            onClick={() =>
                              handleToggleStatus(
                                subscriber._id,
                                subscriber.isActive
                              )
                            }
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                              subscriber.isActive
                                ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                : 'bg-red-100 text-red-800 hover:bg-red-200'
                            }`}
                          >
                            {subscriber.isActive ? (
                              <FiCheckCircle className='w-3 h-3' />
                            ) : (
                              <FiXCircle className='w-3 h-3' />
                            )}
                            {subscriber.isActive ? 'Active' : 'Inactive'}
                          </button>
                        </td>
                        <td className='px-6 py-4'>
                          {subscriber.couponCode ? (
                            <code className='text-xs bg-gray-100 px-2 py-1 rounded'>
                              {subscriber.couponCode}
                            </code>
                          ) : (
                            <span className='text-gray-400 text-sm'>
                              No coupon
                            </span>
                          )}
                        </td>
                        <td className='px-6 py-4'>
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                              subscriber.couponUsed
                                ? 'bg-gray-100 text-gray-600'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            <FiTag className='w-3 h-3' />
                            {subscriber.couponUsed ? 'Used' : 'Not Used'}
                          </span>
                        </td>
                        <td className='px-6 py-4'>
                          <div className='flex gap-2'>
                            <button
                              onClick={() => handleDelete(subscriber._id)}
                              className='text-red-600 hover:text-red-800 transition'
                              title='Delete'
                            >
                              <FiTrash2 className='w-5 h-5' />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className='px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between'>
              <div className='text-sm text-gray-700'>
                Page {currentPage} of {totalPages}
              </div>
              <div className='flex gap-2'>
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className='px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50'
                >
                  Previous
                </button>
                <button
                  onClick={() =>
                    setCurrentPage(p => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className='px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50'
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

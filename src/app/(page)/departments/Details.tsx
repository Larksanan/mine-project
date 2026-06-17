/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useDepartment } from '@/hooks/usedepartment';
import {
  FiArrowLeft,
  FiEdit2,
  FiTrash2,
  FiToggleLeft,
  FiToggleRight,
  FiMapPin,
  FiMail,
  FiPhone,
  FiUsers,
  FiDollarSign,
  FiClock,
  FiAlertCircle,
  FiCalendar,
} from 'react-icons/fi';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import Loading from '../../../components/ui/Loading';

export default function DepartmentDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const departmentId = params?.id as string;

  const {
    department,
    loading,
    fetchDepartmentById,
    deleteDepartment,
    toggleDepartmentStatus,
  } = useDepartment();

  useEffect(() => {
    if (departmentId) {
      fetchDepartmentById(departmentId);
    }
  }, [departmentId]);

  const handleDelete = async () => {
    if (
      department &&
      window.confirm(`Are you sure you want to delete ${department.name}?`)
    ) {
      const success = await deleteDepartment(
        (department as any).id || department._id
      );
      if (success) {
        router.push('/departments');
      }
    }
  };

  const handleToggleStatus = async () => {
    if (department) {
      const id = (department as any).id || department._id;
      if (id) await toggleDepartmentStatus(id);
    }
  };

  if (loading) {
    return <Loading />;
  }

  if (!department) {
    return (
      <div className='min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center'>
        <div className='text-center'>
          <FiAlertCircle className='w-16 h-16 mx-auto text-gray-400 mb-4' />
          <h3 className='text-lg font-medium text-gray-900 dark:text-white mb-2'>
            Department not found
          </h3>
          <button
            onClick={() => router.push('/departments')}
            className='text-blue-600 dark:text-blue-400 hover:underline'
          >
            Back to Departments
          </button>
        </div>
      </div>
    );
  }

  const budgetUtilization = department.budget?.allocated
    ? (department.budget.spent / department.budget.allocated) * 100
    : 0;

  return (
    <div className='min-h-screen bg-gray-50 dark:bg-gray-900'>
      {/* Header */}
      <div className='bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-4'>
              <button
                onClick={() => router.back()}
                className='p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors'
              >
                <FiArrowLeft className='w-6 h-6' />
              </button>
              <div>
                <div className='flex items-center gap-3'>
                  <h1 className='text-3xl font-bold text-gray-900 dark:text-white'>
                    {department.name}
                  </h1>
                  <span
                    className={`px-3 py-1 text-sm font-medium rounded-full ${
                      department.isActive
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    {department.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className='mt-1 text-sm font-mono text-gray-500 dark:text-gray-400'>
                  {department.code}
                </p>
              </div>
            </div>

            <div className='flex items-center gap-2'>
              <button
                onClick={handleToggleStatus}
                className='inline-flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors'
              >
                {department.isActive ? (
                  <>
                    <FiToggleRight className='w-5 h-5' />
                    Deactivate
                  </>
                ) : (
                  <>
                    <FiToggleLeft className='w-5 h-5' />
                    Activate
                  </>
                )}
              </button>
              <button
                onClick={() =>
                  router.push(
                    `/departments/${(department as any).id || department._id}/edit`
                  )
                }
                className='inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
              >
                <FiEdit2 className='w-5 h-5' />
                Edit
              </button>
              <button
                onClick={handleDelete}
                className='inline-flex items-center gap-2 px-4 py-2 border border-red-300 dark:border-red-600 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors'
              >
                <FiTrash2 className='w-5 h-5' />
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          {/* Main Info */}
          <div className='lg:col-span-2 space-y-6'>
            {/* Basic Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className='bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6'
            >
              <h2 className='text-xl font-semibold text-gray-900 dark:text-white mb-4'>
                Basic Information
              </h2>

              {department.description && (
                <div className='mb-6'>
                  <h3 className='text-sm font-medium text-gray-500 dark:text-gray-400 mb-2'>
                    Description
                  </h3>
                  <p className='text-gray-900 dark:text-white'>
                    {department.description}
                  </p>
                </div>
              )}

              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                {department.location && (
                  <div>
                    <div className='flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400 mb-2'>
                      <FiMapPin className='w-4 h-4' />
                      Location
                    </div>
                    <p className='text-gray-900 dark:text-white'>
                      {department.location}
                      {department.floor !== undefined &&
                        ` • Floor ${department.floor}`}
                    </p>
                  </div>
                )}

                {department.staffCount !== undefined && (
                  <div>
                    <div className='flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400 mb-2'>
                      <FiUsers className='w-4 h-4' />
                      Staff Count
                    </div>
                    <p className='text-gray-900 dark:text-white'>
                      {department.staffCount} Members
                    </p>
                  </div>
                )}

                {department.email && (
                  <div>
                    <div className='flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400 mb-2'>
                      <FiMail className='w-4 h-4' />
                      Email
                    </div>
                    <a
                      href={`mailto:${department.email}`}
                      className='text-blue-600 dark:text-blue-400 hover:underline'
                    >
                      {department.email}
                    </a>
                  </div>
                )}

                {department.phoneExtension && (
                  <div>
                    <div className='flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400 mb-2'>
                      <FiPhone className='w-4 h-4' />
                      Phone Extension
                    </div>
                    <p className='text-gray-900 dark:text-white'>
                      Ext. {department.phoneExtension}
                    </p>
                  </div>
                )}
              </div>

              {department.specializations &&
                department.specializations.length > 0 && (
                  <div className='mt-6'>
                    <h3 className='text-sm font-medium text-gray-500 dark:text-gray-400 mb-2'>
                      Specializations
                    </h3>
                    <div className='flex flex-wrap gap-2'>
                      {department.specializations.map((spec, index) => (
                        <span
                          key={index}
                          className='px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm rounded-full'
                        >
                          {spec}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

              {department.facilities && department.facilities.length > 0 && (
                <div className='mt-6'>
                  <h3 className='text-sm font-medium text-gray-500 dark:text-gray-400 mb-2'>
                    Facilities
                  </h3>
                  <div className='flex flex-wrap gap-2'>
                    {department.facilities.map((facility, index) => (
                      <span
                        key={index}
                        className='px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm rounded-full'
                      >
                        {facility}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>

            {/* Working Hours */}
            {department.workingHours && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className='bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6'
              >
                <div className='flex items-center gap-2 mb-4'>
                  <FiClock className='w-5 h-5 text-gray-400' />
                  <h2 className='text-xl font-semibold text-gray-900 dark:text-white'>
                    Working Hours
                  </h2>
                </div>

                <div className='space-y-3'>
                  {Object.entries(department.workingHours).map(
                    ([day, hours]) => (
                      <div
                        key={day}
                        className='flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg'
                      >
                        <span className='font-medium text-gray-900 dark:text-white capitalize'>
                          {day}
                        </span>
                        {hours.isOpen ? (
                          <span className='text-gray-600 dark:text-gray-300'>
                            {hours.start} - {hours.end}
                          </span>
                        ) : (
                          <span className='text-gray-400 dark:text-gray-500'>
                            Closed
                          </span>
                        )}
                      </div>
                    )
                  )}
                </div>
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className='space-y-6'>
            {/* Budget Info */}
            {department.budget && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className='bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6'
              >
                <div className='flex items-center gap-2 mb-4'>
                  <FiDollarSign className='w-5 h-5 text-gray-400' />
                  <h2 className='text-xl font-semibold text-gray-900 dark:text-white'>
                    Budget
                  </h2>
                </div>

                <div className='space-y-4'>
                  <div>
                    <div className='flex justify-between text-sm mb-1'>
                      <span className='text-gray-500 dark:text-gray-400'>
                        Allocated
                      </span>
                      <span className='font-medium text-gray-900 dark:text-white'>
                        {department.budget.currency}{' '}
                        {department.budget.allocated.toLocaleString()}
                      </span>
                    </div>
                    <div className='flex justify-between text-sm mb-1'>
                      <span className='text-gray-500 dark:text-gray-400'>
                        Spent
                      </span>
                      <span className='font-medium text-gray-900 dark:text-white'>
                        {department.budget.currency}{' '}
                        {department.budget.spent.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div>
                    <div className='flex justify-between text-sm mb-2'>
                      <span className='text-gray-500 dark:text-gray-400'>
                        Utilization
                      </span>
                      <span
                        className={`font-medium ${
                          budgetUtilization > 100
                            ? 'text-red-600 dark:text-red-400'
                            : budgetUtilization > 80
                              ? 'text-yellow-600 dark:text-yellow-400'
                              : 'text-green-600 dark:text-green-400'
                        }`}
                      >
                        {budgetUtilization.toFixed(1)}%
                      </span>
                    </div>
                    <div className='w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2'>
                      <div
                        className={`h-2 rounded-full transition-all ${
                          budgetUtilization > 100
                            ? 'bg-red-500'
                            : budgetUtilization > 80
                              ? 'bg-yellow-500'
                              : 'bg-green-500'
                        }`}
                        style={{
                          width: `${Math.min(budgetUtilization, 100)}%`,
                        }}
                      />
                    </div>
                  </div>

                  {budgetUtilization > 100 && (
                    <div className='flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg'>
                      <FiAlertCircle className='w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5' />
                      <p className='text-sm text-red-600 dark:text-red-400'>
                        Budget exceeded by {department.budget.currency}{' '}
                        {(
                          department.budget.spent - department.budget.allocated
                        ).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Emergency Contact */}
            {department.emergencyContact?.name && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className='bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6'
              >
                <div className='flex items-center gap-2 mb-4'>
                  <FiPhone className='w-5 h-5 text-gray-400' />
                  <h2 className='text-xl font-semibold text-gray-900 dark:text-white'>
                    Emergency Contact
                  </h2>
                </div>

                <div className='space-y-3'>
                  <div>
                    <p className='text-sm text-gray-500 dark:text-gray-400'>
                      Name
                    </p>
                    <p className='font-medium text-gray-900 dark:text-white'>
                      {department.emergencyContact.name}
                    </p>
                  </div>

                  {department.emergencyContact.phone && (
                    <div>
                      <p className='text-sm text-gray-500 dark:text-gray-400'>
                        Phone
                      </p>
                      <a
                        href={`tel:${department.emergencyContact.phone}`}
                        className='font-medium text-blue-600 dark:text-blue-400 hover:underline'
                      >
                        {department.emergencyContact.phone}
                      </a>
                    </div>
                  )}

                  {department.emergencyContact.email && (
                    <div>
                      <p className='text-sm text-gray-500 dark:text-gray-400'>
                        Email
                      </p>
                      <a
                        href={`mailto:${department.emergencyContact.email}`}
                        className='font-medium text-blue-600 dark:text-blue-400 hover:underline'
                      >
                        {department.emergencyContact.email}
                      </a>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Metadata */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className='bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6'
            >
              <div className='flex items-center gap-2 mb-4'>
                <FiCalendar className='w-5 h-5 text-gray-400' />
                <h2 className='text-xl font-semibold text-gray-900 dark:text-white'>
                  Metadata
                </h2>
              </div>

              <div className='space-y-3 text-sm'>
                <div>
                  <p className='text-gray-500 dark:text-gray-400'>Created</p>
                  <p className='font-medium text-gray-900 dark:text-white'>
                    {format(new Date(department.createdAt), 'PPP')}
                  </p>
                </div>
                <div>
                  <p className='text-gray-500 dark:text-gray-400'>
                    Last Updated
                  </p>
                  <p className='font-medium text-gray-900 dark:text-white'>
                    {format(new Date(department.updatedAt), 'PPP')}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

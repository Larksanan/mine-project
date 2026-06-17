/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDepartment } from '@/hooks/usedepartment';
import {
  FiPlus,
  FiSearch,
  FiEdit2,
  FiTrash2,
  FiToggleLeft,
  FiToggleRight,
  FiMapPin,
  FiUsers,
  FiMail,
  FiPhone,
  FiFilter,
  FiGrid,
  FiList,
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { IDepartment } from '@/types/department';

export default function DepartmentsPage() {
  const router = useRouter();
  const {
    departments,
    loading,
    fetchDepartments,
    deleteDepartment,
    toggleDepartmentStatus,
  } = useDepartment();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterActive, setFilterActive] = useState<boolean | 'all'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  const filteredDepartments = departments.filter(dept => {
    const matchesSearch =
      dept.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dept.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dept.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter =
      filterActive === 'all' || dept.isActive === filterActive;

    return matchesSearch && matchesFilter;
  });

  const handleDelete = async (id: string, name: string) => {
    if (!id) return;
    if (window.confirm(`Are you sure you want to delete ${name}?`)) {
      await deleteDepartment(id);
    }
  };

  const handleToggleStatus = async (id: string) => {
    if (!id) return;
    await toggleDepartmentStatus(id);
  };

  return (
    <div className='min-h-screen bg-gray-50 dark:bg-gray-900'>
      {/* Header */}
      <div className='bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6'>
          <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
            <div>
              <h1 className='text-3xl font-bold text-gray-900 dark:text-white'>
                Departments
              </h1>
              <p className='mt-1 text-sm text-gray-500 dark:text-gray-400'>
                Manage hospital departments and their details
              </p>
            </div>
            <button
              onClick={() => router.push('/departments/create')}
              className='inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm'
            >
              <FiPlus className='w-5 h-5' />
              Add Department
            </button>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6'>
        <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6'>
          <div className='flex flex-col lg:flex-row gap-4'>
            {/* Search */}
            <div className='flex-1 relative'>
              <FiSearch className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5' />
              <input
                type='text'
                placeholder='Search departments...'
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className='w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white'
              />
            </div>

            {/* Filter Toggle */}
            <div className='flex gap-2'>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className='inline-flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors'
              >
                <FiFilter className='w-5 h-5' />
                Filters
              </button>

              <div className='flex border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden'>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-2 ${
                    viewMode === 'grid'
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <FiGrid className='w-5 h-5' />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-2 border-l border-gray-300 dark:border-gray-600 ${
                    viewMode === 'list'
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <FiList className='w-5 h-5' />
                </button>
              </div>
            </div>
          </div>

          {/* Filter Options */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className='mt-4 pt-4 border-t border-gray-200 dark:border-gray-700'
              >
                <div className='flex flex-wrap gap-2'>
                  <button
                    onClick={() => setFilterActive('all')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      filterActive === 'all'
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    All Departments
                  </button>
                  <button
                    onClick={() => setFilterActive(true)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      filterActive === true
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    Active Only
                  </button>
                  <button
                    onClick={() => setFilterActive(false)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      filterActive === false
                        ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    Inactive Only
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Stats */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6'>
          <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6'>
            <div className='flex items-center gap-4'>
              <div className='p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg'>
                <FiGrid className='w-6 h-6 text-blue-600 dark:text-blue-400' />
              </div>
              <div>
                <p className='text-sm text-gray-500 dark:text-gray-400'>
                  Total Departments
                </p>
                <p className='text-2xl font-bold text-gray-900 dark:text-white'>
                  {departments.length}
                </p>
              </div>
            </div>
          </div>

          <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6'>
            <div className='flex items-center gap-4'>
              <div className='p-3 bg-green-100 dark:bg-green-900/30 rounded-lg'>
                <FiToggleRight className='w-6 h-6 text-green-600 dark:text-green-400' />
              </div>
              <div>
                <p className='text-sm text-gray-500 dark:text-gray-400'>
                  Active
                </p>
                <p className='text-2xl font-bold text-gray-900 dark:text-white'>
                  {departments.filter(d => d.isActive).length}
                </p>
              </div>
            </div>
          </div>

          <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6'>
            <div className='flex items-center gap-4'>
              <div className='p-3 bg-gray-100 dark:bg-gray-700 rounded-lg'>
                <FiToggleLeft className='w-6 h-6 text-gray-600 dark:text-gray-400' />
              </div>
              <div>
                <p className='text-sm text-gray-500 dark:text-gray-400'>
                  Inactive
                </p>
                <p className='text-2xl font-bold text-gray-900 dark:text-white'>
                  {departments.filter(d => !d.isActive).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className='text-center py-12'>
            <div className='inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
            <p className='mt-4 text-gray-500 dark:text-gray-400'>
              Loading departments...
            </p>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredDepartments.length === 0 && (
          <div className='text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-sm'>
            <FiGrid className='w-16 h-16 mx-auto text-gray-400' />
            <h3 className='mt-4 text-lg font-medium text-gray-900 dark:text-white'>
              No departments found
            </h3>
            <p className='mt-2 text-gray-500 dark:text-gray-400'>
              {searchQuery
                ? 'Try adjusting your search or filters'
                : 'Get started by creating a new department'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => router.push('/departments/create')}
                className='mt-6 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
              >
                <FiPlus className='w-5 h-5' />
                Add Department
              </button>
            )}
          </div>
        )}

        {/* Grid View */}
        {!loading && viewMode === 'grid' && filteredDepartments.length > 0 && (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            <AnimatePresence>
              {filteredDepartments.map((dept, index) => (
                <DepartmentCard
                  key={(dept as any).id || dept._id || index}
                  department={dept}
                  onEdit={() =>
                    router.push(
                      `/departments/${(dept as any).id || dept._id}/edit`
                    )
                  }
                  onDelete={() =>
                    handleDelete((dept as any).id || dept._id, dept.name)
                  }
                  onToggleStatus={() =>
                    handleToggleStatus((dept as any).id || dept._id)
                  }
                  onView={() =>
                    router.push(`/departments/${(dept as any).id || dept._id}`)
                  }
                />
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* List View */}
        {!loading && viewMode === 'list' && filteredDepartments.length > 0 && (
          <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden'>
            <DepartmentTable
              departments={filteredDepartments}
              onEdit={id => router.push(`/departments/${id}/edit`)}
              onDelete={handleDelete}
              onToggleStatus={handleToggleStatus}
              onView={id => router.push(`/departments/${id}`)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// Department Card Component
interface DepartmentCardProps {
  department: IDepartment;
  onEdit: () => void;
  onDelete: () => void;
  onToggleStatus: () => void;
  onView: () => void;
}

const DepartmentCard = ({
  department,
  onEdit,
  onDelete,
  onToggleStatus,
  onView,
}: DepartmentCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className='bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden border border-gray-200 dark:border-gray-700'
    >
      {/* Header */}
      <div className='p-6 border-b border-gray-200 dark:border-gray-700'>
        <div className='flex items-start justify-between'>
          <div className='flex-1'>
            <div className='flex items-center gap-2'>
              <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>
                {department.name}
              </h3>
              <span
                className={`px-2 py-1 text-xs font-medium rounded-full ${
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

        {department.description && (
          <p className='mt-3 text-sm text-gray-600 dark:text-gray-300 line-clamp-2'>
            {department.description}
          </p>
        )}
      </div>

      {/* Info */}
      <div className='p-6 space-y-3'>
        {department.location && (
          <div className='flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300'>
            <FiMapPin className='w-4 h-4 text-gray-400' />
            <span>{department.location}</span>
            {department.floor !== undefined && (
              <span className='text-gray-400'>• Floor {department.floor}</span>
            )}
          </div>
        )}

        {department.staffCount !== undefined && (
          <div className='flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300'>
            <FiUsers className='w-4 h-4 text-gray-400' />
            <span>{department.staffCount} Staff Members</span>
          </div>
        )}

        {department.email && (
          <div className='flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300'>
            <FiMail className='w-4 h-4 text-gray-400' />
            <span className='truncate'>{department.email}</span>
          </div>
        )}

        {department.phoneExtension && (
          <div className='flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300'>
            <FiPhone className='w-4 h-4 text-gray-400' />
            <span>Ext. {department.phoneExtension}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className='px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between'>
        <button
          onClick={onView}
          className='text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300'
        >
          View Details
        </button>
        <div className='flex items-center gap-2'>
          <button
            onClick={onToggleStatus}
            className='p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors'
            title={department.isActive ? 'Deactivate' : 'Activate'}
          >
            {department.isActive ? (
              <FiToggleRight className='w-5 h-5' />
            ) : (
              <FiToggleLeft className='w-5 h-5' />
            )}
          </button>
          <button
            onClick={onEdit}
            className='p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors'
            title='Edit'
          >
            <FiEdit2 className='w-5 h-5' />
          </button>
          <button
            onClick={onDelete}
            className='p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors'
            title='Delete'
          >
            <FiTrash2 className='w-5 h-5' />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

// Department Table Component
interface DepartmentTableProps {
  departments: IDepartment[];
  onEdit: (id: string) => void;
  onDelete: (id: string, name: string) => void;
  onToggleStatus: (id: string) => void;
  onView: (id: string) => void;
}

const DepartmentTable = ({
  departments,
  onEdit,
  onDelete,
  onToggleStatus,
  onView,
}: DepartmentTableProps) => {
  return (
    <div className='overflow-x-auto'>
      <table className='w-full'>
        <thead className='bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600'>
          <tr>
            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
              Department
            </th>
            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
              Code
            </th>
            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
              Location
            </th>
            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
              Staff
            </th>
            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
              Status
            </th>
            <th className='px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
              Actions
            </th>
          </tr>
        </thead>
        <tbody className='divide-y divide-gray-200 dark:divide-gray-700'>
          {departments.map((dept, index) => (
            <tr
              key={(dept as any).id || dept._id || index}
              className='hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors'
            >
              <td className='px-6 py-4'>
                <button
                  onClick={() => onView((dept as any).id || dept._id)}
                  className='text-left hover:text-blue-600 dark:hover:text-blue-400'
                >
                  <div className='font-medium text-gray-900 dark:text-white'>
                    {dept.name}
                  </div>
                  {dept.description && (
                    <div className='text-sm text-gray-500 dark:text-gray-400 line-clamp-1'>
                      {dept.description}
                    </div>
                  )}
                </button>
              </td>
              <td className='px-6 py-4 font-mono text-sm text-gray-900 dark:text-white'>
                {dept.code}
              </td>
              <td className='px-6 py-4 text-sm text-gray-600 dark:text-gray-300'>
                {dept.location || '-'}
                {dept.floor !== undefined && ` (Floor ${dept.floor})`}
              </td>
              <td className='px-6 py-4 text-sm text-gray-600 dark:text-gray-300'>
                {dept.staffCount || 0}
              </td>
              <td className='px-6 py-4'>
                <span
                  className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    dept.isActive
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {dept.isActive ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td className='px-6 py-4 text-right'>
                <div className='flex items-center justify-end gap-2'>
                  <button
                    onClick={() => onToggleStatus((dept as any).id || dept._id)}
                    className='p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors'
                    title={dept.isActive ? 'Deactivate' : 'Activate'}
                  >
                    {dept.isActive ? (
                      <FiToggleRight className='w-5 h-5' />
                    ) : (
                      <FiToggleLeft className='w-5 h-5' />
                    )}
                  </button>
                  <button
                    onClick={() => onEdit((dept as any).id || dept._id)}
                    className='p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors'
                    title='Edit'
                  >
                    <FiEdit2 className='w-5 h-5' />
                  </button>
                  <button
                    onClick={() =>
                      onDelete((dept as any).id || dept._id, dept.name)
                    }
                    className='p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors'
                    title='Delete'
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
  );
};

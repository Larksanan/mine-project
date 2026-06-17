'use client';
import React, { useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { IReceptionist } from '@/models/Receptionist';
import {
  FaSearch,
  FaEllipsisV,
  FaEye,
  FaEdit,
  FaTrash,
  FaPlus,
  FaFilter,
  FaDownload,
  FaUserCircle,
  FaClock,
  FaBriefcase,
} from 'react-icons/fa';

import Chip from '@/components/ui/Chip';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from '@/components/ui/Dropdown';
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from '@/components/ui/Table';
import Pagination from '@/components/ui/Pagination';
import { Toast } from '@/components/ui/Toast';

interface SortDescriptor {
  column: string;
  direction: 'ascending' | 'descending';
}

interface ToastMessage {
  id: number;
  message: string;
  type: 'success' | 'error';
}

const statusColorMap: Record<
  string,
  'success' | 'warning' | 'danger' | 'default'
> = {
  ACTIVE: 'success',
  ON_LEAVE: 'warning',
  SUSPENDED: 'danger',
  TERMINATED: 'default',
};

const shiftColorMap: Record<string, string> = {
  MORNING:
    'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  EVENING:
    'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  NIGHT:
    'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
  FULL_DAY: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
};

interface ReceptionistTableProps {
  receptionists: IReceptionist[];
  page: number;
  pages: number;
  loading: boolean;
  searchValue: string;
  sortDescriptor: SortDescriptor;
  toasts: ToastMessage[];
  onPageChange: (page: number) => void;
  onSearchChange: (value: string) => void;
  onClearSearch: () => void;
  onSortChange: (descriptor: SortDescriptor) => void;
  onDelete: (receptionistId: string) => void;
  onToastClose: (id: number) => void;
}

const columns = [
  { key: 'employeeId', label: 'Employee ID', sortable: true },
  { key: 'user', label: 'Name', sortable: true },
  { key: 'email', label: 'Email', sortable: true },
  { key: 'shift', label: 'Shift', sortable: true },
  { key: 'employmentStatus', label: 'Status', sortable: true },
  { key: 'hireDate', label: 'Hire Date', sortable: true },
  { key: 'actions', label: 'Actions', sortable: false },
];

const ReceptionistTable: React.FC<ReceptionistTableProps> = ({
  receptionists,
  page,
  pages,
  loading,
  searchValue,
  toasts,
  onPageChange,
  onSearchChange,
  onClearSearch,
  onDelete,
  onToastClose,
}) => {
  // State for future enhancements
  const [_hoveredRow, _setHoveredRow] = useState<string | null>(null);
  const [_selectedRows, _setSelectedRows] = useState<Set<string>>(new Set());

  const getUserName = (receptionist: IReceptionist): string => {
    if (
      receptionist.user &&
      typeof receptionist.user === 'object' &&
      'name' in receptionist.user
    ) {
      return (receptionist.user as { name?: string }).name || 'N/A';
    }
    return 'N/A';
  };

  const getUserEmail = (receptionist: IReceptionist): string => {
    if (
      receptionist.user &&
      typeof receptionist.user === 'object' &&
      'email' in receptionist.user
    ) {
      return (receptionist.user as { email?: string }).email || 'N/A';
    }
    return 'N/A';
  };

  const renderCell = useCallback(
    (receptionist: IReceptionist, columnKey: string) => {
      const cellValue = receptionist[columnKey as keyof IReceptionist];

      switch (columnKey) {
        case 'user':
          return (
            <div className='flex items-center gap-3'>
              <div className='relative'>
                <div className='w-10 h-10 rounded-full bg-linear-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold text-sm shadow-md'>
                  {getUserName(receptionist).charAt(0).toUpperCase()}
                </div>
                <div className='absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full' />
              </div>
              <div className='flex flex-col'>
                <span className='font-semibold text-gray-900 dark:text-gray-100'>
                  {getUserName(receptionist)}
                </span>
                <span className='text-xs text-gray-500 dark:text-gray-400'>
                  {receptionist.employeeId}
                </span>
              </div>
            </div>
          );
        case 'email':
          return (
            <span className='text-gray-700 dark:text-gray-300'>
              {getUserEmail(receptionist)}
            </span>
          );
        case 'employeeId':
          return (
            <div className='flex items-center gap-2'>
              <FaUserCircle className='text-gray-400' />
              <span className='font-mono text-sm font-medium text-gray-900 dark:text-gray-100'>
                {receptionist.employeeId}
              </span>
            </div>
          );
        case 'shift':
          return (
            <div className='flex items-center gap-2'>
              <FaClock className='text-gray-400 text-sm' />
              <span
                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                  shiftColorMap[receptionist.shift] ||
                  'bg-gray-100 text-gray-800'
                }`}
              >
                {receptionist.shift}
              </span>
            </div>
          );
        case 'employmentStatus':
          return (
            <Chip
              color={statusColorMap[receptionist.employmentStatus]}
              size='sm'
              variant='flat'
              className='font-medium'
            >
              {receptionist.employmentStatus}
            </Chip>
          );
        case 'hireDate':
          return (
            <span className='text-gray-700 dark:text-gray-300 text-sm'>
              {format(new Date(receptionist.hireDate), 'dd MMM yyyy')}
            </span>
          );
        case 'actions':
          return (
            <div className='relative flex justify-end items-center gap-2 dropdown-container'>
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
              >
                <Dropdown>
                  <DropdownTrigger>
                    <Button
                      isIconOnly
                      size='sm'
                      variant='light'
                      className='hover:bg-gray-100 dark:hover:bg-gray-800'
                    >
                      <FaEllipsisV className='text-lg text-gray-600 dark:text-gray-400' />
                    </Button>
                  </DropdownTrigger>
                  <DropdownMenu>
                    <DropdownItem
                      onPress={() =>
                        (window.location.href = `/receptionist/${receptionist._id}`)
                      }
                    >
                      <div className='flex items-center space-x-2'>
                        <FaEye className='w-4 h-4' />
                        <span>View Details</span>
                      </div>
                    </DropdownItem>
                    <DropdownItem
                      onPress={() =>
                        (window.location.href = `/receptionist/${receptionist._id}/edit`)
                      }
                    >
                      <div className='flex items-center space-x-2'>
                        <FaEdit className='w-4 h-4' />
                        <span>Edit Profile</span>
                      </div>
                    </DropdownItem>
                    <DropdownItem
                      color='danger'
                      onPress={() => onDelete(receptionist._id)}
                    >
                      <div className='flex items-center space-x-2'>
                        <FaTrash className='w-4 h-4' />
                        <span>Delete</span>
                      </div>
                    </DropdownItem>
                  </DropdownMenu>
                </Dropdown>
              </motion.div>
            </div>
          );
        default:
          return cellValue;
      }
    },
    [onDelete]
  );

  const totalReceptionists = receptionists.length;
  const activeCount = receptionists.filter(
    r => r.employmentStatus === 'ACTIVE'
  ).length;

  return (
    <div className='min-h-screen bg-linear-to-br from-gray-50 via-blue-50/30 to-purple-50/20 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900'>
      <div className='p-4 md:p-8 max-w-7xl mx-auto'>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header Section */}
          <div className='mb-8'>
            <div className='flex items-center gap-3 mb-3'>
              <div className='w-12 h-12 rounded-2xl bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/30'>
                <FaBriefcase className='text-white text-xl' />
              </div>
              <div>
                <h1 className='text-3xl md:text-4xl font-bold bg-linear-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent'>
                  Receptionists Management
                </h1>
                <p className='mt-1 text-gray-600 dark:text-gray-400'>
                  Manage and monitor all receptionist staff
                </p>
              </div>
            </div>

            {/* Stats Cards */}
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mt-6'>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className='bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700'
              >
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm text-gray-600 dark:text-gray-400 font-medium'>
                      Total Staff
                    </p>
                    <p className='text-3xl font-bold text-gray-900 dark:text-white mt-2'>
                      {totalReceptionists}
                    </p>
                  </div>
                  <div className='w-14 h-14 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center'>
                    <FaUserCircle className='text-2xl text-blue-600 dark:text-blue-400' />
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className='bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700'
              >
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm text-gray-600 dark:text-gray-400 font-medium'>
                      Active Now
                    </p>
                    <p className='text-3xl font-bold text-green-600 dark:text-green-400 mt-2'>
                      {activeCount}
                    </p>
                  </div>
                  <div className='w-14 h-14 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center'>
                    <div className='w-3 h-3 bg-green-500 rounded-full animate-pulse' />
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className='bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700'
              >
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm text-gray-600 dark:text-gray-400 font-medium'>
                      On Leave
                    </p>
                    <p className='text-3xl font-bold text-orange-600 dark:text-orange-400 mt-2'>
                      {
                        receptionists.filter(
                          r => r.employmentStatus === 'ON_LEAVE'
                        ).length
                      }
                    </p>
                  </div>
                  <div className='w-14 h-14 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center'>
                    <FaClock className='text-2xl text-orange-600 dark:text-orange-400' />
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Action Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className='bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 mb-6'
          >
            <div className='flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between'>
              <div className='flex-1 w-full lg:max-w-md'>
                <Input
                  isClearable
                  placeholder='Search by name, email, or employee ID...'
                  startContent={<FaSearch className='text-gray-400 text-lg' />}
                  value={searchValue}
                  onClear={onClearSearch}
                  onValueChange={onSearchChange}
                  className='w-full bg-gray-50 dark:bg-gray-900'
                />
              </div>

              <div className='flex gap-3 w-full lg:w-auto'>
                <Button
                  variant='outline'
                  className='flex-1 lg:flex-none border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                >
                  <FaFilter className='w-4 h-4' />
                  <span className='ml-2'>Filter</span>
                </Button>

                <Button
                  variant='outline'
                  className='flex-1 lg:flex-none border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                >
                  <FaDownload className='w-4 h-4' />
                  <span className='ml-2'>Export</span>
                </Button>

                <Button
                  color='primary'
                  onClick={() => (window.location.href = '/receptionist/add')}
                  className='flex-1 lg:flex-none bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg shadow-blue-500/30'
                >
                  <FaPlus className='w-4 h-4' />
                  <span className='ml-2'>Add New</span>
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className='bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden'
          >
            <Table
              aria-label='Receptionists Table'
              className='bg-transparent'
              bottomContent={
                pages > 0 ? (
                  <div className='flex w-full justify-center py-4 border-t border-gray-200 dark:border-gray-700'>
                    <Pagination
                      isCompact
                      showControls
                      color='primary'
                      page={page}
                      total={pages}
                      onChange={onPageChange}
                    />
                  </div>
                ) : null
              }
            >
              <TableHeader>
                {columns.map(column => (
                  <TableColumn key={column.key} allowsSorting={column.sortable}>
                    {column.label}
                  </TableColumn>
                ))}
              </TableHeader>
              <TableBody
                isLoading={loading}
                emptyContent={'No receptionists found'}
              >
                {loading ? (
                  <TableRow>
                    <TableCell>
                      <div className='flex flex-col items-center justify-center py-12'>
                        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4' />
                        <p className='text-gray-600 dark:text-gray-400'>
                          Loading receptionists...
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  receptionists.map((item: IReceptionist) => (
                    <TableRow
                      key={String(item._id)}
                      className='hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-all cursor-pointer'
                    >
                      {columns.map(column => (
                        <TableCell key={column.key}>
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.3 }}
                          >
                            {renderCell(item, column.key)}
                          </motion.div>
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </motion.div>
        </motion.div>
      </div>

      {/* Toast Notifications */}
      <AnimatePresence>
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => onToastClose(toast.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

export default ReceptionistTable;

'use client';
import React, { useCallback, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DoctorProfile } from '@/types/doctors';
import {
  FaEllipsisV,
  FaEye,
  FaEdit,
  FaTrash,
  FaUserMd,
  FaStar,
  FaCheckCircle,
  FaStethoscope,
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

interface DoctorTableProps {
  doctors: DoctorProfile[];
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
  onDelete: (doctorId: string) => void;
  onToastClose: (id: number) => void;
}

const columns = [
  { key: 'name', label: 'Doctor', sortable: true },
  { key: 'specialization', label: 'Specialization', sortable: true },
  { key: 'department', label: 'Department', sortable: true },
  { key: 'experience', label: 'Experience', sortable: true },
  { key: 'consultationFee', label: 'Fee', sortable: true },
  { key: 'rating', label: 'Rating', sortable: true },
  { key: 'actions', label: 'Actions', sortable: false },
];

const DoctorTable: React.FC<DoctorTableProps> = ({
  doctors,
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
  const [hoveredRow, _setHoveredRow] = useState<string | null>(null);

  // Generate a stable key for doctors without IDs
  const getDoctorKey = useCallback((doctor: DoctorProfile, index: number) => {
    return doctor?.id || `doctor-${index}`;
  }, []);

  const renderCell = useCallback(
    (doctor: DoctorProfile, columnKey: string) => {
      // Safe accessor functions
      const getDoctorName = () => doctor?.name || 'Unknown Doctor';
      const getDoctorEmail = () => doctor?.email || 'No email';
      const getInitial = () => {
        const name = getDoctorName();
        return name?.charAt(0)?.toUpperCase() || '?';
      };

      switch (columnKey) {
        case 'name':
          return (
            <div className='flex items-center gap-3'>
              <div className='relative'>
                {doctor?.image ? (
                  <img
                    src={doctor.image}
                    alt={getDoctorName()}
                    className='w-10 h-10 rounded-full object-cover'
                  />
                ) : (
                  <div className='w-10 h-10 rounded-full bg-linear-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold text-sm shadow-md'>
                    {getInitial()}
                  </div>
                )}
                {doctor?.isVerified && (
                  <div className='absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full flex items-center justify-center'>
                    <FaCheckCircle className='text-white text-xs' />
                  </div>
                )}
              </div>
              <div className='flex flex-col'>
                <span className='font-semibold text-gray-900 dark:text-gray-100'>
                  Dr. {getDoctorName()}
                </span>
                <span className='text-xs text-gray-500 dark:text-gray-400'>
                  {getDoctorEmail()}
                </span>
              </div>
            </div>
          );
        case 'specialization':
          return (
            <div className='flex items-center gap-2'>
              <FaStethoscope className='text-blue-500 text-sm' />
              <span className='text-gray-700 dark:text-gray-300'>
                {doctor?.specialization || 'Not specified'}
              </span>
            </div>
          );
        case 'department':
          return (
            <Chip color='default' variant='flat' size='sm'>
              {doctor?.department || 'No department'}
            </Chip>
          );
        case 'experience':
          return (
            <div className='flex items-center gap-2'>
              <FaBriefcase className='text-gray-400 text-sm' />
              <span className='text-gray-700 dark:text-gray-300'>
                {doctor?.experience || 0} years
              </span>
            </div>
          );
        case 'consultationFee':
          return (
            <span className='font-semibold text-green-600 dark:text-green-400'>
              LKR {doctor?.consultationFee?.toLocaleString() || '0'}
            </span>
          );
        case 'rating':
          return doctor?.rating ? (
            <div className='flex items-center gap-1'>
              <FaStar className='text-yellow-500' />
              <span className='font-semibold text-gray-900 dark:text-gray-100'>
                {doctor.rating.average?.toFixed(1) || '0.0'}
              </span>
              <span className='text-xs text-gray-500'>
                ({doctor.rating.count || 0})
              </span>
            </div>
          ) : (
            <span className='text-gray-500'>No ratings</span>
          );
        case 'actions':
          if (!doctor?.id) return null;
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
                        (window.location.href = `/doctors/${doctor.id}`)
                      }
                    >
                      <div className='flex items-center space-x-2'>
                        <FaEye className='w-4 h-4' />
                        <span>View Details</span>
                      </div>
                    </DropdownItem>
                    <DropdownItem
                      onPress={() =>
                        (window.location.href = `/doctors/${doctor.id}/edit`)
                      }
                    >
                      <div className='flex items-center space-x-2'>
                        <FaEdit className='w-4 h-4' />
                        <span>Edit Profile</span>
                      </div>
                    </DropdownItem>
                    <DropdownItem
                      color='danger'
                      onPress={() => doctor.id && onDelete(doctor.id)}
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
          return null;
      }
    },
    [onDelete]
  );

  const totalDoctors = doctors?.length || 0;
  const verifiedCount = doctors?.filter(d => d?.isVerified).length || 0;
  const avgRating =
    doctors?.reduce((acc, d) => acc + (d?.rating?.average || 0), 0) /
      (doctors?.length || 1) || 0;

  // Get the doctors for the current page
  const currentPageDoctors = useMemo(() => {
    return doctors?.slice((page - 1) * 10, page * 10) || [];
  }, [doctors, page]);

  return (
    <div className='min-h-screen bg-linear-to-br from-gray-50 via-blue-50/30 to-purple-50/20 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900'>
      <div className='p-4 md:p-8 max-w-7xl mx-auto'>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className='mb-8'>
            <div className='flex items-center gap-3 mb-3'>
              <div className='w-12 h-12 rounded-2xl bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/30'>
                <FaUserMd className='text-white text-xl' />
              </div>
              <div>
                <h1 className='text-3xl md:text-4xl font-bold bg-linear-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent'>
                  Doctors Management
                </h1>
                <p className='mt-1 text-gray-600 dark:text-gray-400'>
                  Manage and monitor all medical staff
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
                      Total Doctors
                    </p>
                    <p className='text-3xl font-bold text-gray-900 dark:text-white mt-2'>
                      {totalDoctors}
                    </p>
                  </div>
                  <div className='w-14 h-14 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center'>
                    <FaUserMd className='text-2xl text-blue-600 dark:text-blue-400' />
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
                      Verified
                    </p>
                    <p className='text-3xl font-bold text-green-600 dark:text-green-400 mt-2'>
                      {verifiedCount}
                    </p>
                  </div>
                  <div className='w-14 h-14 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center'>
                    <FaCheckCircle className='text-2xl text-green-600 dark:text-green-400' />
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
                      Avg Rating
                    </p>
                    <p className='text-3xl font-bold text-yellow-600 dark:text-yellow-400 mt-2'>
                      {avgRating.toFixed(1)}
                    </p>
                  </div>
                  <div className='w-14 h-14 rounded-xl bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center'>
                    <FaStar className='text-2xl text-yellow-600 dark:text-yellow-400' />
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Search Bar */}
          <div className='mb-6'>
            <Input
              type='text'
              placeholder='Search doctors by name, specialization, or department...'
              value={searchValue}
              onChange={e => onSearchChange(e.target.value)}
              onClear={onClearSearch}
              isClearable
            />
          </div>

          {/* Table */}
          <div className='overflow-x-auto'>
            <Table aria-label='Doctors Table' className='bg-transparent'>
              <TableHeader>
                {columns.map(column => (
                  <TableColumn key={column.key}>{column.label}</TableColumn>
                ))}
              </TableHeader>
              <TableBody isLoading={loading}>
                {currentPageDoctors.length > 0 ? (
                  currentPageDoctors.map((doctor, index) => (
                    <TableRow
                      key={getDoctorKey(doctor, index)}
                      className={
                        hoveredRow === doctor?.id
                          ? 'bg-gray-50 dark:bg-gray-800/50'
                          : ''
                      }
                    >
                      {columns.map(column => (
                        <TableCell key={column.key}>
                          {renderCell(doctor, column.key)}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell>
                      <div className='flex flex-col items-center justify-center text-center py-8'>
                        <FaUserMd className='text-4xl text-gray-400 mb-3' />
                        <p className='text-gray-600 dark:text-gray-400'>
                          No doctors found
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {doctors?.length > 0 && pages > 1 && (
            <div className='mt-6 flex justify-end'>
              <Pagination
                isCompact
                showControls
                color='primary'
                page={page}
                total={pages}
                onChange={onPageChange}
              />
            </div>
          )}
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

export default DoctorTable;

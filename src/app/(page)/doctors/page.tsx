/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { DoctorProfile } from '@/types/doctors';
import DoctorTable from '@/components/Doctor/DoctorTable';
interface SortDescriptor {
  column: string;
  direction: 'ascending' | 'descending';
}

interface ToastMessage {
  id: number;
  message: string;
  type: 'success' | 'error';
}

const DoctorPage = () => {
  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [searchValue, setSearchValue] = useState('');
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: 'hireDate',
    direction: 'descending',
  });
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (message: string, type: 'success' | 'error') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const fetchReceptionists = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/admin/doctor?page=${page}&search=${searchValue}&sortBy=${sortDescriptor.column}&sortOrder=${
          sortDescriptor.direction === 'ascending' ? 'asc' : 'desc'
        }`
      );
      const data = await response.json();
      if (data.success) {
        setDoctors(data.data);
        setPages(data.totalPages);
      } else {
        showToast('Failed to fetch doctors', 'error');
      }
    } catch (error) {
      showToast('An error occurred while fetching doctors', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, searchValue, sortDescriptor]);

  useEffect(() => {
    fetchReceptionists();
  }, [fetchReceptionists]);

  const onSearchChange = (value: string) => {
    setSearchValue(value);
    setPage(1);
  };

  const onClearSearch = () => {
    setSearchValue('');
    setPage(1);
  };

  const onSortChange = (descriptor: SortDescriptor) => {
    setSortDescriptor(descriptor);
  };

  const handleDelete = async (doctorId: string) => {
    if (window.confirm('Are you sure you want to delete this doctor?')) {
      try {
        const response = await fetch(`/api/admin/doctor?id=${doctorId}`, {
          method: 'DELETE',
        });
        const data = await response.json();
        if (data.success) {
          showToast('Receptionist deleted successfully', 'success');
          fetchReceptionists();
        } else {
          showToast(data.error || 'Failed to delete receptionist', 'error');
        }
      } catch (error) {
        showToast('An error occurred while deleting the receptionist', 'error');
      }
    }
  };

  return (
    <DoctorTable
      doctors={doctors}
      page={page}
      pages={pages}
      loading={loading}
      searchValue={searchValue}
      sortDescriptor={sortDescriptor}
      toasts={toasts}
      onPageChange={setPage}
      onSearchChange={onSearchChange}
      onClearSearch={onClearSearch}
      onSortChange={onSortChange}
      onDelete={handleDelete}
      onToastClose={removeToast}
    />
  );
};

export default DoctorPage;

/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { IReceptionist } from '@/models/Receptionist';
import ReceptionistTable from '@/components/receptionist/ReceptionistTable';

interface SortDescriptor {
  column: string;
  direction: 'ascending' | 'descending';
}

interface ToastMessage {
  id: number;
  message: string;
  type: 'success' | 'error';
}

const ReceptionistPage = () => {
  const [receptionists, setReceptionists] = useState<IReceptionist[]>([]);
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
        `/api/admin/receptionist?page=${page}&search=${searchValue}&sortBy=${sortDescriptor.column}&sortOrder=${
          sortDescriptor.direction === 'ascending' ? 'asc' : 'desc'
        }`
      );
      const data = await response.json();
      if (data.success) {
        setReceptionists(data.data);
        setPages(data.totalPages);
      } else {
        showToast('Failed to fetch receptionists', 'error');
      }
    } catch (error) {
      showToast('An error occurred while fetching receptionists', 'error');
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

  const handleDelete = async (receptionistId: string) => {
    if (window.confirm('Are you sure you want to delete this receptionist?')) {
      try {
        const response = await fetch(
          `/api/admin/receptionist?id=${receptionistId}`,
          {
            method: 'DELETE',
          }
        );
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
    <ReceptionistTable
      receptionists={receptionists}
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

export default ReceptionistPage;

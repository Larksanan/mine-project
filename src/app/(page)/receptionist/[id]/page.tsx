/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { IReceptionist } from '@/types/Receptionist';
import ReceptionistDetailCard from '@/components/receptionist/ReceptionistDetailCard';
import { ToastContainer, ToastData } from '@/components/ui/Toast';

const ViewReceptionistPage = () => {
  const [receptionist, setReceptionist] = useState<IReceptionist | null>(null);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<(ToastData & { id: string })[]>([]);
  const { id } = useParams();

  const showToast = useCallback(
    (message: string, type: 'success' | 'error') => {
      const id = Date.now().toString();
      setToasts(prev => [...prev, { id, message, type }]);
    },
    []
  );

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  useEffect(() => {
    const fetchReceptionist = async () => {
      if (!id) return;

      setLoading(true);
      try {
        const response = await fetch(`/api/admin/receptionist/${id}`);

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `Server returned ${response.status}: ${response.statusText}`
          );
        }

        const data = await response.json();

        if (data.success) {
          setReceptionist(data.data);
          showToast('Receptionist details loaded successfully', 'success');
        } else {
          showToast(data.error || 'Failed to fetch receptionist data', 'error');
        }
      } catch (error) {
        showToast(
          'An error occurred while fetching receptionist data',
          'error'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchReceptionist();
  }, [id, showToast]);

  return (
    <>
      <ReceptionistDetailCard receptionist={receptionist} loading={loading} />
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
};

export default ViewReceptionistPage;

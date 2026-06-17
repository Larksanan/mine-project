/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';
import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { DoctorProfile } from '@/types/doctors';
import DoctorDetailCard from '@/components/Doctor/DoctorDetailCard';
import { useToast } from '@/components/ui/Toast';

const ViewDoctorPage = () => {
  const [doctor, setDoctor] = useState<DoctorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { id } = useParams();
  const { showToast, ToastContainer } = useToast();

  useEffect(() => {
    const fetchReceptionist = async () => {
      if (!id) return;

      setLoading(true);
      try {
        const response = await fetch(`/api/admin/doctor/${id}`);
        const data = await response.json();

        if (data.success) {
          setDoctor(data.data);
          showToast('Doctor details loaded successfully', 'success');
        } else {
          showToast(data.error || 'Failed to fetch doctor data', 'error');
        }
      } catch (error) {
        showToast('An error occurred while fetching doctor data', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchReceptionist();
  }, [id, showToast]);

  return (
    <>
      <DoctorDetailCard doctor={doctor} loading={loading} />
      <ToastContainer />
    </>
  );
};

export default ViewDoctorPage;

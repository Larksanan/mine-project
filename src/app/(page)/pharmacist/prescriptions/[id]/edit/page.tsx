/* eslint-disable @typescript-eslint/no-explicit-any */
// Status update functionality with Toast integration
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiArrowLeft,
  FiSave,
  FiRefreshCw,
  FiAlertCircle,
} from 'react-icons/fi';
import Loading from '@/components/Loading';
import ErrorComponent from '@/components/Error';
import { useToast } from '../../../../../../components/ui/Toast';

interface Prescription {
  _id: string;
  prescriptionNumber: string;
  diagnosis: string;
  medications: Medication[];
  notes: string;
  startDate: string;
  endDate?: string;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED';
}

interface Medication {
  _id?: string;
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  quantity: number;
  refills: number;
}

type Status = 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED';

const STATUS_OPTIONS: { value: Status; label: string; color: string }[] = [
  {
    value: 'ACTIVE',
    label: 'Active',
    color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  },
  {
    value: 'COMPLETED',
    label: 'Completed',
    color: 'text-blue-700 bg-blue-50 border-blue-200',
  },
  {
    value: 'EXPIRED',
    label: 'Expired',
    color: 'text-amber-700 bg-amber-50 border-amber-200',
  },
  {
    value: 'CANCELLED',
    label: 'Cancelled',
    color: 'text-red-700 bg-red-50 border-red-200',
  },
];

function Label({
  children,
  required,
}: {
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label className='block text-xs font-semibold uppercase tracking-wide text-gray-500'>
      {children}
      {required && <span className='ml-0.5 text-red-400'>*</span>}
    </label>
  );
}

function Card({
  title,
  children,
  className = '',
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-gray-200 bg-white p-5 shadow-sm ${className}`}
    >
      {title && (
        <h2 className='mb-4 text-xs font-semibold uppercase tracking-widest text-gray-400'>
          {title}
        </h2>
      )}
      {children}
    </div>
  );
}

export default function UpdatePrescriptionStatusPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const { showToast, ToastContainer } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  /* form state */
  const [prescriptionNumber, setPrescriptionNumber] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [status, setStatus] = useState<Status>('ACTIVE');

  /* ── Fetch ── */
  const fetchPrescription = useCallback(async () => {
    try {
      setLoading(true);
      setFetchError(null);
      const res = await fetch(`/api/doctor/prescriptions/pharmacist/${id}`);
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.error || 'Failed to load prescription');
      }
      const json = await res.json();
      if (!json.success)
        throw new Error(json.error || 'Failed to load prescription');

      const rx: Prescription = json.data;
      setPrescriptionNumber(rx.prescriptionNumber);
      setDiagnosis(rx.diagnosis);
      setStatus(rx.status);
    } catch (e: any) {
      setFetchError(e.message || 'Failed to load prescription');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPrescription();
  }, [fetchPrescription]);

  /* ── Submit ── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);
    setSuccessMsg(null);

    try {
      setSaving(true);
      const payload = {
        status,
      };

      const res = await fetch(`/api/doctor/prescriptions/pharmacist/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.error || 'Failed to update prescription status');
      }

      const json = await res.json();
      if (!json.success)
        throw new Error(json.error || 'Failed to update prescription status');

      setSuccessMsg('Prescription status updated successfully.');

      // Show toast notification
      showToast(
        `Prescription status updated to ${status} successfully!`,
        'success',
        { duration: 3000 }
      );

      setTimeout(() => {
        router.push(`/pharmacist/prescriptions/${id}`);
      }, 2000);
    } catch (e: any) {
      setSaveError(e.message || 'Failed to update prescription status');

      // Show error toast
      showToast(e.message || 'Failed to update prescription status', 'error', {
        duration: 4000,
      });

      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSaving(false);
    }
  };

  /* ── Render ── */
  if (loading) return <Loading />;
  if (fetchError) return <ErrorComponent message={fetchError} />;

  return (
    <div className='min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8'>
      {/* Toast Container */}
      <ToastContainer />

      <div className='mx-auto max-w-3xl'>
        {/* ── Back ── */}
        <button
          onClick={() => router.back()}
          className='mb-6 flex items-center gap-1.5 text-sm font-medium text-gray-500 transition hover:text-gray-800'
        >
          <FiArrowLeft className='h-4 w-4' />
          Back
        </button>

        {/* ── Page title ── */}
        <div className='mb-6'>
          <h1 className='text-2xl font-bold text-gray-900'>
            Update Prescription Status
          </h1>
          <p className='mt-1 font-mono text-sm text-gray-400'>
            {prescriptionNumber}
          </p>
          <p className='mt-1 text-sm text-gray-600'>Diagnosis: {diagnosis}</p>
        </div>

        {/* ── Alerts ── */}
        <AnimatePresence>
          {saveError && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className='mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700'
            >
              <FiAlertCircle className='mt-0.5 h-4 w-4 shrink-0' />
              {saveError}
            </motion.div>
          )}
          {successMsg && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className='mb-5 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700'
            >
              ✓ {successMsg}
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className='space-y-5'>
          {/* ── Status ── */}
          <Card title='Update Status'>
            <div className='space-y-4'>
              <div>
                <Label required>Current Status</Label>
                <div className='mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4'>
                  {STATUS_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      type='button'
                      onClick={() => setStatus(opt.value)}
                      className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${
                        status === opt.value
                          ? opt.color + ' ring-2 ring-offset-1 ring-blue-400'
                          : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className='rounded-xl bg-blue-50 p-3 text-sm text-blue-700'>
                <p className='flex items-start gap-2'>
                  <span className='mt-0.5'>ℹ️</span>
                  Changing the status will update the prescription record.
                  Patients will be notified of status changes.
                </p>
              </div>
            </div>
          </Card>

          {/* ── Actions ── */}
          <div className='flex flex-col-reverse gap-3 sm:flex-row sm:justify-end'>
            <button
              type='button'
              onClick={() => router.back()}
              disabled={saving}
              className='rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50'
            >
              Cancel
            </button>
            <button
              type='submit'
              disabled={saving}
              className='flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60'
            >
              {saving ? (
                <>
                  <FiRefreshCw className='h-4 w-4 animate-spin' />
                  Updating…
                </>
              ) : (
                <>
                  <FiSave className='h-4 w-4' />
                  Update Status
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect, useCallback, type FormEvent } from 'react';

interface PatientInfo {
  _id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  nic?: string;
}

interface DeliveryInfo {
  _id: string;
  status: string;
  address?: {
    line1: string;
    line2?: string;
    city: string;
    postalCode?: string;
    phone: string;
  };
  trackingNumber?: string;
  deliveryFee?: number;
}

interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
  quantity: number;
  refills: number;
}

interface PrescriptionRow {
  _id: string;
  prescriptionNumber: string;
  diagnosis: string;
  status: string;
  pharmaciesStatus: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'FULFILLED';
  pharmaciesSentAt?: string;
  attachmentUrl?: string;
  medications: Medication[];
  patientId: PatientInfo;
  delivery?: DeliveryInfo | null;
}

interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

const STATUS_FILTERS = [
  'ALL',
  'PENDING',
  'ACCEPTED',
  'REJECTED',
  'FULFILLED',
] as const;

const STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-[#FBF1E6] text-[#8A5A1E]',
  ACCEPTED: 'bg-[#136659]/10 text-[#136659]',
  REJECTED: 'bg-[#FBEAEA] text-[#B23B3B]',
  FULFILLED: 'bg-[#EAF6EE] text-[#1E7A45]',
};

export default function PharmacistPrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<PrescriptionRow[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '10',
      });
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (search.trim()) params.set('search', search.trim());

      const res = await fetch(
        `/api/patients/prescriptions/pharmacist?${params.toString()}`
      );
      const json = await res.json();
      if (json.success) {
        setPrescriptions(json.data);
        setPagination(json.pagination);
      } else {
        setError(json.error || 'Failed to load prescriptions');
      }
    } catch {
      setError('Could not reach the server');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search]);

  useEffect(() => {
    load();
  }, [load]);

  async function updateStatus(
    id: string,
    status: 'ACCEPTED' | 'REJECTED' | 'FULFILLED'
  ) {
    setActioningId(id);
    setError(null);
    try {
      const res = await fetch(
        `/api/patients/prescriptions/pharmacist/${id}/status`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        }
      );
      const json = await res.json();
      if (json.success) {
        load();
      } else {
        setError(json.error || 'Failed to update prescription');
      }
    } catch {
      setError('Could not reach the server');
    } finally {
      setActioningId(null);
    }
  }

  function handleDownload(id: string) {
    window.open(
      `/api/patients/prescriptions/pharmacist/${id}/download`,
      '_blank'
    );
  }

  function handleSearchSubmit(e: FormEvent) {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  }

  return (
    <div className='min-h-screen bg-[#F6F7F5] px-4 py-10 sm:py-14'>
      <div className='mx-auto max-w-5xl'>
        {/* Header */}
        <div className='mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between'>
          <div>
            <span className='inline-block rounded-full bg-[#136659]/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#136659]'>
              Pharmacy
            </span>
            <h1 className='mt-3 text-2xl font-semibold tracking-tight text-[#16231F] sm:text-3xl'>
              Incoming prescriptions
            </h1>
            <p className='mt-1 text-sm text-[#5B6660]'>
              Prescriptions patients have sent to your pharmacy.
            </p>
          </div>

          <form onSubmit={handleSearchSubmit} className='flex gap-2'>
            <input
              type='text'
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder='Search by Rx number or diagnosis'
              className='w-56 rounded-lg border border-[#E1E4E0] bg-white px-3 py-2 text-sm text-[#16231F] outline-none placeholder:text-[#9CA39E] focus:border-[#136659] focus:ring-2 focus:ring-[#136659]/20'
            />
            <button
              type='submit'
              className='rounded-lg border border-[#E1E4E0] bg-white px-3 py-2 text-sm font-medium text-[#16231F] transition hover:border-[#136659] hover:text-[#136659]'
            >
              Search
            </button>
          </form>
        </div>

        {/* Status filter tabs */}
        <div className='mb-4 flex flex-wrap gap-2'>
          {STATUS_FILTERS.map(s => (
            <button
              key={s}
              type='button'
              onClick={() => {
                setStatusFilter(s);
                setPage(1);
              }}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                statusFilter === s
                  ? 'bg-[#136659] text-white'
                  : 'border border-[#E1E4E0] bg-white text-[#5B6660] hover:border-[#136659]'
              }`}
            >
              {s === 'ALL' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {error && (
          <div className='mb-4 rounded-lg border border-[#B23B3B]/20 bg-[#FBEAEA] px-4 py-3 text-sm text-[#B23B3B]'>
            {error}
          </div>
        )}

        {/* List */}
        <div className='rounded-2xl border border-[#E1E4E0] bg-white shadow-sm'>
          {loading ? (
            <p className='py-12 text-center text-sm text-[#8A938C]'>
              Loading prescriptions…
            </p>
          ) : prescriptions.length === 0 ? (
            <p className='py-12 text-center text-sm text-[#8A938C]'>
              No prescriptions match this view.
            </p>
          ) : (
            <ul className='divide-y divide-[#E1E4E0]'>
              {prescriptions.map(rx => {
                const isExpanded = expandedId === rx._id;
                const isActioning = actioningId === rx._id;
                const patientName =
                  [rx.patientId?.firstName, rx.patientId?.lastName]
                    .filter(Boolean)
                    .join(' ') || 'Unknown patient';

                return (
                  <li key={rx._id} className='p-5'>
                    <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
                      <button
                        type='button'
                        onClick={() =>
                          setExpandedId(isExpanded ? null : rx._id)
                        }
                        className='flex flex-1 items-center gap-4 text-left'
                      >
                        <div className='min-w-0'>
                          <div className='flex items-center gap-2'>
                            <span className='font-mono text-xs tracking-wide text-[#8A938C]'>
                              {rx.prescriptionNumber}
                            </span>
                            <span
                              className={`rounded-md px-2 py-0.5 text-xs font-semibold ${
                                STATUS_STYLES[rx.pharmaciesStatus] ||
                                'bg-[#EFEBE2] text-[#6B5B3E]'
                              }`}
                            >
                              {rx.pharmaciesStatus}
                            </span>
                          </div>
                          <p className='mt-1 truncate text-sm font-medium text-[#16231F]'>
                            {patientName}
                          </p>
                          <p className='truncate text-xs text-[#8A938C]'>
                            {rx.diagnosis}
                          </p>
                        </div>
                      </button>

                      <div className='flex flex-wrap items-center gap-2'>
                        {rx.attachmentUrl && (
                          <button
                            type='button'
                            onClick={() => handleDownload(rx._id)}
                            className='rounded-lg border border-[#E1E4E0] px-3 py-1.5 text-xs font-medium text-[#16231F] transition hover:border-[#136659] hover:text-[#136659]'
                          >
                            Download
                          </button>
                        )}

                        {rx.pharmaciesStatus === 'PENDING' && (
                          <>
                            <button
                              type='button'
                              disabled={isActioning}
                              onClick={() => updateStatus(rx._id, 'ACCEPTED')}
                              className='rounded-lg bg-[#136659] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#0F5048] disabled:opacity-50'
                            >
                              Accept
                            </button>
                            <button
                              type='button'
                              disabled={isActioning}
                              onClick={() => updateStatus(rx._id, 'REJECTED')}
                              className='rounded-lg border border-[#B23B3B]/30 px-3 py-1.5 text-xs font-semibold text-[#B23B3B] transition hover:bg-[#FBEAEA] disabled:opacity-50'
                            >
                              Reject
                            </button>
                          </>
                        )}

                        {rx.pharmaciesStatus === 'ACCEPTED' && (
                          <button
                            type='button'
                            disabled={isActioning}
                            onClick={() => updateStatus(rx._id, 'FULFILLED')}
                            className='rounded-lg bg-[#136659] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#0F5048] disabled:opacity-50'
                          >
                            Mark fulfilled
                          </button>
                        )}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className='mt-4 grid gap-4 rounded-xl bg-[#F6F7F5] p-4 sm:grid-cols-2'>
                        <div>
                          <h3 className='text-xs font-semibold uppercase tracking-wide text-[#8A938C]'>
                            Patient
                          </h3>
                          <p className='mt-1 text-sm text-[#16231F]'>
                            {patientName}
                          </p>
                          <p className='text-xs text-[#8A938C]'>
                            {rx.patientId?.phone}
                          </p>
                          <p className='text-xs text-[#8A938C]'>
                            {rx.patientId?.email}
                          </p>
                        </div>

                        <div>
                          <h3 className='text-xs font-semibold uppercase tracking-wide text-[#8A938C]'>
                            Delivery
                          </h3>
                          {rx.delivery ? (
                            <>
                              <p className='mt-1 text-sm text-[#16231F]'>
                                {rx.delivery.address?.line1}
                                {rx.delivery.address?.line2
                                  ? `, ${rx.delivery.address.line2}`
                                  : ''}
                              </p>
                              <p className='text-xs text-[#8A938C]'>
                                {rx.delivery.address?.city} ·{' '}
                                {rx.delivery.address?.phone}
                              </p>
                              <p className='mt-1 font-mono text-xs text-[#8A938C]'>
                                {rx.delivery.trackingNumber}
                              </p>
                            </>
                          ) : (
                            <p className='mt-1 text-sm text-[#8A938C]'>
                              No delivery on file
                            </p>
                          )}
                        </div>

                        <div className='sm:col-span-2'>
                          <h3 className='text-xs font-semibold uppercase tracking-wide text-[#8A938C]'>
                            Medications
                          </h3>
                          {rx.medications?.length ? (
                            <ul className='mt-1 space-y-1'>
                              {rx.medications.map((med, i) => (
                                <li key={i} className='text-sm text-[#16231F]'>
                                  {med.name} — {med.dosage}, {med.frequency},{' '}
                                  {med.duration}
                                  {med.refills
                                    ? ` (${med.refills} refills)`
                                    : ''}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className='mt-1 text-sm text-[#8A938C]'>
                              No structured medication list — see attached file.
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className='mt-4 flex items-center justify-between text-sm text-[#5B6660]'>
            <span>
              Page {pagination.page} of {pagination.totalPages} ·{' '}
              {pagination.total} total
            </span>
            <div className='flex gap-2'>
              <button
                type='button'
                disabled={!pagination.hasPrev}
                onClick={() => setPage(p => p - 1)}
                className='rounded-lg border border-[#E1E4E0] bg-white px-3 py-1.5 text-xs font-medium text-[#16231F] disabled:opacity-40'
              >
                Previous
              </button>
              <button
                type='button'
                disabled={!pagination.hasNext}
                onClick={() => setPage(p => p + 1)}
                className='rounded-lg border border-[#E1E4E0] bg-white px-3 py-1.5 text-xs font-medium text-[#16231F] disabled:opacity-40'
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

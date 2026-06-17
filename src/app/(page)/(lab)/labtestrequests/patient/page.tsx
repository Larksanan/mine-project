/* eslint-disable no-undef */
'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiPlus as Plus,
  FiSearch as Search,
  FiFilter as Filter,
  FiClock as Clock,
  FiCalendar as Calendar,
  FiUser as User,
  FiActivity as Activity,
  FiCheckCircle as CheckCircle,
  FiXCircle as XCircle,
  FiAlertCircle as AlertCircle,
  FiRefreshCw as Refresh,
  FiChevronLeft as ChevronLeft,
  FiChevronRight as ChevronRight,
  FiFileText as FileText,
} from 'react-icons/fi';
import Loading from '@/components/ui/Loading';
import Toast from '@/components/ui/Toast';

type TestStatus =
  | 'REQUESTED'
  | 'SAMPLE_COLLECTED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'VERIFIED'
  | 'CANCELLED';

type Priority = 'LOW' | 'NORMAL' | 'HIGH' | 'STAT';

interface LabTestRequest {
  _id: string;
  status: TestStatus;
  priority: Priority;
  requestedDate: string;
  scheduledDate?: string;
  completedDate?: string;
  notes?: string;
  results?: string;
  createdAt: string;
  updatedAt: string;
  doctor: {
    id: string;
    name: string;
    email: string;
    specialization?: string;
  } | null;
  labTechnician: { id: string; name: string; email: string } | null;
  test: { id: string; name: string; description: string; price: number } | null;
  appointmentType?: string;
  reason?: string;
  timeSlot?: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface ApiResponse {
  success: boolean;
  data: LabTestRequest[];
  patient: { id: string; name: string; email: string };
  pagination: Pagination;
}

const STATUS_CONFIG: Record<
  TestStatus,
  { label: string; color: string; bg: string; border: string; icon: string }
> = {
  REQUESTED: {
    label: 'Requested',
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    icon: '⏳',
  },
  SAMPLE_COLLECTED: {
    label: 'Sample Collected',
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    icon: '🧫',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    color: 'text-violet-700',
    bg: 'bg-violet-50',
    border: 'border-violet-200',
    icon: '🔬',
  },
  COMPLETED: {
    label: 'Completed',
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    icon: '✅',
  },
  VERIFIED: {
    label: 'Verified',
    color: 'text-teal-700',
    bg: 'bg-teal-50',
    border: 'border-teal-200',
    icon: '✔️',
  },
  CANCELLED: {
    label: 'Cancelled',
    color: 'text-red-700',
    bg: 'bg-red-50',
    border: 'border-red-200',
    icon: '❌',
  },
};

const PRIORITY_CONFIG: Record<
  Priority,
  { label: string; color: string; dot: string }
> = {
  LOW: { label: 'Low', color: 'text-slate-500', dot: 'bg-slate-400' },
  NORMAL: { label: 'Normal', color: 'text-blue-600', dot: 'bg-blue-400' },
  HIGH: { label: 'High', color: 'text-orange-600', dot: 'bg-orange-400' },
  STAT: { label: 'STAT', color: 'text-red-600', dot: 'bg-red-500' },
};

const TYPE_ICONS: Record<string, string> = {
  BLOOD_TEST: '🩸',
  URINE_TEST: '💧',
  XRAY: '🩻',
  MRI: '🧠',
  CT_SCAN: '📊',
  ULTRASOUND: '👶',
  ECG: '❤️',
  OTHER: '📋',
  LAB_TEST: '🧪',
};

const STATUS_FILTERS = [
  { value: 'ALL', label: 'All' },
  { value: 'REQUESTED', label: 'Requested' },
  { value: 'SAMPLE_COLLECTED', label: 'Sample Collected' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'VERIFIED', label: 'Verified' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function StatusBadge({ status }: { status: TestStatus }) {
  const c = STATUS_CONFIG[status];
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${c.color} ${c.bg} ${c.border}`}
    >
      <span>{c.icon}</span>
      {c.label}
    </span>
  );
}

function PriorityDot({ priority }: { priority: Priority }) {
  const c = PRIORITY_CONFIG[priority];
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium ${c.color}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}

function RequestCard({
  request,
  index,
}: {
  request: LabTestRequest;
  index: number;
}) {
  const [open, setOpen] = useState(false);
  const icon = TYPE_ICONS[request.appointmentType ?? ''] ?? '🧪';
  const title =
    request.test?.name ??
    request.appointmentType?.replace(/_/g, ' ') ??
    'Lab Test';

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.055, duration: 0.3 }}
      className='bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow'
    >
      <div className='px-5 py-4 flex items-start gap-3'>
        {/* Icon */}
        <div className='flex-shrink-0 w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-2xl'>
          {icon}
        </div>

        {/* Body */}
        <div className='flex-1 min-w-0'>
          <div className='flex items-start justify-between gap-2'>
            <div>
              <p className='font-semibold text-slate-800 text-sm capitalize'>
                {title}
              </p>
              <p className='text-xs text-slate-400'>
                #{request._id.slice(-8).toUpperCase()}
              </p>
            </div>
            {request.test?.price != null && (
              <span className='text-sm font-bold text-slate-700 flex-shrink-0'>
                LKR {request.test.price.toLocaleString()}
              </span>
            )}
          </div>

          {/* Badges */}
          <div className='flex items-center gap-2 mt-2 flex-wrap'>
            <StatusBadge status={request.status} />
            <PriorityDot priority={request.priority} />
          </div>

          {/* Dates */}
          <div className='flex flex-wrap gap-x-4 gap-y-1 mt-2'>
            <span className='flex items-center gap-1 text-xs text-slate-400'>
              <Clock className='w-3 h-3' />
              Requested: {formatDate(request.requestedDate)}
            </span>
            {request.scheduledDate && (
              <span className='flex items-center gap-1 text-xs text-slate-400'>
                <Calendar className='w-3 h-3' />
                Scheduled: {formatDateTime(request.scheduledDate)}
                {request.timeSlot && (
                  <span className='ml-1 px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded text-xs font-medium'>
                    {request.timeSlot}
                  </span>
                )}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Toggle */}
      <div className='px-5 pb-3'>
        <button
          onClick={() => setOpen(v => !v)}
          className='text-xs text-indigo-500 hover:text-indigo-700 font-medium transition-colors'
        >
          {open ? '▲ Hide details' : '▼ Show details'}
        </button>
      </div>

      {/* Expanded */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className='overflow-hidden'
          >
            <div className='border-t border-slate-100 bg-slate-50/70 px-5 py-4 grid grid-cols-1 sm:grid-cols-2 gap-4'>
              {request.reason && (
                <div>
                  <p className='text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1'>
                    Reason
                  </p>
                  <p className='text-sm text-slate-700'>{request.reason}</p>
                </div>
              )}
              {request.notes && request.notes !== request.reason && (
                <div>
                  <p className='text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1'>
                    Notes
                  </p>
                  <p className='text-sm text-slate-700'>{request.notes}</p>
                </div>
              )}
              {request.doctor && (
                <div>
                  <p className='text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1'>
                    Doctor
                  </p>
                  <p className='text-sm text-slate-700 flex items-center gap-1.5'>
                    <User className='w-3.5 h-3.5 text-slate-400' />
                    {request.doctor.name}
                    {request.doctor.specialization && (
                      <span className='text-slate-400'>
                        · {request.doctor.specialization}
                      </span>
                    )}
                  </p>
                </div>
              )}
              {request.labTechnician && (
                <div>
                  <p className='text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1'>
                    Lab Technician
                  </p>
                  <p className='text-sm text-slate-700 flex items-center gap-1.5'>
                    <Activity className='w-3.5 h-3.5 text-slate-400' />
                    {request.labTechnician.name}
                  </p>
                </div>
              )}
              {request.test?.description && (
                <div className='sm:col-span-2'>
                  <p className='text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1'>
                    Test Description
                  </p>
                  <p className='text-sm text-slate-700'>
                    {request.test.description}
                  </p>
                </div>
              )}
              {request.results && (
                <div className='sm:col-span-2'>
                  <p className='text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1'>
                    Results
                  </p>
                  <p className='text-sm text-slate-700 whitespace-pre-line'>
                    {request.results}
                  </p>
                </div>
              )}
              {request.completedDate && (
                <div>
                  <p className='text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1'>
                    Completed
                  </p>
                  <p className='text-sm text-emerald-600'>
                    {formatDate(request.completedDate)}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function PatientLabTestRequestsPage() {
  const [data, setData] = useState<LabTestRequest[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [patient, setPatient] = useState<{
    name: string;
    email: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({ show: false, message: '', type: 'info' });

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(page),
        limit: '10',
        ...(statusFilter !== 'ALL' && { status: statusFilter }),
        ...(search && { search }),
      });
      const res = await fetch(`/api/lab/lab-test-requests/patient?${params}`);
      const json: ApiResponse = await res.json();
      if (!json.success) throw new Error('Failed to load');
      setData(json.data);
      setPagination(json.pagination);
      setPatient(json.patient);
    } catch {
      setToast({
        show: true,
        message: 'Failed to load lab test requests',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const total = pagination?.total ?? 0;
  const pending = data.filter(d =>
    ['REQUESTED', 'SAMPLE_COLLECTED'].includes(d.status)
  ).length;
  const inProg = data.filter(d => d.status === 'IN_PROGRESS').length;
  const done = data.filter(d =>
    ['COMPLETED', 'VERIFIED'].includes(d.status)
  ).length;

  return (
    <div className='min-h-screen bg-slate-50'>
      {/* Header */}
      <header className='bg-white border-b border-slate-200 sticky top-0 z-20'>
        <div className='max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4'>
          <div className='flex items-center gap-3'>
            <div className='w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center'>
              <span className='text-lg'>🧪</span>
            </div>
            <div>
              <h1 className='text-base font-bold text-slate-800 leading-tight'>
                Lab Test Requests
              </h1>
              {patient && (
                <p className='text-xs text-slate-400'>{patient.name}</p>
              )}
            </div>
          </div>
          <Link
            href='/labtestrequests/patient/create'
            className='flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors'
          >
            <Plus className='w-4 h-4' />
            <span className='hidden sm:inline'>Book Test</span>
          </Link>
        </div>
      </header>

      <main className='max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-5'>
        {/* Stats */}
        <div className='grid grid-cols-2 sm:grid-cols-4 gap-3'>
          {[
            {
              label: 'Total',
              value: total,
              icon: <FileText className='w-5 h-5 text-indigo-500' />,
              border: 'border-indigo-100',
            },
            {
              label: 'Pending',
              value: pending,
              icon: <Clock className='w-5 h-5 text-amber-500' />,
              border: 'border-amber-100',
            },
            {
              label: 'In Progress',
              value: inProg,
              icon: <Activity className='w-5 h-5 text-violet-500' />,
              border: 'border-violet-100',
            },
            {
              label: 'Completed',
              value: done,
              icon: <CheckCircle className='w-5 h-5 text-emerald-500' />,
              border: 'border-emerald-100',
            },
          ].map(s => (
            <div
              key={s.label}
              className={`bg-white rounded-2xl border ${s.border} shadow-sm p-4 flex items-center gap-3`}
            >
              <div className='w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center'>
                {s.icon}
              </div>
              <div>
                <p className='text-xl font-bold text-slate-800'>{s.value}</p>
                <p className='text-xs text-slate-500'>{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Search + Filters */}
        <div className='flex flex-col sm:flex-row gap-3'>
          <form onSubmit={handleSearch} className='relative flex-1'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none' />
            <input
              type='text'
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder='Search by test name or notes…'
              className='w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white'
            />
          </form>
          <div className='flex items-center gap-2 overflow-x-auto'>
            <Filter className='w-4 h-4 text-slate-400 flex-shrink-0' />
            {STATUS_FILTERS.map(f => (
              <button
                key={f.value}
                onClick={() => {
                  setStatusFilter(f.value);
                  setPage(1);
                }}
                className={`flex-shrink-0 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                  statusFilter === f.value
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-slate-600 border border-slate-200 hover:border-indigo-300'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div className='flex justify-center py-20'>
            <Loading />
          </div>
        ) : data.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className='flex flex-col items-center py-24 text-center'
          >
            <div className='w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-3xl mb-4'>
              🧪
            </div>
            <h3 className='text-lg font-semibold text-slate-700 mb-1'>
              No requests found
            </h3>
            <p className='text-sm text-slate-400 mb-6'>
              {statusFilter !== 'ALL' || search
                ? 'Try changing your filters.'
                : "You haven't booked any lab tests yet."}
            </p>
            {statusFilter === 'ALL' && !search && (
              <Link
                href='/patient/book-lab-test'
                className='flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors'
              >
                <Plus className='w-4 h-4' />
                Book Your First Test
              </Link>
            )}
          </motion.div>
        ) : (
          <div className='space-y-3'>
            {data.map((req, i) => (
              <RequestCard key={req._id} request={req} index={i} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className='flex items-center justify-between pt-1'>
            <p className='text-xs text-slate-500'>
              {(pagination.page - 1) * pagination.limit + 1}–
              {Math.min(pagination.page * pagination.limit, pagination.total)}{' '}
              of {pagination.total}
            </p>
            <div className='flex items-center gap-2'>
              <button
                onClick={() => setPage(p => p - 1)}
                disabled={!pagination.hasPrev}
                className='p-2 rounded-xl border border-slate-200 bg-white disabled:opacity-40 hover:border-indigo-300 transition-colors'
              >
                <ChevronLeft className='w-4 h-4' />
              </button>
              <span className='text-xs font-semibold text-slate-700'>
                {pagination.page} / {pagination.totalPages}
              </span>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={!pagination.hasNext}
                className='p-2 rounded-xl border border-slate-200 bg-white disabled:opacity-40 hover:border-indigo-300 transition-colors'
              >
                <ChevronRight className='w-4 h-4' />
              </button>
            </div>
          </div>
        )}
      </main>

      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(p => ({ ...p, show: false }))}
        />
      )}
    </div>
  );
}

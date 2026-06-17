/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Loading from '../../../components/Loading';
import Error from '../../../components/Error';
import {
  FiUsers,
  FiCalendar,
  FiStar,
  FiTrendingUp,
  FiTrendingDown,
  FiUserCheck,
  FiPlus,
  FiDownload,
  FiFilter,
} from 'react-icons/fi';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

// ── Types ────────────────────────────────────────────────────────────────────

export enum ShiftType {
  MORNING = 'MORNING',
  EVENING = 'EVENING',
  NIGHT = 'NIGHT',
  FULL_DAY = 'FULL_DAY',
}

export enum EmploymentType {
  FULL_TIME = 'FULL_TIME',
  PART_TIME = 'PART_TIME',
  CONTRACT = 'CONTRACT',
  INTERN = 'INTERN',
}

export enum EmploymentStatus {
  ACTIVE = 'ACTIVE',
  ON_LEAVE = 'ON_LEAVE',
  SUSPENDED = 'SUSPENDED',
  TERMINATED = 'TERMINATED',
}

export enum PaymentFrequency {
  WEEKLY = 'WEEKLY',
  BI_WEEKLY = 'BI_WEEKLY',
  MONTHLY = 'MONTHLY',
}

export const SHIFT_TIMES: Record<ShiftType, { start: string; end: string }> = {
  [ShiftType.MORNING]: { start: '06:00', end: '14:00' },
  [ShiftType.EVENING]: { start: '14:00', end: '22:00' },
  [ShiftType.NIGHT]: { start: '22:00', end: '06:00' },
  [ShiftType.FULL_DAY]: { start: '08:00', end: '17:00' },
};

export interface IUser {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  image?: string;
  role: string;
  nic?: string;
  department?: string;
}

export interface ISalary {
  basic: number;
  allowances?: number;
  deductions?: number;
  currency?: string;
  paymentFrequency: PaymentFrequency;
}

export interface IPerformanceMetrics {
  averageCheckInTime?: number;
  averageAppointmentTime?: number;
  patientSatisfactionScore?: number;
  totalAppointmentsHandled?: number;
  errorRate?: number;
}

export interface IPermissions {
  canManageAppointments: boolean;
  canManagePatients: boolean;
  canManageBilling: boolean;
  canViewReports: boolean;
  canManageInventory: boolean;
  canHandleEmergency: boolean;
  canAccessMedicalRecords: boolean;
  canManagePrescriptions: boolean;
}

export interface IReceptionist {
  _id: string;
  user: IUser;
  employeeId: string;
  shift: ShiftType;
  workSchedule?: Record<
    string,
    { start: string; end: string; active: boolean }
  >;
  department: string;
  assignedDoctor?: IUser;
  maxAppointmentsPerDay: number;
  currentAppointmentsCount?: number;
  skills: string[];
  languages: string[];
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
    email?: string;
  };
  employmentStatus: EmploymentStatus;
  employmentType: EmploymentType;
  hireDate: Date | string;
  terminationDate?: Date | string;
  salary: ISalary;
  performanceMetrics?: IPerformanceMetrics;
  permissions?: IPermissions;
  trainingRecords?: unknown[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  isAvailable?: boolean;
}

// ── Chart data ────────────────────────────────────────────────────────────────

const appointmentTrendData = [
  { day: 'Mon', appointments: 128, checkIns: 110 },
  { day: 'Tue', appointments: 145, checkIns: 130 },
  { day: 'Wed', appointments: 132, checkIns: 120 },
  { day: 'Thu', appointments: 160, checkIns: 148 },
  { day: 'Fri', appointments: 142, checkIns: 135 },
  { day: 'Sat', appointments: 98, checkIns: 88 },
  { day: 'Sun', appointments: 75, checkIns: 68 },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<EmploymentStatus, string> = {
  [EmploymentStatus.ACTIVE]: 'bg-green-50 text-green-800',
  [EmploymentStatus.ON_LEAVE]: 'bg-amber-50 text-amber-800',
  [EmploymentStatus.SUSPENDED]: 'bg-orange-50 text-orange-800',
  [EmploymentStatus.TERMINATED]: 'bg-red-50 text-red-800',
};

const SHIFT_STYLES: Record<ShiftType, string> = {
  [ShiftType.MORNING]: 'bg-blue-50 text-blue-800',
  [ShiftType.EVENING]: 'bg-amber-50 text-amber-800',
  [ShiftType.NIGHT]: 'bg-purple-50 text-purple-800',
  [ShiftType.FULL_DAY]: 'bg-green-50 text-green-800',
};

function StatusBadge({ status }: { status: EmploymentStatus }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${STATUS_STYLES[status]}`}
    >
      {status.replace('_', ' ')}
    </span>
  );
}

function ShiftBadge({ shift }: { shift: ShiftType }) {
  const label =
    shift === ShiftType.FULL_DAY
      ? 'Full day'
      : shift.charAt(0) + shift.slice(1).toLowerCase();
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${SHIFT_STYLES[shift]}`}
    >
      {label}
    </span>
  );
}

function StarRating({ score }: { score: number }) {
  const full = Math.round(score);
  return (
    <span className='flex items-center gap-1'>
      <span className='text-amber-500 text-xs'>
        {'★'.repeat(full)}
        {'☆'.repeat(5 - full)}
      </span>
      <span className='text-xs text-gray-500'>{score.toFixed(1)}</span>
    </span>
  );
}

function MetricCard({
  icon,
  label,
  value,
  sub,
  trend,
}: {
  // eslint-disable-next-line no-undef
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  trend?: 'up' | 'down';
}) {
  return (
    <div className='bg-gray-50 rounded-lg p-4'>
      <div className='flex items-center gap-1.5 text-xs text-gray-500 mb-1.5'>
        {icon}
        {label}
      </div>
      <div className='text-2xl font-medium text-gray-900'>{value}</div>
      {sub && (
        <div className='flex items-center gap-1 mt-1 text-xs text-gray-500'>
          {trend === 'up' && (
            <FiTrendingUp className='text-green-700' size={12} />
          )}
          {trend === 'down' && (
            <FiTrendingDown className='text-red-700' size={12} />
          )}
          <span
            className={
              trend === 'up'
                ? 'text-green-700'
                : trend === 'down'
                  ? 'text-red-700'
                  : ''
            }
          >
            {sub}
          </span>
        </div>
      )}
    </div>
  );
}

// ── Filters ───────────────────────────────────────────────────────────────────

interface Filters {
  search: string;
  status: EmploymentStatus | '';
  shift: ShiftType | '';
  employmentType: EmploymentType | '';
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ReceptionistDashboard() {
  const { status: sessionStatus } = useSession();
  const router = useRouter();

  const [receptionists, setReceptionists] = useState<IReceptionist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({
    search: '',
    status: '',
    shift: '',
    employmentType: '',
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // ── Auth guard ──────────────────────────────────────────────────────────────

  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      router.push('/login');
    }
  }, [sessionStatus, router]);

  // ── Fetch ───────────────────────────────────────────────────────────────────

  useEffect(() => {
    const fetchReceptionists = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          page: String(page),
          limit: '10',
          search: filters.search,
          sortBy: 'hireDate',
          sortOrder: 'desc',
          populate: 'true',
          ...(filters.status && { employmentStatus: filters.status }),
          ...(filters.shift && { shift: filters.shift }),
          ...(filters.employmentType && {
            employmentType: filters.employmentType,
          }),
        });

        const res = await fetch(`/api/admin/receptionist?${params}`);
        const data = await res.json();

        if (!res.ok) {
          throw new globalThis.Error(
            (data as any).message ||
              (data as any).error ||
              'Failed to fetch receptionists'
          );
        }

        // API returns { success, data: [...], total, page, limit, totalPages }
        setReceptionists(data.data ?? []);
        setTotalPages(data.totalPages ?? 1);
      } catch (err) {
        setError((err as Error)?.message ?? 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (sessionStatus === 'authenticated') {
      fetchReceptionists();
    }
  }, [sessionStatus, page, filters]);

  // ── Derived stats ───────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const total = receptionists.length;
    const active = receptionists.filter(
      r => r.employmentStatus === EmploymentStatus.ACTIVE
    ).length;
    const onLeave = receptionists.filter(
      r => r.employmentStatus === EmploymentStatus.ON_LEAVE
    ).length;

    const scoredStaff = receptionists.filter(
      r => (r.performanceMetrics?.patientSatisfactionScore ?? 0) > 0
    );
    const avgSatisfaction =
      scoredStaff.length > 0
        ? scoredStaff.reduce(
            (sum, r) => sum + r.performanceMetrics!.patientSatisfactionScore!,
            0
          ) / scoredStaff.length
        : 0;

    const totalAppts = receptionists.reduce(
      (sum, r) => sum + (r.currentAppointmentsCount ?? 0),
      0
    );

    // Shift breakdown from live data
    const shiftCounts: Record<ShiftType, number> = {
      [ShiftType.MORNING]: 0,
      [ShiftType.EVENING]: 0,
      [ShiftType.NIGHT]: 0,
      [ShiftType.FULL_DAY]: 0,
    };
    receptionists.forEach(r => {
      shiftCounts[r.shift] = (shiftCounts[r.shift] ?? 0) + 1;
    });

    // Employment type breakdown from live data
    const empTypeCounts: Record<EmploymentType, number> = {
      [EmploymentType.FULL_TIME]: 0,
      [EmploymentType.PART_TIME]: 0,
      [EmploymentType.CONTRACT]: 0,
      [EmploymentType.INTERN]: 0,
    };
    receptionists.forEach(r => {
      empTypeCounts[r.employmentType] =
        (empTypeCounts[r.employmentType] ?? 0) + 1;
    });

    return {
      total,
      active,
      onLeave,
      avgSatisfaction,
      totalAppts,
      shiftCounts,
      empTypeCounts,
    };
  }, [receptionists]);

  // ── Guard states ────────────────────────────────────────────────────────────

  if (sessionStatus === 'loading') return <Loading />;
  if (error) return <Error message={error} />;

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className='p-6 space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-xl font-medium text-gray-900'>
            Receptionist management
          </h1>
          <p className='text-sm text-gray-500 mt-0.5'>
            Overview of all front desk staff
          </p>
        </div>
        <div className='flex gap-2'>
          <button className='flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50'>
            <FiFilter size={14} /> Filter
          </button>
          <button className='flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50'>
            <FiDownload size={14} /> Export
          </button>
          <button
            onClick={() => router.push('/admin/receptionist/new')}
            className='flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800'
          >
            <FiPlus size={14} /> Add receptionist
          </button>
        </div>
      </div>

      {/* Metric cards */}
      <div className='grid grid-cols-4 gap-3'>
        <MetricCard
          icon={<FiUsers size={13} />}
          label='Total staff'
          value={stats.total}
        />
        <MetricCard
          icon={<FiUserCheck size={13} />}
          label='Active today'
          value={stats.active}
          sub={`${stats.onLeave} on leave`}
        />
        <MetricCard
          icon={<FiCalendar size={13} />}
          label='Appts handled today'
          value={stats.totalAppts}
          sub='+11% vs yesterday'
          trend='up'
        />
        <MetricCard
          icon={<FiStar size={13} />}
          label='Avg satisfaction'
          value={stats.avgSatisfaction.toFixed(1)}
          sub='–0.2 vs last week'
          trend='down'
        />
      </div>

      {/* Shift summary */}
      <div className='grid grid-cols-4 gap-3'>
        {(
          [
            { key: ShiftType.MORNING, label: 'Morning', time: '06:00 – 14:00' },
            { key: ShiftType.EVENING, label: 'Evening', time: '14:00 – 22:00' },
            { key: ShiftType.NIGHT, label: 'Night', time: '22:00 – 06:00' },
            {
              key: ShiftType.FULL_DAY,
              label: 'Full day',
              time: '08:00 – 17:00',
            },
          ] as const
        ).map(({ key, label, time }) => (
          <div
            key={key}
            className='border border-gray-100 rounded-lg p-3 bg-white'
          >
            <p className='text-xs text-gray-500 mb-1'>{label} shift</p>
            <p className='text-xl font-medium text-gray-900'>
              {stats.shiftCounts[key]}
            </p>
            <p className='text-xs text-gray-400'>{time}</p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className='grid grid-cols-2 gap-3'>
        {/* Appointments trend */}
        <div className='border border-gray-100 rounded-xl p-5 bg-white'>
          <h3 className='text-xs font-medium uppercase tracking-wide text-gray-400 mb-4'>
            Appointments — last 7 days
          </h3>
          <div className='flex gap-4 mb-3 text-xs text-gray-500'>
            <span className='flex items-center gap-1.5'>
              <span className='w-2.5 h-2.5 rounded-sm bg-blue-500 inline-block' />
              Appointments
            </span>
            <span className='flex items-center gap-1.5'>
              <span className='w-2.5 h-2.5 rounded-sm bg-teal-500 inline-block' />
              Check-ins
            </span>
          </div>
          <ResponsiveContainer width='100%' height={180}>
            <LineChart data={appointmentTrendData}>
              <CartesianGrid strokeDasharray='3 3' stroke='#f0f0f0' />
              <XAxis dataKey='day' tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line
                type='monotone'
                dataKey='appointments'
                stroke='#378ADD'
                strokeWidth={1.5}
                dot={{ r: 3 }}
              />
              <Line
                type='monotone'
                dataKey='checkIns'
                stroke='#1D9E75'
                strokeWidth={1.5}
                dot={{ r: 3 }}
                strokeDasharray='4 3'
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Employment type */}
        <div className='border border-gray-100 rounded-xl p-5 bg-white'>
          <h3 className='text-xs font-medium uppercase tracking-wide text-gray-400 mb-4'>
            Staff by employment type
          </h3>
          {(() => {
            const liveEmpData = [
              {
                name: 'Full time',
                key: EmploymentType.FULL_TIME,
                color: '#534AB7',
              },
              {
                name: 'Part time',
                key: EmploymentType.PART_TIME,
                color: '#1D9E75',
              },
              {
                name: 'Contract',
                key: EmploymentType.CONTRACT,
                color: '#D85A30',
              },
              { name: 'Intern', key: EmploymentType.INTERN, color: '#888780' },
            ].map(d => ({ ...d, value: stats.empTypeCounts[d.key] }));
            const empTotal = liveEmpData.reduce((s, d) => s + d.value, 0) || 1;
            return (
              <>
                <div className='flex flex-wrap gap-3 mb-3 text-xs text-gray-500'>
                  {liveEmpData.map(d => (
                    <span key={d.name} className='flex items-center gap-1.5'>
                      <span
                        className='w-2.5 h-2.5 rounded-sm inline-block'
                        style={{ background: d.color }}
                      />
                      {d.name} {Math.round((d.value / empTotal) * 100)}%
                    </span>
                  ))}
                </div>
                <ResponsiveContainer width='100%' height={180}>
                  <PieChart>
                    <Pie
                      data={liveEmpData}
                      cx='50%'
                      cy='50%'
                      innerRadius={50}
                      outerRadius={80}
                      dataKey='value'
                      paddingAngle={2}
                    >
                      {liveEmpData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} stroke='none' />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v: number, name: string) => [v, name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </>
            );
          })()}
        </div>
      </div>

      {/* Roster table */}
      <div className='border border-gray-100 rounded-xl bg-white'>
        <div className='flex items-center justify-between p-5 pb-3'>
          <h3 className='text-sm font-medium text-gray-900'>
            Receptionist roster
          </h3>
          <button
            onClick={() => router.push('/admin/receptionist/performance')}
            className='text-xs px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50'
          >
            View performance
          </button>
        </div>

        {/* Filters */}
        <div className='flex gap-2 px-5 pb-3 flex-wrap'>
          <input
            type='text'
            placeholder='Search by name or department…'
            value={filters.search}
            onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
            className='flex-1 min-w-40 text-sm px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300'
          />
          <select
            value={filters.status}
            onChange={e =>
              setFilters(f => ({
                ...f,
                status: e.target.value as EmploymentStatus | '',
              }))
            }
            className='text-sm px-2 py-1.5 border border-gray-200 rounded-lg'
          >
            <option value=''>All statuses</option>
            {Object.values(EmploymentStatus).map(s => (
              <option key={s} value={s}>
                {s.replace('_', ' ')}
              </option>
            ))}
          </select>
          <select
            value={filters.shift}
            onChange={e =>
              setFilters(f => ({
                ...f,
                shift: e.target.value as ShiftType | '',
              }))
            }
            className='text-sm px-2 py-1.5 border border-gray-200 rounded-lg'
          >
            <option value=''>All shifts</option>
            {Object.values(ShiftType).map(s => (
              <option key={s} value={s}>
                {s.replace('_', ' ')}
              </option>
            ))}
          </select>
          <select
            value={filters.employmentType}
            onChange={e =>
              setFilters(f => ({
                ...f,
                employmentType: e.target.value as EmploymentType | '',
              }))
            }
            className='text-sm px-2 py-1.5 border border-gray-200 rounded-lg'
          >
            <option value=''>All types</option>
            {Object.values(EmploymentType).map(t => (
              <option key={t} value={t}>
                {t.replace('_', ' ')}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className='py-16 flex justify-center'>
            <Loading />
          </div>
        ) : receptionists.length === 0 ? (
          <div className='py-16 text-center text-sm text-gray-400'>
            No receptionists found. Try adjusting your filters.
          </div>
        ) : (
          <>
            <div className='overflow-x-auto'>
              <table className='w-full text-sm'>
                <thead>
                  <tr className='border-b border-gray-100'>
                    {[
                      'Name',
                      'Department',
                      'Shift',
                      'Status',
                      'Appts today',
                      'Satisfaction',
                      'Type',
                    ].map(h => (
                      <th
                        key={h}
                        className='text-left text-xs font-medium text-gray-400 uppercase tracking-wide px-5 py-2.5'
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {receptionists.map(r => (
                    <motion.tr
                      key={r._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className='border-b border-gray-50 hover:bg-gray-50 cursor-pointer'
                      onClick={() =>
                        router.push(`/admin/receptionist/${r._id}`)
                      }
                    >
                      <td className='px-5 py-3'>
                        <div className='flex items-center gap-2.5'>
                          {r.user?.image ? (
                            <img
                              src={r.user.image}
                              alt={r.user.name}
                              className='w-7 h-7 rounded-full object-cover shrink-0'
                            />
                          ) : (
                            <div className='w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center text-xs font-medium text-blue-700 shrink-0'>
                              {r.user?.name?.slice(0, 2).toUpperCase() ?? '??'}
                            </div>
                          )}
                          <div className='min-w-0'>
                            <p className='font-medium text-gray-800 truncate max-w-32.5'>
                              {r.user?.name}
                            </p>
                            <p className='text-xs text-gray-400 truncate max-w-32.5'>
                              {r.employeeId}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className='px-5 py-3 text-gray-600'>
                        {r.department}
                      </td>
                      <td className='px-5 py-3'>
                        <ShiftBadge shift={r.shift} />
                      </td>
                      <td className='px-5 py-3'>
                        <StatusBadge status={r.employmentStatus} />
                      </td>
                      <td className='px-5 py-3 text-gray-600'>
                        {r.currentAppointmentsCount != null
                          ? `${r.currentAppointmentsCount} / ${r.maxAppointmentsPerDay}`
                          : '—'}
                      </td>
                      <td className='px-5 py-3'>
                        {r.performanceMetrics?.patientSatisfactionScore !=
                        null ? (
                          <StarRating
                            score={
                              r.performanceMetrics.patientSatisfactionScore
                            }
                          />
                        ) : (
                          <span className='text-gray-400'>—</span>
                        )}
                      </td>
                      <td className='px-5 py-3 text-xs text-gray-500'>
                        {r.employmentType.replace('_', ' ')}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className='flex items-center justify-between px-5 py-3 border-t border-gray-100'>
                <span className='text-xs text-gray-400'>
                  Page {page} of {totalPages}
                </span>
                <div className='flex gap-1.5'>
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(p => p - 1)}
                    className='px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50'
                  >
                    Previous
                  </button>
                  <button
                    disabled={page === totalPages}
                    onClick={() => setPage(p => p + 1)}
                    className='px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50'
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

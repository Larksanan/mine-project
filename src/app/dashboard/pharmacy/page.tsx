/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-undef */
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Loading from '../../../components/ui/Loading';
import Error from '../../../components/Error';
import {
  FiPackage,
  FiDollarSign,
  FiTrendingUp,
  FiTrendingDown,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiTruck,
  FiDownload,
  FiRefreshCw,
  FiSearch,
  FiEye,
} from 'react-icons/fi';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type PaymentMethod = 'cash' | 'card' | 'online';

export interface IOrderProduct {
  _id: string;
  name: string;
  price: number;
  image?: string;
  requiresPrescription?: boolean;
}

export interface IOrderItem {
  _id: string;
  product: IOrderProduct;
  quantity: number;
  price: number;
  prescriptionVerified: boolean;
}

export interface IShippingInfo {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  instructions?: string;
}

export interface IOrder {
  _id: string;
  id: string;
  orderNumber: string;
  items: IOrderItem[];
  totalAmount: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  deliveryAddress: string;
  shippingInfo: IShippingInfo;
  estimatedDelivery: string;
  actualDelivery?: string;
  prescriptionImages: string[];
  createdAt: string;
  updatedAt: string;
  updatedBy?: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; className: string; icon: React.ReactNode }
> = {
  pending: {
    label: 'Pending',
    className: 'bg-amber-50 text-amber-800',
    icon: <FiClock size={11} />,
  },
  confirmed: {
    label: 'Confirmed',
    className: 'bg-blue-50 text-blue-800',
    icon: <FiCheckCircle size={11} />,
  },
  processing: {
    label: 'Processing',
    className: 'bg-purple-50 text-purple-800',
    icon: <FiRefreshCw size={11} />,
  },
  shipped: {
    label: 'Shipped',
    className: 'bg-indigo-50 text-indigo-800',
    icon: <FiTruck size={11} />,
  },
  delivered: {
    label: 'Delivered',
    className: 'bg-green-50 text-green-800',
    icon: <FiCheckCircle size={11} />,
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-red-50 text-red-800',
    icon: <FiXCircle size={11} />,
  },
};

const PAYMENT_STATUS_CONFIG: Record<
  PaymentStatus,
  { label: string; className: string }
> = {
  pending: { label: 'Pending', className: 'bg-amber-50 text-amber-700' },
  paid: { label: 'Paid', className: 'bg-green-50 text-green-700' },
  failed: { label: 'Failed', className: 'bg-red-50 text-red-700' },
  refunded: { label: 'Refunded', className: 'bg-gray-100 text-gray-600' },
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: '#BA7517',
  confirmed: '#185FA5',
  processing: '#534AB7',
  shipped: '#3730a3',
  delivered: '#3B6D11',
  cancelled: '#A32D2D',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatCurrency(amount: number, currency = 'LKR') {
  return `${currency} ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function StatusBadge({ status }: { status: OrderStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${cfg.className}`}
    >
      {cfg.icon} {cfg.label}
    </span>
  );
}

function PaymentBadge({ status }: { status: PaymentStatus }) {
  const cfg = PAYMENT_STATUS_CONFIG[status];
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${cfg.className}`}
    >
      {cfg.label}
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
        <div className='flex items-center gap-1 mt-1 text-xs'>
          {trend === 'up' && (
            <FiTrendingUp size={12} className='text-green-700' />
          )}
          {trend === 'down' && (
            <FiTrendingDown size={12} className='text-red-700' />
          )}
          <span
            className={
              trend === 'up'
                ? 'text-green-700'
                : trend === 'down'
                  ? 'text-red-700'
                  : 'text-gray-500'
            }
          >
            {sub}
          </span>
        </div>
      )}
    </div>
  );
}

export default function PharmacyDashboard() {
  const { data: _session, status: sessionStatus } = useSession();
  const router = useRouter();

  const [orders, setOrders] = useState<IOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('');
  const [paymentFilter, setPaymentFilter] = useState<PaymentStatus | ''>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const LIMIT = 10;

  useEffect(() => {
    if (sessionStatus === 'unauthenticated') router.push('/login');
  }, [sessionStatus, router]);

  // ── Fetch orders ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (sessionStatus !== 'authenticated') return;

    const fetchOrders = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          page: String(page),
          limit: String(LIMIT),
          ...(search && { search }),
          ...(statusFilter && { status: statusFilter }),
          ...(paymentFilter && { paymentStatus: paymentFilter }),
        });

        const res = await fetch(`/api/orders?${params}`);

        if (!res.ok) {
          throw new globalThis.Error(`Server error: ${res.status}`);
        }

        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new globalThis.Error('Server returned non-JSON response');
        }

        const raw = await res.json();
        const list: IOrder[] = Array.isArray(raw)
          ? raw
          : (raw.orders ?? raw.data ?? []);

        setOrders(list);
        setTotalPages(
          raw.totalPages ?? Math.ceil((raw.total ?? list.length) / LIMIT)
        );
      } catch (err: unknown) {
        let message = 'Something went wrong';

        if (err instanceof Error) {
          message = (err as Error).message;
        } else if (typeof err === 'string') {
          message = err;
        } else if (err && typeof err === 'object' && 'message' in err) {
          const m = (err as any).message;
          if (typeof m === 'string') message = m;
          else message = String(m);
        } else {
          message = String(err);
        }

        setError(message || 'Something went wrong');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [sessionStatus, page, search, statusFilter, paymentFilter]);

  // ── Derived stats ───────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = orders.length;
    const revenue = orders
      .filter(o => o.paymentStatus === 'paid')
      .reduce((s, o) => s + o.totalAmount, 0);
    const pending = orders.filter(o => o.status === 'pending').length;
    const delivered = orders.filter(o => o.status === 'delivered').length;
    const cancelled = orders.filter(o => o.status === 'cancelled').length;

    // Status breakdown for pie
    const statusCounts = Object.keys(STATUS_CONFIG)
      .map(k => ({
        name: STATUS_CONFIG[k as OrderStatus].label,
        value: orders.filter(o => o.status === k).length,
        color: STATUS_COLORS[k as OrderStatus],
      }))
      .filter(d => d.value > 0);

    // Revenue by day (last 7 days from orders)
    const dayMap: Record<string, number> = {};
    orders.forEach(o => {
      const day = new Date(o.createdAt).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
      });
      dayMap[day] = (dayMap[day] ?? 0) + o.totalAmount;
    });
    const revenueByDay = Object.entries(dayMap)
      .sort(
        (a, b) =>
          new (Date as any)(a[0]).getTime() - new (Date as any)(b[0]).getTime()
      )
      .slice(-7)
      .map(([day, amount]) => ({ day, amount: Math.round(amount) }));

    // Payment method breakdown
    const methodMap: Record<string, number> = {};
    orders.forEach(o => {
      methodMap[o.paymentMethod] = (methodMap[o.paymentMethod] ?? 0) + 1;
    });
    const paymentMethods = Object.entries(methodMap).map(([name, count]) => ({
      name,
      count,
    }));

    return {
      total,
      revenue,
      pending,
      delivered,
      cancelled,
      statusCounts,
      revenueByDay,
      paymentMethods,
    };
  }, [orders]);

  // ── Filtered rows (client-side on top of server filters) ───────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return orders.filter(o => {
      const matchQ =
        !q ||
        o.orderNumber.toLowerCase().includes(q) ||
        o.shippingInfo.name.toLowerCase().includes(q) ||
        o.shippingInfo.email.toLowerCase().includes(q);
      const matchS = !statusFilter || o.status === statusFilter;
      const matchP = !paymentFilter || o.paymentStatus === paymentFilter;
      return matchQ && matchS && matchP;
    });
  }, [orders, search, statusFilter, paymentFilter]);

  // ── Guard states ────────────────────────────────────────────────────────────
  if (sessionStatus === 'loading') return <Loading />;
  if (error) return <Error message={error} />;

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className='p-6 space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-xl font-medium text-gray-900'>Pharmacy orders</h1>
          <p className='text-sm text-gray-500 mt-0.5'>
            Manage and track all medication orders
          </p>
        </div>
        <div className='flex gap-2'>
          <button className='flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50'>
            <FiDownload size={14} /> Export
          </button>
          <button
            onClick={() => router.push('/pharmacy/orders/new')}
            className='flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800'
          >
            + New order
          </button>
        </div>
      </div>

      {/* Metric cards */}
      <div className='grid grid-cols-4 gap-3'>
        <MetricCard
          icon={<FiPackage size={13} />}
          label='Total orders'
          value={stats.total}
        />
        <MetricCard
          icon={<FiDollarSign size={13} />}
          label='Revenue collected'
          value={`LKR ${(stats.revenue / 1000).toFixed(1)}k`}
          sub='Paid orders only'
        />
        <MetricCard
          icon={<FiClock size={13} />}
          label='Pending orders'
          value={stats.pending}
          sub={stats.pending > 0 ? 'Needs attention' : 'All clear'}
          trend={stats.pending > 0 ? 'down' : undefined}
        />
        <MetricCard
          icon={<FiCheckCircle size={13} />}
          label='Delivered'
          value={stats.delivered}
          sub={`${stats.cancelled} cancelled`}
        />
      </div>

      {/* Charts row */}
      <div className='grid grid-cols-2 gap-3'>
        {/* Revenue trend */}
        <div className='border border-gray-100 rounded-xl p-5 bg-white'>
          <h3 className='text-xs font-medium uppercase tracking-wide text-gray-400 mb-4'>
            Order value by date
          </h3>
          {stats.revenueByDay.length === 0 ? (
            <div className='h-45 flex items-center justify-center text-sm text-gray-400'>
              No data yet
            </div>
          ) : (
            <ResponsiveContainer width='100%' height={180}>
              <BarChart data={stats.revenueByDay} barSize={20}>
                <CartesianGrid
                  strokeDasharray='3 3'
                  stroke='#f0f0f0'
                  vertical={false}
                />
                <XAxis dataKey='day' tick={{ fontSize: 11 }} />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickFormatter={v => `${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(v: number) => [
                    `LKR ${v.toLocaleString()}`,
                    'Amount',
                  ]}
                />
                <Bar dataKey='amount' fill='#378ADD' radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Order status pie */}
        <div className='border border-gray-100 rounded-xl p-5 bg-white'>
          <h3 className='text-xs font-medium uppercase tracking-wide text-gray-400 mb-4'>
            Orders by status
          </h3>
          {stats.statusCounts.length === 0 ? (
            <div className='h-45 flex items-center justify-center text-sm text-gray-400'>
              No data yet
            </div>
          ) : (
            <>
              <div className='flex flex-wrap gap-2 mb-3'>
                {stats.statusCounts.map(d => (
                  <span
                    key={d.name}
                    className='flex items-center gap-1.5 text-xs text-gray-500'
                  >
                    <span
                      className='w-2 h-2 rounded-sm inline-block shrink-0'
                      style={{ background: d.color }}
                    />
                    {d.name} ({d.value})
                  </span>
                ))}
              </div>
              <ResponsiveContainer width='100%' height={150}>
                <PieChart>
                  <Pie
                    data={stats.statusCounts}
                    cx='50%'
                    cy='50%'
                    innerRadius={40}
                    outerRadius={65}
                    dataKey='value'
                    paddingAngle={2}
                  >
                    {stats.statusCounts.map((entry, i) => (
                      <Cell key={i} fill={entry.color} stroke='none' />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number, name: string) => [v, name]} />
                </PieChart>
              </ResponsiveContainer>
            </>
          )}
        </div>
      </div>

      {/* Orders table */}
      <div className='border border-gray-100 rounded-xl bg-white'>
        <div className='flex items-center justify-between p-5 pb-3'>
          <h3 className='text-sm font-medium text-gray-900'>All orders</h3>
          <span className='text-xs text-gray-400'>
            {filtered.length} result{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Filters */}
        <div className='flex gap-2 px-5 pb-3 flex-wrap'>
          <div className='relative flex-1 min-w-45'>
            <FiSearch
              size={13}
              className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400'
            />
            <input
              type='text'
              placeholder='Search by order no., name, or email…'
              value={search}
              onChange={e => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className='w-full text-sm pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300'
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => {
              setStatusFilter(e.target.value as OrderStatus | '');
              setPage(1);
            }}
            className='text-sm px-2 py-1.5 border border-gray-200 rounded-lg'
          >
            <option value=''>All statuses</option>
            {(Object.keys(STATUS_CONFIG) as OrderStatus[]).map(s => (
              <option key={s} value={s}>
                {STATUS_CONFIG[s].label}
              </option>
            ))}
          </select>
          <select
            value={paymentFilter}
            onChange={e => {
              setPaymentFilter(e.target.value as PaymentStatus | '');
              setPage(1);
            }}
            className='text-sm px-2 py-1.5 border border-gray-200 rounded-lg'
          >
            <option value=''>All payments</option>
            {(Object.keys(PAYMENT_STATUS_CONFIG) as PaymentStatus[]).map(s => (
              <option key={s} value={s}>
                {PAYMENT_STATUS_CONFIG[s].label}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className='py-16 flex justify-center'>
            <Loading />
          </div>
        ) : filtered.length === 0 ? (
          <div className='py-16 text-center text-sm text-gray-400'>
            No orders found. Try adjusting your filters.
          </div>
        ) : (
          <>
            <div className='overflow-x-auto'>
              <table className='w-full text-sm'>
                <thead>
                  <tr className='border-b border-gray-100'>
                    {[
                      'Order',
                      'Customer',
                      'Items',
                      'Total',
                      'Status',
                      'Payment',
                      'Date',
                      '',
                    ].map(h => (
                      <th
                        key={h}
                        className='text-left text-xs font-medium text-gray-400 uppercase tracking-wide px-5 py-2.5 whitespace-nowrap'
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(order => (
                    <motion.tr
                      key={order._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className='border-b border-gray-50 hover:bg-gray-50 cursor-pointer'
                      onClick={() =>
                        router.push(`/pharmacy/orders/${order._id}`)
                      }
                    >
                      {/* Order number */}
                      <td className='px-5 py-3'>
                        <p className='font-medium text-gray-800 whitespace-nowrap'>
                          {order.orderNumber}
                        </p>
                        <p className='text-xs text-gray-400'>
                          {order.paymentMethod}
                        </p>
                      </td>

                      {/* Customer */}
                      <td className='px-5 py-3'>
                        <p className='text-gray-800 truncate max-w-35'>
                          {order.shippingInfo.name}
                        </p>
                        <p className='text-xs text-gray-400 truncate max-w-35'>
                          {order.shippingInfo.phone}
                        </p>
                      </td>

                      {/* Items count + preview */}
                      <td className='px-5 py-3'>
                        <p className='text-gray-700'>
                          {order.items.length} item
                          {order.items.length !== 1 ? 's' : ''}
                        </p>
                        <p className='text-xs text-gray-400 truncate max-w-30'>
                          {order.items.map(i => i.product.name).join(', ')}
                        </p>
                      </td>

                      {/* Total */}
                      <td className='px-5 py-3 whitespace-nowrap font-medium text-gray-800'>
                        {formatCurrency(order.totalAmount)}
                      </td>

                      {/* Status */}
                      <td className='px-5 py-3'>
                        <StatusBadge status={order.status} />
                      </td>

                      {/* Payment */}
                      <td className='px-5 py-3'>
                        <PaymentBadge status={order.paymentStatus} />
                      </td>

                      {/* Date */}
                      <td className='px-5 py-3 text-xs text-gray-500 whitespace-nowrap'>
                        {formatDate(order.createdAt)}
                        {order.actualDelivery && (
                          <p className='text-green-600'>
                            Delivered {formatDate(order.actualDelivery)}
                          </p>
                        )}
                      </td>

                      {/* View */}
                      <td className='px-5 py-3'>
                        <button
                          className='p-1.5 rounded-lg hover:bg-gray-100 text-gray-400'
                          onClick={e => {
                            e.stopPropagation();
                            router.push(`/pharmacy/orders/${order._id}`);
                          }}
                          aria-label='View order'
                        >
                          <FiEye size={14} />
                        </button>
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

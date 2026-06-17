/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  FiSearch,
  FiEye,
  FiPackage,
  FiTruck,
  FiCheckCircle,
  FiXCircle,
  FiClock,
} from 'react-icons/fi';

interface Order {
  _id?: string;
  id?: string;
  orderNumber: string;
  customer?: {
    name: string;
    email: string;
    phone: string;
  };
  shippingInfo: {
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    postalCode: string;
  };
  items: Array<{
    product: {
      _id: string;
      name: string;
      price: number;
      requiresPrescription?: boolean;
    };
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
  status:
    | 'pending'
    | 'confirmed'
    | 'preparing'
    | 'ready'
    | 'out_for_delivery'
    | 'delivered'
    | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentMethod: 'cash' | 'card' | 'insurance';
  deliveryAddress: string;
  prescriptionImages?: string[];
  createdAt: string;
  updatedAt: string;
  estimatedDelivery?: string;
}

export default function PharmacistOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');

  useEffect(() => {
    fetchOrders();
  }, [statusFilter, paymentFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);

      const response = await fetch('/api/orders');

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      console.log('API Response:', data);

      if (data.success) {
        if (Array.isArray(data.orders)) {
          console.log(`Loaded ${data.orders.length} orders`);

          // Normalize orders - ensure they all have an id field
          const normalizedOrders = data.orders.map((order: any) => {
            // Get the ID from either _id or id field
            const orderId = order._id || order.id;

            return {
              ...order,
              _id: orderId,
              id: orderId,
            };
          });

          if (normalizedOrders.length > 0) {
            console.log('First normalized order _id:', normalizedOrders[0]._id);
          }

          setOrders(normalizedOrders);
        } else if (data.order) {
          const orderId = data.order._id || data.order.id;
          setOrders([{ ...data.order, _id: orderId, id: orderId }]);
        } else {
          console.warn('No orders in response');
          setOrders([]);
        }
      } else {
        console.error('API returned error:', data.error);
        alert(data.error || 'Failed to fetch orders');
        setOrders([]);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      alert('Failed to fetch orders. Check console for details.');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'preparing':
        return 'bg-purple-100 text-purple-800';
      case 'ready':
        return 'bg-green-100 text-green-800';
      case 'out_for_delivery':
        return 'bg-indigo-100 text-indigo-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <FiClock className='text-yellow-600' />;
      case 'confirmed':
        return <FiCheckCircle className='text-blue-600' />;
      case 'preparing':
        return <FiPackage className='text-purple-600' />;
      case 'ready':
        return <FiCheckCircle className='text-green-600' />;
      case 'out_for_delivery':
        return <FiTruck className='text-indigo-600' />;
      case 'delivered':
        return <FiCheckCircle className='text-green-600' />;
      case 'cancelled':
        return <FiXCircle className='text-red-600' />;
      default:
        return <FiPackage className='text-gray-600' />;
    }
  };

  const getPaymentMethodBadge = (method: string) => {
    const badges = {
      cash: 'bg-green-100 text-green-800',
      card: 'bg-blue-100 text-blue-800',
      insurance: 'bg-purple-100 text-purple-800',
    };
    return badges[method as keyof typeof badges] || 'bg-gray-100 text-gray-800';
  };

  const handleViewOrder = (order: Order) => {
    const orderId = order._id || order.id || (order as any)['$id'];

    console.log('Viewing order:', orderId);

    if (!orderId) {
      console.error('Order object:', order);
      alert('Cannot view order: ID is missing');
      return;
    }

    router.push(`/pharmacist/orders/${orderId}`);
  };

  const updateOrderStatus = async (order: Order, newStatus: string) => {
    const orderId = order._id || order.id;

    if (!orderId) {
      alert('Cannot update order: ID is missing');
      return;
    }

    try {
      const response = await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          status: newStatus,
        }),
      });

      const data = await response.json();
      if (data.success) {
        fetchOrders();
        alert(`Order status updated to ${newStatus}`);
      } else {
        alert(data.error || 'Failed to update order');
      }
    } catch (error) {
      console.error('Error updating order:', error);
      alert('Failed to update order');
    }
  };

  const updatePaymentStatus = async (order: Order, newStatus: string) => {
    const orderId = order._id || order.id;

    if (!orderId) {
      alert('Cannot update payment: ID is missing');
      return;
    }

    try {
      const response = await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          paymentStatus: newStatus,
        }),
      });

      const data = await response.json();
      if (data.success) {
        fetchOrders();
        alert(`Payment status updated to ${newStatus}`);
      } else {
        alert(data.error || 'Failed to update payment status');
      }
    } catch (error) {
      console.error('Error updating payment status:', error);
      alert('Failed to update payment status');
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch =
      searchQuery === '' ||
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.shippingInfo.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      order.shippingInfo.phone.includes(searchQuery) ||
      order.shippingInfo.email
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' || order.status === statusFilter;

    const matchesPayment =
      paymentFilter === 'all' || order.paymentMethod === paymentFilter;

    return matchesSearch && matchesStatus && matchesPayment;
  });

  return (
    <div className='min-h-screen bg-gray-50 p-6'>
      <div className='max-w-7xl mx-auto'>
        {/* Header */}
        <div className='mb-8'>
          <h1 className='text-3xl font-bold text-gray-900'>Order Management</h1>
          <p className='text-gray-600 mt-1'>
            Manage and track customer orders ({filteredOrders.length} orders)
          </p>
        </div>

        {/* Stats Cards */}
        <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mb-6'>
          <div className='bg-white rounded-lg shadow-sm p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-gray-600'>Total Orders</p>
                <p className='text-2xl font-bold text-gray-900'>
                  {orders.length}
                </p>
              </div>
              <FiPackage className='text-3xl text-blue-600' />
            </div>
          </div>
          <div className='bg-white rounded-lg shadow-sm p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-gray-600'>Pending</p>
                <p className='text-2xl font-bold text-yellow-600'>
                  {orders.filter(o => o.status === 'pending').length}
                </p>
              </div>
              <FiClock className='text-3xl text-yellow-600' />
            </div>
          </div>
          <div className='bg-white rounded-lg shadow-sm p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-gray-600'>In Progress</p>
                <p className='text-2xl font-bold text-purple-600'>
                  {
                    orders.filter(o =>
                      ['confirmed', 'preparing', 'ready'].includes(o.status)
                    ).length
                  }
                </p>
              </div>
              <FiPackage className='text-3xl text-purple-600' />
            </div>
          </div>
          <div className='bg-white rounded-lg shadow-sm p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-gray-600'>Delivered</p>
                <p className='text-2xl font-bold text-green-600'>
                  {orders.filter(o => o.status === 'delivered').length}
                </p>
              </div>
              <FiCheckCircle className='text-3xl text-green-600' />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className='bg-white rounded-lg shadow-sm p-4 mb-6'>
          <div className='flex flex-col lg:flex-row gap-4'>
            <div className='flex-1 relative'>
              <FiSearch className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400' />
              <input
                type='text'
                placeholder='Search by order number, customer name, phone, or email...'
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
              />
            </div>
            <div className='flex gap-4'>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className='px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500'
              >
                <option value='all'>All Status</option>
                <option value='pending'>Pending</option>
                <option value='confirmed'>Confirmed</option>
                <option value='preparing'>Preparing</option>
                <option value='ready'>Ready</option>
                <option value='out_for_delivery'>Out for Delivery</option>
                <option value='delivered'>Delivered</option>
                <option value='cancelled'>Cancelled</option>
              </select>
              <select
                value={paymentFilter}
                onChange={e => setPaymentFilter(e.target.value)}
                className='px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500'
              >
                <option value='all'>All Payment Methods</option>
                <option value='cash'>Cash</option>
                <option value='card'>Card</option>
                <option value='insurance'>Insurance</option>
              </select>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        {loading ? (
          <div className='bg-white rounded-lg shadow-sm p-6'>
            <div className='animate-pulse space-y-4'>
              {[...Array(5)].map((_, i) => (
                <div key={i} className='flex items-center space-x-4'>
                  <div className='bg-gray-200 h-12 w-12 rounded'></div>
                  <div className='flex-1 space-y-2'>
                    <div className='bg-gray-200 h-4 rounded w-1/4'></div>
                    <div className='bg-gray-200 h-3 rounded w-1/2'></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className='bg-white rounded-lg shadow-sm p-12 text-center'>
            <FiPackage className='mx-auto text-6xl text-gray-300 mb-4' />
            <h3 className='text-xl font-semibold text-gray-900 mb-2'>
              No orders found
            </h3>
            <p className='text-gray-600'>
              {searchQuery || statusFilter !== 'all' || paymentFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'There are no orders yet'}
            </p>
          </div>
        ) : (
          <div className='bg-white rounded-lg shadow-sm overflow-hidden'>
            <div className='overflow-x-auto'>
              <table className='min-w-full divide-y divide-gray-200'>
                <thead className='bg-gray-50'>
                  <tr>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Order
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Customer
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Payment
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Amount
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Status
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className='bg-white divide-y divide-gray-200'>
                  {filteredOrders.map((order, index) => (
                    <tr
                      key={order._id || order.id || index}
                      className='hover:bg-gray-50'
                    >
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <div>
                          <div className='text-sm font-bold text-blue-600'>
                            {order.orderNumber}
                          </div>
                          <div className='text-xs text-gray-500'>
                            {new Date(order.createdAt).toLocaleDateString(
                              'en-US',
                              {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              }
                            )}
                          </div>
                        </div>
                      </td>
                      <td className='px-6 py-4'>
                        <div className='text-sm font-medium text-gray-900'>
                          {order.shippingInfo.name}
                        </div>
                        <div className='text-xs text-gray-500'>
                          {order.shippingInfo.phone}
                        </div>
                        <div className='text-xs text-gray-500'>
                          {order.shippingInfo.email}
                        </div>
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <div className='flex flex-col gap-1'>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPaymentMethodBadge(order.paymentMethod)}`}
                          >
                            {order.paymentMethod.toUpperCase()}
                          </span>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              order.paymentStatus === 'paid'
                                ? 'bg-green-100 text-green-800'
                                : order.paymentStatus === 'failed'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {order.paymentStatus}
                          </span>
                        </div>
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900'>
                        LKR {order.totalAmount.toFixed(2)}
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <div className='flex items-center gap-2'>
                          {getStatusIcon(order.status)}
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}
                          >
                            {order.status.replace('_', ' ')}
                          </span>
                        </div>
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm font-medium'>
                        <div className='flex flex-col gap-2'>
                          <button
                            onClick={() => handleViewOrder(order)}
                            className='flex items-center justify-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors'
                          >
                            <FiEye />
                            View Details
                          </button>

                          {/* Status Actions */}
                          <div className='flex gap-2'>
                            {order.status === 'pending' && (
                              <button
                                onClick={() =>
                                  updateOrderStatus(order, 'confirmed')
                                }
                                className='flex-1 px-2 py-1 bg-green-50 text-green-600 rounded hover:bg-green-100 text-xs'
                              >
                                Confirm
                              </button>
                            )}
                            {order.status === 'confirmed' && (
                              <button
                                onClick={() =>
                                  updateOrderStatus(order, 'preparing')
                                }
                                className='flex-1 px-2 py-1 bg-purple-50 text-purple-600 rounded hover:bg-purple-100 text-xs'
                              >
                                Prepare
                              </button>
                            )}
                            {order.status === 'preparing' && (
                              <button
                                onClick={() =>
                                  updateOrderStatus(order, 'ready')
                                }
                                className='flex-1 px-2 py-1 bg-green-50 text-green-600 rounded hover:bg-green-100 text-xs'
                              >
                                Ready
                              </button>
                            )}
                            {order.status === 'ready' && (
                              <button
                                onClick={() =>
                                  updateOrderStatus(order, 'out_for_delivery')
                                }
                                className='flex-1 px-2 py-1 bg-indigo-50 text-indigo-600 rounded hover:bg-indigo-100 text-xs'
                              >
                                Dispatch
                              </button>
                            )}
                            {order.status === 'out_for_delivery' && (
                              <button
                                onClick={() =>
                                  updateOrderStatus(order, 'delivered')
                                }
                                className='flex-1 px-2 py-1 bg-green-50 text-green-600 rounded hover:bg-green-100 text-xs'
                              >
                                Delivered
                              </button>
                            )}
                          </div>

                          {/* Payment Actions */}
                          {order.paymentStatus === 'pending' &&
                            order.paymentMethod === 'cash' && (
                              <button
                                onClick={() =>
                                  updatePaymentStatus(order, 'paid')
                                }
                                className='px-2 py-1 bg-green-50 text-green-600 rounded hover:bg-green-100 text-xs'
                              >
                                Mark Paid
                              </button>
                            )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

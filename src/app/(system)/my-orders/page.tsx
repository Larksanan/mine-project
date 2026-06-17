/* eslint-disable react-hooks/exhaustive-deps */
// app/my-orders/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiPackage,
  FiClock,
  FiCheckCircle,
  FiTruck,
  FiXCircle,
  FiEye,
  FiDownload,
  FiRefreshCw,
} from 'react-icons/fi';
import { BiChevronLeft, BiChevronRight } from 'react-icons/bi';
import Image from 'next/image';

interface OrderItem {
  product: {
    _id: string;
    name: string;
    image: string;
    price: number;
  };
  quantity: number;
  price: number;
}

interface Order {
  _id: string;
  orderNumber: string;
  items: OrderItem[];
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
  shippingInfo: {
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    postalCode: string;
  };
  deliveryAddress: string;
  estimatedDelivery?: string;
  actualDelivery?: string;
  createdAt: string;
  updatedAt: string;
}

interface OrdersResponse {
  success: boolean;
  orders: Order[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalOrders: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export default function MyOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalOrders: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchOrders();
  }, [currentPage, statusFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
      });

      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      const response = await fetch(`/api/orders/my-order?${params}`);
      const data: OrdersResponse = await response.json();

      if (data.success) {
        setOrders(data.orders);
        setPagination(data.pagination);
      } else {
        console.error('Failed to fetch orders');
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      confirmed: 'bg-blue-100 text-blue-800 border-blue-300',
      preparing: 'bg-purple-100 text-purple-800 border-purple-300',
      ready: 'bg-green-100 text-green-800 border-green-300',
      out_for_delivery: 'bg-indigo-100 text-indigo-800 border-indigo-300',
      delivered: 'bg-green-100 text-green-800 border-green-300',
      cancelled: 'bg-red-100 text-red-800 border-red-300',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string) => {
    const icons = {
      pending: <FiClock className='text-yellow-600' />,
      confirmed: <FiCheckCircle className='text-blue-600' />,
      preparing: <FiPackage className='text-purple-600' />,
      ready: <FiCheckCircle className='text-green-600' />,
      out_for_delivery: <FiTruck className='text-indigo-600' />,
      delivered: <FiCheckCircle className='text-green-600' />,
      cancelled: <FiXCircle className='text-red-600' />,
    };
    return icons[status as keyof typeof icons] || <FiPackage />;
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to cancel this order?')) return;

    try {
      const response = await fetch(`/api/orders/my-order/${orderId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        alert('Order cancelled successfully');
        fetchOrders();
      } else {
        alert(data.error || 'Failed to cancel order');
      }
    } catch (error) {
      console.error('Error cancelling order:', error);
      alert('Failed to cancel order');
    }
  };

  const handleDownloadInvoice = (order: Order) => {
    const invoiceWindow = window.open('', '_blank');
    if (!invoiceWindow) {
      alert('Please allow popups to download the invoice');
      return;
    }

    const subtotal = order.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const tax = subtotal * 0.1;
    const shipping = subtotal > 50 ? 0 : 5.99;

    const invoiceHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice - ${order.orderNumber}</title>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #333; }
            .header { display: flex; justify-content: space-between; margin-bottom: 40px; border-bottom: 2px solid #eee; padding-bottom: 20px; }
            .company-name { font-size: 28px; font-weight: bold; color: #2563eb; }
            .invoice-title { font-size: 24px; font-weight: bold; text-align: right; }
            .meta { text-align: right; color: #666; margin-top: 5px; }
            .section { margin-bottom: 30px; }
            .address-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
            h3 { font-size: 14px; text-transform: uppercase; color: #666; border-bottom: 1px solid #eee; padding-bottom: 5px; margin-bottom: 10px; }
            p { margin: 0 0 5px; line-height: 1.5; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { text-align: left; padding: 12px; background: #f8fafc; border-bottom: 2px solid #e2e8f0; font-size: 14px; font-weight: 600; }
            td { padding: 12px; border-bottom: 1px solid #eee; }
            .text-right { text-align: right; }
            .totals { margin-top: 30px; margin-left: auto; width: 300px; }
            .total-row { display: flex; justify-content: space-between; padding: 8px 0; }
            .total-row.final { border-top: 2px solid #2563eb; font-weight: bold; font-size: 18px; color: #2563eb; margin-top: 10px; padding-top: 15px; }
            .footer { margin-top: 60px; text-align: center; color: #999; font-size: 12px; border-top: 1px solid #eee; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-name">Eastern Central</div>
            <div>
              <div class="invoice-title">INVOICE</div>
              <div class="meta">#${order.orderNumber}</div>
              <div class="meta">${new Date(order.createdAt).toLocaleDateString()}</div>
            </div>
          </div>

          <div class="section address-grid">
            <div>
              <h3>Bill To</h3>
              <p><strong>${order.shippingInfo.name}</strong></p>
              <p>${order.shippingInfo.address}</p>
              <p>${order.shippingInfo.city}, ${order.shippingInfo.postalCode}</p>
              <p>${order.shippingInfo.phone}</p>
              <p>${order.shippingInfo.email}</p>
            </div>
            <div class="text-right">
              <h3>Payment Details</h3>
              <p>Method: <span style="text-transform: uppercase">${order.paymentMethod}</span></p>
              <p>Status: <span style="text-transform: uppercase">${order.paymentStatus}</span></p>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Item Description</th>
                <th class="text-right">Quantity</th>
                <th class="text-right">Price</th>
                <th class="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              ${order.items
                .map(
                  item => `
                <tr>
                  <td>${item.product.name}</td>
                  <td class="text-right">${item.quantity}</td>
                  <td class="text-right">LKR ${item.price.toFixed(2)}</td>
                  <td class="text-right">LKR ${(item.price * item.quantity).toFixed(2)}</td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>

          <div class="totals">
            <div class="total-row">
              <span>Subtotal</span>
              <span>LKR ${subtotal.toFixed(2)}</span>
            </div>
            <div class="total-row">
              <span>Tax (10%)</span>
              <span>LKR ${tax.toFixed(2)}</span>
            </div>
            <div class="total-row">
              <span>Shipping</span>
              <span>${shipping === 0 ? 'FREE' : `LKR ${shipping.toFixed(2)}`}</span>
            </div>
            <div class="total-row final">
              <span>Total Amount</span>
              <span>LKR ${order.totalAmount.toFixed(2)}</span>
            </div>
          </div>

          <div class="footer">
            <p>Thank you for your business!</p>
            <p  >
                For any questions, please contact Main street batticalo road,Pandirupu,Kalmunai
            </p>
            <p>Email: jebarsanthatcroos@gmail.com</p>
            <p>Phone: +94 76 239 7951</p>
          </div>
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `;

    invoiceWindow.document.write(invoiceHTML);
    invoiceWindow.document.close();
  };

  return (
    <div className='min-h-screen bg-linear-to-br from-gray-50 to-blue-50 py-8'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className='mb-8'
        >
          <h1 className='text-4xl font-bold text-gray-900 mb-2'>My Orders</h1>
          <p className='text-gray-600 text-lg'>
            Track and manage your orders ({pagination.totalOrders} total)
          </p>
        </motion.div>

        {/* Filters and Actions */}
        <div className='bg-white rounded-2xl shadow-md p-6 mb-6'>
          <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
            <div className='flex gap-4 flex-wrap'>
              <select
                value={statusFilter}
                onChange={e => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className='px-4 py-2 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent'
              >
                <option value='all'>All Orders</option>
                <option value='pending'>Pending</option>
                <option value='confirmed'>Confirmed</option>
                <option value='preparing'>Preparing</option>
                <option value='ready'>Ready</option>
                <option value='out_for_delivery'>Out for Delivery</option>
                <option value='delivered'>Delivered</option>
                <option value='cancelled'>Cancelled</option>
              </select>
            </div>

            <button
              onClick={fetchOrders}
              className='flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors'
            >
              <FiRefreshCw className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>

        {/* Orders List */}
        {loading ? (
          <div className='space-y-4'>
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className='bg-white rounded-2xl shadow-md p-6 animate-pulse'
              >
                <div className='flex justify-between items-start mb-4'>
                  <div className='space-y-2 flex-1'>
                    <div className='h-6 bg-gray-200 rounded w-1/4'></div>
                    <div className='h-4 bg-gray-200 rounded w-1/3'></div>
                  </div>
                  <div className='h-8 bg-gray-200 rounded w-24'></div>
                </div>
                <div className='space-y-3'>
                  <div className='h-4 bg-gray-200 rounded w-full'></div>
                  <div className='h-4 bg-gray-200 rounded w-2/3'></div>
                </div>
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className='bg-white rounded-2xl shadow-md p-12 text-center'
          >
            <FiPackage className='mx-auto text-gray-300 text-8xl mb-4' />
            <h3 className='text-2xl font-bold text-gray-900 mb-2'>
              No orders found
            </h3>
            <p className='text-gray-600 mb-6'>
              {statusFilter !== 'all'
                ? 'No orders match your filter criteria'
                : "You haven't placed any orders yet"}
            </p>
            <button
              onClick={() => router.push('/shop/pharmacy')}
              className='bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors'
            >
              Start Shopping
            </button>
          </motion.div>
        ) : (
          <div className='space-y-4'>
            <AnimatePresence mode='popLayout'>
              {orders.map((order, index) => (
                <motion.div
                  key={order._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                  className='bg-white rounded-2xl shadow-md hover:shadow-xl transition-shadow overflow-hidden'
                >
                  {/* Order Header */}
                  <div className='bg-linear-to-r from-blue-50 to-indigo-50 p-6 border-b-2 border-blue-100'>
                    <div className='flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4'>
                      <div>
                        <h3 className='text-xl font-bold text-gray-900 mb-1'>
                          Order {order.orderNumber}
                        </h3>
                        <p className='text-sm text-gray-600'>
                          Placed on{' '}
                          {new Date(order.createdAt).toLocaleDateString(
                            'en-US',
                            {
                              month: 'long',
                              day: 'numeric',
                              year: 'numeric',
                            }
                          )}
                        </p>
                      </div>

                      <div className='flex items-center gap-3'>
                        <div
                          className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 font-semibold ${getStatusColor(order.status)}`}
                        >
                          {getStatusIcon(order.status)}
                          <span className='capitalize'>
                            {order.status.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className='p-6'>
                    <div className='space-y-4 mb-6'>
                      {order.items.map((item, idx) => (
                        <div
                          key={idx}
                          className='flex items-center gap-4 p-4 bg-gray-50 rounded-xl'
                        >
                          <div className='relative w-20 h-20 shrink-0 rounded-lg overflow-hidden bg-white'>
                            <Image
                              src={
                                item.product.image || '/placeholder-product.jpg'
                              }
                              alt={item.product.name}
                              fill
                              className='object-cover'
                            />
                          </div>
                          <div className='flex-1 min-w-0'>
                            <h4 className='font-semibold text-gray-900 truncate'>
                              {item.product.name}
                            </h4>
                            <p className='text-sm text-gray-600'>
                              Quantity: {item.quantity} × LKR{' '}
                              {item.price.toFixed(2)}
                            </p>
                          </div>
                          <div className='text-right'>
                            <p className='font-bold text-gray-900'>
                              LKR {(item.price * item.quantity).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Order Details */}
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-6'>
                      <div className='bg-gray-50 rounded-xl p-4'>
                        <h4 className='font-semibold text-gray-900 mb-3'>
                          Delivery Address
                        </h4>
                        <p className='text-sm text-gray-700 leading-relaxed'>
                          {order.shippingInfo.name}
                          <br />
                          {order.shippingInfo.address}
                          <br />
                          {order.shippingInfo.city},{' '}
                          {order.shippingInfo.postalCode}
                          <br />
                          Phone: {order.shippingInfo.phone}
                        </p>
                      </div>

                      <div className='bg-gray-50 rounded-xl p-4'>
                        <h4 className='font-semibold text-gray-900 mb-3'>
                          Order Summary
                        </h4>
                        <div className='space-y-2 text-sm'>
                          <div className='flex justify-between'>
                            <span className='text-gray-600'>
                              Payment Method:
                            </span>
                            <span className='font-semibold text-gray-900 uppercase'>
                              {order.paymentMethod}
                            </span>
                          </div>
                          <div className='flex justify-between'>
                            <span className='text-gray-600'>
                              Payment Status:
                            </span>
                            <span
                              className={`font-semibold ${
                                order.paymentStatus === 'paid'
                                  ? 'text-green-600'
                                  : 'text-yellow-600'
                              }`}
                            >
                              {order.paymentStatus.toUpperCase()}
                            </span>
                          </div>
                          {order.estimatedDelivery && (
                            <div className='flex justify-between'>
                              <span className='text-gray-600'>
                                Estimated Delivery:
                              </span>
                              <span className='font-semibold text-gray-900'>
                                {new Date(
                                  order.estimatedDelivery
                                ).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                          <div className='flex justify-between pt-2 border-t border-gray-300'>
                            <span className='font-semibold text-gray-900'>
                              Total Amount:
                            </span>
                            <span className='font-bold text-blue-600 text-lg'>
                              LKR {order.totalAmount.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className='flex flex-wrap gap-3'>
                      <button
                        onClick={() => router.push(`/my-orders/${order._id}`)}
                        className='flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors'
                      >
                        <FiEye />
                        View Details
                      </button>

                      <button
                        onClick={() => handleDownloadInvoice(order)}
                        className='flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors'
                      >
                        <FiDownload />
                        Download Invoice
                      </button>

                      {['pending', 'confirmed'].includes(order.status) && (
                        <button
                          onClick={() => handleCancelOrder(order._id)}
                          className='flex items-center gap-2 px-6 py-3 bg-red-50 text-red-600 rounded-xl font-semibold hover:bg-red-100 transition-colors'
                        >
                          <FiXCircle />
                          Cancel Order
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Pagination */}
        {!loading && orders.length > 0 && pagination.totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className='mt-8 flex justify-center items-center gap-2'
          >
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={!pagination.hasPrevPage}
              className='p-2 rounded-lg bg-white shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all'
            >
              <BiChevronLeft className='text-2xl' />
            </button>

            <div className='flex gap-2'>
              {[...Array(pagination.totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-10 h-10 rounded-lg font-semibold transition-all ${
                    currentPage === i + 1
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-white text-gray-700 hover:bg-gray-100 shadow-md'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>

            <button
              onClick={() =>
                setCurrentPage(p => Math.min(pagination.totalPages, p + 1))
              }
              disabled={!pagination.hasNextPage}
              className='p-2 rounded-lg bg-white shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all'
            >
              <BiChevronRight className='text-2xl' />
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}

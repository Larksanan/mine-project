/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  FiPackage,
  FiClock,
  FiCheckCircle,
  FiTruck,
  FiXCircle,
  FiDownload,
  FiArrowLeft,
  FiMapPin,
  FiPhone,
  FiMail,
  FiCalendar,
} from 'react-icons/fi';
import Image from 'next/image';

interface Order {
  _id: string;
  orderNumber: string;
  items: Array<{
    product: {
      _id: string;
      name: string;
      image: string;
      price: number;
    };
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  shippingInfo: {
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    postalCode: string;
    instructions?: string;
  };
  deliveryAddress: string;
  estimatedDelivery?: string;
  actualDelivery?: string;
  prescriptionImages?: string[];
  createdAt: string;
  updatedAt: string;
}

export default function OrderDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/orders/my-order/${orderId}`);
      const data = await response.json();

      if (data.success && data.order) {
        setOrder(data.order);
      } else {
        alert('Order not found');
        router.push('/my-orders');
      }
    } catch (error) {
      console.error('Error fetching order:', error);
      alert('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      preparing: 'bg-purple-100 text-purple-800',
      ready: 'bg-green-100 text-green-800',
      out_for_delivery: 'bg-indigo-100 text-indigo-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string) => {
    const icons = {
      pending: FiClock,
      confirmed: FiCheckCircle,
      preparing: FiPackage,
      ready: FiCheckCircle,
      out_for_delivery: FiTruck,
      delivered: FiCheckCircle,
      cancelled: FiXCircle,
    };
    const Icon = icons[status as keyof typeof icons] || FiPackage;
    return <Icon className='text-2xl' />;
  };

  const handleCancelOrder = async () => {
    if (!confirm('Are you sure you want to cancel this order?')) return;

    try {
      const response = await fetch(`/api/orders/my-order/${orderId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        alert('Order cancelled successfully');
        fetchOrderDetails();
      } else {
        alert(data.error || 'Failed to cancel order');
      }
    } catch (error) {
      console.error('Error cancelling order:', error);
      alert('Failed to cancel order');
    }
  };

  const handleDownloadInvoice = () => {
    if (!order) return;

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
            .footer { margin-top: 60px; text-align: center; color: #999; font-size: 12px; border-top: 1px solid #eee; padding-top: 20px;  }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-name">  Eastern Central</div>
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

          div class="footer">
            <p>Thank you for your business!</p>
            <p  > For any questions, please contact Main street batticalo road,Pandirupu,Kalmunai</p>
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

  if (loading) {
    return (
      <div className='min-h-screen bg-linear-to-br from-gray-50 to-blue-50 py-8'>
        <div className='max-w-5xl mx-auto px-4'>
          <div className='animate-pulse'>
            <div className='h-8 bg-gray-200 rounded w-1/4 mb-8'></div>
            <div className='bg-white rounded-2xl p-8 space-y-6'>
              <div className='h-6 bg-gray-200 rounded w-1/3'></div>
              <div className='h-4 bg-gray-200 rounded w-1/2'></div>
              <div className='h-32 bg-gray-200 rounded'></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className='min-h-screen bg-linear-to-br from-gray-50 to-blue-50 py-8'>
        <div className='max-w-5xl mx-auto px-4 text-center'>
          <FiPackage className='mx-auto text-gray-300 text-8xl mb-4' />
          <h2 className='text-2xl font-bold text-gray-900 mb-4'>
            Order Not Found
          </h2>
          <button
            onClick={() => router.push('/my-orders')}
            className='bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700'
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  const subtotal = order.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const tax = subtotal * 0.1;
  const shipping = subtotal > 50 ? 0 : 5.99;

  return (
    <div className='min-h-screen bg-linear-to-br from-gray-50 to-blue-50 py-8'>
      <div className='max-w-5xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Back Button */}
        <button
          onClick={() => router.push('/my-orders')}
          className='flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold mb-6 transition-colors'
        >
          <FiArrowLeft />
          Back to My Orders
        </button>

        {/* Order Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className='bg-white rounded-2xl shadow-xl p-8 mb-6'
        >
          <div className='flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6'>
            <div>
              <h1 className='text-3xl font-bold text-gray-900 mb-2'>
                Order {order.orderNumber}
              </h1>
              <p className='text-gray-600 flex items-center gap-2'>
                <FiCalendar />
                Placed on{' '}
                {new Date(order.createdAt).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>

            <div
              className={`flex items-center gap-3 px-6 py-3 rounded-xl font-bold text-lg ${getStatusColor(order.status)}`}
            >
              {getStatusIcon(order.status)}
              <span className='capitalize'>
                {order.status.replace('_', ' ')}
              </span>
            </div>
          </div>

          {/* Order Timeline */}
          <div className='border-t pt-6'>
            <h3 className='font-semibold text-gray-900 mb-4'>Order Progress</h3>
            <div className='flex justify-between items-center relative'>
              <div className='absolute top-5 left-0 right-0 h-1 bg-gray-200 -z-10'></div>
              {[
                'pending',
                'confirmed',
                'preparing',
                'out_for_delivery',
                'delivered',
              ].map((status, idx) => (
                <div key={status} className='flex flex-col items-center'>
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      [
                        'pending',
                        'confirmed',
                        'preparing',
                        'ready',
                        'out_for_delivery',
                        'delivered',
                      ].indexOf(order.status) >= idx
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-400'
                    }`}
                  >
                    {getStatusIcon(status)}
                  </div>
                  <span className='text-xs text-gray-600 mt-2 capitalize hidden sm:block'>
                    {status.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          {/* Order Items */}
          <div className='lg:col-span-2 space-y-6'>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className='bg-white rounded-2xl shadow-xl p-6'
            >
              <h2 className='text-xl font-bold text-gray-900 mb-4'>
                Order Items
              </h2>
              <div className='space-y-4'>
                {order.items.map((item, idx) => (
                  <div
                    key={idx}
                    className='flex items-center gap-4 p-4 bg-gray-50 rounded-xl'
                  >
                    <div className='relative w-24 h-24 shrink-0 rounded-lg overflow-hidden bg-white'>
                      <Image
                        src={item.product.image || '/placeholder-product.jpg'}
                        alt={item.product.name}
                        fill
                        className='object-cover'
                      />
                    </div>
                    <div className='flex-1'>
                      <h3 className='font-semibold text-gray-900 mb-1'>
                        {item.product.name}
                      </h3>
                      <p className='text-sm text-gray-600'>
                        Quantity: {item.quantity}
                      </p>
                      <p className='text-sm text-gray-600'>
                        Price: LKR {item.price.toFixed(2)} each
                      </p>
                    </div>
                    <div className='text-right'>
                      <p className='font-bold text-gray-900 text-lg'>
                        LKR {(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Delivery Address */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className='bg-white rounded-2xl shadow-xl p-6'
            >
              <h2 className='text-xl font-bold text-gray-900 mb-4 flex items-center gap-2'>
                <FiMapPin className='text-blue-600' />
                Delivery Address
              </h2>
              <div className='space-y-2 text-gray-700'>
                <p className='font-semibold'>{order.shippingInfo.name}</p>
                <p>{order.shippingInfo.address}</p>
                <p>
                  {order.shippingInfo.city}, {order.shippingInfo.postalCode}
                </p>
                <div className='flex items-center gap-2 mt-4 pt-4 border-t'>
                  <FiPhone className='text-blue-600' />
                  <span>{order.shippingInfo.phone}</span>
                </div>
                <div className='flex items-center gap-2'>
                  <FiMail className='text-blue-600' />
                  <span>{order.shippingInfo.email}</span>
                </div>
                {order.shippingInfo.instructions && (
                  <div className='mt-4 p-3 bg-blue-50 rounded-lg'>
                    <p className='text-sm font-semibold text-blue-900 mb-1'>
                      Delivery Instructions:
                    </p>
                    <p className='text-sm text-blue-800'>
                      {order.shippingInfo.instructions}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Order Summary */}
          <div className='lg:col-span-1'>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className='bg-white rounded-2xl shadow-xl p-6 sticky top-4'
            >
              <h2 className='text-xl font-bold text-gray-900 mb-6'>
                Order Summary
              </h2>

              <div className='space-y-4 mb-6'>
                <div className='flex justify-between text-gray-700'>
                  <span>Subtotal</span>
                  <span className='font-semibold'>
                    LKR {subtotal.toFixed(2)}
                  </span>
                </div>
                <div className='flex justify-between text-gray-700'>
                  <span>Tax (10%)</span>
                  <span className='font-semibold'>LKR {tax.toFixed(2)}</span>
                </div>
                <div className='flex justify-between text-gray-700'>
                  <span>Shipping</span>
                  <span className='font-semibold'>
                    {shipping === 0 ? 'FREE' : `LKR ${shipping.toFixed(2)}`}
                  </span>
                </div>
                <div className='border-t pt-4'>
                  <div className='flex justify-between text-xl font-bold text-gray-900'>
                    <span>Total</span>
                    <span className='text-blue-600'>
                      LKR {order.totalAmount.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div className='space-y-3 mb-6 pb-6 border-b'>
                <div className='flex justify-between'>
                  <span className='text-gray-600'>Payment Method</span>
                  <span className='font-semibold text-gray-900 uppercase'>
                    {order.paymentMethod}
                  </span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-gray-600'>Payment Status</span>
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
                    <span className='text-gray-600'>Est. Delivery</span>
                    <span className='font-semibold text-gray-900'>
                      {new Date(order.estimatedDelivery).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>

              <div className='space-y-3'>
                <button
                  onClick={handleDownloadInvoice}
                  className='w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors'
                >
                  <FiDownload />
                  Download Invoice
                </button>

                {['pending', 'confirmed'].includes(order.status) && (
                  <button
                    onClick={handleCancelOrder}
                    className='w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-600 rounded-xl font-semibold hover:bg-red-100 transition-colors'
                  >
                    <FiXCircle />
                    Cancel Order
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

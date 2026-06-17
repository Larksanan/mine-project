/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  FiArrowLeft,
  FiPackage,
  FiUser,
  FiMapPin,
  FiPhone,
  FiMail,
  FiCreditCard,
  FiCheck,
  FiX,
  FiTruck,
  FiImage,
  FiDollarSign,
  FiAlertCircle,
} from 'react-icons/fi';
import Image from 'next/image';

interface OrderItem {
  product: {
    _id: string;
    name: string;
    price: number;
    image?: string;
    requiresPrescription?: boolean;
  };
  quantity: number;
  price: number;
  prescriptionVerified?: boolean;
}

interface Order {
  _id: string;
  orderNumber: string;
  customer?: {
    _id: string;
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
    instructions?: string;
  };
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
  deliveryAddress: string;
  prescriptionImages?: string[];
  createdAt: string;
  updatedAt: string;
  estimatedDelivery?: string;
}

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);

  // Handle params extraction
  useEffect(() => {
    const id = params?.id;
    console.log('Raw params:', params);
    console.log('Extracted ID:', id);

    if (id && id !== 'undefined') {
      setOrderId(id);
    } else {
      console.error('Invalid order ID from params');
      setLoading(false);
    }
  }, [params]);

  // Fetch order when orderId is set
  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId]);

  const fetchOrderDetails = async () => {
    if (!orderId || orderId === 'undefined') {
      console.error('Cannot fetch: Invalid order ID');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('Fetching order with ID:', orderId);

      const response = await fetch(`/api/orders/${orderId}`);
      const data = await response.json();

      console.log('API Response:', data);

      if (data.success && data.order) {
        setOrder(data.order);
      } else {
        console.error('Order not found:', data.error);
        alert(data.error || 'Order not found');
        router.push('/pharmacist/orders');
      }
    } catch (error) {
      console.error('Error fetching order:', error);
      alert('Failed to fetch order details');
      router.push('/pharmacist/orders');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (newStatus: string) => {
    if (!order || !orderId) return;

    try {
      setUpdating(true);
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();
      if (data.success) {
        setOrder(data.order);
        alert(`Order status updated to ${newStatus}`);
      } else {
        alert(data.error || 'Failed to update order');
      }
    } catch (error) {
      console.error('Error updating order:', error);
      alert('Failed to update order');
    } finally {
      setUpdating(false);
    }
  };

  const updatePaymentStatus = async (newStatus: string) => {
    if (!order || !orderId) return;

    try {
      setUpdating(true);
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentStatus: newStatus }),
      });

      const data = await response.json();
      if (data.success) {
        setOrder(data.order);
        alert(`Payment status updated to ${newStatus}`);
      } else {
        alert(data.error || 'Failed to update payment status');
      }
    } catch (error) {
      console.error('Error updating payment status:', error);
      alert('Failed to update payment status');
    } finally {
      setUpdating(false);
    }
  };

  const verifyPrescription = async () => {
    if (!order || !orderId) return;

    try {
      setUpdating(true);
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prescriptionVerified: true }),
      });

      const data = await response.json();
      if (data.success) {
        setOrder(data.order);
        alert('Prescription verified successfully');
      } else {
        alert(data.error || 'Failed to verify prescription');
      }
    } catch (error) {
      console.error('Error verifying prescription:', error);
      alert('Failed to verify prescription');
    } finally {
      setUpdating(false);
    }
  };

  const cancelOrder = async () => {
    if (!order || !orderId) return;
    if (!confirm('Are you sure you want to cancel this order?')) return;

    try {
      setUpdating(true);
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        alert('Order cancelled successfully');
        router.push('/pharmacist/orders');
      } else {
        alert(data.error || 'Failed to cancel order');
      }
    } catch (error) {
      console.error('Error cancelling order:', error);
      alert('Failed to cancel order');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'preparing':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'ready':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'out_for_delivery':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'delivered':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'refunded':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const requiresPrescription = order?.items.some(
    item => item.product.requiresPrescription
  );

  const allPrescriptionsVerified = order?.items.every(
    item => !item.product.requiresPrescription || item.prescriptionVerified
  );

  // Show loading state
  if (loading) {
    return (
      <div className='min-h-screen bg-gray-50 p-6'>
        <div className='max-w-6xl mx-auto'>
          <div className='animate-pulse space-y-6'>
            <div className='bg-gray-200 h-12 rounded'></div>
            <div className='bg-gray-200 h-64 rounded'></div>
            <div className='bg-gray-200 h-48 rounded'></div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state if no orderId
  if (!orderId || orderId === 'undefined') {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <FiPackage className='mx-auto text-6xl text-gray-300 mb-4' />
          <h2 className='text-2xl font-bold text-gray-900 mb-2'>
            Invalid Order ID
          </h2>
          <p className='text-gray-600 mb-4'>
            The order ID is missing or invalid.
          </p>
          <button
            onClick={() => router.push('/pharmacist/orders')}
            className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700'
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  // Show not found state
  if (!order) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <FiPackage className='mx-auto text-6xl text-gray-300 mb-4' />
          <h2 className='text-2xl font-bold text-gray-900 mb-2'>
            Order not found
          </h2>
          <p className='text-gray-600 mb-4'>
            The order you&apos;re looking for doesn&apos;t exist or you
            don&apos;t have access to it.
          </p>
          <button
            onClick={() => router.push('/pharmacist/orders')}
            className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700'
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50 p-6'>
      <div className='max-w-6xl mx-auto'>
        {/* Header */}
        <div className='mb-6'>
          <button
            onClick={() => router.push('/pharmacist/orders')}
            className='flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4'
          >
            <FiArrowLeft />
            Back to Orders
          </button>

          <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
            <div>
              <h1 className='text-3xl font-bold text-gray-900'>
                Order #{order.orderNumber}
              </h1>
              <p className='text-gray-600 mt-1'>
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

            <div className='flex flex-wrap gap-2'>
              <span
                className={`px-4 py-2 rounded-lg font-semibold border ${getStatusColor(order.status)}`}
              >
                {order.status.replace('_', ' ').toUpperCase()}
              </span>
              <span
                className={`px-4 py-2 rounded-lg font-semibold ${getPaymentStatusColor(order.paymentStatus)}`}
              >
                {order.paymentStatus.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Prescription Alert */}
        {requiresPrescription && (
          <div
            className={`mb-6 p-4 rounded-lg border-l-4 ${
              allPrescriptionsVerified
                ? 'bg-green-50 border-green-500'
                : 'bg-yellow-50 border-yellow-500'
            }`}
          >
            <div className='flex items-start gap-3'>
              <FiAlertCircle
                className={`text-2xl mt-0.5 ${
                  allPrescriptionsVerified
                    ? 'text-green-600'
                    : 'text-yellow-600'
                }`}
              />
              <div className='flex-1'>
                <h3
                  className={`font-semibold ${
                    allPrescriptionsVerified
                      ? 'text-green-900'
                      : 'text-yellow-900'
                  }`}
                >
                  {allPrescriptionsVerified
                    ? 'Prescription Verified'
                    : 'Prescription Required'}
                </h3>
                <p
                  className={`text-sm mt-1 ${
                    allPrescriptionsVerified
                      ? 'text-green-700'
                      : 'text-yellow-700'
                  }`}
                >
                  {allPrescriptionsVerified
                    ? 'All prescription items have been verified and approved.'
                    : 'This order contains items that require prescription verification before processing.'}
                </p>
              </div>
              {!allPrescriptionsVerified && (
                <button
                  onClick={verifyPrescription}
                  disabled={updating}
                  className='px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  Verify Prescription
                </button>
              )}
            </div>
          </div>
        )}

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          {/* Main Content */}
          <div className='lg:col-span-2 space-y-6'>
            {/* Order Items */}
            <div className='bg-white rounded-lg shadow-sm overflow-hidden'>
              <div className='p-6 border-b border-gray-200'>
                <h2 className='text-xl font-bold text-gray-900 flex items-center gap-2'>
                  <FiPackage />
                  Order Items ({order.items.length})
                </h2>
              </div>
              <div className='divide-y divide-gray-200'>
                {order.items.map((item, index) => (
                  <div
                    key={index}
                    className='p-6 flex items-center gap-4 hover:bg-gray-50'
                  >
                    <div className='relative w-20 h-20 bg-gray-100 rounded-lg shrink-0 overflow-hidden'>
                      {item.product.image ? (
                        <Image
                          src={item.product.image}
                          alt={item.product.name}
                          fill
                          className='object-cover'
                        />
                      ) : (
                        <div className='w-full h-full flex items-center justify-center'>
                          <FiPackage className='text-gray-400 text-3xl' />
                        </div>
                      )}
                    </div>
                    <div className='flex-1'>
                      <h3 className='font-semibold text-gray-900'>
                        {item.product.name}
                      </h3>
                      <div className='flex items-center gap-2 mt-1'>
                        <p className='text-sm text-gray-600'>
                          Quantity: {item.quantity}
                        </p>
                        {item.product.requiresPrescription && (
                          <span className='px-2 py-0.5 bg-orange-100 text-orange-800 text-xs rounded-full'>
                            Rx Required
                          </span>
                        )}
                        {item.prescriptionVerified && (
                          <span className='px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full flex items-center gap-1'>
                            <FiCheck className='text-xs' />
                            Verified
                          </span>
                        )}
                      </div>
                    </div>
                    <div className='text-right'>
                      <p className='text-sm text-gray-600'>
                        LKR {item.price.toFixed(2)} each
                      </p>
                      <p className='font-bold text-gray-900'>
                        LKR {(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Summary */}
              <div className='p-6 bg-gray-50 border-t border-gray-200'>
                <div className='space-y-2'>
                  <div className='flex justify-between text-sm'>
                    <span className='text-gray-600'>Subtotal</span>
                    <span className='font-medium'>
                      LKR{' '}
                      {order.items
                        .reduce(
                          (sum, item) => sum + item.price * item.quantity,
                          0
                        )
                        .toFixed(2)}
                    </span>
                  </div>
                  <div className='flex justify-between text-sm'>
                    <span className='text-gray-600'>Tax (10%)</span>
                    <span className='font-medium'>
                      LKR{' '}
                      {(
                        order.items.reduce(
                          (sum, item) => sum + item.price * item.quantity,
                          0
                        ) * 0.1
                      ).toFixed(2)}
                    </span>
                  </div>
                  <div className='flex justify-between text-sm'>
                    <span className='text-gray-600'>Shipping</span>
                    <span className='font-medium'>
                      {order.totalAmount > 50 ? 'FREE' : 'LKR 5.99'}
                    </span>
                  </div>
                  <div className='pt-2 border-t border-gray-300 flex justify-between'>
                    <span className='text-lg font-bold text-gray-900'>
                      Total
                    </span>
                    <span className='text-lg font-bold text-gray-900'>
                      LKR {order.totalAmount.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Prescription Images */}
            {order.prescriptionImages &&
              order.prescriptionImages.length > 0 && (
                <div className='bg-white rounded-lg shadow-sm overflow-hidden'>
                  <div className='p-6 border-b border-gray-200'>
                    <h2 className='text-xl font-bold text-gray-900 flex items-center gap-2'>
                      <FiImage />
                      Prescription Images ({order.prescriptionImages.length})
                    </h2>
                  </div>
                  <div className='p-6'>
                    <div className='grid grid-cols-2 md:grid-cols-3 gap-4'>
                      {order.prescriptionImages.map((image, index) => (
                        <div
                          key={index}
                          className='relative aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:opacity-75 transition-opacity'
                          onClick={() => setSelectedImage(image)}
                        >
                          <Image
                            src={image}
                            alt={`Prescription ${index + 1}`}
                            fill
                            className='object-cover'
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
          </div>

          {/* Sidebar */}
          <div className='space-y-6'>
            {/* Customer Info */}
            <div className='bg-white rounded-lg shadow-sm overflow-hidden'>
              <div className='p-6 border-b border-gray-200'>
                <h2 className='text-xl font-bold text-gray-900 flex items-center gap-2'>
                  <FiUser />
                  Customer Details
                </h2>
              </div>
              <div className='p-6 space-y-4'>
                <div>
                  <p className='text-sm text-gray-600 mb-1'>Name</p>
                  <p className='font-semibold text-gray-900'>
                    {order.shippingInfo.name}
                  </p>
                </div>
                <div>
                  <p className='text-sm text-gray-600 mb-1 flex items-center gap-1'>
                    <FiPhone className='text-xs' /> Phone
                  </p>
                  <a
                    href={`tel:${order.shippingInfo.phone}`}
                    className='font-semibold text-blue-600 hover:text-blue-700'
                  >
                    {order.shippingInfo.phone}
                  </a>
                </div>
                <div>
                  <p className='text-sm text-gray-600 mb-1 flex items-center gap-1'>
                    <FiMail className='text-xs' /> Email
                  </p>
                  <a
                    href={`mailto:${order.shippingInfo.email}`}
                    className='font-semibold text-blue-600 hover:text-blue-700 break-all'
                  >
                    {order.shippingInfo.email}
                  </a>
                </div>
              </div>
            </div>

            {/* Delivery Info */}
            <div className='bg-white rounded-lg shadow-sm overflow-hidden'>
              <div className='p-6 border-b border-gray-200'>
                <h2 className='text-xl font-bold text-gray-900 flex items-center gap-2'>
                  <FiMapPin />
                  Delivery Details
                </h2>
              </div>
              <div className='p-6 space-y-4'>
                <div>
                  <p className='text-sm text-gray-600 mb-1'>Address</p>
                  <p className='font-medium text-gray-900'>
                    {order.deliveryAddress}
                  </p>
                </div>
                {order.shippingInfo.instructions && (
                  <div>
                    <p className='text-sm text-gray-600 mb-1'>Instructions</p>
                    <p className='text-sm text-gray-700'>
                      {order.shippingInfo.instructions}
                    </p>
                  </div>
                )}
                {order.estimatedDelivery && (
                  <div>
                    <p className='text-sm text-gray-600 mb-1'>
                      Estimated Delivery
                    </p>
                    <p className='font-semibold text-gray-900'>
                      {new Date(order.estimatedDelivery).toLocaleDateString(
                        'en-US',
                        {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                        }
                      )}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Info */}
            <div className='bg-white rounded-lg shadow-sm overflow-hidden'>
              <div className='p-6 border-b border-gray-200'>
                <h2 className='text-xl font-bold text-gray-900 flex items-center gap-2'>
                  <FiCreditCard />
                  Payment Details
                </h2>
              </div>
              <div className='p-6 space-y-4'>
                <div>
                  <p className='text-sm text-gray-600 mb-1'>Payment Method</p>
                  <p className='font-semibold text-gray-900 uppercase'>
                    {order.paymentMethod}
                  </p>
                </div>
                <div>
                  <p className='text-sm text-gray-600 mb-1'>Payment Status</p>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getPaymentStatusColor(order.paymentStatus)}`}
                  >
                    {order.paymentStatus.toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className='text-sm text-gray-600 mb-1'>Total Amount</p>
                  <p className='text-2xl font-bold text-gray-900'>
                    LKR {order.totalAmount.toFixed(2)}
                  </p>
                </div>

                {order.paymentStatus === 'pending' &&
                  order.paymentMethod === 'cash' && (
                    <button
                      onClick={() => updatePaymentStatus('paid')}
                      disabled={updating}
                      className='w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2'
                    >
                      <FiDollarSign />
                      Mark as Paid
                    </button>
                  )}
              </div>
            </div>

            {/* Actions */}
            <div className='bg-white rounded-lg shadow-sm overflow-hidden'>
              <div className='p-6 border-b border-gray-200'>
                <h2 className='text-xl font-bold text-gray-900'>Actions</h2>
              </div>
              <div className='p-6 space-y-3'>
                {order.status === 'pending' && (
                  <button
                    onClick={() => updateOrderStatus('confirmed')}
                    disabled={updating}
                    className='w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2'
                  >
                    <FiCheck />
                    Confirm Order
                  </button>
                )}

                {order.status === 'confirmed' && (
                  <button
                    onClick={() => updateOrderStatus('preparing')}
                    disabled={updating}
                    className='w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2'
                  >
                    <FiPackage />
                    Start Preparing
                  </button>
                )}

                {order.status === 'preparing' && (
                  <button
                    onClick={() => updateOrderStatus('ready')}
                    disabled={updating}
                    className='w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2'
                  >
                    <FiCheck />
                    Mark as Ready
                  </button>
                )}

                {order.status === 'ready' && (
                  <button
                    onClick={() => updateOrderStatus('out_for_delivery')}
                    disabled={updating}
                    className='w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2'
                  >
                    <FiTruck />
                    Dispatch Order
                  </button>
                )}

                {order.status === 'out_for_delivery' && (
                  <button
                    onClick={() => updateOrderStatus('delivered')}
                    disabled={updating}
                    className='w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2'
                  >
                    <FiCheck />
                    Mark as Delivered
                  </button>
                )}

                {['pending', 'confirmed'].includes(order.status) && (
                  <button
                    onClick={cancelOrder}
                    disabled={updating}
                    className='w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2'
                  >
                    <FiX />
                    Cancel Order
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div
          className='fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4'
          onClick={() => setSelectedImage(null)}
        >
          <div className='relative max-w-4xl max-h-[90vh] w-full h-full'>
            <button
              onClick={() => setSelectedImage(null)}
              className='absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-75 z-10'
            >
              <FiX className='text-2xl' />
            </button>
            <div className='relative w-full h-full'>
              <Image
                src={selectedImage}
                alt='Prescription'
                fill
                className='object-contain'
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

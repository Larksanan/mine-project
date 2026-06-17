'use client';

import { useState, useEffect } from 'react';
import {
  FiTruck,
  FiMapPin,
  FiPhone,
  FiClock,
  FiCheckCircle,
} from 'react-icons/fi';

interface DeliveryOrder {
  _id: string;
  orderId: string;
  customer: {
    name: string;
    phone: string;
  };
  deliveryAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    instructions?: string;
  };
  items: Array<{
    product: {
      name: string;
      requiresPrescription: boolean;
    };
    quantity: number;
  }>;
  scheduledTime?: string;
  driver?: {
    name: string;
    phone: string;
    vehicle: string;
  };
  status: 'pending' | 'assigned' | 'picked_up' | 'on_way' | 'delivered';
  estimatedDelivery?: string;
}

export default function PharmacistDeliveryPage() {
  const [deliveries, setDeliveries] = useState<DeliveryOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDeliveries();
  }, []);

  const fetchDeliveries = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/pharmacy/delivery');
      const data = await response.json();

      if (data.success) {
        setDeliveries(data.data.deliveries);
      }
    } catch (error) {
      console.error('Error fetching deliveries:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateDeliveryStatus = async (
    deliveryId: string,
    newStatus: string
  ) => {
    try {
      const response = await fetch(`/api/pharmacy/delivery/${deliveryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();
      if (data.success) {
        fetchDeliveries();
      } else {
        alert(data.error || 'Failed to update delivery');
      }
    } catch (error) {
      console.error('Error updating delivery:', error);
      alert('Failed to update delivery');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'assigned':
        return 'bg-blue-100 text-blue-800';
      case 'picked_up':
        return 'bg-purple-100 text-purple-800';
      case 'on_way':
        return 'bg-indigo-100 text-indigo-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className='min-h-screen bg-gray-50 p-6'>
      <div className='max-w-7xl mx-auto'>
        {/* Header */}
        <div className='mb-8'>
          <h1 className='text-3xl font-bold text-gray-900'>
            Delivery Management
          </h1>
          <p className='text-gray-600 mt-1'>
            Track and manage medicine deliveries
          </p>
        </div>

        {/* Delivery Grid */}
        {loading ? (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className='bg-white rounded-lg shadow-sm p-6 animate-pulse'
              >
                <div className='bg-gray-200 h-4 rounded mb-2'></div>
                <div className='bg-gray-200 h-3 rounded w-2/3 mb-4'></div>
                <div className='bg-gray-200 h-20 rounded mb-4'></div>
                <div className='bg-gray-200 h-8 rounded'></div>
              </div>
            ))}
          </div>
        ) : (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {deliveries.map(delivery => (
              <div
                key={delivery._id}
                className='bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6'
              >
                {/* Header */}
                <div className='flex justify-between items-start mb-4'>
                  <div>
                    <h3 className='font-semibold text-gray-900'>
                      #{delivery.orderId}
                    </h3>
                    <p className='text-sm text-gray-600'>
                      {delivery.customer.name}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(delivery.status)}`}
                  >
                    {delivery.status.replace('_', ' ')}
                  </span>
                </div>

                {/* Delivery Info */}
                <div className='space-y-3 mb-4'>
                  <div className='flex items-center gap-2 text-sm text-gray-600'>
                    <FiMapPin className='text-red-500' />
                    <span className='line-clamp-1'>
                      {delivery.deliveryAddress.street}
                    </span>
                  </div>
                  <div className='flex items-center gap-2 text-sm text-gray-600'>
                    <FiPhone className='text-green-500' />
                    <span>{delivery.customer.phone}</span>
                  </div>
                  {delivery.estimatedDelivery && (
                    <div className='flex items-center gap-2 text-sm text-gray-600'>
                      <FiClock className='text-blue-500' />
                      <span>
                        Est:{' '}
                        {new Date(
                          delivery.estimatedDelivery
                        ).toLocaleTimeString()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Items */}
                <div className='border-t pt-3 mb-4'>
                  <p className='text-sm font-medium text-gray-700 mb-2'>
                    Items:
                  </p>
                  <div className='space-y-1'>
                    {delivery.items.slice(0, 2).map((item, index) => (
                      <div key={index} className='flex justify-between text-sm'>
                        <span className='text-gray-600'>
                          {item.product.name}
                          {item.product.requiresPrescription && (
                            <span className='ml-1 text-xs text-purple-600'>
                              (Rx)
                            </span>
                          )}
                        </span>
                        <span className='text-gray-900'>x{item.quantity}</span>
                      </div>
                    ))}
                    {delivery.items.length > 2 && (
                      <p className='text-xs text-gray-500'>
                        +{delivery.items.length - 2} more items
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className='flex gap-2'>
                  {delivery.status === 'pending' && (
                    <button
                      onClick={() =>
                        updateDeliveryStatus(delivery._id, 'assigned')
                      }
                      className='flex-1 bg-blue-600 text-white py-2 px-3 rounded text-sm hover:bg-blue-700'
                    >
                      Assign Driver
                    </button>
                  )}
                  {delivery.status === 'assigned' && (
                    <button
                      onClick={() =>
                        updateDeliveryStatus(delivery._id, 'picked_up')
                      }
                      className='flex-1 bg-purple-600 text-white py-2 px-3 rounded text-sm hover:bg-purple-700'
                    >
                      Mark Picked Up
                    </button>
                  )}
                  {delivery.status === 'picked_up' && (
                    <button
                      onClick={() =>
                        updateDeliveryStatus(delivery._id, 'on_way')
                      }
                      className='flex-1 bg-indigo-600 text-white py-2 px-3 rounded text-sm hover:bg-indigo-700'
                    >
                      On the Way
                    </button>
                  )}
                  {delivery.status === 'on_way' && (
                    <button
                      onClick={() =>
                        updateDeliveryStatus(delivery._id, 'delivered')
                      }
                      className='flex-1 bg-green-600 text-white py-2 px-3 rounded text-sm hover:bg-green-700'
                    >
                      <FiCheckCircle className='inline mr-1' />
                      Deliver
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && deliveries.length === 0 && (
          <div className='bg-white rounded-lg shadow-sm p-12 text-center'>
            <FiTruck className='mx-auto text-6xl text-gray-300 mb-4' />
            <h3 className='text-xl font-semibold text-gray-900 mb-2'>
              No deliveries
            </h3>
            <p className='text-gray-600'>
              There are no pending deliveries at the moment
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import useCartContext, { type CartContextType } from '@/context/CartContext';
import {
  shippingInfoSchema,
  paymentInfoSchema,
  type ShippingInfo,
  type PaymentInfo,
} from '@/validation/checkout';

import ProgressSteps from '@/components/checkout/ProgressSteps';
import OrderSummary from '@/components/checkout/OrderSummary';
import ShippingStep from '@/components/checkout/steps/ShippingStep';
import ReviewStep from '@/components/checkout/steps/ReviewStep';
import PaymentStep from '@/components/checkout/steps/PaymentStep';
import SuccessScreen from '@/components/checkout/SuccessScreen';
import CheckoutHeader from '@/components/checkout/CheckoutHeader';

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, clearCart } = useCartContext() as CartContextType;

  const [currentStep, setCurrentStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [prescriptionFiles, setPrescriptionFiles] = useState<File[]>([]);

  const {
    register: shippingRegister,
    formState: { errors: shippingErrors },
    getValues: getShippingValues,
    trigger: triggerShippingValidation,
  } = useForm<ShippingInfo>({
    resolver: zodResolver(shippingInfoSchema) as Resolver<ShippingInfo>,
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'Sri Lanka',
    },
  });

  const {
    register: paymentRegister,
    handleSubmit: handlePaymentSubmit,
    formState: { errors: paymentErrors },
    watch: watchPayment,
    setValue: setPaymentValue,
  } = useForm<PaymentInfo>({
    resolver: zodResolver(paymentInfoSchema) as Resolver<PaymentInfo>,
    defaultValues: {
      paymentMethod: 'card',
    },
  });

  const hasRxItems = cart.some(item => item.requiresPrescription);

  useEffect(() => {
    if (cart.length === 0 && !orderSuccess) {
      router.push('/shop/pharmacy');
    }
  }, [cart, router, orderSuccess]);

  const handleNextStep = async () => {
    if (currentStep === 1) {
      const isValid = await triggerShippingValidation();
      if (isValid) {
        setCurrentStep(2);
      }
    } else if (currentStep === 2) {
      if (hasRxItems && prescriptionFiles.length === 0) {
        alert('Please upload prescription for Rx items');
        return;
      }
      setCurrentStep(3);
    }
  };

  // Calculate totals function
  const calculateTotal = () => {
    const subtotal = cart.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const tax = subtotal * 0.1;
    const shipping = subtotal > 50 ? 0 : 5.99;
    return subtotal + tax + shipping;
  };

  const handlePlaceOrder = handlePaymentSubmit(async paymentData => {
    setIsProcessing(true);

    try {
      const shippingData = getShippingValues();

      const orderData = {
        items: cart.map(item => ({
          productId: item._id,
          quantity: item.quantity,
        })),
        shippingInfo: shippingData,
        paymentMethod: paymentData.paymentMethod,
        prescriptionImages: prescriptionFiles.map(f => f.name),
        deliveryInstructions: '',
      };

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        throw new Error('Failed to create order');
      }

      setOrderSuccess(true);
      clearCart();
    } catch (error) {
      console.error('Order error:', error);
      alert('Failed to place order. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  });

  if (orderSuccess) {
    const shippingData = getShippingValues();
    const total = calculateTotal();
    return (
      <SuccessScreen
        email={shippingData.email}
        total={total}
        onContinueShopping={() => router.push('/shop/pharmacy')}
        onViewOrders={() => router.push('/my-orders')}
      />
    );
  }

  return (
    <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
      <CheckoutHeader />

      <ProgressSteps currentStep={currentStep} />

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
        {/* Main Content */}
        <div className='lg:col-span-2'>
          <AnimatePresence mode='wait'>
            {currentStep === 1 && (
              <ShippingStep
                register={shippingRegister}
                errors={shippingErrors}
                onNext={handleNextStep}
              />
            )}

            {currentStep === 2 && (
              <ReviewStep
                cart={cart}
                shippingInfo={getShippingValues()}
                hasRxItems={hasRxItems}
                prescriptionFiles={prescriptionFiles}
                onPrescriptionUpload={setPrescriptionFiles}
                onEditAddress={() => setCurrentStep(1)}
                onNext={handleNextStep}
              />
            )}

            {currentStep === 3 && (
              <PaymentStep
                register={paymentRegister}
                errors={paymentErrors}
                paymentMethod={watchPayment('paymentMethod')}
                setPaymentValue={setPaymentValue}
                isProcessing={isProcessing}
                onBack={() => setCurrentStep(2)}
                onSubmit={handlePlaceOrder}
                total={calculateTotal()}
              />
            )}
          </AnimatePresence>
        </div>
        <div className='lg:col-span-1'>
          <OrderSummary hasRxItems={hasRxItems} />
        </div>
      </div>
    </div>
  );
}

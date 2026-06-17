/**
 * @jest-environment jsdom
 */
/* eslint-disable no-undef */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CheckoutPage from './page';
import useCartContext from '@/context/CartContext';
import { useRouter } from 'next/navigation';

jest.mock('@/context/CartContext');
jest.mock('next/navigation');
jest.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  motion: {
    div: ({
      children,
      ...props
    }: React.PropsWithChildren<Record<string, unknown>>) => (
      <div {...props}>{children}</div>
    ),
    button: ({
      children,
      ...props
    }: React.PropsWithChildren<Record<string, unknown>>) => (
      <button {...props}>{children}</button>
    ),
  },
}));

jest.mock('react-hook-form', () => ({
  useForm: () => ({
    register: jest.fn(),
    handleSubmit: (fn: (data: unknown) => Promise<void>) => async () => {
      await fn({ paymentMethod: 'card' });
    },
    formState: { errors: {} },
    getValues: jest.fn(() => ({
      fullName: 'jebrsan thatcroos',
      email: 'jebarsanthatcroos@gamil.com',
      phone: '076 239 7951',
      address: 'no 23 ,thalaimanar mannar.',
      city: 'monnar',
      state: 'northan',
      zipCode: '41000',
      country: 'Sri Lanka',
    })),
    trigger: jest.fn().mockResolvedValue(true),
    watch: jest.fn(),
    setValue: jest.fn(),
  }),
}));

jest.mock('@/components/checkout/steps/ShippingStep', () => {
  const ShippingStepMock = ({ onNext }: { onNext: () => void }) => (
    <button data-testid='shipping-next' onClick={onNext}>
      Next
    </button>
  );
  ShippingStepMock.displayName = 'ShippingStep';
  return ShippingStepMock;
});

jest.mock('@/components/checkout/steps/ReviewStep', () => {
  const ReviewStepMock = ({
    onNext,
    onPrescriptionUpload,
  }: {
    onNext: () => void;
    onPrescriptionUpload: (files: File[]) => void;
  }) => (
    <div>
      <button data-testid='review-next' onClick={onNext}>
        Next
      </button>
      <button
        data-testid='upload-rx'
        onClick={() => onPrescriptionUpload([new File([''], 'rx.png')])}
      >
        Upload
      </button>
    </div>
  );
  ReviewStepMock.displayName = 'ReviewStep';
  return ReviewStepMock;
});

jest.mock('@/components/checkout/steps/PaymentStep', () => {
  const PaymentStepMock = ({ onSubmit }: { onSubmit: () => void }) => (
    <button data-testid='place-order' onClick={onSubmit}>
      Place Order
    </button>
  );
  PaymentStepMock.displayName = 'PaymentStep';
  return PaymentStepMock;
});

jest.mock('@/components/checkout/SuccessScreen', () => {
  const SuccessScreenMock = () => <div data-testid='success-screen' />;
  SuccessScreenMock.displayName = 'SuccessScreen';
  return SuccessScreenMock;
});

jest.mock('@/components/checkout/ProgressSteps', () => {
  const ProgressStepsMock = () => <div>Steps</div>;
  ProgressStepsMock.displayName = 'ProgressSteps';
  return ProgressStepsMock;
});

jest.mock('@/components/checkout/OrderSummary', () => {
  const OrderSummaryMock = () => <div>Summary</div>;
  OrderSummaryMock.displayName = 'OrderSummary';
  return OrderSummaryMock;
});

jest.mock('@/components/checkout/CheckoutHeader', () => {
  const CheckoutHeaderMock = () => <div>Header</div>;
  CheckoutHeaderMock.displayName = 'CheckoutHeader';
  return CheckoutHeaderMock;
});

type FetchMock = jest.MockedFunction<typeof fetch>;

describe('CheckoutPage', () => {
  const mockPush = jest.fn();
  const mockClearCart = jest.fn();
  let mockFetch: FetchMock;

  beforeEach(() => {
    jest.clearAllMocks();

    global.window = {
      alert: jest.fn(),
    } as unknown as Window & typeof globalThis;

    jest.spyOn(window, 'alert').mockImplementation(() => {});

    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    (useCartContext as jest.Mock).mockReturnValue({
      cart: [{ _id: '1', price: 10, quantity: 1, requiresPrescription: false }],
      clearCart: mockClearCart,
    });

    mockFetch = jest.fn() as FetchMock;
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        orderId: 'mockOrderId123',
        message: 'Order placed successfully',
      }),
    } as Response);
    global.fetch = mockFetch;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders correctly', () => {
    render(<CheckoutPage />);
    expect(screen.getByText('Header')).toBeInTheDocument();
    expect(screen.getByTestId('shipping-next')).toBeInTheDocument();
  });

  it('redirects if cart is empty', () => {
    (useCartContext as jest.Mock).mockReturnValue({
      cart: [],
      clearCart: mockClearCart,
    });
    render(<CheckoutPage />);
    expect(mockPush).toHaveBeenCalledWith('/shop/pharmacy');
  });

  it('navigates through steps', async () => {
    render(<CheckoutPage />);

    fireEvent.click(screen.getByTestId('shipping-next'));
    await waitFor(() =>
      expect(screen.getByTestId('review-next')).toBeInTheDocument()
    );

    fireEvent.click(screen.getByTestId('review-next'));
    await waitFor(() =>
      expect(screen.getByTestId('place-order')).toBeInTheDocument()
    );
  });

  it('blocks review step if prescription missing for Rx items', async () => {
    (useCartContext as jest.Mock).mockReturnValue({
      cart: [{ _id: '1', price: 10, quantity: 1, requiresPrescription: true }],
      clearCart: mockClearCart,
    });

    render(<CheckoutPage />);

    fireEvent.click(screen.getByTestId('shipping-next'));
    await waitFor(() =>
      expect(screen.getByTestId('review-next')).toBeInTheDocument()
    );

    fireEvent.click(screen.getByTestId('review-next'));
    expect(window.alert).toHaveBeenCalledWith(
      'Please upload prescription for Rx items'
    );
    expect(screen.queryByTestId('place-order')).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId('upload-rx'));
    fireEvent.click(screen.getByTestId('review-next'));
    await waitFor(() =>
      expect(screen.getByTestId('place-order')).toBeInTheDocument()
    );
  });

  it('places order successfully', async () => {
    render(<CheckoutPage />);

    fireEvent.click(screen.getByTestId('shipping-next'));
    await waitFor(() => fireEvent.click(screen.getByTestId('review-next')));

    // Place order
    fireEvent.click(screen.getByTestId('place-order'));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/orders',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"fullName":"jebrsan thatcroos"'),
        })
      );
      expect(mockClearCart).toHaveBeenCalled();
      expect(screen.getByTestId('success-screen')).toBeInTheDocument();
    });
  });

  it('handles order failure', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Failed'));
    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    render(<CheckoutPage />);

    fireEvent.click(screen.getByTestId('shipping-next'));
    await waitFor(() => fireEvent.click(screen.getByTestId('review-next')));

    fireEvent.click(screen.getByTestId('place-order'));

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith(
        'Failed to place order. Please try again.'
      );
    });

    consoleSpy.mockRestore();
  });
});

import { CartItem } from '../CartContext';

export const createMockCartItem = (
  overrides?: Partial<CartItem>
): CartItem => ({
  _id: `product-${Date.now()}`,
  name: 'Test Product',
  image: '/test-image.jpg',
  price: 100,
  quantity: 1,
  description: 'Test description',
  category: 'Test Category',
  inStock: true,
  stockQuantity: 50,
  requiresPrescription: false,
  pharmacy: {
    id: 'pharmacy-123',
    name: 'Test Pharmacy',
    address: '123 Test St',
  },
  itemTotal: 100,
  ...overrides,
});

describe('test-helpers', () => {
  it('should create a mock cart item', () => {
    const item = createMockCartItem();
    expect(item).toBeDefined();
    expect(item.name).toBe('Test Product');
  });
});

export const createMockValidation = (overrides?: any) => ({
  valid: true,
  unavailableItems: [],
  outOfStockItems: [],
  insufficientStockItems: [],
  ...overrides,
});

export const createMockServerResponse = (overrides?: any) => ({
  success: true,
  data: {
    items: [],
    validation: createMockValidation(),
    summary: {
      totalItems: 0,
      totalPrice: 0,
      hasUnavailableItems: false,
      hasOutOfStockItems: false,
      hasInsufficientStock: false,
    },
    ...overrides,
  },
});

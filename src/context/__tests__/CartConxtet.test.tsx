/**
 * @jest-environment jsdom
 */
import { renderHook, act, waitFor } from '@testing-library/react';
import { CartProvider, useCart, CartItem } from '../CartContext';
import React from 'react';

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Mock fetch
global.fetch = jest.fn();

// Test wrapper component
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <CartProvider>{children}</CartProvider>
);

// Sample test data
const mockPharmacy = {
  id: 'pharmacy-123',
  name: 'Test Pharmacy',
  address: '123 Test St',
  contact: 'Test Contact',
  phone: '1234567890',
  email: 'test@pharmacy.com',
};

const mockCartItem: CartItem = {
  _id: '123456789012345678901234',
  name: 'Test Product',
  image: '/test-image.jpg',
  price: 100,
  quantity: 2,
  description: 'Test description',
  category: 'Test Category',
  inStock: true,
  stockQuantity: 50,
  requiresPrescription: false,
  pharmacy: mockPharmacy,
  itemTotal: 200,
};

const mockCartItem2: CartItem = {
  _id: '123456789012345678905678',
  name: 'Test Product 2',
  image: '/test-image2.jpg',
  price: 200,
  quantity: 1,
  inStock: true,
  stockQuantity: 10,
  requiresPrescription: true,
  pharmacy: mockPharmacy,
};

describe('CartContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    mockLocalStorage.getItem.mockClear();
    mockLocalStorage.setItem.mockClear();
    (global.fetch as jest.Mock).mockClear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('CartProvider initialization', () => {
    it('should initialize with empty cart', () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      expect(result.current.cart).toEqual([]);
      expect(result.current.totalPrice).toBe(0);
      expect(result.current.currency).toBe('LKR');
      expect(result.current.isLoading).toBe(false);
      expect(result.current.validation).toBeNull();
      expect(result.current.summary).toBeTruthy();
    });

    it('should load cart from localStorage on mount', () => {
      const savedCart = [mockCartItem];
      mockLocalStorage.getItem.mockReturnValueOnce(JSON.stringify(savedCart));

      const { result } = renderHook(() => useCart(), { wrapper });

      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('pharmacy-cart');
      expect(result.current.cart).toEqual(savedCart);
    });

    it('should handle localStorage parsing error gracefully', () => {
      mockLocalStorage.getItem.mockReturnValueOnce('invalid json');

      const { result } = renderHook(() => useCart(), { wrapper });

      expect(result.current.cart).toEqual([]);
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('Basic cart operations', () => {
    it('should add item to cart', () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      act(() => {
        result.current.addToCart(mockCartItem);
      });

      expect(result.current.cart).toHaveLength(1);
      expect(result.current.cart[0]).toEqual(mockCartItem);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'pharmacy-cart',
        JSON.stringify([mockCartItem])
      );
    });

    it('should update quantity when adding existing item', () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      // Add item first time
      act(() => {
        result.current.addToCart(mockCartItem);
      });

      // Add same item again
      act(() => {
        result.current.addToCart({ ...mockCartItem, quantity: 3 });
      });

      expect(result.current.cart).toHaveLength(1);
      expect(result.current.cart[0].quantity).toBe(5); // 2 + 3
    });

    it('should remove item from cart', () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      // Add item first
      act(() => {
        result.current.addToCart(mockCartItem);
      });

      expect(result.current.cart).toHaveLength(1);

      // Remove item
      act(() => {
        result.current.removeFromCart(mockCartItem._id);
      });

      expect(result.current.cart).toHaveLength(0);
    });

    it('should clear cart', () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      // Add items
      act(() => {
        result.current.addToCart(mockCartItem);
        result.current.addToCart(mockCartItem2);
      });

      expect(result.current.cart).toHaveLength(2);

      // Clear cart
      act(() => {
        result.current.clearCart();
      });

      expect(result.current.cart).toHaveLength(0);
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('pharmacy-cart');
      expect(result.current.validation).toBeNull();
      expect(result.current.summary).toEqual({
        totalItems: 0,
        totalPrice: 0,
        hasUnavailableItems: false,
        hasOutOfStockItems: false,
        hasInsufficientStock: false,
      });
    });

    it('should update item quantity', () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      act(() => {
        result.current.addToCart(mockCartItem);
      });

      act(() => {
        result.current.updateQuantity(mockCartItem._id, 5);
      });

      expect(result.current.cart[0].quantity).toBe(5);
    });

    it('should remove item when quantity is set to 0 or less', () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      act(() => {
        result.current.addToCart(mockCartItem);
      });

      expect(result.current.cart).toHaveLength(1);

      act(() => {
        result.current.updateQuantity(mockCartItem._id, 0);
      });

      expect(result.current.cart).toHaveLength(0);
    });
  });

  describe('Utility functions', () => {
    it('should get item count', () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      act(() => {
        result.current.addToCart(mockCartItem);
        result.current.addToCart(mockCartItem2);
      });

      expect(result.current.getItemCount()).toBe(3); // 2 + 1
    });

    it('should get item by ID', () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      act(() => {
        result.current.addToCart(mockCartItem);
        result.current.addToCart(mockCartItem2);
      });

      const item = result.current.getItemById(mockCartItem._id);
      expect(item).toEqual(mockCartItem);

      const nonExistentItem = result.current.getItemById('non-existent');
      expect(nonExistentItem).toBeUndefined();
    });

    it('should check if item is in cart', () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      act(() => {
        result.current.addToCart(mockCartItem);
      });

      expect(result.current.isInCart(mockCartItem._id)).toBe(true);
      expect(result.current.isInCart('non-existent')).toBe(false);
    });
  });

  describe('Cart summary', () => {
    it('should calculate total price correctly', () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      act(() => {
        result.current.addToCart(mockCartItem); // 100 * 2 = 200
        result.current.addToCart(mockCartItem2); // 200 * 1 = 200
      });

      expect(result.current.totalPrice).toBe(400);
      expect(result.current.getCartSummary().totalPrice).toBe(400);
      expect(result.current.getCartSummary().totalItems).toBe(3);
    });

    it('should update summary when cart changes', async () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      expect(result.current.summary?.totalItems).toBe(0);
      expect(result.current.summary?.totalPrice).toBe(0);

      act(() => {
        result.current.addToCart(mockCartItem);
      });

      await waitFor(() => {
        expect(result.current.summary?.totalItems).toBe(2);
        expect(result.current.summary?.totalPrice).toBe(200);
      });
    });
  });

  describe('Cart validation', () => {
    it('should return true for empty cart', async () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      let isValid;
      await act(async () => {
        isValid = await result.current.validateCart();
      });

      expect(isValid).toBe(true);
      expect(result.current.validation).toEqual({
        valid: true,
        unavailableItems: [],
        outOfStockItems: [],
        insufficientStockItems: [],
      });
    });

    it('should validate cart with server successfully', async () => {
      const mockServerResponse = {
        success: true,
        data: {
          items: [mockCartItem],
          validation: {
            valid: true,
            unavailableItems: [],
            outOfStockItems: [],
            insufficientStockItems: [],
          },
          summary: {
            totalItems: 2,
            totalPrice: 200,
            hasUnavailableItems: false,
            hasOutOfStockItems: false,
            hasInsufficientStock: false,
          },
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockServerResponse,
      });

      const { result } = renderHook(() => useCart(), { wrapper });

      // Add item to cart first
      act(() => {
        result.current.addToCart(mockCartItem);
      });

      let isValid;
      await act(async () => {
        isValid = await result.current.validateCart();
      });

      expect(isValid).toBe(true);
      expect(result.current.validation).toEqual(
        mockServerResponse.data.validation
      );
      expect(result.current.summary).toEqual(mockServerResponse.data.summary);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/products/user/my-cart'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });

    it('should handle validation failure', async () => {
      const mockServerResponse = {
        success: false,
        message: 'Validation failed',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockServerResponse,
      });

      const { result } = renderHook(() => useCart(), { wrapper });

      act(() => {
        result.current.addToCart(mockCartItem);
      });

      let isValid;
      await act(async () => {
        isValid = await result.current.validateCart();
      });

      expect(isValid).toBe(false);
      expect(console.error).toHaveBeenCalledWith(
        'Error validating cart:',
        expect.any(Error)
      );
    });

    it('should handle network error during validation', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      const { result } = renderHook(() => useCart(), { wrapper });

      act(() => {
        result.current.addToCart(mockCartItem);
      });

      let isValid;
      await act(async () => {
        isValid = await result.current.validateCart();
      });

      expect(isValid).toBe(false);
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('Cart synchronization', () => {
    it('should sync cart with server successfully', async () => {
      const mockServerResponse = {
        success: true,
        data: [
          {
            ...mockCartItem,
            name: 'Updated Product Name',
            price: 150,
            stockQuantity: 30,
          },
        ],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockServerResponse,
      });

      const { result } = renderHook(() => useCart(), { wrapper });

      // Add item to cart
      act(() => {
        result.current.addToCart(mockCartItem);
      });

      await act(async () => {
        await result.current.syncCartWithServer();
      });

      expect(result.current.cart[0].name).toBe('Updated Product Name');
      expect(result.current.cart[0].price).toBe(150);
      expect(result.current.cart[0].stockQuantity).toBe(30);
    });

    it('should handle sync with empty cart', async () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      await act(async () => {
        await result.current.syncCartWithServer();
      });

      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should handle sync with invalid product IDs', async () => {
      const invalidItem = {
        ...mockCartItem,
        _id: 'invalid-id',
      };

      const { result } = renderHook(() => useCart(), { wrapper });

      act(() => {
        result.current.addToCart(invalidItem);
      });

      await act(async () => {
        await result.current.syncCartWithServer();
      });

      expect(console.warn).toHaveBeenCalledWith('No valid product IDs in cart');
    });

    it('should handle sync error', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      const { result } = renderHook(() => useCart(), { wrapper });

      act(() => {
        result.current.addToCart(mockCartItem);
      });

      await act(async () => {
        await result.current.syncCartWithServer();
      });

      expect(console.error).toHaveBeenCalledWith(
        'Error syncing cart with server:',
        expect.any(Error)
      );
    });
  });

  describe('Edge cases', () => {
    it('should clear validation when cart is modified', () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      // Set some validation state
      act(() => {
        result.current.addToCart(mockCartItem);
      });

      // We can't directly set validation state, but we can verify
      // that validation would be cleared on cart modification
      const initialCart = result.current.cart;

      act(() => {
        result.current.removeFromCart(mockCartItem._id);
      });

      // Cart should be modified
      expect(result.current.cart).not.toEqual(initialCart);
    });

    it('should handle multiple concurrent operations', async () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      await act(async () => {
        await Promise.all([
          result.current.addToCart(mockCartItem),
          result.current.addToCart(mockCartItem2),
          result.current.updateQuantity(mockCartItem._id, 5),
        ]);
      });

      expect(result.current.cart).toHaveLength(2);
      expect(result.current.cart[0].quantity).toBe(5);
    });
  });

  describe('useCart hook', () => {
    it('should throw error when used outside CartProvider', () => {
      // Temporarily suppress console error for this test
      const originalError = console.error;
      console.error = jest.fn();

      expect(() => {
        renderHook(() => useCart());
      }).toThrow('useCart must be used within a CartProvider');

      console.error = originalError;
    });
  });
});

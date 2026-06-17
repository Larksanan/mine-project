/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useMemo,
  useEffect,
} from 'react';

// Pharmacy interfaces
interface PharmacyAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

interface Pharmacy {
  id: string;
  name: string;
  address: PharmacyAddress | string;
  contact?: string;
  phone?: string;
  email?: string;
}

// Cart Item interface
export interface CartItem {
  _id: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
  description?: string;
  category?: string;
  images?: string[];
  inStock?: boolean;
  stockQuantity?: number;
  manufacturer?: string;
  requiresPrescription?: boolean;
  sku?: string;
  isLowStock?: boolean;
  itemTotal?: number;
  pharmacy?: Pharmacy | null;
}

// Validation interfaces with default values
interface InsufficientStockItem {
  productId: string;
  name: string;
  requested: number;
  available: number;
}

interface CartValidation {
  valid: boolean;
  unavailableItems: string[];
  outOfStockItems: string[];
  insufficientStockItems: InsufficientStockItem[];
}

interface CartSummary {
  totalItems: number;
  totalPrice: number;
  hasUnavailableItems: boolean;
  hasOutOfStockItems: boolean;
  hasInsufficientStock: boolean;
}

export interface CartContextType {
  cart: CartItem[];
  totalPrice: number;
  currency: string;
  validation: CartValidation | null;
  summary: CartSummary | null;
  isLoading: boolean;

  // Basic cart operations
  addToCart: (item: CartItem) => void;
  removeFromCart: (_id: string) => void;
  clearCart: () => void;
  updateQuantity: (_id: string, quantity: number) => void;

  // Validation operations
  validateCart: () => Promise<boolean>;
  syncCartWithServer: () => Promise<void>;
  getCartSummary: () => CartSummary;

  // Utility functions
  getItemCount: () => number;
  getItemById: (_id: string) => CartItem | undefined;
  isInCart: (_id: string) => boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// Default validation state
const DEFAULT_VALIDATION: CartValidation = {
  valid: true,
  unavailableItems: [],
  outOfStockItems: [],
  insufficientStockItems: [],
};

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [validation, setValidation] = useState<CartValidation | null>(null);
  const [summary, setSummary] = useState<CartSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const currency = 'LKR';

  // Load cart from localStorage on initial render
  useEffect(() => {
    const savedCart = localStorage.getItem('pharmacy-cart');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        setCart(parsedCart);
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('pharmacy-cart', JSON.stringify(cart));
  }, [cart]);

  // Calculate total price
  const totalPrice = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart]
  );

  // Get cart summary
  const getCartSummary = (): CartSummary => {
    const currentValidation = validation || DEFAULT_VALIDATION;

    return {
      totalItems: cart.reduce((total, item) => total + item.quantity, 0),
      totalPrice: parseFloat(totalPrice.toFixed(2)),
      hasUnavailableItems: currentValidation.unavailableItems.length > 0,
      hasOutOfStockItems: currentValidation.outOfStockItems.length > 0,
      hasInsufficientStock: currentValidation.insufficientStockItems.length > 0,
    };
  };

  // Basic cart operations
  const addToCart = (item: CartItem) => {
    setCart(prev => {
      const existing = prev.find(i => i._id === item._id);
      if (existing) {
        // Update quantity if item already exists
        return prev.map(i =>
          i._id === item._id
            ? {
                ...i,
                quantity: i.quantity + item.quantity,
                stockQuantity: item.stockQuantity,
                inStock: item.inStock,
              }
            : i
        );
      }
      // Add new item
      return [...prev, item];
    });

    // Clear validation when adding new items
    setValidation(null);
  };

  const removeFromCart = (_id: string) => {
    setCart(prev => prev.filter(item => item._id !== _id));
    // Clear validation when removing items
    setValidation(null);
  };

  const clearCart = () => {
    setCart([]);
    setValidation(null);
    setSummary(null);
    localStorage.removeItem('pharmacy-cart');
  };

  const updateQuantity = (_id: string, quantity: number) => {
    if (quantity < 1) {
      removeFromCart(_id);
      return;
    }

    setCart(prev =>
      prev.map(item => (item._id === _id ? { ...item, quantity } : item))
    );

    // Clear validation when updating quantities
    setValidation(null);
  };

  // Utility functions
  const getItemCount = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const getItemById = (_id: string) => {
    return cart.find(item => item._id === _id);
  };

  const isInCart = (_id: string) => {
    return cart.some(item => item._id === _id);
  };

  // Validate cart with server
  const validateCart = async (): Promise<boolean> => {
    if (cart.length === 0) {
      setValidation(DEFAULT_VALIDATION);
      setSummary(getCartSummary());
      return true;
    }

    setIsLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

      // Prepare cart items for validation
      const cartItems = cart.map(item => ({
        _id: item._id,
        quantity: item.quantity,
      }));

      const response = await fetch(`${apiUrl}/api/products/user/my-cart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items: cartItems }),
      });

      const data = await response.json();

      if (data.success) {
        const {
          items,
          validation: serverValidation,
          summary: serverSummary,
        } = data.data;

        setValidation(serverValidation);
        setSummary(serverSummary);

        // Update cart with latest product info from server
        if (items.length > 0) {
          const updatedCart = cart.map(cartItem => {
            const serverItem = items.find(
              (item: any) => item._id === cartItem._id
            );
            if (serverItem) {
              return {
                ...cartItem,
                name: serverItem.name,
                price: serverItem.price,
                image: serverItem.image,
                inStock: serverItem.inStock,
                stockQuantity: serverItem.stockQuantity,
                requiresPrescription: serverItem.requiresPrescription,
                pharmacy: serverItem.pharmacy,
                itemTotal: serverItem.itemTotal,
                description: serverItem.description,
                category: serverItem.category,
              };
            }
            return cartItem;
          });
          setCart(updatedCart);
        }

        setIsLoading(false);
        return serverValidation.valid;
      } else {
        throw new Error(data.message || 'Validation failed');
      }
    } catch (error) {
      console.error('Error validating cart:', error);
      setIsLoading(false);
      return false;
    }
  };

  // Sync cart with server (get latest product info)
  const syncCartWithServer = async () => {
    if (cart.length === 0) return;

    setIsLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

      // Get product IDs from cart
      const productIds = cart.map(item => item._id);

      // Make sure we have valid IDs
      const validIds = productIds.filter(id => id && id.trim().length === 24);

      if (validIds.length === 0) {
        console.warn('No valid product IDs in cart');
        setIsLoading(false);
        return;
      }

      const idsParam = validIds.join(',');

      const response = await fetch(
        `${apiUrl}/api/products/user/my-cart?ids=${idsParam}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch cart items: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        const serverProducts = data.data;

        // Update cart with latest info
        const updatedCart = cart.map(cartItem => {
          const serverProduct = serverProducts.find(
            (product: any) => product._id === cartItem._id
          );

          if (serverProduct) {
            return {
              ...cartItem,
              name: serverProduct.name,
              price: serverProduct.price,
              image: serverProduct.image,
              inStock: serverProduct.inStock,
              stockQuantity: serverProduct.stockQuantity,
              requiresPrescription: serverProduct.requiresPrescription,
              pharmacy: serverProduct.pharmacy,
              description: serverProduct.description,
              category: serverProduct.category,
              manufacturer: serverProduct.manufacturer,
              sku: serverProduct.sku,
              isLowStock: serverProduct.isLowStock,
            };
          }

          return cartItem;
        });

        setCart(updatedCart);
      } else {
        throw new Error(data.message || 'Failed to sync cart');
      }
    } catch (error) {
      console.error('Error syncing cart with server:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Update summary when cart changes
  useEffect(() => {
    setSummary(getCartSummary());
  }, [cart, validation]);

  const contextValue: CartContextType = {
    cart,
    totalPrice,
    currency,
    validation,
    summary,
    isLoading,
    addToCart,
    removeFromCart,
    clearCart,
    updateQuantity,
    validateCart,
    syncCartWithServer,
    getCartSummary,
    getItemCount,
    getItemById,
    isInCart,
  };

  return (
    <CartContext.Provider value={contextValue}>{children}</CartContext.Provider>
  );
};

// Custom hook to use cart context
export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export default useCart;

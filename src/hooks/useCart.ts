import { useState, useEffect } from 'react';

interface CartItem {
  _id: string;
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  inStock?: boolean;
  prescriptionRequired?: boolean;
}

export const useCart = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCartItems();

    // Listen for cart updates from other components
    const handleCartUpdate = (event: CustomEvent) => {
      setCartItems(event.detail || []);
    };

    // eslint-disable-next-line no-undef
    window.addEventListener('cartUpdated', handleCartUpdate as EventListener);
    return () =>
      window.removeEventListener(
        'cartUpdated',
        // eslint-disable-next-line no-undef
        handleCartUpdate as EventListener
      );
  }, []);

  const loadCartItems = () => {
    try {
      const storedCart = localStorage.getItem('pharmacy-cart');
      const items: CartItem[] = storedCart ? JSON.parse(storedCart) : [];
      setCartItems(items);
    } catch (error) {
      console.error('Failed to load cart items:', error);
      setCartItems([]);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (product: CartItem, quantity: number = 1) => {
    try {
      // API call to add to cart
      const response = await fetch('/api/Pharmacist/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'anonymous', // Replace with actual user ID
        },
        body: JSON.stringify({
          productId: product._id,
          quantity,
        }),
      });

      if (response.ok) {
        const result = await response.json();

        // Also update local storage for immediate UI update
        const storedCart = localStorage.getItem('pharmacy-cart');
        const currentCart: CartItem[] = storedCart
          ? JSON.parse(storedCart)
          : [];

        const existingItemIndex = currentCart.findIndex(
          item => item._id === product._id
        );
        let updatedCart: CartItem[];

        if (existingItemIndex > -1) {
          updatedCart = currentCart.map((item, index) =>
            index === existingItemIndex
              ? { ...item, quantity: item.quantity + quantity }
              : item
          );
        } else {
          updatedCart = [...currentCart, { ...product, quantity }];
        }

        localStorage.setItem('pharmacy-cart', JSON.stringify(updatedCart));
        setCartItems(updatedCart);

        // Dispatch cart update event
        const event = new CustomEvent('cartUpdated', { detail: updatedCart });
        window.dispatchEvent(event);

        return { success: true, data: result.data };
      } else {
        const error = await response.json();
        return { success: false, error: error.message };
      }
    } catch (error) {
      console.error('Failed to add to cart:', error);
      return { success: false, error: 'Network error' };
    }
  };

  const updateQuantity = async (productId: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    try {
      const response = await fetch('/api/Pharmacist/cart', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'anonymous',
        },
        body: JSON.stringify({
          productId,
          quantity: newQuantity,
        }),
      });

      if (response.ok) {
        const updatedCart = cartItems.map(item =>
          item._id === productId ? { ...item, quantity: newQuantity } : item
        );

        localStorage.setItem('pharmacy-cart', JSON.stringify(updatedCart));
        setCartItems(updatedCart);

        const event = new CustomEvent('cartUpdated', { detail: updatedCart });
        window.dispatchEvent(event);
      }
    } catch (error) {
      console.error('Failed to update quantity:', error);
    }
  };

  const removeFromCart = async (productId: string) => {
    try {
      const response = await fetch(`/api/Pharmacist/cart/${productId}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': 'anonymous',
        },
      });

      if (response.ok) {
        const updatedCart = cartItems.filter(item => item._id !== productId);
        localStorage.setItem('pharmacy-cart', JSON.stringify(updatedCart));
        setCartItems(updatedCart);

        const event = new CustomEvent('cartUpdated', { detail: updatedCart });
        window.dispatchEvent(event);
      }
    } catch (error) {
      console.error('Failed to remove from cart:', error);
    }
  };

  const clearCart = async () => {
    try {
      const response = await fetch('/api/Pharmacist/cart', {
        method: 'DELETE',
        headers: {
          'x-user-id': 'anonymous',
        },
      });

      if (response.ok) {
        localStorage.removeItem('pharmacy-cart');
        setCartItems([]);

        const event = new CustomEvent('cartUpdated', { detail: [] });
        window.dispatchEvent(event);
      }
    } catch (error) {
      console.error('Failed to clear cart:', error);
    }
  };

  const getCartTotal = () => {
    const inStockItems = cartItems.filter(item => item.inStock !== false);
    return inStockItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
  };

  const getCartCount = () => {
    const inStockItems = cartItems.filter(item => item.inStock !== false);
    return inStockItems.reduce((count, item) => count + item.quantity, 0);
  };

  return {
    cartItems,
    loading,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    getCartTotal,
    getCartCount,
  };
};

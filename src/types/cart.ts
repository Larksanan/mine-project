export interface CartItem {
  _id: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
  requiresPrescription?: boolean;
}

export interface CartContextType {
  cartItems: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

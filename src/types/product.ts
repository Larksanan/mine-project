/* eslint-disable @typescript-eslint/no-explicit-any */
import { z } from 'zod';
import { productSchema } from '@/validation/product';
import { Pharmacy } from './pharmacy';

export type ProductFormData = z.infer<typeof productSchema>;

export interface Product {
  [x: string]: any;
  activeIngredients: any;
  discountPercentage: number;
  _id?: string;
  id?: string;
  name: string;
  description: string;
  price: number;
  costPrice: number;
  category: string;
  image: string;
  inStock: boolean;
  stockQuantity: number;
  minStockLevel: number;
  sku: string;
  manufacturer: string;
  requiresPrescription: boolean;
  pharmacy: {
    name: string;
    id: string;
  };
  tags?: string[];
  expiryDate?: string;
  weight?: string;
  dimensions?: string;
}

export interface Productpharmacy {
  _id?: string;
  id?: string;
  name: string;
  description: string;
  price: number;
  costPrice: number;
  category: string;
  image: string;
  inStock: boolean;
  stockQuantity: number;
  minStockLevel: number;
  sku: string;
  manufacturer: string;
  requiresPrescription: boolean;
  pharmacy: Pharmacy;
}

export type StockFilter = 'all' | 'inStock' | 'lowStock' | 'outOfStock';

export interface StockStatus {
  text: string;
  color: string;
}

export interface ProductsResponse {
  success: boolean;
  data: {
    products: Productpharmacy[];
    pagination: {
      pages: number;
    };
  };
  error?: string;
}

export interface ProductFilters {
  searchQuery: string;
  selectedCategory: string;
  stockFilter: StockFilter;
  currentPage: number;
  limit: number;
}
export interface Order {
  _id: string;
  orderNumber: string;
  customer: {
    name: string;
    email: string;
    phone: string;
    address: string;
  };
  items: OrderItem[];
  status:
    | 'pending'
    | 'confirmed'
    | 'processing'
    | 'shipped'
    | 'delivered'
    | 'cancelled';
  totalAmount: number;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentMethod: 'card' | 'cash' | 'online';
  createdAt: string;
  updatedAt: string;
  estimatedDelivery?: string;
  trackingNumber?: string;
}

export interface OrderItem {
  product: Product;
  quantity: number;
  price: number;
}

export interface OrderStats {
  totalOrders: number;
  pendingOrders: number;
  deliveredOrders: number;
  revenue: number;
}

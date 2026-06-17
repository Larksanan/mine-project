import { Pharmacy } from './pharmacy';

export interface InventoryItem {
  _id: string;
  id: string;
  pharmacy: Pharmacy;
  createdBy: {
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
  location?: string;
  reorderLevel?: number;
  reorderQuantity?: number;
  notes?: string;
  name: string;
  description?: string;
  category: string;
  sku: string;
  barcode?: string;
  quantity: number;
  lowStockThreshold: number;
  costPrice: number;
  sellingPrice: number;
  supplier?: string;
  expiryDate?: string;
  batchNumber?: string;
  status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'DISCONTINUED';
}

export interface InventoryStats {
  totalItems: number;
  totalValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  expiredCount: number;
  categoryDistribution: Array<{
    _id: string;
    count: number;
    totalValue: number;
  }>;
}

export interface PaginationState {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ErrorState {
  message: string;
  type:
    | 'fetch'
    | 'auth'
    | 'network'
    | 'validation'
    | 'not_found'
    | 'missing_pharmacy'
    | null;
}

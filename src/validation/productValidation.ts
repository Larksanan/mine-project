import { Productpharmacy } from '@/types/product';

export const validateProduct = (product: Productpharmacy): string[] => {
  const errors: string[] = [];

  if (!product.name || product.name.trim().length < 2) {
    errors.push('Product name must be at least 2 characters long');
  }

  if (!product.description || product.description.trim().length < 10) {
    errors.push('Description must be at least 10 characters long');
  }

  if (product.price <= 0) {
    errors.push('Price must be greater than 0');
  }

  if (product.costPrice <= 0) {
    errors.push('Cost price must be greater than 0');
  }

  if (product.price < product.costPrice) {
    errors.push('Price cannot be less than cost price');
  }

  if (!product.category || product.category.trim() === '') {
    errors.push('Category is required');
  }

  if (!product.sku || product.sku.trim() === '') {
    errors.push('SKU is required');
  }

  if (product.stockQuantity < 0) {
    errors.push('Stock quantity cannot be negative');
  }

  if (product.minStockLevel < 0) {
    errors.push('Minimum stock level cannot be negative');
  }

  return errors;
};

export const validateProductId = (productId: string): boolean => {
  return !!productId && productId.trim().length > 0;
};

export const getProductId = (product: Productpharmacy): string => {
  return product.id || product._id || '';
};

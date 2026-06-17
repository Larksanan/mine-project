import { z } from 'zod';

export const productSchema = z.object({
  name: z
    .string()
    .min(1, 'Product name is required')
    .min(3, 'Product name must be at least 3 characters'),
  description: z
    .string()
    .min(1, 'Description is required')
    .min(10, 'Description must be at least 10 characters'),
  price: z
    .string()
    .min(1, 'Price is required')
    .refine(val => parseFloat(val) > 0, 'Price must be greater than 0'),
  costPrice: z.string().optional().or(z.literal('')),
  category: z.string().min(1, 'Category is required'),
  image: z.string().min(1, 'Product image is required'),
  inStock: z.boolean().default(true),
  stockQuantity: z
    .string()
    .min(1, 'Stock quantity is required')
    .refine(val => parseInt(val) >= 0, 'Stock quantity cannot be negative'),
  minStockLevel: z.string().default('10'),
  pharmacy: z.string().min(1, 'Pharmacy is required'),
  sku: z.string().min(1, 'SKU is required'),
  manufacturer: z.string().min(1, 'Manufacturer is required'),
  requiresPrescription: z.boolean().default(false),
  isControlledSubstance: z.boolean().default(false),
  sideEffects: z.string().optional(),
  dosage: z.string().optional(),
  activeIngredients: z.string().optional(),
  barcode: z.string().min(1, 'Barcode is required'),
});

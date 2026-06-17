import { z } from 'zod';
import mongoose from 'mongoose';

export const CheckoutItemSchema = z.object({
  _id: z.string().refine(val => mongoose.Types.ObjectId.isValid(val), {
    message: 'Invalid product ID',
  }),
  name: z.string().min(1, 'Product name is required'),
  price: z.number().positive('Price must be positive'),
  quantity: z.number().int().positive('Quantity must be at least 1'),
  image: z.string().url().optional(),
  prescriptionRequired: z.boolean().optional(),
});

export const ShippingAddressSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  email: z.string().email('Invalid email address'),
  phone: z
    .string()
    .min(10, 'Phone number is too short')
    .max(15, 'Phone number is too long'),
  address: z
    .string()
    .min(1, 'Address is required')
    .max(200, 'Address is too long'),
  city: z.string().min(1, 'City is required').max(100, 'City is too long'),
  postalCode: z
    .string()
    .min(1, 'Postal code is required')
    .max(10, 'Postal code is too long'),
  instructions: z.string().max(500, 'Instructions too long').optional(),
});

export const CheckoutSchema = z.object({
  items: z.array(CheckoutItemSchema).min(1, 'Cart cannot be empty'),
  total: z.number().positive('Total must be positive'),
  shippingAddress: ShippingAddressSchema,
  paymentMethod: z.enum(['cash', 'card', 'insurance']),
  pharmacyId: z.string().refine(val => mongoose.Types.ObjectId.isValid(val), {
    message: 'Invalid pharmacy ID',
  }),
  prescriptionImages: z.array(z.string().url()).optional(),
});

export const OrderUpdateSchema = z.object({
  status: z
    .enum([
      'pending',
      'confirmed',
      'preparing',
      'ready',
      'out_for_delivery',
      'delivered',
      'cancelled',
    ])
    .optional(),
  paymentStatus: z.enum(['pending', 'paid', 'failed', 'refunded']).optional(),
  driver: z
    .string()
    .refine(val => mongoose.Types.ObjectId.isValid(val), {
      message: 'Invalid driver ID',
    })
    .optional(),
  estimatedDelivery: z.string().datetime().optional(),
  notes: z.string().max(1000).optional(),
});

export type CheckoutData = z.infer<typeof CheckoutSchema>;
export type ShippingAddress = z.infer<typeof ShippingAddressSchema>;
export type OrderUpdateData = z.infer<typeof OrderUpdateSchema>;

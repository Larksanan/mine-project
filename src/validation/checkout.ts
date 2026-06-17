import { z } from 'zod';

export const shippingInfoSchema = z.object({
  fullName: z.string().trim().min(1, 'Full name is required'),
  email: z.string().trim().email('Invalid email address'),
  phone: z.string().trim().min(10, 'Phone number must be at least 10 digits'),
  address: z.string().trim().min(1, 'Address is required'),
  city: z.string().trim().min(1, 'City is required'),
  state: z.string().trim().min(1, 'State is required'),
  zipCode: z.string().trim().min(1, 'ZIP code is required'),
  country: z.string().trim().min(1, 'Country is required').default('Sri Lanka'),
});

export const paymentInfoSchema = z
  .object({
    paymentMethod: z.enum(['cash', 'card', 'insurance']),
    cardNumber: z.string().optional(),
    cardName: z
      .string()
      .optional()
      .transform(val => val?.trim()),
    expiryDate: z.string().optional(),
    cvv: z.string().optional(),
    insuranceProvider: z
      .string()
      .optional()
      .transform(val => val?.trim()),
    insurancePolicyNumber: z
      .string()
      .optional()
      .transform(val => val?.trim()),
  })
  .superRefine((data, ctx) => {
    if (data.paymentMethod === 'card') {
      const cleanedCardNumber = data.cardNumber
        ? data.cardNumber.replace(/\D/g, '')
        : '';
      if (
        !cleanedCardNumber ||
        cleanedCardNumber.length < 15 ||
        cleanedCardNumber.length > 16
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Card number must be 15 or 16 digits',
          path: ['cardNumber'],
        });
      }
      if (!data.cardName || data.cardName.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Cardholder name is required',
          path: ['cardName'],
        });
      }
      if (
        !data.expiryDate ||
        !/^(0[1-9]|1[0-2])\/\d{2}$/.test(data.expiryDate)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Invalid expiry date (MM/YY)',
          path: ['expiryDate'],
        });
      }
      if (!data.cvv || !/^\d{3}$/.test(data.cvv)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'CVV must be 3 digits',
          path: ['cvv'],
        });
      }
    }

    if (data.paymentMethod === 'insurance') {
      if (
        !data.insuranceProvider ||
        data.insuranceProvider.trim().length === 0
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Insurance provider is required',
          path: ['insuranceProvider'],
        });
      }
      if (
        !data.insurancePolicyNumber ||
        data.insurancePolicyNumber.trim().length === 0
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Policy number is required',
          path: ['insurancePolicyNumber'],
        });
      }
    }
  });

export type ShippingInfo = z.infer<typeof shippingInfoSchema>;
export type PaymentInfo = z.infer<typeof paymentInfoSchema>;

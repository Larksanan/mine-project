import { shippingInfoSchema, paymentInfoSchema } from '../checkout';

describe('Checkout Schemas Integration Tests', () => {
  describe('Combined Validation Scenarios', () => {
    it('should handle complete checkout data validation', () => {
      const completeCheckoutData = {
        shippingInfo: {
          fullName: 'Jebarsan Thatcroos',
          email: 'jebarsanthatcroos16@gmail.com',
          phone: '0762397951',
          address: 'thalaimannar, mannar',
          city: 'mannar',
          state: 'northern province',
          zipCode: '41000',
          country: 'Sri Lanka',
        },
        paymentInfo: {
          paymentMethod: 'card',
          cardNumber: '4111111111111111',
          cardName: 'Jebarsan Thatcroos',
          expiryDate: '12/25',
          cvv: '123',
        },
      };

      const shippingResult = shippingInfoSchema.safeParse(
        completeCheckoutData.shippingInfo
      );
      const paymentResult = paymentInfoSchema.safeParse(
        completeCheckoutData.paymentInfo
      );

      expect(shippingResult.success).toBe(true);
      expect(paymentResult.success).toBe(true);
    });

    it('should handle validation errors across both schemas', () => {
      const invalidCheckoutData = {
        shippingInfo: {
          fullName: '', // Invalid
          email: 'invalid-email',
          phone: '123',
          address: '',
          city: '',
          state: '',
          zipCode: '',
          // country missing
        },
        paymentInfo: {
          paymentMethod: 'card',
          cardNumber: '123', // Invalid
          cardName: '', // Invalid
          expiryDate: 'invalid',
          cvv: '12', // Invalid
        },
      };

      const shippingResult = shippingInfoSchema.safeParse(
        invalidCheckoutData.shippingInfo
      );
      const paymentResult = paymentInfoSchema.safeParse(
        invalidCheckoutData.paymentInfo
      );

      expect(shippingResult.success).toBe(false);
      expect(paymentResult.success).toBe(false);

      if (!shippingResult.success) {
        expect(shippingResult.error.issues.length).toBeGreaterThan(1);
      }

      if (!paymentResult.success) {
        expect(paymentResult.error.issues.length).toBeGreaterThan(1);
      }
    });
  });

  describe('Real-world Use Cases', () => {
    it('should handle Sri Lankan addresses correctly', () => {
      const sriLankanAddresses = [
        {
          fullName: 'Sovika sovi',
          email: 'sovika@gmail.com',
          phone: '0771234567',
          address: 'no.234 trincomalee ',
          city: 'trincomalee',
          state: 'Eastern Province',
          zipCode: '31000',
          country: 'Sri Lanka',
        },
        {
          fullName: 'sathuska sathu',
          email: 'sathuska@gmail.com',
          phone: '0812233445',
          address: '123/A, kalmunai Road',
          city: 'kalmunai',
          state: 'sainthamaruthu',
          zipCode: '32100',
          country: 'Sri Lanka',
        },
      ];

      sriLankanAddresses.forEach(address => {
        const result = shippingInfoSchema.safeParse(address);
        expect(result.success).toBe(true);
      });
    });

    it('should handle various payment scenarios', () => {
      const paymentScenarios = [
        // Cash on delivery
        {
          paymentMethod: 'cash' as const,
        },
        // Credit card payment
        {
          paymentMethod: 'card' as const,
          cardNumber: '5555555555554444', // MasterCard
          cardName: 'sathuska sathu',
          expiryDate: '08/27',
          cvv: '456',
        },
        // Insurance payment
        {
          paymentMethod: 'insurance' as const,
          insuranceProvider: 'AIA Insurance Lanka',
          insurancePolicyNumber: 'AIA-2023-12345',
        },
        // Another card with spaces
        {
          paymentMethod: 'card' as const,
          cardNumber: '3782 822463 10005', // American Express
          cardName: 'sathuska sathu',
          expiryDate: '11/26',
          cvv: '789',
        },
      ];

      paymentScenarios.forEach(payment => {
        const result = paymentInfoSchema.safeParse(payment);
        expect(result.success).toBe(true);
      });
    });
  });

  describe('Schema Refinements', () => {
    it('should validate card number length after removing spaces', () => {
      const testCases = [
        { input: '4111 1111 1111 1111', valid: true }, // 16 digits with spaces
        { input: '4111-1111-1111-1111', valid: true }, // 16 digits with dashes
        { input: '4111111111111111', valid: true }, // 16 digits no spaces
        { input: '4111 1111 1111 11', valid: false }, // 14 digits
        { input: '4111 1111 1111 1111 1', valid: false }, // 17 digits
      ];

      testCases.forEach(({ input, valid }) => {
        const data = {
          paymentMethod: 'card' as const,
          cardNumber: input,
          cardName: 'Test User',
          expiryDate: '12/25',
          cvv: '123',
        };

        const result = paymentInfoSchema.safeParse(data);
        expect(result.success).toBe(valid);
      });
    });

    it('should validate expiry date format strictly', () => {
      const testCases = [
        { input: '01/25', valid: true },
        { input: '12/25', valid: true },
        { input: '12/25 ', valid: false }, // Trailing space
        { input: ' 12/25', valid: false }, // Leading space
        { input: '12/250', valid: false }, // Three-digit year
        { input: '1/25', valid: false }, // Single-digit month
        { input: '13/25', valid: false }, // Invalid month
        { input: '00/25', valid: false }, // Invalid month
      ];

      testCases.forEach(({ input, valid }) => {
        const data = {
          paymentMethod: 'card' as const,
          cardNumber: '4111111111111111',
          cardName: 'Test User',
          expiryDate: input,
          cvv: '123',
        };

        const result = paymentInfoSchema.safeParse(data);
        expect(result.success).toBe(valid);
      });
    });
  });
});

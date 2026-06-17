import {
  shippingInfoSchema,
  paymentInfoSchema,
  type ShippingInfo,
  type PaymentInfo,
} from '../checkout';

describe('Checkout Schemas', () => {
  describe('shippingInfoSchema', () => {
    const validShippingInfo: ShippingInfo = {
      fullName: 'Jebarsan Thatcroos',
      email: 'jebarsanthatcroos16@outlook.com',
      phone: '0762397951',
      address: 'thalaimannar, mannar',
      city: 'mannar',
      state: 'north province',
      zipCode: '41000',
      country: 'Sri Lanka',
    };

    it('should validate correct shipping information', () => {
      const result = shippingInfoSchema.safeParse(validShippingInfo);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(validShippingInfo);
    });

    it('should fail when fullName is missing', () => {
      const invalidData = { ...validShippingInfo, fullName: '' };
      const result = shippingInfoSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Full name is required');
        expect(result.error.issues[0].path).toEqual(['fullName']);
      }
    });

    it('should fail when email is invalid', () => {
      const invalidData = { ...validShippingInfo, email: 'invalid-email' };
      const result = shippingInfoSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Invalid email address');
        expect(result.error.issues[0].path).toEqual(['email']);
      }
    });

    it('should fail when phone number is too short', () => {
      const invalidData = { ...validShippingInfo, phone: '123' };
      const result = shippingInfoSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          'Phone number must be at least 10 digits'
        );
        expect(result.error.issues[0].path).toEqual(['phone']);
      }
    });

    it('should accept phone numbers with spaces and dashes', () => {
      const dataWithFormattedPhone = {
        ...validShippingInfo,
        phone: '071-234 5678',
      };
      const result = shippingInfoSchema.safeParse(dataWithFormattedPhone);

      expect(result.success).toBe(true);
    });

    it('should fail when address is missing', () => {
      const invalidData = { ...validShippingInfo, address: '' };
      const result = shippingInfoSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Address is required');
        expect(result.error.issues[0].path).toEqual(['address']);
      }
    });

    it('should fail when city is missing', () => {
      const invalidData = { ...validShippingInfo, city: '' };
      const result = shippingInfoSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('City is required');
        expect(result.error.issues[0].path).toEqual(['city']);
      }
    });

    it('should fail when state is missing', () => {
      const invalidData = { ...validShippingInfo, state: '' };
      const result = shippingInfoSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('State is required');
        expect(result.error.issues[0].path).toEqual(['state']);
      }
    });

    it('should fail when zipCode is missing', () => {
      const invalidData = { ...validShippingInfo, zipCode: '' };
      const result = shippingInfoSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('ZIP code is required');
        expect(result.error.issues[0].path).toEqual(['zipCode']);
      }
    });

    it('should fail when country is missing', () => {
      const invalidData = { ...validShippingInfo, country: '' };
      const result = shippingInfoSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Country is required');
        expect(result.error.issues[0].path).toEqual(['country']);
      }
    });

    it('should use Sri Lanka as default country when not provided', () => {
      const dataWithoutCountry = { ...validShippingInfo };
      delete (dataWithoutCountry as any).country;

      // When country is missing, it should use default
      const result = shippingInfoSchema.parse(dataWithoutCountry);
      expect(result.country).toBe('Sri Lanka');
    });

    it('should trim whitespace from string fields', () => {
      const dataWithWhitespace = {
        ...validShippingInfo,
        fullName: '  Jebarsan Thatcroos  ',
        address: '  thalaimannar, mannar  ',
        city: '  Mannar  ',
      };

      const result = shippingInfoSchema.parse(dataWithWhitespace);
      expect(result.fullName).toBe('Jebarsan Thatcroos');
      expect(result.address).toBe('thalaimannar, mannar');
      expect(result.city).toBe('Mannar');
    });

    describe('Edge Cases', () => {
      it('should handle very long but valid input', () => {
        const longData: ShippingInfo = {
          fullName: 'A'.repeat(100),
          email: 'sovika@gmail.com',
          phone: '0712345678',
          address: 'A'.repeat(200),
          city: 'A'.repeat(50),
          state: 'A'.repeat(50),
          zipCode: 'A'.repeat(20),
          country: 'Sri Lanka',
        };

        const result = shippingInfoSchema.safeParse(longData);
        expect(result.success).toBe(true);
      });

      it('should accept various phone number formats', () => {
        const phoneFormats = [
          '0712345678',
          '0112345678',
          '+94712345678',
          '077-1234567',
          '077 123 4567',
          '(077) 123-4567',
        ];

        phoneFormats.forEach(phone => {
          const data = { ...validShippingInfo, phone };
          const result = shippingInfoSchema.safeParse(data);
          expect(result.success).toBe(true);
        });
      });

      it('should accept international email formats', () => {
        const emails = [
          'jebarsanthatcroos16@gmail.com',
          'jebarsanthatcroos16@outlook.com',
          'gwu-hict-2021-42@gwu.ac.lk',
          'jebarsan+thatcroos16@gmail.com',
          'jebarsan.thatcroos16@subdomain.gwu.com',
        ];

        emails.forEach(email => {
          const data = { ...validShippingInfo, email };
          const result = shippingInfoSchema.safeParse(data);
          expect(result.success).toBe(true);
        });
      });
    });
  });

  describe('paymentInfoSchema', () => {
    const validCashPayment: PaymentInfo = {
      paymentMethod: 'cash',
      cardName: undefined,
      insuranceProvider: undefined,
      insurancePolicyNumber: undefined,
    };

    const validCardPayment: PaymentInfo = {
      paymentMethod: 'card',
      cardNumber: '4111111111111111',
      cardName: 'Jebarsan Thatcroos',
      expiryDate: '12/25',
      cvv: '123',
      insuranceProvider: undefined,
      insurancePolicyNumber: undefined,
    };

    const validInsurancePayment: PaymentInfo = {
      paymentMethod: 'insurance',
      insuranceProvider: 'Ceylinco Insurance',
      insurancePolicyNumber: 'POL123456789',
      cardName: undefined,
    };

    describe('cash payment method', () => {
      it('should validate correct cash payment information', () => {
        const result = paymentInfoSchema.safeParse(validCashPayment);
        expect(result.success).toBe(true);
        expect(result.data).toEqual(validCashPayment);
      });

      it('should accept cash payment with optional fields', () => {
        const cashWithOptionalFields = {
          ...validCashPayment,
          cardNumber: 'optional',
          insuranceProvider: 'optional',
        };

        const result = paymentInfoSchema.safeParse(cashWithOptionalFields);
        expect(result.success).toBe(true);
      });
    });

    describe('card payment method', () => {
      it('should validate correct card payment information', () => {
        const result = paymentInfoSchema.safeParse(validCardPayment);
        expect(result.success).toBe(true);
        expect(result.data).toEqual(validCardPayment);
      });

      it('should fail when card number is missing', () => {
        const invalidData = { ...validCardPayment, cardNumber: '' };
        const result = paymentInfoSchema.safeParse(invalidData);

        expect(result.success).toBe(false);
        if (!result.success) {
          const cardNumberError = result.error.issues.find(e =>
            e.path.includes('cardNumber')
          );
          expect(cardNumberError?.message).toBe(
            'Card number must be 15 or 16 digits'
          );
        }
      });

      it('should fail when card number is not 15 or 16 digits', () => {
        const invalidNumbers = [
          '41111111111111', // 14 digits
          '41111111111111111', // 17 digits
          '4111 1111 1111 11', // 14 digits with spaces
          'invalid',
        ];

        invalidNumbers.forEach(cardNumber => {
          const invalidData = { ...validCardPayment, cardNumber };
          const result = paymentInfoSchema.safeParse(invalidData);
          expect(result.success).toBe(false);

          if (!result.success) {
            const cardNumberError = result.error.issues.find(e =>
              e.path.includes('cardNumber')
            );
            expect(cardNumberError?.message).toBe(
              'Card number must be 15 or 16 digits'
            );
          }
        });
      });

      it('should accept card number with spaces', () => {
        const dataWithSpaces = {
          ...validCardPayment,
          cardNumber: '4111 1111 1111 1111',
        };

        const result = paymentInfoSchema.safeParse(dataWithSpaces);
        expect(result.success).toBe(true);
        // Should keep spaces as-is in the data
        expect(result.data?.cardNumber).toBe('4111 1111 1111 1111');
      });

      it('should fail when card holder name is missing', () => {
        const invalidData = { ...validCardPayment, cardName: '' };
        const result = paymentInfoSchema.safeParse(invalidData);

        expect(result.success).toBe(false);
        if (!result.success) {
          const cardNameError = result.error.issues.find(e =>
            e.path.includes('cardName')
          );
          expect(cardNameError?.message).toBe('Cardholder name is required');
        }
      });

      it('should trim whitespace from card holder name', () => {
        const dataWithWhitespace = {
          ...validCardPayment,
          cardName: '  Jebarsan Thatcroos  ',
        };

        const result = paymentInfoSchema.safeParse(dataWithWhitespace);
        expect(result.success).toBe(true);
        expect(result.data?.cardName).toBe('Jebarsan Thatcroos');
      });

      it('should fail when expiry date is missing', () => {
        const invalidData = { ...validCardPayment, expiryDate: '' };
        const result = paymentInfoSchema.safeParse(invalidData);

        expect(result.success).toBe(false);
        if (!result.success) {
          const expiryError = result.error.issues.find(e =>
            e.path.includes('expiryDate')
          );
          expect(expiryError?.message).toBe('Invalid expiry date (MM/YY)');
        }
      });

      it('should fail when expiry date format is invalid', () => {
        const invalidDates = [
          '12/2025', // Wrong format
          '12-25', // Wrong separator
          '1225', // No separator
          '13/25', // Invalid month
          '00/25', // Invalid month
          '12/2', // Short year
          'invalid',
        ];

        invalidDates.forEach(expiryDate => {
          const invalidData = { ...validCardPayment, expiryDate };
          const result = paymentInfoSchema.safeParse(invalidData);
          expect(result.success).toBe(false);

          if (!result.success) {
            const expiryError = result.error.issues.find(e =>
              e.path.includes('expiryDate')
            );
            expect(expiryError?.message).toBe('Invalid expiry date (MM/YY)');
          }
        });
      });

      it('should accept valid expiry date formats', () => {
        const validDates = ['01/25', '12/25', '06/30', '11/27'];

        validDates.forEach(expiryDate => {
          const validData = { ...validCardPayment, expiryDate };
          const result = paymentInfoSchema.safeParse(validData);
          expect(result.success).toBe(true);
        });
      });

      it('should fail when CVV is missing', () => {
        const invalidData = { ...validCardPayment, cvv: '' };
        const result = paymentInfoSchema.safeParse(invalidData);

        expect(result.success).toBe(false);
        if (!result.success) {
          const cvvError = result.error.issues.find(e =>
            e.path.includes('cvv')
          );
          expect(cvvError?.message).toBe('CVV must be 3 digits');
        }
      });

      it('should fail when CVV is not 3 digits', () => {
        const invalidCvvs = [
          '12', // Too short
          '1234', // Too long
          'abc', // Not digits
          '12a', // Contains letter
        ];

        invalidCvvs.forEach(cvv => {
          const invalidData = { ...validCardPayment, cvv };
          const result = paymentInfoSchema.safeParse(invalidData);
          expect(result.success).toBe(false);

          if (!result.success) {
            const cvvError = result.error.issues.find(e =>
              e.path.includes('cvv')
            );
            expect(cvvError?.message).toBe('CVV must be 3 digits');
          }
        });
      });

      it('should accept valid CVV', () => {
        const validCvvs = ['123', '456', '789', '000'];

        validCvvs.forEach(cvv => {
          const validData = { ...validCardPayment, cvv };
          const result = paymentInfoSchema.safeParse(validData);
          expect(result.success).toBe(true);
        });
      });
    });

    describe('insurance payment method', () => {
      it('should validate correct insurance payment information', () => {
        const result = paymentInfoSchema.safeParse(validInsurancePayment);
        expect(result.success).toBe(true);
        expect(result.data).toEqual(validInsurancePayment);
      });

      it('should fail when insurance provider is missing', () => {
        const invalidData = { ...validInsurancePayment, insuranceProvider: '' };
        const result = paymentInfoSchema.safeParse(invalidData);

        expect(result.success).toBe(false);
        if (!result.success) {
          const providerError = result.error.issues.find(e =>
            e.path.includes('insuranceProvider')
          );
          expect(providerError?.message).toBe('Insurance provider is required');
        }
      });

      it('should trim whitespace from insurance provider', () => {
        const dataWithWhitespace = {
          ...validInsurancePayment,
          insuranceProvider: '  Ceylinco Insurance  ',
        };

        const result = paymentInfoSchema.safeParse(dataWithWhitespace);
        expect(result.success).toBe(true);
        expect(result.data?.insuranceProvider).toBe('Ceylinco Insurance');
      });

      it('should fail when policy number is missing', () => {
        const invalidData = {
          ...validInsurancePayment,
          insurancePolicyNumber: '',
        };
        const result = paymentInfoSchema.safeParse(invalidData);

        expect(result.success).toBe(false);
        if (!result.success) {
          const policyError = result.error.issues.find(e =>
            e.path.includes('insurancePolicyNumber')
          );
          expect(policyError?.message).toBe('Policy number is required');
        }
      });

      it('should trim whitespace from policy number', () => {
        const dataWithWhitespace = {
          ...validInsurancePayment,
          insurancePolicyNumber: '  POL123456789  ',
        };

        const result = paymentInfoSchema.safeParse(dataWithWhitespace);
        expect(result.success).toBe(true);
        expect(result.data?.insurancePolicyNumber).toBe('POL123456789');
      });

      it('should not require card fields for insurance payments', () => {
        const insuranceWithCardFields = {
          ...validInsurancePayment,
          cardNumber: undefined,
          cardName: undefined,
          expiryDate: undefined,
          cvv: undefined,
        };

        const result = paymentInfoSchema.safeParse(insuranceWithCardFields);
        expect(result.success).toBe(true);
      });
    });

    describe('Edge Cases', () => {
      it('should fail for invalid payment method', () => {
        const invalidData = {
          paymentMethod: 'invalid' as any,
        };

        const result = paymentInfoSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });

      it('should handle multiple validation errors', () => {
        const invalidCardData = {
          paymentMethod: 'card',
          cardNumber: '123', // Too short
          cardName: '', // Missing
          expiryDate: 'invalid',
          cvv: '12', // Too short
        };

        const result = paymentInfoSchema.safeParse(invalidCardData);
        expect(result.success).toBe(false);

        if (!result.success) {
          // Should have multiple errors
          expect(result.error.issues.length).toBeGreaterThan(1);

          const errorMessages = result.error.issues.map(e => e.message);
          expect(errorMessages).toContain(
            'Card number must be 15 or 16 digits'
          );
          expect(errorMessages).toContain('Cardholder name is required');
          expect(errorMessages).toContain('Invalid expiry date (MM/YY)');
          expect(errorMessages).toContain('CVV must be 3 digits');
        }
      });

      it('should not validate card fields for cash payments', () => {
        const cashWithInvalidCardFields = {
          paymentMethod: 'cash',
          cardNumber: '123', // Invalid but should be ignored
          cardName: '', // Invalid but should be ignored
          expiryDate: 'invalid',
          cvv: '12',
        };

        const result = paymentInfoSchema.safeParse(cashWithInvalidCardFields);
        expect(result.success).toBe(true);
      });

      it('should not validate insurance fields for card payments', () => {
        const cardWithInvalidInsuranceFields = {
          paymentMethod: 'card',
          cardNumber: '4111111111111111',
          cardName: 'Jebarsan Thatcroos',
          expiryDate: '12/25',
          cvv: '123',
          insuranceProvider: '', // Invalid but should be ignored
          insurancePolicyNumber: '', // Invalid but should be ignored
        };

        const result = paymentInfoSchema.safeParse(
          cardWithInvalidInsuranceFields
        );
        expect(result.success).toBe(true);
      });

      it('should accept card number with different formats', () => {
        const cardNumbers = [
          '4111111111111111',
          '5500 0000 0000 0004',
          '3400-0000-0000-009',
          '6011 0000 0000 0004',
        ];

        cardNumbers.forEach(cardNumber => {
          const data = {
            paymentMethod: 'card',
            cardNumber,
            cardName: 'Jebarsan Thatcroos',
            expiryDate: '12/25',
            cvv: '123',
          };

          const result = paymentInfoSchema.safeParse(data);
          expect(result.success).toBe(true);
        });
      });

      it('should handle card number validation with spaces correctly', () => {
        // Test that spaces are removed before length check
        const cardNumberWithSpaces = '4111 1111 1111 1111';
        const data = {
          paymentMethod: 'card',
          cardNumber: cardNumberWithSpaces,
          cardName: 'Jebarsan Thatcroos',
          expiryDate: '12/25',
          cvv: '123',
        };

        const result = paymentInfoSchema.safeParse(data);
        expect(result.success).toBe(true);

        // The regex in superRefine removes spaces before checking length
        const withoutSpaces = cardNumberWithSpaces.replace(/\s/g, '');
        expect(withoutSpaces.length).toBe(16);
      });
    });
  });

  describe('TypeScript Types', () => {
    it('should have correct ShippingInfo type', () => {
      // This test verifies TypeScript type inference
      const shippingInfo: ShippingInfo = {
        fullName: 'Jebarsan Thatcroos',
        email: 'jebarsanthatcroos16@gmail.com',
        phone: '0712345678',
        address: 'thalaimannar, mannar',
        city: 'Mannar',
        state: 'North Province',
        zipCode: '41000',
        country: 'Sri Lanka',
      };

      // Should compile without errors
      expect(typeof shippingInfo.fullName).toBe('string');
      expect(typeof shippingInfo.email).toBe('string');
      expect(shippingInfo.country).toBe('Sri Lanka');
    });

    it('should have correct PaymentInfo type', () => {
      // Test cash payment type
      const cashPayment: PaymentInfo = {
        paymentMethod: 'cash',
        cardName: undefined,
        insuranceProvider: undefined,
        insurancePolicyNumber: undefined,
      };
      expect(cashPayment.paymentMethod).toBe('cash');

      // Test card payment type
      const cardPayment: PaymentInfo = {
        paymentMethod: 'card',
        cardNumber: '4111111111111111',
        cardName: 'Jebarsan Thatcroos',
        expiryDate: '12/25',
        cvv: '123',
        insuranceProvider: undefined,
        insurancePolicyNumber: undefined,
      };
      expect(cardPayment.paymentMethod).toBe('card');
      expect(cardPayment.cardNumber).toBeDefined();

      // Test insurance payment type
      const insurancePayment: PaymentInfo = {
        paymentMethod: 'insurance',
        insuranceProvider: 'Ceylinco',
        insurancePolicyNumber: 'POL123',
        cardName: undefined,
      };
      expect(insurancePayment.paymentMethod).toBe('insurance');
      expect(insurancePayment.insuranceProvider).toBeDefined();
    });

    it('should enforce paymentMethod enum values', () => {
      const invalidPayment: PaymentInfo = {
        paymentMethod: 'paypal' as any,
        cardName: undefined,
        insuranceProvider: undefined,
        insurancePolicyNumber: undefined,
      };

      // TypeScript should catch this, but we can also test at runtime
      const result = paymentInfoSchema.safeParse(invalidPayment);
      expect(result.success).toBe(false);
    });
  });
});

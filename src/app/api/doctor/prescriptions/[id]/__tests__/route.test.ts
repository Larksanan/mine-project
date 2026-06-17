import { GET, PUT, DELETE } from '../route';
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import Prescription from '@/models/Prescription';

// Mock dependencies
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('@/lib/mongodb', () => ({
  connectDB: jest.fn(),
}));

jest.mock('@/models/Prescription', () => ({
  findOne: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  findByIdAndDelete: jest.fn(),
}));

jest.mock('@/lib/auth', () => ({
  authOptions: {},
}));

describe('Prescription API - /api/prescriptions/[id]', () => {
  const mockId = '507f1f77bcf86cd799439011';
  let mockRequest: NextRequest;
  let mockContext: any;

  beforeEach(() => {
    mockRequest = new NextRequest(
      'http://localhost:3000/api/prescriptions/123'
    );
    mockContext = { params: Promise.resolve({ id: mockId }) };
    jest.clearAllMocks();
  });

  // Helper for mongoose chaining
  const mockQueryChain = (
    data: any,
    shouldReject = false,
    error: any = null
  ) => ({
    populate: jest.fn().mockReturnThis(),
    lean: jest.fn().mockImplementation(() => {
      if (shouldReject) return Promise.reject(error);
      return Promise.resolve(data);
    }),
  });

  // Helper functions
  const mockAuthenticatedSession = (userId = 'doctor123') => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: userId, email: 'jebarsanthatcroos@gmail.com' },
    });
  };

  const mockDBSuccess = () => {
    (connectDB as jest.Mock).mockResolvedValue(undefined);
  };

  const mockCastError = () => {
    const error = new Error('CastError');
    error.name = 'CastError';
    throw error;
  };

  const mockValidationError = () => {
    const error = new Error('ValidationError');
    error.name = 'ValidationError';
    (error as any).errors = {
      diagnosis: { message: 'Diagnosis is required' },
      medications: { message: 'Medications are required' },
    };
    throw error;
  };

  describe('GET /api/prescriptions/[id]', () => {
    it('should return 401 when user is not authenticated', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);
      mockDBSuccess();

      const response = await GET(mockRequest, mockContext);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
      expect(data.success).toBeUndefined();
    });

    it('should return 400 when prescription ID is missing', async () => {
      mockAuthenticatedSession();
      mockDBSuccess();

      const emptyContext = { params: Promise.resolve({ id: '' }) };
      const response = await GET(mockRequest, emptyContext);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Prescription ID is required');
    });

    it('should return 404 when prescription not found', async () => {
      mockAuthenticatedSession();
      mockDBSuccess();
      (Prescription.findOne as jest.Mock).mockReturnValue(mockQueryChain(null));

      const response = await GET(mockRequest, mockContext);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Prescription not found');
      expect(Prescription.findOne).toHaveBeenCalledWith({
        _id: mockId,
        doctorId: 'doctor123',
        isActive: true,
      });
    });

    it('should successfully return prescription with populated fields', async () => {
      mockAuthenticatedSession();
      mockDBSuccess();

      const mockPrescription = {
        _id: mockId,
        diagnosis: 'Hypertension',
        medications: [
          {
            name: 'jebarsan',
            dosage: '10mg',
            frequency: 'Once daily',
            duration: '30 days',
          },
        ],
        patientId: {
          firstName: 'sovika',
          lastName: 'sovi',
          email: 'sovika@gamil.com',
        },
        doctorId: {
          firstName: 'sathuska',
          lastName: 'sathu',
          specialty: 'Cardiology',
        },
      };

      const mockPopulatedQuery = {
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockPrescription),
      };

      (Prescription.findOne as jest.Mock).mockReturnValue(mockPopulatedQuery);

      const response = await GET(mockRequest, mockContext);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockPrescription);

      // Verify populate calls
      expect(mockPopulatedQuery.populate).toHaveBeenCalledWith(
        'patientId',
        'firstName lastName email phone dateOfBirth gender allergies medications'
      );
      expect(mockPopulatedQuery.populate).toHaveBeenCalledWith(
        'doctorId',
        'firstName lastName email specialty'
      );
    });

    it('should handle CastError for invalid ID format', async () => {
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      mockAuthenticatedSession();
      mockDBSuccess();
      (Prescription.findOne as jest.Mock).mockImplementation(mockCastError);

      const response = await GET(mockRequest, mockContext);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid prescription ID format');
      consoleErrorSpy.mockRestore();
    });

    it('should handle general database errors', async () => {
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      mockAuthenticatedSession();
      mockDBSuccess();
      (Prescription.findOne as jest.Mock).mockReturnValue(
        mockQueryChain(null, true, new Error('Database error'))
      );

      const response = await GET(mockRequest, mockContext);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch prescription');
      consoleErrorSpy.mockRestore();
    });
  });

  describe('PUT /api/prescriptions/[id]', () => {
    const validUpdateData = {
      diagnosis: 'Updated Diagnosis',
      medications: [
        {
          name: 'Amoxicillin',
          dosage: '500mg',
          frequency: 'Three times daily',
          duration: '7 days',
          instructions: 'Take with food',
          quantity: 21,
          refills: 1,
        },
      ],
      notes: 'Follow up in 2 weeks',
      startDate: '2025-12-01',
      endDate: '2025-12-07',
      status: 'ACTIVE',
    };

    beforeEach(() => {
      mockAuthenticatedSession();
      mockDBSuccess();
    });

    it('should return 401 when user is not authenticated', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest(
        'http://localhost:3000/api/prescriptions/123',
        {
          method: 'PUT',
          body: JSON.stringify(validUpdateData),
        }
      );

      const response = await PUT(request, mockContext);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 400 when prescription ID is missing', async () => {
      const emptyContext = { params: Promise.resolve({ id: '' }) };
      const request = new NextRequest(
        'http://localhost:3000/api/prescriptions/123',
        {
          method: 'PUT',
          body: JSON.stringify(validUpdateData),
        }
      );

      const response = await PUT(request, emptyContext);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Prescription ID is required');
    });

    it('should return 404 when prescription not found', async () => {
      (Prescription.findOne as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest(
        'http://localhost:3000/api/prescriptions/123',
        {
          method: 'PUT',
          body: JSON.stringify(validUpdateData),
        }
      );

      const response = await PUT(request, mockContext);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Prescription not found');
    });

    it('should validate medications array structure', async () => {
      const existingPrescription = { _id: mockId, doctorId: 'doctor123' };
      (Prescription.findOne as jest.Mock).mockResolvedValue(
        existingPrescription
      );

      const invalidData = {
        medications: 'not-an-array',
      };

      const request = new NextRequest(
        'http://localhost:3000/api/prescriptions/123',
        {
          method: 'PUT',
          body: JSON.stringify(invalidData),
        }
      );

      const response = await PUT(request, mockContext);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('At least one medication is required');
    });

    it('should validate medications array is not empty', async () => {
      const existingPrescription = { _id: mockId, doctorId: 'doctor123' };
      (Prescription.findOne as jest.Mock).mockResolvedValue(
        existingPrescription
      );

      const invalidData = {
        medications: [],
      };

      const request = new NextRequest(
        'http://localhost:3000/api/prescriptions/123',
        {
          method: 'PUT',
          body: JSON.stringify(invalidData),
        }
      );

      const response = await PUT(request, mockContext);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('At least one medication is required');
    });

    it('should validate medication required fields', async () => {
      const existingPrescription = { _id: mockId, doctorId: 'doctor123' };
      (Prescription.findOne as jest.Mock).mockResolvedValue(
        existingPrescription
      );

      const invalidData = {
        medications: [
          {
            name: 'Medication',
            // Missing dosage, frequency, duration
          },
        ],
      };

      const request = new NextRequest(
        'http://localhost:3000/api/prescriptions/123',
        {
          method: 'PUT',
          body: JSON.stringify(invalidData),
        }
      );

      const response = await PUT(request, mockContext);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Medication 1 is missing required fields');
    });

    it('should successfully update prescription with partial data', async () => {
      const existingPrescription = {
        _id: mockId,
        doctorId: 'doctor123',
        diagnosis: 'Original Diagnosis',
      };

      const updatedPrescription = {
        ...existingPrescription,
        diagnosis: 'Updated Diagnosis',
        notes: 'Updated notes',
        updatedAt: new Date(),
      };

      const mockPopulatedQuery = {
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(updatedPrescription),
      };

      (Prescription.findOne as jest.Mock).mockResolvedValue(
        existingPrescription
      );
      (Prescription.findByIdAndUpdate as jest.Mock).mockReturnValue(
        mockPopulatedQuery
      );

      const partialData = {
        diagnosis: 'Updated Diagnosis',
        notes: 'Updated notes',
      };

      const request = new NextRequest(
        'http://localhost:3000/api/prescriptions/123',
        {
          method: 'PUT',
          body: JSON.stringify(partialData),
        }
      );

      const response = await PUT(request, mockContext);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual({
        ...updatedPrescription,
        updatedAt: updatedPrescription.updatedAt.toISOString(),
      });

      // Verify update was called with correct parameters
      expect(Prescription.findByIdAndUpdate).toHaveBeenCalledWith(
        mockId,
        {
          diagnosis: 'Updated Diagnosis',
          notes: 'Updated notes',
        },
        {
          new: true,
          runValidators: true,
        }
      );
    });

    it('should trim string fields and handle medication transformation', async () => {
      const existingPrescription = { _id: mockId, doctorId: 'doctor123' };
      const updatedPrescription = {
        ...existingPrescription,
        medications: [
          {
            name: 'Trimmed Name',
            dosage: '10mg',
            frequency: 'Daily',
            duration: '30 days',
            instructions: 'With meals',
            quantity: 30,
            refills: 2,
          },
        ],
      };

      const mockPopulatedQuery = {
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(updatedPrescription),
      };

      (Prescription.findOne as jest.Mock).mockResolvedValue(
        existingPrescription
      );
      (Prescription.findByIdAndUpdate as jest.Mock).mockReturnValue(
        mockPopulatedQuery
      );

      const dataWithWhitespace = {
        diagnosis: '  Diagnosis with spaces  ',
        medications: [
          {
            name: '  Trimmed Name  ',
            dosage: '  10mg  ',
            frequency: '  Daily  ',
            duration: '  30 days  ',
            instructions: '  With meals  ',
            quantity: 30,
            refills: 2,
          },
        ],
        notes: '  Notes with spaces  ',
      };

      const request = new NextRequest(
        'http://localhost:3000/api/prescriptions/123',
        {
          method: 'PUT',
          body: JSON.stringify(dataWithWhitespace),
        }
      );

      const response = await PUT(request, mockContext);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      // Verify trim operations
      expect(Prescription.findByIdAndUpdate).toHaveBeenCalledWith(
        mockId,
        expect.objectContaining({
          diagnosis: 'Diagnosis with spaces',
          notes: 'Notes with spaces',
          medications: [
            expect.objectContaining({
              name: 'Trimmed Name',
              dosage: '10mg',
              frequency: 'Daily',
              duration: '30 days',
              instructions: 'With meals',
            }),
          ],
        }),
        expect.any(Object)
      );
    });

    it('should handle date conversions', async () => {
      const existingPrescription = { _id: mockId, doctorId: 'doctor123' };
      const updatedPrescription = {
        ...existingPrescription,
        startDate: new Date('2025-12-01'),
        endDate: new Date('2025-12-07'),
      };

      const mockPopulatedQuery = {
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(updatedPrescription),
      };

      (Prescription.findOne as jest.Mock).mockResolvedValue(
        existingPrescription
      );
      (Prescription.findByIdAndUpdate as jest.Mock).mockReturnValue(
        mockPopulatedQuery
      );

      const request = new NextRequest(
        'http://localhost:3000/api/prescriptions/123',
        {
          method: 'PUT',
          body: JSON.stringify({
            startDate: '2025-12-01',
            endDate: '2025-12-07',
          }),
        }
      );

      const response = await PUT(request, mockContext);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      expect(Prescription.findByIdAndUpdate).toHaveBeenCalledWith(
        mockId,
        {
          startDate: new Date('2025-12-01'),
          endDate: new Date('2025-12-07'),
        },
        expect.any(Object)
      );
    });

    it('should handle ValidationError from mongoose', async () => {
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      const existingPrescription = { _id: mockId, doctorId: 'doctor123' };
      (Prescription.findOne as jest.Mock).mockResolvedValue(
        existingPrescription
      );
      (Prescription.findByIdAndUpdate as jest.Mock).mockImplementation(
        mockValidationError
      );

      const request = new NextRequest(
        'http://localhost:3000/api/prescriptions/123',
        {
          method: 'PUT',
          body: JSON.stringify(validUpdateData),
        }
      );

      const response = await PUT(request, mockContext);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
      expect(data.details).toContain('Diagnosis is required');
      expect(data.details).toContain('Medications are required');
      consoleErrorSpy.mockRestore();
    });

    it('should handle CastError for invalid ID format', async () => {
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      const existingPrescription = { _id: mockId, doctorId: 'doctor123' };
      (Prescription.findOne as jest.Mock).mockResolvedValue(
        existingPrescription
      );
      (Prescription.findByIdAndUpdate as jest.Mock).mockImplementation(
        mockCastError
      );

      const request = new NextRequest(
        'http://localhost:3000/api/prescriptions/123',
        {
          method: 'PUT',
          body: JSON.stringify(validUpdateData),
        }
      );

      const response = await PUT(request, mockContext);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid prescription ID format');
      consoleErrorSpy.mockRestore();
    });

    it('should handle general database errors', async () => {
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      const existingPrescription = { _id: mockId, doctorId: 'doctor123' };
      (Prescription.findOne as jest.Mock).mockResolvedValue(
        existingPrescription
      );
      (Prescription.findByIdAndUpdate as jest.Mock).mockReturnValue(
        mockQueryChain(null, true, new Error('Database update failed'))
      );

      const request = new NextRequest(
        'http://localhost:3000/api/prescriptions/123',
        {
          method: 'PUT',
          body: JSON.stringify(validUpdateData),
        }
      );

      const response = await PUT(request, mockContext);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to update prescription');
      consoleErrorSpy.mockRestore();
    });
  });

  describe('DELETE /api/prescriptions/[id]', () => {
    beforeEach(() => {
      mockAuthenticatedSession();
      mockDBSuccess();
    });

    it('should return 401 when user is not authenticated', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const response = await DELETE(mockRequest, mockContext);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 400 when prescription ID is missing', async () => {
      const emptyContext = { params: Promise.resolve({ id: '' }) };
      const response = await DELETE(mockRequest, emptyContext);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Prescription ID is required');
    });

    it('should return 404 when prescription not found', async () => {
      (Prescription.findOne as jest.Mock).mockResolvedValue(null);

      const response = await DELETE(mockRequest, mockContext);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Prescription not found');
    });

    it('should perform soft delete by setting isActive to false', async () => {
      const mockPrescription = {
        _id: mockId,
        doctorId: 'doctor123',
        isActive: true,
        status: 'ACTIVE',
      };

      (Prescription.findOne as jest.Mock).mockResolvedValue(mockPrescription);
      (Prescription.findByIdAndUpdate as jest.Mock).mockResolvedValue({
        ...mockPrescription,
        isActive: false,
        status: 'CANCELLED',
      });

      const response = await DELETE(mockRequest, mockContext);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Prescription deleted successfully');

      // Verify soft delete update
      expect(Prescription.findByIdAndUpdate).toHaveBeenCalledWith(mockId, {
        isActive: false,
        status: 'CANCELLED',
      });
    });

    it('should handle CastError for invalid ID format', async () => {
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      (Prescription.findOne as jest.Mock).mockImplementation(mockCastError);

      const response = await DELETE(mockRequest, mockContext);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid prescription ID format');
      consoleErrorSpy.mockRestore();
    });

    it('should handle general database errors', async () => {
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      (Prescription.findOne as jest.Mock).mockResolvedValue({
        _id: mockId,
        doctorId: 'doctor123',
      });
      (Prescription.findByIdAndUpdate as jest.Mock).mockRejectedValue(
        new Error('Database deletion failed')
      );

      const response = await DELETE(mockRequest, mockContext);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to delete prescription');
      consoleErrorSpy.mockRestore();
    });

    it('should only delete prescriptions belonging to the authenticated doctor', async () => {
      // Mock that query returns null (simulating mismatch of doctorId)
      (Prescription.findOne as jest.Mock).mockResolvedValue(null);

      const response = await DELETE(mockRequest, mockContext);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Prescription not found');

      // Verify the query checks for correct doctor ID
      expect(Prescription.findOne).toHaveBeenCalledWith({
        _id: mockId,
        doctorId: 'doctor123',
        isActive: true,
      });
    });
  });

  describe('Edge Cases', () => {
    it('GET should not return inactive prescriptions', async () => {
      mockAuthenticatedSession();
      mockDBSuccess();

      // Mock that prescription exists but is inactive
      (Prescription.findOne as jest.Mock).mockReturnValue(mockQueryChain(null));

      const response = await GET(mockRequest, mockContext);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Prescription not found');
    });

    it('PUT should handle empty medications array in existing prescription when not updating medications', async () => {
      mockAuthenticatedSession();
      mockDBSuccess();

      const existingPrescription = {
        _id: mockId,
        doctorId: 'doctor123',
        medications: [], // Empty array in existing
      };

      const updatedPrescription = {
        ...existingPrescription,
        diagnosis: 'New Diagnosis',
      };

      const mockPopulatedQuery = {
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(updatedPrescription),
      };

      (Prescription.findOne as jest.Mock).mockResolvedValue(
        existingPrescription
      );
      (Prescription.findByIdAndUpdate as jest.Mock).mockReturnValue(
        mockPopulatedQuery
      );

      const request = new NextRequest(
        'http://localhost:3000/api/prescriptions/123',
        {
          method: 'PUT',
          body: JSON.stringify({
            diagnosis: 'New Diagnosis',
            // Not updating medications field
          }),
        }
      );

      const response = await PUT(request, mockContext);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should handle undefined or null values in PUT request', async () => {
      mockAuthenticatedSession();
      mockDBSuccess();

      const existingPrescription = { _id: mockId, doctorId: 'doctor123' };
      const updatedPrescription = { ...existingPrescription };

      const mockPopulatedQuery = {
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(updatedPrescription),
      };

      (Prescription.findOne as jest.Mock).mockResolvedValue(
        existingPrescription
      );
      (Prescription.findByIdAndUpdate as jest.Mock).mockReturnValue(
        mockPopulatedQuery
      );

      const request = new NextRequest(
        'http://localhost:3000/api/prescriptions/123',
        {
          method: 'PUT',
          body: JSON.stringify({
            notes: null, // Should be handled gracefully
          }),
        }
      );

      const response = await PUT(request, mockContext);

      // Should not throw error for null notes
      expect(response.status).toBe(200);
    });

    it('DELETE should not allow deleting already inactive prescriptions', async () => {
      mockAuthenticatedSession();
      mockDBSuccess();

      // Mock prescription is already inactive
      (Prescription.findOne as jest.Mock).mockResolvedValue(null);

      const response = await DELETE(mockRequest, mockContext);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Prescription not found');
    });
  });
});

import { NextRequest } from 'next/server';
import { GET, PATCH, DELETE } from '../route';
import { getServerSession } from 'next-auth';
import LabTest from '@/models/LabTest';

// Mock dependencies
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('@/lib/mongodb', () => ({
  connectDB: jest.fn(),
}));

jest.mock('@/lib/auth', () => ({
  authOptions: {},
}));

jest.mock('@/models/LabTest', () => ({
  __esModule: true,
  default: {
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
  },
}));

describe('Lab Tests API - Individual Test Operations', () => {
  let mockRequest: NextRequest;
  let mockContext: any;
  const mockFindById = LabTest.findById as jest.Mock;
  const mockFindByIdAndUpdate = LabTest.findByIdAndUpdate as jest.Mock;

  const originalConsoleError = console.error;
  const mockConsoleError = jest.fn();

  beforeAll(() => {
    console.error = mockConsoleError;
  });
  afterAll(() => {
    console.error = originalConsoleError;
  });

  beforeEach(() => {
    jest.clearAllMocks();

    mockRequest = {
      json: jest.fn(),
    } as any;

    mockContext = {
      params: Promise.resolve({ id: 'test-id-123' }),
    };
  });

  describe('GET /api/lab/lab-tests/[id]', () => {
    it('should return 404 when lab test is not found', async () => {
      // Mock the chained method properly
      const mockSelect = jest.fn().mockResolvedValue(null);
      mockFindById.mockReturnValue({ select: mockSelect });

      const response = await GET(mockRequest, mockContext);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data).toEqual({ error: 'Lab test not found' });
      expect(mockFindById).toHaveBeenCalledWith('test-id-123');
      expect(mockSelect).toHaveBeenCalledWith('-__v');
    });

    it('should return lab test when found', async () => {
      const mockTest = {
        _id: 'test-id-123',
        name: 'Complete Blood Count',
        category: 'Hematology',
        price: 100,
        isActive: true,
      };

      // Mock the chained method properly
      const mockSelect = jest.fn().mockResolvedValue(mockTest);
      mockFindById.mockReturnValue({ select: mockSelect });

      const response = await GET(mockRequest, mockContext);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ test: mockTest });
      expect(mockFindById).toHaveBeenCalledWith('test-id-123');
      expect(mockSelect).toHaveBeenCalledWith('-__v');
    });

    it('should return 500 on database error', async () => {
      // Mock the chained method to throw error
      const mockSelect = jest.fn().mockRejectedValue(new Error('DB Error'));
      mockFindById.mockReturnValue({ select: mockSelect });

      const response = await GET(mockRequest, mockContext);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({ error: 'Internal server error' });
    });
  });

  describe('PATCH /api/lab/lab-tests/[id]', () => {
    it('should return 401 when user is not authenticated', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const response = await PATCH(mockRequest, mockContext);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual({ error: 'Unauthorized' });
    });

    it('should return 401 when user does not have required role', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { role: 'DOCTOR' },
      });

      const response = await PATCH(mockRequest, mockContext);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual({ error: 'Unauthorized' });
    });

    it('should return 404 when lab test to update is not found', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { role: 'ADMIN' },
      });
      (mockRequest.json as jest.Mock).mockResolvedValue({ price: 150 });
      mockFindByIdAndUpdate.mockResolvedValue(null);

      const response = await PATCH(mockRequest, mockContext);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data).toEqual({ error: 'Lab test not found' });
    });

    it('should update lab test successfully with ADMIN role', async () => {
      const mockUpdatedTest = {
        _id: 'test-id-123',
        name: 'Complete Blood Count',
        category: 'Hematology',
        price: 150,
        isActive: true,
      };

      (getServerSession as jest.Mock).mockResolvedValue({
        user: { role: 'ADMIN' },
      });
      (mockRequest.json as jest.Mock).mockResolvedValue({ price: 150 });
      mockFindByIdAndUpdate.mockResolvedValue(mockUpdatedTest);

      const response = await PATCH(mockRequest, mockContext);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ test: mockUpdatedTest });
      expect(mockFindByIdAndUpdate).toHaveBeenCalledWith(
        'test-id-123',
        { price: 150 },
        { new: true, runValidators: true }
      );
    });

    it('should update lab test successfully with LABTECH role', async () => {
      const mockUpdatedTest = {
        _id: 'test-id-123',
        name: 'Complete Blood Count',
        category: 'Hematology',
        price: 150,
        isActive: true,
      };

      (getServerSession as jest.Mock).mockResolvedValue({
        user: { role: 'LABTECH' },
      });
      (mockRequest.json as jest.Mock).mockResolvedValue({ price: 150 });
      mockFindByIdAndUpdate.mockResolvedValue(mockUpdatedTest);

      const response = await PATCH(mockRequest, mockContext);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ test: mockUpdatedTest });
    });

    it('should remove protected fields from update data', async () => {
      const mockUpdatedTest = {
        _id: 'test-id-123',
        name: 'Updated Test',
        category: 'Hematology',
        price: 150,
        isActive: true,
      };

      (getServerSession as jest.Mock).mockResolvedValue({
        user: { role: 'ADMIN' },
      });

      // Request includes protected fields
      (mockRequest.json as jest.Mock).mockResolvedValue({
        _id: 'attempt-to-change-id',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-02',
        name: 'Updated Test',
        price: 150,
      });

      mockFindByIdAndUpdate.mockResolvedValue(mockUpdatedTest);

      const response = await PATCH(mockRequest, mockContext);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ test: mockUpdatedTest });

      // Should call update with only allowed fields
      expect(mockFindByIdAndUpdate).toHaveBeenCalledWith(
        'test-id-123',
        { name: 'Updated Test', price: 150 },
        { new: true, runValidators: true }
      );
    });

    it('should return 400 on duplicate key error', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { role: 'ADMIN' },
      });
      (mockRequest.json as jest.Mock).mockResolvedValue({
        name: 'Duplicate Test',
      });

      const duplicateError = new Error('Duplicate key');
      (duplicateError as any).code = 11000;
      mockFindByIdAndUpdate.mockRejectedValue(duplicateError);

      const response = await PATCH(mockRequest, mockContext);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({
        error: 'Test name already exists in this category',
      });
    });

    it('should return 400 on validation error', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { role: 'ADMIN' },
      });
      (mockRequest.json as jest.Mock).mockResolvedValue({ price: -10 });

      const validationError = new Error('Validation error');
      (validationError as any).name = 'ValidationError';
      (validationError as any).errors = {
        price: { message: 'Price must be positive' },
      };

      mockFindByIdAndUpdate.mockRejectedValue(validationError);

      const response = await PATCH(mockRequest, mockContext);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({
        error: 'Validation error',
        details: ['Price must be positive'],
      });
    });

    it('should return 500 on general error', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { role: 'ADMIN' },
      });
      (mockRequest.json as jest.Mock).mockResolvedValue({ price: 150 });
      mockFindByIdAndUpdate.mockRejectedValue(new Error('General error'));

      const response = await PATCH(mockRequest, mockContext);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({ error: 'Internal server error' });
    });
  });

  describe('DELETE /api/lab/lab-tests/[id]', () => {
    it('should return 401 when user is not authenticated', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const response = await DELETE(mockRequest, mockContext);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual({ error: 'Unauthorized' });
    });

    it('should return 401 when user does not have required role', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { role: 'DOCTOR' },
      });

      const response = await DELETE(mockRequest, mockContext);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual({ error: 'Unauthorized' });
    });

    it('should return 404 when lab test to deactivate is not found', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { role: 'ADMIN' },
      });
      mockFindByIdAndUpdate.mockResolvedValue(null);

      const response = await DELETE(mockRequest, mockContext);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data).toEqual({ error: 'Lab test not found' });
    });

    it('should deactivate lab test successfully', async () => {
      const mockDeactivatedTest = {
        _id: 'test-id-123',
        name: 'Complete Blood Count',
        category: 'Hematology',
        price: 100,
        isActive: false,
      };

      (getServerSession as jest.Mock).mockResolvedValue({
        user: { role: 'ADMIN' },
      });
      mockFindByIdAndUpdate.mockResolvedValue(mockDeactivatedTest);

      const response = await DELETE(mockRequest, mockContext);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        message: 'Lab test deactivated successfully',
        test: mockDeactivatedTest,
      });
      expect(mockFindByIdAndUpdate).toHaveBeenCalledWith(
        'test-id-123',
        { isActive: false },
        { new: true }
      );
    });

    it('should allow LABTECH role to deactivate lab test', async () => {
      const mockDeactivatedTest = {
        _id: 'test-id-123',
        name: 'Complete Blood Count',
        category: 'Hematology',
        price: 100,
        isActive: false,
      };

      (getServerSession as jest.Mock).mockResolvedValue({
        user: { role: 'LABTECH' },
      });
      mockFindByIdAndUpdate.mockResolvedValue(mockDeactivatedTest);

      const response = await DELETE(mockRequest, mockContext);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        message: 'Lab test deactivated successfully',
        test: mockDeactivatedTest,
      });
    });

    it('should return 500 on database error during deactivation', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { role: 'ADMIN' },
      });
      mockFindByIdAndUpdate.mockRejectedValue(new Error('DB Error'));

      const response = await DELETE(mockRequest, mockContext);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({ error: 'Internal server error' });
    });
  });
});

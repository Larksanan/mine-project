import { NextRequest } from 'next/server';
import { GET } from '../route';
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
  countDocuments: jest.fn(),
  aggregate: jest.fn(),
}));

jest.mock('@/lib/auth', () => ({
  authOptions: {},
}));

describe('Prescription Statistics API', () => {
  let mockRequest: NextRequest;

  const originalConsoleError = console.error;
  const mockConsoleError = jest.fn();

  beforeAll(() => {
    console.error = mockConsoleError;
  });

  afterAll(() => {
    console.error = originalConsoleError;
  });

  beforeEach(() => {
    jest.resetAllMocks();
    (connectDB as jest.Mock).mockResolvedValue(undefined);

    // Create a mock NextRequest with URL
    mockRequest = new NextRequest(
      'http://localhost:3000/api/prescriptions/stats'
    );
  });

  describe('GET /api/prescriptions/stats', () => {
    it('should return 401 when user is not authenticated', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual({ error: 'Unauthorized' });
      expect(connectDB).toHaveBeenCalled();
    });

    it('should return statistics successfully without date filters', async () => {
      const mockSession = {
        user: {
          id: 'doctor-123',
        },
      };

      const mockStatusStats = [
        { _id: 'ACTIVE', count: 50 },
        { _id: 'COMPLETED', count: 30 },
        { _id: 'CANCELLED', count: 20 },
      ];

      const mockMonthlyStats = [
        { _id: { year: 2024, month: 1 }, count: 10 },
        { _id: { year: 2024, month: 2 }, count: 15 },
        { _id: { year: 2024, month: 3 }, count: 12 },
      ];

      const mockTopMedications = [
        { _id: 'Aspirin', count: 25, totalQuantity: 250 },
        { _id: 'Ibuprofen', count: 20, totalQuantity: 200 },
        { _id: 'Paracetamol', count: 15, totalQuantity: 150 },
      ];

      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (Prescription.countDocuments as jest.Mock)
        .mockResolvedValueOnce(100) // totalPrescriptions
        .mockResolvedValueOnce(20); // recentPrescriptions
      (Prescription.aggregate as jest.Mock)
        .mockResolvedValueOnce(mockStatusStats) // statusStats
        .mockResolvedValueOnce(mockMonthlyStats) // monthlyStats
        .mockResolvedValueOnce(mockTopMedications); // topMedications

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        data: {
          total: 100,
          recent: 20,
          status: {
            ACTIVE: 50,
            COMPLETED: 30,
            CANCELLED: 20,
          },
          trends: {
            monthly: [
              { month: '2024-01', prescriptions: 10 },
              { month: '2024-02', prescriptions: 15 },
              { month: '2024-03', prescriptions: 12 },
            ],
          },
          medications: {
            topPrescribed: [
              { name: 'Aspirin', count: 25, totalQuantity: 250 },
              { name: 'Ibuprofen', count: 20, totalQuantity: 200 },
              { name: 'Paracetamol', count: 15, totalQuantity: 150 },
            ],
            totalUnique: 3,
          },
          averages: {
            prescriptionsPerMonth: 33, // 100 / 3 rounded
            activeRate: 50, // (50 / 100) * 100 rounded
          },
        },
      });

      expect(connectDB).toHaveBeenCalled();

      // Check base query without date filters
      const expectedBaseQuery = {
        isActive: true,
        doctorId: 'doctor-123',
      };

      expect(Prescription.countDocuments).toHaveBeenCalledWith(
        expectedBaseQuery
      );
      expect(Prescription.aggregate).toHaveBeenCalledWith([
        { $match: expectedBaseQuery },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]);
    });

    it('should apply date range filters when provided', async () => {
      const mockSession = {
        user: {
          id: 'doctor-123',
        },
      };

      const requestWithDates = new NextRequest(
        'http://localhost:3000/api/prescriptions/stats?startDate=2024-01-01&endDate=2024-03-31'
      );

      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      // Create request with date parameters
      (Prescription.countDocuments as jest.Mock)
        .mockResolvedValueOnce(50)
        .mockResolvedValueOnce(10);
      (Prescription.aggregate as jest.Mock)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      await GET(requestWithDates);

      const expectedBaseQuery = {
        isActive: true,
        doctorId: 'doctor-123',
        createdAt: {
          $gte: new Date('2024-01-01'),
          $lte: new Date('2024-03-31'),
        },
      };

      expect(Prescription.countDocuments).toHaveBeenCalledWith(
        expectedBaseQuery
      );
      expect(Prescription.aggregate).toHaveBeenCalledWith([
        { $match: expectedBaseQuery },
        expect.any(Object),
      ]);
    });

    it('should apply only start date filter when end date is missing', async () => {
      const mockSession = {
        user: {
          id: 'doctor-123',
        },
      };

      const requestWithStartDate = new NextRequest(
        'http://localhost:3000/api/prescriptions/stats?startDate=2024-01-01'
      );

      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (Prescription.countDocuments as jest.Mock)
        .mockResolvedValueOnce(50)
        .mockResolvedValueOnce(10);
      (Prescription.aggregate as jest.Mock)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      await GET(requestWithStartDate);

      const expectedBaseQuery = {
        isActive: true,
        doctorId: 'doctor-123',
        createdAt: {
          $gte: new Date('2024-01-01'),
        },
      };

      expect(Prescription.countDocuments).toHaveBeenCalledWith(
        expectedBaseQuery
      );
    });

    it('should apply only end date filter when start date is missing', async () => {
      const mockSession = {
        user: {
          id: 'doctor-123',
        },
      };

      const requestWithEndDate = new NextRequest(
        'http://localhost:3000/api/prescriptions/stats?endDate=2024-03-31'
      );

      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (Prescription.countDocuments as jest.Mock)
        .mockResolvedValueOnce(50)
        .mockResolvedValueOnce(10);
      (Prescription.aggregate as jest.Mock)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      await GET(requestWithEndDate);

      const expectedBaseQuery = {
        isActive: true,
        doctorId: 'doctor-123',
        createdAt: {
          $lte: new Date('2024-03-31'),
        },
      };

      expect(Prescription.countDocuments).toHaveBeenCalledWith(
        expectedBaseQuery
      );
    });

    it('should handle missing status in status stats', async () => {
      const mockSession = {
        user: {
          id: 'doctor-123',
        },
      };

      const mockStatusStats = [
        { _id: 'ACTIVE', count: 50 },
        // Missing COMPLETED and CANCELLED
      ];

      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (Prescription.countDocuments as jest.Mock)
        .mockResolvedValueOnce(50)
        .mockResolvedValueOnce(10);
      (Prescription.aggregate as jest.Mock)
        .mockResolvedValueOnce(mockStatusStats) // statusStats
        .mockResolvedValueOnce([]) // monthlyStats
        .mockResolvedValueOnce([]); // topMedications

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(data.data.status).toEqual({
        ACTIVE: 50,
        COMPLETED: 0,
        CANCELLED: 0,
      });
    });

    it('should handle empty results gracefully', async () => {
      const mockSession = {
        user: {
          id: 'doctor-123',
        },
      };

      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (Prescription.countDocuments as jest.Mock)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);
      (Prescription.aggregate as jest.Mock)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toEqual({
        total: 0,
        recent: 0,
        status: {
          ACTIVE: 0,
          COMPLETED: 0,
          CANCELLED: 0,
        },
        trends: {
          monthly: [],
        },
        medications: {
          topPrescribed: [],
          totalUnique: 0,
        },
        averages: {
          prescriptionsPerMonth: 0,
          activeRate: 0,
        },
      });
    });

    it('should handle calculation errors for averages', async () => {
      const mockSession = {
        user: {
          id: 'doctor-123',
        },
      };

      const mockMonthlyStats: any[] = [];

      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (Prescription.countDocuments as jest.Mock)
        .mockResolvedValueOnce(100)
        .mockResolvedValueOnce(20);
      (Prescription.aggregate as jest.Mock)
        .mockResolvedValueOnce([{ _id: 'ACTIVE', count: 100 }])
        .mockResolvedValueOnce(mockMonthlyStats)
        .mockResolvedValueOnce([]);

      const response = await GET(mockRequest);
      const data = await response.json();

      // Should use Math.max(monthlyData.length, 1) to avoid division by zero
      expect(data.data.averages.prescriptionsPerMonth).toBe(100); // 100 / 1
      expect(data.data.averages.activeRate).toBe(100); // (100 / 100) * 100
    });

    it('should limit monthly stats to 12 months', async () => {
      const mockSession = {
        user: {
          id: 'doctor-123',
        },
      };

      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (Prescription.countDocuments as jest.Mock)
        .mockResolvedValueOnce(100)
        .mockResolvedValueOnce(20);
      (Prescription.aggregate as jest.Mock)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]) // monthlyStats - empty for this test
        .mockResolvedValueOnce([]);

      await GET(mockRequest);

      expect(Prescription.aggregate).toHaveBeenCalledWith([
        { $match: expect.any(Object) },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
        { $limit: 12 },
      ]);
    });

    it('should format month with leading zero', async () => {
      const mockSession = {
        user: {
          id: 'doctor-123',
        },
      };

      const mockMonthlyStats = [
        { _id: { year: 2024, month: 1 }, count: 10 },
        { _id: { year: 2024, month: 12 }, count: 15 },
      ];

      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (Prescription.countDocuments as jest.Mock)
        .mockResolvedValueOnce(100)
        .mockResolvedValueOnce(20);
      (Prescription.aggregate as jest.Mock)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce(mockMonthlyStats)
        .mockResolvedValueOnce([]);

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(data.data.trends.monthly).toEqual([
        { month: '2024-01', prescriptions: 10 },
        { month: '2024-12', prescriptions: 15 },
      ]);
    });

    it('should handle database connection errors', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'doctor-123' },
      });
      (connectDB as jest.Mock).mockRejectedValue(
        new Error('DB connection failed')
      );

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch prescription statistics');
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error fetching prescription statistics:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it('should handle aggregate query errors', async () => {
      const mockSession = {
        user: {
          id: 'doctor-123',
        },
      };

      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (Prescription.countDocuments as jest.Mock).mockResolvedValueOnce(100);
      (Prescription.aggregate as jest.Mock).mockRejectedValue(
        new Error('Aggregation failed')
      );

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch prescription statistics');

      consoleErrorSpy.mockRestore();
    });

    it('should include error details in development mode', async () => {
      const originalEnv = process.env.NODE_ENV;
      (process.env as any).NODE_ENV = 'development';

      const mockSession = {
        user: {
          id: 'doctor-123',
        },
      };

      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (connectDB as jest.Mock).mockRejectedValue(new Error('Test error'));

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(data.details).toBe('Test error');

      consoleErrorSpy.mockRestore();
      (process.env as any).NODE_ENV = originalEnv;
    });

    it('should not include error details in production mode', async () => {
      const originalEnv = process.env.NODE_ENV;
      (process.env as any).NODE_ENV = 'production';

      const mockSession = {
        user: {
          id: 'doctor-123',
        },
      };

      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (connectDB as jest.Mock).mockRejectedValue(new Error('Test error'));

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(data.details).toBeUndefined();

      consoleErrorSpy.mockRestore();
      (process.env as any).NODE_ENV = originalEnv;
    });

    it('should handle Promise.all rejection gracefully', async () => {
      const mockSession = {
        user: {
          id: 'doctor-123',
        },
      };

      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (Prescription.countDocuments as jest.Mock).mockRejectedValue(
        new Error('Count failed')
      );

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch prescription statistics');

      consoleErrorSpy.mockRestore();
    });

    it('should properly handle medication aggregation', async () => {
      const mockSession = {
        user: {
          id: 'doctor-123',
        },
      };

      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (Prescription.countDocuments as jest.Mock)
        .mockResolvedValueOnce(100)
        .mockResolvedValueOnce(20);
      (Prescription.aggregate as jest.Mock)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([
          { _id: 'Med1', count: 10, totalQuantity: 100 },
          { _id: 'Med2', count: 5, totalQuantity: 50 },
        ]);

      await GET(mockRequest);

      expect(Prescription.aggregate).toHaveBeenCalledWith([
        { $match: expect.any(Object) },
        { $unwind: '$medications' },
        {
          $group: {
            _id: '$medications.name',
            count: { $sum: 1 },
            totalQuantity: { $sum: '$medications.quantity' },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]);
    });
  });
});

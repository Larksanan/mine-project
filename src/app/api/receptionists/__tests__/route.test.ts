// src/app/api/receptionist/statistics/__tests__/route.test.ts
import { GET } from '../route';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import Receptionist from '@/models/Receptionist';
import { NextRequest } from 'next/server';
import { EmploymentStatus, ShiftType } from '@/types/Receptionist';

// Mock dependencies
jest.mock('next-auth');
jest.mock('@/lib/mongodb');
jest.mock('@/models/Receptionist');
jest.mock('@/lib/auth');

const mockGetServerSession = getServerSession as jest.MockedFunction<
  typeof getServerSession
>;
const mockCountDocuments = Receptionist.countDocuments as jest.MockedFunction<
  typeof Receptionist.countDocuments
>;
const mockAggregate = Receptionist.aggregate as jest.MockedFunction<
  typeof Receptionist.aggregate
>;

describe('GET /api/receptionist/statistics', () => {
  let mockRequest: NextRequest;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create a mock NextRequest
    mockRequest = {
      url: 'http://localhost:3000/api/receptionist/statistics',
    } as NextRequest;

    // Mock connectDB
    (connectDB as jest.Mock).mockResolvedValue(undefined);
  });

  it('should return 401 if user is not authenticated', async () => {
    // Arrange
    mockGetServerSession.mockResolvedValue(null);

    // Act
    const response = await GET(mockRequest);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(401);
    expect(data).toEqual({
      success: false,
      error: 'Unauthorized',
    });
  });

  it('should return statistics successfully', async () => {
    // Arrange
    mockGetServerSession.mockResolvedValue({
      user: {
        id: 'user-123',
        name: 'Admin User',
        email: 'admin@example.com',
        role: 'ADMIN',
      },
    });

    // Mock countDocuments calls
    mockCountDocuments
      .mockResolvedValueOnce(50) // total
      .mockResolvedValueOnce(40) // active
      .mockResolvedValueOnce(5) // onLeave
      .mockResolvedValueOnce(2) // suspended
      .mockResolvedValueOnce(3) // terminated
      .mockResolvedValueOnce(15) // morning shift
      .mockResolvedValueOnce(10) // evening shift
      .mockResolvedValueOnce(8) // night shift
      .mockResolvedValueOnce(7) // full day shift
      .mockResolvedValueOnce(25); // available receptionists

    // Mock department aggregate
    const mockDepartmentResults = [
      { _id: 'Cardiology', count: 12 },
      { _id: 'Neurology', count: 8 },
      { _id: 'Pediatrics', count: 10 },
    ];

    // Mock performance aggregate
    const mockPerformanceResults = [{ _id: null, avgPerformance: 4.5 }];

    // Mock appointments aggregate
    const mockAppointmentsResults = [{ _id: null, total: 125 }];

    mockAggregate
      .mockResolvedValueOnce(mockDepartmentResults)
      .mockResolvedValueOnce(mockPerformanceResults)
      .mockResolvedValueOnce(mockAppointmentsResults);

    // Act
    const response = await GET(mockRequest);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(data).toEqual({
      success: true,
      data: {
        total: 50,
        active: 40,
        onLeave: 5,
        suspended: 2,
        terminated: 3,
        available: 25,
        unavailable: 15, // active - available = 40 - 25 = 15
        byShift: {
          [ShiftType.MORNING]: 15,
          [ShiftType.EVENING]: 10,
          [ShiftType.NIGHT]: 8,
          [ShiftType.FULL_DAY]: 7,
        },
        byDepartment: {
          Cardiology: 12,
          Neurology: 8,
          Pediatrics: 10,
        },
        averagePerformance: 4.5,
        totalAppointmentsToday: 125,
      },
    });

    // Verify countDocuments calls
    expect(mockCountDocuments).toHaveBeenCalledTimes(10);
    expect(mockCountDocuments).toHaveBeenNthCalledWith(1);
    expect(mockCountDocuments).toHaveBeenNthCalledWith(2, {
      employmentStatus: EmploymentStatus.ACTIVE,
    });
    expect(mockCountDocuments).toHaveBeenNthCalledWith(3, {
      employmentStatus: EmploymentStatus.ON_LEAVE,
    });
    expect(mockCountDocuments).toHaveBeenNthCalledWith(4, {
      employmentStatus: EmploymentStatus.SUSPENDED,
    });
    expect(mockCountDocuments).toHaveBeenNthCalledWith(5, {
      employmentStatus: EmploymentStatus.TERMINATED,
    });
    expect(mockCountDocuments).toHaveBeenNthCalledWith(6, {
      shift: ShiftType.MORNING,
    });
    expect(mockCountDocuments).toHaveBeenNthCalledWith(7, {
      shift: ShiftType.EVENING,
    });
    expect(mockCountDocuments).toHaveBeenNthCalledWith(8, {
      shift: ShiftType.NIGHT,
    });
    expect(mockCountDocuments).toHaveBeenNthCalledWith(9, {
      shift: ShiftType.FULL_DAY,
    });
    expect(mockCountDocuments).toHaveBeenNthCalledWith(10, {
      employmentStatus: EmploymentStatus.ACTIVE,
      $expr: {
        $lt: ['$currentAppointmentsCount', '$maxAppointmentsPerDay'],
      },
    });

    // Verify aggregate calls
    expect(mockAggregate).toHaveBeenCalledTimes(3);

    // First aggregate call (departments)
    expect(mockAggregate).toHaveBeenNthCalledWith(1, [
      { $match: { department: { $exists: true, $ne: null } } },
      { $group: { _id: '$department', count: { $sum: 1 } } },
    ]);

    // Second aggregate call (performance)
    expect(mockAggregate).toHaveBeenNthCalledWith(2, [
      {
        $match: {
          'performanceMetrics.patientSatisfactionScore': { $exists: true },
        },
      },
      {
        $group: {
          _id: null,
          avgPerformance: {
            $avg: '$performanceMetrics.patientSatisfactionScore',
          },
        },
      },
    ]);

    // Third aggregate call (appointments)
    expect(mockAggregate).toHaveBeenNthCalledWith(3, [
      { $match: { employmentStatus: EmploymentStatus.ACTIVE } },
      {
        $group: {
          _id: null,
          total: { $sum: '$currentAppointmentsCount' },
        },
      },
    ]);
  });

  it('should handle no departments found', async () => {
    // Arrange
    mockGetServerSession.mockResolvedValue({
      user: {
        id: 'user-123',
        name: 'Admin User',
        email: 'admin@example.com',
        role: 'ADMIN',
      },
    });

    // Mock countDocuments
    mockCountDocuments
      .mockResolvedValueOnce(10) // total
      .mockResolvedValueOnce(8) // active
      .mockResolvedValueOnce(1) // onLeave
      .mockResolvedValueOnce(0) // suspended
      .mockResolvedValueOnce(1) // terminated
      .mockResolvedValueOnce(3) // morning shift
      .mockResolvedValueOnce(2) // evening shift
      .mockResolvedValueOnce(1) // night shift
      .mockResolvedValueOnce(2) // full day shift
      .mockResolvedValueOnce(5); // available receptionists

    // Mock empty department results
    mockAggregate
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    // Act
    const response = await GET(mockRequest);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(data.data.byDepartment).toEqual({});
    expect(data.data.averagePerformance).toBe(0);
    expect(data.data.totalAppointmentsToday).toBe(0);
    expect(data.data.unavailable).toBe(3); // active - available = 8 - 5 = 3
  });

  it('should handle empty database', async () => {
    // Arrange
    mockGetServerSession.mockResolvedValue({
      user: {
        id: 'user-123',
        name: 'Admin User',
        email: 'admin@example.com',
        role: 'ADMIN',
      },
    });

    // Mock all counts as 0
    mockCountDocuments.mockResolvedValue(0);

    // Mock empty aggregate results
    mockAggregate.mockResolvedValue([]);

    // Act
    const response = await GET(mockRequest);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(data.data).toEqual({
      total: 0,
      active: 0,
      onLeave: 0,
      suspended: 0,
      terminated: 0,
      available: 0,
      unavailable: 0, // 0 - 0 = 0
      byShift: {
        [ShiftType.MORNING]: 0,
        [ShiftType.EVENING]: 0,
        [ShiftType.NIGHT]: 0,
        [ShiftType.FULL_DAY]: 0,
      },
      byDepartment: {},
      averagePerformance: 0,
      totalAppointmentsToday: 0,
    });
  });

  it('should handle rounding of average performance', async () => {
    // Arrange
    mockGetServerSession.mockResolvedValue({
      user: {
        id: 'user-123',
        name: 'Admin User',
        email: 'admin@example.com',
        role: 'ADMIN',
      },
    });

    // Mock countDocuments
    mockCountDocuments
      .mockResolvedValueOnce(10) // total
      .mockResolvedValueOnce(8) // active
      .mockResolvedValueOnce(1) // onLeave
      .mockResolvedValueOnce(0) // suspended
      .mockResolvedValueOnce(1) // terminated
      .mockResolvedValueOnce(3) // morning shift
      .mockResolvedValueOnce(2) // evening shift
      .mockResolvedValueOnce(1) // night shift
      .mockResolvedValueOnce(2) // full day shift
      .mockResolvedValueOnce(5); // available receptionists

    // Mock department aggregate
    const mockDepartmentResults = [{ _id: 'Cardiology', count: 5 }];

    // Mock performance aggregate with decimal
    const mockPerformanceResults = [{ _id: null, avgPerformance: 4.56789 }];

    // Mock appointments aggregate
    const mockAppointmentsResults = [{ _id: null, total: 45 }];

    mockAggregate
      .mockResolvedValueOnce(mockDepartmentResults)
      .mockResolvedValueOnce(mockPerformanceResults)
      .mockResolvedValueOnce(mockAppointmentsResults);

    // Act
    const response = await GET(mockRequest);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(data.data.averagePerformance).toBe(4.57); // Rounded to 2 decimal places
  });

  it('should handle database connection errors', async () => {
    // Arrange
    mockGetServerSession.mockResolvedValue({
      user: {
        id: 'user-123',
        name: 'Admin User',
        email: 'admin@example.com',
        role: 'ADMIN',
      },
    });

    (connectDB as jest.Mock).mockRejectedValue(
      new Error('Database connection failed')
    );

    // Act
    const response = await GET(mockRequest);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(500);
    expect(data).toEqual({
      success: false,
      error: 'Database connection failed',
    });
  });

  it('should handle countDocuments errors', async () => {
    // Arrange
    mockGetServerSession.mockResolvedValue({
      user: {
        id: 'user-123',
        name: 'Admin User',
        email: 'admin@example.com',
        role: 'ADMIN',
      },
    });

    mockCountDocuments.mockRejectedValue(new Error('Count query failed'));

    // Act
    const response = await GET(mockRequest);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(500);
    expect(data).toEqual({
      success: false,
      error: 'Count query failed',
    });
  });

  it('should handle aggregate errors', async () => {
    // Arrange
    mockGetServerSession.mockResolvedValue({
      user: {
        id: 'user-123',
        name: 'Admin User',
        email: 'admin@example.com',
        role: 'ADMIN',
      },
    });

    // Mock countDocuments to succeed initially
    mockCountDocuments.mockResolvedValue(10);

    // Mock aggregate to fail
    mockAggregate.mockRejectedValue(new Error('Aggregate query failed'));

    // Act
    const response = await GET(mockRequest);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(500);
    expect(data).toEqual({
      success: false,
      error: 'Aggregate query failed',
    });
  });

  describe('Edge Cases', () => {
    it('should handle all receptionists unavailable', async () => {
      // Arrange
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'user-123',
          name: 'Admin User',
          email: 'admin@example.com',
          role: 'ADMIN',
        },
      });

      // Mock: active = 10, available = 0
      mockCountDocuments
        .mockResolvedValueOnce(10) // total
        .mockResolvedValueOnce(10) // active
        .mockResolvedValueOnce(0) // onLeave
        .mockResolvedValueOnce(0) // suspended
        .mockResolvedValueOnce(0) // terminated
        .mockResolvedValueOnce(4) // morning shift
        .mockResolvedValueOnce(3) // evening shift
        .mockResolvedValueOnce(2) // night shift
        .mockResolvedValueOnce(1) // full day shift
        .mockResolvedValueOnce(0); // available receptionists (none)

      mockAggregate.mockResolvedValue([]);

      // Act
      const response = await GET(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.data.available).toBe(0);
      expect(data.data.unavailable).toBe(10); // active - available = 10 - 0 = 10
    });

    it('should handle all receptionists available', async () => {
      // Arrange
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'user-123',
          name: 'Admin User',
          email: 'admin@example.com',
          role: 'ADMIN',
        },
      });

      // Mock: active = 10, available = 10
      mockCountDocuments
        .mockResolvedValueOnce(10) // total
        .mockResolvedValueOnce(10) // active
        .mockResolvedValueOnce(0) // onLeave
        .mockResolvedValueOnce(0) // suspended
        .mockResolvedValueOnce(0) // terminated
        .mockResolvedValueOnce(4) // morning shift
        .mockResolvedValueOnce(3) // evening shift
        .mockResolvedValueOnce(2) // night shift
        .mockResolvedValueOnce(1) // full day shift
        .mockResolvedValueOnce(10); // all available

      mockAggregate.mockResolvedValue([]);

      // Act
      const response = await GET(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.data.available).toBe(10);
      expect(data.data.unavailable).toBe(0); // active - available = 10 - 10 = 0
    });

    it('should handle departments with special characters', async () => {
      // Arrange
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'user-123',
          name: 'Admin User',
          email: 'admin@example.com',
          role: 'ADMIN',
        },
      });

      // Mock countDocuments
      mockCountDocuments.mockResolvedValue(10);

      // Mock department results with special characters
      const mockDepartmentResults = [
        { _id: 'Cardio-Vascular', count: 5 },
        { _id: "Women's Health", count: 3 },
        { _id: 'Emergency & Trauma', count: 2 },
      ];

      mockAggregate
        .mockResolvedValueOnce(mockDepartmentResults)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      // Act
      const response = await GET(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.data.byDepartment).toEqual({
        'Cardio-Vascular': 5,
        "Women's Health": 3,
        'Emergency & Trauma': 2,
      });
    });

    it('should handle large numbers correctly', async () => {
      // Arrange
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'user-123',
          name: 'Admin User',
          email: 'admin@example.com',
          role: 'ADMIN',
        },
      });

      // Mock large counts
      mockCountDocuments
        .mockResolvedValueOnce(1000) // total
        .mockResolvedValueOnce(850) // active
        .mockResolvedValueOnce(50) // onLeave
        .mockResolvedValueOnce(25) // suspended
        .mockResolvedValueOnce(75) // terminated
        .mockResolvedValueOnce(300) // morning shift
        .mockResolvedValueOnce(250) // evening shift
        .mockResolvedValueOnce(200) // night shift
        .mockResolvedValueOnce(100) // full day shift
        .mockResolvedValueOnce(600); // available receptionists

      // Mock department results
      const mockDepartmentResults = [
        { _id: 'Cardiology', count: 200 },
        { _id: 'Neurology', count: 150 },
        { _id: 'Pediatrics', count: 100 },
      ];

      // Mock appointments results with large number
      const mockAppointmentsResults = [{ _id: null, total: 2500 }];

      mockAggregate
        .mockResolvedValueOnce(mockDepartmentResults)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce(mockAppointmentsResults);

      // Act
      const response = await GET(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.data.total).toBe(1000);
      expect(data.data.active).toBe(850);
      expect(data.data.available).toBe(600);
      expect(data.data.unavailable).toBe(250); // 850 - 600 = 250
      expect(data.data.totalAppointmentsToday).toBe(2500);
    });

    it('should handle zero performance data', async () => {
      // Arrange
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'user-123',
          name: 'Admin User',
          email: 'admin@example.com',
          role: 'ADMIN',
        },
      });

      mockCountDocuments.mockResolvedValue(10);

      // Mock performance results with zero average
      const mockPerformanceResults = [{ _id: null, avgPerformance: 0 }];

      mockAggregate
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce(mockPerformanceResults)
        .mockResolvedValueOnce([]);

      // Act
      const response = await GET(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.data.averagePerformance).toBe(0);
    });

    it('should handle negative numbers in calculations', async () => {
      // This is an edge case test - should not happen in real scenario
      // Arrange
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'user-123',
          name: 'Admin User',
          email: 'admin@example.com',
          role: 'ADMIN',
        },
      });

      // Mock: active = 5, available = 10 (impossible in real scenario but testing edge case)
      mockCountDocuments
        .mockResolvedValueOnce(10) // total
        .mockResolvedValueOnce(5) // active (smaller than available!)
        .mockResolvedValueOnce(2) // onLeave
        .mockResolvedValueOnce(1) // suspended
        .mockResolvedValueOnce(2) // terminated
        .mockResolvedValueOnce(2) // morning shift
        .mockResolvedValueOnce(1) // evening shift
        .mockResolvedValueOnce(1) // night shift
        .mockResolvedValueOnce(1) // full day shift
        .mockResolvedValueOnce(10); // available (more than active!)

      mockAggregate.mockResolvedValue([]);

      // Act
      const response = await GET(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.data.unavailable).toBe(-5); // active - available = 5 - 10 = -5
      // This shows a potential issue if data is inconsistent
    });
  });

  describe('Session Edge Cases', () => {
    it('should work with minimal session data', async () => {
      // Arrange
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'user-123',
          // No other properties
        },
      });

      mockCountDocuments.mockResolvedValue(0);
      mockAggregate.mockResolvedValue([]);

      // Act
      const response = await GET(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should work with full session data', async () => {
      // Arrange
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'user-123',
          name: 'Admin User',
          email: 'admin@example.com',
          role: 'ADMIN',
          image: 'https://example.com/avatar.jpg',
          customField: 'customValue',
        },
        expires: '2024-12-31T23:59:59.999Z',
      } as any);

      mockCountDocuments.mockResolvedValue(0);
      mockAggregate.mockResolvedValue([]);

      // Act
      const response = await GET(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });
});

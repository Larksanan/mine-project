import { GET } from '../route';
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import Receptionist from '@/models/Receptionist';

// Mock dependencies
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('@/lib/mongodb', () => ({
  connectDB: jest.fn(),
}));

jest.mock('@/models/Receptionist', () => ({
  find: jest.fn(),
}));

jest.mock('@/app/api/auth/[...nextauth]/option', () => ({
  authOptions: {},
}));

describe('GET /api/receptionists/stats', () => {
  let mockRequest: NextRequest;

  beforeEach(() => {
    mockRequest = new NextRequest(
      'http://localhost:3000/api/receptionists/stats'
    );
    jest.clearAllMocks();
  });

  it('should return 401 when user is not authenticated', async () => {
    // Mock no session
    (getServerSession as jest.Mock).mockResolvedValue(null);

    const response = await GET(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return receptionist statistics when authenticated', async () => {
    // Mock authenticated session
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: '123', email: 'jebarsanthatcroos@gmail.com' },
    });

    // Mock database connection
    (connectDB as jest.Mock).mockResolvedValue(undefined);

    // Mock receptionist data
    const mockReceptionists = [
      {
        department: 'Front Desk',
        employmentStatus: 'ACTIVE',
        isAvailable: true,
        shift: 'MORNING',
        currentAppointmentsCount: 5,
        getPerformanceRating: () => 85,
        user: { name: 'Jebarsan Thatcroos' },
      },
      {
        department: 'Emergency',
        employmentStatus: 'ACTIVE',
        isAvailable: false,
        shift: 'EVENING',
        currentAppointmentsCount: 3,
        getPerformanceRating: () => 90,
        user: { name: 'Sovika sovika' },
      },
      {
        department: 'Front Desk',
        employmentStatus: 'ON_LEAVE',
        isAvailable: false,
        shift: 'NIGHT',
        currentAppointmentsCount: 2,
        getPerformanceRating: () => 75,
        user: { name: 'Sathuska Sath' },
      },
    ];

    (Receptionist.find as jest.Mock).mockReturnValue({
      populate: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockReceptionists),
      }),
    });

    const response = await GET(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toEqual({
      total: 3,
      active: 2,
      onLeave: 1,
      suspended: 0,
      terminated: 0,
      available: 1,
      unavailable: 2,
      byShift: {
        MORNING: 1,
        EVENING: 1,
        NIGHT: 1,
        FULL_DAY: 0,
      },
      byDepartment: {
        'Front Desk': 2,
        Emergency: 1,
      },
      averagePerformance: (85 + 90 + 75) / 3,
      totalAppointmentsToday: 10, // 5 + 3 + 2
    });
  });

  it('should handle database errors gracefully', async () => {
    // Mock console.error to suppress logs
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    // Mock authenticated session
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: '123', email: 'jebarsanthatcroos@gmail.com' },
    });

    // Mock database connection error
    (connectDB as jest.Mock).mockRejectedValue(
      new Error('Database connection failed')
    );

    const response = await GET(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Database connection failed');

    consoleSpy.mockRestore();
  });

  it('should handle empty receptionist list', async () => {
    // Mock authenticated session
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: '123', email: 'jebarsanthatcroos@gmail.com' },
    });

    // Mock database connection
    (connectDB as jest.Mock).mockResolvedValue(undefined);

    // Mock empty receptionist data
    (Receptionist.find as jest.Mock).mockReturnValue({
      populate: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([]),
      }),
    });

    const response = await GET(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toEqual({
      total: 0,
      active: 0,
      onLeave: 0,
      suspended: 0,
      terminated: 0,
      available: 0,
      unavailable: 0,
      byShift: {
        MORNING: 0,
        EVENING: 0,
        NIGHT: 0,
        FULL_DAY: 0,
      },
      byDepartment: {},
      averagePerformance: 0,
      totalAppointmentsToday: 0,
    });
  });
});

/**
 * @jest-environment node
 */
import { GET } from './route';
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import User from '@/models/User';
import Doctor from '@/models/Doctor';

// Mock dependencies
jest.mock('next-auth');
jest.mock('@/lib/mongodb', () => ({
  connectDB: jest.fn(),
}));
jest.mock('@/models/User');
jest.mock('@/models/Doctor');
jest.mock('@/app/api/auth/[...nextauth]/route', () => ({
  authOptions: {},
}));

describe('GET /api/patients/docter', () => {
  let mockDoctorQuery: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockDoctorQuery = {
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([
        {
          _id: 'doc123',
          user: {
            name: 'Dr. jebarsanthatcroos',
            email: 'jebarsanthatcroos@test.com',
            image: '/doctor.jpg',
            phone: '1234567890',
          },
          profile: {
            specialization: 'Cardiology',
            department: 'Heart',
            experience: 10,
            consultationFee: 2000,
            isVerified: true,
          },
          createdAt: new Date().toISOString(),
        },
      ]),
    };

    (Doctor.find as jest.Mock).mockReturnValue(mockDoctorQuery);
    (Doctor.countDocuments as jest.Mock).mockResolvedValue(1);

    // Mock aggregate for statistics
    (Doctor.aggregate as jest.Mock).mockResolvedValue([
      {
        totalCount: 1,
        verifiedCount: 1,
        avgConsultationFee: 2000,
        avgExperience: 10,
      },
    ]);
  });

  it('should return 401 if user is not authenticated', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);

    const req = new NextRequest('http://localhost/api/patients/docter');
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.message).toBe('Unauthorized');
  });

  it('should return 403 if user role is not allowed', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { email: 'unauthorized@test.com' },
    });
    (User.findOne as jest.Mock).mockResolvedValue({
      email: 'unauthorized@test.com',
      role: 'UNKNOWN_ROLE',
    });

    const req = new NextRequest('http://localhost/api/patients/docter');
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data.message).toContain('Insufficient permissions');
  });

  it('should return doctors list with populated user data when authorized', async () => {
    // Mock authorized user (e.g., PATIENT)
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { email: 'patient@test.com' },
    });
    (User.findOne as jest.Mock).mockResolvedValue({
      email: 'patient@test.com',
      role: 'PATIENT',
    });

    const req = new NextRequest(
      'http://localhost/api/patients/docter?page=1&limit=10'
    );
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);

    // Verify populate was called correctly (this ensures your fix is working)
    expect(mockDoctorQuery.populate).toHaveBeenCalledWith(
      'user',
      'name email phone image'
    );

    // Verify data structure
    expect(data.data).toHaveLength(1);
    expect(data.data[0].user.name).toBe('Dr. jebarsanthatcroos');
    expect(data.pagination).toBeDefined();
    expect(data.statistics).toBeDefined();
  });

  it('should apply search filters correctly', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { email: 'patient@test.com' },
    });
    (User.findOne as jest.Mock).mockResolvedValue({
      email: 'patient@test.com',
      role: 'PATIENT',
    });

    const req = new NextRequest(
      'http://localhost/api/patients/docter?search=Cardio&specialization=Cardiology'
    );
    await GET(req);

    const findCall = (Doctor.find as jest.Mock).mock.calls[0][0];
    expect(findCall.$or).toBeDefined(); // Search filter
    expect(findCall.specialization).toBe('Cardiology');
  });
});

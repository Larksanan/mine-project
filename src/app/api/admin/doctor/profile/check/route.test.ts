/**
 * @jest-environment node
 */
import { GET } from './route';
import { getServerSession } from 'next-auth';
import Doctor from '@/models/Doctor';

// Mock dependencies
jest.mock('next-auth');
jest.mock('@/lib/mongodb', () => ({
  connectDB: jest.fn(),
}));
jest.mock('@/app/api/auth/[...nextauth]/route', () => ({
  authOptions: {},
}));

jest.mock('@/models/Doctor');

// Mock NextResponse
jest.mock('next/server', () => {
  const actual = jest.requireActual('next/server');
  return {
    ...actual,
    NextResponse: {
      json: jest.fn((body, init) => ({
        json: async () => body,
        status: init?.status || 200,
        ...init,
      })),
    },
  };
});

describe('Doctor Profile Check API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 if unauthorized', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);
    const response = await GET();
    expect(response.status).toBe(401);
  });

  it('should return 400 if user is not a doctor', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: 'user123', role: 'PATIENT' },
    });
    const response = await GET();
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.message).toBe('User is not a doctor');
  });

  it('should return existing profile if found', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: 'user123', role: 'DOCTOR' },
    });

    const mockDoctor = {
      _id: 'doc123',
      profile: { specialization: 'Cardiology', department: 'Cardio' },
    };
    (Doctor.findOne as jest.Mock).mockResolvedValue(mockDoctor);

    const response = await GET();
    const body = await response.json();

    expect(body.success).toBe(true);
    expect(body.hasProfile).toBe(true);
    expect(body.doctor._id).toBe('doc123');
    expect(body.message).toBe('Doctor profile exists');
  });

  it('should create new profile if not found', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: 'user123', role: 'DOCTOR', name: 'John Doe' },
    });

    (Doctor.findOne as jest.Mock).mockResolvedValue(null);

    const mockNewDoctor = {
      _id: 'newDoc123',
      profile: {
        specialization: 'General Physician',
        department: 'General Medicine',
      },
    };
    (Doctor.create as jest.Mock).mockResolvedValue(mockNewDoctor);

    const response = await GET();
    const body = await response.json();

    expect(body.success).toBe(true);
    expect(body.created).toBe(true);
    expect(body.doctor._id).toBe('newDoc123');
    expect(Doctor.create).toHaveBeenCalledWith(
      expect.objectContaining({
        user: 'user123',
        profile: expect.objectContaining({
          bio: expect.stringContaining('Dr. John Doe'),
        }),
      })
    );
  });

  it('should handle errors gracefully', async () => {
    // Mock an error (e.g. DB connection failure)
    (getServerSession as jest.Mock).mockRejectedValue(
      new Error('Database error')
    );

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.message).toBe('Failed to check/create doctor profile');
  });
});

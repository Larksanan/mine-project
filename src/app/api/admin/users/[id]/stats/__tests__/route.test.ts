/**
 * @jest-environment node
 */
import { GET } from '../route';
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import Doctor from '@/models/Doctor';
import Patient from '@/models/Patient';
import Receptionist from '@/models/Receptionist';
import Appointment from '@/models/Appointment';

// Mock dependencies
jest.mock('next-auth');
jest.mock('@/lib/mongodb');
jest.mock('@/models/User');
jest.mock('@/models/Doctor');
jest.mock('@/models/Patient');
jest.mock('@/models/Receptionist');
jest.mock('@/models/Appointment');

// Mock mongoose
jest.mock('mongoose', () => {
  const actual = jest.requireActual('mongoose');
  return {
    ...actual,
    isValidObjectId: jest.fn((id: string) => /^[0-9a-fA-F]{24}$/.test(id)),
  };
});

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

describe('User Statistics API', () => {
  const validId = '507f1f77bcf86cd799439011';
  const mockAdminUser = {
    _id: validId,
    name: 'Jebarsan Thatcroos',
    email: 'jebarsanthatcroos@gmail.com',
    role: 'ADMIN',
    status: 'ACTIVE',
    isEmailVerified: true,
  };

  const mockSession = {
    user: {
      email: 'jebarsanthatcroos@gmail.com',
      name: 'Jebarsan Thatcroos',
    },
  };

  const mockDoctorUser = {
    _id: '507f1f77bcf86cd799439012',
    name: 'Dr. sovika sovika',
    email: 'sovika@gmail.com',
    role: 'DOCTOR',
    status: 'ACTIVE',
    createdAt: new Date('2026-01-01'),
    lastLogin: new Date('2026-01-15'),
    isEmailVerified: true,
  };

  const mockPatientUser = {
    _id: '507f1f77bcf86cd799439013',
    name: ' T Larksanan',
    email: 'Larksanan@gmail.com',
    role: 'PATIENT',
    status: 'ACTIVE',
    createdAt: new Date('2026-01-01'),
    lastLogin: new Date('2026-01-10'),
    isEmailVerified: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (connectDB as jest.Mock).mockResolvedValue(undefined);
    (getServerSession as jest.Mock).mockResolvedValue(mockSession);
    (User.findOne as jest.Mock).mockResolvedValue(mockAdminUser);
  });

  describe('GET', () => {
    it('should return 401 if not authenticated', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const req = new NextRequest(
        'http://localhost:3000/api/admin/users/stats/123'
      );
      const context = { params: Promise.resolve({ id: validId }) };
      const response = await GET(req, context);
      const body = await response.json();

      expect(response.status).toBe(401);
      expect(body.message).toBe('Unauthorized');
    });

    it('should return 404 if authenticated user not found', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);

      const req = new NextRequest(
        'http://localhost:3000/api/admin/users/stats/123'
      );
      const context = { params: Promise.resolve({ id: validId }) };
      const response = await GET(req, context);
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.message).toBe('User not found');
    });

    it('should return 403 if user is not admin', async () => {
      (User.findOne as jest.Mock).mockResolvedValue({
        ...mockAdminUser,
        role: 'DOCTOR',
      });

      const req = new NextRequest(
        'http://localhost:3000/api/admin/users/stats/123'
      );
      const context = { params: Promise.resolve({ id: validId }) };
      const response = await GET(req, context);
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.message).toBe('Forbidden - Admin access required');
    });

    it('should return 400 for invalid user ID', async () => {
      const req = new NextRequest(
        'http://localhost:3000/api/admin/users/stats/invalid'
      );
      const context = { params: Promise.resolve({ id: 'invalid-id' }) };
      const response = await GET(req, context);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.message).toBe('Invalid user id');
    });

    it('should return 404 if target user not found', async () => {
      const mockFindByIdChain = {
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(null),
      };
      (User.findById as jest.Mock).mockReturnValue(mockFindByIdChain);

      const req = new NextRequest(
        'http://localhost:3000/api/admin/users/stats/123'
      );
      const context = { params: Promise.resolve({ id: validId }) };
      const response = await GET(req, context);
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.message).toBe('User not found');
    });

    it('should return doctor statistics', async () => {
      const mockFindByIdChain = {
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockDoctorUser),
      };
      (User.findById as jest.Mock).mockReturnValue(mockFindByIdChain);

      const mockDoctorProfile = {
        _id: '507f1f77bcf86cd799439020',
        user: mockDoctorUser._id,
        profile: {
          specialization: 'Cardiology',
          department: 'Internal Medicine',
          experience: 10,
          consultationFee: 5000,
          isVerified: true,
          rating: {
            average: 4.5,
            count: 100,
          },
        },
        patients: ['patient1', 'patient2'],
      };

      (Doctor.findOne as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockDoctorProfile),
      });

      (Appointment.countDocuments as jest.Mock)
        .mockResolvedValueOnce(50) // total
        .mockResolvedValueOnce(40) // completed
        .mockResolvedValueOnce(5) // cancelled
        .mockResolvedValueOnce(10); // upcoming

      (Appointment.distinct as jest.Mock).mockResolvedValue(['p1', 'p2', 'p3']);

      (Appointment.aggregate as jest.Mock)
        .mockResolvedValueOnce([
          { _id: { year: 2024, month: 1 }, count: 10 },
          { _id: { year: 2024, month: 2 }, count: 15 },
        ])
        .mockResolvedValueOnce([
          { _id: 'COMPLETED', count: 40 },
          { _id: 'SCHEDULED', count: 10 },
        ]);

      (Appointment.find as jest.Mock)
        .mockReturnValueOnce({
          select: jest.fn().mockReturnThis(),
          lean: jest
            .fn()
            .mockResolvedValue([{ duration: 30 }, { duration: 45 }]),
        })
        .mockReturnValueOnce({
          populate: jest.fn().mockReturnThis(),
          sort: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          lean: jest.fn().mockResolvedValue([
            {
              _id: 'appt1',
              appointmentDate: new Date(),
              status: 'SCHEDULED',
              type: 'CONSULTATION',
              patient: { firstName: 'T', lastName: 'Larksanan' },
            },
          ]),
        });

      const req = new NextRequest(
        'http://localhost:3000/api/admin/users/stats/123'
      );
      const context = {
        params: Promise.resolve({ id: '507f1f77bcf86cd799439012' }),
      };
      const response = await GET(req, context);
      const body = await response.json();

      expect(body.success).toBe(true);
      expect(body.data.profileType).toBe('DOCTOR');
      expect(body.data.specialization).toBe('Cardiology');
      expect(body.data.appointments.total).toBe(50);
      expect(body.data.appointments.completed).toBe(40);
      expect(body.data.patients.unique).toBe(3);
      expect(body.data.rating.average).toBe(4.5);
    });

    it('should return patient statistics', async () => {
      const mockFindByIdChain = {
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockPatientUser),
      };
      (User.findById as jest.Mock).mockReturnValue(mockFindByIdChain);

      const mockPatientProfile = {
        _id: '507f1f77bcf86cd799439021',
        user: mockPatientUser._id,
        dateOfBirth: new Date('2000-01-15'),
        gender: 'FEMALE',
        bloodType: 'O+',
        maritalStatus: 'SINGLE',
        occupation: 'Engineer',
        phone: '1234567890',
        address: { street: 'No23 thalaimannar', city: 'mnanar' },
        emergencyContact: { name: 'jebarsanthatcroos', phone: '0762397951' },
        allergies: ['Penicillin', 'Peanuts'],
        medicalHistory: {
          chronicConditions: ['Asthma'],
          currentMedications: ['Inhaler'],
        },
        lastVisit: new Date('2026-01-10'),
        isActive: true,
      };

      (Patient.findOne as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockPatientProfile),
      });

      (Appointment.countDocuments as jest.Mock)
        .mockResolvedValueOnce(20) // total
        .mockResolvedValueOnce(15) // completed
        .mockResolvedValueOnce(3); // upcoming

      (Appointment.distinct as jest.Mock).mockResolvedValue(['d1', 'd2']);

      (Appointment.find as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([
          {
            _id: 'appt1',
            appointmentDate: new Date(),
            status: 'COMPLETED',
            type: 'CHECKUP',
            doctor: { name: 'Dr. Smith' },
          },
        ]),
      });

      const req = new NextRequest(
        'http://localhost:3000/api/admin/users/stats/123'
      );
      const context = {
        params: Promise.resolve({ id: '507f1f77bcf86cd799439013' }),
      };
      const response = await GET(req, context);
      const body = await response.json();

      expect(body.success).toBe(true);
      expect(body.data.profileType).toBe('PATIENT');
      expect(body.data.personalInfo.gender).toBe('FEMALE');
      expect(body.data.personalInfo.bloodType).toBe('O+');
      expect(body.data.medical.allergies).toContain('Penicillin');
      expect(body.data.appointments.total).toBe(20);
      expect(body.data.engagement.doctorsVisited).toBe(2);
    });

    it('should calculate patient age correctly', async () => {
      const mockFindByIdChain = {
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockPatientUser),
      };
      (User.findById as jest.Mock).mockReturnValue(mockFindByIdChain);

      const mockPatientProfile = {
        _id: '507f1f77bcf86cd799439021',
        user: mockPatientUser._id,
        dateOfBirth: new Date('2000-01-15'),
        isActive: true,
      };

      (Patient.findOne as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockPatientProfile),
      });

      (Appointment.countDocuments as jest.Mock).mockResolvedValue(0);
      (Appointment.distinct as jest.Mock).mockResolvedValue([]);
      (Appointment.find as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      });

      const req = new NextRequest(
        'http://localhost:3000/api/admin/users/stats/123'
      );
      const context = {
        params: Promise.resolve({ id: '507f1f77bcf86cd799439013' }),
      };
      const response = await GET(req, context);
      const body = await response.json();

      expect(body.data.personalInfo.age).toBeDefined();
      expect(typeof body.data.personalInfo.age).toBe('number');
    });

    it('should return receptionist statistics', async () => {
      const receptionistUser = { ...mockPatientUser, role: 'RECEPTIONIST' };

      const mockFindByIdChain = {
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(receptionistUser),
      };
      (User.findById as jest.Mock).mockReturnValue(mockFindByIdChain);

      const mockReceptionistProfile = {
        employeeId: 'EMP001',
        department: 'Front Desk',
        shift: 'Morning',
        employmentStatus: 'ACTIVE',
        hireDate: new Date('2026-01-01'),
        salary: 50000,
        currentAppointmentsCount: 25,
        maxAppointmentsPerDay: 50,
        performanceMetrics: { efficiency: 95 },
        schedule: {
          workingHours: { start: '08:00', end: '16:00' },
          availableDays: ['Monday', 'Tuesday', 'Wednesday'],
        },
      };

      (Receptionist.findOne as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockReceptionistProfile),
      });

      const req = new NextRequest(
        'http://localhost:3000/api/admin/users/stats/123'
      );
      const context = {
        params: Promise.resolve({ id: '507f1f77bcf86cd799439013' }),
      };
      const response = await GET(req, context);
      const body = await response.json();

      expect(body.success).toBe(true);
      expect(body.data.profileType).toBe('RECEPTIONIST');
      expect(body.data.employmentInfo.employeeId).toBe('EMP001');
      expect(body.data.performance.currentAppointments).toBe(25);
      expect(body.data.schedule.availableDays).toContain('Monday');
    });

    it('should return admin statistics', async () => {
      const mockFindByIdChain = {
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockAdminUser),
      };
      (User.findById as jest.Mock).mockReturnValue(mockFindByIdChain);

      (User.countDocuments as jest.Mock).mockResolvedValue(10);

      const mockFindChain = {
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([
          {
            name: 'User 1',
            email: 'user1@example.com',
            role: 'DOCTOR',
            createdAt: new Date(),
          },
        ]),
      };
      (User.find as jest.Mock).mockReturnValue(mockFindChain);

      const req = new NextRequest(
        'http://localhost:3000/api/admin/users/stats/123'
      );
      const context = { params: Promise.resolve({ id: validId }) };
      const response = await GET(req, context);
      const body = await response.json();

      expect(body.success).toBe(true);
      expect(body.data.profileType).toBe('ADMIN');
      expect(body.data.adminActivity.usersCreated).toBe(10);
      expect(body.data.adminActivity.recentActions).toBeDefined();
    });

    it('should handle date range filters', async () => {
      const mockFindByIdChain = {
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockDoctorUser),
      };
      (User.findById as jest.Mock).mockReturnValue(mockFindByIdChain);

      (Doctor.findOne as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue({
          _id: '507f1f77bcf86cd799439020',
          profile: {},
          patients: [],
        }),
      });

      (Appointment.countDocuments as jest.Mock).mockResolvedValue(0);
      (Appointment.distinct as jest.Mock).mockResolvedValue([]);
      (Appointment.aggregate as jest.Mock).mockResolvedValue([]);
      (Appointment.find as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      });

      const req = new NextRequest(
        'http://localhost:3000/api/admin/users/stats/123?startDate=2025-01-01&endDate=2026-12-31'
      );
      const context = {
        params: Promise.resolve({ id: '507f1f77bcf86cd799439012' }),
      };
      const response = await GET(req, context);
      const body = await response.json();

      expect(body.metadata.dateRange.startDate).toBe('2025-01-01');
      expect(body.metadata.dateRange.endDate).toBe('2026-12-31');
    });

    it('should include activity timeline', async () => {
      const mockFindByIdChain = {
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockDoctorUser),
      };
      (User.findById as jest.Mock).mockReturnValue(mockFindByIdChain);

      (Doctor.findOne as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      });

      const req = new NextRequest(
        'http://localhost:3000/api/admin/users/stats/123'
      );
      const context = {
        params: Promise.resolve({ id: '507f1f77bcf86cd799439012' }),
      };
      const response = await GET(req, context);
      const body = await response.json();

      expect(body.data.activityTimeline).toBeDefined();
      expect(Array.isArray(body.data.activityTimeline)).toBe(true);
      expect(body.data.activityTimeline.length).toBeGreaterThan(0);
    });

    it('should handle users with unknown roles', async () => {
      const unknownRoleUser = { ...mockPatientUser, role: 'UNKNOWN_ROLE' };

      const mockFindByIdChain = {
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(unknownRoleUser),
      };
      (User.findById as jest.Mock).mockReturnValue(mockFindByIdChain);

      const req = new NextRequest(
        'http://localhost:3000/api/admin/users/stats/123'
      );
      const context = {
        params: Promise.resolve({ id: '507f1f77bcf86cd799439013' }),
      };
      const response = await GET(req, context);
      const body = await response.json();

      expect(body.success).toBe(true);
      expect(body.data.profileType).toBe('UNKNOWN_ROLE');
      expect(body.data.message).toContain('No specific statistics available');
    });

    it('should handle doctor without profile', async () => {
      const mockFindByIdChain = {
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockDoctorUser),
      };
      (User.findById as jest.Mock).mockReturnValue(mockFindByIdChain);

      (Doctor.findOne as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      });

      const req = new NextRequest(
        'http://localhost:3000/api/admin/users/stats/123'
      );
      const context = {
        params: Promise.resolve({ id: '507f1f77bcf86cd799439012' }),
      };
      const response = await GET(req, context);
      const body = await response.json();

      expect(body.success).toBe(true);
      expect(body.data.profileType).toBe('DOCTOR');
    });

    it('should handle patient without profile', async () => {
      const mockFindByIdChain = {
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockPatientUser),
      };
      (User.findById as jest.Mock).mockReturnValue(mockFindByIdChain);

      (Patient.findOne as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      });

      const req = new NextRequest(
        'http://localhost:3000/api/admin/users/stats/123'
      );
      const context = {
        params: Promise.resolve({ id: '507f1f77bcf86cd799439013' }),
      };
      const response = await GET(req, context);
      const body = await response.json();

      expect(body.success).toBe(true);
      expect(body.data.profileType).toBe('PATIENT');
    });

    it('should handle database errors', async () => {
      (connectDB as jest.Mock).mockRejectedValue(new Error('Database error'));

      const req = new NextRequest(
        'http://localhost:3000/api/admin/users/stats/123'
      );
      const context = { params: Promise.resolve({ id: validId }) };
      const response = await GET(req, context);
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.success).toBe(false);
      expect(body.message).toBe('Failed to fetch user statistics');
    });
  });
});

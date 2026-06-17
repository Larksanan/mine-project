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

describe('User Statistics Overview API', () => {
  const mockAdminUser = {
    _id: '507f1f77bcf86cd799439011',
    name: 'Admin User',
    email: 'admin@example.com',
    role: 'ADMIN',
    status: 'ACTIVE',
    isEmailVerified: true,
  };

  const mockSession = {
    user: {
      email: 'admin@example.com',
      name: 'Admin User',
    },
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
        'http://localhost:3000/api/admin/users/statistics'
      );
      const response = await GET(req);
      const body = await response.json();

      expect(response.status).toBe(401);
      expect(body.message).toBe('Unauthorized');
    });

    it('should return 404 if authenticated user not found', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);

      const req = new NextRequest(
        'http://localhost:3000/api/admin/users/statistics'
      );
      const response = await GET(req);
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
        'http://localhost:3000/api/admin/users/statistics'
      );
      const response = await GET(req);
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.message).toBe('Forbidden - Admin access required');
    });

    it('should return comprehensive user statistics', async () => {
      // Mock User counts
      (User.countDocuments as jest.Mock)
        .mockResolvedValueOnce(100) // totalUsers
        .mockResolvedValueOnce(80) // activeUsers
        .mockResolvedValueOnce(15) // inactiveUsers
        .mockResolvedValueOnce(5) // suspendedUsers
        .mockResolvedValueOnce(70) // verifiedUsers
        .mockResolvedValueOnce(30) // unverifiedUsers
        .mockResolvedValueOnce(10) // registrationsLast7Days
        .mockResolvedValueOnce(25) // registrationsLast30Days
        .mockResolvedValueOnce(3) // registrationsToday
        .mockResolvedValueOnce(40) // usersWithRecentLogin
        .mockResolvedValueOnce(20); // usersNeverLoggedIn

      // Mock role distribution
      (User.aggregate as jest.Mock).mockResolvedValueOnce([
        { _id: 'ADMIN', count: 5 },
        { _id: 'DOCTOR', count: 30 },
        { _id: 'PATIENT', count: 50 },
        { _id: 'RECEPTIONIST', count: 15 },
      ]);

      // Mock status distribution
      (User.aggregate as jest.Mock).mockResolvedValueOnce([
        { _id: 'ACTIVE', count: 80 },
        { _id: 'INACTIVE', count: 15 },
        { _id: 'SUSPENDED', count: 5 },
      ]);

      // Mock user growth
      (User.aggregate as jest.Mock).mockResolvedValueOnce([
        { _id: { year: 2024, month: 1 }, count: 10 },
        { _id: { year: 2024, month: 2 }, count: 15 },
      ]);

      // Mock recent users
      (User.find as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([
          {
            _id: '1',
            name: 'User 1',
            email: 'user1@example.com',
            role: 'PATIENT',
            createdAt: new Date(),
          },
        ]),
      });

      // Mock Doctor stats
      (Doctor.countDocuments as jest.Mock)
        .mockResolvedValueOnce(30) // totalDoctors
        .mockResolvedValueOnce(25); // verifiedDoctors

      (Doctor.aggregate as jest.Mock).mockResolvedValueOnce([
        { _id: 'Cardiology', count: 10 },
        { _id: 'Neurology', count: 8 },
      ]);

      const mockTopDoctors = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([
          {
            _id: 'doc1',
            user: { name: 'Dr. Smith', email: 'smith@example.com' },
            profile: { specialization: 'Cardiology', rating: { average: 4.8 } },
          },
        ]),
      };
      (Doctor.find as jest.Mock).mockReturnValue(mockTopDoctors);

      // Mock Patient stats
      (Patient.countDocuments as jest.Mock)
        .mockResolvedValueOnce(50) // totalPatients
        .mockResolvedValueOnce(45); // activePatients

      (Patient.aggregate as jest.Mock)
        .mockResolvedValueOnce([
          { _id: 'MALE', count: 25 },
          { _id: 'FEMALE', count: 25 },
        ])
        .mockResolvedValueOnce([
          { _id: 'O+', count: 20 },
          { _id: 'A+', count: 15 },
        ])
        .mockResolvedValueOnce([
          { _id: 0, count: 5 },
          { _id: 18, count: 20 },
          { _id: 30, count: 15 },
        ]);

      // Mock Receptionist stats
      (Receptionist.countDocuments as jest.Mock)
        .mockResolvedValueOnce(15) // totalReceptionists
        .mockResolvedValueOnce(12); // activeReceptionists

      // Mock Appointment stats
      (Appointment.countDocuments as jest.Mock)
        .mockResolvedValueOnce(200) // totalAppointments
        .mockResolvedValueOnce(150); // completedAppointments

      const req = new NextRequest(
        'http://localhost:3000/api/admin/users/statistics'
      );
      const response = await GET(req);
      const body = await response.json();

      expect(body.success).toBe(true);
      expect(body.data.overview.totalUsers).toBe(100);
      expect(body.data.overview.activeUsers).toBe(80);
      expect(body.data.overview.verifiedUsers).toBe(70);
    });

    it('should return overview statistics', async () => {
      (User.countDocuments as jest.Mock)
        .mockResolvedValueOnce(100)
        .mockResolvedValueOnce(80)
        .mockResolvedValueOnce(15)
        .mockResolvedValueOnce(5)
        .mockResolvedValueOnce(70)
        .mockResolvedValueOnce(30);

      (User.aggregate as jest.Mock).mockResolvedValue([]);
      (Doctor.countDocuments as jest.Mock).mockResolvedValue(0);
      (Doctor.aggregate as jest.Mock).mockResolvedValue([]);
      (Doctor.find as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      });
      (Patient.countDocuments as jest.Mock).mockResolvedValue(0);
      (Patient.aggregate as jest.Mock).mockResolvedValue([]);
      (Receptionist.countDocuments as jest.Mock).mockResolvedValue(0);
      (Appointment.countDocuments as jest.Mock).mockResolvedValue(0);
      (User.find as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      });

      const req = new NextRequest(
        'http://localhost:3000/api/admin/users/statistics'
      );
      const response = await GET(req);
      const body = await response.json();

      expect(body.data.overview).toBeDefined();
      expect(body.data.overview.totalUsers).toBe(100);
      expect(body.data.overview.activeUsers).toBe(80);
      expect(body.data.overview.inactiveUsers).toBe(15);
      expect(body.data.overview.suspendedUsers).toBe(5);
      expect(body.data.overview.verifiedUsers).toBe(70);
      expect(body.data.overview.unverifiedUsers).toBe(30);
      expect(body.data.overview.verificationRate).toBe('70.00%');
    });

    it('should return role distribution statistics', async () => {
      (User.countDocuments as jest.Mock).mockResolvedValue(0);

      (User.aggregate as jest.Mock)
        .mockResolvedValueOnce([
          { _id: 'ADMIN', count: 5 },
          { _id: 'DOCTOR', count: 30 },
          { _id: 'PATIENT', count: 50 },
        ])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      (Doctor.countDocuments as jest.Mock)
        .mockResolvedValue(30)
        .mockResolvedValue(25);
      (Doctor.aggregate as jest.Mock).mockResolvedValue([]);
      (Doctor.find as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      });
      (Patient.countDocuments as jest.Mock)
        .mockResolvedValue(50)
        .mockResolvedValue(45);
      (Patient.aggregate as jest.Mock).mockResolvedValue([]);
      (Receptionist.countDocuments as jest.Mock)
        .mockResolvedValue(10)
        .mockResolvedValue(8);
      (Appointment.countDocuments as jest.Mock).mockResolvedValue(0);
      (User.find as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      });

      const req = new NextRequest(
        'http://localhost:3000/api/admin/users/statistics'
      );
      const response = await GET(req);
      const body = await response.json();

      expect(body.data.roles.distribution).toBeDefined();
      expect(body.data.roles.distribution.ADMIN).toBe(5);
      expect(body.data.roles.distribution.DOCTOR).toBe(30);
      expect(body.data.roles.distribution.PATIENT).toBe(50);
    });

    it('should return status distribution statistics', async () => {
      (User.countDocuments as jest.Mock).mockResolvedValue(0);

      (User.aggregate as jest.Mock)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([
          { _id: 'ACTIVE', count: 80 },
          { _id: 'INACTIVE', count: 15 },
          { _id: 'SUSPENDED', count: 5 },
        ])
        .mockResolvedValueOnce([]);

      (Doctor.countDocuments as jest.Mock).mockResolvedValue(0);
      (Doctor.aggregate as jest.Mock).mockResolvedValue([]);
      (Doctor.find as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      });
      (Patient.countDocuments as jest.Mock).mockResolvedValue(0);
      (Patient.aggregate as jest.Mock).mockResolvedValue([]);
      (Receptionist.countDocuments as jest.Mock).mockResolvedValue(0);
      (Appointment.countDocuments as jest.Mock).mockResolvedValue(0);
      (User.find as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      });

      const req = new NextRequest(
        'http://localhost:3000/api/admin/users/statistics'
      );
      const response = await GET(req);
      const body = await response.json();

      expect(body.data.status.distribution).toBeDefined();
      expect(body.data.status.distribution.ACTIVE).toBe(80);
      expect(body.data.status.distribution.INACTIVE).toBe(15);
      expect(body.data.status.distribution.SUSPENDED).toBe(5);
    });

    it('should return growth statistics', async () => {
      (User.countDocuments as jest.Mock)
        .mockResolvedValue(0)
        .mockResolvedValueOnce(0) // total
        .mockResolvedValueOnce(0) // active
        .mockResolvedValueOnce(0) // inactive
        .mockResolvedValueOnce(0) // suspended
        .mockResolvedValueOnce(0) // verified
        .mockResolvedValueOnce(0) // unverified
        .mockResolvedValueOnce(10) // last7Days
        .mockResolvedValueOnce(25) // last30Days
        .mockResolvedValueOnce(3); // today

      (User.aggregate as jest.Mock)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([
          { _id: { year: 2024, month: 1 }, count: 10 },
          { _id: { year: 2024, month: 2 }, count: 15 },
        ]);

      (Doctor.countDocuments as jest.Mock).mockResolvedValue(0);
      (Doctor.aggregate as jest.Mock).mockResolvedValue([]);
      (Doctor.find as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      });
      (Patient.countDocuments as jest.Mock).mockResolvedValue(0);
      (Patient.aggregate as jest.Mock).mockResolvedValue([]);
      (Receptionist.countDocuments as jest.Mock).mockResolvedValue(0);
      (Appointment.countDocuments as jest.Mock).mockResolvedValue(0);
      (User.find as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      });

      const req = new NextRequest(
        'http://localhost:3000/api/admin/users/statistics'
      );
      const response = await GET(req);
      const body = await response.json();

      expect(body.data.growth).toBeDefined();
      expect(body.data.growth.registrationsToday).toBe(3);
      expect(body.data.growth.registrationsLast7Days).toBe(10);
      expect(body.data.growth.registrationsLast30Days).toBe(25);
      expect(body.data.growth.monthlyGrowth).toHaveLength(2);
    });

    it('should return engagement metrics', async () => {
      (User.countDocuments as jest.Mock)
        .mockResolvedValue(0)
        .mockResolvedValueOnce(100) // total
        .mockResolvedValueOnce(0) // active
        .mockResolvedValueOnce(0) // inactive
        .mockResolvedValueOnce(0) // suspended
        .mockResolvedValueOnce(0) // verified
        .mockResolvedValueOnce(0) // unverified
        .mockResolvedValueOnce(0) // last7Days
        .mockResolvedValueOnce(0) // last30Days
        .mockResolvedValueOnce(0) // today
        .mockResolvedValueOnce(40) // usersWithRecentLogin
        .mockResolvedValueOnce(20); // usersNeverLoggedIn

      (User.aggregate as jest.Mock).mockResolvedValue([]);
      (Doctor.countDocuments as jest.Mock).mockResolvedValue(0);
      (Doctor.aggregate as jest.Mock).mockResolvedValue([]);
      (Doctor.find as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      });
      (Patient.countDocuments as jest.Mock).mockResolvedValue(0);
      (Patient.aggregate as jest.Mock).mockResolvedValue([]);
      (Receptionist.countDocuments as jest.Mock).mockResolvedValue(0);
      (Appointment.countDocuments as jest.Mock).mockResolvedValue(0);
      (User.find as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      });

      const req = new NextRequest(
        'http://localhost:3000/api/admin/users/statistics'
      );
      const response = await GET(req);
      const body = await response.json();

      expect(body.data.engagement).toBeDefined();
      expect(body.data.engagement.usersNeverLoggedIn).toBe(20);
      expect(body.data.engagement.loginRate).toBe('40.00%');
    });

    it('should return demographics statistics', async () => {
      (User.countDocuments as jest.Mock).mockResolvedValue(0);
      (User.aggregate as jest.Mock).mockResolvedValue([]);

      (Doctor.countDocuments as jest.Mock).mockResolvedValue(0);
      (Doctor.aggregate as jest.Mock).mockResolvedValue([]);
      (Doctor.find as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      });

      (Patient.countDocuments as jest.Mock).mockResolvedValue(0);
      (Patient.aggregate as jest.Mock)
        .mockResolvedValueOnce([
          { _id: 'MALE', count: 25 },
          { _id: 'FEMALE', count: 25 },
        ])
        .mockResolvedValueOnce([
          { _id: 'O+', count: 20 },
          { _id: 'A+', count: 15 },
        ])
        .mockResolvedValueOnce([
          { _id: 0, count: 5 },
          { _id: 18, count: 20 },
        ]);

      (Receptionist.countDocuments as jest.Mock).mockResolvedValue(0);
      (Appointment.countDocuments as jest.Mock).mockResolvedValue(0);
      (User.find as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      });

      const req = new NextRequest(
        'http://localhost:3000/api/admin/users/statistics'
      );
      const response = await GET(req);
      const body = await response.json();

      expect(body.data.demographics).toBeDefined();
      expect(body.data.demographics.patientsByGender.MALE).toBe(25);
      expect(body.data.demographics.patientsByGender.FEMALE).toBe(25);
      expect(body.data.demographics.patientsByBloodType['O+']).toBe(20);
    });

    it('should return specialization statistics', async () => {
      (User.countDocuments as jest.Mock).mockResolvedValue(0);
      (User.aggregate as jest.Mock).mockResolvedValue([]);

      (Doctor.countDocuments as jest.Mock).mockResolvedValue(0);
      (Doctor.aggregate as jest.Mock).mockResolvedValueOnce([
        { _id: 'Cardiology', count: 10 },
        { _id: 'Neurology', count: 8 },
      ]);
      (Doctor.find as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      });

      (Patient.countDocuments as jest.Mock).mockResolvedValue(0);
      (Patient.aggregate as jest.Mock).mockResolvedValue([]);
      (Receptionist.countDocuments as jest.Mock).mockResolvedValue(0);
      (Appointment.countDocuments as jest.Mock).mockResolvedValue(0);
      (User.find as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      });

      const req = new NextRequest(
        'http://localhost:3000/api/admin/users/statistics'
      );
      const response = await GET(req);
      const body = await response.json();

      expect(body.data.specializations.doctorsBySpecialization).toBeDefined();
      expect(body.data.specializations.doctorsBySpecialization).toHaveLength(2);
      expect(
        body.data.specializations.doctorsBySpecialization[0].specialization
      ).toBe('Cardiology');
    });

    it('should return appointment statistics', async () => {
      (User.countDocuments as jest.Mock).mockResolvedValue(0);
      (User.aggregate as jest.Mock).mockResolvedValue([]);
      (Doctor.countDocuments as jest.Mock).mockResolvedValue(0);
      (Doctor.aggregate as jest.Mock).mockResolvedValue([]);
      (Doctor.find as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      });
      (Patient.countDocuments as jest.Mock).mockResolvedValue(0);
      (Patient.aggregate as jest.Mock).mockResolvedValue([]);
      (Receptionist.countDocuments as jest.Mock).mockResolvedValue(0);

      (Appointment.countDocuments as jest.Mock)
        .mockResolvedValueOnce(200) // total
        .mockResolvedValueOnce(150); // completed

      (User.find as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      });

      const req = new NextRequest(
        'http://localhost:3000/api/admin/users/statistics'
      );
      const response = await GET(req);
      const body = await response.json();

      expect(body.data.appointments).toBeDefined();
      expect(body.data.appointments.total).toBe(200);
      expect(body.data.appointments.completed).toBe(150);
      expect(body.data.appointments.completionRate).toBe('75.00%');
    });

    it('should handle date range filters', async () => {
      (User.countDocuments as jest.Mock).mockResolvedValue(0);
      (User.aggregate as jest.Mock).mockResolvedValue([]);
      (Doctor.countDocuments as jest.Mock).mockResolvedValue(0);
      (Doctor.aggregate as jest.Mock).mockResolvedValue([]);
      (Doctor.find as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      });
      (Patient.countDocuments as jest.Mock).mockResolvedValue(0);
      (Patient.aggregate as jest.Mock).mockResolvedValue([]);
      (Receptionist.countDocuments as jest.Mock).mockResolvedValue(0);
      (Appointment.countDocuments as jest.Mock).mockResolvedValue(0);
      (User.find as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      });

      const req = new NextRequest(
        'http://localhost:3000/api/admin/users/statistics?startDate=2024-01-01&endDate=2024-12-31'
      );
      const response = await GET(req);
      const body = await response.json();

      expect(body.metadata.dateRange.startDate).toBe('2024-01-01');
      expect(body.metadata.dateRange.endDate).toBe('2024-12-31');
    });

    it('should include timestamp in metadata', async () => {
      (User.countDocuments as jest.Mock).mockResolvedValue(0);
      (User.aggregate as jest.Mock).mockResolvedValue([]);
      (Doctor.countDocuments as jest.Mock).mockResolvedValue(0);
      (Doctor.aggregate as jest.Mock).mockResolvedValue([]);
      (Doctor.find as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      });
      (Patient.countDocuments as jest.Mock).mockResolvedValue(0);
      (Patient.aggregate as jest.Mock).mockResolvedValue([]);
      (Receptionist.countDocuments as jest.Mock).mockResolvedValue(0);
      (Appointment.countDocuments as jest.Mock).mockResolvedValue(0);
      (User.find as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      });

      const req = new NextRequest(
        'http://localhost:3000/api/admin/users/statistics'
      );
      const response = await GET(req);
      const body = await response.json();

      expect(body.metadata.timestamp).toBeDefined();
      expect(new Date(body.metadata.timestamp).toString()).not.toBe(
        'Invalid Date'
      );
    });

    it('should handle database errors', async () => {
      (connectDB as jest.Mock).mockRejectedValue(new Error('Database error'));

      const req = new NextRequest(
        'http://localhost:3000/api/admin/users/statistics'
      );
      const response = await GET(req);
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.success).toBe(false);
      expect(body.message).toBe('Failed to fetch user statistics');
    });

    it('should calculate rates correctly with zero denominators', async () => {
      (User.countDocuments as jest.Mock).mockResolvedValue(0);
      (User.aggregate as jest.Mock).mockResolvedValue([]);
      (Doctor.countDocuments as jest.Mock).mockResolvedValue(0);
      (Doctor.aggregate as jest.Mock).mockResolvedValue([]);
      (Doctor.find as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      });
      (Patient.countDocuments as jest.Mock).mockResolvedValue(0);
      (Patient.aggregate as jest.Mock).mockResolvedValue([]);
      (Receptionist.countDocuments as jest.Mock).mockResolvedValue(0);
      (Appointment.countDocuments as jest.Mock).mockResolvedValue(0);
      (User.find as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      });

      const req = new NextRequest(
        'http://localhost:3000/api/admin/users/statistics'
      );
      const response = await GET(req);
      const body = await response.json();

      expect(body.data.overview.verificationRate).toBe('0.00%');
      expect(body.data.roles.doctorVerificationRate).toBe('0.00%');
      expect(body.data.engagement.loginRate).toBe('0.00%');
      expect(body.data.appointments.completionRate).toBe('0.00%');
    });
  });
});

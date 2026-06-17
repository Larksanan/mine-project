import { GET } from '../route';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import MedicalRecord from '@/models/MedicalRecord';
import Appointment from '@/models/Appointment';

// Mock dependencies
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('@/lib/mongodb', () => ({
  connectDB: jest.fn(),
}));

jest.mock('@/models/MedicalRecord', () => ({
  distinct: jest.fn(),
  countDocuments: jest.fn(),
  aggregate: jest.fn(),
}));

jest.mock('@/models/Appointment', () => ({
  countDocuments: jest.fn(),
  aggregate: jest.fn(),
}));

jest.mock('@/app/api/auth/[...nextauth]/option', () => ({
  authOptions: {},
}));

describe('Doctor Profile Stats API', () => {
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
  });

  describe('GET /api/doctor/profile/stats', () => {
    it('should return 401 when user is not authenticated', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual({ error: 'Unauthorized' });
    });

    it('should return 403 when user is not a doctor', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: {
          id: 'user-123',
          role: 'PATIENT',
        },
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data).toEqual({ error: 'Forbidden - Doctor access required' });
    });

    it('should return doctor stats successfully', async () => {
      const mockSession = {
        user: {
          id: 'doctor-123',
          role: 'DOCTOR',
        },
      };

      const mockDistinctPatients = ['patient-1', 'patient-2', 'patient-3'];
      const mockRatingAggregate = [
        {
          _id: null,
          averageRating: 4.8,
          totalRatings: 10,
        },
      ];
      const mockMonthlyStats = [
        {
          month: 1,
          year: 2024,
          appointments: 5,
          patients: 3,
        },
        {
          month: 2,
          year: 2024,
          appointments: 8,
          patients: 5,
        },
      ];
      const mockAgeGroups = {
        under18: 2,
        age18to35: 10,
        age36to60: 15,
        over60: 5,
      };
      const mockCommonDiagnoses = [
        { diagnosis: 'Common Cold', count: 5 },
        { diagnosis: 'Hypertension', count: 3 },
      ];

      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (MedicalRecord.distinct as jest.Mock).mockResolvedValue(
        mockDistinctPatients
      );
      (Appointment.countDocuments as jest.Mock)
        .mockResolvedValueOnce(100) // totalAppointments
        .mockResolvedValueOnce(15) // upcomingAppointments
        .mockResolvedValueOnce(5); // todayAppointments
      (MedicalRecord.countDocuments as jest.Mock).mockResolvedValue(50); // recentRecords
      (Appointment.aggregate as jest.Mock)
        .mockResolvedValueOnce(mockRatingAggregate) // rating aggregate
        .mockResolvedValueOnce(mockMonthlyStats); // monthly stats
      (MedicalRecord.aggregate as jest.Mock)
        .mockResolvedValueOnce([mockAgeGroups]) // age groups
        .mockResolvedValueOnce(mockCommonDiagnoses); // common diagnoses

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        data: {
          totalPatients: 3,
          totalAppointments: 100,
          upcomingAppointments: 15,
          recentRecords: 50,
          averageRating: 4.8,
          totalRatings: 10,
          monthlyStats: [
            { month: 1, year: 2024, appointments: 5, patients: 3 },
            { month: 2, year: 2024, appointments: 8, patients: 5 },
          ],
          todayAppointments: 5,
          patientAgeGroups: mockAgeGroups,
          commonDiagnoses: mockCommonDiagnoses,
        },
      });

      expect(connectDB).toHaveBeenCalled();
      expect(MedicalRecord.distinct).toHaveBeenCalledWith('patient', {
        doctor: 'doctor-123',
      });
      expect(Appointment.countDocuments).toHaveBeenCalledWith({
        doctor: 'doctor-123',
      });
      expect(Appointment.countDocuments).toHaveBeenCalledWith({
        doctor: 'doctor-123',
        status: 'scheduled',
        date: { $gte: expect.any(Date) },
      });
      expect(MedicalRecord.countDocuments).toHaveBeenCalledWith({
        doctor: 'doctor-123',
        createdAt: { $gte: expect.any(Date) },
      });
    });

    it('should use default rating when no ratings exist', async () => {
      const mockSession = {
        user: {
          id: 'doctor-123',
          role: 'DOCTOR',
        },
      };

      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (MedicalRecord.distinct as jest.Mock).mockResolvedValue([]);
      (Appointment.countDocuments as jest.Mock)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);
      (MedicalRecord.countDocuments as jest.Mock).mockResolvedValue(0);
      (Appointment.aggregate as jest.Mock)
        .mockResolvedValueOnce([]) // No ratings
        .mockResolvedValueOnce([]); // No monthly stats
      (MedicalRecord.aggregate as jest.Mock)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.averageRating).toBe(4.5); // Default rating
      expect(data.data.totalRatings).toBe(0);
    });

    it('should handle errors in getPatientAgeGroups helper function', async () => {
      const mockSession = {
        user: {
          id: 'doctor-123',
          role: 'DOCTOR',
        },
      };

      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (MedicalRecord.distinct as jest.Mock).mockResolvedValue([]);
      (Appointment.countDocuments as jest.Mock)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);
      (MedicalRecord.countDocuments as jest.Mock).mockResolvedValue(0);
      (Appointment.aggregate as jest.Mock)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);
      (MedicalRecord.aggregate as jest.Mock)
        .mockRejectedValueOnce(new Error('Aggregation error')) // age groups error
        .mockResolvedValueOnce([]);

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.patientAgeGroups).toEqual({
        under18: 0,
        age18to35: 0,
        age36to60: 0,
        over60: 0,
      });

      consoleErrorSpy.mockRestore();
    });

    it('should handle errors in getCommonDiagnoses helper function', async () => {
      const mockSession = {
        user: {
          id: 'doctor-123',
          role: 'DOCTOR',
        },
      };

      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (MedicalRecord.distinct as jest.Mock).mockResolvedValue([]);
      (Appointment.countDocuments as jest.Mock)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);
      (MedicalRecord.countDocuments as jest.Mock).mockResolvedValue(0);
      (Appointment.aggregate as jest.Mock)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);
      (MedicalRecord.aggregate as jest.Mock)
        .mockResolvedValueOnce([])
        .mockRejectedValueOnce(new Error('Diagnosis error')); // common diagnoses error

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.commonDiagnoses).toEqual([]);

      consoleErrorSpy.mockRestore();
    });

    it('should calculate rating correctly with rounding', async () => {
      const mockSession = {
        user: {
          id: 'doctor-123',
          role: 'DOCTOR',
        },
      };

      const mockRatingAggregate = [
        {
          _id: null,
          averageRating: 4.76,
          totalRatings: 25,
        },
      ];

      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (MedicalRecord.distinct as jest.Mock).mockResolvedValue([]);
      (Appointment.countDocuments as jest.Mock)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);
      (MedicalRecord.countDocuments as jest.Mock).mockResolvedValue(0);
      (Appointment.aggregate as jest.Mock)
        .mockResolvedValueOnce(mockRatingAggregate)
        .mockResolvedValueOnce([]);
      (MedicalRecord.aggregate as jest.Mock)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.averageRating).toBe(4.8); // Rounded to 1 decimal place
      expect(data.data.totalRatings).toBe(25);
    });

    it('should handle database connection errors', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: {
          id: 'doctor-123',
          role: 'DOCTOR',
        },
      });
      (connectDB as jest.Mock).mockRejectedValue(
        new Error('DB connection failed')
      );

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({ error: 'Internal server error' });
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error fetching doctor stats:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it('should handle errors in Promise.all', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: {
          id: 'doctor-123',
          role: 'DOCTOR',
        },
      });
      (MedicalRecord.distinct as jest.Mock).mockRejectedValue(
        new Error('DB error')
      );

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({ error: 'Internal server error' });

      consoleErrorSpy.mockRestore();
    });

    it('should format monthly stats correctly', async () => {
      const mockSession = {
        user: {
          id: 'doctor-123',
          role: 'DOCTOR',
        },
      };

      const mockMonthlyStats = [
        {
          month: 1,
          year: 2024,
          appointments: 5,
          patients: 3,
        },
        {
          month: 2,
          year: 2024,
          appointments: 8,
          patients: 5,
        },
      ];

      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (MedicalRecord.distinct as jest.Mock).mockResolvedValue([]);
      (Appointment.countDocuments as jest.Mock)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);
      (MedicalRecord.countDocuments as jest.Mock).mockResolvedValue(0);
      (Appointment.aggregate as jest.Mock)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce(mockMonthlyStats);
      (MedicalRecord.aggregate as jest.Mock)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.monthlyStats).toEqual([
        { month: 1, year: 2024, appointments: 5, patients: 3 },
        { month: 2, year: 2024, appointments: 8, patients: 5 },
      ]);
    });

    it('should call aggregate with correct match for rating', async () => {
      const mockSession = {
        user: {
          id: 'doctor-123',
          role: 'DOCTOR',
        },
      };

      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (MedicalRecord.distinct as jest.Mock).mockResolvedValue([]);
      (Appointment.countDocuments as jest.Mock)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);
      (MedicalRecord.countDocuments as jest.Mock).mockResolvedValue(0);
      (Appointment.aggregate as jest.Mock)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);
      (MedicalRecord.aggregate as jest.Mock)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      await GET();

      expect(Appointment.aggregate).toHaveBeenCalledWith([
        {
          $match: {
            doctor: 'doctor-123',
            rating: { $exists: true, $ne: null },
          },
        },
        {
          $group: {
            _id: null,
            averageRating: { $avg: '$rating' },
            totalRatings: { $sum: 1 },
          },
        },
      ]);
    });

    it('should call aggregate with correct match for monthly stats', async () => {
      const mockSession = {
        user: {
          id: 'doctor-123',
          role: 'DOCTOR',
        },
      };

      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (MedicalRecord.distinct as jest.Mock).mockResolvedValue([]);
      (Appointment.countDocuments as jest.Mock)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);
      (MedicalRecord.countDocuments as jest.Mock).mockResolvedValue(0);
      (Appointment.aggregate as jest.Mock)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);
      (MedicalRecord.aggregate as jest.Mock)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      await GET();

      expect(Appointment.aggregate).toHaveBeenCalledWith([
        {
          $match: {
            doctor: 'doctor-123',
            createdAt: { $gte: expect.any(Date) },
          },
        },
        expect.objectContaining({
          $group: expect.any(Object),
        }),
        expect.objectContaining({
          $project: expect.any(Object),
        }),
        expect.objectContaining({
          $sort: { year: 1, month: 1 },
        }),
      ]);
    });
  });
});

/* eslint-disable @typescript-eslint/no-require-imports */
import { NextRequest } from 'next/server';
import { GET } from '../route';

// Mock all dependencies
jest.mock('next/server', () => ({
  NextRequest: class {
    url: string;
    method?: string;
    headers: any;

    constructor(url: string) {
      this.url = url;
      this.headers = { get: () => null };
    }
  },
  NextResponse: {
    json: (data: any, init?: { status?: number }) => ({
      json: async () => data,
      status: init?.status || 200,
    }),
  },
}));

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('@/lib/mongodb', () => ({
  connectDB: jest.fn(),
}));

jest.mock('mongoose', () => {
  const actualMongoose = jest.requireActual('mongoose');
  return {
    ...actualMongoose,
    models: {},
    Types: {
      ObjectId: class {
        constructor(public id: string) {}
        toString() {
          return this.id;
        }
      },
    },
  };
});

// Mock models
const mockAppointment = {
  distinct: jest.fn(),
  countDocuments: jest.fn(),
  aggregate: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
};

const mockPatient = {
  find: jest.fn(),
  distinct: jest.fn(),
};

const mockDoctor = {
  findOne: jest.fn(),
};

const mockMedicalRecord = {
  find: jest.fn(),
};

jest.mock('@/models/Appointment', () => ({
  __esModule: true,
  default: mockAppointment,
}));

jest.mock('@/models/Patient', () => ({
  __esModule: true,
  default: mockPatient,
}));

jest.mock('@/models/Doctor', () => ({
  __esModule: true,
  default: mockDoctor,
}));

jest.mock('@/models/MedicalRecord', () => ({
  __esModule: true,
  default: mockMedicalRecord,
}));

jest.mock('@/app/api/auth/[...nextauth]/route', () => ({
  authOptions: {},
}));

describe('Analytics API', () => {
  let getServerSession: jest.Mock;
  let connectDB: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    const nextAuth = require('next-auth');
    getServerSession = nextAuth.getServerSession;
    connectDB = require('@/lib/mongodb').connectDB;

    connectDB.mockResolvedValue(undefined);

    // Reset all mock functions
    mockAppointment.distinct.mockReset();
    mockAppointment.countDocuments.mockReset();
    mockAppointment.aggregate.mockReset();
    mockPatient.find.mockReset();
    mockDoctor.findOne.mockReset();
  });

  describe('GET /api/analytics', () => {
    const mockSession = {
      user: { id: 'user123', role: 'DOCTOR' },
    };

    const mockDoctorDoc = {
      _id: 'doctor123',
      user: 'user123',
      name: 'Dr. Smith',
    };

    const mockPatients = [
      {
        _id: 'patient1',
        dateOfBirth: new Date('1990-01-01'),
        gender: 'male',
        isActive: true,
      },
      {
        _id: 'patient2',
        dateOfBirth: new Date('2010-01-01'),
        gender: 'female',
        isActive: true,
      },
    ];

    beforeEach(() => {
      getServerSession.mockResolvedValue(mockSession);
      mockDoctor.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockDoctorDoc),
      });
    });

    it('should return analytics data successfully', async () => {
      // Mock all required data
      mockAppointment.distinct.mockResolvedValue(['patient1', 'patient2']);
      mockAppointment.countDocuments
        .mockResolvedValueOnce(10) // total
        .mockResolvedValueOnce(7) // completed
        .mockResolvedValueOnce(2); // cancelled

      mockAppointment.aggregate
        .mockResolvedValueOnce([{ _id: null, total: 5000 }]) // total revenue
        .mockResolvedValueOnce([]) // monthly stats
        .mockResolvedValueOnce([]) // appointment trends by day
        .mockResolvedValueOnce([]) // appointment trends by time
        .mockResolvedValueOnce([]) // common diagnoses
        .mockResolvedValueOnce([]) // monthly revenue
        .mockResolvedValueOnce([]); // revenue by service

      mockPatient.find.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockPatients),
      });

      const req = new NextRequest(
        'http://localhost:3000/api/analytics?range=30days'
      );
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
      expect(data.data.overview).toBeDefined();
      expect(data.data.overview.totalPatients).toBe(2);
      expect(data.data.overview.totalAppointments).toBe(10);
      expect(data.data.overview.completedAppointments).toBe(7);
      expect(data.data.overview.cancelledAppointments).toBe(2);
      expect(data.data.overview.totalRevenue).toBe(5000);
    });

    it('should return 401 when not authenticated', async () => {
      getServerSession.mockResolvedValue(null);

      const req = new NextRequest('http://localhost:3000/api/analytics');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 403 when user is not a doctor', async () => {
      getServerSession.mockResolvedValue({
        user: { id: 'user123', role: 'USER' },
      });

      const req = new NextRequest('http://localhost:3000/api/analytics');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(403);
      expect(data.error).toBe('Forbidden - Doctor access required');
    });

    it('should return 404 when doctor profile not found', async () => {
      mockDoctor.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      });

      const req = new NextRequest('http://localhost:3000/api/analytics');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.error).toBe('Doctor profile not found for this user');
    });

    it('should handle 7days range', async () => {
      mockAppointment.distinct.mockResolvedValue(['patient1']);
      mockAppointment.countDocuments.mockResolvedValue(5);
      mockAppointment.aggregate.mockResolvedValue([{ _id: null, total: 1000 }]);
      mockPatient.find.mockReturnValue({
        lean: jest.fn().mockResolvedValue([mockPatients[0]]),
      });

      const req = new NextRequest(
        'http://localhost:3000/api/analytics?range=7days'
      );
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should handle 90days range', async () => {
      mockAppointment.distinct.mockResolvedValue(['patient1']);
      mockAppointment.countDocuments.mockResolvedValue(5);
      mockAppointment.aggregate.mockResolvedValue([{ _id: null, total: 1000 }]);
      mockPatient.find.mockReturnValue({
        lean: jest.fn().mockResolvedValue([mockPatients[0]]),
      });

      const req = new NextRequest(
        'http://localhost:3000/api/analytics?range=90days'
      );
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should handle 1year range', async () => {
      mockAppointment.distinct.mockResolvedValue(['patient1']);
      mockAppointment.countDocuments.mockResolvedValue(5);
      mockAppointment.aggregate.mockResolvedValue([{ _id: null, total: 1000 }]);
      mockPatient.find.mockReturnValue({
        lean: jest.fn().mockResolvedValue([mockPatients[0]]),
      });

      const req = new NextRequest(
        'http://localhost:3000/api/analytics?range=1year'
      );
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should calculate patient demographics correctly', async () => {
      mockAppointment.distinct.mockResolvedValue(['patient1', 'patient2']);
      mockAppointment.countDocuments.mockResolvedValue(10);
      mockAppointment.aggregate.mockResolvedValue([{ _id: null, total: 5000 }]);

      mockPatient.find.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockPatients),
      });

      const req = new NextRequest(
        'http://localhost:3000/api/analytics?range=30days'
      );
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.data.patientDemographics).toBeDefined();
      expect(data.data.patientDemographics.genderDistribution).toBeDefined();
      expect(data.data.patientDemographics.ageGroups).toBeDefined();
    });

    it('should handle monthly stats aggregation', async () => {
      const mockMonthlyStats = [
        {
          month: 'Jan',
          year: 2024,
          appointments: 15,
          patients: 10,
        },
        {
          month: 'Feb',
          year: 2024,
          appointments: 20,
          patients: 12,
        },
      ];

      mockAppointment.distinct.mockResolvedValue(['patient1']);
      mockAppointment.countDocuments.mockResolvedValue(5);

      mockAppointment.aggregate
        .mockResolvedValueOnce([{ _id: null, total: 1000 }]) // total revenue
        .mockResolvedValueOnce(mockMonthlyStats); // monthly stats

      mockPatient.find.mockReturnValue({
        lean: jest.fn().mockResolvedValue([mockPatients[0]]),
      });

      const req = new NextRequest(
        'http://localhost:3000/api/analytics?range=30days'
      );
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.data.monthlyStats).toBeDefined();
    });

    it('should handle appointment trends by day', async () => {
      mockAppointment.distinct.mockResolvedValue(['patient1']);
      mockAppointment.countDocuments.mockResolvedValue(5);

      const mockTrendsByDay = [
        { day: 'Monday', count: 5 },
        { day: 'Tuesday', count: 3 },
      ];

      mockAppointment.aggregate
        .mockResolvedValueOnce([{ _id: null, total: 1000 }]) // total revenue
        .mockResolvedValueOnce([]) // monthly stats
        .mockResolvedValueOnce(mockTrendsByDay) // by day
        .mockResolvedValueOnce([]); // by time

      mockPatient.find.mockReturnValue({
        lean: jest.fn().mockResolvedValue([mockPatients[0]]),
      });

      const req = new NextRequest(
        'http://localhost:3000/api/analytics?range=30days'
      );
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.data.appointmentTrends).toBeDefined();
    });

    it('should handle common diagnoses', async () => {
      mockAppointment.distinct.mockResolvedValue(['patient1']);
      mockAppointment.countDocuments.mockResolvedValue(5);

      const mockDiagnoses = [
        { diagnosis: 'Flu', count: 10, percentage: 0.5 },
        { diagnosis: 'Cold', count: 8, percentage: 0.4 },
      ];

      mockAppointment.aggregate
        .mockResolvedValueOnce([{ _id: null, total: 1000 }]) // total revenue
        .mockResolvedValueOnce([]) // monthly stats
        .mockResolvedValueOnce([]) // by day
        .mockResolvedValueOnce([]) // by time
        .mockResolvedValueOnce(mockDiagnoses); // diagnoses

      mockPatient.find.mockReturnValue({
        lean: jest.fn().mockResolvedValue([mockPatients[0]]),
      });

      const req = new NextRequest(
        'http://localhost:3000/api/analytics?range=30days'
      );
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.data.commonDiagnoses).toBeDefined();
    });

    it('should handle revenue analysis with growth', async () => {
      mockAppointment.distinct.mockResolvedValue(['patient1']);
      mockAppointment.countDocuments.mockResolvedValue(5);

      const mockMonthlyRevenue = [
        { month: 'Jan', year: 2024, revenue: 1000, count: 5 },
        { month: 'Feb', year: 2024, revenue: 1500, count: 7 },
      ];

      const mockRevenueByService = [
        { service: 'Consultation', revenue: 2000, count: 10 },
        { service: 'Follow-up', revenue: 500, count: 5 },
      ];

      mockAppointment.aggregate
        .mockResolvedValueOnce([{ _id: null, total: 2500 }]) // total revenue
        .mockResolvedValueOnce([]) // monthly stats
        .mockResolvedValueOnce([]) // by day
        .mockResolvedValueOnce([]) // by time
        .mockResolvedValueOnce([]) // diagnoses
        .mockResolvedValueOnce(mockMonthlyRevenue) // monthly revenue
        .mockResolvedValueOnce(mockRevenueByService); // revenue by service

      mockPatient.find.mockReturnValue({
        lean: jest.fn().mockResolvedValue([mockPatients[0]]),
      });

      const req = new NextRequest(
        'http://localhost:3000/api/analytics?range=30days'
      );
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.data.revenueAnalysis).toBeDefined();
    });

    it('should handle zero revenue', async () => {
      mockAppointment.distinct.mockResolvedValue(['patient1']);
      mockAppointment.countDocuments.mockResolvedValue(5);
      mockAppointment.aggregate.mockResolvedValue([]); // No revenue data

      mockPatient.find.mockReturnValue({
        lean: jest.fn().mockResolvedValue([mockPatients[0]]),
      });

      const req = new NextRequest(
        'http://localhost:3000/api/analytics?range=30days'
      );
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.data.overview.totalRevenue).toBe(0);
    });

    it('should calculate new vs returning patients', async () => {
      mockAppointment.distinct
        .mockResolvedValueOnce(['patient1', 'patient2']) // current patients
        .mockResolvedValueOnce(['patient1', 'patient2']) // patient demographics
        .mockResolvedValueOnce(['patient1']); // old patients

      mockAppointment.countDocuments.mockResolvedValue(10);
      mockAppointment.aggregate.mockResolvedValue([{ _id: null, total: 5000 }]);

      mockPatient.find.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockPatients),
      });

      const req = new NextRequest(
        'http://localhost:3000/api/analytics?range=30days'
      );
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.data.overview.newPatients).toBeDefined();
      expect(data.data.overview.returningPatients).toBeDefined();
    });

    it('should handle empty patient demographics', async () => {
      mockAppointment.distinct.mockResolvedValue([]);
      mockAppointment.countDocuments.mockResolvedValue(0);
      mockAppointment.aggregate.mockResolvedValue([]);

      mockPatient.find.mockReturnValue({
        lean: jest.fn().mockResolvedValue([]),
      });

      const req = new NextRequest(
        'http://localhost:3000/api/analytics?range=30days'
      );
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.data.patientDemographics).toBeDefined();
      expect(data.data.patientDemographics.ageGroups).toEqual({
        under18: 0,
        age18to35: 0,
        age36to60: 0,
        over60: 0,
      });
    });

    it('should handle database errors gracefully', async () => {
      mockAppointment.distinct.mockRejectedValue(new Error('Database error'));

      const req = new NextRequest(
        'http://localhost:3000/api/analytics?range=30days'
      );
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Internal server error');
    });

    it('should handle aggregation errors in helper functions', async () => {
      mockAppointment.distinct.mockResolvedValue(['patient1']);
      mockAppointment.countDocuments.mockResolvedValue(5);

      // First aggregate for total revenue succeeds, but monthly stats fails
      mockAppointment.aggregate
        .mockResolvedValueOnce([{ _id: null, total: 1000 }])
        .mockRejectedValueOnce(new Error('Aggregation failed'));

      mockPatient.find.mockReturnValue({
        lean: jest.fn().mockResolvedValue([mockPatients[0]]),
      });

      const req = new NextRequest(
        'http://localhost:3000/api/analytics?range=30days'
      );
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.data.monthlyStats).toEqual([]);
    });

    it('should include average rating in overview', async () => {
      mockAppointment.distinct.mockResolvedValue(['patient1']);
      mockAppointment.countDocuments.mockResolvedValue(5);
      mockAppointment.aggregate.mockResolvedValue([{ _id: null, total: 1000 }]);

      mockPatient.find.mockReturnValue({
        lean: jest.fn().mockResolvedValue([mockPatients[0]]),
      });

      const req = new NextRequest(
        'http://localhost:3000/api/analytics?range=30days'
      );
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.data.overview.averageRating).toBe(4.7);
    });

    it('should handle patients with missing gender', async () => {
      const patientsWithMissingData = [
        {
          _id: 'patient1',
          dateOfBirth: new Date('1990-01-01'),
          isActive: true,
        },
        {
          _id: 'patient2',
          gender: 'other',
          dateOfBirth: new Date('2000-01-01'),
          isActive: true,
        },
      ];

      mockAppointment.distinct.mockResolvedValue(['patient1', 'patient2']);
      mockAppointment.countDocuments.mockResolvedValue(5);
      mockAppointment.aggregate.mockResolvedValue([{ _id: null, total: 1000 }]);

      mockPatient.find.mockReturnValue({
        lean: jest.fn().mockResolvedValue(patientsWithMissingData),
      });

      const req = new NextRequest(
        'http://localhost:3000/api/analytics?range=30days'
      );
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.data.patientDemographics.genderDistribution).toBeDefined();
    });

    it('should handle patients with missing date of birth', async () => {
      const patientsWithoutDOB = [
        { _id: 'patient1', gender: 'male', isActive: true },
      ];

      mockAppointment.distinct.mockResolvedValue(['patient1']);
      mockAppointment.countDocuments.mockResolvedValue(5);
      mockAppointment.aggregate.mockResolvedValue([{ _id: null, total: 1000 }]);

      mockPatient.find.mockReturnValue({
        lean: jest.fn().mockResolvedValue(patientsWithoutDOB),
      });

      const req = new NextRequest(
        'http://localhost:3000/api/analytics?range=30days'
      );
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.data.patientDemographics.ageGroups).toBeDefined();
    });

    it('should handle default range when not specified', async () => {
      mockAppointment.distinct.mockResolvedValue(['patient1']);
      mockAppointment.countDocuments.mockResolvedValue(5);
      mockAppointment.aggregate.mockResolvedValue([{ _id: null, total: 1000 }]);

      mockPatient.find.mockReturnValue({
        lean: jest.fn().mockResolvedValue([mockPatients[0]]),
      });

      const req = new NextRequest('http://localhost:3000/api/analytics');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should handle connection errors', async () => {
      connectDB.mockRejectedValue(new Error('Connection failed'));

      const req = new NextRequest('http://localhost:3000/api/analytics');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.success).toBe(false);
    });
  });
});

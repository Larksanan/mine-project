/**
 * @jest-environment node
 */
import { GET } from '../route';
import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Patient from '@/models/Patient';

// Mock dependencies
jest.mock('@/lib/mongodb');
jest.mock('@/models/Patient');

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

describe('Patient Statistics API', () => {
  const mockStats = {
    total: 150,
    active: 140,
    inactive: 10,
    withInsurance: 100,
    insuranceExpiring: 5,
    recentRegistrations: 20,
  };

  const mockBloodTypeDistribution = [
    { bloodType: 'O+', count: 50 },
    { bloodType: 'A+', count: 40 },
    { bloodType: 'B+', count: 30 },
    { bloodType: 'AB+', count: 20 },
  ];

  const mockAllergyStatistics = [
    { allergy: 'Penicillin', count: 25 },
    { allergy: 'Peanuts', count: 20 },
    { allergy: 'Latex', count: 15 },
  ];

  const mockExpiringInsurance = [
    {
      _id: '507f1f77bcf86cd799439011',
      firstName: 'Jebarsan',
      lastName: 'Thatchroos',
      email: 'jebarsanthatcroos@gmail.com',
      phone: '0760780414',
      insurance: {
        provider: 'HealthCare Inc',
        policyNumber: 'POL123',
        validUntil: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
      },
    },
    {
      _id: '507f1f77bcf86cd799439012',
      firstName: 'sovika',
      lastName: 'sovika',
      email: 'sovika@gmail.com',
      phone: '0771234567',
      insurance: {
        provider: 'MediCare Plus',
        policyNumber: 'POL456',
        validUntil: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000), // 25 days from now
      },
    },
  ];

  const mockGenderDistribution = [
    { _id: 'MALE', count: 70 },
    { _id: 'FEMALE', count: 65 },
    { _id: 'OTHER', count: 5 },
  ];

  const mockAgeGroupDistribution = [
    { _id: 0, count: 20 },
    { _id: 18, count: 45 },
    { _id: 30, count: 40 },
    { _id: 45, count: 25 },
    { _id: 60, count: 10 },
  ];

  const mockMaritalStatusDistribution = [
    { _id: 'SINGLE', count: 60 },
    { _id: 'MARRIED', count: 70 },
    { _id: 'DIVORCED', count: 10 },
  ];

  const mockLanguageDistribution = [
    { _id: 'English', count: 100 },
    { _id: 'Tamil', count: 30 },
    { _id: 'Sinhala', count: 10 },
  ];

  const mockAllergyStats = [
    { _id: 'With Allergies', count: 60 },
    { _id: 'Without Allergies', count: 80 },
  ];

  const mockMedicationStats = [
    { _id: 'With Medications', count: 70 },
    { _id: 'Without Medications', count: 70 },
  ];

  const mockMonthlyGrowth = [
    { _id: { year: 2025, month: 8 }, count: 15 },
    { _id: { year: 2025, month: 9 }, count: 18 },
    { _id: { year: 2025, month: 10 }, count: 20 },
    { _id: { year: 2025, month: 11 }, count: 22 },
    { _id: { year: 2025, month: 12 }, count: 25 },
    { _id: { year: 2026, month: 1 }, count: 30 },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (connectDB as jest.Mock).mockResolvedValue(undefined);

    (Patient.getPatientStats as jest.Mock).mockResolvedValue(mockStats);
    (Patient.getBloodTypeDistribution as jest.Mock).mockResolvedValue(
      mockBloodTypeDistribution
    );
    (Patient.getAllergyStatistics as jest.Mock).mockResolvedValue(
      mockAllergyStatistics
    );

    const mockFindChain = {
      select: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      lean: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue(mockExpiringInsurance),
    };
    (Patient.find as jest.Mock).mockReturnValue(mockFindChain);

    // Mock countDocuments
    (Patient.countDocuments as jest.Mock).mockImplementation((query?: any) => ({
      exec: jest.fn().mockResolvedValue(() => {
        if (!query) return 150; // Total patients
        if (query.isActive === true) return 140; // Active patients
        if (query['insurance.validUntil']) return 100; // Valid insurance
        if (query.createdAt) return 20; // Recent patients
        return 0;
      }),
    }));

    // Setup countDocuments to return proper values
    let countCallIndex = 0;
    (Patient.countDocuments as jest.Mock).mockImplementation(() => ({
      exec: jest.fn().mockImplementation(() => {
        const values = [150, 140, 100, 20]; // total, active, validInsurance, recent
        return Promise.resolve(values[countCallIndex++] || 0);
      }),
    }));

    // Mock aggregate for various statistics
    (Patient.aggregate as jest.Mock).mockImplementation((pipeline: any[]) => {
      // Check what type of aggregation based on pipeline
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const firstStage = pipeline[0];
      const secondStage = pipeline[1];

      if (secondStage?.$group?._id === '$gender') {
        return Promise.resolve(mockGenderDistribution);
      }
      if (secondStage?.$bucket?.groupBy === '$age') {
        return Promise.resolve(mockAgeGroupDistribution);
      }
      if (secondStage?.$group?._id === '$maritalStatus') {
        return Promise.resolve(mockMaritalStatusDistribution);
      }
      if (secondStage?.$group?._id === '$preferredLanguage') {
        return Promise.resolve(mockLanguageDistribution);
      }
      if (secondStage?.$group?._id?.$cond) {
        const condStr = JSON.stringify(secondStage.$group._id.$cond);
        if (condStr.includes('allergies')) {
          return Promise.resolve(mockAllergyStats);
        }
        if (condStr.includes('medications')) {
          return Promise.resolve(mockMedicationStats);
        }
      }
      if (secondStage?.$group?._id?.year) {
        return Promise.resolve(mockMonthlyGrowth);
      }

      return Promise.resolve([]);
    });
  });

  describe('GET', () => {
    it('should return comprehensive patient statistics', async () => {
      const req = new NextRequest(
        'http://localhost:3000/api/admin/patient/statistics'
      );
      const response = await GET(req);
      const body = await response.json();

      expect(connectDB).toHaveBeenCalled();
      expect(body.success).toBe(true);
      expect(body.data).toBeDefined();
      expect(body.timestamp).toBeDefined();
    });

    it('should return overview statistics', async () => {
      const req = new NextRequest(
        'http://localhost:3000/api/admin/patient/statistics'
      );
      const response = await GET(req);
      const body = await response.json();

      expect(body.data.overview).toBeDefined();
      expect(body.data.overview.total).toBe(150);
      expect(body.data.overview.active).toBe(140);
      expect(body.data.overview.inactive).toBe(10);
      expect(body.data.overview.withValidInsurance).toBe(100);
      expect(body.data.overview.recent).toBe(20);
      expect(body.data.overview.insuranceExpiringSoon).toBe(2);
    });

    it('should return demographics data', async () => {
      const req = new NextRequest(
        'http://localhost:3000/api/admin/patient/statistics'
      );
      const response = await GET(req);
      const body = await response.json();

      expect(body.data.demographics).toBeDefined();
      expect(body.data.demographics.gender).toHaveLength(3);
      expect(body.data.demographics.gender[0].gender).toBe('MALE');
      expect(body.data.demographics.gender[0].count).toBe(70);
      expect(body.data.demographics.gender[0].percentage).toBeDefined();
    });

    it('should return age group distribution', async () => {
      const req = new NextRequest(
        'http://localhost:3000/api/admin/patient/statistics'
      );
      const response = await GET(req);
      const body = await response.json();

      expect(body.data.demographics.ageGroups).toBeDefined();
    });

    it('should return marital status distribution', async () => {
      const req = new NextRequest(
        'http://localhost:3000/api/admin/patient/statistics'
      );
      const response = await GET(req);
      const body = await response.json();

      expect(body.data.demographics.maritalStatus).toBeDefined();
      expect(body.data.demographics.maritalStatus).toHaveLength(3);
      expect(body.data.demographics.maritalStatus[0].status).toBe('SINGLE');
    });

    it('should return language distribution', async () => {
      const req = new NextRequest(
        'http://localhost:3000/api/admin/patient/statistics'
      );
      const response = await GET(req);
      const body = await response.json();

      expect(body.data.demographics.languages).toBeDefined();
      expect(body.data.demographics.languages).toHaveLength(3);
      expect(body.data.demographics.languages[0].language).toBe('English');
    });

    it('should return medical statistics', async () => {
      const req = new NextRequest(
        'http://localhost:3000/api/admin/patient/statistics'
      );
      const response = await GET(req);
      const body = await response.json();

      expect(body.data.medical).toBeDefined();
      expect(body.data.medical.bloodTypes).toBeDefined();
      expect(body.data.medical.allergies).toBeDefined();
      expect(body.data.medical.medications).toBeDefined();
    });

    it('should return blood type distribution', async () => {
      const req = new NextRequest(
        'http://localhost:3000/api/admin/patient/statistics'
      );
      const response = await GET(req);
      const body = await response.json();

      expect(body.data.medical.bloodTypes).toHaveLength(4);
      expect(body.data.medical.bloodTypes[0].bloodType).toBe('O+');
      expect(body.data.medical.bloodTypes[0].count).toBe(50);
      expect(body.data.medical.bloodTypes[0].percentage).toBeDefined();
    });

    it('should return allergy statistics', async () => {
      const req = new NextRequest(
        'http://localhost:3000/api/admin/patient/statistics'
      );
      const response = await GET(req);
      const body = await response.json();

      expect(body.data.medical.allergies.stats).toHaveLength(2);
      expect(body.data.medical.allergies.topAllergies).toBeDefined();
      expect(body.data.medical.allergies.topAllergies).toHaveLength(3);
    });

    it('should return medication statistics', async () => {
      const req = new NextRequest(
        'http://localhost:3000/api/admin/patient/statistics'
      );
      const response = await GET(req);
      const body = await response.json();

      expect(body.data.medical.medications.stats).toHaveLength(2);
      expect(body.data.medical.medications.stats[0].category).toBe(
        'With Medications'
      );
    });

    it('should return insurance information', async () => {
      const req = new NextRequest(
        'http://localhost:3000/api/admin/patient/statistics'
      );
      const response = await GET(req);
      const body = await response.json();

      expect(body.data.insurance).toBeDefined();
      expect(body.data.insurance.expiring).toBeDefined();
      expect(body.data.insurance.expiring.count).toBe(2);
      expect(body.data.insurance.expiring.patients).toHaveLength(2);
    });

    it('should format expiring insurance patients correctly', async () => {
      const req = new NextRequest(
        'http://localhost:3000/api/admin/patient/statistics'
      );
      const response = await GET(req);
      const body = await response.json();

      const patient = body.data.insurance.expiring.patients[0];
      expect(patient).toHaveProperty('id');
      expect(patient).toHaveProperty('name');
      expect(patient).toHaveProperty('email');
      expect(patient).toHaveProperty('phone');
      expect(patient).toHaveProperty('insurance');
      expect(patient).toHaveProperty('daysUntilExpiry');
      expect(patient.name).toBe('Jebarsan Thatchroos');
      expect(typeof patient.daysUntilExpiry).toBe('number');
    });

    it('should return insurance summary', async () => {
      const req = new NextRequest(
        'http://localhost:3000/api/admin/patient/statistics'
      );
      const response = await GET(req);
      const body = await response.json();

      expect(body.data.insurance.summary).toBeDefined();
      expect(body.data.insurance.summary.withInsurance).toBe(100);
      expect(body.data.insurance.summary.insuranceExpiring).toBe(5);
      expect(body.data.insurance.summary.withoutInsurance).toBeDefined();
    });

    it('should return trends data', async () => {
      const req = new NextRequest(
        'http://localhost:3000/api/admin/patient/statistics'
      );
      const response = await GET(req);
      const body = await response.json();

      expect(body.data.trends).toBeDefined();
      expect(body.data.trends.monthlyGrowth).toBeDefined();
      expect(body.data.trends.dailyAverages).toBeDefined();
    });

    it('should return monthly growth data', async () => {
      const req = new NextRequest(
        'http://localhost:3000/api/admin/patient/statistics'
      );
      const response = await GET(req);
      const body = await response.json();

      expect(body.data.trends.monthlyGrowth).toHaveLength(6);
      expect(body.data.trends.monthlyGrowth[0].month).toContain('Aug');
      expect(body.data.trends.monthlyGrowth[0].count).toBeDefined();
    });

    it('should return daily averages', async () => {
      const req = new NextRequest(
        'http://localhost:3000/api/admin/patient/statistics'
      );
      const response = await GET(req);
      const body = await response.json();

      expect(body.data.trends.dailyAverages).toBeDefined();
      expect(body.data.trends.dailyAverages.newPatientsPerDay).toBeDefined();
      expect(body.data.trends.dailyAverages.activePercentage).toBeDefined();
      expect(body.data.trends.dailyAverages.insuranceCoverage).toBeDefined();
    });

    it('should calculate percentages correctly', async () => {
      const req = new NextRequest(
        'http://localhost:3000/api/admin/patient/statistics'
      );
      const response = await GET(req);
      const body = await response.json();

      // Check that percentages are numbers and within valid range
      const genderPercentage = body.data.demographics.gender[0].percentage;
      expect(typeof genderPercentage).toBe('number');
      expect(genderPercentage).toBeGreaterThanOrEqual(0);
      expect(genderPercentage).toBeLessThanOrEqual(100);
    });

    it('should handle database connection errors', async () => {
      (connectDB as jest.Mock).mockRejectedValue(
        new Error('Database connection failed')
      );

      const req = new NextRequest(
        'http://localhost:3000/api/admin/patient/statistics'
      );
      const response = await GET(req);
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.success).toBe(false);
      expect(body.error).toBe('Failed to fetch patient statistics');
      expect(body.details).toBe('Database connection failed');
    });

    it('should handle errors from static methods', async () => {
      (Patient.getPatientStats as jest.Mock).mockRejectedValue(
        new Error('Stats retrieval failed')
      );

      const req = new NextRequest(
        'http://localhost:3000/api/admin/patient/statistics'
      );
      const response = await GET(req);
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.success).toBe(false);
      expect(body.error).toBe('Failed to fetch patient statistics');
    });

    it('should handle errors from aggregation queries', async () => {
      (Patient.aggregate as jest.Mock).mockRejectedValue(
        new Error('Aggregation failed')
      );

      const req = new NextRequest(
        'http://localhost:3000/api/admin/patient/statistics'
      );
      const response = await GET(req);
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.success).toBe(false);
    });

    it('should calculate days until expiry correctly', async () => {
      const req = new NextRequest(
        'http://localhost:3000/api/admin/patient/statistics'
      );
      const response = await GET(req);
      const body = await response.json();

      const patient = body.data.insurance.expiring.patients[0];
      expect(patient.daysUntilExpiry).toBeGreaterThan(0);
      expect(patient.daysUntilExpiry).toBeLessThanOrEqual(30);
    });

    it('should handle patients with no insurance validUntil date', async () => {
      const patientsWithoutDate = [
        {
          ...mockExpiringInsurance[0],
          insurance: { provider: 'Test', policyNumber: 'TEST' },
        },
      ];

      const mockFindChain = {
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(patientsWithoutDate),
      };
      (Patient.find as jest.Mock).mockReturnValue(mockFindChain);

      const req = new NextRequest(
        'http://localhost:3000/api/admin/patient/statistics'
      );
      const response = await GET(req);
      const body = await response.json();

      expect(
        body.data.insurance.expiring.patients[0].daysUntilExpiry
      ).toBeNull();
    });

    it('should query for insurance expiring within 30 days', async () => {
      const req = new NextRequest(
        'http://localhost:3000/api/admin/patient/statistics'
      );
      await GET(req);

      expect(Patient.find).toHaveBeenCalledWith(
        expect.objectContaining({
          'insurance.validUntil': expect.objectContaining({
            $gte: expect.any(Date),
            $lte: expect.any(Date),
          }),
          isActive: true,
        })
      );
    });

    it('should include timestamp in response', async () => {
      const req = new NextRequest(
        'http://localhost:3000/api/admin/patient/statistics'
      );
      const response = await GET(req);
      const body = await response.json();

      expect(body.timestamp).toBeDefined();
      expect(new Date(body.timestamp).toString()).not.toBe('Invalid Date');
    });
  });
});

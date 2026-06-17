import { NextRequest } from 'next/server';
import { GET, POST } from '../route';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import LabTest from '@/models/LabTest';

jest.mock('next-auth');
jest.mock('@/lib/mongodb');
jest.mock('@/models/LabTest');

describe('/api/lab/lab-tests', () => {
  const mockConnectDB = connectDB as jest.MockedFunction<typeof connectDB>;
  const mockGetServerSession = getServerSession as jest.MockedFunction<
    typeof getServerSession
  >;

  beforeEach(() => {
    jest.clearAllMocks();
    mockConnectDB.mockResolvedValue(undefined as any);
  });

  describe('GET', () => {
    const mockLabTests = [
      {
        _id: '1',
        name: 'Jebarsan Thtcroos ',
        category: 'Hematology',
        price: 50,
        isActive: true,
      },
      {
        _id: '2',
        name: 'Sovika sovi',
        category: 'Biochemistry',
        price: 30,
        isActive: true,
      },
    ];

    beforeEach(() => {
      const mockSort = jest.fn().mockResolvedValue(mockLabTests);
      const mockFind = jest.fn().mockReturnValue({ sort: mockSort });
      (LabTest.find as jest.Mock) = mockFind;
    });

    it('should fetch all active lab tests by default', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/lab/lab-tests'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(mockConnectDB).toHaveBeenCalled();
      expect(LabTest.find).toHaveBeenCalledWith({ isActive: true });
      expect(response.status).toBe(200);
      expect(data.tests).toEqual(mockLabTests);
    });

    it('should filter lab tests by category', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/lab/lab-tests?category=Hematology'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(LabTest.find).toHaveBeenCalledWith({
        category: 'Hematology',
        isActive: true,
      });
      expect(response.status).toBe(200);
      expect(data.tests).toEqual(mockLabTests);
    });

    it('should include inactive tests when activeOnly is false', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/lab/lab-tests?activeOnly=false'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(LabTest.find).toHaveBeenCalledWith({});
      expect(response.status).toBe(200);
      expect(data.tests).toEqual(mockLabTests);
    });

    it('should filter by category and include inactive tests', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/lab/lab-tests?category=Biochemistry&activeOnly=false'
      );

      const response = await GET(request);
      const _data = await response.json();

      expect(LabTest.find).toHaveBeenCalledWith({
        category: 'Biochemistry',
      });
      expect(response.status).toBe(200);
    });

    it('should sort tests by name', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/lab/lab-tests'
      );
      const mockSort = jest.fn().mockResolvedValue(mockLabTests);
      const mockFind = jest.fn().mockReturnValue({ sort: mockSort });
      (LabTest.find as jest.Mock) = mockFind;

      await GET(request);

      expect(mockSort).toHaveBeenCalledWith({ name: 1 });
    });

    it('should return 500 on database error', async () => {
      const mockSort = jest.fn().mockRejectedValue(new Error('Database error'));
      const mockFind = jest.fn().mockReturnValue({ sort: mockSort });
      (LabTest.find as jest.Mock) = mockFind;

      const request = new NextRequest(
        'http://localhost:3000/api/lab/lab-tests'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });

    it('should handle connection errors', async () => {
      mockConnectDB.mockRejectedValue(new Error('Connection failed'));

      const request = new NextRequest(
        'http://localhost:3000/api/lab/lab-tests'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });

  describe('POST', () => {
    const mockTestData = {
      name: 'Complete Blood Count',
      category: 'Hematology',
      price: 75,
      description: 'CBC test',
      isActive: true,
    };

    const mockSavedTest = {
      _id: 'test-id-123',
      ...mockTestData,
    };

    beforeEach(() => {
      const mockSave = jest.fn().mockResolvedValue(mockSavedTest);
      (LabTest as any).mockImplementation(() => ({
        save: mockSave,
        ...mockTestData,
      }));
    });

    it('should create a new lab test as ADMIN', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { role: 'ADMIN', email: 'admin@example.com' },
      } as any);

      const request = new NextRequest(
        'http://localhost:3000/api/lab/lab-tests',
        {
          method: 'POST',
          body: JSON.stringify(mockTestData),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(mockConnectDB).toHaveBeenCalled();
      expect(mockGetServerSession).toHaveBeenCalled();
      expect(LabTest).toHaveBeenCalledWith(mockTestData);
      expect(response.status).toBe(201);
      expect(data.test).toBeDefined();
    });

    it('should create a new lab test as DOCTOR', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { role: 'DOCTOR', email: 'jebarsanthatcroos@gmail.com' },
      } as any);

      const request = new NextRequest(
        'http://localhost:3000/api/lab/lab-tests',
        {
          method: 'POST',
          body: JSON.stringify(mockTestData),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.test).toBeDefined();
    });

    it('should return 401 when user is not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = new NextRequest(
        'http://localhost:3000/api/lab/lab-tests',
        {
          method: 'POST',
          body: JSON.stringify(mockTestData),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
      expect(LabTest).not.toHaveBeenCalled();
    });

    it('should return 401 when user role is not ADMIN or DOCTOR', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { role: 'PATIENT', email: 'jebarsanthatcroospatient@gmail.com' },
      } as any);

      const request = new NextRequest(
        'http://localhost:3000/api/lab/lab-tests',
        {
          method: 'POST',
          body: JSON.stringify(mockTestData),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
      expect(LabTest).not.toHaveBeenCalled();
    });

    it('should return 401 when user has no role', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { email: 'jebarsanthatcroos@gmail.com' },
      } as any);

      const request = new NextRequest(
        'http://localhost:3000/api/lab/lab-tests',
        {
          method: 'POST',
          body: JSON.stringify(mockTestData),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 400 on duplicate test name in category', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { role: 'ADMIN', email: 'jebarsanthatcroos@gmail.com' },
      } as any);

      const duplicateError = new Error('Duplicate key') as any;
      duplicateError.code = 11000;

      const mockSave = jest.fn().mockRejectedValue(duplicateError);
      (LabTest as any).mockImplementation(() => ({
        save: mockSave,
      }));

      const request = new NextRequest(
        'http://localhost:3000/api/lab/lab-tests',
        {
          method: 'POST',
          body: JSON.stringify(mockTestData),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Test name already exists in this category');
    });

    it('should return 500 on general database error', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { role: 'ADMIN', email: 'jebarsanthatcroos@gmail.com' },
      } as any);

      const mockSave = jest.fn().mockRejectedValue(new Error('Database error'));
      (LabTest as any).mockImplementation(() => ({
        save: mockSave,
      }));

      const request = new NextRequest(
        'http://localhost:3000/api/lab/lab-tests',
        {
          method: 'POST',
          body: JSON.stringify(mockTestData),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });

    it('should handle connection errors during POST', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { role: 'ADMIN', email: 'jebarsanthatcroos@gmail.com' },
      } as any);

      mockConnectDB.mockRejectedValue(new Error('Connection failed'));

      const request = new NextRequest(
        'http://localhost:3000/api/lab/lab-tests',
        {
          method: 'POST',
          body: JSON.stringify(mockTestData),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });

    it('should handle malformed JSON in request body', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { role: 'ADMIN', email: 'jebarsanthatcroos@gmail.com' },
      } as any);

      // Create request with invalid JSON
      const request = {
        json: jest.fn().mockRejectedValue(new SyntaxError('Invalid JSON')),
      } as unknown as NextRequest;

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });
});

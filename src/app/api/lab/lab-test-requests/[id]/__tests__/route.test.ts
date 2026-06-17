import { NextRequest } from 'next/server';
import { GET, PATCH } from '../route';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import LabTestRequest from '@/models/LabTestRequest';

// Mock dependencies
jest.mock('next-auth');
jest.mock('@/lib/mongodb');
jest.mock('@/models/LabTestRequest');

describe('/api/lab/lab-test-requests/[id]', () => {
  const mockConnectDB = connectDB as jest.MockedFunction<typeof connectDB>;
  const mockGetServerSession = getServerSession as jest.MockedFunction<
    typeof getServerSession
  >;

  const mockContext = {
    params: { id: '507f1f77bcf86cd799439011' },
  };

  const mockTestRequest = {
    _id: '507f1f77bcf86cd799439011',
    patient: {
      _id: 'patient-id',
      name: 'Jebarsa thatcroos',
      email: 'jebarsanthatcroos@gmail.com',
      phone: '1234567890',
    },
    doctor: {
      _id: 'doctor-id',
      name: 'Dr. sovika',
      email: 'sovika@gamil.com',
    },
    labTechnician: {
      _id: 'tech-id',
      name: 'Lab Tech',
      email: 'tech@example.com',
      employeeId: 'EMP001',
    },
    test: {
      _id: 'test-id',
      name: 'Blood Test',
      category: 'Hematology',
    },
    status: 'pending',
    priority: 'normal',
    results: null,
    findings: null,
    notes: '',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockConnectDB.mockResolvedValue(undefined as any);
  });

  describe('GET', () => {
    it('should fetch a lab test request by ID', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { role: 'DOCTOR', email: 'sovika@gamil.com' },
      } as any);

      const mockPopulate = jest.fn().mockReturnThis();
      const mockQuery = {
        populate: mockPopulate,
      };
      (mockQuery as any).then = (resolve: any) => resolve(mockTestRequest);
      (LabTestRequest.findById as jest.Mock).mockReturnValue(mockQuery);

      const request = new NextRequest(
        `http://localhost:3000/api/lab/lab-test-requests/${mockContext.params.id}`
      );

      const response = await GET(request, mockContext);
      const data = await response.json();

      expect(mockConnectDB).toHaveBeenCalled();
      expect(mockGetServerSession).toHaveBeenCalled();
      expect(LabTestRequest.findById).toHaveBeenCalledWith(
        mockContext.params.id
      );
      expect(mockPopulate).toHaveBeenCalledWith('patient', 'name email phone');
      expect(mockPopulate).toHaveBeenCalledWith('doctor', 'name email');
      expect(mockPopulate).toHaveBeenCalledWith(
        'labTechnician',
        'name email employeeId'
      );
      expect(mockPopulate).toHaveBeenCalledWith('test');
      expect(response.status).toBe(200);
      expect(data.testRequest).toEqual(mockTestRequest);
    });

    it('should return 401 when user is not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = new NextRequest(
        `http://localhost:3000/api/lab/lab-test-requests/${mockContext.params.id}`
      );

      const response = await GET(request, mockContext);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
      expect(LabTestRequest.findById).not.toHaveBeenCalled();
    });

    it('should return 404 when test request is not found', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { role: 'DOCTOR', email: 'sovika@gamil.com' },
      } as any);

      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
      };
      (mockQuery as any).then = (resolve: any) => resolve(null);
      (LabTestRequest.findById as jest.Mock).mockReturnValue(mockQuery);

      const request = new NextRequest(
        `http://localhost:3000/api/lab/lab-test-requests/${mockContext.params.id}`
      );

      const response = await GET(request, mockContext);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Test request not found');
    });

    it('should return 400 for invalid ID format', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { role: 'DOCTOR', email: 'sovika@gamil.com' },
      } as any);

      const castError = new Error('Cast to ObjectId failed') as any;
      castError.name = 'CastError';

      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
      };
      (mockQuery as any).then = (resolve: any, reject: any) =>
        reject(castError);
      (LabTestRequest.findById as jest.Mock).mockReturnValue(mockQuery);

      const invalidContext = {
        params: { id: 'invalid-id' },
      };

      const request = new NextRequest(
        `http://localhost:3000/api/lab/lab-test-requests/invalid-id`
      );

      const response = await GET(request, invalidContext);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid ID format');
    });

    it('should return 500 on database error', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { role: 'DOCTOR', email: 'sovika@gamil.com' },
      } as any);

      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
      };
      (mockQuery as any).then = (resolve: any, reject: any) =>
        reject(new Error('Database error'));
      (LabTestRequest.findById as jest.Mock).mockReturnValue(mockQuery);

      const request = new NextRequest(
        `http://localhost:3000/api/lab/lab-test-requests/${mockContext.params.id}`
      );

      const response = await GET(request, mockContext);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });

    it('should handle connection errors', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { role: 'DOCTOR', email: 'sovika@gamil.com' },
      } as any);

      mockConnectDB.mockRejectedValue(new Error('Connection failed'));

      const request = new NextRequest(
        `http://localhost:3000/api/lab/lab-test-requests/${mockContext.params.id}`
      );

      const response = await GET(request, mockContext);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });

  describe('PATCH', () => {
    let mockTestRequestInstance: any;

    beforeEach(() => {
      mockTestRequestInstance = {
        ...mockTestRequest,
        save: jest.fn().mockResolvedValue(mockTestRequest),
        populate: jest.fn().mockResolvedValue(mockTestRequest),
        updateStatus: jest.fn().mockResolvedValue(undefined),
      };
    });

    it('should update allowed fields of a lab test request', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { role: 'LAB_TECHNICIAN', email: 'tech@example.com' },
      } as any);

      (LabTestRequest.findById as jest.Mock).mockResolvedValue(
        mockTestRequestInstance
      );

      const updateData = {
        results: 'Normal values',
        findings: 'No abnormalities detected',
        notes: 'Patient fasted for 12 hours',
        priority: 'urgent',
      };

      const request = new NextRequest(
        `http://localhost:3000/api/lab/lab-test-requests/${mockContext.params.id}`,
        {
          method: 'PATCH',
          body: JSON.stringify(updateData),
        }
      );

      const response = await PATCH(request, mockContext);
      const data = await response.json();

      expect(mockConnectDB).toHaveBeenCalled();
      expect(mockGetServerSession).toHaveBeenCalled();
      expect(LabTestRequest.findById).toHaveBeenCalledWith(
        mockContext.params.id
      );
      expect(mockTestRequestInstance.results).toBe(updateData.results);
      expect(mockTestRequestInstance.findings).toBe(updateData.findings);
      expect(mockTestRequestInstance.notes).toBe(updateData.notes);
      expect(mockTestRequestInstance.priority).toBe(updateData.priority);
      expect(mockTestRequestInstance.save).toHaveBeenCalled();
      expect(response.status).toBe(200);
      expect(data.testRequest).toBeDefined();
    });

    it('should update lab technician', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { role: 'ADMIN', email: 'jebarsanthatcroos18@outlook.com' },
      } as any);

      (LabTestRequest.findById as jest.Mock).mockResolvedValue(
        mockTestRequestInstance
      );

      const updateData = {
        labTechnician: 'new-tech-id',
      };

      const request = new NextRequest(
        `http://localhost:3000/api/lab/lab-test-requests/${mockContext.params.id}`,
        {
          method: 'PATCH',
          body: JSON.stringify(updateData),
        }
      );

      const response = await PATCH(request, mockContext);
      const data = await response.json();

      expect(mockTestRequestInstance.labTechnician).toBe('new-tech-id');
      expect(mockTestRequestInstance.save).toHaveBeenCalled();
      expect(response.status).toBe(200);
      expect(data.testRequest).toBeDefined();
    });

    it('should update status using updateStatus method', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { role: 'DOCTOR', email: 'sovika@gamil.com' },
      } as any);

      (LabTestRequest.findById as jest.Mock).mockResolvedValue(
        mockTestRequestInstance
      );

      const updateData = {
        status: 'completed',
      };

      const request = new NextRequest(
        `http://localhost:3000/api/lab/lab-test-requests/${mockContext.params.id}`,
        {
          method: 'PATCH',
          body: JSON.stringify(updateData),
        }
      );

      const response = await PATCH(request, mockContext);
      const data = await response.json();

      expect(mockTestRequestInstance.updateStatus).toHaveBeenCalledWith(
        'completed'
      );
      expect(mockTestRequestInstance.save).toHaveBeenCalled();
      expect(response.status).toBe(200);
      expect(data.testRequest).toBeDefined();
    });

    it('should populate related fields after update', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { role: 'DOCTOR', email: 'sovika@gamil.com' },
      } as any);

      (LabTestRequest.findById as jest.Mock).mockResolvedValue(
        mockTestRequestInstance
      );

      const updateData = {
        notes: 'Updated notes',
      };

      const request = new NextRequest(
        `http://localhost:3000/api/lab/lab-test-requests/${mockContext.params.id}`,
        {
          method: 'PATCH',
          body: JSON.stringify(updateData),
        }
      );

      const response = await PATCH(request, mockContext);

      expect(mockTestRequestInstance.populate).toHaveBeenCalledWith([
        { path: 'patient', select: 'name email' },
        { path: 'doctor', select: 'name email' },
        { path: 'labTechnician', select: 'name email employeeId' },
        { path: 'test' },
      ]);
      expect(response.status).toBe(200);
    });

    it('should ignore non-whitelisted fields', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { role: 'DOCTOR', email: 'sovika@gamil.com' },
      } as any);

      (LabTestRequest.findById as jest.Mock).mockResolvedValue(
        mockTestRequestInstance
      );

      const updateData = {
        results: 'Normal',
        patient: 'different-patient-id', // Should be ignored
        doctor: 'different-doctor-id', // Should be ignored
        createdAt: '2024-01-01', // Should be ignored
      };

      const request = new NextRequest(
        `http://localhost:3000/api/lab/lab-test-requests/${mockContext.params.id}`,
        {
          method: 'PATCH',
          body: JSON.stringify(updateData),
        }
      );

      await PATCH(request, mockContext);

      expect(mockTestRequestInstance.results).toBe('Normal');
      expect(mockTestRequestInstance.patient).not.toBe('different-patient-id');
      expect(mockTestRequestInstance.doctor).not.toBe('different-doctor-id');
    });

    it('should return 401 when user is not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = new NextRequest(
        `http://localhost:3000/api/lab/lab-test-requests/${mockContext.params.id}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ notes: 'Test' }),
        }
      );

      const response = await PATCH(request, mockContext);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
      expect(LabTestRequest.findById).not.toHaveBeenCalled();
    });

    it('should return 404 when test request is not found', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { role: 'DOCTOR', email: 'sovika@gamil.com' },
      } as any);

      (LabTestRequest.findById as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest(
        `http://localhost:3000/api/lab/lab-test-requests/${mockContext.params.id}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ notes: 'Test' }),
        }
      );

      const response = await PATCH(request, mockContext);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Test request not found');
    });

    it('should return 400 for validation errors', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { role: 'DOCTOR', email: 'sovika@gamil.com' },
      } as any);

      const validationError = new Error('Validation failed') as any;
      validationError.name = 'ValidationError';
      validationError.errors = {
        priority: { message: 'Invalid priority value' },
      };

      mockTestRequestInstance.save.mockRejectedValue(validationError);
      (LabTestRequest.findById as jest.Mock).mockResolvedValue(
        mockTestRequestInstance
      );

      const request = new NextRequest(
        `http://localhost:3000/api/lab/lab-test-requests/${mockContext.params.id}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ priority: 'invalid' }),
        }
      );

      const response = await PATCH(request, mockContext);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation Error');
      expect(data.details).toEqual(validationError.errors);
    });

    it('should return 400 for invalid ID format', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { role: 'DOCTOR', email: 'sovika@gamil.com' },
      } as any);

      const castError = new Error('Cast to ObjectId failed') as any;
      castError.name = 'CastError';

      (LabTestRequest.findById as jest.Mock).mockRejectedValue(castError);

      const invalidContext = {
        params: { id: 'invalid-id' },
      };

      const request = new NextRequest(
        `http://localhost:3000/api/lab/lab-test-requests/invalid-id`,
        {
          method: 'PATCH',
          body: JSON.stringify({ notes: 'Test' }),
        }
      );

      const response = await PATCH(request, invalidContext);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid ID format');
    });

    it('should return 500 on database error', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { role: 'DOCTOR', email: 'sovika@gamil.com' },
      } as any);

      (LabTestRequest.findById as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      const request = new NextRequest(
        `http://localhost:3000/api/lab/lab-test-requests/${mockContext.params.id}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ notes: 'Test' }),
        }
      );

      const response = await PATCH(request, mockContext);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });

    it('should handle connection errors', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { role: 'DOCTOR', email: 'sovika@gamil.com' },
      } as any);

      mockConnectDB.mockRejectedValue(new Error('Connection failed'));

      const request = new NextRequest(
        `http://localhost:3000/api/lab/lab-test-requests/${mockContext.params.id}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ notes: 'Test' }),
        }
      );

      const response = await PATCH(request, mockContext);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });

    it('should handle malformed JSON in request body', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { role: 'DOCTOR', email: 'sovika@gamil.com' },
      } as any);

      const request = {
        json: jest.fn().mockRejectedValue(new SyntaxError('Invalid JSON')),
      } as unknown as NextRequest;

      const response = await PATCH(request, mockContext);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });

    it('should update multiple allowed fields at once', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { role: 'LAB_TECHNICIAN', email: 'tech@example.com' },
      } as any);

      (LabTestRequest.findById as jest.Mock).mockResolvedValue(
        mockTestRequestInstance
      );

      const updateData = {
        results: 'Abnormal values detected',
        findings: 'High cholesterol',
        notes: 'Recommend follow-up',
        priority: 'high',
        labTechnician: 'tech-id-123',
        status: 'in_progress',
      };

      const request = new NextRequest(
        `http://localhost:3000/api/lab/lab-test-requests/${mockContext.params.id}`,
        {
          method: 'PATCH',
          body: JSON.stringify(updateData),
        }
      );

      const response = await PATCH(request, mockContext);
      const data = await response.json();

      expect(mockTestRequestInstance.results).toBe(updateData.results);
      expect(mockTestRequestInstance.findings).toBe(updateData.findings);
      expect(mockTestRequestInstance.notes).toBe(updateData.notes);
      expect(mockTestRequestInstance.priority).toBe(updateData.priority);
      expect(mockTestRequestInstance.labTechnician).toBe(
        updateData.labTechnician
      );
      expect(mockTestRequestInstance.updateStatus).toHaveBeenCalledWith(
        'in_progress'
      );
      expect(mockTestRequestInstance.save).toHaveBeenCalled();
      expect(response.status).toBe(200);
      expect(data.testRequest).toBeDefined();
    });

    it('should handle undefined values in allowed fields', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { role: 'DOCTOR', email: 'sovika@gamil.com' },
      } as any);

      const originalResults = mockTestRequestInstance.results;
      (LabTestRequest.findById as jest.Mock).mockResolvedValue(
        mockTestRequestInstance
      );

      const updateData = {
        results: undefined,
        notes: 'New notes',
      };

      const request = new NextRequest(
        `http://localhost:3000/api/lab/lab-test-requests/${mockContext.params.id}`,
        {
          method: 'PATCH',
          body: JSON.stringify(updateData),
        }
      );

      await PATCH(request, mockContext);

      // Results should not change if undefined is passed
      expect(mockTestRequestInstance.results).toBe(originalResults);
      expect(mockTestRequestInstance.notes).toBe('New notes');
    });
  });
});

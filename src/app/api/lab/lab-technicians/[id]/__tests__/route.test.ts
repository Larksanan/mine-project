/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-require-imports */

import { NextRequest } from 'next/server';
import { GET, PATCH, DELETE } from '../route';
import LabTechnician from '@/models/LabTechnician';

const mockExec = jest.fn();
const mockSelect = jest.fn();
const mockPopulate = jest.fn();

const mockChain = {
  populate: mockPopulate,
  select: mockSelect,
  exec: mockExec,
};

jest.mock('next/server', () => {
  return {
    NextRequest: class {
      url: string;
      method?: string;
      _body?: any;
      headers: any;

      constructor(url: string, init?: { method?: string; body?: any }) {
        this.url = url;
        this.method = init?.method;
        this._body = init?.body;
        this.headers = { get: () => null };
      }

      json() {
        try {
          return Promise.resolve(
            typeof this._body === 'string'
              ? JSON.parse(this._body)
              : this._body || {}
          );
        } catch (error) {
          return Promise.reject(new Error('Invalid JSON'));
        }
      }
    },
    NextResponse: {
      json: (data: any, init?: { status?: number }) => ({
        json: async () => data,
        status: init?.status || 200,
      }),
    },
  };
});

jest.mock('next-auth', () => ({
  __esModule: true,
  default: jest.fn(),
  getServerSession: jest.fn(),
}));

jest.mock('@/lib/mongodb', () => ({
  connectDB: jest.fn(),
}));

jest.mock('@/models/LabTechnician', () => ({
  __esModule: true,
  default: {
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
  },
}));

jest.mock('@/lib/auth', () => ({
  authOptions: {},
}));

describe('Lab Technician [id] API', () => {
  let getServerSession: jest.Mock;
  let connectDB: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    const nextAuth = require('next-auth');
    getServerSession = nextAuth.getServerSession;
    connectDB = require('@/lib/mongodb').connectDB;

    connectDB.mockResolvedValue(undefined);

    mockPopulate.mockReturnValue(mockChain);
    mockSelect.mockResolvedValue(null);

    (LabTechnician.findById as jest.Mock).mockReturnValue(mockChain);
    (LabTechnician.findByIdAndUpdate as jest.Mock).mockReturnValue(mockChain);
    (LabTechnician.findByIdAndDelete as jest.Mock).mockResolvedValue(null);
  });

  const mockAdminSession = {
    user: {
      id: 'admin123',
      email: 'jebarsanthatcroos@gmil.com',
      role: 'ADMIN',
    },
  };

  const mockLabTechSession = {
    user: {
      id: 'labtech123',
      email: 'larksanan@gmail.com',
      role: 'LABTECH',
    },
  };

  const mockTechnicianData = {
    _id: 'tech123',
    user: {
      _id: 'user123',
      name: 'Jebarsan Thatcroos',
      email: 'jebarsanthatcroos16@gmil.com',
      phone: '0771234567',
      profileImage: '/images/jebarsan.jpg',
    },
    employeeId: 'EMP001',
    specialization: 'Hematology',
    certifications: ['Cert1', 'Cert2'],
    yearsOfExperience: 5,
    isAvailable: true,
    currentWorkload: 2,
    maxConcurrentTests: 5,
    performanceScore: 95,
  };

  describe('GET /api/lab-technicians/[id]', () => {
    beforeEach(() => {
      getServerSession.mockResolvedValue(mockAdminSession);
    });

    it('should fetch lab technician by id successfully', async () => {
      mockSelect.mockResolvedValue(mockTechnicianData);

      const req = new NextRequest(
        'http://localhost:3000/api/lab-technicians/tech123'
      );

      const res = await GET(req, {
        params: Promise.resolve({ id: 'tech123' }),
      });

      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.technician).toBeDefined();
      expect(data.technician._id).toBe('tech123');
      expect(data.technician.user.name).toBe('Jebarsan Thatcroos');
      expect(LabTechnician.findById).toHaveBeenCalledWith('tech123');
      expect(mockPopulate).toHaveBeenCalledWith(
        'user',
        'name email phone profileImage'
      );
      expect(mockSelect).toHaveBeenCalledWith('-__v');
    });

    it('should return 401 when not authenticated', async () => {
      getServerSession.mockResolvedValue(null);

      const req = new NextRequest(
        'http://localhost:3000/api/lab-technicians/tech123'
      );

      const res = await GET(req, {
        params: Promise.resolve({ id: 'tech123' }),
      });

      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
      expect(LabTechnician.findById).not.toHaveBeenCalled();
    });

    it('should return 404 when technician not found', async () => {
      mockSelect.mockResolvedValue(null);

      const req = new NextRequest(
        'http://localhost:3000/api/lab-technicians/nonexistent'
      );

      const res = await GET(req, {
        params: Promise.resolve({ id: 'nonexistent' }),
      });

      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.error).toBe('Lab technician not found');
    });

    it('should handle database connection errors', async () => {
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      connectDB.mockRejectedValue(new Error('Database connection failed'));

      const req = new NextRequest(
        'http://localhost:3000/api/lab-technicians/tech123'
      );

      const res = await GET(req, {
        params: Promise.resolve({ id: 'tech123' }),
      });

      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toBe('Internal server error');
      consoleErrorSpy.mockRestore();
    });

    it('should handle findById errors', async () => {
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      mockSelect.mockRejectedValue(new Error('Query failed'));

      const req = new NextRequest(
        'http://localhost:3000/api/lab-technicians/tech123'
      );

      const res = await GET(req, {
        params: Promise.resolve({ id: 'tech123' }),
      });

      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toBe('Internal server error');
      consoleErrorSpy.mockRestore();
    });

    it('should exclude __v field from response', async () => {
      mockSelect.mockResolvedValue(mockTechnicianData);

      const req = new NextRequest(
        'http://localhost:3000/api/lab-technicians/tech123'
      );

      await GET(req, {
        params: Promise.resolve({ id: 'tech123' }),
      });

      expect(mockSelect).toHaveBeenCalledWith('-__v');
    });

    it('should work for any authenticated user', async () => {
      const userSession = {
        user: {
          id: 'user123',
          email: 'jebarsanthatcroos16@gmil.com',
          role: 'USER',
        },
      };

      getServerSession.mockResolvedValue(userSession);
      mockSelect.mockResolvedValue(mockTechnicianData);

      const req = new NextRequest(
        'http://localhost:3000/api/lab-technicians/tech123'
      );

      const res = await GET(req, {
        params: Promise.resolve({ id: 'tech123' }),
      });

      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.technician).toBeDefined();
    });
  });

  describe('PATCH /api/lab-technicians/[id]', () => {
    beforeEach(() => {
      getServerSession.mockResolvedValue(mockAdminSession);
    });

    const updateData = {
      specialization: 'Microbiology',
      yearsOfExperience: 6,
      isAvailable: false,
      performanceScore: 98,
    };

    it('should update lab technician successfully as ADMIN', async () => {
      const updatedTechnician = {
        ...mockTechnicianData,
        ...updateData,
      };

      mockPopulate.mockResolvedValue(updatedTechnician);

      const req = new NextRequest(
        'http://localhost:3000/api/lab-technicians/tech123',
        {
          method: 'PATCH',
          body: JSON.stringify(updateData),
        }
      );

      const res = await PATCH(req, {
        params: Promise.resolve({ id: 'tech123' }),
      });

      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.technician).toBeDefined();
      expect(data.technician.specialization).toBe('Microbiology');
      expect(LabTechnician.findByIdAndUpdate).toHaveBeenCalledWith(
        'tech123',
        updateData,
        { new: true, runValidators: true }
      );
    });

    it('should update lab technician successfully as LABTECH', async () => {
      getServerSession.mockResolvedValue(mockLabTechSession);

      const updatedTechnician = {
        ...mockTechnicianData,
        ...updateData,
      };

      mockPopulate.mockResolvedValue(updatedTechnician);

      const req = new NextRequest(
        'http://localhost:3000/api/lab-technicians/tech123',
        {
          method: 'PATCH',
          body: JSON.stringify(updateData),
        }
      );

      const res = await PATCH(req, {
        params: Promise.resolve({ id: 'tech123' }),
      });

      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.technician).toBeDefined();
    });

    it('should return 401 when not authenticated', async () => {
      getServerSession.mockResolvedValue(null);

      const req = new NextRequest(
        'http://localhost:3000/api/lab-technicians/tech123',
        {
          method: 'PATCH',
          body: JSON.stringify(updateData),
        }
      );

      const res = await PATCH(req, {
        params: Promise.resolve({ id: 'tech123' }),
      });

      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
      expect(LabTechnician.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it('should return 401 when user role is not ADMIN or LABTECH', async () => {
      const userSession = {
        user: {
          id: 'user123',
          email: 'jebarsanthatcroos16@gmil.com',
          role: 'USER',
        },
      };

      getServerSession.mockResolvedValue(userSession);

      const req = new NextRequest(
        'http://localhost:3000/api/lab-technicians/tech123',
        {
          method: 'PATCH',
          body: JSON.stringify(updateData),
        }
      );

      const res = await PATCH(req, {
        params: Promise.resolve({ id: 'tech123' }),
      });

      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 404 when technician not found', async () => {
      mockPopulate.mockResolvedValue(null);

      const req = new NextRequest(
        'http://localhost:3000/api/lab-technicians/nonexistent',
        {
          method: 'PATCH',
          body: JSON.stringify(updateData),
        }
      );

      const res = await PATCH(req, {
        params: Promise.resolve({ id: 'nonexistent' }),
      });

      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.error).toBe('Lab technician not found');
    });

    it('should exclude protected fields from update', async () => {
      const bodyWithProtectedFields = {
        ...updateData,
        user: 'different-user',
        employeeId: 'NEW-EMP',
        _id: 'different-id',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedTechnician = {
        ...mockTechnicianData,
        ...updateData,
      };

      mockPopulate.mockResolvedValue(updatedTechnician);

      const req = new NextRequest(
        'http://localhost:3000/api/lab-technicians/tech123',
        {
          method: 'PATCH',
          body: JSON.stringify(bodyWithProtectedFields),
        }
      );

      await PATCH(req, {
        params: Promise.resolve({ id: 'tech123' }),
      });

      // Verify protected fields are not in the update
      expect(LabTechnician.findByIdAndUpdate).toHaveBeenCalledWith(
        'tech123',
        expect.not.objectContaining({
          user: expect.anything(),
          employeeId: expect.anything(),
          _id: expect.anything(),
          createdAt: expect.anything(),
          updatedAt: expect.anything(),
        }),
        { new: true, runValidators: true }
      );
    });

    it('should handle validation errors', async () => {
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      const validationError = {
        name: 'ValidationError',
        errors: {
          specialization: { message: 'Invalid specialization' },
          performanceScore: { message: 'Score must be between 0 and 100' },
        },
      };

      mockPopulate.mockRejectedValue(validationError);

      const req = new NextRequest(
        'http://localhost:3000/api/lab-technicians/tech123',
        {
          method: 'PATCH',
          body: JSON.stringify({ performanceScore: 150 }),
        }
      );

      const res = await PATCH(req, {
        params: Promise.resolve({ id: 'tech123' }),
      });

      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe('Validation error');
      expect(data.details).toBeDefined();
      expect(Array.isArray(data.details)).toBe(true);
      consoleErrorSpy.mockRestore();
    });

    it('should run validators during update', async () => {
      const updatedTechnician = {
        ...mockTechnicianData,
        ...updateData,
      };

      mockPopulate.mockResolvedValue(updatedTechnician);

      const req = new NextRequest(
        'http://localhost:3000/api/lab-technicians/tech123',
        {
          method: 'PATCH',
          body: JSON.stringify(updateData),
        }
      );

      await PATCH(req, {
        params: Promise.resolve({ id: 'tech123' }),
      });

      expect(LabTechnician.findByIdAndUpdate).toHaveBeenCalledWith(
        'tech123',
        expect.any(Object),
        { new: true, runValidators: true }
      );
    });

    it('should handle partial updates', async () => {
      const partialUpdate = { isAvailable: false };

      const updatedTechnician = {
        ...mockTechnicianData,
        isAvailable: false,
      };

      mockPopulate.mockResolvedValue(updatedTechnician);

      const req = new NextRequest(
        'http://localhost:3000/api/lab-technicians/tech123',
        {
          method: 'PATCH',
          body: JSON.stringify(partialUpdate),
        }
      );

      const res = await PATCH(req, {
        params: Promise.resolve({ id: 'tech123' }),
      });

      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.technician.isAvailable).toBe(false);
    });

    it('should handle empty update body', async () => {
      const updatedTechnician = mockTechnicianData;

      mockPopulate.mockResolvedValue(updatedTechnician);

      const req = new NextRequest(
        'http://localhost:3000/api/lab-technicians/tech123',
        {
          method: 'PATCH',
          body: JSON.stringify({}),
        }
      );

      const res = await PATCH(req, {
        params: Promise.resolve({ id: 'tech123' }),
      });

      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.technician).toBeDefined();
    });

    it('should handle database connection errors', async () => {
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      connectDB.mockRejectedValue(new Error('Database connection failed'));

      const req = new NextRequest(
        'http://localhost:3000/api/lab-technicians/tech123',
        {
          method: 'PATCH',
          body: JSON.stringify(updateData),
        }
      );

      const res = await PATCH(req, {
        params: Promise.resolve({ id: 'tech123' }),
      });

      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toBe('Internal server error');
      consoleErrorSpy.mockRestore();
    });

    it('should handle invalid JSON in request body', async () => {
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      const req = new NextRequest(
        'http://localhost:3000/api/lab-technicians/tech123',
        {
          method: 'PATCH',
          body: 'invalid json',
        }
      );

      const res = await PATCH(req, {
        params: Promise.resolve({ id: 'tech123' }),
      });

      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toBe('Internal server error');
      consoleErrorSpy.mockRestore();
    });

    it('should populate user fields after update', async () => {
      const updatedTechnician = {
        ...mockTechnicianData,
        ...updateData,
      };

      mockPopulate.mockResolvedValue(updatedTechnician);

      const req = new NextRequest(
        'http://localhost:3000/api/lab-technicians/tech123',
        {
          method: 'PATCH',
          body: JSON.stringify(updateData),
        }
      );

      await PATCH(req, {
        params: Promise.resolve({ id: 'tech123' }),
      });

      expect(mockPopulate).toHaveBeenCalledWith(
        'user',
        'name email phone profileImage'
      );
    });

    it('should handle session without role', async () => {
      getServerSession.mockResolvedValue({
        user: { id: 'user123', email: 'jebarsanthatcroos16@gmil.com' },
      });

      const req = new NextRequest(
        'http://localhost:3000/api/lab-technicians/tech123',
        {
          method: 'PATCH',
          body: JSON.stringify(updateData),
        }
      );

      const res = await PATCH(req, {
        params: Promise.resolve({ id: 'tech123' }),
      });

      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('DELETE /api/lab-technicians/[id]', () => {
    beforeEach(() => {
      getServerSession.mockResolvedValue(mockAdminSession);
    });

    it('should delete lab technician successfully', async () => {
      (LabTechnician.findByIdAndDelete as jest.Mock).mockResolvedValue(
        mockTechnicianData
      );

      const req = new NextRequest(
        'http://localhost:3000/api/lab-technicians/tech123',
        {
          method: 'DELETE',
        }
      );

      const res = await DELETE(req, {
        params: Promise.resolve({ id: 'tech123' }),
      });

      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.message).toBe('Lab technician deleted successfully');
      expect(LabTechnician.findByIdAndDelete).toHaveBeenCalledWith('tech123');
    });

    it('should return 401 when not authenticated', async () => {
      getServerSession.mockResolvedValue(null);

      const req = new NextRequest(
        'http://localhost:3000/api/lab-technicians/tech123',
        {
          method: 'DELETE',
        }
      );

      const res = await DELETE(req, {
        params: Promise.resolve({ id: 'tech123' }),
      });

      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
      expect(LabTechnician.findByIdAndDelete).not.toHaveBeenCalled();
    });

    it('should return 401 when user is not ADMIN', async () => {
      getServerSession.mockResolvedValue(mockLabTechSession);

      const req = new NextRequest(
        'http://localhost:3000/api/lab-technicians/tech123',
        {
          method: 'DELETE',
        }
      );

      const res = await DELETE(req, {
        params: Promise.resolve({ id: 'tech123' }),
      });

      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 404 when technician not found', async () => {
      (LabTechnician.findByIdAndDelete as jest.Mock).mockResolvedValue(null);

      const req = new NextRequest(
        'http://localhost:3000/api/lab-technicians/nonexistent',
        {
          method: 'DELETE',
        }
      );

      const res = await DELETE(req, {
        params: Promise.resolve({ id: 'nonexistent' }),
      });

      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.error).toBe('Lab technician not found');
    });

    it('should handle database connection errors', async () => {
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      connectDB.mockRejectedValue(new Error('Database connection failed'));

      const req = new NextRequest(
        'http://localhost:3000/api/lab-technicians/tech123',
        {
          method: 'DELETE',
        }
      );

      const res = await DELETE(req, {
        params: Promise.resolve({ id: 'tech123' }),
      });

      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toBe('Internal server error');
      consoleErrorSpy.mockRestore();
    });

    it('should handle delete errors', async () => {
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      (LabTechnician.findByIdAndDelete as jest.Mock).mockRejectedValue(
        new Error('Delete failed')
      );

      const req = new NextRequest(
        'http://localhost:3000/api/lab-technicians/tech123',
        {
          method: 'DELETE',
        }
      );

      const res = await DELETE(req, {
        params: Promise.resolve({ id: 'tech123' }),
      });

      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toBe('Internal server error');
      consoleErrorSpy.mockRestore();
    });

    it('should only allow ADMIN role to delete', async () => {
      const userSession = {
        user: {
          id: 'user123',
          email: 'jebarsanthatcroos16@gmil.com',
          role: 'USER',
        },
      };

      getServerSession.mockResolvedValue(userSession);

      const req = new NextRequest(
        'http://localhost:3000/api/lab-technicians/tech123',
        {
          method: 'DELETE',
        }
      );

      const res = await DELETE(req, {
        params: Promise.resolve({ id: 'tech123' }),
      });

      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });
  });
});

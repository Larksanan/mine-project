// CRITICAL: Set up environment and mocks BEFORE any imports
process.env.MONGODB_URI = 'mongodb://localhost:27017/test-db';
process.env.NEXTAUTH_SECRET = 'c305ovj/L8OWzTHVm2Pe31WFa4URPq7SxLQv8h7BabM=';
process.env.NEXTAUTH_URL = 'http://localhost:3000';

// Mock dependencies BEFORE importing the route
jest.mock('@/lib/mongodb');
jest.mock('@/models/User');
jest.mock('bcryptjs');

import { POST, GET, OPTIONS } from '@/app/api/auth/signup/route';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

describe('POST /api/auth/signup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (connectDB as jest.Mock).mockResolvedValue(undefined);
  });

  describe('Content Type Validation', () => {
    it('should reject non-JSON content type', async () => {
      const req = new Request('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        headers: { 'content-type': 'text/plain' },
        body: 'invalid',
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(415);
      expect(data.message).toBe('Content-Type must be application/json');
    });

    it('should reject invalid JSON body', async () => {
      const req = new Request('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: 'invalid json',
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.message).toBe('Invalid JSON in request body');
    });
  });

  describe('Input Validation', () => {
    it('should validate name with minimum length', async () => {
      const req = new Request('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: 'A',
          email: 'test@example.com',
          nic: '123456789V',
          password: 'Password123!',
        }),
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.message).toBe('Name must be at least 2 characters');
      expect(data.field).toBe('name');
    });

    it('should validate name with maximum length', async () => {
      const req = new Request('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: 'A'.repeat(51),
          email: 'test@example.com',
          nic: '123456789V',
          password: 'Password123!',
        }),
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.message).toBe('Name must be less than 50 characters');
    });

    it('should validate name contains only letters and spaces', async () => {
      const req = new Request('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: 'Jebarsan123',
          email: 'test@example.com',
          nic: '123456789V',
          password: 'Password123!',
        }),
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.message).toBe('Name can only contain letters and spaces');
    });

    it('should validate email format', async () => {
      const req = new Request('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: 'Jebarsan Thatcroos',
          email: 'invalid-email',
          nic: '123456789V',
          password: 'Password123!',
        }),
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.message).toBe('Please enter a valid email address');
    });

    it('should require email', async () => {
      const req = new Request('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: 'Jebarsan Thatcroos',
          email: '',
          nic: '123456789V',
          password: 'Password123!',
        }),
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.message).toBe('Please enter a valid email address');
    });

    it('should validate NIC format', async () => {
      const req = new Request('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: 'Jebarsan Thatcroos',
          email: 'test@example.com',
          nic: '12345',
          password: 'Password123!',
        }),
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.message).toBe(
        'NIC must be either 9 digits followed by V/X or 12 digits'
      );
    });

    it('should require NIC', async () => {
      const req = new Request('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: 'Jebarsan Thatcroos',
          email: 'test@example.com',
          nic: '',
          password: 'Password123!',
        }),
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.message).toBe('NIC is required');
    });

    it.skip('should validate password minimum length', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      (User.create as jest.Mock).mockResolvedValue({ _id: 'user123' });

      const req = new Request('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: 'Jebarsan Thatcroos',
          email: 'test@example.com',
          nic: '123456789V',
          password: 'Pa1!',
        }),
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.message).toBe('Password must be at least 6 characters');
    });

    it('should validate password contains uppercase', async () => {
      const req = new Request('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: 'Jebarsan Thatcroos',
          email: 'test@example.com',
          nic: '123456789V',
          password: 'password123!',
        }),
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.message).toBe(
        'Password must contain at least one uppercase letter'
      );
    });

    it('should validate password contains lowercase', async () => {
      const req = new Request('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: 'Jebarsan Thatcroos',
          email: 'test@example.com',
          nic: '123456789V',
          password: 'PASSWORD123!',
        }),
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.message).toBe(
        'Password must contain at least one lowercase letter'
      );
    });

    it('should validate password contains number', async () => {
      const req = new Request('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: 'Jebarsan Thatcroos',
          email: 'test@example.com',
          nic: '123456789V',
          password: 'Password!',
        }),
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.message).toBe('Password must contain at least one number');
    });

    it('should validate password contains special character', async () => {
      const req = new Request('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: 'Jebarsan Thatcroos',
          email: 'test@example.com',
          nic: '123456789V',
          password: 'Password123',
        }),
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.message).toBe(
        'Password must contain at least one special character'
      );
    });

    it('should validate phone number format', async () => {
      const req = new Request('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: 'Jebarsan Thatcroos',
          email: 'test@example.com',
          nic: '123456789V',
          password: 'Password123!',
          phone: '123',
        }),
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.message).toBe('Please enter a valid phone number');
    });
  });

  describe('Data Transformation', () => {
    it('should trim and transform name', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      (User.create as jest.Mock).mockResolvedValue({
        _id: 'user123',
        name: 'Jebarsan Thatcroos',
        email: 'test@example.com',
        nic: '123456789V',
        role: 'USER',
        isActive: true,
        createdAt: new Date(),
      });

      const req = new Request('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: '  Jebarsan Thatcroos  ',
          email: 'test@example.com',
          nic: '123456789v',
          password: 'Password123!',
        }),
      });

      await POST(req);

      expect(User.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Jebarsan Thatcroos',
        })
      );
    });

    it('should lowercase and trim email', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      (User.create as jest.Mock).mockResolvedValue({
        _id: 'user123',
        name: 'Jebarsan Thatcroos',
        email: 'test@example.com',
        nic: '123456789V',
        role: 'USER',
        isActive: true,
        createdAt: new Date(),
      });

      const req = new Request('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: 'Jebarsan Thatcroos',
          email: 'TEST@EXAMPLE.COM',
          nic: '123456789V',
          password: 'Password123!',
        }),
      });

      await POST(req);

      expect(User.findOne).toHaveBeenCalledWith({
        email: 'test@example.com',
      });
    });

    it('should uppercase and trim NIC', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      (User.create as jest.Mock).mockResolvedValue({
        _id: 'user123',
        name: 'Jebarsan Thatcroos',
        email: 'test@example.com',
        nic: '123456789V',
        role: 'USER',
        isActive: true,
        createdAt: new Date(),
      });

      const req = new Request('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: 'Jebarsan Thatcroos',
          email: 'test@example.com',
          nic: '123456789v',
          password: 'Password123!',
        }),
      });

      await POST(req);

      expect(User.findOne).toHaveBeenCalledWith({ nic: '123456789V' });
    });
  });

  describe('Duplicate User Checks', () => {
    it('should reject duplicate email', async () => {
      (User.findOne as jest.Mock).mockResolvedValueOnce({
        email: 'test@example.com',
      });

      const req = new Request('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: 'Jebarsan Thatcroos',
          email: 'test@example.com',
          nic: '123456789V',
          password: 'Password123!',
        }),
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.message).toBe('User already exists with this email');
      expect(data.field).toBe('email');
    });

    it('should reject duplicate NIC', async () => {
      (User.findOne as jest.Mock)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ nic: '123456789V' });

      const req = new Request('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: 'Jebarsan Thatcroos',
          email: 'test@example.com',
          nic: '123456789V',
          password: 'Password123!',
        }),
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.message).toBe('This NIC is already registered');
      expect(data.field).toBe('nic');
    });
  });

  describe('Password Security', () => {
    it.skip('should reject common password: password', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);

      const req = new Request('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: 'Jebarsan Thatcroos',
          email: 'test@example.com',
          nic: '123456789V',
          password: 'Password1!',
        }),
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.message).toBe('Please choose a stronger password');
      expect(data.field).toBe('password');
    });

    it('should hash password with 12 salt rounds', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      (User.create as jest.Mock).mockResolvedValue({
        _id: 'user123',
        name: 'Jebarsan Thatcroos',
        email: 'test@example.com',
        nic: '123456789V',
        role: 'USER',
        isActive: true,
        createdAt: new Date(),
      });

      const req = new Request('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: 'Jebarsan Thatcroos',
          email: 'test@example.com',
          nic: '123456789V',
          password: 'SecurePass123!',
        }),
      });

      await POST(req);

      expect(bcrypt.hash).toHaveBeenCalledWith('SecurePass123!', 12);
    });
  });

  describe('Successful Registration', () => {
    it('should create user with valid data', async () => {
      const mockUser = {
        _id: 'user123',
        name: 'Jebarsan Thatcroos',
        email: 'test@example.com',
        nic: '123456789V',
        role: 'USER',
        phone: '+94771234567',
        department: 'IT',
        specialization: 'Software Engineering',
        isActive: true,
        createdAt: new Date('2024-01-01'),
      };

      (User.findOne as jest.Mock).mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      (User.create as jest.Mock).mockResolvedValue(mockUser);

      const req = new Request('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: 'Jebarsan Thatcroos',
          email: 'test@example.com',
          nic: '123456789V',
          password: 'SecurePass123!',
          role: 'USER',
          phone: '+94771234567',
          department: 'IT',
          specialization: 'Software Engineering',
        }),
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.message).toBe('User created successfully');
      expect(data.user.name).toBe('Jebarsan Thatcroos');
      expect(data.user.email).toBe('test@example.com');
      expect(data.user.nic).toBe('123456789V');
    });

    it('should accept valid 12-digit NIC', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      (User.create as jest.Mock).mockResolvedValue({
        _id: 'user123',
        name: 'Jebarsan Thatcroos',
        email: 'test@example.com',
        nic: '200012345678',
        role: 'USER',
        isActive: true,
        createdAt: new Date(),
      });

      const req = new Request('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: 'Jebarsan Thatcroos',
          email: 'test@example.com',
          nic: '200012345678',
          password: 'SecurePass123!',
        }),
      });

      const response = await POST(req);
      expect(response.status).toBe(201);
    });

    it('should set default role to USER', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      (User.create as jest.Mock).mockResolvedValue({
        _id: 'user123',
        name: 'Jebarsan Thatcroos',
        email: 'test@example.com',
        nic: '123456789V',
        role: 'USER',
        isActive: true,
        createdAt: new Date(),
      });

      const req = new Request('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: 'Jebarsan Thatcroos',
          email: 'test@example.com',
          nic: '123456789V',
          password: 'SecurePass123!',
        }),
      });

      await POST(req);

      expect(User.create).toHaveBeenCalledWith(
        expect.objectContaining({
          role: 'USER',
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle MongoDB duplicate key error', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      (User.create as jest.Mock).mockRejectedValue({
        code: 11000,
        keyPattern: { email: 1 },
      });

      const req = new Request('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: 'Jebarsan Thatcroos',
          email: 'test@example.com',
          nic: '123456789V',
          password: 'SecurePass123!',
        }),
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.message).toBe('User already exists with this email');
    });

    it('should handle network errors', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      (User.create as jest.Mock).mockRejectedValue({
        name: 'MongoNetworkError',
      });

      const req = new Request('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: 'Jebarsan Thatcroos',
          email: 'test@example.com',
          nic: '123456789V',
          password: 'SecurePass123!',
        }),
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.message).toBe(
        'Database connection failed. Please try again.'
      );
    });
  });
});

describe('GET /api/auth/signup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (connectDB as jest.Mock).mockResolvedValue(undefined);
  });

  describe('Email Availability Check', () => {
    it('should return available when email does not exist', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);

      const req = new Request(
        'http://localhost:3000/api/auth/signup?email=test@example.com'
      );

      const response = await GET(req);
      if (!response) throw new Error('Response is undefined');

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.available).toBe(true);
      expect(data.message).toBe('Email available');
    });

    it('should return unavailable when email exists', async () => {
      (User.findOne as jest.Mock).mockResolvedValue({
        email: 'test@example.com',
      });

      const req = new Request(
        'http://localhost:3000/api/auth/signup?email=test@example.com'
      );

      const response = await GET(req);
      if (!response) throw new Error('Response is undefined');

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.available).toBe(false);
      expect(data.message).toBe('Email already taken');
    });
  });

  describe('NIC Availability Check', () => {
    it('should return available when NIC does not exist', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);

      const req = new Request(
        'http://localhost:3000/api/auth/signup?nic=123456789V'
      );

      const response = await GET(req);
      if (!response) throw new Error('Response is undefined');

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.available).toBe(true);
      expect(data.message).toBe('NIC available');
    });
  });

  it('should require email or NIC parameter', async () => {
    const req = new Request('http://localhost:3000/api/auth/signup');

    const response = await GET(req);
    if (!response) throw new Error('Response is undefined');

    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.message).toBe('Email or NIC parameter is required');
  });
});

describe('OPTIONS /api/auth/signup', () => {
  it('should return CORS headers', async () => {
    const response = await OPTIONS();

    expect(response.status).toBe(200);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(response.headers.get('Access-Control-Allow-Methods')).toBe(
      'POST, GET, OPTIONS'
    );
  });
});

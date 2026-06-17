import { POST, GET } from '@/app/api/auth/register/route';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

// Mock dependencies
jest.mock('@/lib/mongodb');
jest.mock('@/models/User');
jest.mock('bcryptjs');

describe('POST /api/auth/register', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (connectDB as jest.Mock).mockResolvedValue(undefined);
  });

  describe('Content Type Validation', () => {
    it('should reject non-JSON content type', async () => {
      const req = new Request('http://localhost:3000/api/auth/register', {
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
      const req = new Request('http://localhost:3000/api/auth/register', {
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
      const req = new Request('http://localhost:3000/api/auth/register', {
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
      const req = new Request('http://localhost:3000/api/auth/register', {
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
      const req = new Request('http://localhost:3000/api/auth/register', {
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
      const req = new Request('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: 'Jebarsanthatcroos',
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

    it('should validate NIC format (9 digits + V/X)', async () => {
      const req = new Request('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: 'Jebarsanthatcroos',
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

    it('should validate password contains uppercase letter', async () => {
      const req = new Request('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: 'Jebarsanthatcroos',
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

    it('should validate password contains lowercase letter', async () => {
      const req = new Request('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: 'Jebarsanthatcroos',
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
      const req = new Request('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: 'Jebarsanthatcroos',
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
      const req = new Request('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: 'Jebarsanthatcroos',
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
      const req = new Request('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: 'Jebarsanthatcroos',
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
        name: 'Jebarsanthatcroos',
        email: 'test@example.com',
        nic: '123456789V',
        role: 'USER',
        isActive: true,
        createdAt: new Date(),
      });

      const req = new Request('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: '  Jebarsanthatcroos   ',
          email: 'test@example.com',
          nic: '123456789v',
          password: 'Password123!',
        }),
      });

      await POST(req);

      expect(User.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Jebarsanthatcroos',
        })
      );
    });

    it('should lowercase and trim email', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      (User.create as jest.Mock).mockResolvedValue({
        _id: 'user123',
        name: 'Jebarsanthatcroos',
        email: 'test@example.com',
        nic: '123456789V',
        role: 'USER',
        isActive: true,
        createdAt: new Date(),
      });

      const req = new Request('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: 'Jebarsanthatcroos',
          email: 'TEST@EXAMPLE.COM',
          nic: '123456789v',
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
        name: 'Jebarsanthatcroos',
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
          name: 'Jebarsanthatcroos',
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

      const req = new Request('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: 'Jebarsanthatcroos',
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

      const req = new Request('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: 'Jebarsanthatcroos',
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
    it('should reject common passwords', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);

      const req = new Request('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: 'Jebarsanthatcroos',
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
      expect(data.field).toBe('password');
    });

    it('should hash password with 12 salt rounds', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      (User.create as jest.Mock).mockResolvedValue({
        _id: 'user123',
        name: 'Jebarsanthatcroos',
        email: 'test@example.com',
        nic: '123456789V',
        role: 'USER',
        isActive: true,
        createdAt: new Date(),
      });

      const req = new Request('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: 'Jebarsanthatcroos',
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
        name: 'Jebarsanthatcroos',
        email: 'test@example.com',
        nic: '123456789V',
        role: 'USER',
        phone: '+1234567890',
        department: 'IT',
        specialization: 'Software',
        isActive: true,
        createdAt: new Date('2024-01-01'),
      };

      (User.findOne as jest.Mock).mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      (User.create as jest.Mock).mockResolvedValue(mockUser);

      const req = new Request('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: 'Jebarsanthatcroos',
          email: 'test@example.com',
          nic: '123456789V',
          password: 'SecurePass123!',
          role: 'USER',
          phone: '+1234567890',
          department: 'IT',
          specialization: 'Software',
        }),
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.message).toBe('User created successfully');
      expect(data.user).toEqual({
        id: 'user123',
        name: 'Jebarsanthatcroos',
        email: 'test@example.com',
        nic: '123456789V',
        role: 'USER',
        phone: '+1234567890',
        department: 'IT',
        specialization: 'Software',
        isActive: true,
        createdAt: mockUser.createdAt.toISOString(),
      });
    });

    it('should accept valid 12-digit NIC', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      (User.create as jest.Mock).mockResolvedValue({
        _id: 'user123',
        name: 'Jebarsanthatcroos',
        email: 'test@example.com',
        nic: '200012345678',
        role: 'USER',
        isActive: true,
        createdAt: new Date(),
      });

      const req = new Request('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: 'Jebarsanthatcroos',
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
        name: 'Jebarsanthatcroos',
        email: 'test@example.com',
        nic: '123456789V',
        role: 'USER',
        isActive: true,
        createdAt: new Date(),
      });

      const req = new Request('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: 'Jebarsanthatcroos',
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

      const req = new Request('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: 'Jebarsanthatcroos',
          email: 'test@example.com',
          nic: '123456789V',
          password: 'SecurePass123!',
        }),
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.message).toBe('User already exists with this email');
      expect(data.field).toBe('email');
    });

    it('should handle Mongoose validation error', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      (User.create as jest.Mock).mockRejectedValue({
        name: 'ValidationError',
        errors: {
          email: { message: 'Invalid email format' },
        },
      });

      const req = new Request('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: 'Jebarsanthatcroos',
          email: 'test@example.com',
          nic: '123456789V',
          password: 'SecurePass123!',
        }),
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.message).toBe('Invalid email format');
      expect(data.field).toBe('email');
    });

    it('should handle MongoDB network error', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      (User.create as jest.Mock).mockRejectedValue({
        name: 'MongoNetworkError',
      });

      const req = new Request('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: 'Jebarsanthatcroos',
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

    it('should handle bcrypt errors', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockRejectedValue(new Error('bcrypt error'));

      const req = new Request('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: 'Jebarsanthatcroos',
          email: 'test@example.com',
          nic: '123456789V',
          password: 'SecurePass123!',
        }),
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.message).toBe('Error processing password');
    });

    it('should handle generic errors', async () => {
      (User.findOne as jest.Mock).mockRejectedValue(new Error('Unknown error'));

      const req = new Request('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: 'Jebarsanthatcroos',
          email: 'test@example.com',
          nic: '123456789V',
          password: 'SecurePass123!',
        }),
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.message).toBe('Internal server error');
    });
  });
});

describe('GET /api/auth/register', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (connectDB as jest.Mock).mockResolvedValue(undefined);
  });

  describe('Email Availability Check', () => {
    it('should return available when email does not exist', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);

      const req = new Request(
        'http://localhost:3000/api/auth/register?email=test@example.com'
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
        'http://localhost:3000/api/auth/register?email=test@example.com'
      );

      const response = await GET(req);
      if (!response) throw new Error('Response is undefined');

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.available).toBe(false);
      expect(data.message).toBe('Email already taken');
    });

    it('should validate email format', async () => {
      const req = new Request(
        'http://localhost:3000/api/auth/register?email=invalid-email'
      );

      const response = await GET(req);
      if (!response) throw new Error('Response is undefined');

      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.message).toBe('Please enter a valid email address');
    });
  });

  describe('NIC Availability Check', () => {
    it('should return available when NIC does not exist', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);

      const req = new Request(
        'http://localhost:3000/api/auth/register?nic=123456789V'
      );

      const response = await GET(req);
      if (!response) throw new Error('Response is undefined');

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.available).toBe(true);
      expect(data.message).toBe('NIC available');
    });

    it('should return unavailable when NIC exists', async () => {
      (User.findOne as jest.Mock).mockResolvedValue({ nic: '123456789V' });

      const req = new Request(
        'http://localhost:3000/api/auth/register?nic=123456789V'
      );

      const response = await GET(req);
      if (!response) throw new Error('Response is undefined');

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.available).toBe(false);
      expect(data.message).toBe('NIC already registered');
    });

    it('should validate NIC format', async () => {
      const req = new Request(
        'http://localhost:3000/api/auth/register?nic=invalid'
      );

      const response = await GET(req);
      if (!response) throw new Error('Response is undefined');

      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.message).toBe('Please enter a valid NIC');
    });
  });

  it('should require email or NIC parameter', async () => {
    const req = new Request('http://localhost:3000/api/auth/register');

    const response = await GET(req);
    if (!response) throw new Error('Response is undefined');

    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.message).toBe('Email or NIC parameter is required');
  });

  it('should handle errors gracefully', async () => {
    (User.findOne as jest.Mock).mockRejectedValue(new Error('Database error'));

    const req = new Request(
      'http://localhost:3000/api/auth/signup?email=test@example.com'
    );

    const response = await GET(req);
    if (!response) throw new Error('Response is undefined');

    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.message).toBe('Internal server error');
  });
});

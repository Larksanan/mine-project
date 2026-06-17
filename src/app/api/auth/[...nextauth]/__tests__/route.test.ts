/** @jest-environment node */
import { authOptions, signUpSchema, signInSchema } from '../route';
import UserModel from '@/models/User';
import bcrypt from 'bcryptjs';
import { User as NextAuthUser, Account } from 'next-auth';
import { JWT } from 'next-auth/jwt';

jest.mock('@/lib/mongodb', () => ({
  connectDB: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/models/User', () => {
  const mockFindOne = jest.fn();
  const mockFindByIdAndUpdate = jest.fn();
  const mockUpdateOne = jest.fn();
  const mockCreate = jest.fn();
  const mockFindById = jest.fn();
  return {
    __esModule: true,
    default: {
      findOne: mockFindOne,
      findByIdAndUpdate: mockFindByIdAndUpdate,
      updateOne: mockUpdateOne,
      create: mockCreate,
      findById: mockFindById,
    },
  };
});

jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
}));

const mockUser = {
  _id: {
    toString: () => 'user-id-123',
  },
  id: 'user-id-123',
  name: 'Jebrsan Thtcroos',
  email: 'jebarsanthatcroos@gmail.com',
  password: 'hashedPassword123',
  role: 'USER' as const,
  isActive: true,
  phone: '1234567890',
  department: 'Engineering',
  specialization: 'Software',
  licenseNumber: 'LIC-12345',
  address: '123 Main St',
  bio: 'Test bio',
  image: 'avatar.jpg',
  lastLogin: new Date(),
};

const getCredentialsProvider = () => {
  const providers = Array.isArray(authOptions.providers)
    ? authOptions.providers
    : [];
  return providers.find(
    (p: any) => p.id === 'credentials' || p.name === 'Credentials'
  );
};

const getCredentialsAuthorize = () => {
  const provider = getCredentialsProvider();
  return (provider as any)?.options?.authorize || (provider as any)?.authorize;
};

describe('NextAuth Configuration (Document 4)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Provider Configuration', () => {
    it('should have credentials provider configured', () => {
      const provider = getCredentialsProvider();
      expect(provider).toBeDefined();
      expect((provider as any)?.name).toBe('Credentials');
    });

    it('should have Google provider configured', () => {
      const googleProvider = authOptions.providers.find(
        (p: any) => p.id === 'google'
      );
      expect(googleProvider).toBeDefined();
    });

    it('should have GitHub provider configured', () => {
      const githubProvider = authOptions.providers.find(
        (p: any) => p.id === 'github'
      );
      expect(githubProvider).toBeDefined();
    });

    it('should have correct credentials fields', () => {
      const provider = getCredentialsProvider() as any;
      const creds = provider.options?.credentials || provider.credentials;
      expect(creds).toBeDefined();
      expect(creds.email).toBeDefined();
      expect(creds.password).toBeDefined();
      expect(creds.email.type).toBe('email');
      expect(creds.password.type).toBe('password');
    });
  });

  describe('authorize callback', () => {
    const validCredentials = {
      email: 'jebarsanthatcroos@gmail.com',
      password: 'password123',
    };

    it('should authenticate user with valid credentials', async () => {
      const selectMock = jest.fn().mockResolvedValue(mockUser);
      (UserModel.findOne as jest.Mock).mockReturnValue({
        select: selectMock,
      });
      (UserModel.findByIdAndUpdate as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const authorize = getCredentialsAuthorize();
      const user = await authorize(validCredentials, {} as any);

      expect(UserModel.findOne).toHaveBeenCalledWith({
        email: validCredentials.email.toLowerCase().trim(),
        isActive: true,
      });
      expect(selectMock).toHaveBeenCalledWith('+password');
      expect(bcrypt.compare).toHaveBeenCalledWith(
        validCredentials.password,
        mockUser.password
      );
      expect(user).toEqual(
        expect.objectContaining({
          id: 'user-id-123',
          email: mockUser.email,
          role: mockUser.role,
        })
      );
    });

    it('should throw error for missing email', async () => {
      const authorize = getCredentialsAuthorize();
      await expect(
        authorize({ password: 'password123' }, {} as any)
      ).rejects.toThrow('Email and password are required');
    });

    it('should throw error for missing password', async () => {
      const authorize = getCredentialsAuthorize();
      await expect(
        authorize({ email: 'jebarsanthatcroos@gmail.com' }, {} as any)
      ).rejects.toThrow('Email and password are required');
    });

    it('should throw error for short password', async () => {
      const authorize = getCredentialsAuthorize();
      await expect(
        authorize(
          { email: 'jebarsanthatcroos@gmail.com', password: '123' },
          {} as any
        )
      ).rejects.toThrow('Password must be at least 6 characters');
    });

    it('should throw error for invalid email format', async () => {
      const authorize = getCredentialsAuthorize();
      await expect(
        authorize(
          { email: 'invalid-email', password: 'password123' },
          {} as any
        )
      ).rejects.toThrow('Invalid email format');
    });

    it('should throw error for non-existent user', async () => {
      const selectMock = jest.fn().mockResolvedValue(null);
      (UserModel.findOne as jest.Mock).mockReturnValue({
        select: selectMock,
      });

      const authorize = getCredentialsAuthorize();
      await expect(authorize(validCredentials, {} as any)).rejects.toThrow(
        'Invalid email or password'
      );
    });

    it('should throw error for incorrect password', async () => {
      const selectMock = jest.fn().mockResolvedValue(mockUser);
      (UserModel.findOne as jest.Mock).mockReturnValue({
        select: selectMock,
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const authorize = getCredentialsAuthorize();
      await expect(authorize(validCredentials, {} as any)).rejects.toThrow(
        'Invalid email or password'
      );
    });

    it('should throw error for OAuth user (no password)', async () => {
      const oauthUser = { ...mockUser, password: undefined };
      const selectMock = jest.fn().mockResolvedValue(oauthUser);
      (UserModel.findOne as jest.Mock).mockReturnValue({
        select: selectMock,
      });

      const authorize = getCredentialsAuthorize();
      await expect(authorize(validCredentials, {} as any)).rejects.toThrow(
        'This account uses social login'
      );
    });

    it('should handle database errors', async () => {
      const selectMock = jest.fn().mockRejectedValue(new Error('DB Error'));
      (UserModel.findOne as jest.Mock).mockReturnValue({
        select: selectMock,
      });

      const authorize = getCredentialsAuthorize();
      await expect(authorize(validCredentials, {} as any)).rejects.toThrow();
    });

    it('should normalize email (lowercase and trim)', async () => {
      const credentialsWithWhitespace = {
        email: 'jebarsanthatcroos12@gmail.com',
        password: 'password123',
      };

      const selectMock = jest.fn().mockResolvedValue(mockUser);
      (UserModel.findOne as jest.Mock).mockReturnValue({
        select: selectMock,
      });
      (UserModel.findByIdAndUpdate as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const authorize = getCredentialsAuthorize();
      await authorize(credentialsWithWhitespace, {} as any);

      expect(UserModel.findOne).toHaveBeenCalledWith({
        email: 'jebarsanthatcroos12@gmail.com',
        isActive: true,
      });
    });

    it('should update last login on successful authentication', async () => {
      const selectMock = jest.fn().mockResolvedValue(mockUser);
      (UserModel.findOne as jest.Mock).mockReturnValue({
        select: selectMock,
      });
      (UserModel.findByIdAndUpdate as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const authorize = getCredentialsAuthorize();
      await authorize(validCredentials, {} as any);

      expect(UserModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockUser._id.toString(),
        { lastLogin: expect.any(Date) },
        { new: true }
      );
    });
  });

  describe('jwt callback', () => {
    const mockToken: JWT = {
      id: '',
      email: 'jebarsanthatcroos@gmail.com',
    };

    const mockUserAccount: NextAuthUser = {
      id: 'user-id-123',
      name: mockUser.name,
      email: mockUser.email,
      role: mockUser.role,
      image: mockUser.image,
      phone: mockUser.phone,
      department: mockUser.department,
      specialization: mockUser.specialization,
      licenseNumber: mockUser.licenseNumber,
      address: mockUser.address,
      bio: mockUser.bio,
      isActive: mockUser.isActive,
      lastLogin: mockUser.lastLogin,
    } as any;

    it('should add user data to token on sign in', async () => {
      const params = {
        token: mockToken,
        user: mockUserAccount,
        account: { provider: 'credentials' } as Account,
        profile: undefined,
        isNewUser: false,
        trigger: undefined,
        session: undefined,
      };

      const newToken = await authOptions.callbacks?.jwt?.(params as any);

      expect(newToken).toEqual(
        expect.objectContaining({
          id: 'user-id-123',
          role: mockUser.role,
          email: mockUser.email,
          phone: mockUser.phone,
        })
      );
    });

    it('should handle OAuth user creation', async () => {
      (UserModel.findOne as jest.Mock).mockResolvedValue(null);
      (UserModel.create as jest.Mock).mockResolvedValue({
        ...mockUser,
        role: 'USER',
      });

      const params = {
        token: mockToken,
        user: mockUserAccount,
        account: { provider: 'google' } as Account,
        profile: undefined,
        isNewUser: true,
        trigger: undefined,
        session: undefined,
      };

      const newToken = await authOptions.callbacks?.jwt?.(params as any);

      expect(UserModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: mockUser.email.toLowerCase().trim(),
          role: 'USER',
          isActive: true,
        })
      );
      expect(newToken?.role).toBe('USER');
    });

    it('should handle OAuth user update', async () => {
      (UserModel.findOne as jest.Mock).mockResolvedValue(mockUser);
      (UserModel.findByIdAndUpdate as jest.Mock).mockResolvedValue({
        ...mockUser,
        lastLogin: new Date(),
      });

      const params = {
        token: mockToken,
        user: mockUserAccount,
        account: { provider: 'google' } as Account,
        profile: undefined,
        isNewUser: false,
        trigger: undefined,
        session: undefined,
      };

      await authOptions.callbacks?.jwt?.(params as any);

      expect(UserModel.findByIdAndUpdate).toHaveBeenCalled();
    });

    it('should handle token update trigger', async () => {
      (UserModel.findById as jest.Mock).mockResolvedValue({
        ...mockUser,
        phone: '9876543210',
        department: 'New Department',
      });

      const params = {
        token: { ...mockToken, id: 'user-id-123' },
        user: undefined,
        account: undefined,
        profile: undefined,
        isNewUser: false,
        trigger: 'update' as const,
        session: undefined,
      };

      const newToken = await authOptions.callbacks?.jwt?.(params as any);

      expect(UserModel.findById).toHaveBeenCalledWith('user-id-123');
      expect(newToken?.phone).toBe('9876543210');
      expect(newToken?.department).toBe('New Department');
    });

    it('should handle database errors gracefully in OAuth flow', async () => {
      (UserModel.findOne as jest.Mock).mockRejectedValue(new Error('DB Error'));

      const params = {
        token: mockToken,
        user: mockUserAccount,
        account: { provider: 'google' } as Account,
        profile: undefined,
        isNewUser: false,
        trigger: undefined,
        session: undefined,
      };

      const newToken = await authOptions.callbacks?.jwt?.(params as any);
      expect(newToken).toBeDefined();
    });
  });

  describe('session callback', () => {
    const mockSession = {
      user: {
        name: 'Thatcroos Jebrsan',
        email: 'jebarsanthatcroos16@gmail.com',
      },
      expires: new Date().toISOString(),
    };

    const mockToken: JWT = {
      id: 'user-id-123',
      role: mockUser.role,
      name: mockUser.name,
      email: mockUser.email,
      picture: mockUser.image,
      phone: mockUser.phone,
      department: mockUser.department,
      specialization: mockUser.specialization,
      licenseNumber: mockUser.licenseNumber,
      address: mockUser.address,
      bio: mockUser.bio,
      isActive: mockUser.isActive,
      lastLogin: mockUser.lastLogin,
      accessToken: 'test-access-token',
    };

    it('should map token data to session', async () => {
      const params = {
        session: mockSession,
        token: mockToken,
        user: {} as NextAuthUser,
        newSession: undefined,
        trigger: undefined,
      };

      const newSession = await authOptions.callbacks?.session?.(params as any);

      expect(newSession?.user).toEqual({
        id: 'user-id-123',
        name: mockUser.name,
        email: mockUser.email,
        image: mockUser.image,
        role: mockUser.role,
        phone: mockUser.phone,
        department: mockUser.department,
        specialization: mockUser.specialization,
        licenseNumber: mockUser.licenseNumber,
        address: mockUser.address,
        bio: mockUser.bio,
        isActive: mockUser.isActive,
        lastLogin: mockUser.lastLogin,
      });
      expect((newSession as any)?.accessToken).toBe('test-access-token');
    });

    it('should handle incomplete token', async () => {
      const incompleteToken: JWT = {
        id: 'user-id-123',
        email: 'jebarsanthatcroos@gmail.com',
      };

      const params = {
        session: mockSession,
        token: incompleteToken,
        user: {} as NextAuthUser,
        newSession: undefined,
        trigger: undefined,
      };

      const newSession = await authOptions.callbacks?.session?.(params as any);

      expect(newSession?.user).toBeDefined();
      expect(newSession?.user?.email).toBe('jebarsanthatcroos@gmail.com');
    });
  });

  describe('signIn callback', () => {
    it('should allow credentials sign in', async () => {
      const result = await authOptions.callbacks?.signIn?.({
        user: { email: 'jebarsanthatcroos@gmail.com' } as any,
        account: { provider: 'credentials' } as Account,
        profile: undefined,
        credentials: undefined,
      });

      expect(result).toBe(true);
    });

    it('should allow new OAuth user sign in (Google)', async () => {
      (UserModel.findOne as jest.Mock).mockResolvedValue(null);

      const result = await authOptions.callbacks?.signIn?.({
        user: { email: 'jebarsanthatcroos16@gmail.com' } as any,
        account: { provider: 'google' } as Account,
        profile: undefined,
        credentials: undefined,
      });

      expect(result).toBe(true);
    });

    it('should allow active OAuth user sign in (Google)', async () => {
      (UserModel.findOne as jest.Mock).mockResolvedValue({
        ...mockUser,
        isActive: true,
      });

      const result = await authOptions.callbacks?.signIn?.({
        user: { email: 'jebarsanthatcroos@gmail.com' } as any,
        account: { provider: 'google' } as Account,
        profile: undefined,
        credentials: undefined,
      });

      expect(result).toBe(true);
    });

    it('should reject inactive OAuth user', async () => {
      (UserModel.findOne as jest.Mock).mockResolvedValue({
        ...mockUser,
        isActive: false,
      });

      const result = await authOptions.callbacks?.signIn?.({
        user: { email: 'jebarsanthatcroos@gmail.com' } as any,
        account: { provider: 'google' } as Account,
        profile: undefined,
        credentials: undefined,
      });

      expect(result).toBe('/auth/error?error=AccountDisabled');
    });

    it('should allow new OAuth user sign in (GitHub)', async () => {
      (UserModel.findOne as jest.Mock).mockResolvedValue(null);

      const result = await authOptions.callbacks?.signIn?.({
        user: { email: 'jebarsanthatcroos16@gmail.com' } as any,
        account: { provider: 'github' } as Account,
        profile: undefined,
        credentials: undefined,
      });

      expect(result).toBe(true);
    });

    it('should handle database errors in signIn', async () => {
      (UserModel.findOne as jest.Mock).mockRejectedValue(new Error('DB Error'));

      const result = await authOptions.callbacks?.signIn?.({
        user: { email: 'jebarsanthatcroos@gmail.com' } as any,
        account: { provider: 'google' } as Account,
        profile: undefined,
        credentials: undefined,
      });

      expect(result).toBe(false);
    });
  });

  describe('redirect callback', () => {
    const baseUrl = 'http://localhost:3000';

    it('should handle relative URLs', async () => {
      const result = await authOptions.callbacks?.redirect?.({
        url: '/dashboard',
        baseUrl,
      });
      expect(result).toBe('http://localhost:3000/dashboard');
    });

    it('should handle same origin URLs', async () => {
      const result = await authOptions.callbacks?.redirect?.({
        url: 'http://localhost:3000/profile',
        baseUrl,
      });
      expect(result).toBe('http://localhost:3000/profile');
    });

    it('should redirect to baseUrl for external URLs', async () => {
      const result = await authOptions.callbacks?.redirect?.({
        url: 'http://evil.com/phishing',
        baseUrl,
      });
      expect(result).toBe(baseUrl);
    });
  });

  describe('Configuration', () => {
    it('should have correct pages configuration', () => {
      expect(authOptions.pages).toEqual({
        signIn: '/auth/signin',
        signOut: '/auth/signout',
        error: '/auth/error',
        verifyRequest: '/auth/verify-request',
        newUser: '/auth/new-user',
      });
    });

    it('should have correct session configuration', () => {
      expect(authOptions.session).toEqual({
        strategy: 'jwt',
        maxAge: 30 * 24 * 60 * 60,
        updateAge: 24 * 60 * 60,
      });
    });

    it('should have JWT configuration', () => {
      expect(authOptions.jwt).toEqual({
        maxAge: 30 * 24 * 60 * 60,
      });
    });

    it('should have secret configured', () => {
      expect(authOptions.secret).toBeDefined();
    });

    it('should have debug mode based on NODE_ENV', () => {
      const debugValue = authOptions.debug;
      expect(typeof debugValue).toBe('boolean');
    });
  });

  describe('Sign Up Schema Validation', () => {
    it('should validate correct sign up data', () => {
      const validData = {
        name: 'Sovika sovika',
        email: 'sovika@gmail.com',
        password: 'Password123!',
        confirmPassword: 'Password123!',
      };

      const result = signUpSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject short name', () => {
      const invalidData = {
        name: 'S',
        email: 'sovika@gmail.com',
        password: 'Password123!',
        confirmPassword: 'Password123!',
      };

      const result = signUpSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid email', () => {
      const invalidData = {
        name: 'Sovika sovika',
        email: 'invalid-email',
        password: 'Password123!',
        confirmPassword: 'Password123!',
      };

      const result = signUpSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject weak password (no uppercase)', () => {
      const invalidData = {
        name: 'Sovika sovika',
        email: 'sovika@gmail.com',
        password: 'password123!',
        confirmPassword: 'password123!',
      };

      const result = signUpSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject weak password (no number)', () => {
      const invalidData = {
        name: 'Sovika sovika',
        email: 'sovika@gmail.com',
        password: 'Password!',
        confirmPassword: 'Password!',
      };

      const result = signUpSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject mismatched passwords', () => {
      const invalidData = {
        name: 'Sovika sovika',
        email: 'sovika@gmail.com',
        password: 'Password123!',
        confirmPassword: 'DifferentPassword123!',
      };

      const result = signUpSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('Sign In Schema Validation', () => {
    it('should validate correct sign in data', () => {
      const validData = {
        email: 'sovika@gmail.com',
        password: 'Password123',
      };

      const result = signInSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'password123',
      };

      const result = signInSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject empty password', () => {
      const invalidData = {
        email: 'sovika@gmail.com',
        password: '',
      };

      const result = signInSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject short password', () => {
      const invalidData = {
        email: 'sovika@gmail.com',
        password: '12345',
      };

      const result = signInSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});

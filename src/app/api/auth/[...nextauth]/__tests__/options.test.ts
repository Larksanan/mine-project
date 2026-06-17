/** * @jest-environment node */
import { authOptions } from '../option';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { User as NextAuthUser, Account, Profile } from 'next-auth';
import { JWT } from 'next-auth/jwt';

// Mock dependencies
jest.mock('@/lib/mongodb', () => ({
  connectDB: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/models/User', () => {
  const mockFindOne = jest.fn();
  const mockFindByIdAndUpdate = jest.fn();
  const mockUpdateOne = jest.fn();
  const mockCreate = jest.fn();
  return {
    __esModule: true,
    default: {
      findOne: mockFindOne,
      findByIdAndUpdate: mockFindByIdAndUpdate,
      updateOne: mockUpdateOne,
      create: mockCreate,
    },
    findOne: mockFindOne,
    findByIdAndUpdate: mockFindByIdAndUpdate,
    updateOne: mockUpdateOne,
    create: mockCreate,
  };
});

jest.mock('bcryptjs');

const mockUser = {
  _id: {
    toString: () => 'user-id-123',
  },
  id: 'user-id-123',
  name: 'Test User',
  email: 'test@example.com',
  password: 'hashedpassword',
  role: 'PATIENT' as const,
  isActive: true,
  phone: '1234567890',
  department: 'Department',
  specialization: 'Specialization',
  address: '123 Street',
  bio: 'Bio',
  image: 'image.jpg',
  lastLogin: new Date(),
};

// Helper to get credentials provider
const getCredentialsProvider = () => {
  const providers = Array.isArray(authOptions.providers)
    ? authOptions.providers
    : [];
  return providers.find(
    (p: any) => p.id === 'credentials' || p.name === 'Credentials'
  );
};

// Helper to get credentials authorize function
const getCredentialsAuthorize = () => {
  const provider = getCredentialsProvider();
  return (provider as any)?.options?.authorize || (provider as any)?.authorize;
};

describe('NextAuth Configuration (options.ts)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Suppress console errors in tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Credentials Provider Configuration', () => {
    it('should have credentials provider configured', () => {
      const provider = getCredentialsProvider();
      expect(provider).toBeDefined();
      expect((provider as any)?.name).toBe('Credentials');
    });

    it('should have authorize function defined', () => {
      const authorize = getCredentialsAuthorize();
      expect(typeof authorize).toBe('function');
    });

    it('should have correct credentials fields', () => {
      const provider = getCredentialsProvider() as any;
      expect(provider).toBeDefined();

      const creds = provider.options?.credentials || provider.credentials;
      expect(creds).toBeDefined();
      expect(creds.email).toBeDefined();
      expect(creds.password).toBeDefined();
      expect(creds.email.type).toBe('text');
      expect(creds.password.type).toBe('password');
    });
  });

  describe('authorize callback', () => {
    const credentials = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should return user object for valid credentials', async () => {
      const selectMock = jest.fn().mockResolvedValue(mockUser);
      (User.findOne as jest.Mock).mockReturnValue({
        select: selectMock,
      });
      (User.findByIdAndUpdate as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const authorize = getCredentialsAuthorize();
      const user = await authorize(credentials, {} as any);

      expect(User.findOne).toHaveBeenCalledWith({
        email: credentials.email.toLowerCase().trim(),
        isActive: true,
      });
      expect(selectMock).toHaveBeenCalledWith('+password');
      expect(bcrypt.compare).toHaveBeenCalledWith(
        credentials.password,
        mockUser.password
      );
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(mockUser._id, {
        lastLogin: expect.any(Date),
      });
      expect(user).toEqual({
        id: 'user-id-123',
        name: mockUser.name,
        email: mockUser.email,
        role: mockUser.role,
        image: mockUser.image,
        phone: mockUser.phone,
        department: mockUser.department,
        specialization: mockUser.specialization,
        address: mockUser.address,
        bio: mockUser.bio,
        isActive: mockUser.isActive,
        lastLogin: mockUser.lastLogin,
      });
    });

    it('should throw error for non-existent user', async () => {
      const selectMock = jest.fn().mockResolvedValue(null);
      (User.findOne as jest.Mock).mockReturnValue({
        select: selectMock,
      });

      const authorize = getCredentialsAuthorize();

      await expect(authorize(credentials, {} as any)).rejects.toThrow(
        'Invalid email or password'
      );
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('should throw error for incorrect password', async () => {
      const selectMock = jest.fn().mockResolvedValue(mockUser);
      (User.findOne as jest.Mock).mockReturnValue({
        select: selectMock,
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const authorize = getCredentialsAuthorize();

      await expect(authorize(credentials, {} as any)).rejects.toThrow(
        'Invalid email or password'
      );
    });

    it('should throw error if credentials are not provided', async () => {
      const authorize = getCredentialsAuthorize();

      await expect(authorize(undefined, {} as any)).rejects.toThrow(
        'Email and password are required'
      );
      expect(User.findOne).not.toHaveBeenCalled();
    });

    it('should handle database connection errors', async () => {
      const selectMock = jest
        .fn()
        .mockRejectedValue(new Error('Database error'));
      (User.findOne as jest.Mock).mockReturnValue({
        select: selectMock,
      });

      const authorize = getCredentialsAuthorize();

      await expect(authorize(credentials, {} as any)).rejects.toThrow(
        'Database error'
      );
    });

    it('should not find inactive users', async () => {
      const selectMock = jest.fn().mockResolvedValue(null);
      (User.findOne as jest.Mock).mockReturnValue({
        select: selectMock,
      });

      const authorize = getCredentialsAuthorize();

      await expect(authorize(credentials, {} as any)).rejects.toThrow(
        'Invalid email or password'
      );

      // Verify the query includes isActive: true
      expect(User.findOne).toHaveBeenCalledWith({
        email: credentials.email.toLowerCase().trim(),
        isActive: true,
      });
    });

    it('should reject user without password (OAuth user)', async () => {
      const oauthUser = { ...mockUser, password: undefined };
      const selectMock = jest.fn().mockResolvedValue(oauthUser);
      (User.findOne as jest.Mock).mockReturnValue({
        select: selectMock,
      });

      const authorize = getCredentialsAuthorize();

      await expect(authorize(credentials, {} as any)).rejects.toThrow(
        'This account uses social login'
      );
    });

    it('should validate email format', async () => {
      const invalidCredentials = {
        email: 'invalid-email',
        password: 'password123',
      };

      const authorize = getCredentialsAuthorize();

      await expect(authorize(invalidCredentials, {} as any)).rejects.toThrow(
        'Invalid email format'
      );
      expect(User.findOne).not.toHaveBeenCalled();
    });

    it('should validate password length', async () => {
      const shortPasswordCredentials = {
        email: 'test@example.com',
        password: '123',
      };

      const authorize = getCredentialsAuthorize();

      await expect(
        authorize(shortPasswordCredentials, {} as any)
      ).rejects.toThrow('Password must be at least 6 characters');
      expect(User.findOne).not.toHaveBeenCalled();
    });

    it('should normalize email (lowercase and trim)', async () => {
      const credentialsWithWhitespace = {
        email: '  TEST@EXAMPLE.COM  ',
        password: 'password123',
      };

      const selectMock = jest.fn().mockResolvedValue(mockUser);
      (User.findOne as jest.Mock).mockReturnValue({
        select: selectMock,
      });
      (User.findByIdAndUpdate as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const authorize = getCredentialsAuthorize();
      await authorize(credentialsWithWhitespace, {} as any);

      expect(User.findOne).toHaveBeenCalledWith({
        email: 'test@example.com',
        isActive: true,
      });
    });
  });

  describe('signIn callback', () => {
    it('should handle credentials provider sign in', async () => {
      (User.updateOne as jest.Mock).mockResolvedValue({ modifiedCount: 1 });

      const result = await authOptions.callbacks?.signIn?.({
        user: { email: 'test@example.com' } as any,
        account: { provider: 'credentials' } as Account,
        profile: undefined,
        credentials: undefined,
      });

      expect(result).toBe(true);
      expect(User.updateOne).toHaveBeenCalledWith(
        { email: 'test@example.com' },
        { $set: { lastLogin: expect.any(Date) } }
      );
    });

    it('should create new user for OAuth (Google)', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);
      (User.create as jest.Mock).mockResolvedValue(mockUser);

      const result = await authOptions.callbacks?.signIn?.({
        user: {
          name: 'New User',
          email: 'new@example.com',
          image: 'avatar.jpg',
        } as any,
        account: { provider: 'google' } as Account,
        profile: undefined,
        credentials: undefined,
      });

      expect(result).toBe(true);
      expect(User.create).toHaveBeenCalledWith({
        name: 'New User',
        email: 'new@example.com',
        image: 'avatar.jpg',
        role: 'USER',
        phone: '',
        department: '',
        specialization: '',
        address: '',
        bio: '',
        isActive: true,
        lastLogin: expect.any(Date),
      });
    });

    it('should update existing user for OAuth sign in', async () => {
      (User.findOne as jest.Mock).mockResolvedValue({
        ...mockUser,
        isActive: true,
      });
      (User.findByIdAndUpdate as jest.Mock).mockResolvedValue(mockUser);

      const result = await authOptions.callbacks?.signIn?.({
        user: {
          name: 'Updated Name',
          email: 'test@example.com',
          image: 'new-avatar.jpg',
        } as any,
        account: { provider: 'google' } as Account,
        profile: undefined,
        credentials: undefined,
      });

      expect(result).toBe(true);
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        mockUser._id,
        {
          $set: {
            name: 'Updated Name',
            image: 'new-avatar.jpg',
            lastLogin: expect.any(Date),
          },
        },
        { new: true }
      );
    });

    it('should reject inactive user OAuth sign in', async () => {
      (User.findOne as jest.Mock).mockResolvedValue({
        ...mockUser,
        isActive: false,
      });

      const result = await authOptions.callbacks?.signIn?.({
        user: {
          email: 'inactive@example.com',
        } as any,
        account: { provider: 'google' } as Account,
        profile: undefined,
        credentials: undefined,
      });

      expect(result).toBe('/auth/error?error=AccountDisabled');
    });

    it('should handle GitHub without email', async () => {
      const result = await authOptions.callbacks?.signIn?.({
        user: {
          name: 'GitHub User',
          email: undefined,
        } as any,
        account: { provider: 'github' } as Account,
        profile: undefined,
        credentials: undefined,
      });

      expect(typeof result).toBe('string');
      expect(result).toContain('/auth/error');
    });
  });

  describe('jwt callback', () => {
    const mockToken: JWT = {
      name: 'Old Name',
      email: 'old@example.com',
      id: '',
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
      address: mockUser.address,
      bio: mockUser.bio,
      isActive: mockUser.isActive,
      lastLogin: mockUser.lastLogin,
    } as any;

    it('should add user details to the token on initial sign-in', async () => {
      (User.findOne as jest.Mock).mockResolvedValue({
        ...mockUser,
      });

      const params = {
        token: mockToken,
        user: mockUserAccount,
        account: {
          provider: 'credentials',
          access_token: 'test-token',
        } as Account,
        profile: {} as Profile,
        isNewUser: false,
        trigger: undefined,
        session: undefined,
      };

      const newToken = await authOptions.callbacks?.jwt?.(params);

      expect(newToken).toEqual(
        expect.objectContaining({
          id: 'user-id-123',
          role: mockUser.role,
          name: mockUser.name,
          email: mockUser.email,
          phone: mockUser.phone,
          department: mockUser.department,
          specialization: mockUser.specialization,
          address: mockUser.address,
          bio: mockUser.bio,
          accessToken: 'test-token',
        })
      );
    });

    it('should refresh user data from database', async () => {
      (User.findOne as jest.Mock).mockResolvedValue({
        ...mockUser,
        name: 'Updated Name',
        phone: '9876543210',
      });

      const existingToken: JWT = {
        ...mockToken,
        id: 'user-id-123',
        role: mockUser.role,
        email: 'test@example.com',
      };

      const params = {
        token: existingToken,
        user: undefined,
        account: undefined,
        profile: undefined,
        isNewUser: false,
        trigger: undefined,
        session: undefined,
      };

      const returnedToken = await authOptions.callbacks?.jwt?.(params as any);

      expect(returnedToken).toEqual(
        expect.objectContaining({
          id: 'user-id-123',
          email: 'test@example.com',
          name: 'Updated Name',
          phone: '9876543210',
        })
      );
    });

    it('should handle session update trigger', async () => {
      // Mock database to return updated user data
      (User.findOne as jest.Mock).mockResolvedValue({
        ...mockUser,
        _id: { toString: () => 'user-id-123' },
        name: 'Session Updated Name', // This will be returned from DB refresh
        phone: '5555555555',
        department: 'New Department',
        specialization: 'New Spec',
        address: 'New Address',
        bio: 'New Bio',
      });

      const params = {
        token: { ...mockToken, email: 'test@example.com' },
        user: undefined,
        account: undefined,
        profile: undefined,
        isNewUser: false,
        trigger: 'update' as const,
        session: {
          user: {
            name: 'Session Updated Name',
            phone: '5555555555',
            department: 'New Department',
            specialization: 'New Spec',
            address: 'New Address',
            bio: 'New Bio',
          },
        },
      };

      const newToken = await authOptions.callbacks?.jwt?.(params as any);

      // The token gets session values first, then DB refresh overwrites them
      expect(newToken?.name).toBe('Session Updated Name');
      expect(newToken?.phone).toBe('5555555555');
      expect(newToken?.department).toBe('New Department');
    });

    it('should handle missing user in database', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);

      const params = {
        token: { ...mockToken, email: 'test@example.com' },
        user: undefined,
        account: undefined,
        profile: undefined,
        isNewUser: false,
        trigger: undefined,
        session: undefined,
      };

      const newToken = await authOptions.callbacks?.jwt?.(params as any);

      expect(newToken).toBeDefined();
      expect(newToken?.email).toBe('test@example.com');
    });

    it('should handle database errors gracefully', async () => {
      (User.findOne as jest.Mock).mockRejectedValue(new Error('DB Error'));

      const params = {
        token: { ...mockToken, email: 'test@example.com' },
        user: undefined,
        account: undefined,
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
        name: 'Old Name',
        email: 'old@example.com',
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
      address: mockUser.address,
      bio: mockUser.bio,
      isActive: mockUser.isActive,
      lastLogin: mockUser.lastLogin,
      accessToken: 'test-access-token',
    };

    it('should map token data to session user object', async () => {
      const params = {
        session: mockSession,
        token: mockToken,
        user: {} as NextAuthUser,
        newSession: undefined,
        trigger: undefined,
      };

      const newSession = await authOptions.callbacks?.session?.(params as any);

      expect(newSession?.user).toBeDefined();
      expect(newSession?.user).toEqual({
        id: 'user-id-123',
        role: mockUser.role,
        name: mockUser.name,
        email: mockUser.email,
        image: mockUser.image,
        phone: mockUser.phone,
        department: mockUser.department,
        specialization: mockUser.specialization,
        address: mockUser.address,
        bio: mockUser.bio,
        isActive: mockUser.isActive,
        lastLogin: mockUser.lastLogin,
      });
      expect((newSession as any)?.accessToken).toBe('test-access-token');
    });

    it('should handle incomplete token gracefully', async () => {
      const incompleteToken: JWT = {
        name: 'Incomplete User',
        email: 'test@example.com',
        id: '',
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
      expect(newSession?.user?.name).toBe('Incomplete User');
      expect(newSession?.user?.email).toBe('test@example.com');
    });

    it('should handle empty token', async () => {
      const params = {
        session: mockSession,
        token: {} as JWT,
        user: {} as NextAuthUser,
        newSession: undefined,
        trigger: undefined,
      };

      const newSession = await authOptions.callbacks?.session?.(params as any);

      expect(newSession?.user).toBeDefined();
    });
  });

  describe('redirect callback', () => {
    const baseUrl = 'http://localhost:3000';

    it('should handle relative URLs', async () => {
      const url = '/dashboard';
      const result = await authOptions.callbacks?.redirect?.({ url, baseUrl });
      expect(result).toBe('http://localhost:3000/dashboard');
    });

    it('should handle same origin URLs', async () => {
      const url = 'http://localhost:3000/profile';
      const result = await authOptions.callbacks?.redirect?.({ url, baseUrl });
      expect(result).toBe('http://localhost:3000/profile');
    });

    it('should redirect to baseUrl for external URLs', async () => {
      const url = 'http://evil.com/phishing';
      const result = await authOptions.callbacks?.redirect?.({ url, baseUrl });
      expect(result).toBe(baseUrl);
    });
  });

  describe('Configuration Properties', () => {
    it('should have correct pages configuration', () => {
      expect(authOptions.pages).toBeDefined();
      expect(authOptions.pages?.signIn).toBe('/auth/signin');
      expect(authOptions.pages?.signOut).toBe('/auth/signout');
      expect(authOptions.pages?.error).toBe('/auth/error');
    });

    it('should have correct session configuration', () => {
      expect(authOptions.session).toBeDefined();
      expect(authOptions.session?.strategy).toBe('jwt');
      expect(authOptions.session?.maxAge).toBe(30 * 24 * 60 * 60);
    });

    it('should have secret configured', () => {
      expect(authOptions.secret).toBeDefined();
    });

    it('should have debug mode based on NODE_ENV', () => {
      // Just verify the debug getter exists and works
      const debugValue = authOptions.debug;
      expect(typeof debugValue).toBe('boolean');

      // In test environment, debug should be false
      expect(debugValue).toBe(false);
    });

    it('should have Google provider configured', () => {
      const providers = authOptions.providers;
      const googleProvider = providers.find((p: any) => p.id === 'google');
      expect(googleProvider).toBeDefined();
    });

    it('should have GitHub provider configured', () => {
      const providers = authOptions.providers;
      const githubProvider = providers.find((p: any) => p.id === 'github');
      expect(githubProvider).toBeDefined();
      expect(
        (githubProvider as any).options?.authorization?.params?.scope
      ).toContain('user:email');
    });

    it('should have Credentials provider configured', () => {
      const provider = getCredentialsProvider();
      expect(provider).toBeDefined();
    });
  });

  describe('Events', () => {
    it('should not log events in test environment', async () => {
      const consoleSpy = jest.spyOn(console, 'log');

      await authOptions.events?.signIn?.({
        user: { email: 'test@example.com' } as any,
        account: { provider: 'credentials' } as Account,
        profile: undefined,
        isNewUser: false,
      });

      expect(consoleSpy).not.toHaveBeenCalled();
    });
  });
});

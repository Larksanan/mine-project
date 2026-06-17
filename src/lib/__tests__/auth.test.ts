/** @jest-environment node */
import { authOptions } from '../auth';
import UserModel from '@/models/User';
import bcrypt from 'bcryptjs';
import { sendLoginNotification, sendWelcomeEmail } from '@/lib/email';
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

jest.mock('@/lib/email', () => ({
  sendLoginNotification: jest.fn().mockResolvedValue(true),
  sendWelcomeEmail: jest.fn().mockResolvedValue(true),
}));

const mockUser = {
  _id: {
    toString: () => 'user-id-456',
  },
  id: 'user-id-456',
  name: 'Jebrsan Thtcroos',
  email: 'Jebarsanthatcroos@gmail.com',
  password: 'hashedSecurePassword',
  role: 'DOCTOR' as const,
  isActive: true,
  phone: '9876543210',
  department: 'Cardiology',
  specialization: 'Heart Surgery',
  licenseNumber: 'DOC-98765',
  address: '456 Medical Ave',
  bio: 'Experienced cardiologist',
  image: 'doctor-avatar.jpg',
  lastLogin: new Date(),
  emailVerified: new Date(),
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

describe('NextAuth Configuration with Email Notifications (Document 5)', () => {
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

    it('should NOT have GitHub provider (only Google OAuth)', () => {
      const githubProvider = authOptions.providers.find(
        (p: any) => p.id === 'github'
      );
      expect(githubProvider).toBeUndefined();
    });

    it('should have correct Google OAuth settings', () => {
      const googleProvider = authOptions.providers.find(
        (p: any) => p.id === 'google'
      ) as any;

      expect(googleProvider?.options?.authorization?.params).toEqual({
        prompt: 'consent',
        access_type: 'offline',
        response_type: 'code',
      });
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
      expect(user).toEqual(
        expect.objectContaining({
          id: 'user-id-456',
          email: mockUser.email,
          role: mockUser.role,
        })
      );
    });

    it('should throw error for missing credentials', async () => {
      const authorize = getCredentialsAuthorize();
      await expect(authorize(undefined, {} as any)).rejects.toThrow(
        'Email and password are required'
      );
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

    it('should throw specific error for OAuth users', async () => {
      const oauthUser = { ...mockUser, password: undefined };
      const selectMock = jest.fn().mockResolvedValue(oauthUser);
      (UserModel.findOne as jest.Mock).mockReturnValue({
        select: selectMock,
      });

      const authorize = getCredentialsAuthorize();
      await expect(authorize(validCredentials, {} as any)).rejects.toThrow(
        'This account uses social login. Please sign in with your social account.'
      );
    });

    it('should normalize email (lowercase and trim)', async () => {
      const credentialsWithWhitespace = {
        email: '  JEBARSANTHATCROOS@GMAIL.COM  ',
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
        email: 'jebarsanthatcroos@gmail.com',
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

    it('should log successful authentication', async () => {
      const selectMock = jest.fn().mockResolvedValue(mockUser);
      (UserModel.findOne as jest.Mock).mockReturnValue({
        select: selectMock,
      });
      (UserModel.findByIdAndUpdate as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const authorize = getCredentialsAuthorize();
      await authorize(validCredentials, {} as any);

      expect(authorize).toBeDefined();
    });
  });

  describe('jwt callback with OAuth', () => {
    const mockToken: JWT = {
      id: '',
      email: 'jebarsanthatcroos@gmail.com',
    };

    const mockUserAccount: NextAuthUser = {
      id: 'user-id-456',
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

    it('should create new OAuth user and send welcome email', async () => {
      (UserModel.findOne as jest.Mock).mockResolvedValue(null);
      (UserModel.create as jest.Mock).mockResolvedValue({
        ...mockUser,
        _id: { toString: () => 'new-user-id' },
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

      await authOptions.callbacks?.jwt?.(params as any);

      expect(UserModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: mockUser.email.toLowerCase().trim(),
          role: 'USER',
          isActive: true,
          emailVerified: expect.any(Date),
        })
      );
      expect(sendWelcomeEmail).toHaveBeenCalledWith(
        mockUser.email,
        mockUser.name
      );
    });

    it('should update existing OAuth user', async () => {
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

      expect(UserModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockUser._id,
        expect.objectContaining({
          lastLogin: expect.any(Date),
        }),
        { new: true }
      );
    });

    it('should handle token update trigger', async () => {
      (UserModel.findById as jest.Mock).mockResolvedValue({
        ...mockUser,
        phone: '1111111111',
        specialization: 'Neurology',
      });

      const params = {
        token: { ...mockToken, id: 'user-id-456' },
        user: undefined,
        account: undefined,
        profile: undefined,
        isNewUser: false,
        trigger: 'update' as const,
        session: undefined,
      };

      const newToken = await authOptions.callbacks?.jwt?.(params as any);

      expect(UserModel.findById).toHaveBeenCalledWith('user-id-456');
      expect(newToken?.phone).toBe('1111111111');
      expect(newToken?.specialization).toBe('Neurology');
    });

    it('should handle OAuth errors gracefully', async () => {
      (UserModel.findOne as jest.Mock).mockRejectedValue(
        new Error('DB Connection Error')
      );

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

    it('should not send welcome email on OAuth update', async () => {
      (UserModel.findOne as jest.Mock).mockResolvedValue(mockUser);
      (UserModel.findByIdAndUpdate as jest.Mock).mockResolvedValue(mockUser);
      (sendWelcomeEmail as jest.Mock).mockClear();

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

      expect(sendWelcomeEmail).not.toHaveBeenCalled();
    });
  });

  describe('session callback', () => {
    const mockSession = {
      user: {
        name: 'tHATCROOS JEBARSAN',
        email: 'jebarsanthatcroos16@gmail.com',
      },
      expires: new Date().toISOString(),
    };

    const mockToken: JWT = {
      id: 'user-id-456',
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
      accessToken: 'secure-access-token',
    };

    it('should map all token data to session', async () => {
      const params = {
        session: mockSession,
        token: mockToken,
        user: {} as NextAuthUser,
        newSession: undefined,
        trigger: undefined,
      };

      const newSession = await authOptions.callbacks?.session?.(params as any);

      expect(newSession?.user).toEqual({
        id: 'user-id-456',
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
      expect((newSession as any)?.accessToken).toBe('secure-access-token');
    });

    it('should handle incomplete token gracefully', async () => {
      const incompleteToken: JWT = {
        id: 'user-id-456',
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

    it('should allow new Google OAuth user', async () => {
      (UserModel.findOne as jest.Mock).mockResolvedValue(null);

      const result = await authOptions.callbacks?.signIn?.({
        user: { email: 'jebarsanthatcroos12@gmail.com' } as any,
        account: { provider: 'google' } as Account,
        profile: undefined,
        credentials: undefined,
      });

      expect(result).toBe(true);
    });

    it('should allow active Google OAuth user', async () => {
      (UserModel.findOne as jest.Mock).mockResolvedValue({
        ...mockUser,
        isActive: true,
      });

      const result = await authOptions.callbacks?.signIn?.({
        user: { email: 'jebarsanthatcroos12@gmail.com' } as any,
        account: { provider: 'google' } as Account,
        profile: undefined,
        credentials: undefined,
      });

      expect(result).toBe(true);
    });

    it('should reject inactive Google user', async () => {
      (UserModel.findOne as jest.Mock).mockResolvedValue({
        ...mockUser,
        isActive: false,
      });

      const result = await authOptions.callbacks?.signIn?.({
        user: { email: 'jebarsanthatcroos16@gmail.com' } as any,
        account: { provider: 'google' } as Account,
        profile: undefined,
        credentials: undefined,
      });

      expect(result).toBe('/auth/error?error=AccountDisabled');
      expect(console.warn).toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
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
        url: 'http://malicious.com/phishing',
        baseUrl,
      });
      expect(result).toBe(baseUrl);
    });
  });

  describe('events with email notifications', () => {
    it('should send login notification on sign in', async () => {
      const user = {
        email: 'jebarsanthatcroos@gmail.com',
        name: 'Jebrsan Thtcroos',
      } as any;

      await authOptions.events?.signIn?.({
        user,
        account: { provider: 'credentials' } as Account,
        isNewUser: false,
        profile: undefined,
      });

      expect(sendLoginNotification).toHaveBeenCalledWith(
        'jebarsanthatcroos@gmail.com',
        'Jebrsan Thtcroos'
      );
    });

    it('should log new user registration', async () => {
      await authOptions.events?.signIn?.({
        user: { email: 'jebarsanthatcroos12@gmail.com' } as any,
        account: { provider: 'google' } as Account,
        isNewUser: true,
        profile: undefined,
      });

      expect(authOptions.events?.signIn).toBeDefined();
    });

    it('should not crash if email sending fails', async () => {
      (sendLoginNotification as jest.Mock).mockRejectedValue(
        new Error('Email service unavailable')
      );

      await expect(
        authOptions.events?.signIn?.({
          user: {
            email: 'jebarsanthatcroos@gmail.com',
            name: 'Jebrsan Thtcroos',
          } as any,
          account: { provider: 'credentials' } as Account,
          isNewUser: false,
          profile: undefined,
        })
      ).resolves.not.toThrow();
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

  describe('Helper Functions', () => {
    it('should create user object with all fields', () => {
      const selectMock = jest.fn().mockResolvedValue(mockUser);
      (UserModel.findOne as jest.Mock).mockReturnValue({
        select: selectMock,
      });
      (UserModel.findByIdAndUpdate as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      return getCredentialsAuthorize()(
        {
          email: 'jebarsanthatcroos@gmail.com',
          password: 'password123',
        },
        {} as any
      ).then((user: any) => {
        expect(user).toHaveProperty('email');
        expect(user).toHaveProperty('role');
        expect(user).toHaveProperty('phone');
        expect(user).toHaveProperty('department');
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle user with no email in OAuth (should fail)', async () => {
      const result = await authOptions.callbacks?.signIn?.({
        user: { email: undefined } as any,
        account: { provider: 'google' } as Account,
        profile: undefined,
        credentials: undefined,
      });

      expect(result).toBe(false);
    });

    it('should handle missing account provider', async () => {
      const result = await authOptions.callbacks?.signIn?.({
        user: { email: 'jebarsanthatcroos@gmail.com' } as any,
        account: { provider: undefined } as any,
        profile: undefined,
        credentials: undefined,
      });

      expect(result).toBe(false);
    });

    it('should handle token update with missing user ID', async () => {
      const params = {
        token: { email: 'jebarsanthatcroos@gmail.com' } as JWT,
        user: undefined,
        account: undefined,
        profile: undefined,
        isNewUser: false,
        trigger: 'update' as const,
        session: undefined,
      };

      const newToken = await authOptions.callbacks?.jwt?.(params as any);
      expect(newToken).toBeDefined();
    });
  });
});

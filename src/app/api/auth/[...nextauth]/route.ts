/* eslint-disable @typescript-eslint/no-explicit-any */
import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import GitHubProvider from 'next-auth/providers/github';
import { connectDB } from '@/lib/mongodb';
import UserModel, { UserRole } from '@/models/User';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: UserRole;
      phone?: string;
      department?: string;
      specialization?: string;
      licenseNumber?: string;
      address?: string;
      bio?: string;
      isActive?: boolean;
      lastLogin?: Date;
    };
    accessToken?: string;
  }

  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: UserRole;
    phone?: string;
    department?: string;
    specialization?: string;
    licenseNumber?: string;
    address?: string;
    bio?: string;
    isActive?: boolean;
    lastLogin?: Date;
    password?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    name?: string | null;
    email?: string | null;
    picture?: string | null;
    role?: UserRole;
    phone?: string;
    department?: string;
    specialization?: string;
    licenseNumber?: string;
    address?: string;
    bio?: string;
    isActive?: boolean;
    lastLogin?: Date;
    accessToken?: string;
  }
}

const createUserObject = (user: any) => ({
  id: user._id?.toString() || user.id,
  name: user.name,
  email: user.email,
  image: user.image,
  role: user.role,
  phone: user.phone,
  department: user.department,
  specialization: user.specialization,
  licenseNumber: user.licenseNumber,
  address: user.address,
  bio: user.bio,
  isActive: user.isActive,
  lastLogin: user.lastLogin,
});

const updateLastLogin = async (userId: string): Promise<void> => {
  try {
    await UserModel.findByIdAndUpdate(
      userId,
      { lastLogin: new Date() },
      { new: true }
    );
  } catch (error) {
    console.error('Failed to update last login:', error);
  }
};

const handleOAuthUser = async (user: any, provider: string) => {
  try {
    await connectDB();

    let dbUser = await UserModel.findOne({
      email: user.email?.toLowerCase().trim(),
    });

    if (!dbUser) {
      dbUser = await UserModel.create({
        name: user.name,
        email: user.email?.toLowerCase().trim(),
        image: user.image,
        role: 'USER',
        isActive: true,
        emailVerified: new Date(),
        lastLogin: new Date(),
        authProvider: provider,
      });
    } else {
      dbUser = await UserModel.findByIdAndUpdate(
        dbUser._id,
        {
          lastLogin: new Date(),
          image: user.image || dbUser.image,
          name: user.name || dbUser.name,
          authProvider: provider,
        },
        { new: true }
      );
    }

    return dbUser;
  } catch (error) {
    console.error(`${provider} user handling error:`, error);
    throw new Error(`Failed to process ${provider} user`);
  }
};

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'Credentials',
      credentials: {
        email: {
          label: 'Email',
          type: 'email',
          placeholder: 'jebarsnthatcroos@email.com',
        },
        password: {
          label: 'Password',
          type: 'password',
          placeholder: '••••••••',
        },
      },
      async authorize(credentials) {
        // Validate credentials exist
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        // Validate password length
        if (credentials.password.length < 6) {
          throw new Error('Password must be at least 6 characters');
        }

        const normalizedEmail = credentials.email.toLowerCase().trim();

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(normalizedEmail)) {
          throw new Error('Invalid email format');
        }

        try {
          await connectDB();

          const user = await UserModel.findOne({
            email: normalizedEmail,
            isActive: true,
          }).select('+password');

          if (!user) {
            throw new Error('Invalid email or password');
          }

          if (!user.password) {
            throw new Error('This account uses social login');
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!isPasswordValid) {
            throw new Error('Invalid email or password');
          }

          await updateLastLogin(user._id.toString());

          return createUserObject(user);
        } catch (error) {
          if (error instanceof Error) {
            throw error;
          }
          throw new Error('Authentication failed. Please try again.');
        }
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
        },
      },
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
        };
      },
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      profile(profile) {
        return {
          id: profile.id.toString(),
          name: profile.name || profile.login,
          email: profile.email,
          image: profile.avatar_url,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, account, trigger }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.phone = user.phone;
        token.department = user.department;
        token.specialization = user.specialization;
        token.licenseNumber = user.licenseNumber;
        token.address = user.address;
        token.bio = user.bio;
        token.isActive = user.isActive;
        token.lastLogin = user.lastLogin;

        if (account?.provider !== 'credentials') {
          try {
            const dbUser = await handleOAuthUser(
              user,
              account?.provider || 'unknown'
            );
            token.id = dbUser._id.toString();
            token.role = dbUser.role;
            token.phone = dbUser.phone;
            token.department = dbUser.department;
            token.specialization = dbUser.specialization;
            token.licenseNumber = dbUser.licenseNumber;
            token.address = dbUser.address;
            token.bio = dbUser.bio;
            token.isActive = dbUser.isActive;
            token.lastLogin = dbUser.lastLogin;
          } catch (error) {
            console.error('OAuth token update error:', error);
          }
        }
      }

      if (trigger === 'update') {
        try {
          await connectDB();
          const dbUser = await UserModel.findById(token.id);

          if (dbUser) {
            token.role = dbUser.role;
            token.phone = dbUser.phone;
            token.department = dbUser.department;
            token.specialization = dbUser.specialization;
            token.isActive = dbUser.isActive;
          }
        } catch (error) {
          console.error('Token update error:', error);
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user = {
          id: token.id,
          name: token.name,
          email: token.email,
          image: token.picture,
          role: token.role,
          phone: token.phone,
          department: token.department,
          specialization: token.specialization,
          licenseNumber: token.licenseNumber,
          address: token.address,
          bio: token.bio,
          isActive: token.isActive,
          lastLogin: token.lastLogin,
        };
        session.accessToken = token.accessToken;
      }

      return session;
    },

    async signIn({ user, account }) {
      try {
        if (account?.provider === 'credentials') {
          return true;
        }

        // Handle both Google and GitHub OAuth
        if (
          (account?.provider === 'google' || account?.provider === 'github') &&
          user.email
        ) {
          await connectDB();

          const dbUser = await UserModel.findOne({
            email: user.email.toLowerCase().trim(),
          });

          if (!dbUser || dbUser.isActive) {
            return true;
          }

          console.warn(`Inactive user attempted sign in: ${user.email}`);
          return '/auth/error?error=AccountDisabled';
        }

        return false;
      } catch (error) {
        console.error('Sign in callback error:', error);
        return false;
      }
    },

    async redirect({ url, baseUrl }) {
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
      } else if (new URL(url).origin === baseUrl) {
        return url;
      }
      return baseUrl;
    },
  },

  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error',
    verifyRequest: '/auth/verify-request',
    newUser: '/auth/new-user',
  },

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
    updateAge: 24 * 60 * 60,
  },

  jwt: {
    maxAge: 30 * 24 * 60 * 60,
  },

  secret: process.env.NEXTAUTH_SECRET,

  debug: process.env.NODE_ENV === 'development',

  events: {
    async signIn({ user, account, isNewUser }) {
      console.log(`User signed in: ${user.email} via ${account?.provider}`);
      if (isNewUser) {
        console.log(`New user registered: ${user.email}`);
      }
    },
    async signOut({ token }) {
      console.log(`User signed out: ${token.email}`);
    },
    async createUser({ user }) {
      console.log(`User created: ${user.email}`);
    },
    async updateUser({ user }) {
      console.log(`User updated: ${user.email}`);
    },
  },
};

// Export named handlers for Next.js App Router
export const GET = NextAuth(authOptions);
export const POST = NextAuth(authOptions);

// Sign Up Schema
export const signUpSchema = z
  .object({
    name: z
      .string()
      .min(2, 'Name must be at least 2 characters')
      .max(50, 'Name must be less than 50 characters')
      .regex(/^[a-zA-Z\s]*$/, 'Name can only contain letters and spaces'),
    email: z
      .string()
      .email('Please enter a valid email address')
      .min(1, 'Email is required'),
    password: z
      .string()
      .min(6, 'Password must be at least 6 characters')
      .max(100, 'Password is too long')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(
        /[^A-Za-z0-9]/,
        'Password must contain at least one special character'
      ),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type SignUpFormData = z.infer<typeof signUpSchema>;

// Sign In Schema
export const signInSchema = z.object({
  email: z
    .string()
    .email('Please enter a valid email address')
    .min(1, 'Email is required'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters'),
});

export type SignInFormData = z.infer<typeof signInSchema>;

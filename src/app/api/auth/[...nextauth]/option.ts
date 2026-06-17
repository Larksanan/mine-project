/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import GitHubProvider from 'next-auth/providers/github';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/mongodb';
import User, { IUserDocument, UserRole } from '@/models/User';
import { IUserCredentials } from '@/types/next-auth';

if (!process.env.NEXTAUTH_SECRET) {
  throw new Error('NEXTAUTH_SECRET is not set');
}

const validateCredentials = (email?: string, password?: string) => {
  if (!email || !password) {
    return { isValid: false, error: 'Email and password are required' };
  }

  if (password.length < 6) {
    return { isValid: false, error: 'Password must be at least 6 characters' };
  }

  // Normalize email before validation
  const normalizedEmail = email.toLowerCase().trim();

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(normalizedEmail)) {
    return { isValid: false, error: 'Invalid email format' };
  }

  return { isValid: true, normalizedEmail };
};

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
      authorization: {
        params: {
          scope: 'read:user user:email',
        },
      },
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials): Promise<IUserCredentials | null> {
        try {
          const validation = validateCredentials(
            credentials?.email,
            credentials?.password
          );

          if (!validation.isValid) {
            throw new Error(validation.error);
          }

          await connectDB();

          // Use normalized email from validation
          const normalizedEmail =
            validation.normalizedEmail ||
            credentials!.email.toLowerCase().trim();

          const user = (await User.findOne({
            email: normalizedEmail,
            isActive: true,
          }).select('+password')) as IUserDocument | null;

          if (!user) {
            throw new Error('Invalid email or password');
          }

          if (!user.password) {
            throw new Error(
              'This account uses social login. Please sign in with Google or GitHub.'
            );
          }

          const isValid = await bcrypt.compare(
            credentials!.password,
            user.password
          );

          if (!isValid) {
            throw new Error('Invalid email or password');
          }

          // Update last login
          await User.findByIdAndUpdate(user._id, {
            lastLogin: new Date(),
          });

          // Return user data without password
          const userData: IUserCredentials = {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
            image: user.image,
            phone: user.phone,
            department: user.department,
            specialization: user.specialization,
            address: user.address,
            bio: user.bio,
            isActive: user.isActive,
            lastLogin: user.lastLogin,
          };

          return userData;
        } catch (error: any) {
          // Only log in non-test environments
          if (process.env.NODE_ENV !== 'test') {
            console.error('Auth error:', error.message);
          }
          throw new Error(error.message || 'Authentication failed');
        }
      },
    }),
  ],

  callbacks: {
    async signIn({ user, account }) {
      try {
        await connectDB();

        if (account?.provider === 'credentials') {
          if (user.email) {
            await User.updateOne(
              { email: user.email },
              {
                $set: {
                  lastLogin: new Date(),
                },
              }
            );
          }
          return true;
        }

        if (account?.provider === 'google' || account?.provider === 'github') {
          // Handle GitHub email scope issues
          if (account?.provider === 'github' && !user.email) {
            throw new Error(
              'GitHub did not provide an email address. Please ensure your GitHub account has a public email or grant email access.'
            );
          }

          const existingUser = await User.findOne({ email: user.email });

          if (!existingUser) {
            // Create new user for OAuth
            await User.create({
              name: user.name,
              email: user.email,
              image: user.image,
              role: 'USER' as UserRole,
              phone: user.phone || '',
              department: user.department || '',
              specialization: user.specialization || '',
              address: user.address || '',
              bio: user.bio || '',
              isActive: true,
              lastLogin: new Date(),
            });
          } else {
            if (!existingUser.isActive) {
              if (process.env.NODE_ENV !== 'test') {
                console.warn(`Inactive user attempted sign in: ${user.email}`);
              }
              return '/auth/error?error=AccountDisabled';
            }
            // Update existing user with OAuth data and last login
            await User.findByIdAndUpdate(
              existingUser._id,
              {
                $set: {
                  name: user.name,
                  image: user.image,
                  lastLogin: new Date(),
                },
              },
              { new: true }
            );
          }
          return true;
        }

        return false;
      } catch (error: any) {
        if (process.env.NODE_ENV !== 'test') {
          console.error('SignIn callback error:', error.message);
        }
        return `/auth/error?error=${encodeURIComponent(error.message)}`;
      }
    },

    async jwt({ token, user, account, trigger, session }) {
      // Handle session update trigger
      if (trigger === 'update' && session?.user) {
        token.name = session.user.name;
        token.phone = session.user.phone;
        token.department = session.user.department;
        token.specialization = session.user.specialization;
        token.address = session.user.address;
        token.bio = session.user.bio;
      }

      if (account) {
        token.accessToken = account.access_token;
      }

      // Add user info to token on sign in
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.picture = user.image;
        token.role = user.role;
        token.phone = user.phone;
        token.department = user.department;
        token.specialization = user.specialization;
        token.address = user.address;
        token.bio = user.bio;
        token.isActive = user.isActive;
        token.lastLogin = user.lastLogin;
      }

      // Always refresh user data from database for latest information
      if (token.email) {
        try {
          await connectDB();
          const dbUser = await User.findOne({ email: token.email });
          if (dbUser) {
            token.id = dbUser._id.toString();
            token.name = dbUser.name;
            token.email = dbUser.email;
            token.picture = dbUser.image;
            token.role = dbUser.role;
            token.phone = dbUser.phone;
            token.department = dbUser.department;
            token.specialization = dbUser.specialization;
            token.address = dbUser.address;
            token.bio = dbUser.bio;
            token.isActive = dbUser.isActive;
            token.lastLogin = dbUser.lastLogin;
          }
        } catch (error) {
          if (process.env.NODE_ENV !== 'test') {
            console.error('JWT callback error:', error);
          }
        }
      }

      return token;
    },

    async session({ session, token }) {
      // Assign all token data to session
      session.user = {
        id: token.id as string,
        name: token.name,
        email: token.email,
        image: token.picture,
        role: token.role as UserRole,
        phone: token.phone as string,
        department: token.department as string,
        specialization: token.specialization as string,
        address: token.address as string,
        bio: token.bio as string,
        isActive: token.isActive as boolean,
        lastLogin: token.lastLogin as Date,
      };

      session.accessToken = token.accessToken as string;

      return session;
    },

    async redirect({ url, baseUrl }) {
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },

  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error',
  },

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  get debug() {
    return process.env.NODE_ENV === 'development';
  },

  secret: process.env.NEXTAUTH_SECRET,

  events: {
    async signIn({ user, account }) {
      if (process.env.NODE_ENV !== 'test') {
        console.log(`User signed in: ${user.email} via ${account?.provider}`);
      }
    },
    async signOut({ token }) {
      if (process.env.NODE_ENV !== 'test') {
        console.log(`User signed out: ${token.email}`);
      }
    },
    async createUser({ user }) {
      if (process.env.NODE_ENV !== 'test') {
        console.log(`User created: ${user.email}`);
      }
    },
    async updateUser({ user }) {
      if (process.env.NODE_ENV !== 'test') {
        console.log(`User updated: ${user.email}`);
      }
    },
  },
};

/* eslint-disable @typescript-eslint/no-explicit-any */
import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { connectDB } from './mongodb';
import UserModel, { IUser, UserRole } from '@/models/User';
import { sendLoginNotification, sendWelcomeEmail } from '@/lib/email';
import bcrypt from 'bcryptjs';
import mongoose, { Types, Document } from 'mongoose';
import { AppointmentStatus, AppointmentType } from '../models/Appointment';
import { Priority, TestStatus } from '../models/LabTestRequest';

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

  // Domain Interfaces
  interface ILabTest {
    name: string;
    category: string;
    description?: string;
    price: number;
    duration: number;
    sampleType: string;
    preparationInstructions?: string;
    normalRange?: string;
    units?: string;
    isActive: boolean;
  }

  interface IDoctorProfile {
    specialization: string;
    qualifications: string[];
    experience: number;
    consultationFee: number;
    availability: {
      days: string[];
      startTime: string;
      endTime: string;
    };
    hospitalAffiliation?: string;
    department: string;
    licenseNumber: string;
    licenseExpiry: Date;
    isVerified: boolean;
    languages: string[];
    services: string[];
    awards?: string[];
    publications?: string[];
    rating?: {
      average: number;
      count: number;
    };
  }

  interface IAppointment {
    patient: Types.ObjectId;
    pharmacist: Types.ObjectId;
    pharmacy: Types.ObjectId;
    appointmentDate: Date;
    appointmentTime: string;
    duration: number;
    serviceType: AppointmentType;
    status: AppointmentStatus;
    reason: string;
    notes?: string;
    prescriptionRefills?: {
      medication: string;
      dosage: string;
      quantity: number;
      refillsLeft: number;
    }[];
    vitalSigns?: {
      bloodPressure: string;
      heartRate: number;
      temperature: number;
      weight: number;
      height: number;
    };
    followUpRequired?: boolean;
    followUpDate?: Date;
    isActive?: boolean;
  }

  interface IInventoryItem {
    name: string;
    description?: string;
    category: string;
    sku: string;
    barcode?: string;
    quantity: number;
    lowStockThreshold: number;
    costPrice: number;
    sellingPrice: number;
    supplier?: string;
    expiryDate?: Date;
    batchNumber?: string;
    status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'DISCONTINUED';
    pharmacy: Types.ObjectId;
    createdBy: Types.ObjectId;
    reorderLevel?: number;
    reorderQuantity?: number;
    location?: string;
    notes?: string;
  }

  interface ILabDashboard {
    labTechnician: Types.ObjectId;
    totalTestsCompleted: number;
    testsToday: number;
    pendingTests: number;
    averageTurnaroundTime: number;
    criticalFindings: number;
    lastActivity: Date;
  }

  interface ILabTechnician {
    user: Types.ObjectId;
    employeeId: string;
    specialization: string[];
    licenseNumber?: string;
    licenseExpiry?: Date;
    qualifications: string[];
    yearsOfExperience: number;
    shift: 'MORNING' | 'EVENING' | 'NIGHT' | 'GENERAL';
    isAvailable: boolean;
    maxConcurrentTests: number;
    currentWorkload: number;
    performanceScore: number;
    joinedDate: Date;
    img: string;
  }

  interface ILabTestRequest {
    patient: Types.ObjectId;
    doctor: Types.ObjectId;
    labTechnician?: Types.ObjectId;
    test: Types.ObjectId;
    status: TestStatus;
    priority: Priority;
    requestedDate: Date;
    sampleCollectedDate?: Date;
    startedDate?: Date;
    completedDate?: Date;
    verifiedDate?: Date;
    results?: string;
    findings?: string;
    notes?: string;
    attachments?: string[];
    isCritical: boolean;
    referral?: string;
  }

  interface IMedicalRecord extends Document {
    followUpDate: unknown;
    vitalSigns: any;
    notes: unknown;
    medications: any;
    treatment: unknown;
    diagnosis: any;
    patientId: mongoose.Types.ObjectId;
    doctorId: mongoose.Types.ObjectId;
    recordType:
      | 'CONSULTATION'
      | 'LAB_RESULT'
      | 'IMAGING'
      | 'ECG'
      | 'PRESCRIPTION'
      | 'PROGRESS_NOTE'
      | 'SURGICAL_REPORT'
      | 'DISCHARGE_SUMMARY'
      | 'OTHER';
    title: string;
    description: string;
    date: Date;
    status: 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
    attachments: string[];
    doctorNotes?: string;
    createdAt: Date;
    updatedAt: Date;
  }

  interface IOrderItem {
    product: Types.ObjectId;
    quantity: number;
    price: number;
    prescriptionVerified: boolean;
    verifiedBy?: Types.ObjectId;
  }

  interface IOrder {
    orderNumber: string;
    customer: Types.ObjectId;
    pharmacy: Types.ObjectId;
    items: IOrderItem[];
    totalAmount: number;
    status:
      | 'pending'
      | 'confirmed'
      | 'preparing'
      | 'ready'
      | 'out_for_delivery'
      | 'delivered'
      | 'cancelled';
    paymentMethod: 'cash' | 'card' | 'insurance';
    paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
    deliveryAddress: string;
    driver?: Types.ObjectId;
    estimatedDelivery?: Date;
    actualDelivery?: Date;
    notes?: string;
    createdBy: Types.ObjectId;
    updatedBy?: Types.ObjectId;
  }

  interface IAddress {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  }

  interface IEmergencyContact {
    name: string;
    phone: string;
    relationship: string;
    email?: string;
  }

  interface IInsurance {
    provider: string;
    policyNumber: string;
    groupNumber?: string;
  }

  interface IPatient {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    dateOfBirth: Date;
    gender: 'MALE' | 'FEMALE' | 'OTHER';
    address?: IAddress;
    emergencyContact?: IEmergencyContact;
    medicalHistory?: string;
    allergies?: string[];
    medications?: string[];
    insurance?: IInsurance;
    bloodType?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
    height?: number;
    weight?: number;
    isActive?: boolean;
  }

  interface IPharmacy {
    name: string;
    address: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
    contact: {
      phone: string;
      email?: string;
      emergencyPhone?: string;
    };
    operatingHours: {
      Monday: string;
      Tuesday: string;
      Wednesday: string;
      Thursday: string;
      Friday: string;
      Saturday: string;
      Sunday: string;
    };
    services: string[];
    pharmacists?: Array<{
      name: string;
      licenseNumber: string;
    }>;
    inventory?: {
      totalProducts: number;
      lowStockItems: number;
      outOfStockItems: number;
    };
    status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
    is24Hours: boolean;
    description?: string;
    createdBy: Types.ObjectId;
    website?: string;
  }

  interface IMedication {
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string;
    quantity: number;
    refills: number;
  }

  interface IPrescription {
    patientId: Types.ObjectId;
    doctorId: Types.ObjectId;
    diagnosis: string;
    medications: IMedication[];
    notes?: string;
    startDate: Date;
    endDate?: Date;
    status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
    isActive?: boolean;
  }

  interface IPrescriptionDocument extends IPrescription, Document {
    _id: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
    prescriptionNumber: string;
    totalMedications: number;
    isExpired: boolean;
    calculateTotalDays(): number;
    hasRefillsAvailable(): boolean;
    canBeRenewed(): boolean;
  }

  interface IShop extends Document {
    id: string;
    name: string;
    price: number;
    image: string;
    description?: string;
    inStock?: boolean;
    category?: string;
    email?: string;
    createdAt: Date;
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

// ==================== Helper Functions ====================

/**
 * Creates a standardized user object for session management
 * @param user - User document from database
 * @returns Formatted user object
 */
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

/**
 * Updates the user's last login timestamp
 * @param userId - User ID to update
 */
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

/**
 * Handles OAuth user creation or update in database
 * @param user - User object from OAuth provider
 * @returns Database user document
 */
const handleOAuthUser = async (user: any) => {
  try {
    await connectDB();

    let dbUser = await UserModel.findOne({
      email: user.email?.toLowerCase().trim(),
    });

    if (!dbUser) {
      // Explicitly ensure nic is undefined for new OAuth users
      // This prevents potential issues if 'nic' was somehow implicitly set or defaulted to a non-unique value.
      const newUserPayload: any = {
        name: user.name,
        email: user.email?.toLowerCase().trim(),
        image: user.image,
        role: 'USER',
        isActive: true,
        emailVerified: new Date(),
        lastLogin: new Date(),
      };
      // Create new user for OAuth sign-in
      dbUser = await UserModel.create(newUserPayload);
      console.log('New OAuth user created:', user.email);

      // Send welcome email for OAuth users
      if (dbUser.email && dbUser.name) {
        await sendWelcomeEmail(dbUser.email, dbUser.name);
      }
    } else {
      // Update existing user information
      // When updating, we explicitly do not include 'nic' in the update payload
      // to ensure it's not modified unless explicitly intended elsewhere.
      // The existing nic value will be preserved.
      // This also prevents any accidental 'nic' property from the OAuth 'user' object
      // from being applied to an existing user.
      const updateUserPayload: Partial<IUser> = {
        lastLogin: new Date(),
        image: user.image || dbUser.image,
        name: user.name || dbUser.name,
      };
      dbUser = await UserModel.findByIdAndUpdate(
        dbUser._id,
        updateUserPayload,
        { new: true }
      );
      console.log('OAuth user updated:', user.email);
    }

    return dbUser;
  } catch (error) {
    console.error('OAuth user handling error:', error);
    throw new Error('Failed to process OAuth user');
  }
};

/**
 * Validates credentials input
 * @param email - Email address
 * @param password - Password
 * @returns Object with validation result
 */
const validateCredentials = (email?: string, password?: string) => {
  if (!email || !password) {
    return {
      isValid: false,
      error: 'Email and password are required',
    };
  }

  if (password.length < 6) {
    return {
      isValid: false,
      error: 'Password must be at least 6 characters',
    };
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return {
      isValid: false,
      error: 'Invalid email format',
    };
  }

  return { isValid: true };
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
        // Validate input
        const validation = validateCredentials(
          credentials?.email,
          credentials?.password
        );

        if (!validation.isValid) {
          throw new Error(validation.error);
        }

        try {
          await connectDB();

          // Find active user by email
          const user = await UserModel.findOne({
            email: credentials!.email.toLowerCase().trim(),
            isActive: true,
          }).select('+password');

          if (!user) {
            throw new Error('Invalid email or password');
          }

          // Check if password exists (OAuth users may not have passwords)
          if (!user.password) {
            throw new Error(
              'This account uses social login. Please sign in with your social account.'
            );
          }

          // Verify password
          const isPasswordValid = await bcrypt.compare(
            credentials!.password,
            user.password
          );

          if (!isPasswordValid) {
            throw new Error('Invalid email or password');
          }

          // Update last login
          await updateLastLogin(user._id.toString());

          console.log('User authenticated successfully:', user.email);
          return createUserObject(user);
        } catch (error) {
          console.error('Credentials auth error:', error);
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
  ],

  callbacks: {
    /**
     * JWT callback - called whenever a JWT is created or updated
     */
    async jwt({ token, user, account, trigger }) {
      // Initial sign in - add user data to token
      if (user) {
        console.log('JWT Callback - User Role:', user.role);
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

        // Handle OAuth providers
        if (account?.provider !== 'credentials') {
          try {
            const dbUser = await handleOAuthUser(user);

            // Update token with database user info
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

      // Handle token updates (e.g., profile updates)
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

    /**
     * Session callback - called whenever a session is checked
     */
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

    /**
     * SignIn callback - controls whether user can sign in
     */
    async signIn({ user, account }) {
      try {
        // Allow credentials sign in
        if (account?.provider === 'credentials') {
          return true;
        }

        // Handle OAuth sign in
        if (account?.provider === 'google' && user.email) {
          await connectDB();

          const dbUser = await UserModel.findOne({
            email: user.email.toLowerCase().trim(),
          });

          // Allow sign in if:
          // 1. User doesn't exist (will be created)
          // 2. User exists and is active
          if (!dbUser || dbUser.isActive) {
            return true;
          }

          // Reject if user exists but is inactive
          console.warn(`Inactive user attempted sign in: ${user.email}`);
          return '/auth/error?error=AccountDisabled';
        }

        return false;
      } catch (error) {
        console.error('Sign in callback error:', error);
        return false;
      }
    },

    /**
     * Redirect callback - controls where user is redirected after auth
     */
    async redirect({ url, baseUrl }) {
      // Redirect to the URL if it's relative
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
      }
      // Redirect if the URL is on the same origin
      else if (new URL(url).origin === baseUrl) {
        return url;
      }
      // Otherwise redirect to base URL
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
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },

  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  secret: process.env.NEXTAUTH_SECRET,

  debug: process.env.NODE_ENV === 'development',

  // Event handlers for logging
  events: {
    async signIn({ user, account, isNewUser }) {
      console.log(`User signed in: ${user.email} via ${account?.provider}`);
      if (isNewUser) {
        console.log(`New user registered: ${user.email}`);
      }

      // Send login notification
      if (user.email && user.name) {
        try {
          await sendLoginNotification(user.email, user.name);
        } catch (error) {
          console.error('Failed to send login notification:', error);
        }
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

export default NextAuth(authOptions);

/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { connectDB } from '@/lib/mongodb';
import User, { UserRole } from '@/models/User';
import { sendWelcomeEmail } from '@/lib/email';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const registerSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters')
    .regex(
      /^[a-zA-Z\s\u00C0-\u024F\u1E00-\u1EFF]+$/,
      'Name can only contain letters and spaces'
    )
    .transform(name => name.trim()),
  email: z
    .string()
    .email('Please enter a valid email address')
    .min(1, 'Email is required')
    .transform(email => email.toLowerCase().trim()),
  nic: z
    .string()
    .min(1, 'NIC is required')
    .regex(
      /^([0-9]{9}[vVxX]|[0-9]{12})$/,
      'NIC must be either 9 digits followed by V/X or 12 digits'
    )
    .transform(nic => nic.toUpperCase().trim()),
  password: z
    .string()
    .max(100, 'Password is too long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(
      /[^A-Za-z0-9]/,
      'Password must contain at least one special character'
    ),
  role: z
    .enum([
      'ADMIN',
      'DOCTOR',
      'NURSE',
      'RECEPTIONIST',
      'LABTECH',
      'PHARMACIST',
      'STAFF',
      'PATIENT',
      'USER',
    ])
    .default('USER'),
  phone: z
    .string()
    .regex(/^\+?[\d\s\-()]{10,}$/, 'Please enter a valid phone number')
    .optional()
    .or(z.literal('')),
  department: z
    .string()
    .max(100, 'Department name is too long')
    .optional()
    .or(z.literal('')),
  specialization: z
    .string()
    .max(100, 'Specialization name is too long')
    .optional()
    .or(z.literal('')),
});

export async function POST(req: Request) {
  try {
    // Check content type
    const contentType = req.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      return Response.json(
        { message: 'Content-Type must be application/json' },
        { status: 415 }
      );
    }

    // Parse and validate request body
    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      return Response.json(
        { message: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    // Validate input using Zod schema
    const validationResult = registerSchema.safeParse(body);

    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      return Response.json(
        {
          message: firstError.message,
          field: firstError.path[0],
        },
        { status: 400 }
      );
    }

    const {
      name,
      email,
      nic,
      password,
      role,
      phone,
      department,
      specialization,
    } = validationResult.data;

    await connectDB();

    // Check if user already exists with email
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return Response.json(
        {
          message: 'User already exists with this email',
          field: 'email',
        },
        { status: 409 }
      );
    }

    // Check if NIC already exists
    const existingNIC = await User.findOne({ nic });
    if (existingNIC) {
      return Response.json(
        {
          message: 'This NIC is already registered',
          field: 'nic',
        },
        { status: 409 }
      );
    }

    const commonPasswords = [
      'password',
      '123456',
      'password123',
      'admin',
      'qwerty',
    ];
    if (commonPasswords.includes(password.toLowerCase())) {
      return Response.json(
        {
          message: 'Please choose a stronger password',
          field: 'password',
        },
        { status: 400 }
      );
    }

    // Hash password with increased salt rounds for better security
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({
      name,
      email,
      nic,
      password: hashedPassword,
      role,
      phone: phone || undefined,
      department: department || undefined,
      specialization: specialization || undefined,
      isActive: true,
      emailVerified: null,
      lastLogin: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Send welcome email
    if (user.email && user.name) {
      await sendWelcomeEmail(user.email, user.name);
    }

    const userResponse = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      nic: user.nic,
      role: user.role,
      phone: user.phone,
      department: user.department,
      specialization: user.specialization,
      isActive: user.isActive,
      createdAt: user.createdAt,
    };

    const headers = {
      'Content-Type': 'application/json',
    };

    return Response.json(
      {
        message: 'User created successfully',
        user: userResponse,
      },
      {
        status: 201,
        headers,
      }
    );
  } catch (error: any) {
    console.error('Registration error:', error);

    if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyPattern || {})[0];
      const fieldMessages: Record<string, string> = {
        email: 'User already exists with this email',
        nic: 'This NIC is already registered',
      };

      return Response.json(
        {
          message: fieldMessages[duplicateField] || 'Duplicate entry found',
          field: duplicateField || 'email',
        },
        { status: 409 }
      );
    }

    // Handle validation errors from mongoose
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      return Response.json(
        {
          message: errors[0] || 'Validation failed',
          field: Object.keys(error.errors)[0],
        },
        { status: 400 }
      );
    }

    // Handle connection errors
    if (
      error.name === 'MongoNetworkError' ||
      error.name === 'MongoTimeoutError'
    ) {
      return Response.json(
        { message: 'Database connection failed. Please try again.' },
        { status: 503 }
      );
    }

    // Handle bcrypt errors
    if (error.message.includes('bcrypt')) {
      return Response.json(
        { message: 'Error processing password' },
        { status: 500 }
      );
    }

    // Generic error response
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// Optional: Add GET method to check email and NIC availability
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');
    const nic = searchParams.get('nic');

    if (!email && !nic) {
      return Response.json(
        { message: 'Email or NIC parameter is required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Check email availability
    if (email) {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return Response.json(
          {
            message: 'Please enter a valid email address',
            field: 'email',
          },
          { status: 400 }
        );
      }

      const existingUser = await User.findOne({
        email: email.toLowerCase().trim(),
      });

      return Response.json({
        available: !existingUser,
        email: email,
        message: existingUser ? 'Email already taken' : 'Email available',
      });
    }

    // Check NIC availability
    if (nic) {
      // Validate NIC format
      const nicRegex = /^([0-9]{9}[vVxX]|[0-9]{12})$/;
      if (!nicRegex.test(nic)) {
        return Response.json(
          {
            message: 'Please enter a valid NIC',
            field: 'nic',
          },
          { status: 400 }
        );
      }

      const existingNIC = await User.findOne({
        nic: nic.toUpperCase().trim(),
      });

      return Response.json({
        available: !existingNIC,
        nic: nic,
        message: existingNIC ? 'NIC already registered' : 'NIC available',
      });
    }
  } catch (error: any) {
    console.error('Availability check error:', error);

    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// Optional: Add rate limiting (you'd need a proper rate limiting solution)
// This is a basic example
const rateLimit = new Map();

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

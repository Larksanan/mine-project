import { z, ZodError, ZodIssue } from 'zod';

const phoneRegex = /^\+?[\d\s-()]+$/;
const nameRegex = /^[a-zA-Z\s\u00C0-\u024F\u1E00-\u1EFF\-']+$/;

export const profileBaseSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .regex(nameRegex, 'Name can only contain letters, spaces, and hyphens')
    .trim(),

  email: z
    .string()
    .email('Please enter a valid email address')
    .min(5, 'Email must be at least 5 characters')
    .max(255, 'Email must be less than 255 characters')
    .toLowerCase()
    .trim(),

  phone: z
    .string()
    .max(20, 'Phone number must be less than 20 characters')
    .regex(phoneRegex, 'Please enter a valid phone number')
    .optional()
    .or(z.literal('')),

  department: z
    .string()
    .max(100, 'Department must be less than 100 characters')
    .optional()
    .or(z.literal('')),

  specialization: z
    .string()
    .max(100, 'Specialization must be less than 100 characters')
    .optional()
    .or(z.literal('')),

  address: z
    .string()
    .max(500, 'Address must be less than 500 characters')
    .optional()
    .or(z.literal('')),

  bio: z
    .string()
    .max(1000, 'Bio must be less than 1000 characters')
    .optional()
    .or(z.literal('')),
  nic: z
    .string()
    .min(9, 'NIC must be at least 9 characters')
    .max(12, 'NIC must be less than 12 characters')
    .optional()
    .or(z.literal('')),
});

// Role-specific schemas
export const doctorProfileSchema = profileBaseSchema.extend({
  department: z
    .string()
    .min(2, 'Department is required for doctors')
    .max(100, 'Department must be less than 100 characters'),
  specialization: z
    .string()
    .min(2, 'Specialization is required for doctors')
    .max(100, 'Specialization must be less than 100 characters'),
});

export const nurseProfileSchema = profileBaseSchema.extend({
  department: z
    .string()
    .min(2, 'Department is required for nurses')
    .max(100, 'Department must be less than 100 characters'),
});

export const staffProfileSchema = profileBaseSchema.extend({
  department: z
    .string()
    .min(2, 'Department is required for staff')
    .max(100, 'Department must be less than 100 characters'),
});

// Dynamic schema based on role
export const getProfileSchema = (role: string) => {
  switch (role) {
    case 'DOCTOR':
      return doctorProfileSchema;
    case 'NURSE':
      return nurseProfileSchema;
    case 'LABTECH':
    case 'PHARMACIST':
    case 'RECEPTIONIST':
    case 'STAFF':
      return staffProfileSchema;
    default:
      return profileBaseSchema;
  }
};

// Image validation schema
export const profileImageSchema = z.object({
  image: z
    .instanceof(File)
    .refine(file => file.size <= 5 * 1024 * 1024, 'Image must be less than 5MB')
    .refine(
      file =>
        ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(
          file.type
        ),
      'Only JPEG, PNG, and WebP images are allowed'
    ),
});

// Password update schema
export const passwordUpdateSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      ),
    confirmPassword: z.string(),
  })
  .refine(data => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const validateProfileData = (data: any, role: string = 'USER') => {
  try {
    const schema = getProfileSchema(role);
    const validatedData = schema.parse(data);
    return {
      success: true,
      data: validatedData,
      errors: [],
    };
  } catch (error) {
    if (error instanceof ZodError) {
      const errors = error.issues.map((issue: ZodIssue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      return {
        success: false,
        errors,
        data: null,
      };
    }
    return {
      success: false,
      errors: [{ field: 'unknown', message: 'Validation failed' }],
      data: null,
    };
  }
};

export const formatValidationErrors = (errors: ZodIssue[]) => {
  return errors.reduce((acc: Record<string, string>, issue: ZodIssue) => {
    const field = issue.path.join('.');
    acc[field] = issue.message;
    return acc;
  }, {});
};

export type ProfileFormData = z.infer<typeof profileBaseSchema>;
export type PasswordUpdateData = z.infer<typeof passwordUpdateSchema>;

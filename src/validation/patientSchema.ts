/* eslint-disable @typescript-eslint/no-explicit-any */
// validation/patientSchema.ts

// Define types for validation
export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export interface FormValidationResult {
  success: boolean;
  data?: any;
  errors?: Record<string, string>;
}

// Validation rules for each field
const validationRules = {
  // Required field validation
  required: (value: string): string | null => {
    if (!value || value.trim() === '') {
      return 'This field is required';
    }
    return null;
  },

  // Email validation
  email: (value: string): string | null => {
    if (!value) return null; // Email is optional
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return 'Please enter a valid email address';
    }
    return null;
  },

  // Phone number validation
  phone: (value: string): string | null => {
    const phoneRegex = /^[\\+]?[1-9][\d]{0,15}$/;
    if (!phoneRegex.test(value.replace(/\s/g, ''))) {
      return 'Please enter a valid phone number';
    }
    return null;
  },

  // NIC validation (Sri Lankan format)
  nic: (value: string): string | null => {
    const oldNicRegex = /^[0-9]{9}[VX]$/i;
    const newNicRegex = /^[0-9]{12}$/;

    if (!oldNicRegex.test(value) && !newNicRegex.test(value)) {
      return 'Please enter a valid NIC (9 digits with V/X or 12 digits)';
    }
    return null;
  },

  // Date validation
  date: (value: string): string | null => {
    if (!value) return null;
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return 'Please enter a valid date';
    }
    // Check if date is in the past (for date of birth)
    const today = new Date();
    if (date > today) {
      return 'Date cannot be in the future';
    }
    return null;
  },

  // Number validation
  number: (value: string, min?: number, max?: number): string | null => {
    if (!value) return null;
    const num = Number(value);
    if (isNaN(num)) {
      return 'Please enter a valid number';
    }
    if (min !== undefined && num < min) {
      return `Value must be at least ${min}`;
    }
    if (max !== undefined && num > max) {
      return `Value must be at most ${max}`;
    }
    return null;
  },

  // Length validation
  length: (value: string, min: number, max: number): string | null => {
    if (!value) return null;
    if (value.length < min) {
      return `Must be at least ${min} characters`;
    }
    if (value.length > max) {
      return `Must be at most ${max} characters`;
    }
    return null;
  },

  // URL validation (for optional fields)
  url: (value: string): string | null => {
    if (!value) return null;
    try {
      new URL(value);
      return null;
    } catch {
      return 'Please enter a valid URL';
    }
  },

  // Array validation
  array: (value: any[], min?: number, max?: number): string | null => {
    if (!value) return null;
    if (!Array.isArray(value)) {
      return 'Must be an array';
    }
    if (min !== undefined && value.length < min) {
      return `Must have at least ${min} items`;
    }
    if (max !== undefined && value.length > max) {
      return `Must have at most ${max} items`;
    }
    return null;
  },

  // Blood type validation
  bloodType: (value: string): string | null => {
    const validBloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    if (!value) return null;
    if (!validBloodTypes.includes(value)) {
      return 'Please select a valid blood type';
    }
    return null;
  },

  // Gender validation
  gender: (value: string): string | null => {
    const validGenders = ['MALE', 'FEMALE', 'OTHER'];
    if (!validGenders.includes(value)) {
      return 'Please select a valid gender';
    }
    return null;
  },

  // Marital status validation
  maritalStatus: (value: string): string | null => {
    if (!value) return null;
    const validStatuses = ['SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED'];
    if (!validStatuses.includes(value)) {
      return 'Please select a valid marital status';
    }
    return null;
  },

  // ZIP code validation
  zipCode: (value: string): string | null => {
    if (!value) return null;
    const zipRegex = /^[0-9]{5}(-[0-9]{4})?$/;
    if (!zipRegex.test(value)) {
      return 'Please enter a valid ZIP code';
    }
    return null;
  },

  // Height validation (in cm)
  height: (value: number): string | null => {
    if (!value) return null;
    if (value < 30 || value > 300) {
      return 'Height must be between 30cm and 300cm';
    }
    return null;
  },

  // Weight validation (in kg)
  weight: (value: number): string | null => {
    if (!value) return null;
    if (value < 1 || value > 300) {
      return 'Weight must be between 1kg and 300kg';
    }
    return null;
  },
};

// Field-specific validation configurations
const fieldValidations: Record<string, Array<(value: any) => string | null>> = {
  // Basic Info
  firstName: [
    v => validationRules.required(v),
    v => validationRules.length(v, 2, 50),
  ],
  lastName: [
    v => validationRules.required(v),
    v => validationRules.length(v, 2, 50),
  ],
  nic: [v => validationRules.required(v), v => validationRules.nic(v)],
  email: [v => validationRules.email(v)],
  phone: [v => validationRules.required(v), v => validationRules.phone(v)],
  dateOfBirth: [v => validationRules.required(v), v => validationRules.date(v)],
  gender: [v => validationRules.required(v), v => validationRules.gender(v)],
  maritalStatus: [v => validationRules.maritalStatus(v)],
  occupation: [v => validationRules.length(v, 2, 100)],
  preferredLanguage: [v => validationRules.length(v, 2, 50)],

  // Address fields
  'address.street': [
    v => validationRules.required(v),
    v => validationRules.length(v, 5, 200),
  ],
  'address.city': [
    v => validationRules.required(v),
    v => validationRules.length(v, 2, 100),
  ],
  'address.state': [
    v => validationRules.required(v),
    v => validationRules.length(v, 2, 100),
  ],
  'address.zipCode': [v => validationRules.zipCode(v)],
  'address.country': [
    v => validationRules.required(v),
    v => validationRules.length(v, 2, 100),
  ],

  // Emergency Contact
  'emergencyContact.name': [
    v => validationRules.required(v),
    v => validationRules.length(v, 2, 100),
  ],
  'emergencyContact.phone': [
    v => validationRules.required(v),
    v => validationRules.phone(v),
  ],
  'emergencyContact.relationship': [
    v => validationRules.required(v),
    v => validationRules.length(v, 2, 50),
  ],
  'emergencyContact.email': [v => validationRules.email(v)],

  // Medical Information
  medicalHistory: [v => validationRules.length(v, 0, 2000)],
  allergies: [v => validationRules.array(v, 0, 50)],
  medications: [v => validationRules.array(v, 0, 50)],
  bloodType: [v => validationRules.bloodType(v)],
  height: [v => validationRules.height(v)],
  weight: [v => validationRules.weight(v)],

  // Insurance
  'insurance.provider': [v => validationRules.length(v, 0, 100)],
  'insurance.policyNumber': [v => validationRules.length(v, 0, 50)],
  'insurance.groupNumber': [v => validationRules.length(v, 0, 50)],
  'insurance.validUntil': [
    v => {
      if (!v) return null;
      const date = new Date(v);
      if (isNaN(date.getTime())) {
        return 'Please enter a valid date';
      }
      return null;
    },
  ],

  // Other fields
  lastVisit: [v => validationRules.date(v)],
};

// Helper function to validate a single field
export const validateField = (
  fieldName: string,

  value: any
): ValidationResult => {
  const validators = fieldValidations[fieldName];

  if (!validators) {
    return { valid: true }; // No validation rules for this field
  }

  for (const validator of validators) {
    const error = validator(value);
    if (error) {
      return { valid: false, error };
    }
  }

  return { valid: true };
};

// Helper function to validate nested fields
const validateNestedField = (
  fieldPath: string,
  value: any,
  errors: Record<string, string>
) => {
  const result = validateField(fieldPath, value);
  if (!result.valid && result.error) {
    errors[fieldPath] = result.error;
  }
};

// Main form validation function
export const validatePatientForm = (formData: any): FormValidationResult => {
  const errors: Record<string, string> = {};

  // Validate basic fields
  const basicFields = [
    'firstName',
    'lastName',
    'nic',
    'email',
    'phone',
    'dateOfBirth',
    'gender',
    'maritalStatus',
    'occupation',
    'preferredLanguage',
    'medicalHistory',
    'bloodType',
    'height',
    'weight',
    'lastVisit',
  ];

  basicFields.forEach(field => {
    const value = formData[field];
    validateNestedField(field, value, errors);
  });

  // Validate array fields
  if (formData.allergies) {
    const result = validateField('allergies', formData.allergies);
    if (!result.valid && result.error) {
      errors.allergies = result.error;
    }
  }

  if (formData.medications) {
    const result = validateField('medications', formData.medications);
    if (!result.valid && result.error) {
      errors.medications = result.error;
    }
  }

  // Validate address fields
  if (formData.address) {
    const addressFields = [
      'address.street',
      'address.city',
      'address.state',
      'address.zipCode',
      'address.country',
    ];

    addressFields.forEach(fieldPath => {
      const fieldName = fieldPath.split('.')[1];
      const value = formData.address[fieldName];
      validateNestedField(fieldPath, value, errors);
    });
  }

  // Validate emergency contact fields
  if (formData.emergencyContact) {
    const emergencyFields = [
      'emergencyContact.name',
      'emergencyContact.phone',
      'emergencyContact.relationship',
      'emergencyContact.email',
    ];

    emergencyFields.forEach(fieldPath => {
      const fieldName = fieldPath.split('.')[1];
      const value = formData.emergencyContact[fieldName];
      validateNestedField(fieldPath, value, errors);
    });
  }

  // Validate insurance fields
  if (formData.insurance) {
    const insuranceFields = [
      'insurance.provider',
      'insurance.policyNumber',
      'insurance.groupNumber',
      'insurance.validUntil',
    ];

    insuranceFields.forEach(fieldPath => {
      const fieldName = fieldPath.split('.')[1];
      const value = formData.insurance[fieldName];
      validateNestedField(fieldPath, value, errors);
    });
  }

  // Additional business logic validations
  if (formData.height && formData.weight) {
    const bmi =
      formData.weight / ((formData.height / 100) * (formData.height / 100));
    if (bmi > 50) {
      errors.weight = 'Please verify height and weight values';
    }
  }

  // Check if date of birth makes sense (not too old)
  if (formData.dateOfBirth) {
    const dob = new Date(formData.dateOfBirth);
    const age = new Date().getFullYear() - dob.getFullYear();
    if (age > 150) {
      errors.dateOfBirth = 'Please verify the date of birth';
    }
  }

  // Check if last visit is after date of birth
  if (formData.dateOfBirth && formData.lastVisit) {
    const dob = new Date(formData.dateOfBirth);
    const lastVisit = new Date(formData.lastVisit);
    if (lastVisit < dob) {
      errors.lastVisit = 'Last visit cannot be before date of birth';
    }
  }

  // Check insurance expiry
  if (formData.insurance?.validUntil) {
    const expiryDate = new Date(formData.insurance.validUntil);
    const today = new Date();
    if (expiryDate < today) {
      errors['insurance.validUntil'] = 'Insurance has expired';
    }
  }

  if (Object.keys(errors).length > 0) {
    return {
      success: false,
      errors,
    };
  }

  return {
    success: true,
    data: formData,
  };
};

// Function to validate all fields at once (for form submission)

export const validateAllFields = (formData: any): Record<string, string> => {
  const result = validatePatientForm(formData);
  return result.errors || {};
};

// Function to check if a specific section is valid
export const validateSection = (section: string, formData: any): string[] => {
  const errors: string[] = [];

  const sectionFields: Record<string, string[]> = {
    basic: [
      'firstName',
      'lastName',
      'nic',
      'email',
      'phone',
      'dateOfBirth',
      'gender',
      'maritalStatus',
      'occupation',
      'preferredLanguage',
    ],
    address: [
      'address.street',
      'address.city',
      'address.state',
      'address.zipCode',
      'address.country',
    ],
    emergency: [
      'emergencyContact.name',
      'emergencyContact.phone',
      'emergencyContact.relationship',
      'emergencyContact.email',
    ],
    medical: [
      'medicalHistory',
      'allergies',
      'medications',
      'bloodType',
      'height',
      'weight',
      'lastVisit',
    ],
    insurance: [
      'insurance.provider',
      'insurance.policyNumber',
      'insurance.groupNumber',
      'insurance.validUntil',
    ],
  };

  const fields = sectionFields[section] || [];

  fields.forEach(field => {
    // Handle nested fields
    let value;
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      value = formData[parent]?.[child];
    } else {
      value = formData[field];
    }

    const result = validateField(field, value);
    if (!result.valid && result.error) {
      errors.push(`${field}: ${result.error}`);
    }
  });

  return errors;
};

// Utility function to get field display name
export const getFieldDisplayName = (fieldName: string): string => {
  const displayNames: Record<string, string> = {
    // Basic fields
    firstName: 'First Name',
    lastName: 'Last Name',
    nic: 'NIC/Passport',
    email: 'Email Address',
    phone: 'Phone Number',
    dateOfBirth: 'Date of Birth',
    gender: 'Gender',
    maritalStatus: 'Marital Status',
    occupation: 'Occupation',
    preferredLanguage: 'Preferred Language',

    // Address fields
    'address.street': 'Street Address',
    'address.city': 'City',
    'address.state': 'State/Province',
    'address.zipCode': 'ZIP/Postal Code',
    'address.country': 'Country',

    // Emergency contact
    'emergencyContact.name': 'Emergency Contact Name',
    'emergencyContact.phone': 'Emergency Contact Phone',
    'emergencyContact.relationship': 'Relationship',
    'emergencyContact.email': 'Emergency Contact Email',

    // Medical
    medicalHistory: 'Medical History',
    allergies: 'Allergies',
    medications: 'Medications',
    bloodType: 'Blood Type',
    height: 'Height',
    weight: 'Weight',
    lastVisit: 'Last Visit',

    // Insurance
    'insurance.provider': 'Insurance Provider',
    'insurance.policyNumber': 'Policy Number',
    'insurance.groupNumber': 'Group Number',
    'insurance.validUntil': 'Insurance Valid Until',
  };

  return displayNames[fieldName] || fieldName;
};

// Function to format error messages for display
export const formatErrorMessage = (
  fieldName: string,
  error: string
): string => {
  const displayName = getFieldDisplayName(fieldName);
  return `${displayName}: ${error}`;
};

// Zod schema alternative (if you want to use Zod for validation)
import { z } from 'zod';

export const patientSchema = z.object({
  // Basic Information
  firstName: z
    .string()
    .min(2, 'First name must be at least 2 characters')
    .max(50),
  lastName: z
    .string()
    .min(2, 'Last name must be at least 2 characters')
    .max(50),
  nic: z.string().refine(val => {
    const oldNicRegex = /^[0-9]{9}[VX]$/i;
    const newNicRegex = /^[0-9]{12}$/;
    return oldNicRegex.test(val) || newNicRegex.test(val);
  }, 'Please enter a valid NIC (9 digits with V/X or 12 digits)'),
  email: z
    .string()
    .email('Please enter a valid email address')
    .optional()
    .or(z.literal('')),
  phone: z
    .string()
    .regex(/^[\\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number'),
  dateOfBirth: z.string().refine(val => {
    const date = new Date(val);
    return !isNaN(date.getTime()) && date <= new Date();
  }, 'Please enter a valid date in the past'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),

  // Address (optional)
  address: z
    .object({
      street: z
        .string()
        .min(5, 'Street address must be at least 5 characters')
        .max(200),
      city: z.string().min(2, 'City must be at least 2 characters').max(100),
      state: z.string().min(2, 'State must be at least 2 characters').max(100),
      zipCode: z
        .string()
        .regex(/^[0-9]{5}(-[0-9]{4})?$/, 'Please enter a valid ZIP code')
        .optional()
        .or(z.literal('')),
      country: z
        .string()
        .min(2, 'Country must be at least 2 characters')
        .max(100),
    })
    .optional(),

  // Emergency Contact (optional)
  emergencyContact: z
    .object({
      name: z.string().min(2, 'Name must be at least 2 characters').max(100),
      phone: z
        .string()
        .regex(/^[+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number'),
      relationship: z
        .string()
        .min(2, 'Relationship must be at least 2 characters')
        .max(50),
      email: z
        .string()
        .email('Please enter a valid email address')
        .optional()
        .or(z.literal('')),
    })
    .optional(),

  // Medical Information (optional)
  medicalHistory: z.string().max(2000).optional(),
  allergies: z.array(z.string()).max(50).optional(),
  medications: z.array(z.string()).max(50).optional(),
  bloodType: z
    .enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
    .optional(),
  height: z.number().min(30).max(300).optional(),
  weight: z.number().min(1).max(300).optional(),

  // Insurance (optional)
  insurance: z
    .object({
      provider: z.string().max(100).optional(),
      policyNumber: z.string().max(50).optional(),
      groupNumber: z.string().max(50).optional(),
      validUntil: z.date().optional(),
    })
    .optional(),

  // Other fields
  isActive: z.boolean().default(true),
  maritalStatus: z
    .enum(['SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED'])
    .optional(),
  occupation: z.string().max(100).optional(),
  preferredLanguage: z.string().max(50).optional(),
  lastVisit: z.string().optional(),
});

// Type inference from Zod schema
export type PatientFormData = z.infer<typeof patientSchema>;

// Zod validation function
export const validateWithZod = (data: any): FormValidationResult => {
  try {
    const validatedData = patientSchema.parse(data);
    return {
      success: true,
      data: validatedData,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      error.issues.forEach(err => {
        const path = err.path.join('.');
        errors[path] = err.message;
      });
      return {
        success: false,
        errors,
      };
    }
    return {
      success: false,
      errors: { _error: 'Validation failed' },
    };
  }
};

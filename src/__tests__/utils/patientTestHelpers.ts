export const mockValidPatientData = {
  firstName: 'Jebarsan',
  lastName: 'Thatcroos',
  email: 'jebarsan.thatcroos@example.com',
  phone: '0712345678',
  nic: '200121901656',
  dateOfBirth: '2001-01-01',
  gender: 'MALE',
  address: {
    street: '123 Main St',
    city: 'Colombo',
    state: 'Western',
    zipCode: '00100',
    country: 'Sri Lanka',
  },
};

export const mockFullPatientData = {
  ...mockValidPatientData,
  emergencyContact: {
    name: 'jebarsan Thatcroos',
    phone: '0723456789',
    relationship: 'Wife',
    email: 'jane@example.com',
  },
  insurance: {
    provider: 'Health Insurance Co',
    policyNumber: 'POL123456',
    groupNumber: 'GRP789',
    validUntil: '2025-12-31',
  },
  medicalHistory: 'No major illnesses',
  allergies: ['Penicillin', 'Peanuts'],
  medications: ['Aspirin 100mg daily'],
  bloodType: 'A+',
  height: 175,
  weight: 70,
  maritalStatus: 'MARRIED',
  occupation: 'Software Engineer',
  preferredLanguage: 'English',
  isActive: true,
};

export const mockInvalidPatientData = {
  tooShortName: {
    ...mockValidPatientData,
    firstName: 'J',
  },
  invalidEmail: {
    ...mockValidPatientData,
    email: 'not-an-email',
  },
  invalidPhone: {
    ...mockValidPatientData,
    phone: '123',
  },
  invalidNIC: {
    ...mockValidPatientData,
    nic: 'invalid-nic',
  },
  invalidDateOfBirth: {
    ...mockValidPatientData,
    dateOfBirth: 'not-a-date',
  },
  invalidGender: {
    ...mockValidPatientData,
    gender: 'INVALID',
  },
  invalidHeight: {
    ...mockValidPatientData,
    height: 500,
  },
  invalidWeight: {
    ...mockValidPatientData,
    weight: 500,
  },
};

export const mockSessions = {
  admin: {
    user: {
      id: '1',
      email: 'admin@test.com',
      name: 'Admin User',
      role: 'ADMIN',
    },
    expires: '2024-12-31T23:59:59.999Z',
  },
  receptionist: {
    user: {
      id: '2',
      email: 'receptionist@test.com',
      name: 'Receptionist User',
      role: 'RECEPTIONIST',
    },
    expires: '2024-12-31T23:59:59.999Z',
  },
  patient: {
    user: {
      id: '3',
      email: 'patient@test.com',
      name: 'Patient User',
      role: 'PATIENT',
    },
    expires: '2024-12-31T23:59:59.999Z',
  },
  doctor: {
    user: {
      id: '4',
      email: 'doctor@test.com',
      name: 'Doctor User',
      role: 'DOCTOR',
    },
    expires: '2024-12-31T23:59:59.999Z',
  },
};

export const mockUsers = {
  admin: {
    _id: '1',
    email: 'admin@test.com',
    name: 'Admin User',
    role: 'ADMIN',
  },
  receptionist: {
    _id: '2',
    email: 'receptionist@test.com',
    name: 'Receptionist User',
    role: 'RECEPTIONIST',
  },
  patient: {
    _id: '3',
    email: 'patient@test.com',
    name: 'Patient User',
    role: 'PATIENT',
  },
  doctor: {
    _id: '4',
    email: 'doctor@test.com',
    name: 'Doctor User',
    role: 'DOCTOR',
  },
};

export const mockPatientResponse = (data: any) => ({
  _id: 'generated_id_123',
  ...data,
  createdAt: new Date(),
  updatedAt: new Date(),
  isActive: true,
});

export const mockDatabaseErrors = {
  duplicateKey: (field: string, value: string) => ({
    code: 11000,
    keyPattern: { [field]: 1 },
    keyValue: { [field]: value },
  }),
  validationError: (errors: Record<string, string>) => ({
    name: 'ValidationError',
    errors: Object.entries(errors).reduce((acc, [key, message]) => {
      acc[key] = { message };
      return acc;
    }, {} as any),
  }),
  connectionError: new Error('Database connection failed'),
  timeoutError: new Error('Query timeout'),
};

export const validNICFormats = {
  oldFormat: '912345678V',
  oldFormatX: '912345678X',
  oldFormatLowercase: '912345678v',
  newFormat: '200121901656',
};

export const invalidNICFormats = {
  tooShort: '12345678',
  tooLong: '2001219016567',
  noSuffix: '912345678',
  invalidSuffix: '912345678A',
  withSpaces: '912 345 678V',
  withDashes: '912-345-678V',
};

export const validPhoneFormats = {
  local: '0712345678',
  withCountryCode: '+94712345678',
  withSpaces: '071 234 5678',
  withDashes: '071-234-5678',
};

export const invalidPhoneFormats = {
  tooShort: '123',
  tooLong: '12345678901234567',
  letters: 'phone123',
  onlySpaces: '   ',
};

export const createMockRequest = (body: any) => {
  return new (class {
    async json() {
      return body;
    }
  })();
};

export const setupSuccessfulCreationMocks = (
  Patient: any,
  User: any,
  mockSession: any,
  mockUser: any,
  patientData: any
) => {
  (Patient.findOne as jest.Mock).mockResolvedValue(null);
  (Patient.create as jest.Mock).mockResolvedValue(
    mockPatientResponse(patientData)
  );

  if (User && mockUser) {
    (User.findOne as jest.Mock).mockResolvedValue(mockUser);
  }
};

// Helper to setup mocks for duplicate checks
export const setupDuplicateMocks = (
  Patient: any,
  field: 'nic' | 'email',
  value: string
) => {
  if (field === 'nic') {
    // NIC check returns duplicate
    (Patient.findOne as jest.Mock).mockResolvedValueOnce({
      _id: 'existing_id',
      [field]: value,
    });
  } else if (field === 'email') {
    // NIC check passes, email check returns duplicate
    (Patient.findOne as jest.Mock)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        _id: 'existing_id',
        [field]: value,
      });
  }
};

describe('Patient Test Helpers', () => {
  it('should export helper functions', () => {
    expect(mockValidPatientData).toBeDefined();
    expect(mockFullPatientData).toBeDefined();
  });
});

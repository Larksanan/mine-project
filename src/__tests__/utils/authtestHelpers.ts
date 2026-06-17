process.env.MONGODB_URI = 'mongodb://localhost:27017/test-db';
process.env.NEXTAUTH_SECRET = 'c305ovj/L8OWzTHVm2Pe31WFa4URPq7SxLQv8h7BabM=';
process.env.NEXTAUTH_URL = 'http://localhost:3000';

/**
 * Creates a mock Request object for testing API routes
 */
export function createMockRequest(
  url: string,
  options: {
    method?: string;
    headers?: Record<string, string>;
    body?: any;
  } = {}
): Request {
  const { method = 'GET', headers = {}, body } = options;

  const defaultHeaders: Record<string, string> = {
    'content-type': 'application/json',
    ...headers,
  };

  return new Request(url, {
    method,
    headers: defaultHeaders,
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * Valid test user data factory
 */
export const validUserData = {
  basic: {
    name: 'Jebarsan Thatcroos',
    email: 'john.doe@example.com',
    nic: '123456789V',
    password: 'SecurePass123!',
  },
  withRole: (role: string) => ({
    name: 'Jebarsan Thatcroos',
    email: 'john.doe@example.com',
    nic: '123456789V',
    password: 'SecurePass123!',
    role,
  }),
  withOptionalFields: {
    name: 'T Larksanan',
    email: 'larksanan.t@example.com',
    nic: '987654321X',
    password: 'AnotherPass456!',
    role: 'DOCTOR',
    phone: '+94771234567',
    department: 'Cardiology',
    specialization: 'Heart Surgery',
  },
  with12DigitNIC: {
    name: 'Bob Wilson',
    email: 'bob.wilson@example.com',
    nic: '200012345678',
    password: 'ValidPass789!',
  },
};

/**
 * Invalid test user data for validation testing
 */
export const invalidUserData = {
  shortName: {
    name: 'A',
    email: 'test@example.com',
    nic: '123456789V',
    password: 'Password123!',
  },
  longName: {
    name: 'A'.repeat(51),
    email: 'test@example.com',
    nic: '123456789V',
    password: 'Password123!',
  },
  nameWithNumbers: {
    name: 'jebarsanthtcroos123',
    email: 'test@example.com',
    nic: '123456789V',
    password: 'Password123!',
  },
  invalidEmail: {
    name: 'Jebarsan Thatcroos',
    email: 'invalid-email',
    nic: '123456789V',
    password: 'Password123!',
  },
  invalidNIC: {
    name: 'Jebarsan Thatcroos',
    email: 'test@example.com',
    nic: '12345',
    password: 'Password123!',
  },
  noUppercase: {
    name: 'Jebarsan Thatcroos',
    email: 'test@example.com',
    nic: '123456789V',
    password: 'password123!',
  },
  noLowercase: {
    name: 'Jebarsan Thatcroos',
    email: 'test@example.com',
    nic: '123456789V',
    password: 'PASSWORD123!',
  },
  noNumber: {
    name: 'Jebarsan Thatcroos',
    email: 'test@example.com',
    nic: '123456789V',
    password: 'Password!',
  },
  noSpecialChar: {
    name: 'Jebarsan Thatcroos',
    email: 'test@example.com',
    nic: '123456789V',
    password: 'Password123',
  },
  commonPassword: {
    name: 'Jebarsan Thatcroos',
    email: 'test@example.com',
    nic: '123456789V',
    password: 'Password123',
  },
  invalidPhone: {
    name: 'Jebarsan Thatcroos',
    email: 'test@example.com',
    nic: '123456789V',
    password: 'Password123!',
    phone: '123',
  },
};

/**
 * Mock user object factory
 */
export function createMockUser(overrides: Record<string, any> = {}) {
  return {
    _id: 'mock-user-id-123',
    name: 'Jebarsan Thatcroos',
    email: 'jebarsan.thatcroos@example.com',
    nic: '123456789V',
    password: 'hashedPassword',
    role: 'USER',
    isActive: true,
    emailVerified: null,
    lastLogin: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  };
}

/**
 * Mock database error factory
 */
export const mockDBErrors = {
  duplicateEmail: {
    code: 11000,
    keyPattern: { email: 1 },
  },
  duplicateNIC: {
    code: 11000,
    keyPattern: { nic: 1 },
  },
  validationError: (field: string, message: string) => ({
    name: 'ValidationError',
    errors: {
      [field]: { message },
    },
  }),
  networkError: {
    name: 'MongoNetworkError',
    message: 'Network connection failed',
  },
  timeoutError: {
    name: 'MongoTimeoutError',
    message: 'Connection timeout',
  },
};

/**
 * Assertion helpers
 */
export const assertResponse = {
  async isSuccessful(response: Response, expectedStatus: number = 200) {
    expect(response.status).toBe(expectedStatus);
    const data = await response.json();
    return data;
  },

  async hasError(
    response: Response,
    expectedStatus: number,
    expectedMessage?: string,
    expectedField?: string
  ) {
    expect(response.status).toBe(expectedStatus);
    const data = await response.json();

    if (expectedMessage) {
      expect(data.message).toBe(expectedMessage);
    }

    if (expectedField) {
      expect(data.field).toBe(expectedField);
    }

    return data;
  },

  async isValidationError(response: Response, field: string) {
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.field).toBe(field);
    expect(data.message).toBeDefined();
    return data;
  },

  async isDuplicateError(response: Response, field: string) {
    expect(response.status).toBe(409);
    const data = await response.json();
    expect(data.field).toBe(field);
    return data;
  },
};

describe('Auth Test Helpers', () => {
  it('should export helper functions', () => {
    expect(validUserData).toBeDefined();
    expect(createMockRequest).toBeDefined();
  });
});

/**
 * Test data generators
 */
export const generate = {
  email: (prefix: string = 'user') => `${prefix}-${Date.now()}@example.com`,

  nic: (type: '9digit' | '12digit' = '9digit') => {
    if (type === '9digit') {
      return `${Math.floor(Math.random() * 1000000000)}V`;
    }
    return `${Math.floor(Math.random() * 1000000000000)}`;
  },

  phone: (countryCode: string = '+94') => {
    const number = Math.floor(Math.random() * 1000000000);
    return `${countryCode}${number}`;
  },

  name: () => {
    const firstNames = ['John', 'Jane', 'Bob', 'Alice', 'Charlie'];
    const lastNames = ['Doe', 'Smith', 'Wilson', 'Brown', 'Davis'];
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    return `${firstName} ${lastName}`;
  },
};

/**
 * Wait helper for async operations
 */
export const wait = (ms: number) =>
  new Promise(resolve => setTimeout(resolve, ms));

// Type for User model mock
interface UserModelMock {
  findOne: jest.Mock;
  create: jest.Mock;
  [key: string]: any;
}

/**
 * Mock setup helpers
 */
export const mockSetup = {
  userNotFound: (UserMock: UserModelMock) => {
    UserMock.findOne = jest.fn().mockResolvedValue(null);
  },

  userExists: (UserMock: UserModelMock, user: Record<string, any>) => {
    UserMock.findOne = jest.fn().mockResolvedValue(user);
  },

  createUserSuccess: (UserMock: UserModelMock, user: Record<string, any>) => {
    UserMock.findOne = jest.fn().mockResolvedValue(null);
    UserMock.create = jest.fn().mockResolvedValue(user);
  },

  createUserFails: (UserMock: UserModelMock, error: Record<string, any>) => {
    UserMock.findOne = jest.fn().mockResolvedValue(null);
    UserMock.create = jest.fn().mockRejectedValue(error);
  },
};

// Type for API route handlers
type RouteHandler = (req: Request) => Promise<Response>;

/**
 * Common test patterns
 */
export const testPatterns = {
  /**
   * Test a validation rule
   */
  async testValidation(
    handler: RouteHandler,
    testData: Record<string, any>,
    expectedField: string,
    expectedMessagePattern?: RegExp
  ) {
    const req = createMockRequest('http://localhost:3000/test', {
      method: 'POST',
      body: testData,
    });

    const response = await handler(req);
    const data = await assertResponse.isValidationError(
      response,
      expectedField
    );

    if (expectedMessagePattern) {
      expect(data.message).toMatch(expectedMessagePattern);
    }

    return data;
  },
};

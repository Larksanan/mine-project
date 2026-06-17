/* eslint-disable @typescript-eslint/no-require-imports */

import { NextRequest } from 'next/server';
import { POST } from '../route';

// Mock console methods
const _originalConsoleLog = console.log;
const _originalConsoleError = console.error;

// Mock all dependencies
jest.mock('next/server', () => {
  return {
    NextRequest: class {
      url: string;
      method?: string;
      body?: any;
      headers: any;

      constructor(url: string, init?: { method?: string; body?: any }) {
        this.url = url;
        this.method = init?.method;
        this.body = init?.body;
        this.headers = { get: () => null };
      }

      json() {
        return Promise.resolve(this.body ? JSON.parse(this.body) : {});
      }
    },
    NextResponse: {
      json: (data: any, init?: { status?: number }) => ({
        json: async () => data,
        status: init?.status || 200,
      }),
    },
  };
});

describe('Contact Form API', () => {
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('POST /api/contact', () => {
    const validContactData = {
      name: 'John Doe',
      email: 'john@example.com',
      message: 'Hello, I have a question about your services.',
    };

    it('should handle contact form submission successfully', async () => {
      const req = new NextRequest('http://localhost:3000/api/contact', {
        method: 'POST',
        body: JSON.stringify(validContactData),
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Message sent successfully');

      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Contact form submitted:',
        expect.objectContaining({
          name: 'John Doe',
          email: 'john@example.com',
          message: 'Hello, I have a question about your services.',
        })
      );
    });

    it('should handle empty message', async () => {
      const dataWithEmptyMessage = {
        name: 'John Doe',
        email: 'john@example.com',
        message: '',
      };

      const req = new NextRequest('http://localhost:3000/api/contact', {
        method: 'POST',
        body: JSON.stringify(dataWithEmptyMessage),
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Contact form submitted:',
        expect.objectContaining({
          name: 'John Doe',
          email: 'john@example.com',
          message: '',
        })
      );
    });

    it('should handle minimal contact data', async () => {
      const minimalData = {
        name: 'Jane',
        email: 'jane@example.com',
        message: 'Hi',
      };

      const req = new NextRequest('http://localhost:3000/api/contact', {
        method: 'POST',
        body: JSON.stringify(minimalData),
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should handle long messages', async () => {
      const longMessage = 'A'.repeat(1000);
      const dataWithLongMessage = {
        name: 'John Doe',
        email: 'john@example.com',
        message: longMessage,
      };

      const req = new NextRequest('http://localhost:3000/api/contact', {
        method: 'POST',
        body: JSON.stringify(dataWithLongMessage),
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Contact form submitted:',
        expect.objectContaining({
          message: longMessage,
        })
      );
    });

    it('should handle names with special characters', async () => {
      const specialData = {
        name: "John O'Connor-Smith Jr.",
        email: 'john@example.com',
        message: 'Test message',
      };

      const req = new NextRequest('http://localhost:3000/api/contact', {
        method: 'POST',
        body: JSON.stringify(specialData),
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should handle international email addresses', async () => {
      const internationalData = {
        name: 'Hans Müller',
        email: 'hans.müller@example.de',
        message: 'Test message',
      };

      const req = new NextRequest('http://localhost:3000/api/contact', {
        method: 'POST',
        body: JSON.stringify(internationalData),
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should handle JSON parse errors', async () => {
      const req = new NextRequest('http://localhost:3000/api/contact', {
        method: 'POST',
        body: 'invalid json',
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to send message');
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should handle missing fields gracefully', async () => {
      // Note: The current implementation doesn't validate fields
      // This test shows what happens with missing fields
      const incompleteData = {
        name: 'John Doe',
        // Missing email and message
      };

      const req = new NextRequest('http://localhost:3000/api/contact', {
        method: 'POST',
        body: JSON.stringify(incompleteData),
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Contact form submitted:',
        expect.objectContaining({
          name: 'John Doe',
          email: undefined,
          message: undefined,
        })
      );
    });

    it('should handle null values', async () => {
      const dataWithNulls = {
        name: null,
        email: null,
        message: null,
      };

      const req = new NextRequest('http://localhost:3000/api/contact', {
        method: 'POST',
        body: JSON.stringify(dataWithNulls),
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should handle undefined values', async () => {
      const dataWithUndefined = {
        name: undefined,
        email: undefined,
        message: undefined,
      };

      const req = new NextRequest('http://localhost:3000/api/contact', {
        method: 'POST',
        body: JSON.stringify(dataWithUndefined),
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should handle extra fields in request', async () => {
      const dataWithExtraFields = {
        name: 'John Doe',
        email: 'john@example.com',
        message: 'Hello',
        phone: '1234567890',
        subject: 'Inquiry',
        customField: 'extra data',
      };

      const req = new NextRequest('http://localhost:3000/api/contact', {
        method: 'POST',
        body: JSON.stringify(dataWithExtraFields),
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Contact form submitted:',
        expect.objectContaining({
          name: 'John Doe',
          email: 'john@example.com',
          message: 'Hello',
        })
      );
    });

    it('should handle concurrent form submissions', async () => {
      const contact1 = {
        name: 'User 1',
        email: 'user1@example.com',
        message: 'Message 1',
      };

      const contact2 = {
        name: 'User 2',
        email: 'user2@example.com',
        message: 'Message 2',
      };

      const req1 = new NextRequest('http://localhost:3000/api/contact', {
        method: 'POST',
        body: JSON.stringify(contact1),
      });

      const req2 = new NextRequest('http://localhost:3000/api/contact', {
        method: 'POST',
        body: JSON.stringify(contact2),
      });

      const [res1, res2] = await Promise.all([POST(req1), POST(req2)]);
      const data1 = await res1.json();
      const data2 = await res2.json();

      expect(res1.status).toBe(200);
      expect(res2.status).toBe(200);
      expect(data1.success).toBe(true);
      expect(data2.success).toBe(true);
    });

    it('should handle non-Error exceptions', async () => {
      // Mock NextRequest to throw a string instead of Error
      const originalNextRequest = require('next/server').NextRequest;
      require('next/server').NextRequest = class {
        url: string;
        method?: string;
        body?: any;
        headers: any;

        constructor(url: string, init?: { method?: string; body?: any }) {
          this.url = url;
          this.method = init?.method;
          this.body = init?.body;
          this.headers = { get: () => null };
        }

        json() {
          throw 'String error, not Error object';
        }
      };

      try {
        const req = new NextRequest('http://localhost:3000/api/contact', {
          method: 'POST',
          body: JSON.stringify(validContactData),
        });

        const res = await POST(req);
        const data = await res.json();

        expect(res.status).toBe(500);
        expect(data.success).toBe(false);
        expect(data.error).toBe('Failed to send message');
        expect(data.details).toBe('Unknown error');
        expect(consoleErrorSpy).toHaveBeenCalled();
      } finally {
        // Restore original NextRequest
        require('next/server').NextRequest = originalNextRequest;
      }
    });

    it('should handle error with empty message', async () => {
      // Mock NextRequest to throw an Error with empty message
      const originalNextRequest = require('next/server').NextRequest;
      require('next/server').NextRequest = class {
        url: string;
        method?: string;
        body?: any;
        headers: any;

        constructor(url: string, init?: { method?: string; body?: any }) {
          this.url = url;
          this.method = init?.method;
          this.body = init?.body;
          this.headers = { get: () => null };
        }

        json() {
          const error = new Error();
          error.message = '';
          throw error;
        }
      };

      try {
        const req = new NextRequest('http://localhost:3000/api/contact', {
          method: 'POST',
          body: JSON.stringify(validContactData),
        });

        const res = await POST(req);
        const data = await res.json();

        expect(res.status).toBe(500);
        expect(data.success).toBe(false);
        expect(data.error).toBe('Failed to send message');
        expect(data.details).toBe('');
        expect(consoleErrorSpy).toHaveBeenCalled();
      } finally {
        // Restore original NextRequest
        require('next/server').NextRequest = originalNextRequest;
      }
    });

    it('should log appropriate messages to console', async () => {
      const req = new NextRequest('http://localhost:3000/api/contact', {
        method: 'POST',
        body: JSON.stringify(validContactData),
      });

      await POST(req);

      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Contact form submitted:',
        expect.any(Object)
      );
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('should log errors to console when request fails', async () => {
      // Mock NextRequest to throw an error
      const originalNextRequest = require('next/server').NextRequest;
      require('next/server').NextRequest = class {
        url: string;
        method?: string;
        body?: any;
        headers: any;

        constructor(url: string, init?: { method?: string; body?: any }) {
          this.url = url;
          this.method = init?.method;
          this.body = init?.body;
          this.headers = { get: () => null };
        }

        json() {
          throw new Error('Request parsing failed');
        }
      };

      try {
        const req = new NextRequest('http://localhost:3000/api/contact', {
          method: 'POST',
          body: JSON.stringify(validContactData),
        });

        await POST(req);

        expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Contact form error:',
          expect.any(Error)
        );
      } finally {
        // Restore original NextRequest
        require('next/server').NextRequest = originalNextRequest;
      }
    });

    it('should always return JSON response', async () => {
      const testCases = [
        { data: validContactData, shouldSucceed: true },
        { data: {}, shouldSucceed: true },
        { data: 'invalid', shouldSucceed: false },
      ];

      for (const testCase of testCases) {
        const req = new NextRequest('http://localhost:3000/api/contact', {
          method: 'POST',
          body:
            typeof testCase.data === 'string'
              ? testCase.data
              : JSON.stringify(testCase.data),
        });

        const res = await POST(req);
        const data = await res.json();

        expect(typeof data).toBe('object');
        expect(data).toHaveProperty('success');

        if (testCase.shouldSucceed) {
          expect(data.success).toBe(true);
          expect(data).toHaveProperty('message');
        } else {
          expect(data.success).toBe(false);
          expect(data).toHaveProperty('error');
          expect(data).toHaveProperty('details');
        }
      }
    });

    it('should handle HTML in messages', async () => {
      const dataWithHTML = {
        name: 'John Doe',
        email: 'john@example.com',
        message: '<script>alert("XSS")</script><p>Hello</p>',
      };

      const req = new NextRequest('http://localhost:3000/api/contact', {
        method: 'POST',
        body: JSON.stringify(dataWithHTML),
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Contact form submitted:',
        expect.objectContaining({
          message: '<script>alert("XSS")</script><p>Hello</p>',
        })
      );
    });

    it('should handle emoji in messages', async () => {
      const dataWithEmoji = {
        name: 'John ',
        email: 'john@example.com',
        message: 'Hello!  How are you? 🎉',
      };

      const req = new NextRequest('http://localhost:3000/api/contact', {
        method: 'POST',
        body: JSON.stringify(dataWithEmoji),
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });
});

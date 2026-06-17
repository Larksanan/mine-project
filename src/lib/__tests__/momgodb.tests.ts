/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable no-undef */
import mongoose from 'mongoose';

jest.mock('mongoose', () => ({
  connect: jest.fn(),
}));

describe('MongoDB Connection - connectDB', () => {
  let originalEnv: NodeJS.ProcessEnv;
  let connectDB: () => Promise<typeof mongoose>;
  let isolatedMongoose: typeof mongoose;

  beforeEach(() => {
    originalEnv = process.env;

    jest.resetModules();
    jest.clearAllMocks();

    if (global.mongoose) {
      delete global.mongoose;
    }

    process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
  });

  afterEach(() => {
    process.env = originalEnv;

    if (global.mongoose) {
      delete global.mongoose;
    }
  });

  describe('Environment Variable Validation', () => {
    it('should throw error when MONGODB_URI is not defined', () => {
      delete process.env.MONGODB_URI;

      expect(() => {
        jest.isolateModules(() => {
          require('../mongodb');
        });
      }).toThrow(
        'Please define the MONGODB_URI environment variable inside .env.local'
      );
    });

    it('should not throw when MONGODB_URI is defined', () => {
      process.env.MONGODB_URI = 'mongodb://localhost:27017/test';

      expect(() => {
        jest.isolateModules(() => {
          require('../mongodb');
        });
      }).not.toThrow();
    });
  });

  describe('Connection Caching', () => {
    beforeEach(() => {
      jest.isolateModules(() => {
        const module = require('../mongodb');
        connectDB = module.connectDB;
        isolatedMongoose = require('mongoose');
      });
    });

    it('should create a new connection on first call', async () => {
      const mockMongoose = { connection: 'mock' } as any;
      (isolatedMongoose.connect as jest.Mock).mockResolvedValue(mockMongoose);

      const result = await connectDB();

      expect(isolatedMongoose.connect).toHaveBeenCalledTimes(1);
      expect(isolatedMongoose.connect).toHaveBeenCalledWith(
        'mongodb://localhost:27017/test',
        {
          bufferCommands: false,
          maxPoolSize: 10,
          serverSelectionTimeoutMS: 5000,
          socketTimeoutMS: 45000,
        }
      );
      expect(result).toBe(mockMongoose);
    });

    it('should return cached connection on subsequent calls', async () => {
      const mockMongoose = { connection: 'mock' } as any;
      (isolatedMongoose.connect as jest.Mock).mockResolvedValue(mockMongoose);

      const result1 = await connectDB();

      const result2 = await connectDB();

      const result3 = await connectDB();

      expect(isolatedMongoose.connect).toHaveBeenCalledTimes(1);

      expect(result1).toBe(mockMongoose);
      expect(result2).toBe(mockMongoose);
      expect(result3).toBe(mockMongoose);
    });

    it('should use global mongoose cache across module instances', async () => {
      const mockMongoose = { connection: 'mock' } as any;
      (isolatedMongoose.connect as jest.Mock).mockResolvedValue(mockMongoose);

      await connectDB();

      let connectDB2: () => Promise<typeof mongoose>;
      jest.isolateModules(() => {
        const module = require('../mongodb');
        connectDB2 = module.connectDB;
      });

      await connectDB2!();

      expect(isolatedMongoose.connect).toHaveBeenCalledTimes(1);
    });

    it('should handle concurrent connection attempts', async () => {
      const mockMongoose = { connection: 'mock' } as any;
      (isolatedMongoose.connect as jest.Mock).mockImplementation(
        () =>
          new Promise(resolve => setTimeout(() => resolve(mockMongoose), 100))
      );

      const promise1 = connectDB();
      const promise2 = connectDB();
      const promise3 = connectDB();

      const results = await Promise.all([promise1, promise2, promise3]);

      expect(isolatedMongoose.connect).toHaveBeenCalledTimes(1);

      expect(results[0]).toBe(mockMongoose);
      expect(results[1]).toBe(mockMongoose);
      expect(results[2]).toBe(mockMongoose);
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      jest.isolateModules(() => {
        const module = require('../mongodb');
        connectDB = module.connectDB;
        isolatedMongoose = require('mongoose');
      });
    });

    it('should handle connection errors and clear promise cache', async () => {
      const connectionError = new Error('Connection failed');
      (isolatedMongoose.connect as jest.Mock).mockRejectedValue(
        connectionError
      );

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      await expect(connectDB()).rejects.toThrow(
        'Database connection failed. Please check your MongoDB Atlas IP whitelist and connection string.'
      );

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'MongoDB connection error:',
        connectionError
      );

      consoleErrorSpy.mockRestore();
    });

    it('should allow retry after failed connection', async () => {
      const connectionError = new Error('Connection failed');
      const mockMongoose = { connection: 'mock' } as any;

      (isolatedMongoose.connect as jest.Mock).mockRejectedValueOnce(
        connectionError
      );

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      await expect(connectDB()).rejects.toThrow(
        'Database connection failed. Please check your MongoDB Atlas IP whitelist and connection string.'
      );

      (isolatedMongoose.connect as jest.Mock).mockResolvedValueOnce(
        mockMongoose
      );

      const result = await connectDB();

      expect(result).toBe(mockMongoose);
      expect(isolatedMongoose.connect).toHaveBeenCalledTimes(2);

      consoleErrorSpy.mockRestore();
    });

    it('should clear promise cache on connection error', async () => {
      const connectionError = new Error('Connection failed');
      (isolatedMongoose.connect as jest.Mock).mockRejectedValue(
        connectionError
      );

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      try {
        await connectDB();
      } catch (error) {
        // Expected error
      }

      // Verify cache was cleared by checking if a new connection is attempted
      (isolatedMongoose.connect as jest.Mock).mockClear();
      const mockMongoose = { connection: 'mock' } as any;
      (isolatedMongoose.connect as jest.Mock).mockResolvedValue(mockMongoose);

      await connectDB();

      expect(isolatedMongoose.connect).toHaveBeenCalledTimes(1);

      consoleErrorSpy.mockRestore();
    });

    it('should preserve error message from mongoose.connect', async () => {
      const specificError = new Error('Network timeout');
      (isolatedMongoose.connect as jest.Mock).mockRejectedValue(specificError);

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      await expect(connectDB()).rejects.toThrow(
        'Database connection failed. Please check your MongoDB Atlas IP whitelist and connection string.'
      );

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'MongoDB connection error:',
        specificError
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Connection Options', () => {
    beforeEach(() => {
      jest.isolateModules(() => {
        const module = require('../mongodb');
        connectDB = module.connectDB;
        isolatedMongoose = require('mongoose');
      });
    });

    it('should use correct connection options', async () => {
      const mockMongoose = { connection: 'mock' } as any;
      (isolatedMongoose.connect as jest.Mock).mockResolvedValue(mockMongoose);

      await connectDB();

      expect(isolatedMongoose.connect).toHaveBeenCalledWith(
        'mongodb://localhost:27017/test',
        expect.objectContaining({
          bufferCommands: false,
          maxPoolSize: 10,
          serverSelectionTimeoutMS: 5000,
          socketTimeoutMS: 45000,
        })
      );
    });

    it('should use bufferCommands: false', async () => {
      const mockMongoose = { connection: 'mock' } as any;
      (isolatedMongoose.connect as jest.Mock).mockResolvedValue(mockMongoose);

      await connectDB();

      const callArgs = (isolatedMongoose.connect as jest.Mock).mock.calls[0][1];
      expect(callArgs.bufferCommands).toBe(false);
    });

    it('should set maxPoolSize to 10', async () => {
      const mockMongoose = { connection: 'mock' } as any;
      (isolatedMongoose.connect as jest.Mock).mockResolvedValue(mockMongoose);

      await connectDB();

      const callArgs = (isolatedMongoose.connect as jest.Mock).mock.calls[0][1];
      expect(callArgs.maxPoolSize).toBe(10);
    });

    it('should set serverSelectionTimeoutMS to 5000', async () => {
      const mockMongoose = { connection: 'mock' } as any;
      (isolatedMongoose.connect as jest.Mock).mockResolvedValue(mockMongoose);

      await connectDB();

      const callArgs = (isolatedMongoose.connect as jest.Mock).mock.calls[0][1];
      expect(callArgs.serverSelectionTimeoutMS).toBe(5000);
    });

    it('should set socketTimeoutMS to 45000', async () => {
      const mockMongoose = { connection: 'mock' } as any;
      (isolatedMongoose.connect as jest.Mock).mockResolvedValue(mockMongoose);

      await connectDB();

      const callArgs = (isolatedMongoose.connect as jest.Mock).mock.calls[0][1];
      expect(callArgs.socketTimeoutMS).toBe(45000);
    });
  });

  describe('Cache Initialization', () => {
    it('should initialize cache with null values', () => {
      // Clear global cache
      if (global.mongoose) {
        delete global.mongoose;
      }

      jest.isolateModules(() => {
        require('../mongodb');
      });

      expect(global.mongoose).toBeDefined();
      expect((global.mongoose as any)?.conn).toBeNull();
      expect((global.mongoose as any)?.promise).toBeNull();
    });

    it('should reuse existing global cache if available', () => {
      const existingCache = {
        conn: { test: 'existing' } as any,
        promise: Promise.resolve({ test: 'existing' } as any),
      };

      global.mongoose = existingCache;

      jest.isolateModules(() => {
        require('../mongodb');
      });

      expect(global.mongoose).toBe(existingCache);
    });
  });

  describe('Edge Cases', () => {
    beforeEach(() => {
      jest.isolateModules(() => {
        const module = require('../mongodb');
        connectDB = module.connectDB;
        isolatedMongoose = require('mongoose');
      });
    });

    it('should handle connection with different MongoDB URIs', async () => {
      const mockMongoose = { connection: 'mock' } as any;

      process.env.MONGODB_URI =
        'mongodb+srv://user:pass@cluster.mongodb.net/mydb';

      jest.isolateModules(() => {
        const module = require('../mongodb');
        connectDB = module.connectDB;
        isolatedMongoose = require('mongoose');
      });

      (isolatedMongoose.connect as jest.Mock).mockResolvedValue(mockMongoose);

      await connectDB();

      expect(isolatedMongoose.connect).toHaveBeenCalledWith(
        'mongodb+srv://user:pass@cluster.mongodb.net/mydb',
        expect.any(Object)
      );
    });

    it('should handle promise rejection during await', async () => {
      const connectionError = new Error('Promise rejection');
      (isolatedMongoose.connect as jest.Mock).mockRejectedValue(
        connectionError
      );

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      await expect(connectDB()).rejects.toThrow();

      expect(global.mongoose?.promise).toBeNull();

      consoleErrorSpy.mockRestore();
    });

    it('should maintain cache state across errors and successes', async () => {
      const connectionError = new Error('Connection failed');
      const mockMongoose = { connection: 'mock' } as any;

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      (isolatedMongoose.connect as jest.Mock).mockRejectedValueOnce(
        connectionError
      );
      await expect(connectDB()).rejects.toThrow();
      expect(global.mongoose?.conn).toBeNull();
      expect(global.mongoose?.promise).toBeNull();

      (isolatedMongoose.connect as jest.Mock).mockResolvedValueOnce(
        mockMongoose
      );
      await connectDB();
      expect(global.mongoose?.conn).toBe(mockMongoose);
      expect(global.mongoose?.promise).toBeDefined();

      const result = await connectDB();
      expect(result).toBe(mockMongoose);
      expect(isolatedMongoose.connect).toHaveBeenCalledTimes(2);

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Integration Scenarios', () => {
    beforeEach(() => {
      jest.isolateModules(() => {
        const module = require('../mongodb');
        connectDB = module.connectDB;
        isolatedMongoose = require('mongoose');
      });
    });

    it('should simulate real-world usage pattern', async () => {
      const mockMongoose = { connection: 'mock' } as any;
      (isolatedMongoose.connect as jest.Mock).mockResolvedValue(mockMongoose);

      const apiRoute1 = connectDB();
      const apiRoute2 = connectDB();
      const apiRoute3 = connectDB();

      const results = await Promise.all([apiRoute1, apiRoute2, apiRoute3]);

      expect(results.every(r => r === mockMongoose)).toBe(true);

      expect(isolatedMongoose.connect).toHaveBeenCalledTimes(1);
    });

    it('should handle rapid sequential calls', async () => {
      const mockMongoose = { connection: 'mock' } as any;
      (isolatedMongoose.connect as jest.Mock).mockResolvedValue(mockMongoose);

      for (let i = 0; i < 10; i++) {
        await connectDB();
      }

      expect(isolatedMongoose.connect).toHaveBeenCalledTimes(1);
    });

    it('should maintain connection through error and retry cycle', async () => {
      const connectionError = new Error('Temporary network issue');
      const mockMongoose = { connection: 'mock' } as any;

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      (isolatedMongoose.connect as jest.Mock).mockRejectedValueOnce(
        connectionError
      );
      await expect(connectDB()).rejects.toThrow();

      (isolatedMongoose.connect as jest.Mock).mockResolvedValueOnce(
        mockMongoose
      );
      const result1 = await connectDB();

      const result2 = await connectDB();
      const result3 = await connectDB();

      expect(result1).toBe(mockMongoose);
      expect(result2).toBe(mockMongoose);
      expect(result3).toBe(mockMongoose);
      expect(isolatedMongoose.connect).toHaveBeenCalledTimes(2);

      consoleErrorSpy.mockRestore();
    });
  });
});

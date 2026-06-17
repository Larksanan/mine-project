import { DELETE } from '../route';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import Notification from '@/models/Notification';

// Mock dependencies
jest.mock('next-auth');
jest.mock('@/lib/mongodb');
jest.mock('@/models/Notification');

const mockGetServerSession = getServerSession as jest.MockedFunction<
  typeof getServerSession
>;

describe('DELETE /api/notifications/[id]', () => {
  let mockContext: { params: Promise<{ id: string }> };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});

    // Default mock context
    mockContext = {
      params: Promise.resolve({ id: 'notification-id-123' }),
    };

    // Mock connectDB
    (connectDB as jest.Mock).mockResolvedValue(undefined);
  });

  it('should return 401 if user is not authenticated', async () => {
    // Arrange
    mockGetServerSession.mockResolvedValue(null);

    // Act
    const response = await DELETE({} as Request, mockContext);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(401);
    expect(data).toEqual({
      success: false,
      error: 'Unauthorized',
    });
    expect(mockGetServerSession).toHaveBeenCalled();
  });

  it('should return 401 if session exists but no user', async () => {
    // Arrange
    mockGetServerSession.mockResolvedValue({
      // Session exists but no user object
      expires: new Date().toISOString(),
    } as any);

    // Act
    const response = await DELETE({} as Request, mockContext);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(401);
    expect(data).toEqual({
      success: false,
      error: 'Unauthorized',
    });
  });

  it('should return 401 if session user has no id', async () => {
    // Arrange
    mockGetServerSession.mockResolvedValue({
      user: {
        name: 'John Doe',
        email: 'john@example.com',
        // No id property
      },
    } as any);

    // Act
    const response = await DELETE({} as Request, mockContext);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(401);
    expect(data).toEqual({
      success: false,
      error: 'Unauthorized',
    });
  });

  it('should delete notification successfully when user owns it', async () => {
    // Arrange
    const mockUserId = 'user-123';
    const mockNotificationId = 'notification-id-123';

    mockGetServerSession.mockResolvedValue({
      user: {
        id: mockUserId,
        name: 'John Doe',
        email: 'john@example.com',
      },
    } as any);

    mockContext = {
      params: Promise.resolve({ id: mockNotificationId }),
    };

    const mockDeleteResult = {
      acknowledged: true,
      deletedCount: 1,
    };

    (Notification.deleteOne as jest.Mock).mockResolvedValue(mockDeleteResult);

    // Act
    const response = await DELETE({} as Request, mockContext);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(data).toEqual({
      success: true,
      message: 'Notification deleted successfully',
    });

    // Verify the delete query
    expect(Notification.deleteOne).toHaveBeenCalledWith({
      _id: mockNotificationId,
      userId: mockUserId,
    });
    expect(connectDB).toHaveBeenCalled();
  });

  it('should return 404 if notification not found', async () => {
    // Arrange
    const mockUserId = 'user-123';
    const mockNotificationId = 'notification-id-123';

    mockGetServerSession.mockResolvedValue({
      user: {
        id: mockUserId,
        name: 'John Doe',
        email: 'john@example.com',
      },
    } as any);

    mockContext = {
      params: Promise.resolve({ id: mockNotificationId }),
    };

    const mockDeleteResult = {
      acknowledged: true,
      deletedCount: 0, // No document deleted
    };

    (Notification.deleteOne as jest.Mock).mockResolvedValue(mockDeleteResult);

    // Act
    const response = await DELETE({} as Request, mockContext);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(404);
    expect(data).toEqual({
      success: false,
      error: 'Notification not found',
    });

    expect(Notification.deleteOne).toHaveBeenCalledWith({
      _id: mockNotificationId,
      userId: mockUserId,
    });
  });

  it('should return 404 if notification belongs to different user', async () => {
    // Arrange
    const mockUserId = 'user-123';
    const mockNotificationId = 'notification-id-123';

    mockGetServerSession.mockResolvedValue({
      user: {
        id: mockUserId,
        name: 'John Doe',
        email: 'john@example.com',
      },
    } as any);

    mockContext = {
      params: Promise.resolve({ id: mockNotificationId }),
    };

    // Different user in the query will result in 0 deletions
    const mockDeleteResult = {
      acknowledged: true,
      deletedCount: 0,
    };

    (Notification.deleteOne as jest.Mock).mockResolvedValue(mockDeleteResult);

    // Act
    const response = await DELETE({} as Request, mockContext);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(404);
    expect(data).toEqual({
      success: false,
      error: 'Notification not found',
    });
  });

  it('should handle database connection errors', async () => {
    // Arrange
    const mockUserId = 'user-123';

    mockGetServerSession.mockResolvedValue({
      user: {
        id: mockUserId,
        name: 'John Doe',
        email: 'john@example.com',
      },
    } as any);

    // Mock connection error
    (connectDB as jest.Mock).mockRejectedValue(
      new Error('Database connection failed')
    );

    // Act
    const response = await DELETE({} as Request, mockContext);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(500);
    expect(data).toEqual({
      success: false,
      error: 'Internal server error',
    });
  });

  it('should handle delete operation errors', async () => {
    // Arrange
    const mockUserId = 'user-123';

    mockGetServerSession.mockResolvedValue({
      user: {
        id: mockUserId,
        name: 'John Doe',
        email: 'john@example.com',
      },
    } as any);

    // Mock delete error
    (Notification.deleteOne as jest.Mock).mockRejectedValue(
      new Error('Delete operation failed')
    );

    // Act
    const response = await DELETE({} as Request, mockContext);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(500);
    expect(data).toEqual({
      success: false,
      error: 'Internal server error',
    });
  });

  it('should handle invalid notification ID format', async () => {
    // Arrange
    const mockUserId = 'user-123';

    mockGetServerSession.mockResolvedValue({
      user: {
        id: mockUserId,
        name: 'John Doe',
        email: 'john@example.com',
      },
    } as any);

    // Simulate MongoDB CastError for invalid ID
    const castError = new Error('Cast to ObjectId failed');
    (castError as any).name = 'CastError';

    (Notification.deleteOne as jest.Mock).mockRejectedValue(castError);

    // Act
    const response = await DELETE({} as Request, mockContext);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(500);
    expect(data).toEqual({
      success: false,
      error: 'Internal server error',
    });

    // Note: Your current implementation doesn't specifically handle CastError
    // If you want to handle it specially, you could add:
    // if (error.name === 'CastError') {
    //   return NextResponse.json(
    //     { success: false, error: 'Invalid notification ID' },
    //     { status: 400 }
    //   );
    // }
  });

  it('should handle empty or invalid params', async () => {
    // Arrange
    const mockUserId = 'user-123';

    mockGetServerSession.mockResolvedValue({
      user: {
        id: mockUserId,
        name: 'John Doe',
        email: 'john@example.com',
      },
    } as any);

    // Test with empty ID
    mockContext = {
      params: Promise.resolve({ id: '' }),
    };

    // Act
    const response = await DELETE({} as Request, mockContext);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(500);
    expect(data).toEqual({
      success: false,
      error: 'Internal server error',
    });
  });

  it('should handle different session user structures', async () => {
    // Arrange
    const mockUserId = 'user-123';
    const mockNotificationId = 'notification-id-123';

    // Test with minimal user object
    mockGetServerSession.mockResolvedValue({
      user: {
        id: mockUserId,
        // No other properties
      },
    } as any);

    mockContext = {
      params: Promise.resolve({ id: mockNotificationId }),
    };

    const mockDeleteResult = {
      acknowledged: true,
      deletedCount: 1,
    };

    (Notification.deleteOne as jest.Mock).mockResolvedValue(mockDeleteResult);

    // Act
    const response = await DELETE({} as Request, mockContext);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(data).toEqual({
      success: true,
      message: 'Notification deleted successfully',
    });

    expect(Notification.deleteOne).toHaveBeenCalledWith({
      _id: mockNotificationId,
      userId: mockUserId,
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long notification IDs', async () => {
      // Arrange
      const mockUserId = 'user-123';
      const longNotificationId = 'a'.repeat(100); // Very long ID

      mockGetServerSession.mockResolvedValue({
        user: {
          id: mockUserId,
          name: 'John Doe',
        },
      } as any);

      mockContext = {
        params: Promise.resolve({ id: longNotificationId }),
      };

      const mockDeleteResult = {
        acknowledged: true,
        deletedCount: 0,
      };

      (Notification.deleteOne as jest.Mock).mockResolvedValue(mockDeleteResult);

      // Act
      const response = await DELETE({} as Request, mockContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(404);
      expect(data).toEqual({
        success: false,
        error: 'Notification not found',
      });

      expect(Notification.deleteOne).toHaveBeenCalledWith({
        _id: longNotificationId,
        userId: mockUserId,
      });
    });

    it('should handle special characters in notification ID', async () => {
      // Arrange
      const mockUserId = 'user-123';
      const specialId = 'notification-@#$%^&*()';

      mockGetServerSession.mockResolvedValue({
        user: {
          id: mockUserId,
          name: 'John Doe',
        },
      } as any);

      mockContext = {
        params: Promise.resolve({ id: specialId }),
      };

      const mockDeleteResult = {
        acknowledged: true,
        deletedCount: 1,
      };

      (Notification.deleteOne as jest.Mock).mockResolvedValue(mockDeleteResult);

      // Act
      const response = await DELETE({} as Request, mockContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        message: 'Notification deleted successfully',
      });

      expect(Notification.deleteOne).toHaveBeenCalledWith({
        _id: specialId,
        userId: mockUserId,
      });
    });

    it('should handle concurrent delete requests', async () => {
      // Arrange
      const mockUserId = 'user-123';
      const mockNotificationId = 'notification-id-123';

      mockGetServerSession.mockResolvedValue({
        user: {
          id: mockUserId,
          name: 'John Doe',
        },
      } as any);

      mockContext = {
        params: Promise.resolve({ id: mockNotificationId }),
      };

      // First call succeeds
      (Notification.deleteOne as jest.Mock)
        .mockResolvedValueOnce({
          acknowledged: true,
          deletedCount: 1,
        })
        // Second call finds nothing (already deleted)
        .mockResolvedValueOnce({
          acknowledged: true,
          deletedCount: 0,
        });

      // Act - First delete
      const response1 = await DELETE({} as Request, mockContext);
      const data1 = await response1.json();

      // Act - Second delete (concurrent)
      const response2 = await DELETE({} as Request, mockContext);
      const data2 = await response2.json();

      // Assert
      expect(response1.status).toBe(200);
      expect(data1).toEqual({
        success: true,
        message: 'Notification deleted successfully',
      });

      expect(response2.status).toBe(404);
      expect(data2).toEqual({
        success: false,
        error: 'Notification not found',
      });
    });

    it('should handle session with additional properties', async () => {
      // Arrange
      const mockUserId = 'user-123';
      const mockNotificationId = 'notification-id-123';

      // Session with additional properties
      mockGetServerSession.mockResolvedValue({
        user: {
          id: mockUserId,
          name: 'John Doe',
          email: 'john@example.com',
          role: 'ADMIN',
          image: 'https://example.com/avatar.jpg',
          customField: 'customValue',
        },
        expires: '2024-12-31T23:59:59.999Z',
        extraData: 'some-extra-data',
      } as any);

      mockContext = {
        params: Promise.resolve({ id: mockNotificationId }),
      };

      const mockDeleteResult = {
        acknowledged: true,
        deletedCount: 1,
      };

      (Notification.deleteOne as jest.Mock).mockResolvedValue(mockDeleteResult);

      // Act
      const response = await DELETE({} as Request, mockContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        message: 'Notification deleted successfully',
      });

      // Should only use the id from session.user
      expect(Notification.deleteOne).toHaveBeenCalledWith({
        _id: mockNotificationId,
        userId: mockUserId,
      });
    });
  });
});

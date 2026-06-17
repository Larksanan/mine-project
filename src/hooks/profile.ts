'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useCallback, useEffect } from 'react';
import {
  UserProfile,
  ProfileFormData,
  ApiResponse,
  UseProfileReturn,
  UseProfileImageReturn,
  ValidationResult,
  ProfileStats,
} from '@/types/profile';
import { validateProfileData } from '@/validation/profile';

// Main profile management hook
export function useProfile(): UseProfileReturn {
  const { data: session, update, status } = useSession();
  const _router = useRouter(); // Prefix with underscore to indicate intentional non-use
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user profile
  const fetchProfile = useCallback(async () => {
    if (!session?.user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Updated endpoint to match your API route
      const response = await fetch('/api/profile');
      const result: ApiResponse<UserProfile> = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch profile');
      }

      if (result.success && result.data) {
        setProfile(result.data);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch profile');
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.id]);

  // Update profile - fixed return type to match UseProfileReturn interface
  const updateProfile = useCallback(
    async (formData: Partial<ProfileFormData>): Promise<void> => {
      if (!session?.user?.id) {
        throw new Error('User not authenticated');
      }

      try {
        setIsLoading(true);
        setError(null);

        // Validate data based on user role
        const validation = validateProfileData(formData, profile?.role);
        if (!validation.success) {
          const errorMessage =
            validation.errors[0]?.message || 'Validation failed';
          throw new Error(errorMessage);
        }

        // Updated endpoint to match your API route
        const response = await fetch('/api/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(validation.data),
        });

        const result: ApiResponse<UserProfile> = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to update profile');
        }

        if (result.success && result.data) {
          setProfile(result.data);
          // Update session to reflect changes
          await update({
            ...session,
            user: {
              ...session.user,
              name: result.data.name,
              email: result.data.email,
              image: result.data.image,
            },
          });

          // Don't return anything to match Promise<void>
          return;
        }

        throw new Error('Failed to update profile');
      } catch (err) {
        console.error('Error updating profile:', err);
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to update profile';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [session, profile?.role, update]
  );

  // Refetch profile data
  const refetch = useCallback(async (): Promise<void> => {
    await fetchProfile();
  }, [fetchProfile]);

  // Initial fetch
  useEffect(() => {
    if (status === 'loading') return;

    if (session?.user?.id) {
      fetchProfile();
    } else {
      setIsLoading(false);
    }
  }, [session?.user?.id, status, fetchProfile]);

  return {
    profile,
    isLoading,
    error,
    updateProfile,
    refetch,
  };
}

// Profile image management hook
export function useProfileImage(): UseProfileImageReturn {
  const { data: session, update } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadImage = useCallback(
    async (file: File): Promise<string> => {
      if (!session?.user?.id) {
        throw new Error('User not authenticated');
      }

      try {
        setIsLoading(true);
        setError(null);

        const formData = new FormData();
        formData.append('image', file);

        // Updated endpoint to match your API route structure
        const response = await fetch('/api/profile/image', {
          method: 'POST',
          body: formData,
        });

        const result: ApiResponse<{ imageUrl: string }> = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to upload image');
        }

        if (result.success && result.data) {
          // Update session with new image
          await update({
            ...session,
            user: {
              ...session.user,
              image: result.data.imageUrl,
            },
          });

          return result.data.imageUrl;
        }

        throw new Error('Failed to upload image');
      } catch (err) {
        console.error('Error uploading image:', err);
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to upload image';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [session, update]
  );

  const removeImage = useCallback(async (): Promise<void> => {
    if (!session?.user?.id) {
      throw new Error('User not authenticated');
    }

    try {
      setIsLoading(true);
      setError(null);

      // Updated endpoint to match your API route structure
      const response = await fetch('/api/profile/image', {
        method: 'DELETE',
      });

      const result: ApiResponse = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to remove image');
      }

      if (result.success) {
        // Update session to remove image
        await update({
          ...session,
          user: {
            ...session.user,
            image: null,
          },
        });
      }
    } catch (err) {
      console.error('Error removing image:', err);
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to remove image';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [session, update]);

  return {
    uploadImage,
    removeImage,
    isLoading,
    error,
  };
}

// Profile form hook with validation
export function useProfileForm(initialData?: Partial<ProfileFormData>) {
  const [formData, setFormData] = useState<ProfileFormData>({
    name: initialData?.name || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    department: initialData?.department || '',
    specialization: initialData?.specialization || '',
    address: initialData?.address || '',
    bio: initialData?.bio || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const updateField = useCallback(
    (field: keyof ProfileFormData, value: string) => {
      setFormData(prev => ({ ...prev, [field]: value }));

      // Clear error when user starts typing
      if (errors[field]) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
      }
    },
    [errors]
  );

  const validateField = useCallback(
    (field: keyof ProfileFormData, role: string = 'USER') => {
      const validation = validateProfileData(
        { [field]: formData[field] },
        role
      );

      if (!validation.success) {
        const fieldError = validation.errors.find(
          error => error.field === field
        );
        if (fieldError) {
          setErrors(prev => ({ ...prev, [field]: fieldError.message }));
        }
      } else {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
      }
    },
    [formData]
  );

  const validateForm = useCallback(
    (role: string = 'USER'): ValidationResult => {
      const validation = validateProfileData(formData, role);

      if (!validation.success) {
        const errorMap = validation.errors.reduce(
          (acc, error) => {
            acc[error.field] = error.message;
            return acc;
          },
          {} as Record<string, string>
        );

        setErrors(errorMap);
      } else {
        setErrors({});
      }

      return validation;
    },
    [formData]
  );

  const markFieldAsTouched = useCallback((field: keyof ProfileFormData) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  }, []);

  const resetForm = useCallback((data?: Partial<ProfileFormData>) => {
    setFormData({
      name: data?.name || '',
      email: data?.email || '',
      phone: data?.phone || '',
      department: data?.department || '',
      specialization: data?.specialization || '',
      address: data?.address || '',
      bio: data?.bio || '',
    });
    setErrors({});
    setTouched({});
  }, []);

  return {
    formData,
    errors,
    touched,
    updateField,
    validateField,
    validateForm,
    markFieldAsTouched,
    resetForm,
    setFormData,
    hasErrors: Object.keys(errors).length > 0,
  };
}

// Hook for profile statistics
export function useProfileStats(userId?: string) {
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(
    async (id?: string) => {
      const targetUserId = id || userId;
      if (!targetUserId) return;

      try {
        setIsLoading(true);
        setError(null);

        // Updated endpoint to match your API route structure
        const response = await fetch('/api/profile/stats');
        const result: ApiResponse<ProfileStats> = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to fetch stats');
        }

        if (result.success && result.data) {
          setStats(result.data);
        }
      } catch (err) {
        console.error('Error fetching profile stats:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch stats');
      } finally {
        setIsLoading(false);
      }
    },
    [userId]
  );

  useEffect(() => {
    if (userId) {
      fetchStats();
    }
  }, [userId, fetchStats]);

  return {
    stats,
    isLoading,
    error,
    refetch: fetchStats,
  };
}

// Hook for password management
export function usePasswordManager() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const updatePassword = useCallback(
    async (currentPassword: string, newPassword: string): Promise<boolean> => {
      try {
        setIsLoading(true);
        setError(null);
        setSuccess(null);

        // Updated endpoint to match your API route structure
        const response = await fetch('/api/profile/password', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            currentPassword,
            newPassword,
          }),
        });

        const result: ApiResponse = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to update password');
        }

        if (result.success) {
          setSuccess('Password updated successfully');
          return true;
        }

        throw new Error('Failed to update password');
      } catch (err) {
        console.error('Error updating password:', err);
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to update password';
        setError(errorMessage);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const clearMessages = useCallback(() => {
    setError(null);
    setSuccess(null);
  }, []);

  return {
    updatePassword,
    isLoading,
    error,
    success,
    clearMessages,
  };
}

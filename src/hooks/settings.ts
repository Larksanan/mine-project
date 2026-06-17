'use client';

import { useSession } from 'next-auth/react';
import { useState, useCallback, useEffect } from 'react';
import {
  UserSettings,
  NotificationPreferences,
  PrivacySettings,
  SecuritySettings,
  SettingsUpdateResponse,
} from '@/types/settings';

export function useSettings() {
  const { data: session } = useSession();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<
    'idle' | 'saving' | 'success' | 'error'
  >('idle');

  // Fetch user settings
  const fetchSettings = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/settings');
      const result: SettingsUpdateResponse = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch settings');
      }

      if (result.success && result.data) {
        setSettings(result.data);
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch settings');
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.id]);

  // Update settings
  const updateSettings = useCallback(
    async (newSettings: Partial<UserSettings>): Promise<boolean> => {
      if (!session?.user?.id) return false;

      try {
        setSaveStatus('saving');
        setError(null);

        const response = await fetch('/api/settings', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newSettings),
        });

        const result: SettingsUpdateResponse = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to update settings');
        }

        if (result.success && result.data) {
          setSettings(result.data);
          setSaveStatus('success');

          // Reset success status after 3 seconds
          setTimeout(() => setSaveStatus('idle'), 3000);
          return true;
        }

        return false;
      } catch (err) {
        console.error('Error updating settings:', err);
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to update settings';
        setError(errorMessage);
        setSaveStatus('error');
        return false;
      }
    },
    [session?.user?.id]
  );

  // Update specific section with proper type handling
  const updateNotificationPreferences = useCallback(
    async (preferences: Partial<NotificationPreferences>) => {
      if (!settings?.notifications) return false;

      const updatedPreferences: NotificationPreferences = {
        ...settings.notifications,
        ...preferences,
      };

      return updateSettings({ notifications: updatedPreferences });
    },
    [settings?.notifications, updateSettings]
  );

  const updatePrivacySettings = useCallback(
    async (privacy: Partial<PrivacySettings>) => {
      if (!settings?.privacy) return false;

      const updatedPrivacy: PrivacySettings = {
        ...settings.privacy,
        ...privacy,
      };

      return updateSettings({ privacy: updatedPrivacy });
    },
    [settings?.privacy, updateSettings]
  );

  const updateSecuritySettings = useCallback(
    async (security: Partial<SecuritySettings>) => {
      if (!settings?.security) return false;

      const updatedSecurity: SecuritySettings = {
        ...settings.security,
        ...security,
      };

      return updateSettings({ security: updatedSecurity });
    },
    [settings?.security, updateSettings]
  );

  // Reset to defaults
  const resetToDefaults = useCallback(async () => {
    const defaultSettings: UserSettings = {
      theme: 'system',
      language: 'en',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12h',
      notifications: {
        email: true,
        push: true,
        sms: false,
        desktop: true,
        appointmentReminders: true,
        prescriptionUpdates: true,
        labResults: true,
        billingAlerts: true,
        marketingEmails: false,
        newsletter: false,
      },
      privacy: {
        profileVisibility: 'contacts',
        showOnlineStatus: true,
        allowMessaging: 'contacts',
        dataSharing: true,
        analytics: true,
      },
      security: {
        twoFactorAuth: false,
        loginAlerts: true,
        sessionTimeout: 60,
        passwordExpiry: 90,
      },
    };

    return updateSettings(defaultSettings);
  }, [updateSettings]);

  // Initial fetch
  useEffect(() => {
    if (session?.user?.id) {
      fetchSettings();
    }
  }, [session?.user?.id, fetchSettings]);

  return {
    settings,
    isLoading,
    error,
    saveStatus,
    fetchSettings,
    updateSettings,
    updateNotificationPreferences,
    updatePrivacySettings,
    updateSecuritySettings,
    resetToDefaults,
  };
}

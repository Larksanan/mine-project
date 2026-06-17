export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  notifications: NotificationPreferences;
  privacy: PrivacySettings;
  security: SecuritySettings;
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  sms: boolean;
  desktop: boolean;
  appointmentReminders: boolean;
  prescriptionUpdates: boolean;
  labResults: boolean;
  billingAlerts: boolean;
  marketingEmails: boolean;
  newsletter: boolean;
}

export interface PrivacySettings {
  profileVisibility: 'public' | 'contacts' | 'private';
  showOnlineStatus: boolean;
  allowMessaging: 'everyone' | 'contacts' | 'none';
  dataSharing: boolean;
  analytics: boolean;
}

export interface SecuritySettings {
  twoFactorAuth: boolean;
  loginAlerts: boolean;
  sessionTimeout: number; // minutes
  passwordExpiry: number; // days
}

export interface SettingsUpdateResponse {
  success: boolean;
  data?: UserSettings;
  message?: string;
  error?: string;
}

export const LANGUAGE_OPTIONS = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'si', name: 'Sinhala', nativeName: 'සිංහල' },
];

export const SRI_LANKA_TIMEZONES = ['Asia/Colombo', 'Asia/Dubai'];

export const DATE_FORMATS = [
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (Sri Lanka)' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (International)' },
  { value: 'DD MMM YYYY', label: 'DD MMM YYYY' },
];

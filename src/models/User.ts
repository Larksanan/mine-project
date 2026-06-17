import { Schema, model, models, Document, Types, Model } from 'mongoose';

export interface IUser {
  _id: Types.ObjectId; // Use Types.ObjectId for _id
  name: string;
  email: string;
  nic?: string; // Make NIC optional in the interface to match the schema
  password?: string;
  role: UserRole;
  image?: string;
  emailVerified?: Date;
  phone?: string;
  department?: string;
  specialization?: string;
  licenseNumber?: string;
  address?: string;
  bio?: string;
  isActive?: boolean;
  lastLogin?: Date;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  notificationPreferences?: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    inAppNotifications: boolean;
    appointmentReminders: boolean;
    messageAlerts: boolean;
    systemUpdates: boolean;
    marketingEmails: boolean;
  };
  settings?: {
    theme: 'light' | 'dark' | 'system';
    language: string;
    timezone: string;
    dateFormat: string;
    timeFormat: '12h' | '24h';
    notifications: {
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
    };
    privacy: {
      profileVisibility: 'public' | 'contacts' | 'private';
      showOnlineStatus: boolean;
      allowMessaging: 'everyone' | 'contacts' | 'none';
      dataSharing: boolean;
      analytics: boolean;
    };
    security: {
      twoFactorAuth: boolean;
      loginAlerts: boolean;
      sessionTimeout: number;
      passwordExpiry: number;
    };
  };
}

export type UserRole =
  | 'ADMIN'
  | 'DOCTOR'
  | 'NURSE'
  | 'RECEPTIONIST'
  | 'LABTECH'
  | 'PHARMACIST'
  | 'STAFF'
  | 'PATIENT'
  | 'USER';

// Define the settings type for better type safety
export type UserSettings = IUser['settings'];

export interface IUserDocument extends IUser, Document {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;

  // Virtuals
  displayName: string;
  roleDisplayName: string;

  // Methods
  isActiveUser(): boolean;
  hasRole(role: UserRole | UserRole[]): boolean;
  getSettings(): UserSettings;
  updateSettings(newSettings: Partial<UserSettings>): Promise<this>;
}

// Define static methods interface
export interface IUserModel extends Model<IUserDocument> {
  findActiveUsers(): Promise<IUserDocument[]>;
  findByRole(role: UserRole): Promise<IUserDocument[]>;
  findByLanguage(language: string): Promise<IUserDocument[]>;
}

const UserSchema = new Schema<IUserDocument, IUserModel>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please enter a valid email',
      ],
    },
    nic: {
      type: String,
      required: false,
      unique: true,
      sparse: true,
      trim: true,
      uppercase: true,
      match: [/^([0-9]{9}[VvXx]|[0-9]{12})$/, 'Invalid NIC format'],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      set: (v: any) => (v === '' || v === null ? undefined : v),
    },
    password: {
      type: String,
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: [
        'ADMIN',
        'DOCTOR',
        'NURSE',
        'RECEPTIONIST',
        'LABTECH',
        'PHARMACIST',
        'STAFF',
        'PATIENT',
        'USER',
      ],
      default: 'USER',
    },
    image: { type: String },
    emailVerified: { type: Date },
    phone: {
      type: String,
      match: [/^\+?[\d\s-()]+$/, 'Please enter a valid phone number'],
      trim: true,
    },
    department: {
      type: String,
      trim: true,
      maxlength: [100, 'Department cannot exceed 100 characters'],
    },
    specialization: {
      type: String,
      trim: true,
      maxlength: [100, 'Specialization cannot exceed 100 characters'],
    },
    licenseNumber: {
      type: String,
      trim: true,
      uppercase: true,
    },
    address: {
      type: String,
      trim: true,
      maxlength: [200, 'Address cannot exceed 200 characters'],
    },
    bio: {
      type: String,
      trim: true,
      maxlength: [500, 'Bio cannot exceed 500 characters'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
    notificationPreferences: {
      emailNotifications: { type: Boolean, default: true },
      pushNotifications: { type: Boolean, default: true },
      inAppNotifications: { type: Boolean, default: true },
      appointmentReminders: { type: Boolean, default: true },
      messageAlerts: { type: Boolean, default: true },
      systemUpdates: { type: Boolean, default: true },
      marketingEmails: { type: Boolean, default: false },
    },
    settings: {
      theme: {
        type: String,
        enum: ['light', 'dark', 'system'],
        default: 'system',
      },
      language: {
        type: String,
        default: 'en',
      },
      timezone: {
        type: String,
        default: 'Asia/Colombo',
      },
      dateFormat: {
        type: String,
        default: 'DD/MM/YYYY',
      },
      timeFormat: {
        type: String,
        enum: ['12h', '24h'],
        default: '12h',
      },
      notifications: {
        email: { type: Boolean, default: true },
        push: { type: Boolean, default: true },
        sms: { type: Boolean, default: false },
        desktop: { type: Boolean, default: true },
        appointmentReminders: { type: Boolean, default: true },
        prescriptionUpdates: { type: Boolean, default: true },
        labResults: { type: Boolean, default: true },
        billingAlerts: { type: Boolean, default: true },
        marketingEmails: { type: Boolean, default: false },
        newsletter: { type: Boolean, default: false },
      },
      privacy: {
        profileVisibility: {
          type: String,
          enum: ['public', 'contacts', 'private'],
          default: 'contacts',
        },
        showOnlineStatus: { type: Boolean, default: true },
        allowMessaging: {
          type: String,
          enum: ['everyone', 'contacts', 'none'],
          default: 'contacts',
        },
        dataSharing: { type: Boolean, default: true },
        analytics: { type: Boolean, default: true },
      },
      security: {
        twoFactorAuth: { type: Boolean, default: false },
        loginAlerts: { type: Boolean, default: true },
        sessionTimeout: { type: Number, default: 60 }, // minutes
        passwordExpiry: { type: Number, default: 90 }, // days
      },
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { _id, __v, password, ...rest } = ret;
        return {
          id: _id.toString(),
          ...rest,
        };
      },
    },
    toObject: { virtuals: true },
  }
);

// Virtual for display name
UserSchema.virtual('displayName').get(function (this: IUserDocument) {
  if (this.role === 'DOCTOR') {
    return `Dr. ${this.name}`;
  }
  return this.name;
});

// Virtual for role display name
UserSchema.virtual('roleDisplayName').get(function (this: IUserDocument) {
  const roleNames: Record<UserRole, string> = {
    ADMIN: 'Admin',
    DOCTOR: 'Medical Doctor',
    NURSE: 'Registered Nurse',
    PATIENT: 'Patient',
    RECEPTIONIST: 'Receptionist',
    LABTECH: 'Laboratory Technician',
    PHARMACIST: 'Pharmacist',
    STAFF: 'Staff Member',
    USER: 'User',
  };

  return roleNames[this.role] || this.role;
});

// Method to check if user is active
UserSchema.methods.isActiveUser = function (this: IUserDocument): boolean {
  return this.isActive === true && this.emailVerified !== null;
};

// Method to check role
UserSchema.methods.hasRole = function (
  this: IUserDocument,
  role: UserRole | UserRole[]
): boolean {
  if (Array.isArray(role)) {
    return role.includes(this.role);
  }
  return this.role === role;
};

// Method to get user settings with defaults
UserSchema.methods.getSettings = function (this: IUserDocument): UserSettings {
  const defaultSettings: UserSettings = {
    theme: 'system',
    language: 'en',
    timezone: 'Asia/Colombo',
    dateFormat: 'DD/MM/YYYY',
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

  if (!this.settings) {
    return defaultSettings;
  }

  return {
    ...defaultSettings,
    ...this.settings,
    notifications: {
      ...defaultSettings.notifications,
      ...(this.settings.notifications || {}),
    },
    privacy: {
      ...defaultSettings.privacy,
      ...(this.settings.privacy || {}),
    },
    security: {
      ...defaultSettings.security,
      ...(this.settings.security || {}),
    },
  };
};

UserSchema.index({ role: 1 });
UserSchema.index({ isActive: 1 });
UserSchema.index({ department: 1 });
UserSchema.index({ createdAt: -1 });
UserSchema.index({ 'settings.language': 1 });

// Static method to find active users
UserSchema.statics.findActiveUsers = function () {
  return this.find({ isActive: true, emailVerified: { $ne: null } });
};

// Static method to find by role
UserSchema.statics.findByRole = function (role: UserRole) {
  return this.find({ role, isActive: true });
};

// Static method to find by language preference
UserSchema.statics.findByLanguage = function (language: string) {
  return this.find({
    $or: [
      { 'settings.language': language },
      { 'settings.language': { $exists: false } },
    ],
    isActive: true,
  });
};

// Pre-save middleware to ensure settings are properly structured
UserSchema.pre('save', function (next) {
  // Ensure settings exist with proper structure
  if (!this.isModified('settings') || !this.settings) {
    return next();
  }

  // Ensure nested objects exist
  if (!this.settings.notifications) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.settings.notifications = {} as any;
  }

  if (!this.settings.privacy) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.settings.privacy = {} as any;
  }

  if (!this.settings.security) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.settings.security = {} as any;
  }

  next();
});

UserSchema.post(
  'save',
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function (error: any, doc: IUserDocument, next: any) {
    if (error.name === 'MongoServerError' && error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      next(
        new Error(
          `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`
        )
      );
    } else {
      next(error);
    }
  }
);

const User =
  models.User || model<IUserDocument, IUserModel>('User', UserSchema);

export default User;

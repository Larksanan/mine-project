import mongoose, { Schema, Document } from 'mongoose';

export interface INotificationPreferences extends Document {
  userId: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  inAppNotifications: boolean;
  appointmentReminders: boolean;
  messageAlerts: boolean;
  systemUpdates: boolean;
  marketingEmails: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationPreferencesSchema = new Schema<INotificationPreferences>(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    emailNotifications: {
      type: Boolean,
      default: true,
    },
    pushNotifications: {
      type: Boolean,
      default: true,
    },
    inAppNotifications: {
      type: Boolean,
      default: true,
    },
    appointmentReminders: {
      type: Boolean,
      default: true,
    },
    messageAlerts: {
      type: Boolean,
      default: true,
    },
    systemUpdates: {
      type: Boolean,
      default: true,
    },
    marketingEmails: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.NotificationPreferences ||
  mongoose.model<INotificationPreferences>(
    'NotificationPreferences',
    NotificationPreferencesSchema
  );

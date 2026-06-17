import mongoose from 'mongoose';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });
const defaultPreferences = {
  emailNotifications: true,
  pushNotifications: true,
  inAppNotifications: true,
  appointmentReminders: true,
  messageAlerts: true,
  systemUpdates: true,
  marketingEmails: false,
};
const userSchema = new mongoose.Schema({
  notificationPreferences: {
    type: Object,
    default: defaultPreferences,
  },
});
async function connectDB() {
  const mongoUri = process.env.MONGODB_URI;
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`MONGODB_URI exists: ${!!mongoUri}`);

  if (!mongoUri) {
    console.error('MONGODB_URI is not defined');
    console.log(`Current working directory: ${process.cwd()}`);
    process.exit(1);
  }

  if (mongoose.connection.readyState >= 1) {
    console.log('Already connected to MongoDB');
    return;
  }

  console.log(' Connecting to MongoDB...');
  await mongoose.connect(mongoUri);
  console.log(' Connected to MongoDB');
}

async function migrateNotificationPreferences() {
  try {
    console.log('Starting Notification Preferences Migration...');
    console.log('━'.repeat(50));

    await connectDB();

    const User = mongoose.models.User || mongoose.model('User', userSchema);

    console.log('Analyzing database...');

    const usersWithoutPrefs = await User.countDocuments({
      $or: [
        { notificationPreferences: { $exists: false } },
        { notificationPreferences: null },
      ],
    });

    const totalUsers = await User.countDocuments();

    console.log(`Total users: ${totalUsers}`);
    console.log(`Users without preferences: ${usersWithoutPrefs}`);
    console.log(`Users with preferences: ${totalUsers - usersWithoutPrefs}`);
    console.log('━'.repeat(50));

    if (usersWithoutPrefs === 0) {
      console.log('All users already have notification preferences!');
      console.log('No migration needed.');
      await mongoose.connection.close();
      process.exit(0);
    }

    console.log(`Updating ${usersWithoutPrefs} users...`);

    const result = await User.updateMany(
      {
        $or: [
          { notificationPreferences: { $exists: false } },
          { notificationPreferences: null },
        ],
      },
      {
        $set: { notificationPreferences: defaultPreferences },
      }
    );
    console.log(`Successfully updated ${result.modifiedCount} users`);
    console.log('Migration completed successfully!');

    await mongoose.connection.close();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed with error:');
    console.error(error);

    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('Disconnected from MongoDB');
    }
    process.exit(1);
  }
}

console.log('Starting migration script...');
console.log(`Working directory: ${process.cwd()}`);
migrateNotificationPreferences();

/* eslint-disable @typescript-eslint/no-explicit-any */
import { Schema, model, models, Document, Types, Model } from 'mongoose';

export interface IDoctorProfile {
  specialization: string;
  qualifications: string[];
  experience: number;
  consultationFee: number;
  availability: {
    days: string[];
    startTime: string;
    endTime: string;
  };
  hospitalAffiliation?: string;
  department: string;
  licenseNumber: string;
  licenseExpiry: Date;
  isVerified: boolean;
  languages: string[];
  services: string[];
  awards?: string[];
  publications?: string[];
  rating?: {
    average: number;
    count: number;
  };
}

export interface IDoctor extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  profile?: IDoctorProfile;
  appointments: Types.ObjectId[];
  patients: Types.ObjectId[];
  schedules: Types.ObjectId[];
  hospitalAffiliation?: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;

  // Virtuals
  fullTitle: string;
  isLicenseValid: boolean;
  availableToday: boolean;

  // Methods
  isAvailable(date: Date, time: string): boolean;
  getUpcomingAppointments(limit?: number): Promise<any[]>;
  getPatientStatistics(): Promise<{
    totalPatients: number;
    appointmentsThisMonth: number;
    averageRating: number;
  }>;
}

// Static methods interface
export interface IDoctorModel extends Model<IDoctor> {
  findBySpecialization(
    specialization: string,
    limit?: number
  ): Promise<IDoctor[]>;
  findAvailableDoctors(
    day: string,
    time: string,
    limit?: number
  ): Promise<IDoctor[]>;
  findTopRated(limit?: number): Promise<IDoctor[]>;
}

const DoctorProfileSchema = new Schema<IDoctorProfile>(
  {
    specialization: {
      type: String,
      required: [true, 'Specialization is required'],
      trim: true,
      maxlength: [100, 'Specialization cannot exceed 100 characters'],
    },
    qualifications: [
      {
        type: String,
        required: [true, 'At least one qualification is required'],
        trim: true,
      },
    ],
    experience: {
      type: Number,
      required: [true, 'Experience is required'],
      min: [0, 'Experience cannot be negative'],
      max: [60, 'Experience seems too high'],
    },
    consultationFee: {
      type: Number,
      required: [true, 'Consultation fee is required'],
      min: [0, 'Consultation fee cannot be negative'],
    },
    availability: {
      days: [
        {
          type: String,
          enum: [
            'Monday',
            'Tuesday',
            'Wednesday',
            'Thursday',
            'Friday',
            'Saturday',
            'Sunday',
          ],
          required: true,
        },
      ],
      startTime: {
        type: String,
        required: [true, 'Start time is required'],
        match: [
          /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
          'Please enter a valid time format (HH:MM)',
        ],
      },
      endTime: {
        type: String,
        required: [true, 'End time is required'],
        match: [
          /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
          'Please enter a valid time format (HH:MM)',
        ],
      },
    },
    hospitalAffiliation: {
      type: String,
      trim: true,
      maxlength: [200, 'Hospital affiliation cannot exceed 200 characters'],
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true,
      maxlength: [100, 'Department cannot exceed 100 characters'],
    },
    licenseNumber: {
      type: String,
      required: [true, 'License number is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    licenseExpiry: {
      type: Date,
      required: [true, 'License expiry date is required'],
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    languages: [
      {
        type: String,
        trim: true,
      },
    ],
    services: [
      {
        type: String,
        required: [true, 'At least one service is required'],
        trim: true,
      },
    ],
    awards: [
      {
        type: String,
        trim: true,
      },
    ],
    publications: [
      {
        type: String,
        trim: true,
      },
    ],
    rating: {
      average: {
        type: Number,
        default: 0,
        min: [0, 'Rating cannot be less than 0'],
        max: [5, 'Rating cannot exceed 5'],
      },
      count: {
        type: Number,
        default: 0,
        min: 0,
      },
    },
  },
  { _id: false }
);

const DoctorSchema = new Schema<IDoctor, IDoctorModel>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      unique: true,
    },
    profile: {
      type: DoctorProfileSchema,
      required: false,
    },
    appointments: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Appointment',
      },
    ],
    patients: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Patient',
      },
    ],
    schedules: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Schedule',
      },
    ],
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        const { _id, __v, ...rest } = ret;
        return {
          id: _id.toString(),
          ...rest,
        };
      },
    },
    toObject: { virtuals: true },
  }
);

// Virtual for full title
DoctorSchema.virtual('fullTitle').get(function (this: IDoctor) {
  const userName = (this as any).user?.name || 'Doctor';
  if (!this.profile) return `Dr. ${userName}`;
  return `Dr. ${userName} - ${this.profile.specialization}`;
});

// Virtual to check if license is valid
DoctorSchema.virtual('isLicenseValid').get(function (this: IDoctor) {
  if (!this.profile) return false;
  return this.profile.licenseExpiry > new Date();
});

// Virtual to check availability today
DoctorSchema.virtual('availableToday').get(function (this: IDoctor) {
  if (!this.profile) return false;
  const today = new Date().toLocaleString('en-US', { weekday: 'long' });
  return this.profile.availability.days.includes(today);
});

// Method to check availability for a specific date and time
DoctorSchema.methods.isAvailable = function (
  this: IDoctor,
  date: Date,
  time: string
): boolean {
  if (!this.profile) return false;

  const day = date.toLocaleString('en-us', { weekday: 'long' });

  if (!this.profile.availability.days.includes(day)) {
    return false;
  }

  const [hour, minute] = time.split(':').map(Number);
  const [startHour, startMinute] = this.profile.availability.startTime
    .split(':')
    .map(Number);
  const [endHour, endMinute] = this.profile.availability.endTime
    .split(':')
    .map(Number);

  const appointmentTime = hour * 60 + minute;
  const startTime = startHour * 60 + startMinute;
  const endTime = endHour * 60 + endMinute;

  return appointmentTime >= startTime && appointmentTime <= endTime;
};

// Method to get upcoming appointments
DoctorSchema.methods.getUpcomingAppointments = async function (
  this: IDoctor,
  limit: number = 10
): Promise<any[]> {
  const Appointment = models.Appointment || model('Appointment');
  return await Appointment.find({
    doctor: this._id,
    date: { $gte: new Date() },
  })
    .populate('patient', 'name email phone')
    .sort({ date: 1, time: 1 })
    .limit(limit)
    .exec();
};

// Method to get patient statistics
DoctorSchema.methods.getPatientStatistics = async function (
  this: IDoctor
): Promise<{
  totalPatients: number;
  appointmentsThisMonth: number;
  averageRating: number;
}> {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const Appointment = models.Appointment || model('Appointment');

  const [totalPatients, appointmentsThisMonth] = await Promise.all([
    Appointment.distinct('patient', { doctor: this._id }).then(
      (patients: any[]) => patients.length
    ),
    Appointment.countDocuments({
      doctor: this._id,
      date: { $gte: startOfMonth },
    }),
  ]);

  return {
    totalPatients,
    appointmentsThisMonth,
    averageRating: this.profile?.rating?.average || 0,
  };
};

// Static method to find doctors by specialization
DoctorSchema.statics.findBySpecialization = function (
  this: IDoctorModel,
  specialization: string,
  limit: number = 10
) {
  return this.find({
    'profile.specialization': new RegExp(specialization, 'i'),
    'profile.isVerified': true,
    'profile.licenseExpiry': { $gt: new Date() },
  })
    .populate('user', 'name email phone image')
    .limit(limit)
    .exec();
};

// Static method to find available doctors for a specific day and time
DoctorSchema.statics.findAvailableDoctors = function (
  this: IDoctorModel,
  day: string,
  time: string,
  limit: number = 10
) {
  return this.find({
    'profile.availability.days': day,
    'profile.isVerified': true,
    'profile.licenseExpiry': { $gt: new Date() },
  })
    .populate('user', 'name email phone image')
    .limit(limit)
    .exec();
};

// Static method to find top-rated doctors
DoctorSchema.statics.findTopRated = function (
  this: IDoctorModel,
  limit: number = 10
) {
  return this.find({
    'profile.isVerified': true,
    'profile.licenseExpiry': { $gt: new Date() },
    'profile.rating.count': { $gte: 5 },
  })
    .populate('user', 'name email phone image')
    .sort({ 'profile.rating.average': -1 })
    .limit(limit)
    .exec();
};

// Indexes for better query performance

DoctorSchema.index({ 'profile.specialization': 1 });
DoctorSchema.index({ 'profile.department': 1 });
DoctorSchema.index({ 'profile.isVerified': 1 });
DoctorSchema.index({ 'profile.licenseExpiry': 1 });
DoctorSchema.index({ createdAt: -1 });

// Middleware to update user role to DOCTOR when doctor profile is created
DoctorSchema.pre('save', async function (next) {
  if (this.isNew) {
    const User = models.User || model('User');
    await User.findByIdAndUpdate(this.user, { role: 'DOCTOR' });
  }
  next();
});

const Doctor =
  (models.Doctor as IDoctorModel) ||
  model<IDoctor, IDoctorModel>('Doctor', DoctorSchema);

export default Doctor;

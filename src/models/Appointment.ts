/* eslint-disable @typescript-eslint/no-explicit-any */
import { Schema, model, models, Document, Types, Model } from 'mongoose';

export type AppointmentStatus =
  | 'SCHEDULED'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW';

export type AppointmentType =
  | 'CONSULTATION'
  | 'FOLLOW_UP'
  | 'EMERGENCY'
  | 'CHECK_UP'
  | 'MEDICATION_REVIEW'
  | 'CHRONIC_DISEASE_MANAGEMENT'
  | 'VACCINATION'
  | 'HEALTH_SCREENING'
  | 'PRESCRIPTION_CONSULTATION'
  | 'OTHER';

export interface IAppointment {
  patient: Types.ObjectId;
  doctor?: Types.ObjectId;
  pharmacist?: Types.ObjectId;
  pharmacy?: Types.ObjectId;
  appointmentDate: Date;
  appointmentTime: string;
  duration: number;
  type: AppointmentType;
  serviceType?: AppointmentType;
  status: AppointmentStatus;
  reason: string;
  symptoms?: string;
  diagnosis?: string;
  prescription?: string;
  notes?: string;
  prescriptionRefills?: {
    medication: string;
    dosage: string;
    quantity: number;
    refillsLeft: number;
  }[];
  vitalSigns?: {
    bloodPressure: string;
    heartRate: number;
    temperature: number;
    weight: number;
    height: number;
  };
  followUpRequired?: boolean;
  followUpDate?: Date;
  isActive?: boolean;
}

export interface IAppointmentDocument extends IAppointment, Document {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;

  // Virtuals
  isUpcoming: boolean;
  isPast: boolean;
  isToday: boolean;
  timeSlot: string;

  // Methods
  canBeCancelled(): boolean;
  canBeRescheduled(): boolean;
  updateStatus(newStatus: AppointmentStatus): Promise<IAppointmentDocument>;
  reschedule(newDate: Date, newTime: string): Promise<IAppointmentDocument>;
  addPrescriptionRefill(refillData: any): void;
  recordVitalSigns(vitals: any): void;
}

// Static methods interface
export interface IAppointmentModel extends Model<IAppointmentDocument> {
  findByDoctor(
    doctorId: Types.ObjectId,
    filters?: any
  ): Promise<IAppointmentDocument[]>;
  findByPharmacist(
    pharmacistId: Types.ObjectId,
    filters?: any
  ): Promise<IAppointmentDocument[]>;
  findByDateRange(
    startDate: Date,
    endDate: Date,
    providerId?: Types.ObjectId
  ): Promise<IAppointmentDocument[]>;
  findUpcomingByDoctor(
    doctorId: string,
    limit?: number
  ): Promise<IAppointmentDocument[]>;
  findUpcomingByPharmacist(
    pharmacistId: string,
    limit?: number
  ): Promise<IAppointmentDocument[]>;
  findTodayByDoctor(doctorId: string): Promise<IAppointmentDocument[]>;
  findTodayByPharmacist(pharmacistId: string): Promise<IAppointmentDocument[]>;
  findByPatient(patientId: string): Promise<IAppointmentDocument[]>;
  getStats(
    providerId: Types.ObjectId,
    startDate: Date,
    endDate: Date
  ): Promise<any[]>;
}

const AppointmentSchema = new Schema<IAppointmentDocument, IAppointmentModel>(
  {
    patient: {
      type: Schema.Types.ObjectId,
      ref: 'Patient',
      required: [true, 'Patient is required'],
    },
    doctor: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    pharmacist: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    pharmacy: {
      type: Schema.Types.ObjectId,
      ref: 'Pharmacy',
      required: false,
    },
    appointmentDate: {
      type: Date,
      required: [true, 'Appointment date is required'],
      validate: {
        validator: function (value: Date) {
          return value >= new Date(new Date().setHours(0, 0, 0, 0));
        },
        message: 'Appointment date cannot be in the past',
      },
    },
    appointmentTime: {
      type: String,
      required: [true, 'Appointment time is required'],
      match: [
        /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
        'Time must be in HH:MM format',
      ],
    },
    duration: {
      type: Number,
      default: 30,
      min: [15, 'Duration must be at least 15 minutes'],
      max: [120, 'Duration cannot exceed 120 minutes'],
    },
    type: {
      type: String,
      enum: [
        'CONSULTATION',
        'FOLLOW_UP',
        'EMERGENCY',
        'CHECK_UP',
        'MEDICATION_REVIEW',
        'CHRONIC_DISEASE_MANAGEMENT',
        'VACCINATION',
        'HEALTH_SCREENING',
        'PRESCRIPTION_CONSULTATION',
        'OTHER',
      ],
      required: [true, 'Appointment type is required'],
    },
    serviceType: {
      type: String,
      enum: [
        'CONSULTATION',
        'FOLLOW_UP',
        'EMERGENCY',
        'CHECK_UP',
        'MEDICATION_REVIEW',
        'CHRONIC_DISEASE_MANAGEMENT',
        'VACCINATION',
        'HEALTH_SCREENING',
        'PRESCRIPTION_CONSULTATION',
        'OTHER',
      ],
      required: false,
    },
    status: {
      type: String,
      enum: [
        'SCHEDULED',
        'CONFIRMED',
        'IN_PROGRESS',
        'COMPLETED',
        'CANCELLED',
        'NO_SHOW',
      ],
      default: 'SCHEDULED',
    },
    reason: {
      type: String,
      required: [true, 'Reason for appointment is required'],
      trim: true,
      maxlength: [500, 'Reason cannot exceed 500 characters'],
    },
    symptoms: {
      type: String,
      trim: true,
      maxlength: [1000, 'Symptoms cannot exceed 1000 characters'],
    },
    diagnosis: {
      type: String,
      trim: true,
      maxlength: [1000, 'Diagnosis cannot exceed 1000 characters'],
    },
    prescription: {
      type: String,
      trim: true,
      maxlength: [2000, 'Prescription cannot exceed 2000 characters'],
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
    },
    prescriptionRefills: [
      {
        medication: {
          type: String,
          required: true,
          trim: true,
        },
        dosage: {
          type: String,
          required: true,
          trim: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        refillsLeft: {
          type: Number,
          required: true,
          min: 0,
        },
      },
    ],
    vitalSigns: {
      bloodPressure: {
        type: String,
        match: [
          /^\d{2,3}\/\d{2,3}$/,
          'Blood pressure must be in format XXX/XX',
        ],
      },
      heartRate: {
        type: Number,
        min: [30, 'Heart rate must be realistic'],
        max: [200, 'Heart rate must be realistic'],
      },
      temperature: {
        type: Number,
        min: [35, 'Temperature must be realistic'],
        max: [42, 'Temperature must be realistic'],
      },
      weight: {
        type: Number,
        min: [0, 'Weight must be positive'],
        max: [500, 'Weight must be realistic'],
      },
      height: {
        type: Number,
        min: [0, 'Height must be positive'],
        max: [300, 'Height must be realistic'],
      },
    },
    followUpRequired: {
      type: Boolean,
      default: false,
    },
    followUpDate: {
      type: Date,
      validate: {
        validator: function (value: Date) {
          return !value || value > new Date();
        },
        message: 'Follow-up date must be in the future',
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
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

// Pre-save middleware to sync type and serviceType
AppointmentSchema.pre('save', function (next) {
  if (this.type && !this.serviceType) {
    this.serviceType = this.type;
  }
  next();
});

// Validation: Either doctor or pharmacist must be present
AppointmentSchema.pre('save', function (next) {
  if (!this.doctor && !this.pharmacist) {
    next(new Error('Either doctor or pharmacist is required'));
  }
  next();
});

// Virtuals
AppointmentSchema.virtual('isUpcoming').get(function (
  this: IAppointmentDocument
) {
  const now = new Date();
  const appointmentDateTime = new Date(this.appointmentDate);
  const [hours, minutes] = this.appointmentTime.split(':').map(Number);
  appointmentDateTime.setHours(hours, minutes, 0, 0);

  return appointmentDateTime > now && this.status === 'SCHEDULED';
});

AppointmentSchema.virtual('isPast').get(function (this: IAppointmentDocument) {
  const now = new Date();
  const appointmentDateTime = new Date(this.appointmentDate);
  const [hours, minutes] = this.appointmentTime.split(':').map(Number);
  appointmentDateTime.setHours(hours, minutes, 0, 0);

  return appointmentDateTime < now;
});

AppointmentSchema.virtual('isToday').get(function (this: IAppointmentDocument) {
  const today = new Date();
  const appointmentDate = new Date(this.appointmentDate);
  return today.toDateString() === appointmentDate.toDateString();
});

AppointmentSchema.virtual('timeSlot').get(function (
  this: IAppointmentDocument
) {
  return `${this.appointmentTime} - ${new Date(this.appointmentDate).toLocaleDateString()}`;
});

// Methods
AppointmentSchema.methods.canBeCancelled = function (
  this: IAppointmentDocument
): boolean {
  const cancellableStatuses = ['SCHEDULED', 'CONFIRMED'];
  return cancellableStatuses.includes(this.status);
};

AppointmentSchema.methods.canBeRescheduled = function (
  this: IAppointmentDocument
): boolean {
  const reschedulableStatuses = ['SCHEDULED', 'CONFIRMED'];
  return reschedulableStatuses.includes(this.status);
};

AppointmentSchema.methods.updateStatus = function (
  this: IAppointmentDocument,
  newStatus: AppointmentStatus
): Promise<IAppointmentDocument> {
  this.status = newStatus;
  return this.save();
};

AppointmentSchema.methods.reschedule = function (
  this: IAppointmentDocument,
  newDate: Date,
  newTime: string
): Promise<IAppointmentDocument> {
  this.appointmentDate = newDate;
  this.appointmentTime = newTime;
  this.status = 'SCHEDULED';
  return this.save();
};

AppointmentSchema.methods.addPrescriptionRefill = function (
  this: IAppointmentDocument,
  refillData: any
): void {
  if (!this.prescriptionRefills) {
    this.prescriptionRefills = [];
  }
  this.prescriptionRefills.push(refillData);
};

AppointmentSchema.methods.recordVitalSigns = function (
  this: IAppointmentDocument,
  vitals: any
): void {
  this.vitalSigns = { ...this.vitalSigns, ...vitals };
};

// Static Methods for Doctor appointments
AppointmentSchema.statics.findByDoctor = function (
  doctorId: Types.ObjectId,
  filters: any = {}
) {
  const query = { doctor: doctorId, isActive: true, ...filters };
  return this.find(query)
    .populate('patient')
    .sort({ appointmentDate: 1, appointmentTime: 1 })
    .exec();
};

AppointmentSchema.statics.findUpcomingByDoctor = function (
  doctorId: string,
  limit: number = 10
) {
  const now = new Date();
  return this.find({
    doctor: doctorId,
    appointmentDate: { $gte: now },
    status: { $in: ['SCHEDULED', 'CONFIRMED'] },
    isActive: true,
  })
    .populate('patient')
    .sort({ appointmentDate: 1, appointmentTime: 1 })
    .limit(limit)
    .exec();
};

AppointmentSchema.statics.findTodayByDoctor = function (doctorId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return this.find({
    doctor: doctorId,
    appointmentDate: { $gte: today, $lt: tomorrow },
    status: { $in: ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS'] },
    isActive: true,
  })
    .populate('patient')
    .sort({ appointmentTime: 1 })
    .exec();
};

// Static Methods for Pharmacist appointments
AppointmentSchema.statics.findByPharmacist = function (
  pharmacistId: Types.ObjectId,
  filters: any = {}
) {
  const query = { pharmacist: pharmacistId, isActive: true, ...filters };
  return this.find(query)
    .populate('patient')
    .populate('pharmacy', 'name address phone')
    .sort({ appointmentDate: 1, appointmentTime: 1 })
    .exec();
};

AppointmentSchema.statics.findByDateRange = function (
  startDate: Date,
  endDate: Date,
  providerId?: Types.ObjectId
) {
  const query: any = {
    appointmentDate: { $gte: startDate, $lte: endDate },
    isActive: true,
  };

  if (providerId) {
    query.$or = [{ doctor: providerId }, { pharmacist: providerId }];
  }

  return this.find(query)
    .populate('patient')
    .populate('pharmacy', 'name address')
    .sort({ appointmentDate: 1, appointmentTime: 1 })
    .exec();
};

AppointmentSchema.statics.findUpcomingByPharmacist = function (
  pharmacistId: string,
  limit: number = 10
) {
  const now = new Date();
  return this.find({
    pharmacist: pharmacistId,
    appointmentDate: { $gte: now },
    status: { $in: ['SCHEDULED', 'CONFIRMED'] },
    isActive: true,
  })
    .populate({
      path: 'patient',
      populate: {
        path: 'userId',
        select: 'firstName lastName email phone dateOfBirth gender',
      },
    })
    .populate('pharmacy', 'name address phone')
    .sort({ appointmentDate: 1, appointmentTime: 1 })
    .limit(limit)
    .exec();
};

AppointmentSchema.statics.findTodayByPharmacist = function (
  pharmacistId: string
) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return this.find({
    pharmacist: pharmacistId,
    appointmentDate: { $gte: today, $lt: tomorrow },
    status: { $in: ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS'] },
    isActive: true,
  })
    .populate({
      path: 'patient',
      populate: {
        path: 'userId',
        select: 'firstName lastName email phone dateOfBirth gender',
      },
    })
    .populate('pharmacy', 'name address phone')
    .sort({ appointmentTime: 1 })
    .exec();
};

AppointmentSchema.statics.findByPatient = function (patientId: string) {
  return this.find({
    patient: patientId,
    isActive: true,
  })
    .populate('doctor', 'firstName lastName email phone')
    .populate('pharmacist', 'firstName lastName email phone')
    .populate('pharmacy', 'name address phone')
    .sort({ appointmentDate: -1, appointmentTime: -1 })
    .exec();
};

AppointmentSchema.statics.getStats = function (
  providerId: Types.ObjectId,
  startDate: Date,
  endDate: Date
) {
  return this.aggregate([
    {
      $match: {
        $or: [{ doctor: providerId }, { pharmacist: providerId }],
        appointmentDate: { $gte: startDate, $lte: endDate },
        isActive: true,
      },
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
  ]).exec();
};

// Indexes
AppointmentSchema.index({ patient: 1 });
AppointmentSchema.index({ doctor: 1 });
AppointmentSchema.index({ pharmacist: 1 });
AppointmentSchema.index({ pharmacy: 1 });
AppointmentSchema.index({ appointmentDate: 1 });
AppointmentSchema.index({ status: 1 });
AppointmentSchema.index({ isActive: 1 });
AppointmentSchema.index({ createdAt: -1 });
AppointmentSchema.index({ patient: 1, appointmentDate: -1 });
AppointmentSchema.index({ doctor: 1, appointmentDate: 1 });
AppointmentSchema.index({ pharmacist: 1, appointmentDate: 1 });

const Appointment =
  (models.Appointment as IAppointmentModel) ||
  model<IAppointmentDocument, IAppointmentModel>(
    'Appointment',
    AppointmentSchema
  );

export default Appointment;

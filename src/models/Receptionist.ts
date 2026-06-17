import { Schema, model, models, Document, Types, Model } from 'mongoose';

interface IUserDocument extends Document {
  _id: Types.ObjectId;
  name: string;
  nic: string;
  email: string;
  phone: string;
  image?: string;
  role: string;
  department?: string;
}

export interface IReceptionist {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _id: any;
  user: Types.ObjectId | IUserDocument;
  employeeId: string;
  shift: 'MORNING' | 'EVENING' | 'NIGHT' | 'FULL_DAY';
  workSchedule: {
    monday: { start: string; end: string; active: boolean };
    tuesday: { start: string; end: string; active: boolean };
    wednesday: { start: string; end: string; active: boolean };
    thursday: { start: string; end: string; active: boolean };
    friday: { start: string; end: string; active: boolean };
    saturday: { start: string; end: string; active: boolean };
    sunday: { start: string; end: string; active: boolean };
  };
  department?: string;
  assignedDoctor?: Types.ObjectId | IUserDocument;
  maxAppointmentsPerDay?: number;
  currentAppointmentsCount?: number;
  skills?: string[];
  languages?: string[];
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
    email?: string;
  };
  employmentStatus: 'ACTIVE' | 'ON_LEAVE' | 'SUSPENDED' | 'TERMINATED';
  employmentType: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERN';
  hireDate: Date;
  terminationDate?: Date;
  salary?: {
    basic: number;
    allowances: number;
    deductions: number;
    currency: string;
    paymentFrequency: 'MONTHLY' | 'BI_WEEKLY' | 'WEEKLY';
  };
  performanceMetrics?: {
    averageCheckInTime: number;
    averageAppointmentTime: number;
    patientSatisfactionScore: number;
    totalAppointmentsHandled: number;
    errorRate: number;
  };
  permissions: {
    canManageAppointments: boolean;
    canManagePatients: boolean;
    canManageBilling: boolean;
    canViewReports: boolean;
    canManageInventory: boolean;
    canHandleEmergency: boolean;
    canAccessMedicalRecords: boolean;
    canManagePrescriptions: boolean;
  };
  trainingRecords?: {
    courseName: string;
    completionDate: Date;
    expiryDate?: Date;
    certificateId?: string;
    status: 'COMPLETED' | 'IN_PROGRESS' | 'EXPIRED';
  }[];
  lastModifiedBy?: Types.ObjectId;
  notes?: string;
}

export type ShiftType = IReceptionist['shift'];
export type EmploymentStatus = IReceptionist['employmentStatus'];
export type EmploymentType = IReceptionist['employmentType'];

export interface IReceptionistDocument extends IReceptionist, Document {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;

  // Virtuals
  fullName: string;
  email: string;
  phone: string;
  isAvailable: boolean;

  // Methods
  calculateTotalSalary(): number;
  isOnDuty(): boolean;
  canHandleMoreAppointments(): boolean;
  getTodaySchedule(): { start: string; end: string; active: boolean } | null;
  updateAppointmentCount(count: number): Promise<IReceptionistDocument>;
  getPerformanceRating(): number;
  validateMetrics(): boolean;
  updateTrainingStatus(): void;
  hasValidSchedule(): boolean;
}

export interface IReceptionistModel extends Model<IReceptionistDocument> {
  findAvailableReceptionists(): Promise<IReceptionistDocument[]>;
  findByShift(shift: ShiftType): Promise<IReceptionistDocument[]>;
  findByDepartment(department: string): Promise<IReceptionistDocument[]>;
  findOnLeave(): Promise<IReceptionistDocument[]>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  resetDailyAppointmentCounts(): Promise<any>;
  calculateDepartmentMetrics(department: string): Promise<{
    totalReceptionists: number;
    availableCount: number;
    averageSatisfaction: number;
  }>;
}

const ReceptionistSchema = new Schema<
  IReceptionistDocument,
  IReceptionistModel
>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      unique: true,
    },
    employeeId: {
      type: String,
      required: [true, 'Employee ID is required'],
      unique: true,
      trim: true,
      uppercase: true,
      match: [
        /^REC-\d{4}-\d{4}$/,
        'Employee ID must be in format REC-XXXX-XXXX',
      ],
    },
    shift: {
      type: String,
      enum: ['MORNING', 'EVENING', 'NIGHT', 'FULL_DAY'],
      default: 'FULL_DAY',
      required: true,
    },
    workSchedule: {
      monday: {
        start: {
          type: String,
          default: '08:00',
          match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
        },
        end: {
          type: String,
          default: '17:00',
          match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
        },
        active: { type: Boolean, default: true },
      },
      tuesday: {
        start: {
          type: String,
          default: '08:00',
          match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
        },
        end: {
          type: String,
          default: '17:00',
          match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
        },
        active: { type: Boolean, default: true },
      },
      wednesday: {
        start: {
          type: String,
          default: '08:00',
          match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
        },
        end: {
          type: String,
          default: '17:00',
          match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
        },
        active: { type: Boolean, default: true },
      },
      thursday: {
        start: {
          type: String,
          default: '08:00',
          match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
        },
        end: {
          type: String,
          default: '17:00',
          match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
        },
        active: { type: Boolean, default: true },
      },
      friday: {
        start: {
          type: String,
          default: '08:00',
          match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
        },
        end: {
          type: String,
          default: '17:00',
          match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
        },
        active: { type: Boolean, default: true },
      },
      saturday: {
        start: {
          type: String,
          default: '09:00',
          match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
        },
        end: {
          type: String,
          default: '13:00',
          match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
        },
        active: { type: Boolean, default: false },
      },
      sunday: {
        start: {
          type: String,
          default: '09:00',
          match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
        },
        end: {
          type: String,
          default: '13:00',
          match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
        },
        active: { type: Boolean, default: false },
      },
    },
    department: {
      type: String,
      trim: true,
      maxlength: [100, 'Department cannot exceed 100 characters'],
    },
    assignedDoctor: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    maxAppointmentsPerDay: {
      type: Number,
      default: 30,
      min: [1, 'Maximum appointments must be at least 1'],
      max: [100, 'Maximum appointments cannot exceed 100'],
    },
    currentAppointmentsCount: {
      type: Number,
      default: 0,
      min: [0, 'Appointment count cannot be negative'],
    },
    skills: [
      {
        type: String,
        trim: true,
        maxlength: [50, 'Skill cannot exceed 50 characters'],
      },
    ],
    languages: [
      {
        type: String,
        trim: true,
        maxlength: [50, 'Language cannot exceed 50 characters'],
      },
    ],
    emergencyContact: {
      name: { type: String, trim: true },
      relationship: { type: String, trim: true },
      phone: {
        type: String,
        match: [/^\+?[\d\s-()]+$/, 'Please enter a valid phone number'],
      },
      email: { type: String, lowercase: true },
    },
    employmentStatus: {
      type: String,
      enum: ['ACTIVE', 'ON_LEAVE', 'SUSPENDED', 'TERMINATED'],
      default: 'ACTIVE',
      required: true,
    },
    employmentType: {
      type: String,
      enum: ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN'],
      default: 'FULL_TIME',
      required: true,
    },
    hireDate: {
      type: Date,
      required: [true, 'Hire date is required'],
      validate: {
        validator: function (value: Date) {
          return value <= new Date();
        },
        message: 'Hire date cannot be in the future',
      },
    },
    terminationDate: {
      type: Date,
      validate: {
        validator: function (this: IReceptionistDocument, value: Date) {
          if (!value) return true;
          return value >= this.hireDate;
        },
        message: 'Termination date must be after hire date',
      },
    },
    salary: {
      basic: {
        type: Number,
        min: [0, 'Basic salary cannot be negative'],
      },
      allowances: {
        type: Number,
        default: 0,
        min: [0, 'Allowances cannot be negative'],
      },
      deductions: {
        type: Number,
        default: 0,
        min: [0, 'Deductions cannot be negative'],
      },
      currency: {
        type: String,
        default: 'LKR',
        uppercase: true,
        minlength: 3,
        maxlength: 3,
      },
      paymentFrequency: {
        type: String,
        enum: ['MONTHLY', 'BI_WEEKLY', 'WEEKLY'],
        default: 'MONTHLY',
      },
    },
    performanceMetrics: {
      averageCheckInTime: { type: Number, default: 0, min: 0 },
      averageAppointmentTime: { type: Number, default: 0, min: 0 },
      patientSatisfactionScore: { type: Number, default: 0, min: 0, max: 100 },
      totalAppointmentsHandled: { type: Number, default: 0, min: 0 },
      errorRate: { type: Number, default: 0, min: 0, max: 100 },
    },
    permissions: {
      canManageAppointments: { type: Boolean, default: true },
      canManagePatients: { type: Boolean, default: true },
      canManageBilling: { type: Boolean, default: true },
      canViewReports: { type: Boolean, default: false },
      canManageInventory: { type: Boolean, default: false },
      canHandleEmergency: { type: Boolean, default: true },
      canAccessMedicalRecords: { type: Boolean, default: false },
      canManagePrescriptions: { type: Boolean, default: false },
    },
    trainingRecords: [
      {
        courseName: { type: String, required: true, trim: true },
        completionDate: { type: Date, required: true },
        expiryDate: { type: Date },
        certificateId: { type: String, trim: true },
        status: {
          type: String,
          enum: ['COMPLETED', 'IN_PROGRESS', 'EXPIRED'],
          default: 'COMPLETED',
        },
      },
    ],
    lastModifiedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
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

ReceptionistSchema.virtual('fullName').get(function (
  this: IReceptionistDocument
) {
  if (!this.user) return '';
  return typeof this.user === 'object' && 'name' in this.user
    ? (this.user as IUserDocument).name
    : '';
});

ReceptionistSchema.virtual('email').get(function (this: IReceptionistDocument) {
  if (!this.user) return '';
  return typeof this.user === 'object' && 'email' in this.user
    ? (this.user as IUserDocument).email
    : '';
});

ReceptionistSchema.virtual('phone').get(function (this: IReceptionistDocument) {
  if (!this.user) return '';
  return typeof this.user === 'object' && 'phone' in this.user
    ? (this.user as IUserDocument).phone
    : '';
});

ReceptionistSchema.virtual('isAvailable').get(function (
  this: IReceptionistDocument
): boolean {
  if (this.employmentStatus !== 'ACTIVE') return false;

  const now = new Date();
  const dayOfWeek = now
    .toLocaleDateString('en-US', { weekday: 'long' })
    .toLowerCase();

  const schedule =
    this.workSchedule[dayOfWeek as keyof typeof this.workSchedule];

  if (!schedule || !schedule.active) return false;

  const [startHour, startMinute] = schedule.start.split(':').map(Number);
  const [endHour, endMinute] = schedule.end.split(':').map(Number);
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  const currentTime = currentHour * 60 + currentMinute;
  const startTime = startHour * 60 + startMinute;
  const endTime = endHour * 60 + endMinute;

  return currentTime >= startTime && currentTime <= endTime;
});

ReceptionistSchema.methods.calculateTotalSalary = function (
  this: IReceptionistDocument
): number {
  if (!this.salary) return 0;
  return this.salary.basic + this.salary.allowances - this.salary.deductions;
};

ReceptionistSchema.methods.isOnDuty = function (
  this: IReceptionistDocument
): boolean {
  return this.isAvailable && this.employmentStatus === 'ACTIVE';
};

ReceptionistSchema.methods.canHandleMoreAppointments = function (
  this: IReceptionistDocument
): boolean {
  if (!this.maxAppointmentsPerDay) return true;
  if (!this.currentAppointmentsCount) return true;
  return this.currentAppointmentsCount < this.maxAppointmentsPerDay;
};

ReceptionistSchema.methods.getTodaySchedule = function (
  this: IReceptionistDocument
) {
  const dayOfWeek = new Date()
    .toLocaleDateString('en-US', { weekday: 'long' })
    .toLowerCase();

  return this.workSchedule[dayOfWeek as keyof typeof this.workSchedule] || null;
};

ReceptionistSchema.methods.updateAppointmentCount = async function (
  this: IReceptionistDocument,
  count: number
): Promise<IReceptionistDocument> {
  this.currentAppointmentsCount = count;
  return this.save();
};

ReceptionistSchema.methods.getPerformanceRating = function (
  this: IReceptionistDocument
): number {
  if (!this.performanceMetrics) return 0;

  const weights = {
    patientSatisfactionScore: 0.4,
    averageCheckInTime: 0.2,
    averageAppointmentTime: 0.2,
    errorRate: 0.2,
  };

  const checkInTimeScore = Math.max(
    0,
    100 - (this.performanceMetrics.averageCheckInTime || 0)
  );
  const appointmentTimeScore = Math.max(
    0,
    100 - (this.performanceMetrics.averageAppointmentTime || 0)
  );
  const errorRateScore = Math.max(
    0,
    100 - (this.performanceMetrics.errorRate || 0)
  );

  return (
    this.performanceMetrics.patientSatisfactionScore *
      weights.patientSatisfactionScore +
    checkInTimeScore * weights.averageCheckInTime +
    appointmentTimeScore * weights.averageAppointmentTime +
    errorRateScore * weights.errorRate
  );
};

ReceptionistSchema.methods.validateMetrics = function (
  this: IReceptionistDocument
): boolean {
  if (!this.performanceMetrics) return true;
  return (
    this.performanceMetrics.patientSatisfactionScore >= 0 &&
    this.performanceMetrics.patientSatisfactionScore <= 100 &&
    this.performanceMetrics.errorRate >= 0 &&
    this.performanceMetrics.errorRate <= 100
  );
};

ReceptionistSchema.methods.updateTrainingStatus = function (
  this: IReceptionistDocument
): void {
  if (!this.trainingRecords) return;

  const now = new Date();
  this.trainingRecords.forEach(record => {
    if (
      record.expiryDate &&
      record.expiryDate < now &&
      record.status !== 'EXPIRED'
    ) {
      record.status = 'EXPIRED';
    }
  });
};

ReceptionistSchema.methods.hasValidSchedule = function (
  this: IReceptionistDocument
): boolean {
  const days = Object.keys(this.workSchedule);
  return days.some(
    day => this.workSchedule[day as keyof typeof this.workSchedule].active
  );
};

// ==================== STATIC METHODS ====================

ReceptionistSchema.statics.findAvailableReceptionists = async function (
  this: IReceptionistModel
): Promise<IReceptionistDocument[]> {
  const receptionists = await this.find({
    employmentStatus: 'ACTIVE',
  }).populate('user', 'name email phone image');

  return receptionists.filter(r => r.isAvailable);
};

ReceptionistSchema.statics.findByShift = function (
  this: IReceptionistModel,
  shift: ShiftType
): Promise<IReceptionistDocument[]> {
  return this.find({ shift, employmentStatus: 'ACTIVE' })
    .populate('user', 'name email phone image')
    .populate('assignedDoctor', 'name specialization');
};

ReceptionistSchema.statics.findByDepartment = function (
  this: IReceptionistModel,
  department: string
): Promise<IReceptionistDocument[]> {
  return this.find({ department, employmentStatus: 'ACTIVE' }).populate(
    'user',
    'name email phone image'
  );
};

ReceptionistSchema.statics.findOnLeave = function (
  this: IReceptionistModel
): Promise<IReceptionistDocument[]> {
  return this.find({ employmentStatus: 'ON_LEAVE' }).populate(
    'user',
    'name email phone'
  );
};

ReceptionistSchema.statics.resetDailyAppointmentCounts = function (
  this: IReceptionistModel
) {
  return this.updateMany(
    { employmentStatus: 'ACTIVE' },
    { $set: { currentAppointmentsCount: 0 } }
  );
};

ReceptionistSchema.statics.calculateDepartmentMetrics = async function (
  this: IReceptionistModel,
  department: string
) {
  const receptionists = await this.find({
    department,
    employmentStatus: 'ACTIVE',
  });

  const totalReceptionists = receptionists.length;
  const availableCount = receptionists.filter(r => r.isAvailable).length;
  const totalSatisfaction = receptionists.reduce((sum, r) => {
    return sum + (r.performanceMetrics?.patientSatisfactionScore || 0);
  }, 0);

  const averageSatisfaction =
    totalReceptionists > 0 ? totalSatisfaction / totalReceptionists : 0;

  return {
    totalReceptionists,
    availableCount,
    averageSatisfaction,
  };
};

ReceptionistSchema.index({ shift: 1 });
ReceptionistSchema.index({ department: 1 });
ReceptionistSchema.index({ employmentStatus: 1 });
ReceptionistSchema.index({ employmentType: 1 });
ReceptionistSchema.index({ hireDate: -1 });
ReceptionistSchema.index({ 'performanceMetrics.patientSatisfactionScore': -1 });
ReceptionistSchema.index({ department: 1, employmentStatus: 1 });
ReceptionistSchema.index({ shift: 1, employmentStatus: 1 });

ReceptionistSchema.pre('save', function (next) {
  if (this.employmentStatus === 'TERMINATED' && !this.terminationDate) {
    this.terminationDate = new Date();
  }

  if (this.currentAppointmentsCount && this.maxAppointmentsPerDay) {
    if (this.currentAppointmentsCount > this.maxAppointmentsPerDay) {
      this.currentAppointmentsCount = this.maxAppointmentsPerDay;
    }
  }
  this.updateTrainingStatus();

  const days = [
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday',
  ];

  for (const day of days) {
    const schedule = this.workSchedule[day as keyof typeof this.workSchedule];
    if (schedule.active) {
      const [startHour, startMinute] = schedule.start.split(':').map(Number);
      const [endHour, endMinute] = schedule.end.split(':').map(Number);

      const startTime = startHour * 60 + startMinute;
      const endTime = endHour * 60 + endMinute;

      if (endTime <= startTime) {
        return next(new Error(`${day} end time must be after start time`));
      }
    }
  }

  next();
});

ReceptionistSchema.post('save', async function (doc) {
  try {
    const User = models.User;
    if (User && doc.user) {
      await User.findByIdAndUpdate(
        doc.user,
        {
          role: 'RECEPTIONIST',
          department: doc.department,
        },
        { runValidators: false }
      );
    }
  } catch (error) {
    console.error('Error updating user role:', error);
  }
});

ReceptionistSchema.pre(
  'deleteOne',
  { document: true, query: false },
  async function (next) {
    try {
      next();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      next(error);
    }
  }
);

const Receptionist =
  (models.Receptionist as IReceptionistModel) ||
  model<IReceptionistDocument, IReceptionistModel>(
    'Receptionist',
    ReceptionistSchema
  );

export default Receptionist;

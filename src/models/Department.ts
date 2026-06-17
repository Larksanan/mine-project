import { Schema, model, models, Document, Types } from 'mongoose';

export interface IDepartment {
  name: string;
  code: string;
  description?: string;
  head?: Types.ObjectId;
  location?: string;
  floor?: number;
  phoneExtension?: string;
  email?: string;
  isActive: boolean;
  staffCount?: number;
  specializations?: string[];
  workingHours?: {
    monday: { start: string; end: string; isOpen: boolean };
    tuesday: { start: string; end: string; isOpen: boolean };
    wednesday: { start: string; end: string; isOpen: boolean };
    thursday: { start: string; end: string; isOpen: boolean };
    friday: { start: string; end: string; isOpen: boolean };
    saturday: { start: string; end: string; isOpen: boolean };
    sunday: { start: string; end: string; isOpen: boolean };
  };
  facilities?: string[];
  emergencyContact?: {
    name: string;
    phone: string;
    email?: string;
  };
  budget?: {
    allocated: number;
    spent: number;
    currency: string;
  };
}

export interface IDepartmentDocument extends IDepartment, Document {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;

  // Virtuals
  budgetUtilization: number;
  isOverBudget: boolean;

  // Methods
  updateStaffCount(): Promise<IDepartmentDocument>;
  isOpenToday(): boolean;
  getTodayHours(): { start: string; end: string } | null;
}

const DepartmentSchema = new Schema<IDepartmentDocument>(
  {
    name: {
      type: String,
      required: [true, 'Department name is required'],
      trim: true,
      unique: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    code: {
      type: String,
      required: [true, 'Department code is required'],
      trim: true,
      unique: true,
      uppercase: true,
      maxlength: [20, 'Code cannot exceed 20 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    head: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    location: {
      type: String,
      trim: true,
      maxlength: [200, 'Location cannot exceed 200 characters'],
    },
    floor: {
      type: Number,
      min: [0, 'Floor cannot be negative'],
      max: [100, 'Floor seems too high'],
    },
    phoneExtension: {
      type: String,
      trim: true,
      match: [/^[0-9]{1,10}$/, 'Please enter a valid phone extension'],
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please enter a valid email',
      ],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    staffCount: {
      type: Number,
      default: 0,
      min: [0, 'Staff count cannot be negative'],
    },
    specializations: [
      {
        type: String,
        trim: true,
        maxlength: [100, 'Specialization cannot exceed 100 characters'],
      },
    ],
    workingHours: {
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
        isOpen: { type: Boolean, default: true },
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
        isOpen: { type: Boolean, default: true },
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
        isOpen: { type: Boolean, default: true },
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
        isOpen: { type: Boolean, default: true },
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
        isOpen: { type: Boolean, default: true },
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
        isOpen: { type: Boolean, default: false },
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
        isOpen: { type: Boolean, default: false },
      },
    },
    facilities: [
      {
        type: String,
        trim: true,
        maxlength: [100, 'Facility name cannot exceed 100 characters'],
      },
    ],
    emergencyContact: {
      name: {
        type: String,
        trim: true,
        maxlength: [100, 'Name cannot exceed 100 characters'],
      },
      phone: {
        type: String,
        match: [/^\+?[\d\s-()]+$/, 'Please enter a valid phone number'],
      },
      email: {
        type: String,
        lowercase: true,
        match: [
          /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
          'Please enter a valid email',
        ],
      },
    },
    budget: {
      allocated: {
        type: Number,
        min: [0, 'Allocated budget cannot be negative'],
      },
      spent: {
        type: Number,
        default: 0,
        min: [0, 'Spent amount cannot be negative'],
      },
      currency: {
        type: String,
        default: 'LKR',
        uppercase: true,
        minlength: 3,
        maxlength: 3,
      },
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

// Virtual for budget utilization percentage
DepartmentSchema.virtual('budgetUtilization').get(function (
  this: IDepartmentDocument
) {
  if (!this.budget || !this.budget.allocated || this.budget.allocated === 0) {
    return 0;
  }
  return (this.budget.spent / this.budget.allocated) * 100;
});

// Virtual to check if over budget
DepartmentSchema.virtual('isOverBudget').get(function (
  this: IDepartmentDocument
) {
  if (!this.budget || !this.budget.allocated) {
    return false;
  }
  return this.budget.spent > this.budget.allocated;
});

// Method to update staff count
DepartmentSchema.methods.updateStaffCount = async function (
  this: IDepartmentDocument
): Promise<IDepartmentDocument> {
  const User = models.User || model('User');
  const count = await User.countDocuments({
    department: this.name,
    isActive: true,
  });
  this.staffCount = count;
  return await this.save();
};

// Method to check if department is open today
DepartmentSchema.methods.isOpenToday = function (
  this: IDepartmentDocument
): boolean {
  if (!this.workingHours) return false;

  const today = new Date()
    .toLocaleDateString('en-US', { weekday: 'long' })
    .toLowerCase();

  const todaySchedule =
    this.workingHours[today as keyof typeof this.workingHours];

  return todaySchedule?.isOpen || false;
};

// Method to get today's working hours
DepartmentSchema.methods.getTodayHours = function (
  this: IDepartmentDocument
): { start: string; end: string } | null {
  if (!this.workingHours) return null;

  const today = new Date()
    .toLocaleDateString('en-US', { weekday: 'long' })
    .toLowerCase();

  const todaySchedule =
    this.workingHours[today as keyof typeof this.workingHours];

  if (!todaySchedule || !todaySchedule.isOpen) return null;

  return {
    start: todaySchedule.start,
    end: todaySchedule.end,
  };
};

// Indexes
DepartmentSchema.index({ isActive: 1 });
DepartmentSchema.index({ floor: 1 });
DepartmentSchema.index({ head: 1 });

// Pre-save middleware to validate working hours
DepartmentSchema.pre('save', function (next) {
  if (this.workingHours) {
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
      const schedule = this.workingHours[day as keyof typeof this.workingHours];
      if (schedule && schedule.isOpen) {
        const [startHour, startMinute] = schedule.start.split(':').map(Number);
        const [endHour, endMinute] = schedule.end.split(':').map(Number);

        const startTime = startHour * 60 + startMinute;
        const endTime = endHour * 60 + endMinute;

        if (endTime <= startTime) {
          return next(new Error(`${day}: End time must be after start time`));
        }
      }
    }
  }

  if (this.budget && this.budget.spent > this.budget.allocated) {
    console.warn(
      `Warning: Department ${this.name} is over budget (${this.budget.spent}/${this.budget.allocated})`
    );
  }

  next();
});

const Department =
  models.Department ||
  model<IDepartmentDocument>('Department', DepartmentSchema);

export default Department;

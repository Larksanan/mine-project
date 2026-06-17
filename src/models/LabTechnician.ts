import { Schema, model, models, Document, Types } from 'mongoose';

export interface ILabTechnician {
  user?: Types.ObjectId;
  name: string;
  employeeId: string;
  email: string;
  phone: string;
  specialization: string[];
  qualification: string;
  licenseNumber?: string;
  licenseExpiry?: Date;
  certifications?: string[];
  yearsOfExperience: number;
  status: 'AVAILABLE' | 'BUSY' | 'OFFLINE' | 'ON_LEAVE';
  shift?: 'MORNING' | 'EVENING' | 'NIGHT' | 'GENERAL';
  isAvailable: boolean;
  maxConcurrentTests: number;
  currentWorkload: number;
  performanceScore: number;
  joinedDate: Date;
  notes?: string;
  img?: string;
}

export interface ILabTechnicianDocument extends ILabTechnician, Document {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;

  // Virtuals
  isLicenseExpired: boolean;
  efficiency: number;

  // Methods
  updateWorkload(): Promise<ILabTechnicianDocument>;
  assignTest(): Promise<ILabTechnicianDocument>;
  completeTest(): Promise<ILabTechnicianDocument>;
  canAcceptMoreTests(): boolean;
}

const LabTechnicianSchema = new Schema<ILabTechnicianDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false, // Made optional to support technician-only records
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    employeeId: {
      type: String,
      required: [true, 'Employee ID is required'],
      trim: true,
      uppercase: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone is required'],
      trim: true,
    },
    specialization: [
      {
        type: String,
        enum: [
          'Hematology',
          'Clinical Chemistry',
          'Microbiology',
          'Immunology',
          'Pathology',
          'Cytology',
          'Molecular Biology',
          'Blood Bank',
          'General Laboratory',
        ],
        required: true,
      },
    ],
    qualification: {
      type: String,
      required: [true, 'Qualification is required'],
      trim: true,
    },
    licenseNumber: {
      type: String,
      trim: true,
    },
    licenseExpiry: {
      type: Date,
    },
    certifications: [
      {
        type: String,
        trim: true,
      },
    ],
    yearsOfExperience: {
      type: Number,
      required: [true, 'Years of experience is required'],
      min: [0, 'Experience cannot be negative'],
      max: [50, 'Experience seems too high'],
    },
    status: {
      type: String,
      enum: ['AVAILABLE', 'BUSY', 'OFFLINE', 'ON_LEAVE'],
      default: 'AVAILABLE',
    },
    shift: {
      type: String,
      enum: ['MORNING', 'EVENING', 'NIGHT', 'GENERAL'],
      default: 'GENERAL',
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    maxConcurrentTests: {
      type: Number,
      default: 10,
      min: [1, 'Maximum concurrent tests must be at least 1'],
      max: [50, 'Maximum concurrent tests cannot exceed 50'],
    },
    currentWorkload: {
      type: Number,
      default: 0,
      min: [0, 'Workload cannot be negative'],
    },
    performanceScore: {
      type: Number,
      default: 100,
      min: [0, 'Performance score cannot be negative'],
      max: [100, 'Performance score cannot exceed 100'],
    },
    joinedDate: {
      type: Date,
      required: [true, 'Joined date is required'],
      default: Date.now,
    },
    notes: {
      type: String,
      trim: true,
    },
    img: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for license expiry check
LabTechnicianSchema.virtual('isLicenseExpired').get(function (
  this: ILabTechnicianDocument
) {
  if (!this.licenseExpiry) return false;
  return new Date() > this.licenseExpiry;
});

// Virtual for efficiency calculation
LabTechnicianSchema.virtual('efficiency').get(function (
  this: ILabTechnicianDocument
) {
  if (this.maxConcurrentTests === 0) return 0;
  return (this.currentWorkload / this.maxConcurrentTests) * 100;
});

// Method to update workload based on active tests
LabTechnicianSchema.methods.updateWorkload = async function (
  this: ILabTechnicianDocument
): Promise<ILabTechnicianDocument> {
  const LabTestRequest = model('LabTestRequest');

  const activeTestCount = await LabTestRequest.countDocuments({
    labTechnician: this._id,
    status: { $in: ['SAMPLE_COLLECTED', 'IN_PROGRESS'] },
  });

  this.currentWorkload = activeTestCount;
  return await this.save();
};

// Method to assign a test to technician
LabTechnicianSchema.methods.assignTest = async function (
  this: ILabTechnicianDocument
): Promise<ILabTechnicianDocument> {
  if (!this.canAcceptMoreTests()) {
    throw new Error('Technician has reached maximum workload');
  }

  this.currentWorkload += 1;
  return await this.save();
};

// Method to complete a test
LabTechnicianSchema.methods.completeTest = async function (
  this: ILabTechnicianDocument
): Promise<ILabTechnicianDocument> {
  if (this.currentWorkload > 0) {
    this.currentWorkload -= 1;
  }
  return await this.save();
};

// Method to check if technician can accept more tests
LabTechnicianSchema.methods.canAcceptMoreTests = function (
  this: ILabTechnicianDocument
): boolean {
  return this.isAvailable && this.currentWorkload < this.maxConcurrentTests;
};

// Static method to find available technicians
LabTechnicianSchema.statics.findAvailable = function (specialization?: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const query: any = {
    isAvailable: true,
    $expr: { $lt: ['$currentWorkload', '$maxConcurrentTests'] },
  };

  if (specialization) {
    query.specialization = { $in: [specialization] };
  }

  return this.find(query)
    .sort({ currentWorkload: 1, performanceScore: -1 })
    .populate('user');
};

// Static method to find technicians by specialization
LabTechnicianSchema.statics.findBySpecialization = function (
  specialization: string
) {
  return this.find({
    specialization: { $in: [specialization] },
    isAvailable: true,
  })
    .populate('user')
    .sort({ performanceScore: -1, currentWorkload: 1 });
};

// Static method to update all technicians' workloads
LabTechnicianSchema.statics.updateAllWorkloads = async function () {
  const technicians = await this.find({});

  for (const tech of technicians) {
    await tech.updateWorkload();
  }

  return technicians.length;
};

// Indexes for better query performance
LabTechnicianSchema.index({ user: 1 }, { unique: true, sparse: true }); // Sparse allows multiple null values
LabTechnicianSchema.index({ employeeId: 1 }, { unique: true });
LabTechnicianSchema.index({ email: 1 });
LabTechnicianSchema.index({ specialization: 1 });
LabTechnicianSchema.index({ shift: 1 });
LabTechnicianSchema.index({ isAvailable: 1 });
LabTechnicianSchema.index({ status: 1 });
LabTechnicianSchema.index({ currentWorkload: 1 });
LabTechnicianSchema.index({ performanceScore: -1 });

// Compound index for finding available technicians efficiently
LabTechnicianSchema.index({
  isAvailable: 1,
  specialization: 1,
  currentWorkload: 1,
});

// Pre-save middleware to validate license
LabTechnicianSchema.pre('save', function (next) {
  if (this.licenseNumber && !this.licenseExpiry) {
    next(
      new Error(
        'License expiry date is required when license number is provided'
      )
    );
  }
  next();
});

// Pre-save middleware to sync isAvailable with status
LabTechnicianSchema.pre('save', function (next) {
  this.isAvailable = this.status === 'AVAILABLE';
  next();
});

const LabTechnician =
  models.LabTechnician ||
  model<ILabTechnicianDocument>('LabTechnician', LabTechnicianSchema);

export default LabTechnician;

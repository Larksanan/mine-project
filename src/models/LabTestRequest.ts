import { Schema, model, models, Document, Types } from 'mongoose';
import './Patient';
import './LabTest';
import './User';
import './LabTechnician';

export type TestStatus =
  | 'REQUESTED'
  | 'SAMPLE_COLLECTED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'VERIFIED'
  | 'CANCELLED';

export type Priority = 'LOW' | 'NORMAL' | 'HIGH' | 'STAT';

export interface ILabTestRequest {
  patient: Types.ObjectId;
  doctor?: Types.ObjectId;
  labTechnician?: Types.ObjectId;
  test?: Types.ObjectId; // optional — patient self-bookings don't have a test yet
  status: TestStatus;
  priority: Priority;
  requestedDate: Date;
  sampleCollectedDate?: Date;
  startedDate?: Date;
  completedDate?: Date;
  verifiedDate?: Date;
  results?: string;
  findings?: string;
  notes?: string;
  attachments?: string[];
  isCritical: boolean;
  referral?: string;
  // Appointment booking fields
  appointmentType?: string;
  reason?: string;
  timeSlot?: string;
  scheduledDate?: Date;
}

export interface ILabTestRequestDocument extends ILabTestRequest, Document {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;

  // Virtuals
  turnaroundTime: number;
  isOverdue: boolean;

  // Methods
  updateStatus(newStatus: TestStatus): Promise<ILabTestRequestDocument>;
  canBeCancelled(): boolean;
}

const LabTestRequestSchema = new Schema<ILabTestRequestDocument>(
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
    labTechnician: {
      type: Schema.Types.ObjectId,
      ref: 'LabTechnician',
    },
    test: {
      type: Schema.Types.ObjectId,
      ref: 'LabTest',
      required: false, // optional — assigned later by doctor/lab staff
    },
    status: {
      type: String,
      enum: [
        'REQUESTED',
        'SAMPLE_COLLECTED',
        'IN_PROGRESS',
        'COMPLETED',
        'VERIFIED',
        'CANCELLED',
      ],
      default: 'REQUESTED',
    },
    priority: {
      type: String,
      enum: ['LOW', 'NORMAL', 'HIGH', 'STAT'],
      default: 'NORMAL',
    },
    requestedDate: {
      type: Date,
      default: Date.now,
    },
    sampleCollectedDate: {
      type: Date,
    },
    startedDate: {
      type: Date,
    },
    completedDate: {
      type: Date,
    },
    verifiedDate: {
      type: Date,
    },
    results: {
      type: String,
      trim: true,
    },
    findings: {
      type: String,
      trim: true,
      maxlength: [2000, 'Findings cannot exceed 2000 characters'],
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
    },
    attachments: [
      {
        type: String,
      },
    ],
    isCritical: {
      type: Boolean,
      default: false,
    },
    referral: {
      type: String,
      trim: true,
    },
    // Appointment booking fields (set when patient self-books)
    appointmentType: {
      type: String,
      trim: true,
    },
    reason: {
      type: String,
      trim: true,
      maxlength: [500, 'Reason cannot exceed 500 characters'],
    },
    timeSlot: {
      type: String,
      trim: true,
    },
    scheduledDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for turnaround time (in hours)
LabTestRequestSchema.virtual('turnaroundTime').get(function (
  this: ILabTestRequestDocument
) {
  if (this.completedDate && this.requestedDate) {
    return (
      (this.completedDate.getTime() - this.requestedDate.getTime()) /
      (1000 * 60 * 60)
    );
  }
  return null;
});

// Virtual to check if test is overdue
LabTestRequestSchema.virtual('isOverdue').get(function (
  this: ILabTestRequestDocument
) {
  if (
    this.status === 'CANCELLED' ||
    this.status === 'COMPLETED' ||
    this.status === 'VERIFIED'
  ) {
    return false;
  }

  const test = this.populated('test') || this.test;
  if (test && typeof test === 'object' && 'duration' in test) {
    const expectedCompletion = new Date(this.requestedDate);
    expectedCompletion.setMinutes(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expectedCompletion.getMinutes() + (test as any).duration
    );
    return new Date() > expectedCompletion;
  }

  return false;
});

// Method to update status with timestamps
LabTestRequestSchema.methods.updateStatus = async function (
  this: ILabTestRequestDocument,
  newStatus: TestStatus
): Promise<ILabTestRequestDocument> {
  this.status = newStatus;
  const now = new Date();

  switch (newStatus) {
    case 'SAMPLE_COLLECTED':
      this.sampleCollectedDate = now;
      break;
    case 'IN_PROGRESS':
      this.startedDate = now;
      break;
    case 'COMPLETED':
      this.completedDate = now;
      break;
    case 'VERIFIED':
      this.verifiedDate = now;
      break;
  }

  return await this.save();
};

// Method to check if test can be cancelled
LabTestRequestSchema.methods.canBeCancelled = function (
  this: ILabTestRequestDocument
): boolean {
  return this.status === 'REQUESTED' || this.status === 'SAMPLE_COLLECTED';
};

// Indexes for better query performance
LabTestRequestSchema.index({ patient: 1, requestedDate: -1 });
LabTestRequestSchema.index({ doctor: 1 });
LabTestRequestSchema.index({ labTechnician: 1 });
LabTestRequestSchema.index({ status: 1 });
LabTestRequestSchema.index({ priority: 1 });
LabTestRequestSchema.index({ requestedDate: -1 });
LabTestRequestSchema.index({ test: 1 });

// Static method to find tests by status
LabTestRequestSchema.statics.findByStatus = function (status: TestStatus) {
  return this.find({ status }).populate('patient test labTechnician');
};

// Static method to find overdue tests
LabTestRequestSchema.statics.findOverdueTests = function () {
  return this.find({
    status: { $in: ['REQUESTED', 'SAMPLE_COLLECTED', 'IN_PROGRESS'] },
    requestedDate: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
  }).populate('patient test');
};

// Middleware to populate test before virtual calculation
LabTestRequestSchema.pre('find', function () {
  this.populate('test');
});

LabTestRequestSchema.pre('findOne', function () {
  this.populate('test');
});

// Prevent Mongoose model recompilation error in development
if (process.env.NODE_ENV !== 'production' && models.LabTestRequest) {
  delete models.LabTestRequest;
}

const LabTestRequest =
  models.LabTestRequest ||
  model<ILabTestRequestDocument>('LabTestRequest', LabTestRequestSchema);

export default LabTestRequest;

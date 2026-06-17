import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMedicalHistory extends Document {
  nic: string;
  condition: string;
  diagnosisDate: Date;
  resolutionDate?: Date;
  status: 'active' | 'resolved' | 'chronic';
  severity: 'mild' | 'moderate' | 'severe';
  description?: string;
  treatment?: string;
  medications?: string[];
  notes?: string;
  attachments?: {
    fileName: string;
    fileUrl: string;
    fileType: string;
    uploadedAt: Date;
  }[];
  createdBy: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
  durationDays?: number | null;
}

// Define interface for static methods
export interface IMedicalHistoryModel extends Model<IMedicalHistory> {
  getActiveConditions(nic: string): Promise<IMedicalHistory[]>;
  getChronicConditions(nic: string): Promise<IMedicalHistory[]>;
  getPatientSummary(nic: string): Promise<{
    total: number;
    active: number;
    chronic: number;
    resolved: number;
    severityCounts: {
      mild: number;
      moderate: number;
      severe: number;
    };
  }>;
}

const MedicalHistorySchema: Schema<IMedicalHistory> = new Schema(
  {
    nic: {
      type: String,
      required: [true, 'NIC is required'],
      index: true,
    },
    condition: {
      type: String,
      required: [true, 'Condition is required'],
      trim: true,
      index: true,
    },
    diagnosisDate: {
      type: Date,
      required: [true, 'Diagnosis date is required'],
      index: true,
    },
    resolutionDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: {
        values: ['active', 'resolved', 'chronic'],
        message: 'Status must be: active, resolved, or chronic',
      },
      required: [true, 'Status is required'],
      default: 'active',
      index: true,
    },
    severity: {
      type: String,
      enum: {
        values: ['mild', 'moderate', 'severe'],
        message: 'Severity must be: mild, moderate, or severe',
      },
      required: [true, 'Severity is required'],
      index: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    treatment: {
      type: String,
      trim: true,
      maxlength: [2000, 'Treatment details cannot exceed 2000 characters'],
    },
    medications: {
      type: [String],
      default: [],
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [5000, 'Notes cannot exceed 5000 characters'],
    },
    attachments: [
      {
        fileName: {
          type: String,
          required: true,
        },
        fileUrl: {
          type: String,
          required: true,
        },
        fileType: {
          type: String,
          required: true,
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    createdBy: {
      type: String,
      required: [true, 'Created by user ID is required'],
    },
    updatedBy: {
      type: String,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for better query performance
MedicalHistorySchema.index({ nic: 1, diagnosisDate: -1 });
MedicalHistorySchema.index({ nic: 1, status: 1 });
MedicalHistorySchema.index({ condition: 'text' });

// Virtual for duration if resolved
MedicalHistorySchema.virtual('durationDays').get(function (
  this: IMedicalHistory
) {
  if (this.resolutionDate && this.diagnosisDate) {
    const diff = this.resolutionDate.getTime() - this.diagnosisDate.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }
  return null;
});

// Pre-save middleware to validate dates
MedicalHistorySchema.pre<IMedicalHistory>('save', function (next) {
  if (this.resolutionDate && this.diagnosisDate) {
    if (this.resolutionDate < this.diagnosisDate) {
      next(new Error('Resolution date cannot be before diagnosis date'));
      return;
    }
  }

  const today = new Date();
  today.setHours(23, 59, 59, 999);

  if (this.diagnosisDate > today) {
    next(new Error('Diagnosis date cannot be in the future'));
    return;
  }

  if (this.resolutionDate && this.resolutionDate > today) {
    next(new Error('Resolution date cannot be in the future'));
    return;
  }

  next();
});

// Static method to get patient's active conditions
MedicalHistorySchema.statics.getActiveConditions = function (
  nic: string
): Promise<IMedicalHistory[]> {
  return this.find({ nic, status: 'active' })
    .sort({ diagnosisDate: -1 })
    .lean();
};

// Static method to get patient's chronic conditions
MedicalHistorySchema.statics.getChronicConditions = function (
  nic: string
): Promise<IMedicalHistory[]> {
  return this.find({ nic, status: 'chronic' })
    .sort({ diagnosisDate: -1 })
    .lean();
};

// Static method to get patient's medical summary
MedicalHistorySchema.statics.getPatientSummary = async function (
  nic: string
): Promise<{
  total: number;
  active: number;
  chronic: number;
  resolved: number;
  severityCounts: {
    mild: number;
    moderate: number;
    severe: number;
  };
}> {
  const allConditions = await this.find({ nic }).lean();

  return {
    total: allConditions.length,
    active: allConditions.filter((c: IMedicalHistory) => c.status === 'active')
      .length,
    chronic: allConditions.filter(
      (c: IMedicalHistory) => c.status === 'chronic'
    ).length,
    resolved: allConditions.filter(
      (c: IMedicalHistory) => c.status === 'resolved'
    ).length,
    severityCounts: {
      mild: allConditions.filter((c: IMedicalHistory) => c.severity === 'mild')
        .length,
      moderate: allConditions.filter(
        (c: IMedicalHistory) => c.severity === 'moderate'
      ).length,
      severe: allConditions.filter(
        (c: IMedicalHistory) => c.severity === 'severe'
      ).length,
    },
  };
};

// Prevent model recompilation in development
const MedicalHistory =
  (mongoose.models.MedicalHistory as IMedicalHistoryModel) ||
  mongoose.model<IMedicalHistory, IMedicalHistoryModel>(
    'MedicalHistory',
    MedicalHistorySchema
  );

export default MedicalHistory;

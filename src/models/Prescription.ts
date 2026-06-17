import { Schema, model, models, Document, Types, Model } from 'mongoose';

export interface IMedication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  quantity: number;
  refills: number;
}

export interface IPrescription {
  patientId: Types.ObjectId;
  doctorId: Types.ObjectId;
  diagnosis: string;
  medications: IMedication[];
  notes?: string;
  startDate: Date;
  endDate?: Date;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  isActive?: boolean;
}

export interface IPrescriptionDocument extends IPrescription, Document {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  prescriptionNumber: string;
  totalMedications: number;
  isExpired: boolean;
  calculateTotalDays(): number;
  hasRefillsAvailable(): boolean;
  canBeRenewed(): boolean;
}

interface IPrescriptionModel extends Model<IPrescriptionDocument> {
  findActivePrescriptions(): Promise<IPrescriptionDocument[]>;
  findByPatient(patientId: Types.ObjectId): Promise<IPrescriptionDocument[]>;
  findByDoctor(doctorId: Types.ObjectId): Promise<IPrescriptionDocument[]>;
  findByStatus(status: string): Promise<IPrescriptionDocument[]>;
  generatePrescriptionNumber(): Promise<string>;
}

const MedicationSchema = new Schema<IMedication>({
  name: {
    type: String,
    required: [true, 'Medication name is required'],
    trim: true,
    maxlength: [100, 'Medication name cannot exceed 100 characters'],
  },
  dosage: {
    type: String,
    required: [true, 'Dosage is required'],
    trim: true,
    maxlength: [50, 'Dosage cannot exceed 50 characters'],
  },
  frequency: {
    type: String,
    required: [true, 'Frequency is required'],
    trim: true,
    maxlength: [50, 'Frequency cannot exceed 50 characters'],
  },
  duration: {
    type: String,
    required: [true, 'Duration is required'],
    trim: true,
    maxlength: [50, 'Duration cannot exceed 50 characters'],
  },
  instructions: {
    type: String,
    trim: true,
    maxlength: [500, 'Instructions cannot exceed 500 characters'],
    default: '',
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1'],
    max: [1000, 'Quantity cannot exceed 1000'],
  },
  refills: {
    type: Number,
    default: 0,
    min: [0, 'Refills cannot be negative'],
    max: [12, 'Refills cannot exceed 12'],
  },
});

const PrescriptionSchema = new Schema<
  IPrescriptionDocument,
  IPrescriptionModel
>(
  {
    patientId: {
      type: Schema.Types.ObjectId,
      ref: 'Patient',
      required: [true, 'Patient ID is required'],
    },
    doctorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Doctor ID is required'],
    },
    diagnosis: {
      type: String,
      required: [true, 'Diagnosis is required'],
      trim: true,
      maxlength: [500, 'Diagnosis cannot exceed 500 characters'],
    },
    medications: {
      type: [MedicationSchema],
      required: [true, 'At least one medication is required'],
      validate: {
        validator: function (meds: IMedication[]) {
          return meds && meds.length > 0;
        },
        message: 'At least one medication is required',
      },
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
      default: '',
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
      validate: {
        validator: function (value: Date) {
          return value >= new Date(new Date().setHours(0, 0, 0, 0));
        },
        message: 'Start date cannot be in the past',
      },
    },
    endDate: {
      type: Date,
      validate: {
        validator: function (value: Date) {
          return !value || value > this.startDate;
        },
        message: 'End date must be after start date',
      },
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'COMPLETED', 'CANCELLED'],
      default: 'ACTIVE',
    },
    prescriptionNumber: {
      type: String,
      unique: true,
      uppercase: true,
      match: [
        /^RX-\d{8}$/,
        'Prescription number must be in format RX-XXXXXXXX',
      ],
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
          _id: _id.toString(),
          ...rest,
        };
      },
    },
    toObject: {
      virtuals: true,
      transform: function (doc, ret) {
        const { _id, __v, ...rest } = ret;
        return {
          _id: _id.toString(),
          ...rest,
        };
      },
    },
  }
);

// Virtuals
PrescriptionSchema.virtual('totalMedications').get(function (
  this: IPrescriptionDocument
) {
  return this.medications.length;
});

PrescriptionSchema.virtual('isExpired').get(function (
  this: IPrescriptionDocument
) {
  if (!this.endDate) return false;
  return new Date() > this.endDate;
});

// Methods
PrescriptionSchema.methods.calculateTotalDays = function (
  this: IPrescriptionDocument
): number {
  if (!this.endDate) return 0;
  const start = new Date(this.startDate);
  const end = new Date(this.endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

PrescriptionSchema.methods.hasRefillsAvailable = function (
  this: IPrescriptionDocument
): boolean {
  return this.medications.some(med => med.refills > 0);
};

PrescriptionSchema.methods.canBeRenewed = function (
  this: IPrescriptionDocument
): boolean {
  return (
    this.status === 'ACTIVE' && !this.isExpired && this.hasRefillsAvailable()
  );
};

// Static methods
PrescriptionSchema.statics.findActivePrescriptions = function () {
  return this.find({ isActive: true, status: 'ACTIVE' })
    .populate('patientId', 'firstName lastName email phone dateOfBirth gender')
    .populate('doctorId', 'firstName lastName email specialty')
    .sort({ createdAt: -1 });
};

PrescriptionSchema.statics.findByPatient = function (
  patientId: Types.ObjectId
) {
  return this.find({ patientId, isActive: true })
    .populate('patientId', 'firstName lastName email phone dateOfBirth gender')
    .populate('doctorId', 'firstName lastName email specialty')
    .sort({ createdAt: -1 });
};

PrescriptionSchema.statics.findByDoctor = function (doctorId: Types.ObjectId) {
  return this.find({ doctorId, isActive: true })
    .populate('patientId', 'firstName lastName email phone dateOfBirth gender')
    .populate('doctorId', 'firstName lastName email specialty')
    .sort({ createdAt: -1 });
};

PrescriptionSchema.statics.findByStatus = function (status: string) {
  return this.find({ status, isActive: true })
    .populate('patientId', 'firstName lastName email phone dateOfBirth gender')
    .populate('doctorId', 'firstName lastName email specialty')
    .sort({ createdAt: -1 });
};

PrescriptionSchema.statics.generatePrescriptionNumber = async function () {
  const count = await this.countDocuments();
  const nextNumber = (count + 1).toString().padStart(8, '0');
  return `RX-${nextNumber}`;
};

// Indexes
PrescriptionSchema.index({ patientId: 1 });
PrescriptionSchema.index({ doctorId: 1 });
PrescriptionSchema.index({ status: 1 });

PrescriptionSchema.index({ createdAt: -1 });
PrescriptionSchema.index({ startDate: 1 });
PrescriptionSchema.index({ endDate: 1 });
PrescriptionSchema.index({ patientId: 1, status: 1 });

// Middleware
PrescriptionSchema.pre('save', async function (next) {
  if (this.isNew && !this.prescriptionNumber) {
    try {
      this.prescriptionNumber = await (
        this.constructor as IPrescriptionModel
      ).generatePrescriptionNumber();
    } catch (error) {
      return next(error as Error);
    }
  }

  // Auto-calculate end date if not provided and duration is set
  if (
    this.isModified('medications') &&
    !this.endDate &&
    this.medications.length > 0
  ) {
    const duration = this.medications[0].duration;
    const daysMatch = duration.match(/(\d+)\s+days?/i);
    if (daysMatch) {
      const days = parseInt(daysMatch[1]);
      const endDate = new Date(this.startDate);
      endDate.setDate(endDate.getDate() + days);
      this.endDate = endDate;
    }
  }

  next();
});

const Prescription =
  (models.Prescription as IPrescriptionModel) ||
  model<IPrescriptionDocument, IPrescriptionModel>(
    'Prescription',
    PrescriptionSchema
  );

export default Prescription;

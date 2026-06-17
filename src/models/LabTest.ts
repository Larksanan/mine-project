import { Schema, model, models, Document, Types } from 'mongoose';

export interface ILabTest {
  name: string;
  category: string;
  description?: string;
  price: number;
  duration: number; // in minutes
  sampleType: string;
  preparationInstructions?: string;
  normalRange?: string;
  units?: string;
  isActive: boolean;
}

export interface ILabTestDocument extends ILabTest, Document {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const LabTestSchema = new Schema<ILabTestDocument>(
  {
    name: {
      type: String,
      required: [true, 'Test name is required'],
      trim: true,
      maxlength: [100, 'Test name cannot exceed 100 characters'],
    },
    category: {
      type: String,
      required: [true, 'Test category is required'],
      set: (v: string) => v?.trim().toUpperCase().replace(/\s+/g, '_'),
      enum: [
        'HEMATOLOGY',
        'BIOCHEMISTRY',
        'MICROBIOLOGY',
        'IMMUNOLOGY',
        'PATHOLOGY',
        'URINALYSIS',
        'ENDOCRINOLOGY',
        'TOXICOLOGY',
        'MOLECULAR_DIAGNOSTICS',
        'BLOOD_BANK',
        'CLINICAL_CHEMISTRY',
        'CYTOLOGY',
        'MOLECULAR_BIOLOGY',
        'GENERAL_LABORATORY',
        'OTHER',
      ],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    duration: {
      type: Number,
      required: [true, 'Duration is required'],
      min: [1, 'Duration must be at least 1 minute'],
      default: 30,
    },
    sampleType: {
      type: String,
      required: [true, 'Sample type is required'],
      trim: true,
      uppercase: true,
      enum: [
        'BLOOD',
        'URINE',
        'STOOL',
        'SALIVA',
        'TISSUE',
        'SWAB',
        'CSF',
        'SPUTUM',
        'OTHER',
      ],
    },
    preparationInstructions: {
      type: String,
      trim: true,
      maxlength: [
        1000,
        'Preparation instructions cannot exceed 1000 characters',
      ],
    },
    normalRange: {
      type: String,
      trim: true,
    },
    units: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

LabTestSchema.index({ name: 1 });
LabTestSchema.index({ category: 1 });
LabTestSchema.index({ isActive: 1 });

// Add compound index for unique test names within categories
LabTestSchema.index({ name: 1, category: 1 }, { unique: true });

// Prevent Mongoose model recompilation error in development
if (process.env.NODE_ENV !== 'production' && models.LabTest) {
  delete models.LabTest;
}

const LabTest =
  models.LabTest || model<ILabTestDocument>('LabTest', LabTestSchema);

export default LabTest;

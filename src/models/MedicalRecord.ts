/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMedicalRecord extends Document {
  followUpDate: unknown;

  vitalSigns: any;
  notes: unknown;
  medications: any;
  treatment: unknown;
  diagnosis: any;
  patientId: mongoose.Types.ObjectId;
  doctorId: mongoose.Types.ObjectId;
  recordType:
    | 'CONSULTATION'
    | 'LAB_RESULT'
    | 'IMAGING'
    | 'ECG'
    | 'PRESCRIPTION'
    | 'PROGRESS_NOTE'
    | 'SURGICAL_REPORT'
    | 'DISCHARGE_SUMMARY'
    | 'OTHER';
  title: string;
  description: string;
  date: Date;
  status: 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
  attachments: string[];
  doctorNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MedicalRecordSchema: Schema = new Schema(
  {
    patientId: {
      type: Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
      index: true,
    },
    doctorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    recordType: {
      type: String,
      enum: [
        'CONSULTATION',
        'LAB_RESULT',
        'IMAGING',
        'ECG',
        'PRESCRIPTION',
        'PROGRESS_NOTE',
        'SURGICAL_REPORT',
        'DISCHARGE_SUMMARY',
        'OTHER',
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    date: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'COMPLETED', 'ARCHIVED'],
      default: 'ACTIVE',
    },
    attachments: [
      {
        type: String,
        trim: true,
      },
    ],
    doctorNotes: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient querying
MedicalRecordSchema.index({ patientId: 1, createdAt: -1 });
MedicalRecordSchema.index({ doctorId: 1, createdAt: -1 });
MedicalRecordSchema.index({ recordType: 1 });
MedicalRecordSchema.index({ status: 1 });
MedicalRecordSchema.index({ date: 1 });

export default (mongoose.models.MedicalRecord as Model<IMedicalRecord>) ||
  mongoose.model<IMedicalRecord>('MedicalRecord', MedicalRecordSchema);

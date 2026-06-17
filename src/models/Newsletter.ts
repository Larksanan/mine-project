/* eslint-disable no-useless-escape */
import mongoose from 'mongoose';

const NewsletterSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address',
      ],
    },
    subscribedAt: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    couponCode: {
      type: String,
      default: null,
    },
    couponUsed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Create index for faster queries
NewsletterSchema.index({ subscribedAt: -1 });

export default mongoose.models.Newsletter ||
  mongoose.model('Newsletter', NewsletterSchema);

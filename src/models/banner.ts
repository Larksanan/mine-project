import { Schema, model, models, Document, Types } from 'mongoose';

export interface IBanner {
  image: string;
  title: string;
  description: string;
  link?: string;
  isActive?: boolean;
  createdBy?: Types.ObjectId;
}

export interface IBannerDocument extends IBanner, Document {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const BannerSchema = new Schema<IBannerDocument>(
  {
    image: {
      type: String,
      required: [true, 'Image is required'],
      trim: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    link: {
      type: String,
      required: [true, 'Link is required'],
      trim: true,
    },
    isActive: {
      type: Boolean,
      required: [true, 'isActive is required'],
      default: true,
    },
    createdBy: {
      type: Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

export default models.Banner || model<IBannerDocument>('Banner', BannerSchema);

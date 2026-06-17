import mongoose from 'mongoose';

const scheduleSchema = new mongoose.Schema(
  {
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true,
    },
    dayOfWeek: {
      type: String,
      enum: [
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
        'Sunday',
      ],
    },
    date: String, // Format: YYYY-MM-DD
    startTime: {
      type: String,
      required: true,
    },
    endTime: {
      type: String,
      required: true,
    },
    slotDuration: {
      type: Number,
      default: 30,
    },
    maxPatientsPerSlot: {
      type: Number,
      default: 1,
    },
    breakTime: String,
    isRecurring: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    notes: String,
  },
  {
    timestamps: true,
  }
);

const Schedule =
  mongoose.models.Schedule || mongoose.model('Schedule', scheduleSchema);

export default Schedule;

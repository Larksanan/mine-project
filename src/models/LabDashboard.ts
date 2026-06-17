import { Schema, model, models, Document, Types } from 'mongoose';

export interface ILabDashboard {
  labTechnician: Types.ObjectId;
  totalTestsCompleted: number;
  testsToday: number;
  pendingTests: number;
  averageTurnaroundTime: number;
  criticalFindings: number;
  lastActivity: Date;
}

export interface ILabDashboardDocument extends ILabDashboard, Document {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;

  // Methods
  updateStats(): Promise<ILabDashboardDocument>;
}

const LabDashboardSchema = new Schema<ILabDashboardDocument>(
  {
    labTechnician: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    totalTestsCompleted: {
      type: Number,
      default: 0,
    },
    testsToday: {
      type: Number,
      default: 0,
    },
    pendingTests: {
      type: Number,
      default: 0,
    },
    averageTurnaroundTime: {
      type: Number,
      default: 0,
    },
    criticalFindings: {
      type: Number,
      default: 0,
    },
    lastActivity: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Method to update dashboard statistics
LabDashboardSchema.methods.updateStats = async function (
  this: ILabDashboardDocument
): Promise<ILabDashboardDocument> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const LabTestRequest = model('LabTestRequest');

  // Get stats from test requests
  const stats = await LabTestRequest.aggregate([
    {
      $match: {
        labTechnician: this.labTechnician,
      },
    },
    {
      $facet: {
        totalCompleted: [
          { $match: { status: { $in: ['COMPLETED', 'VERIFIED'] } } },
          { $count: 'count' },
        ],
        todayTests: [
          {
            $match: {
              completedDate: { $gte: today, $lt: tomorrow },
              status: { $in: ['COMPLETED', 'VERIFIED'] },
            },
          },
          { $count: 'count' },
        ],
        pendingTests: [
          {
            $match: {
              status: { $in: ['REQUESTED', 'SAMPLE_COLLECTED', 'IN_PROGRESS'] },
            },
          },
          { $count: 'count' },
        ],
        criticalTests: [{ $match: { isCritical: true } }, { $count: 'count' }],
        turnaroundStats: [
          {
            $match: {
              completedDate: { $exists: true },
              requestedDate: { $exists: true },
            },
          },
          {
            $project: {
              turnaround: {
                $divide: [
                  { $subtract: ['$completedDate', '$requestedDate'] },
                  1000 * 60 * 60, // Convert to hours
                ],
              },
            },
          },
          {
            $group: {
              _id: null,
              avgTurnaround: { $avg: '$turnaround' },
            },
          },
        ],
      },
    },
  ]);

  // Update the dashboard with new stats
  this.totalTestsCompleted = stats[0]?.totalCompleted[0]?.count || 0;
  this.testsToday = stats[0]?.todayTests[0]?.count || 0;
  this.pendingTests = stats[0]?.pendingTests[0]?.count || 0;
  this.criticalFindings = stats[0]?.criticalTests[0]?.count || 0;
  this.averageTurnaroundTime = stats[0]?.turnaroundStats[0]?.avgTurnaround || 0;
  this.lastActivity = new Date();

  return await this.save();
};

LabDashboardSchema.index({ labTechnician: 1 });

const LabDashboard =
  models.LabDashboard ||
  model<ILabDashboardDocument>('LabDashboard', LabDashboardSchema);

export default LabDashboard;

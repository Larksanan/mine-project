/* eslint-disable @typescript-eslint/no-explicit-any */
import { Schema, model, models, Document, Types, Model } from 'mongoose';

export interface IAddress {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

export interface IEmergencyContact {
  name?: string;
  phone?: string;
  relationship?: string;
  email?: string;
}

export interface IInsurance {
  provider?: string;
  policyNumber?: string;
  groupNumber?: string;
  validUntil?: Date;
}

export interface IPatient {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  nic: string;
  dateOfBirth: Date;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  address?: IAddress;
  emergencyContact?: IEmergencyContact;
  medicalHistory?: string;
  allergies?: string[];
  medications?: string[];
  insurance?: IInsurance;
  bloodType?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
  height?: number;
  weight?: number;
  isActive?: boolean;
  createdBy?: Types.ObjectId;
  lastVisit?: Date;
  maritalStatus?: 'SINGLE' | 'MARRIED' | 'DIVORCED' | 'WIDOWED';
  occupation?: string;
  preferredLanguage?: string;
}

export interface IPatientDocument extends IPatient, Document {
  user: Types.ObjectId;
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;

  // Virtuals
  age: number;
  bmi?: number;
  fullName: string;
  bmiCategory?: string;
  isInsuranceValid: boolean;
  nextAppointment?: Date;

  // Methods
  calculateAge(): number;
  calculateBMI(): number | null;
  getBMICategory(): string | null;
  hasAllergy(allergen: string): boolean;
  addAllergy(allergen: string): void;
  removeAllergy(allergen: string): void;
  hasMedication(medication: string): boolean;
  addMedication(medication: string): void;
  removeMedication(medication: string): void;
  isAdult(): boolean;
  isSenior(): boolean;
  isChild(): boolean;
  getAgeGroup(): 'CHILD' | 'ADULT' | 'SENIOR';
  activate(): void;
  deactivate(): void;
  isInsuranceExpired(): boolean;
  daysUntilInsuranceExpires(): number | null;
  getMedicalSummary(): {
    age: number;
    bmi: number | null;
    bmiCategory: string | null;
    bloodType?: string;
    allergies: string[];
    medications: string[];
  };
}

// REMOVE THE DUPLICATE INTERFACE FROM INSIDE getPatientStats METHOD!
// KEEP ONLY THIS ONE INTERFACE DEFINITION
export interface IPatientModel extends Model<IPatientDocument> {
  // Basic queries
  findActivePatients(): Promise<IPatientDocument[]>;
  findByEmail(email: string): Promise<IPatientDocument | null>;
  findByNIC(nic: string): Promise<IPatientDocument | null>;
  searchPatients(searchTerm: string): Promise<IPatientDocument[]>;

  // Statistical methods
  getPatientStats(): Promise<{
    total: number;
    active: number;
    male: number;
    female: number;
    other: number;
    adults: number;
    children: number;
    seniors: number;
    recent: number;
    withInsurance: number;
    insuranceExpiring: number;
  }>;

  // Filtering methods
  findPatientsByAgeGroup(
    ageGroup: 'CHILD' | 'ADULT' | 'SENIOR'
  ): Promise<IPatientDocument[]>;
  findRecentPatients(days?: number): Promise<IPatientDocument[]>;
  findPatientsByBloodType(bloodType: string): Promise<IPatientDocument[]>;
  findPatientsWithExpiringInsurance(
    daysThreshold?: number
  ): Promise<IPatientDocument[]>;

  // Advanced queries
  findPatientsByCreator(createdBy: Types.ObjectId): Promise<IPatientDocument[]>;
  findPatientsWithAllergies(): Promise<IPatientDocument[]>;
  findPatientsByGender(
    gender: 'MALE' | 'FEMALE' | 'OTHER'
  ): Promise<IPatientDocument[]>;

  // Utility methods
  getBloodTypeDistribution(): Promise<
    Array<{ bloodType: string; count: number }>
  >;
  getAllergyStatistics(): Promise<Array<{ allergy: string; count: number }>>;
}

const AddressSchema = new Schema<IAddress>(
  {
    street: { type: String, trim: true, default: '' },
    city: { type: String, trim: true, default: '' },
    state: { type: String, trim: true, default: '' },
    zipCode: { type: String, trim: true, default: '' },
    country: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const EmergencyContactSchema = new Schema<IEmergencyContact>(
  {
    name: { type: String, trim: true, default: '' },
    phone: { type: String, trim: true, default: '' },
    relationship: { type: String, trim: true, default: '' },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please enter a valid email',
      ],
    },
  },
  { _id: false }
);

const InsuranceSchema = new Schema<IInsurance>(
  {
    provider: { type: String, trim: true, default: '' },
    policyNumber: { type: String, trim: true, default: '' },
    groupNumber: { type: String, trim: true, default: '' },
    validUntil: {
      type: Date,
      default: () => new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
  },
  { _id: false }
);

const PatientSchema = new Schema<IPatientDocument, IPatientModel>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      unique: true,
    },
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      maxlength: [50, 'First name cannot exceed 50 characters'],
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
      maxlength: [50, 'Last name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      unique: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please enter a valid email',
      ],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      match: [/^\+?[\d\s-()]+$/, 'Please enter a valid phone number'],
    },
    nic: {
      type: String,
      required: [true, 'NIC is required'],
      unique: true,
      trim: true,
      uppercase: true,
      match: [/^[0-9]{9}[VX]|[0-9]{12}$/, 'Please enter a valid NIC'],
    },
    dateOfBirth: {
      type: Date,
      required: [true, 'Date of birth is required'],
      validate: {
        validator: function (value: Date) {
          return value < new Date();
        },
        message: 'Date of birth must be in the past',
      },
    },
    gender: {
      type: String,
      required: [true, 'Gender is required'],
      enum: ['MALE', 'FEMALE', 'OTHER'],
    },
    address: {
      type: AddressSchema,
      default: () => ({}),
    },
    emergencyContact: {
      type: EmergencyContactSchema,
      default: () => ({}),
    },
    medicalHistory: {
      type: String,
      trim: true,
      maxlength: [2000, 'Medical history cannot exceed 2000 characters'],
      default: '',
    },
    allergies: {
      type: [String],
      default: [],
      set: function (allergies: string[]) {
        return [...new Set(allergies.map(a => a.toLowerCase().trim()))];
      },
    },
    medications: {
      type: [String],
      default: [],
      set: function (medications: string[]) {
        return [...new Set(medications.map(m => m.trim()))];
      },
    },
    insurance: {
      type: InsuranceSchema,
      default: () => ({}),
    },
    bloodType: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    },
    height: {
      type: Number,
      min: [0, 'Height must be positive'],
      max: [300, 'Height must be realistic (max 300cm)'],
    },
    weight: {
      type: Number,
      min: [0, 'Weight must be positive'],
      max: [500, 'Weight must be realistic (max 500kg)'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    lastVisit: {
      type: Date,
    },
    maritalStatus: {
      type: String,
      enum: ['SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED'],
    },
    occupation: {
      type: String,
      trim: true,
      maxlength: [100, 'Occupation cannot exceed 100 characters'],
    },
    preferredLanguage: {
      type: String,
      trim: true,
      default: 'en',
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
PatientSchema.virtual('age').get(function (this: IPatientDocument) {
  return this.calculateAge();
});

PatientSchema.virtual('bmi').get(function (this: IPatientDocument) {
  return this.calculateBMI();
});

PatientSchema.virtual('bmiCategory').get(function (this: IPatientDocument) {
  return this.getBMICategory();
});

PatientSchema.virtual('fullName').get(function (this: IPatientDocument) {
  return `${this.firstName} ${this.lastName}`;
});

PatientSchema.virtual('isInsuranceValid').get(function (
  this: IPatientDocument
) {
  return !this.isInsuranceExpired();
});

PatientSchema.virtual('nextAppointment').get(function (this: IPatientDocument) {
  return undefined;
});

// Instance Methods
PatientSchema.methods.calculateAge = function (this: IPatientDocument): number {
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }
  return age;
};

PatientSchema.methods.calculateBMI = function (
  this: IPatientDocument
): number | null {
  if (!this.height || !this.weight || this.height === 0) return null;
  const heightInMeters = this.height / 100;
  const bmi = this.weight / (heightInMeters * heightInMeters);
  return Math.round(bmi * 100) / 100;
};

PatientSchema.methods.getBMICategory = function (
  this: IPatientDocument
): string | null {
  const bmi = this.calculateBMI();
  if (!bmi) return null;

  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Normal weight';
  if (bmi < 30) return 'Overweight';
  return 'Obese';
};

PatientSchema.methods.hasAllergy = function (
  this: IPatientDocument,
  allergen: string
): boolean {
  return this.allergies
    ? this.allergies.includes(allergen.toLowerCase().trim())
    : false;
};

PatientSchema.methods.addAllergy = function (
  this: IPatientDocument,
  allergen: string
): void {
  if (!this.allergies) this.allergies = [];
  const normalizedAllergen = allergen.toLowerCase().trim();
  if (!this.allergies.includes(normalizedAllergen)) {
    this.allergies.push(normalizedAllergen);
  }
};

PatientSchema.methods.removeAllergy = function (
  this: IPatientDocument,
  allergen: string
): void {
  if (this.allergies) {
    const normalizedAllergen = allergen.toLowerCase().trim();
    this.allergies = this.allergies.filter(a => a !== normalizedAllergen);
  }
};

PatientSchema.methods.hasMedication = function (
  this: IPatientDocument,
  medication: string
): boolean {
  return this.medications
    ? this.medications.includes(medication.trim())
    : false;
};

PatientSchema.methods.addMedication = function (
  this: IPatientDocument,
  medication: string
): void {
  if (!this.medications) this.medications = [];
  const normalizedMedication = medication.trim();
  if (!this.medications.includes(normalizedMedication)) {
    this.medications.push(normalizedMedication);
  }
};

PatientSchema.methods.removeMedication = function (
  this: IPatientDocument,
  medication: string
): void {
  if (this.medications) {
    const normalizedMedication = medication.trim();
    this.medications = this.medications.filter(m => m !== normalizedMedication);
  }
};

PatientSchema.methods.isAdult = function (this: IPatientDocument): boolean {
  return this.calculateAge() >= 18 && this.calculateAge() < 65;
};

PatientSchema.methods.isSenior = function (this: IPatientDocument): boolean {
  return this.calculateAge() >= 65;
};

PatientSchema.methods.isChild = function (this: IPatientDocument): boolean {
  return this.calculateAge() < 18;
};

PatientSchema.methods.getAgeGroup = function (
  this: IPatientDocument
): 'CHILD' | 'ADULT' | 'SENIOR' {
  const age = this.calculateAge();
  if (age < 18) return 'CHILD';
  if (age < 65) return 'ADULT';
  return 'SENIOR';
};

PatientSchema.methods.activate = function (this: IPatientDocument): void {
  this.isActive = true;
};

PatientSchema.methods.deactivate = function (this: IPatientDocument): void {
  this.isActive = false;
};

PatientSchema.methods.isInsuranceExpired = function (
  this: IPatientDocument
): boolean {
  if (!this.insurance?.validUntil) return true;
  return new Date() > this.insurance.validUntil;
};

PatientSchema.methods.daysUntilInsuranceExpires = function (
  this: IPatientDocument
): number | null {
  if (!this.insurance?.validUntil) return null;
  const now = new Date();
  const expiry = new Date(this.insurance.validUntil);
  const diffTime = expiry.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

PatientSchema.methods.getMedicalSummary = function (this: IPatientDocument) {
  return {
    age: this.calculateAge(),
    bmi: this.calculateBMI(),
    bmiCategory: this.getBMICategory(),
    bloodType: this.bloodType,
    allergies: this.allergies || [],
    medications: this.medications || [],
  };
};

// Static Methods
PatientSchema.statics.findActivePatients = function () {
  return this.find({ isActive: true }).sort({ firstName: 1, lastName: 1 });
};

PatientSchema.statics.findByEmail = function (email: string) {
  return this.findOne({ email: email.toLowerCase(), isActive: true });
};

PatientSchema.statics.findByNIC = function (nic: string) {
  return this.findOne({ nic: nic.toUpperCase(), isActive: true });
};

PatientSchema.statics.searchPatients = function (searchTerm: string) {
  return this.find({
    isActive: true,
    $or: [
      { firstName: { $regex: searchTerm, $options: 'i' } },
      { lastName: { $regex: searchTerm, $options: 'i' } },
      { email: { $regex: searchTerm, $options: 'i' } },
      { phone: { $regex: searchTerm, $options: 'i' } },
      { nic: { $regex: searchTerm, $options: 'i' } },
    ],
  }).sort({ firstName: 1, lastName: 1 });
};

PatientSchema.statics.getPatientStats = async function () {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const stats = await this.aggregate([
    {
      $facet: {
        total: [{ $count: 'count' }],
        active: [{ $match: { isActive: true } }, { $count: 'count' }],
        recent: [
          { $match: { createdAt: { $gte: thirtyDaysAgo } } },
          { $count: 'count' },
        ],
        gender: [
          { $match: { isActive: true } },
          { $group: { _id: '$gender', count: { $sum: 1 } } },
        ],
        ageGroups: [
          { $match: { isActive: true } },
          {
            $project: {
              age: {
                $floor: {
                  $divide: [
                    { $subtract: [new Date(), '$dateOfBirth'] },
                    365 * 24 * 60 * 60 * 1000,
                  ],
                },
              },
            },
          },
          {
            $bucket: {
              groupBy: '$age',
              boundaries: [0, 18, 65, 120],
              default: 'other',
              output: { count: { $sum: 1 } },
            },
          },
        ],
        insurance: [
          { $match: { isActive: true } },
          {
            $group: {
              _id: null,
              withInsurance: {
                $sum: {
                  $cond: [{ $gt: ['$insurance.validUntil', new Date()] }, 1, 0],
                },
              },
              insuranceExpiring: {
                $sum: {
                  $cond: [
                    {
                      $and: [
                        { $gt: ['$insurance.validUntil', new Date()] },
                        {
                          $lt: [
                            '$insurance.validUntil',
                            new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                          ],
                        },
                      ],
                    },
                    1,
                    0,
                  ],
                },
              },
            },
          },
        ],
      },
    },
  ]);

  // REMOVED THE DUPLICATE INTERFACE DEFINITION FROM HERE!

  const result = {
    total: stats[0]?.total[0]?.count || 0,
    active: stats[0]?.active[0]?.count || 0,
    recent: stats[0]?.recent[0]?.count || 0,
    male: 0,
    female: 0,
    other: 0,
    adults: 0,
    children: 0,
    seniors: 0,
    withInsurance: stats[0]?.insurance[0]?.withInsurance || 0,
    insuranceExpiring: stats[0]?.insurance[0]?.insuranceExpiring || 0,
  };

  // Process gender stats
  stats[0]?.gender?.forEach((g: any) => {
    if (g._id === 'MALE') result.male = g.count;
    if (g._id === 'FEMALE') result.female = g.count;
    if (g._id === 'OTHER') result.other = g.count;
  });

  // Process age group stats
  stats[0]?.ageGroups?.forEach((ageGroup: any) => {
    if (ageGroup._id === 0) result.children = ageGroup.count;
    if (ageGroup._id === 18) result.adults = ageGroup.count;
    if (ageGroup._id === 65) result.seniors = ageGroup.count;
  });

  return result;
};

PatientSchema.statics.findPatientsByAgeGroup = function (
  ageGroup: 'CHILD' | 'ADULT' | 'SENIOR'
) {
  const today = new Date();
  let minDate, maxDate;

  switch (ageGroup) {
    case 'CHILD':
      maxDate = new Date(
        today.getFullYear() - 18,
        today.getMonth(),
        today.getDate()
      );
      return this.find({
        dateOfBirth: { $gte: maxDate },
        isActive: true,
      });
    case 'ADULT':
      minDate = new Date(
        today.getFullYear() - 65,
        today.getMonth(),
        today.getDate()
      );
      maxDate = new Date(
        today.getFullYear() - 18,
        today.getMonth(),
        today.getDate()
      );
      return this.find({
        dateOfBirth: { $gte: minDate, $lt: maxDate },
        isActive: true,
      });
    case 'SENIOR':
      minDate = new Date(
        today.getFullYear() - 120,
        today.getMonth(),
        today.getDate()
      );
      maxDate = new Date(
        today.getFullYear() - 65,
        today.getMonth(),
        today.getDate()
      );
      return this.find({
        dateOfBirth: { $gte: minDate, $lt: maxDate },
        isActive: true,
      });
    default:
      return this.find({ isActive: true });
  }
};

PatientSchema.statics.findRecentPatients = function (days: number = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return this.find({
    createdAt: { $gte: startDate },
    isActive: true,
  }).sort({ createdAt: -1 });
};

PatientSchema.statics.findPatientsByBloodType = function (bloodType: string) {
  return this.find({
    bloodType,
    isActive: true,
  }).sort({ firstName: 1, lastName: 1 });
};

PatientSchema.statics.findPatientsWithExpiringInsurance = function (
  daysThreshold: number = 30
) {
  const thresholdDate = new Date();
  thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);

  return this.find({
    'insurance.validUntil': {
      $lte: thresholdDate,
      $gte: new Date(),
    },
    isActive: true,
  }).sort({ 'insurance.validUntil': 1 });
};

PatientSchema.statics.findPatientsByCreator = function (
  createdBy: Types.ObjectId
) {
  return this.find({
    createdBy,
    isActive: true,
  }).sort({ createdAt: -1 });
};

PatientSchema.statics.findPatientsWithAllergies = function () {
  return this.find({
    allergies: { $exists: true, $not: { $size: 0 } },
    isActive: true,
  }).sort({ firstName: 1, lastName: 1 });
};

PatientSchema.statics.findPatientsByGender = function (
  gender: 'MALE' | 'FEMALE' | 'OTHER'
) {
  return this.find({
    gender,
    isActive: true,
  }).sort({ firstName: 1, lastName: 1 });
};

PatientSchema.statics.getBloodTypeDistribution = async function () {
  const distribution = await this.aggregate([
    { $match: { isActive: true, bloodType: { $exists: true } } },
    { $group: { _id: '$bloodType', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  return distribution.map((item: any) => ({
    bloodType: item._id,
    count: item.count,
  }));
};

PatientSchema.statics.getAllergyStatistics = async function () {
  const stats = await this.aggregate([
    {
      $match: {
        isActive: true,
        allergies: { $exists: true, $not: { $size: 0 } },
      },
    },
    { $unwind: '$allergies' },
    { $group: { _id: '$allergies', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 20 },
  ]);

  return stats.map((item: any) => ({
    allergy: item._id,
    count: item.count,
  }));
};

// Indexes
PatientSchema.index({ isActive: 1 });
PatientSchema.index({ firstName: 1, lastName: 1 });
PatientSchema.index({ createdAt: -1 });
PatientSchema.index({ dateOfBirth: 1 });
PatientSchema.index({ gender: 1 });
PatientSchema.index({ bloodType: 1 });
PatientSchema.index({ 'insurance.validUntil': 1 });
PatientSchema.index({ createdBy: 1 });
PatientSchema.index({ lastVisit: -1 });
PatientSchema.index({
  firstName: 'text',
  lastName: 'text',
  email: 'text',
  phone: 'text',
  nic: 'text',
  'address.city': 'text',
  'address.state': 'text',
});

// Middleware
PatientSchema.pre('save', function (next) {
  if (this.nic) {
    this.nic = this.nic.toUpperCase();
  }

  if (!this.address) {
    this.address = {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: '',
    };
  }

  if (!this.emergencyContact) {
    this.emergencyContact = {
      name: '',
      phone: '',
      email: '',
      relationship: '',
    };
  }

  if (!this.insurance) {
    this.insurance = {
      provider: '',
      policyNumber: '',
      groupNumber: '',
      validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    };
  }

  next();
});

PatientSchema.pre('findOneAndUpdate', function (next) {
  this.set({ updatedAt: new Date() });

  const update = this.getUpdate() as any;
  if (update?.nic) update.nic = update.nic.toUpperCase();
  if (update?.$set?.nic) update.$set.nic = update.$set.nic.toUpperCase();

  next();
});

PatientSchema.post(
  'save',
  function (error: any, doc: IPatientDocument, next: any) {
    if (error.name === 'MongoServerError' && error.code === 11000) {
      let field = 'field';
      if (error.keyValue.email) field = 'email';
      else if (error.keyValue.nic) field = 'NIC';
      next(new Error(`${field} already exists`));
    } else {
      next(error);
    }
  }
);

const Patient =
  (models.Patient as IPatientModel) ||
  model<IPatientDocument, IPatientModel>('Patient', PatientSchema);

export default Patient;

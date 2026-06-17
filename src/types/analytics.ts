// types/analytics.ts

export interface AnalyticsData {
  overview: {
    totalPatients: number;
    totalAppointments: number;
    completedAppointments: number;
    cancelledAppointments: number;
    averageRating: number;
    totalRevenue: number;
    newPatients: number;
    returningPatients: number;
  };
  monthlyStats: MonthlyStats[];
  patientDemographics: PatientDemographics;
  appointmentTrends: AppointmentTrend[];
  commonDiagnoses: Diagnosis[];
  revenueAnalysis: RevenueAnalysis;
}

export interface MonthlyStats {
  month: string;
  year: number;
  appointments: number;
  patients: number;
}

export interface PatientDemographics {
  ageGroups: {
    under18: number;
    age18to35: number;
    age36to60: number;
    over60: number;
  };
  genderDistribution: {
    male: number;
    female: number;
    other: number;
  };
}

export interface AppointmentTrend {
  type: 'byDay' | 'byTime';
  data: AppointmentTrendData[];
}

export interface AppointmentTrendData {
  day?: string;
  time?: string;
  count: number;
}

export interface Diagnosis {
  diagnosis: string;
  count: number;
  percentage: number;
}

export interface RevenueAnalysis {
  monthlyRevenue: MonthlyRevenue[];
  byService: ServiceRevenue[];
}

export interface MonthlyRevenue {
  month: string;
  year: number;
  revenue: number;
  count: number;
  growth?: number;
}

export interface ServiceRevenue {
  service: string;
  revenue: number;
  count: number;
  percentage: number;
}

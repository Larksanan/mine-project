import {
  CreateLabTestDto,
  CreateLabTestRequestDto,
  CreateTechnicianDto,
  LabTechnician,
  TechnicianWorkloadInfo,
  UpdateLabTestDto,
  UpdateLabTestRequestDto,
  UpdateTechnicianDto,
} from '../hooks/Index';

import { Patient } from './patient';

export interface LabTestRequest {
  _id: string;
  patient: {
    _id: string;
    nic: string;
    firstName: string;
    lastName: string;
    email: string;
    dateOfBirth: Date;
    gender: 'MALE' | 'FEMALE' | 'OTHER';
    phone?: string;
    medicalRecordNumber?: string;
  };
  doctor: {
    _id: string;
    name: string;
    email: string;
    phone: string;
    doctorId: string;
    doctor_number: string;
  };
  labTechnician?: {
    _id: string;
    name: string;
    employeeId: string;
  };
  test: {
    _id: string;
    name: string;
    category: string;
    duration: number;
    price: number;
    sampleType: string;
  };
  status:
    | 'REQUESTED'
    | 'SAMPLE_COLLECTED'
    | 'IN_PROGRESS'
    | 'COMPLETED'
    | 'VERIFIED'
    | 'CANCELLED';
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'STAT';
  requestedDate: string;
  sampleCollectedDate?: string;
  startedDate?: string;
  completedDate?: string;
  results?: string;
  findings?: string;
  notes?: string;
  isCritical: boolean;
  turnaroundTime?: number;
  isOverdue: boolean;
  employeeId?: string;
  verifiedDate?: string;
}

// FILTERS
export interface Filters {
  status: string;
  priority: string;
  search: string;
  dateRange: {
    start: string;
    end: string;
  };
}

// STATS BOX
export interface OrdersStatsProps {
  orders: LabTestRequest[];
}

// FILTERS COMPONENT PROPS
export interface OrdersFiltersProps {
  filters: Filters;
  onFilterChange: (key: keyof Filters, value: string) => void;
  onDateRangeChange: (key: 'start' | 'end', value: string) => void;
  orders: LabTestRequest[];
  onViewDetails: (order: LabTestRequest) => void;
  onStatusUpdate: (
    orderId: string,
    newStatus: LabTestRequest['status']
  ) => void;
  onEditOrder?: (orderId: string) => void;
}

// TABLE COMPONENT PROPS
export interface OrdersTableProps {
  orders: LabTestRequest[];
  onViewDetails: (order: LabTestRequest) => void;
  onStatusUpdate: (
    orderId: string,
    newStatus: LabTestRequest['status']
  ) => void;
  onEditOrder?: (orderId: string) => void;
}

// ORDER DETAILS MODAL
export interface OrderDetailsModalProps {
  order: LabTestRequest;
  onClose: () => void;
  onStatusUpdate: (
    orderId: string,
    newStatus: LabTestRequest['status']
  ) => void;
  onAssignTechnician: (orderId: string, technicianId: string) => void;
}

// LAB TEST ENTITY
export interface LabTest {
  _id: string;
  name: string;
  category: string;
  description?: string;
  price: number;
  duration: number;
  sampleType: string;
  preparationInstructions?: string;
  normalRange?: string;
  units?: string;
}

export interface NewOrderData {
  patientId: string;
  testId: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'STAT';
  notes: string;
  referral: string;
  isCritical: boolean;
  requestedDate: string;
}

export interface TestSelectionProps {
  availableTests: LabTest[];
  selectedTest: LabTest | null;
  onTestSelect: (test: LabTest) => void;
}

export interface OrderDetailsProps {
  orderData: NewOrderData;
  onOrderDataChange: (updates: Partial<NewOrderData>) => void;
}

export interface PrioritySettingsProps {
  orderData: NewOrderData;
  onOrderDataChange: (updates: Partial<NewOrderData>) => void;
}

export interface OrderSummaryProps {
  selectedPatient: Patient | null;
  selectedTest: LabTest | null;
  orderData: NewOrderData;
  submitting: boolean;
  onSubmit: () => void;
}

export interface LabOrderFormData {
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'STAT';
  status: LabTestRequest['status'];
  notes: string;
  results: string;
  findings: string;
  isCritical: boolean;
  sampleCollectedDate: string;
  startedDate: string;
  completedDate: string;
}

export interface LabSample {
  id: string;
  sampleId: string;
  patientId: string;
  patientName: string;
  testId: string;
  testName: string;
  sampleType: string;
  status: SampleStatus;
  priority: SamplePriority;
  isCritical: boolean;
  collectedDate: string;
  collectedBy: string;
  receivedDate?: string;
  startedDate?: string;
  completedDate?: string;
  notes?: string;
  containerType: string;
  volume?: string;
  storageLocation?: string;
  orderId?: string;
  technicianId?: string;
  technicianName?: string;
}

export type SampleStatus =
  | 'COLLECTED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export type SamplePriority = 'LOW' | 'NORMAL' | 'HIGH' | 'STAT';

export interface SamplesResponse {
  success: boolean;
  samples: LabSample[];
  message?: string;
}

export interface UseLabTechniciansResult {
  technicians: LabTechnician[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export interface UseAvailableTechniciansResult extends UseLabTechniciansResult {
  specialization: string;
  totalAvailable: number;
}

export interface UseLabTechnicianResult {
  technician: LabTechnician | null;
  loading: boolean;
  error: string | null;
  updateTechnician: (data: UpdateTechnicianDto) => Promise<void>;
  deleteTechnician: () => Promise<void>;
  refetch: () => void;
}

export interface UseTechnicianWorkloadResult {
  workloadInfo: TechnicianWorkloadInfo | null;
  loading: boolean;
  error: string | null;
  assignTest: () => Promise<void>;
  completeTest: () => Promise<void>;
  refreshWorkload: () => Promise<void>;
  refetch: () => void;
}

export interface UseTechnicianActionsResult {
  creating: boolean;
  updating: boolean;
  deleting: boolean;
  createTechnician: (
    data: CreateTechnicianDto
  ) => Promise<LabTechnician | null>;
  updateTechnician: (
    id: string,
    data: UpdateTechnicianDto
  ) => Promise<LabTechnician | null>;
  deleteTechnician: (id: string) => Promise<boolean>;
  assignTest: (technicianId: string) => Promise<boolean>;
  completeTest: (technicianId: string) => Promise<boolean>;
}

export interface UseLabTestRequestsResult {
  requests: LabTestRequest[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export interface UseLabTestRequestResult {
  request: LabTestRequest | null;
  loading: boolean;
  error: string | null;
  updateRequest: (data: UpdateLabTestRequestDto) => Promise<void>;
  updateStatus: (status: LabTestRequest['status']) => Promise<void>;
  assignTechnician: (technicianId: string) => Promise<void>;
  refetch: () => Promise<void>;
}

export interface UseTestRequestActionsResult {
  creating: boolean;
  updating: boolean;
  createTestRequest: (
    data: CreateLabTestRequestDto
  ) => Promise<LabTestRequest | null>;
  updateTestRequest: (
    id: string,
    data: UpdateLabTestRequestDto
  ) => Promise<LabTestRequest | null>;
  collectSample: (id: string) => Promise<boolean>;
  startTest: (id: string) => Promise<boolean>;
  completeTest: (
    id: string,
    results: string,
    findings?: string
  ) => Promise<boolean>;
  verifyTest: (id: string) => Promise<boolean>;
  cancelTest: (id: string) => Promise<boolean>;
  assignTechnician: (id: string, technicianId: string) => Promise<boolean>;
}

export interface UseLabTestsResult {
  tests: LabTest[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export interface UseLabTestResult {
  test: LabTest | null;
  loading: boolean;
  error: string | null;
  updateTest: (data: UpdateLabTestDto) => Promise<void>;
  deactivateTest: () => Promise<void>;
  refetch: () => Promise<void>;
}

export interface UseLabTestActionsResult {
  creating: boolean;
  updating: boolean;
  deactivating: boolean;
  createTest: (data: CreateLabTestDto) => Promise<LabTest | null>;
  updateTest: (id: string, data: UpdateLabTestDto) => Promise<LabTest | null>;
  deactivateTest: (id: string) => Promise<boolean>;
}

export interface UseTestCategoriesResult {
  categories: string[];
  loading: boolean;
  error: string | null;
}

export interface UseTestSearchResult {
  tests: LabTest[];
  loading: boolean;
  error: string | null;
  search: (query: string) => Promise<void>;
}

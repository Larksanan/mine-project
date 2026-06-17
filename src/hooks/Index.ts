export * from '@/services/api-client';
export * from '@/services/Lab_technician.service';
export * from '@/services/Lab_test_request.service';
export * from '@/services/Lab_test.service';

export type { ApiResponse, ApiError } from '@/services/api-client';

export type {
  LabTechnician,
  CreateTechnicianDto,
  UpdateTechnicianDto,
  TechnicianWorkloadInfo,
} from '@/services/Lab_technician.service';

export type {
  LabTestRequest,
  CreateLabTestRequestDto,
  UpdateLabTestRequestDto,
} from '@/services/Lab_test_request.service';

export type {
  LabTest,
  CreateLabTestDto,
  UpdateLabTestDto,
} from '@/services/Lab_test.service';

/* eslint-disable @typescript-eslint/no-explicit-any */
// components/Receptionist/Form/FormSection.tsx
import React from 'react';
import BasicInfoSection from '../sections/BasicInfoSection';
import WorkScheduleSection from '../sections/WorkScheduleSection';
import EmploymentSection from '../sections/EmploymentSection';
import PermissionsSection from '../sections/PermissionsSection';
import AdditionalInfoSection from '../sections/AdditionalInfoSection';
import { IReceptionistFormData } from '@/types/Receptionist';

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  nic?: string;
}

interface FormSectionProps {
  activeSection: string;
  formData: IReceptionistFormData;
  users: User[];
  loadingUsers: boolean;
  formErrors: Record<string, string>;

  onFieldChange: (field: string, value: any) => void;
  onWorkScheduleChange: (day: string, field: string, value: any) => void;
  onEmergencyContactChange: (field: string, value: string) => void;
  onSalaryChange: (field: string, value: any) => void;
  onPermissionChange: (field: string, value: boolean) => void;
  onArrayFieldChange: (
    field: 'skills' | 'languages',
    index: number,
    value: string
  ) => void;
  onAddArrayField: (field: 'skills' | 'languages') => void;
  onRemoveArrayField: (field: 'skills' | 'languages', index: number) => void;
}

const FormSection: React.FC<FormSectionProps> = ({
  activeSection,
  formData,
  users,
  loadingUsers,
  formErrors,
  onFieldChange,
  onWorkScheduleChange,
  onEmergencyContactChange,
  onSalaryChange,
  onPermissionChange,
  onArrayFieldChange,
  onAddArrayField,
  onRemoveArrayField,
}) => {
  switch (activeSection) {
    case 'basic':
      return (
        <BasicInfoSection
          formData={formData}
          users={users}
          loadingUsers={loadingUsers}
          formErrors={formErrors}
          onFieldChange={onFieldChange}
        />
      );
    case 'schedule':
      return (
        <WorkScheduleSection
          workSchedule={formData.workSchedule}
          shift={formData.shift || ('' as any)}
          formErrors={formErrors}
          onWorkScheduleChange={onWorkScheduleChange}
        />
      );
    case 'employment':
      return (
        <EmploymentSection
          formData={formData}
          formErrors={formErrors}
          onFieldChange={onFieldChange}
          onEmergencyContactChange={onEmergencyContactChange}
          onSalaryChange={onSalaryChange}
        />
      );
    case 'permissions':
      return (
        <PermissionsSection
          permissions={formData.permissions}
          onPermissionChange={onPermissionChange}
        />
      );
    case 'additional':
      return (
        <AdditionalInfoSection
          formData={formData}
          formErrors={formErrors}
          onFieldChange={onFieldChange}
          onArrayFieldChange={onArrayFieldChange}
          onAddArrayField={onAddArrayField}
          onRemoveArrayField={onRemoveArrayField}
        />
      );
    default:
      return null;
  }
};

export default FormSection;

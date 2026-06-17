import React from 'react';
import BasicInfoSection from '../sections/BasicInfoSection';
import AvailabilitySection from '../sections/AvailabilitySection';
import CredentialsSection from '../sections/CredentialsSection';
import AdditionalInfoSection from '../sections/AdditionalInfoSection';
import { IDoctorFormData, IDoctorProfile } from '@/types/doctors';

interface User {
  id: string;
  name: string;
  email: string;
}

interface FormSectionProps {
  activeSection: string;
  formData: IDoctorFormData;
  users: User[];
  loadingUsers: boolean;
  formErrors: Record<string, string>;
  daysOfWeek: string[];
  specializations: string[];
  departments: string[];
  onProfileChange: (
    field: keyof IDoctorProfile,
    value: string | number | string[] | Date
  ) => void;
  onAvailabilityChange: (
    field: 'days' | 'startTime' | 'endTime',
    value: string[] | string
  ) => void;
  onDayToggle: (day: string) => void;
  onArrayFieldChange: (
    field:
      | 'qualifications'
      | 'languages'
      | 'services'
      | 'awards'
      | 'publications',
    index: number,
    value: string
  ) => void;
  onAddArrayField: (
    field:
      | 'qualifications'
      | 'languages'
      | 'services'
      | 'awards'
      | 'publications'
  ) => void;
  onRemoveArrayField: (
    field:
      | 'qualifications'
      | 'languages'
      | 'services'
      | 'awards'
      | 'publications',
    index: number
  ) => void;
  onUserIdChange: (userId: string) => void;
}

const FormSection: React.FC<FormSectionProps> = ({
  activeSection,
  formData,
  users,
  loadingUsers,
  formErrors,
  daysOfWeek,
  specializations,
  departments,
  onProfileChange,
  onAvailabilityChange,
  onDayToggle,
  onArrayFieldChange,
  onAddArrayField,
  onRemoveArrayField,
  onUserIdChange,
}) => {
  switch (activeSection) {
    case 'basic':
      return (
        <BasicInfoSection
          formData={formData}
          users={users}
          loadingUsers={loadingUsers}
          formErrors={formErrors}
          specializations={specializations}
          departments={departments}
          onProfileChange={onProfileChange}
          onUserIdChange={onUserIdChange}
        />
      );
    case 'availability':
      return (
        <AvailabilitySection
          availability={formData.profile.availability}
          formErrors={formErrors}
          daysOfWeek={daysOfWeek}
          onAvailabilityChange={onAvailabilityChange}
          onDayToggle={onDayToggle}
        />
      );
    case 'credentials':
      return (
        <CredentialsSection
          profile={formData.profile}
          formErrors={formErrors}
          onProfileChange={onProfileChange}
          onArrayFieldChange={onArrayFieldChange}
          onAddArrayField={onAddArrayField}
          onRemoveArrayField={onRemoveArrayField}
        />
      );
    case 'additional':
      return (
        <AdditionalInfoSection
          profile={formData.profile}
          formErrors={formErrors}
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

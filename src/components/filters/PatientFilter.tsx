import React from 'react';
import Select from '@/components/ui/Select';
import SelectItem from '@/components/ui/SelectItem';
import { IPatientFormData } from '@/types/patients';

interface PatientFilterProps {
  value: string;
  onChange: (value: string) => void;
  patients: IPatientFormData[];
  label?: string;
}

const PatientFilter: React.FC<PatientFilterProps> = ({
  value,
  onChange,
  patients,
  label = 'Patient',
}) => {
  return (
    <div className='space-y-2'>
      <label className='block text-sm font-medium text-gray-700 dark:text-gray-300'>
        {label}
      </label>
      <Select value={value} onChange={onChange} placeholder='Select patient'>
        <SelectItem value=''>All Patients</SelectItem>
        {patients.map(patient => (
          <SelectItem key={patient.userId} value={patient.nic || ''}>
            {patient.firstName}
            {patient.lastName}
          </SelectItem>
        ))}
      </Select>
    </div>
  );
};

export default PatientFilter;

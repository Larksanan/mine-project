import React from 'react';
import Select from '../ui/Select';
import SelectItem from '../ui/SelectItem';

interface StatusFilterProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

const StatusFilter: React.FC<StatusFilterProps> = ({
  value,
  onChange,
  label = 'Status',
}) => {
  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'ACTIVE', label: 'Active' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'CANCELLED', label: 'Cancelled' },
    { value: 'EXPIRED', label: 'Expired' },
    { value: 'PENDING', label: 'Pending' },
  ];

  return (
    <div className='space-y-2'>
      <label className='block text-sm font-medium text-gray-700 dark:text-gray-300'>
        {label}
      </label>
      <Select value={value} onChange={onChange} placeholder='Select status'>
        {statusOptions.map(option => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </Select>
    </div>
  );
};

export default StatusFilter;

import React from 'react';
import Badge from '@/components/ui/Badge';
import Icon from '@/components/ui/Icon';

interface PrescriptionHeaderProps {
  patientName: string;
  patientEmail: string;
  status: string;
  diagnosis: string;
}

const PrescriptionHeader: React.FC<PrescriptionHeaderProps> = ({
  patientName,
  patientEmail,
  status,
  diagnosis,
}) => {
  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'success';
      case 'pending':
        return 'warning';
      case 'expired':
        return 'danger';
      case 'completed':
        return 'info';
      default:
        return 'default';
    }
  };

  return (
    <div className='mb-6'>
      <div className='flex items-start justify-between mb-4'>
        <div>
          <div className='flex items-center gap-3 mb-2'>
            <Icon name='FiUser' size='lg' color='#4f46e5' />
            <div>
              <h3 className='text-xl font-semibold text-gray-900 dark:text-gray-100'>
                {patientName}
              </h3>
              <p className='text-gray-600 dark:text-gray-400 text-sm mt-1'>
                {patientEmail}
              </p>
            </div>
          </div>
        </div>
        <Badge
          variant={getStatusVariant(status)}
          pulse={status.toLowerCase() === 'active'}
        >
          {status}
        </Badge>
      </div>

      <div className='bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4'>
        <p className='text-sm text-gray-600 dark:text-gray-300 mb-1'>
          Primary Diagnosis
        </p>
        <p className='text-gray-900 dark:text-gray-100 font-medium text-lg'>
          {diagnosis}
        </p>
      </div>
    </div>
  );
};

export default PrescriptionHeader;

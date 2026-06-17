import React from 'react';
import { FiFileText } from 'react-icons/fi';
import { InfoCard } from './InfoCard';
import { InfoField } from './InfoField';
import { Insurance } from '@/types/patient';

interface InsuranceCardProps {
  insurance: Insurance;
  formatDate: (date?: string | Date) => string;
}

export const InsuranceCard: React.FC<InsuranceCardProps> = ({
  insurance,
  formatDate,
}) => {
  // Check if insurance is expired
  const isExpired =
    insurance.validUntil && new Date(insurance.validUntil) < new Date();

  return (
    <InfoCard title='Insurance' icon={<FiFileText className='w-5 h-5' />}>
      <div className='space-y-4'>
        {insurance.provider && (
          <InfoField
            label='Provider'
            value={insurance.provider}
            variant='primary'
          />
        )}

        {insurance.policyNumber && (
          <InfoField
            label='Policy Number'
            value={insurance.policyNumber}
            copyable
            tooltip='Click copy icon to copy policy number'
          />
        )}

        {insurance.groupNumber && (
          <InfoField
            label='Group Number'
            value={insurance.groupNumber}
            copyable
          />
        )}

        {insurance.validUntil && (
          <InfoField
            label='Valid Until'
            value={formatDate(insurance.validUntil)}
            variant={isExpired ? 'danger' : 'success'}
            tooltip={
              isExpired ? 'Insurance has expired' : 'Insurance is active'
            }
          />
        )}

        <div className='pt-3 mt-3 border-t border-gray-200'>
          <p className='text-xs text-gray-500'>
            For insurance verification, contact provider directly.
          </p>
        </div>
      </div>
    </InfoCard>
  );
};

export const InsuranceInfoField: React.FC<{
  label: string;
  value: string;
  isImportant?: boolean;
}> = ({ label, value, isImportant = false }) => (
  <InfoField
    label={label}
    value={value}
    variant={isImportant ? 'primary' : 'default'}
    copyable
    className={isImportant ? 'font-semibold' : ''}
  />
);

import React from 'react';
import { FiShield, FiPhone, FiMail } from 'react-icons/fi';
import { InfoCard } from './InfoCard';
import { EmergencyContact as EmergencyContactType } from '@/types/patient';

interface EmergencyContactProps {
  contact: EmergencyContactType;
}

export const EmergencyContactCard: React.FC<EmergencyContactProps> = ({
  contact,
}) => {
  return (
    <InfoCard title='Emergency Contact' icon={<FiShield className='w-5 h-5' />}>
      <div className='space-y-3'>
        <div>
          <label className='text-sm font-medium text-gray-500'>Name</label>
          <p className='text-gray-900'>{contact.name}</p>
        </div>
        <div>
          <label className='text-sm font-medium text-gray-500'>Phone</label>
          <p className='text-gray-900 flex items-center gap-2'>
            <FiPhone className='w-4 h-4 text-gray-400' />
            {contact.phone}
          </p>
        </div>
        <div>
          <label className='text-sm font-medium text-gray-500'>
            Relationship
          </label>
          <p className='text-gray-900'>{contact.relationship}</p>
        </div>
        {contact.email && (
          <div>
            <label className='text-sm font-medium text-gray-500'>Email</label>
            <p className='text-gray-900 flex items-center gap-2'>
              <FiMail className='w-4 h-4 text-gray-400' />
              {contact.email}
            </p>
          </div>
        )}
      </div>
    </InfoCard>
  );
};

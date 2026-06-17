'use client';

import React, { useState } from 'react';
import Card from '@/components/ui/Card';
import PrescriptionHeader from './PrescriptionHeader';
import PrescriptionMedications from './PrescriptionMedications';
import PrescriptionDates from './PrescriptionDates';
import PrescriptionActions from './PrescriptionActions';
import PrescriptionNotes from './PrescriptionNotes';
import { Prescription } from '@/types/Prescription';

interface PrescriptionCardProps {
  prescription: Prescription;
}

const PrescriptionCard: React.FC<PrescriptionCardProps> = ({
  prescription,
}) => {
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleDelete = async () => {
    try {
      setDeleteLoading(true);
      const response = await fetch(
        `/api/doctor/prescriptions/${prescription._id}`,
        { method: 'DELETE' }
      );

      if (!response.ok) throw new Error('Failed to delete');

      const result = await response.json();
      if (!result.success) throw new Error(result.message);

      window.location.reload();
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete prescription. Please try again.');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <Card
      hoverable
      elevated
      padding='lg'
      className='mb-4 hover:shadow-xl transition-shadow duration-300'
    >
      <div className='flex flex-col lg:flex-row gap-8'>
        {/* Left Section - Content */}
        <div className='flex-1'>
          <PrescriptionHeader
            patientName={`${prescription.patientId.firstName} ${prescription.patientId.lastName}`}
            patientEmail={prescription.patientId.email}
            status={prescription.status}
            diagnosis={prescription.diagnosis}
          />

          <PrescriptionMedications medications={prescription.medications} />

          <PrescriptionDates
            startDate={prescription.startDate}
            endDate={prescription.endDate}
            createdAt={prescription.createdAt}
          />

          <PrescriptionNotes notes={prescription.notes} />
        </div>

        {/* Right Section - Actions */}
        <div className='lg:w-80'>
          <div className='sticky top-6'>
            <div className='bg-linear-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl p-6 mb-6'>
              <h4 className='font-semibold text-gray-900 dark:text-gray-100 mb-4'>
                Prescription Actions
              </h4>
              <PrescriptionActions
                prescriptionId={prescription._id}
                onDelete={handleDelete}
                deleteLoading={deleteLoading}
              />
            </div>

            <div className='text-center text-sm text-gray-500 dark:text-gray-400'>
              <p>
                Prescription ID:{' '}
                <span className='font-mono'>{prescription._id.slice(-8)}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default PrescriptionCard;

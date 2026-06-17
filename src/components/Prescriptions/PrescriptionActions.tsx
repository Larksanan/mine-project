import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import { motion, AnimatePresence } from 'framer-motion';

interface PrescriptionActionsProps {
  prescriptionId: string;
  onDelete?: () => void;
  deleteLoading?: boolean;
}

const PrescriptionActions: React.FC<PrescriptionActionsProps> = ({
  prescriptionId,
  onDelete,
  deleteLoading = false,
}) => {
  const router = useRouter();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDeleteConfirm = async () => {
    if (onDelete) {
      await onDelete();
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className='space-y-4'>
      <div className='flex flex-col sm:flex-row gap-3'>
        <Button
          color='success'
          variant='outline'
          size='xs'
          icon={<Icon name='FiEye' />}
          onClick={() => router.push(`/doctor/prescriptions/${prescriptionId}`)}
          className='flex-1'
        >
          View Details
        </Button>

        <Button
          variant='solid'
          icon={<Icon name='FiEdit' />}
          onClick={() =>
            router.push(`/doctor/prescriptions/${prescriptionId}/edit`)
          }
          className='flex-1'
        >
          Edit Prescription
        </Button>
      </div>

      <AnimatePresence>
        {showDeleteConfirm ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className='bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4'
          >
            <div className='flex items-start gap-3 mb-3'>
              <Icon name='FiAlertTriangle' color='#dc2626' />
              <div>
                <p className='font-semibold text-red-800 dark:text-red-200'>
                  Confirm Deletion
                </p>
                <p className='text-sm text-red-600 dark:text-red-300 mt-1'>
                  Are you sure you want to delete this prescription? This action
                  cannot be undone.
                </p>
              </div>
            </div>

            <div className='flex gap-2'>
              <Button
                variant='ghost'
                onClick={() => setShowDeleteConfirm(false)}
                className='flex-1'
              >
                Cancel
              </Button>
              <Button
                color='danger'
                variant='solid'
                size='xs'
                loading={deleteLoading}
                onClick={handleDeleteConfirm}
                className='flex-1'
                icon={<Icon name='FiTrash2' />}
              >
                Delete Permanently
              </Button>
            </div>
          </motion.div>
        ) : (
          <Button
            variant='outline'
            icon={<Icon name='FiTrash2' />}
            onClick={() => setShowDeleteConfirm(true)}
            className='w-full'
          >
            Delete Prescription
          </Button>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PrescriptionActions;

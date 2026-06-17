import React, { useState } from 'react';
import {
  FiActivity,
  FiDroplet,
  FiTrendingUp,
  FiAlertTriangle,
  FiPlus,
  FiChevronDown,
  FiChevronUp,
  FiEdit,
} from 'react-icons/fi';
import { LiaPillsSolid } from 'react-icons/lia';
import { motion, AnimatePresence } from 'framer-motion';
import { InfoCard } from './InfoCard';
import { InfoField, InfoFieldGrid } from './InfoField';
import { PatientData } from '@/types/patient';

interface MedicalInfoCardProps {
  patient: PatientData;
  onEdit?: () => void;
  showEditButton?: boolean;
  expandedByDefault?: boolean;
}

export const MedicalInfoCard: React.FC<MedicalInfoCardProps> = ({
  patient,
  onEdit,
  showEditButton = true,
  expandedByDefault = true,
}) => {
  const [expanded, setExpanded] = useState(expandedByDefault);
  const [showAllAllergies, setShowAllAllergies] = useState(false);
  const [showAllMedications, setShowAllMedications] = useState(false);

  // Calculate BMI if height and weight are available
  const calculateBMI = () => {
    if (!patient.height || !patient.weight) return null;

    const heightInMeters = patient.height / 100;
    const bmi = patient.weight / (heightInMeters * heightInMeters);
    return bmi.toFixed(1);
  };

  // Get BMI category
  const getBMICategory = (bmi: number) => {
    if (bmi < 18.5)
      return { label: 'Underweight', color: 'text-blue-600', bg: 'bg-blue-50' };
    if (bmi < 25)
      return { label: 'Normal', color: 'text-green-600', bg: 'bg-green-50' };
    if (bmi < 30)
      return {
        label: 'Overweight',
        color: 'text-yellow-600',
        bg: 'bg-yellow-50',
      };
    return { label: 'Obese', color: 'text-red-600', bg: 'bg-red-50' };
  };

  const bmi = calculateBMI();
  const bmiCategory = bmi ? getBMICategory(parseFloat(bmi)) : null;

  // Limit displayed items
  const MAX_DISPLAY_ITEMS = 3;
  const displayedAllergies = showAllAllergies
    ? patient.allergies
    : patient.allergies?.slice(0, MAX_DISPLAY_ITEMS);
  const displayedMedications = showAllMedications
    ? patient.medications
    : patient.medications?.slice(0, MAX_DISPLAY_ITEMS);

  return (
    <InfoCard
      title='Medical Information'
      icon={<FiActivity className='w-5 h-5' />}
      className='relative'
    >
      {/* Edit Button */}
      {showEditButton && onEdit && (
        <button
          onClick={onEdit}
          className='absolute top-6 right-6 text-blue-600 hover:text-blue-800 transition-colors'
          title='Edit medical information'
        >
          <FiEdit className='w-4 h-4' />
        </button>
      )}

      {/* Expand/Collapse Button */}
      <button
        onClick={() => setExpanded(!expanded)}
        className='absolute top-6 right-14 text-gray-400 hover:text-gray-600 transition-colors'
        title={expanded ? 'Collapse' : 'Expand'}
      >
        {expanded ? (
          <FiChevronUp className='w-4 h-4' />
        ) : (
          <FiChevronDown className='w-4 h-4' />
        )}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className='space-y-6 overflow-hidden'
          >
            {/* Vital Statistics */}
            {(patient.bloodType || patient.height || patient.weight) && (
              <div className='space-y-4'>
                <h3 className='text-lg font-semibold text-gray-700'>
                  Vital Statistics
                </h3>
                <InfoFieldGrid columns={3}>
                  {patient.bloodType && (
                    <InfoField
                      label='Blood Type'
                      value={patient.bloodType}
                      icon={<FiDroplet />}
                      variant='danger'
                      className='font-semibold'
                    />
                  )}
                  {patient.height && (
                    <InfoField
                      label='Height'
                      value={`${patient.height} cm`}
                      icon={<FiTrendingUp />}
                    />
                  )}
                  {patient.weight && (
                    <InfoField
                      label='Weight'
                      value={`${patient.weight} kg`}
                      icon={<FiTrendingUp />}
                    />
                  )}
                </InfoFieldGrid>

                {/* BMI Display */}
                {bmi && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`inline-block px-4 py-2 rounded-lg ${bmiCategory?.bg}`}
                  >
                    <div className='flex items-center gap-2'>
                      <span className='font-medium text-gray-700'>BMI:</span>
                      <span
                        className={`text-xl font-bold ${bmiCategory?.color}`}
                      >
                        {bmi}
                      </span>
                      <span className={`text-sm ${bmiCategory?.color}`}>
                        ({bmiCategory?.label})
                      </span>
                    </div>
                  </motion.div>
                )}
              </div>
            )}

            {/* Allergies Section */}
            {patient.allergies && patient.allergies.length > 0 && (
              <div className='space-y-3'>
                <div className='flex items-center justify-between'>
                  <h3 className='text-lg font-semibold text-gray-700 flex items-center gap-2'>
                    <FiAlertTriangle className='text-red-500' />
                    Allergies
                  </h3>
                  {patient.allergies.length > MAX_DISPLAY_ITEMS && (
                    <button
                      onClick={() => setShowAllAllergies(!showAllAllergies)}
                      className='text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1'
                    >
                      {showAllAllergies
                        ? 'Show Less'
                        : `Show All (${patient.allergies.length})`}
                      {showAllAllergies ? <FiChevronUp /> : <FiChevronDown />}
                    </button>
                  )}
                </div>

                <AnimatePresence mode='wait'>
                  <motion.div
                    key={showAllAllergies ? 'all-allergies' : 'some-allergies'}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className='flex flex-wrap gap-2'
                  >
                    {displayedAllergies?.map((allergy, index) => (
                      <motion.span
                        key={allergy}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: index * 0.05 }}
                        className='px-3 py-1.5 bg-red-100 text-red-800 rounded-full text-sm font-medium flex items-center gap-2'
                      >
                        <FiAlertTriangle className='w-3 h-3' />
                        {allergy}
                      </motion.span>
                    ))}
                  </motion.div>
                </AnimatePresence>
              </div>
            )}

            {/* Medications Section */}
            {patient.medications && patient.medications.length > 0 && (
              <div className='space-y-3'>
                <div className='flex items-center justify-between'>
                  <h3 className='text-lg font-semibold text-gray-700 flex items-center gap-2'>
                    <LiaPillsSolid className='text-blue-500' />
                    Current Medications
                  </h3>
                  {patient.medications.length > MAX_DISPLAY_ITEMS && (
                    <button
                      onClick={() => setShowAllMedications(!showAllMedications)}
                      className='text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1'
                    >
                      {showAllMedications
                        ? 'Show Less'
                        : `Show All (${patient.medications.length})`}
                      {showAllMedications ? <FiChevronUp /> : <FiChevronDown />}
                    </button>
                  )}
                </div>

                <AnimatePresence mode='wait'>
                  <motion.div
                    key={
                      showAllMedications
                        ? 'all-medications'
                        : 'some-medications'
                    }
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className='space-y-2'
                  >
                    {displayedMedications?.map((medication, index) => (
                      <motion.div
                        key={medication}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className='flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100'
                      >
                        <div className='w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center'>
                          <LiaPillsSolid className='w-4 h-4 text-blue-600' />
                        </div>
                        <span className='text-gray-800'>{medication}</span>
                      </motion.div>
                    ))}
                  </motion.div>
                </AnimatePresence>
              </div>
            )}

            {/* Medical History */}
            {patient.medicalHistory && (
              <div className='space-y-3'>
                <h3 className='text-lg font-semibold text-gray-700'>
                  Medical History
                </h3>
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className='prose prose-sm max-w-none'
                >
                  <div className='p-4 bg-gray-50 rounded-lg border border-gray-200'>
                    <p className='text-gray-700 whitespace-pre-wrap leading-relaxed'>
                      {patient.medicalHistory}
                    </p>
                  </div>
                </motion.div>
              </div>
            )}

            {/* Empty State */}
            {!patient.bloodType &&
              !patient.height &&
              !patient.weight &&
              !patient.allergies?.length &&
              !patient.medications?.length &&
              !patient.medicalHistory && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className='text-center py-8'
                >
                  <FiActivity className='w-12 h-12 text-gray-300 mx-auto mb-3' />
                  <p className='text-gray-500'>
                    No medical information available
                  </p>
                  {showEditButton && onEdit && (
                    <button
                      onClick={onEdit}
                      className='mt-3 text-blue-600 hover:text-blue-800 flex items-center gap-2 mx-auto'
                    >
                      <FiPlus className='w-4 h-4' />
                      Add Medical Information
                    </button>
                  )}
                </motion.div>
              )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Collapsed Summary */}
      {!expanded && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className='flex items-center gap-4 text-sm text-gray-600'
        >
          <span>Medical Details</span>
          <div className='flex gap-2'>
            {patient.bloodType && (
              <span className='px-2 py-1 bg-red-100 text-red-800 rounded text-xs'>
                {patient.bloodType}
              </span>
            )}
            {patient.allergies && patient.allergies.length > 0 && (
              <span className='px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs'>
                {patient.allergies.length} allergies
              </span>
            )}
            {patient.medications && patient.medications.length > 0 && (
              <span className='px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs'>
                {patient.medications.length} medications
              </span>
            )}
          </div>
        </motion.div>
      )}
    </InfoCard>
  );
};

// Helper component for medical badges
interface MedicalBadgeProps {
  type: 'allergy' | 'medication' | 'condition';
  label: string;
  count?: number;
}

export const MedicalBadge: React.FC<MedicalBadgeProps> = ({
  type,
  label,
  count,
}) => {
  const getStyles = () => {
    switch (type) {
      case 'allergy':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medication':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'condition':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <span
      className={`px-3 py-1 rounded-full text-sm font-medium border ${getStyles()}`}
    >
      {label}
      {count !== undefined && (
        <span className='ml-1 text-xs opacity-75'>({count})</span>
      )}
    </span>
  );
};

// Quick Medical Summary Component
export const MedicalSummary: React.FC<{ patient: PatientData }> = ({
  patient,
}) => {
  const hasMedicalInfo =
    patient.bloodType ||
    patient.allergies?.length ||
    patient.medications?.length ||
    patient.medicalHistory;

  if (!hasMedicalInfo) return null;

  return (
    <div className='space-y-2'>
      <div className='flex items-center gap-2 text-sm text-gray-600'>
        <FiActivity className='w-4 h-4' />
        <span className='font-medium'>Medical Summary:</span>
      </div>
      <div className='flex flex-wrap gap-2'>
        {patient.bloodType && (
          <MedicalBadge
            type='condition'
            label={`Blood: ${patient.bloodType}`}
          />
        )}
        {patient.allergies?.length && (
          <MedicalBadge
            type='allergy'
            label='Allergies'
            count={patient.allergies.length}
          />
        )}
        {patient.medications?.length && (
          <MedicalBadge
            type='medication'
            label='Medications'
            count={patient.medications.length}
          />
        )}
      </div>
    </div>
  );
};

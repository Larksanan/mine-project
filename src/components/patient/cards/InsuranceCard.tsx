import React from 'react';
import { motion } from 'framer-motion';
import { FiCreditCard, FiEdit } from 'react-icons/fi';
import { Patient } from '@/types/patient';

interface InsuranceCardProps {
  patient: Patient;
}

const InsuranceCard: React.FC<InsuranceCardProps> = ({ patient }) => {
  if (!patient.insurance) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'
    >
      <div className='flex justify-between items-center mb-4'>
        <h2 className='text-xl font-semibold text-gray-900 flex items-center gap-2'>
          <FiCreditCard className='w-5 h-5 text-indigo-600' />
          Insurance Information
        </h2>
        <button className='text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1'>
          <FiEdit className='w-4 h-4' />
          Edit Insurance
        </button>
      </div>

      <div className='bg-linear-to-r from-indigo-50 to-blue-50 rounded-lg p-6 border border-indigo-200'>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <div className='space-y-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Insurance Provider
              </label>
              <div className='text-lg font-semibold text-gray-900'>
                {patient.insurance.provider}
              </div>
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Policy Number
              </label>
              <div className='font-mono text-gray-900 bg-white px-3 py-2 rounded border border-gray-300'>
                {patient.insurance.policyNumber}
              </div>
            </div>
          </div>

          <div className='space-y-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Group Number
              </label>
              <div className='font-mono text-gray-900 bg-white px-3 py-2 rounded border border-gray-300'>
                {patient.insurance.groupNumber}
              </div>
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Coverage Status
              </label>
              <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800'>
                Active
              </span>
            </div>
          </div>
        </div>

        {/* Insurance Card Preview */}
        <div className='mt-6 pt-6 border-t border-indigo-200'>
          <div className='bg-white rounded-lg p-4 border border-gray-300 shadow-sm'>
            <div className='flex justify-between items-start mb-4'>
              <div className='text-lg font-bold text-gray-900'>
                {patient.insurance.provider}
              </div>
              <div className='text-sm text-gray-500'>Health Insurance</div>
            </div>
            <div className='grid grid-cols-2 gap-4 text-sm'>
              <div>
                <div className='text-gray-500'>Member</div>
                <div className='font-medium text-gray-900'>
                  {patient.firstName} {patient.lastName}
                </div>
              </div>
              <div>
                <div className='text-gray-500'>Policy #</div>
                <div className='font-mono text-gray-900'>
                  {patient.insurance.policyNumber}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default InsuranceCard;

import React from 'react';
import { motion } from 'framer-motion';

const HelpTips: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className='bg-blue-50 border border-blue-200 rounded-xl p-6'
    >
      <h3 className='font-semibold text-blue-900 mb-3'>Quick Tips</h3>
      <ul className='space-y-2 text-sm text-blue-800'>
        <li className='flex items-start gap-2'>
          <span className='mt-0.5'>•</span>
          <span>Select a patient from your existing records</span>
        </li>
        <li className='flex items-start gap-2'>
          <span className='mt-0.5'>•</span>
          <span>Choose appropriate duration based on appointment type</span>
        </li>
        <li className='flex items-start gap-2'>
          <span className='mt-0.5'>•</span>
          <span>Mark as confirmed if the patient has already confirmed</span>
        </li>
        <li className='flex items-start gap-2'>
          <span className='mt-0.5'>•</span>
          <span>Provide clear reason for better patient preparation</span>
        </li>
        <li className='flex items-start gap-2'>
          <span className='mt-0.5'>•</span>
          <span>Include detailed diagnosis and prescription information</span>
        </li>
      </ul>
    </motion.div>
  );
};

export default HelpTips;

import React from 'react';
import { motion } from 'framer-motion';
import { FiFileText } from 'react-icons/fi';
import { AppointmentFormData } from '@/types/appointment';

interface MedicalInfoFormProps {
  formData: AppointmentFormData;
  formErrors: Record<string, string>;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
}

const MedicalInfoForm: React.FC<MedicalInfoFormProps> = ({
  formData,
  formErrors,
  onChange,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'
    >
      <h2 className='text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2'>
        <FiFileText className='w-5 h-5 text-purple-600' />
        Medical Information
      </h2>

      <div className='space-y-4'>
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-2'>
            Reason for Visit *
          </label>
          <textarea
            name='reason'
            value={formData.reason}
            onChange={onChange}
            required
            rows={3}
            placeholder='Describe the primary reason for this appointment...'
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              formErrors.reason ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {formErrors.reason && (
            <p className='mt-1 text-sm text-red-600'>{formErrors.reason}</p>
          )}
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-700 mb-2'>
            Symptoms (Optional)
          </label>
          <textarea
            name='symptoms'
            value={formData.symptoms}
            onChange={onChange}
            rows={3}
            placeholder='List any symptoms reported by the patient...'
            className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
          />
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-700 mb-2'>
            Diagnosis *
          </label>
          <textarea
            name='diagnosis'
            value={formData.diagnosis}
            onChange={onChange}
            required
            rows={3}
            placeholder='Enter preliminary diagnosis...'
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              formErrors.diagnosis ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {formErrors.diagnosis && (
            <p className='mt-1 text-sm text-red-600'>{formErrors.diagnosis}</p>
          )}
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-700 mb-2'>
            Prescription *
          </label>
          <textarea
            name='prescription'
            value={formData.prescription}
            onChange={onChange}
            required
            rows={3}
            placeholder='Enter prescribed medications or treatments...'
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              formErrors.prescription ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {formErrors.prescription && (
            <p className='mt-1 text-sm text-red-600'>
              {formErrors.prescription}
            </p>
          )}
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-700 mb-2'>
            Notes *
          </label>
          <textarea
            name='notes'
            value={formData.notes}
            onChange={onChange}
            required
            rows={3}
            placeholder='Additional notes or observations...'
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              formErrors.notes ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {formErrors.notes && (
            <p className='mt-1 text-sm text-red-600'>{formErrors.notes}</p>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default MedicalInfoForm;

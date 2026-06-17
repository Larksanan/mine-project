'use client';

import React from 'react';
import { FiArrowLeft, FiUserPlus, FiSave } from 'react-icons/fi';

interface NewPatientHeaderProps {
  onBack: () => void;
  title?: string;
  subtitle?: string;
  showSaveButton?: boolean;
  onSave?: () => void;
  saveDisabled?: boolean;
  saving?: boolean;
}

const NewPatientHeader: React.FC<NewPatientHeaderProps> = ({
  onBack,
  title = 'Register New Patient',
  subtitle = 'Fill in the patient details to create a new patient record',
  showSaveButton = false,
  onSave,
  saveDisabled = false,
  saving = false,
}) => {
  return (
    <div className='mb-8'>
      {/* Back Button */}
      <div className='mb-6'>
        <button
          onClick={onBack}
          className='inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors'
        >
          <FiArrowLeft className='w-4 h-4 mr-2' />
          Back to Patients List
        </button>
      </div>

      {/* Main Header */}
      <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
        <div>
          <div className='flex items-center gap-3'>
            <div className='p-2 bg-blue-100 rounded-lg'>
              <FiUserPlus className='w-6 h-6 text-blue-600' />
            </div>
            <div>
              <h1 className='text-2xl font-bold text-gray-900'>{title}</h1>
              <p className='text-gray-600 mt-1'>{subtitle}</p>
            </div>
          </div>

          {/* Progress Steps (Optional) */}
          <div className='mt-6 flex items-center space-x-4'>
            <div className='flex items-center'>
              <div className='w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-medium'>
                1
              </div>
              <span className='ml-2 text-sm font-medium text-gray-900'>
                Basic Info
              </span>
            </div>
            <div className='h-1 w-8 bg-gray-300'></div>
            <div className='flex items-center'>
              <div className='w-8 h-8 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center text-sm font-medium'>
                2
              </div>
              <span className='ml-2 text-sm font-medium text-gray-500'>
                Medical Details
              </span>
            </div>
            <div className='h-1 w-8 bg-gray-300'></div>
            <div className='flex items-center'>
              <div className='w-8 h-8 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center text-sm font-medium'>
                3
              </div>
              <span className='ml-2 text-sm font-medium text-gray-500'>
                Review & Save
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className='flex flex-col sm:flex-row gap-3'>
          {/* Save Button (if shown) */}
          {showSaveButton && onSave && (
            <button
              onClick={onSave}
              disabled={saveDisabled || saving}
              className={`inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                saveDisabled || saving
                  ? 'bg-blue-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {saving ? (
                <>
                  <svg
                    className='animate-spin -ml-1 mr-2 h-4 w-4 text-white'
                    xmlns='http://www.w3.org/2000/svg'
                    fill='none'
                    viewBox='0 0 24 24'
                  >
                    <circle
                      className='opacity-25'
                      cx='12'
                      cy='12'
                      r='10'
                      stroke='currentColor'
                      strokeWidth='4'
                    ></circle>
                    <path
                      className='opacity-75'
                      fill='currentColor'
                      d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                    ></path>
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  <FiSave className='w-4 h-4 mr-2' />
                  Save Patient
                </>
              )}
            </button>
          )}

          {/* Secondary Actions */}
          <div className='flex gap-2'>
            <button
              onClick={onBack}
              className='inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
            >
              Cancel
            </button>
            <button
              type='button'
              className='inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
            >
              <svg
                className='w-4 h-4 mr-2'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
                xmlns='http://www.w3.org/2000/svg'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth='2'
                  d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z'
                />
              </svg>
              Save Draft
            </button>
          </div>
        </div>
      </div>

      {/* Information Banner */}
      <div className='mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg'>
        <div className='flex'>
          <div className='shrink-0'>
            <svg
              className='h-5 w-5 text-blue-400'
              xmlns='http://www.w3.org/2000/svg'
              viewBox='0 0 20 20'
              fill='currentColor'
            >
              <path
                fillRule='evenodd'
                d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z'
                clipRule='evenodd'
              />
            </svg>
          </div>
          <div className='ml-3'>
            <h3 className='text-sm font-medium text-blue-800'>
              Important Information
            </h3>
            <div className='mt-2 text-sm text-blue-700'>
              <ul className='list-disc pl-5 space-y-1'>
                <li>Fill in all required fields marked with an asterisk (*)</li>
                <li>
                  Ensure accurate contact information for emergency situations
                </li>
                <li>Double-check insurance details for correct billing</li>
                <li>All information will be kept confidential and secure</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats (Optional) */}
      <div className='mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4'>
        <div className='bg-white border border-gray-200 rounded-lg p-4'>
          <div className='flex items-center'>
            <div className='shrink-0'>
              <div className='p-2 bg-green-100 rounded-md'>
                <svg
                  className='w-5 h-5 text-green-600'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                  xmlns='http://www.w3.org/2000/svg'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth='2'
                    d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
                  />
                </svg>
              </div>
            </div>
            <div className='ml-3'>
              <div className='text-sm font-medium text-gray-500'>
                Required Fields
              </div>
              <div className='text-lg font-semibold text-gray-900'>12/18</div>
            </div>
          </div>
        </div>

        <div className='bg-white border border-gray-200 rounded-lg p-4'>
          <div className='flex items-center'>
            <div className='shrink-0'>
              <div className='p-2 bg-blue-100 rounded-md'>
                <svg
                  className='w-5 h-5 text-blue-600'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                  xmlns='http://www.w3.org/2000/svg'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth='2'
                    d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
                  />
                </svg>
              </div>
            </div>
            <div className='ml-3'>
              <div className='text-sm font-medium text-gray-500'>
                Estimated Time
              </div>
              <div className='text-lg font-semibold text-gray-900'>5-7 min</div>
            </div>
          </div>
        </div>

        <div className='bg-white border border-gray-200 rounded-lg p-4'>
          <div className='flex items-center'>
            <div className='shrink-0'>
              <div className='p-2 bg-purple-100 rounded-md'>
                <svg
                  className='w-5 h-5 text-purple-600'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                  xmlns='http://www.w3.org/2000/svg'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth='2'
                    d='M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10'
                  />
                </svg>
              </div>
            </div>
            <div className='ml-3'>
              <div className='text-sm font-medium text-gray-500'>
                Last Created
              </div>
              <div className='text-lg font-semibold text-gray-900'>Today</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewPatientHeader;

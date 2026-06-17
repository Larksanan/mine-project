'use client';

import React, { useState } from 'react';
import {
  FiCreditCard,
  FiCalendar,
  FiInfo,
  FiShield,
  FiFileText,
  FiCheck,
  FiAlertCircle,
} from 'react-icons/fi';
import { IPatientFormData } from '@/types/patients';

interface InsuranceTabProps {
  formData: IPatientFormData;
  formErrors: Record<string, string>;
  onFormDataChange: (updates: Partial<IPatientFormData>) => void;
}

// Common Sri Lankan insurance providers
const sriLankanInsurers = [
  'Ceylinco Insurance',
  'Janashakthi Insurance',
  'Allianz Insurance Lanka',
  'Sri Lanka Insurance',
  'Union Assurance',
  'HNB Assurance',
  'AIA Insurance Lanka',
  'Softlogic Life Insurance',
  'Asian Alliance Insurance',
  'Co-operative Insurance',
  'LOLC Insurance',
  'Sanasa Insurance',
  'Arpico Insurance',
  'Singer Insurance',
  "People's Insurance",
  'Other Insurance Provider',
];

// Common Sri Lankan government schemes
const governmentSchemes = [
  'No Insurance',
  'Private Insurance',
  'Employee Health Scheme',
  'Social Security Board',
  'Samurdhi Health Scheme',
  'Public Service Health',
  'Tri-forces Insurance',
  'Police Health Scheme',
  'University Health Scheme',
  'Corporate Health Plan',
  'Other Government Scheme',
];

export default function InsuranceTab({
  formData,
  formErrors,
  onFormDataChange,
}: InsuranceTabProps) {
  const [showSriLankanInsurers, setShowSriLankanInsurers] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;

    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      onFormDataChange({
        [parent]: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ...(formData[parent as keyof IPatientFormData] as any),
          [child]: value,
        },
      });
    } else {
      onFormDataChange({ [name]: value });
    }
  };

  const calculateDaysUntilExpiry = () => {
    if (!formData.insurance?.validUntil) return null;
    const expiry = new Date(formData.insurance.validUntil);
    const now = new Date();
    const diffTime = expiry.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getExpiryStatus = () => {
    if (!formData.insurance?.validUntil) return null;
    const days = calculateDaysUntilExpiry();

    if (days === null) return null;
    if (days < 0)
      return {
        status: 'expired',
        color: 'red',
        message: 'Insurance has expired',
      };
    if (days < 30)
      return {
        status: 'expiring',
        color: 'orange',
        message: `Expires in ${days} days`,
      };
    if (days < 90)
      return {
        status: 'warning',
        color: 'yellow',
        message: `Expires in ${days} days`,
      };
    return {
      status: 'valid',
      color: 'green',
      message: `Valid for ${days} days`,
    };
  };

  const handleInsurerSelect = (insurer: string) => {
    onFormDataChange({
      insurance: {
        ...formData.insurance,
        provider: insurer,
      },
    });
    if (insurer === 'Other Insurance Provider') {
      setTimeout(() => {
        const input = document.querySelector(
          'input[name="insurance.provider"]'
        ) as HTMLInputElement;
        if (input) {
          input.focus();
          input.value = '';
        }
      }, 100);
    }
  };

  const handleSchemeSelect = (scheme: string) => {
    if (scheme === 'No Insurance') {
      onFormDataChange({
        insurance: {
          provider: 'No Insurance',
          policyNumber: '',
          groupNumber: '',
          validUntil: '',
          coverageDetails: '',
        },
      });
    } else if (scheme === 'Private Insurance') {
      onFormDataChange({
        insurance: {
          ...formData.insurance,
          provider: 'Private Insurance',
        },
      });
    } else if (scheme === 'Employee Health Scheme') {
      onFormDataChange({
        insurance: {
          ...formData.insurance,
          provider: 'Employee Health Scheme',
        },
      });
    } else {
      onFormDataChange({
        insurance: {
          ...formData.insurance,
          provider: scheme,
        },
      });
    }
  };

  return (
    <div className='space-y-6'>
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* Insurance Information */}
        <div className='space-y-4'>
          <h3 className='text-lg font-medium text-gray-900 flex items-center gap-2'>
            <FiShield size={20} />
            Insurance & Coverage
          </h3>

          {/* Insurance Type Selection */}
          <div className='mb-4'>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Select Insurance Type
            </label>
            <div className='grid grid-cols-2 gap-2'>
              {governmentSchemes.slice(0, 4).map(scheme => (
                <button
                  key={scheme}
                  type='button'
                  onClick={() => handleSchemeSelect(scheme)}
                  className={`px-3 py-2 text-sm border rounded-lg transition-colors ${
                    formData.insurance?.provider === scheme ||
                    (scheme === 'No Insurance' && !formData.insurance?.provider)
                      ? 'bg-blue-50 border-blue-300 text-blue-700'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {scheme}
                </button>
              ))}
            </div>
            <div className='mt-2 grid grid-cols-3 gap-2'>
              {governmentSchemes.slice(4).map(scheme => (
                <button
                  key={scheme}
                  type='button'
                  onClick={() => handleSchemeSelect(scheme)}
                  className={`px-2 py-1 text-xs border rounded transition-colors ${
                    formData.insurance?.provider === scheme
                      ? 'bg-blue-50 border-blue-300 text-blue-700'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {scheme}
                </button>
              ))}
            </div>
          </div>

          {/* Insurance Provider */}
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Insurance Provider
            </label>
            <div className='relative'>
              <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                <FiCreditCard size={16} className='text-gray-400' />
              </div>
              <input
                type='text'
                name='insurance.provider'
                value={formData.insurance?.provider}
                onChange={handleInputChange}
                className={`w-full pl-10 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  formErrors['insurance.provider']
                    ? 'border-red-500'
                    : 'border-gray-300'
                }`}
                placeholder='Enter insurance company name'
              />
            </div>
            {formErrors['insurance.provider'] && (
              <p className='mt-1 text-sm text-red-600'>
                {formErrors['insurance.provider']}
              </p>
            )}

            {/* Sri Lankan Insurers Quick Select */}
            <div className='mt-2'>
              <button
                type='button'
                onClick={() => setShowSriLankanInsurers(!showSriLankanInsurers)}
                className='text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1'
              >
                <FiInfo size={14} />
                {showSriLankanInsurers ? 'Hide' : 'Show'} common Sri Lankan
                insurers
              </button>

              {showSriLankanInsurers && (
                <div className='mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg'>
                  <p className='text-sm text-blue-700 mb-2'>
                    Select a common insurer:
                  </p>
                  <div className='flex flex-wrap gap-2'>
                    {sriLankanInsurers.map((insurer, index) => (
                      <button
                        key={index}
                        type='button'
                        onClick={() => handleInsurerSelect(insurer)}
                        className='px-3 py-1 text-xs bg-white border border-blue-300 text-blue-700 rounded-full hover:bg-blue-50 transition-colors'
                      >
                        {insurer}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Policy Number */}
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Policy Number
            </label>
            <input
              type='text'
              name='insurance.policyNumber'
              value={formData.insurance?.policyNumber}
              onChange={handleInputChange}
              disabled={formData.insurance?.provider === 'No Insurance'}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                formData.insurance?.provider === 'No Insurance'
                  ? 'bg-gray-100 cursor-not-allowed'
                  : ''
              } ${formErrors['insurance.policyNumber'] ? 'border-red-500' : 'border-gray-300'}`}
              placeholder='POL123456789'
              maxLength={50}
            />
            {formErrors['insurance.policyNumber'] && (
              <p className='mt-1 text-sm text-red-600'>
                {formErrors['insurance.policyNumber']}
              </p>
            )}
          </div>

          {/* Group Number */}
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Group/Employee Number
            </label>
            <input
              type='text'
              name='insurance.groupNumber'
              value={formData.insurance?.groupNumber}
              onChange={handleInputChange}
              disabled={formData.insurance?.provider === 'No Insurance'}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                formData.insurance?.provider === 'No Insurance'
                  ? 'bg-gray-100 cursor-not-allowed'
                  : ''
              } ${formErrors['insurance.groupNumber'] ? 'border-red-500' : 'border-gray-300'}`}
              placeholder='GRP987654321'
              maxLength={50}
            />
            {formErrors['insurance.groupNumber'] && (
              <p className='mt-1 text-sm text-red-600'>
                {formErrors['insurance.groupNumber']}
              </p>
            )}
          </div>

          {/* Valid Until */}
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Valid Until
            </label>
            <div className='relative'>
              <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                <FiCalendar size={16} className='text-gray-400' />
              </div>
              <input
                type='date'
                name='insurance.validUntil'
                value={formData.insurance?.validUntil}
                onChange={handleInputChange}
                disabled={formData.insurance?.provider === 'No Insurance'}
                min={new Date().toISOString().split('T')[0]}
                className={`w-full pl-10 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  formData.insurance?.provider === 'No Insurance'
                    ? 'bg-gray-100 cursor-not-allowed'
                    : ''
                } ${formErrors['insurance.validUntil'] ? 'border-red-500' : 'border-gray-300'}`}
              />
            </div>
            {formErrors['insurance.validUntil'] && (
              <p className='mt-1 text-sm text-red-600'>
                {formErrors['insurance.validUntil']}
              </p>
            )}
          </div>

          {/* Coverage Details */}
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Coverage Details (Optional)
            </label>
            <textarea
              name='insurance.coverageDetails'
              value={formData.insurance?.coverageDetails || ''}
              onChange={handleInputChange}
              rows={3}
              className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              placeholder='Enter any specific coverage details, limits, copayment information, etc.'
              maxLength={500}
            />
          </div>
        </div>

        {/* Insurance Summary & Information */}
        <div className='space-y-4'>
          {/* Summary Card */}
          <div
            className={`p-6 border rounded-lg ${
              formData.insurance?.provider === 'No Insurance'
                ? 'bg-gray-50 border-gray-300'
                : 'bg-blue-50 border-blue-200'
            }`}
          >
            <h4 className='font-medium flex items-center gap-2 mb-4'>
              <FiFileText size={18} />
              <span
                className={
                  formData.insurance?.provider === 'No Insurance'
                    ? 'text-gray-900'
                    : 'text-blue-900'
                }
              >
                Insurance Summary
              </span>
            </h4>

            <div className='space-y-3'>
              <div>
                <p className='text-sm font-medium text-gray-600'>Provider:</p>
                <p
                  className={`font-medium ${
                    formData.insurance?.provider === 'No Insurance'
                      ? 'text-gray-700'
                      : 'text-blue-900'
                  }`}
                >
                  {formData.insurance?.provider || 'Not specified'}
                </p>
              </div>

              {formData.insurance?.provider !== 'No Insurance' && (
                <>
                  <div>
                    <p className='text-sm font-medium text-gray-600'>
                      Policy Number:
                    </p>
                    <p className='text-blue-900'>
                      {formData.insurance?.policyNumber || 'Not specified'}
                    </p>
                  </div>

                  <div>
                    <p className='text-sm font-medium text-gray-600'>
                      Valid Until:
                    </p>
                    <p className='text-blue-900'>
                      {formData.insurance?.validUntil
                        ? new Date(
                            formData.insurance.validUntil
                          ).toLocaleDateString('en-GB')
                        : 'Not specified'}
                    </p>
                  </div>

                  {formData.insurance?.validUntil && (
                    <div className='mt-4 p-3 bg-white rounded border'>
                      <div className='flex items-center gap-2'>
                        {getExpiryStatus()?.status === 'valid' ? (
                          <FiCheck className='text-green-600' size={18} />
                        ) : (
                          <FiAlertCircle className='text-red-600' size={18} />
                        )}
                        <p
                          className={`text-sm font-medium ${
                            getExpiryStatus()?.status === 'valid'
                              ? 'text-green-700'
                              : 'text-red-700'
                          }`}
                        >
                          {getExpiryStatus()?.message}
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}

              {formData.insurance?.provider === 'No Insurance' && (
                <div className='mt-4 p-3 bg-gray-100 rounded border border-gray-300'>
                  <p className='text-sm text-gray-700'>
                    No insurance coverage selected. Patient will be marked as
                    self-paying.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Information Box */}
          <div className='p-4 bg-yellow-50 border border-yellow-200 rounded-lg'>
            <div className='flex items-start gap-2'>
              <FiInfo className='text-yellow-600 mt-0.5' size={18} />
              <div className='text-sm text-yellow-700'>
                <p className='font-medium mb-1'>
                  Important Insurance Information
                </p>
                <ul className='list-disc pl-5 space-y-1'>
                  <li>
                    Select &quot;No Insurance&quot; if patient is self-paying
                  </li>
                  <li>
                    Government schemes often have specific ID requirements
                  </li>
                  <li>Keep policy numbers and expiry dates updated</li>
                  <li>Verify coverage details with the insurance provider</li>
                  <li>Some treatments may require pre-authorization</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className='p-4 bg-gray-50 border border-gray-200 rounded-lg'>
            <h4 className='font-medium text-gray-900 mb-3'>Quick Actions</h4>
            <div className='space-y-2'>
              <button
                type='button'
                onClick={() => {
                  const oneYearFromNow = new Date();
                  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
                  onFormDataChange({
                    insurance: {
                      ...formData.insurance,
                      validUntil: oneYearFromNow.toISOString().split('T')[0],
                    },
                  });
                }}
                className='w-full px-3 py-2 text-sm bg-white border border-blue-300 text-blue-700 rounded hover:bg-blue-50 transition-colors'
              >
                Set Expiry to 1 Year from Now
              </button>

              <button
                type='button'
                onClick={() => {
                  onFormDataChange({
                    insurance: {
                      provider: 'No Insurance',
                      policyNumber: '',
                      groupNumber: '',
                      validUntil: '',
                      coverageDetails: '',
                    },
                  });
                }}
                className='w-full px-3 py-2 text-sm bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors'
              >
                Clear Insurance Information
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Insurance Notes */}
      <div className='p-4 bg-blue-50 border border-blue-200 rounded-lg'>
        <h4 className='text-sm font-medium text-blue-800 mb-2'>
          சுகாதார காப்பீட்டு தகவல் / Health Insurance Information
        </h4>
        <div className='text-sm text-blue-700 space-y-1'>
          <p>
            • உங்கள் காப்பீட்டு விவரங்களைத் துல்லியமாக உள்ளிடவும் / Enter your
            insurance details accurately
          </p>
          <p>
            • காலாவதி தேதிகள் புதுப்பிக்கப்பட்டதா என்பதைச் சரிபார்க்கவும் /
            Check if expiry dates are updated
          </p>
          <p>
            • அரசு திட்டங்களுக்கு கூடுதல் ஆவணங்கள் தேவைப்படலாம் / Government
            schemes may require additional documents
          </p>
          <p>
            • காப்பீடு இல்லையென்றால் &quot;No Insurance&quot; என்பதைத்
            தேர்ந்தெடுக்கவும் / Select &quot;No Insurance&quot; if uninsured
          </p>
        </div>
      </div>
    </div>
  );
}

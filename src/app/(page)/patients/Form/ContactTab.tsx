'use client';

import React from 'react';
import { FiHome, FiUserPlus, FiPhone, FiMail } from 'react-icons/fi';
import { IPatientFormData } from '@/types/patients';

interface ContactTabProps {
  formData: IPatientFormData;
  formErrors: Record<string, string>;
  onFormDataChange: (updates: Partial<IPatientFormData>) => void;
}

export default function ContactTab({
  formData,
  formErrors,
  onFormDataChange,
}: ContactTabProps) {
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

  // Extract nested errors
  const getNestedError = (path: string) => {
    return formErrors[path] || '';
  };

  // Sri Lankan districts in Tamil and English
  const sriLankanDistricts = [
    { en: 'Colombo', ta: 'கொழும்பு' },
    { en: 'Gampaha', ta: 'கம்பஹா' },
    { en: 'Kalutara', ta: 'களுத்தரை' },
    { en: 'Kandy', ta: 'கண்டி' },
    { en: 'Matale', ta: 'மாத்தளை' },
    { en: 'Nuwara Eliya', ta: 'நுவரெலியா' },
    { en: 'Galle', ta: 'காலி' },
    { en: 'Matara', ta: 'மாத்தறை' },
    { en: 'Hambantota', ta: 'அம்பாந்தோட்டை' },
    { en: 'Jaffna', ta: 'யாழ்ப்பாணம்' },
    { en: 'Kilinochchi', ta: 'கிளிநொச்சி' },
    { en: 'Mannar', ta: 'மன்னார்' },
    { en: 'Mullaitivu', ta: 'முல்லைத்தீவு' },
    { en: 'Vavuniya', ta: 'வவுனியா' },
    { en: 'Batticaloa', ta: 'மட்டக்களப்பு' },
    { en: 'Ampara', ta: 'அம்பாறை' },
    { en: 'Trincomalee', ta: 'திருகோணமலை' },
    { en: 'Kurunegala', ta: 'குருநாகல்' },
    { en: 'Puttalam', ta: 'புத்தளம்' },
    { en: 'Anuradhapura', ta: 'அனுராதபுரம்' },
    { en: 'Polonnaruwa', ta: 'போலன்னறுவை' },
    { en: 'Badulla', ta: 'பதுளை' },
    { en: 'Monaragala', ta: 'மொனராகலை' },
    { en: 'Ratnapura', ta: 'இரத்தினபுரி' },
    { en: 'Kegalle', ta: 'கேகாலை' },
  ];

  // Sri Lankan provinces in Tamil and English
  const sriLankanProvinces = [
    { en: 'Western Province', ta: 'மேல் மாகாணம்' },
    { en: 'Central Province', ta: 'மத்திய மாகாணம்' },
    { en: 'Southern Province', ta: 'தென் மாகாணம்' },
    { en: 'Northern Province', ta: 'வட மாகாணம்' },
    { en: 'Eastern Province', ta: 'கிழக்கு மாகாணம்' },
    { en: 'North Western Province', ta: 'வட மேல் மாகாணம்' },
    { en: 'North Central Province', ta: 'வட மத்திய மாகாணம்' },
    { en: 'Uva Province', ta: 'ஊவா மாகாணம்' },
    { en: 'Sabaragamuwa Province', ta: 'சபரகமுவா மாகாணம்' },
  ];

  // Relationship options in Tamil and English
  const relationships = [
    { en: 'Spouse', ta: 'துணைவர்/துணைவி' },
    { en: 'Parent', ta: 'பெற்றோர்' },
    { en: 'Child', ta: 'குழந்தை' },
    { en: 'Sibling', ta: 'சகோதரர்/சகோதரி' },
    { en: 'Friend', ta: 'நண்பர்' },
    { en: 'Relative', ta: 'உறவினர்' },
    { en: 'Guardian', ta: 'பாதுகாவலர்' },
    { en: 'Other', ta: 'பிற' },
  ];

  return (
    <div className='space-y-6'>
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* Address Section */}
        <div className='space-y-4'>
          <h3 className='text-lg font-medium text-gray-900 flex items-center gap-2'>
            <FiHome size={20} />
            Sri Lankan Address
          </h3>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Address Line 1 <span className='text-red-500'>*</span>
            </label>
            <input
              type='text'
              name='address.street'
              value={formData.address?.street}
              onChange={handleInputChange}
              required
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                getNestedError('address.street')
                  ? 'border-red-500'
                  : 'border-gray-300'
              }`}
              placeholder='வீட்டு எண், தெரு பெயர்'
              maxLength={100}
            />
            {getNestedError('address.street') && (
              <p className='mt-1 text-sm text-red-600'>
                {getNestedError('address.street')}
              </p>
            )}
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Address Line 2
            </label>
            <input
              type='text'
              name='address.addressLine2'
              value={formData.address?.addressLine2 || ''}
              onChange={handleInputChange}
              className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              placeholder='பகுதி, நகரம்'
              maxLength={100}
            />
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                District <span className='text-red-500'>*</span>
              </label>
              <select
                name='address.district'
                value={formData.address?.district || ''}
                onChange={handleInputChange}
                required
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  getNestedError('address.district')
                    ? 'border-red-500'
                    : 'border-gray-300'
                }`}
              >
                <option value=''>மாவட்டத்தைத் தேர்ந்தெடுக்கவும்</option>
                {sriLankanDistricts.map(district => (
                  <option key={district.en} value={district.en}>
                    {district.en} - {district.ta}
                  </option>
                ))}
              </select>
              {getNestedError('address.district') && (
                <p className='mt-1 text-sm text-red-600'>
                  {getNestedError('address.district')}
                </p>
              )}
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Province
              </label>
              <select
                name='address.province'
                value={formData.address?.province || ''}
                onChange={handleInputChange}
                className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              >
                <option value=''>மாகாணத்தைத் தேர்ந்தெடுக்கவும்</option>
                {sriLankanProvinces.map(province => (
                  <option key={province.en} value={province.en}>
                    {province.en} - {province.ta}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Postal Code
              </label>
              <input
                type='text'
                name='address.zipCode'
                value={formData.address?.zipCode}
                onChange={handleInputChange}
                className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                placeholder='00100'
                pattern='[0-9]{5}'
                maxLength={5}
              />
              <p className='mt-1 text-xs text-gray-500'>
                5-digit Sri Lankan postal code
              </p>
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Country
              </label>
              <input
                type='text'
                name='address.country'
                value='Sri Lanka'
                readOnly
                className='w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed'
              />
              <p className='mt-1 text-xs text-gray-500'>இலங்கை / இஸ்லாம்</p>
            </div>
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              City/Town
            </label>
            <input
              type='text'
              name='address.city'
              value={formData.address?.city || ''}
              onChange={handleInputChange}
              className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              placeholder='எ.கா., கொழும்பு, கண்டி, காலி'
              maxLength={50}
            />
          </div>
        </div>

        {/* Emergency Contact Section */}
        <div className='space-y-4'>
          <h3 className='text-lg font-medium text-gray-900 flex items-center gap-2'>
            <FiUserPlus size={20} />
            Emergency Contact
          </h3>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Full Name <span className='text-red-500'>*</span>
            </label>
            <input
              type='text'
              name='emergencyContact.name'
              value={formData.emergencyContact?.name}
              onChange={handleInputChange}
              required
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                getNestedError('emergencyContact.name')
                  ? 'border-red-500'
                  : 'border-gray-300'
              }`}
              placeholder='முழுப் பெயர் (தமிழ்/சிங்களம்)'
              maxLength={100}
            />
            {getNestedError('emergencyContact.name') && (
              <p className='mt-1 text-sm text-red-600'>
                {getNestedError('emergencyContact.name')}
              </p>
            )}
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Phone <span className='text-red-500'>*</span>
            </label>
            <div className='relative'>
              <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                <FiPhone size={16} className='text-gray-400' />
              </div>
              <input
                type='tel'
                name='emergencyContact.phone'
                value={formData.emergencyContact?.phone}
                onChange={handleInputChange}
                required
                className={`w-full pl-10 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  getNestedError('emergencyContact.phone')
                    ? 'border-red-500'
                    : 'border-gray-300'
                }`}
                placeholder='07X XXX XXXX'
                pattern='[0-9]{10}'
                maxLength={10}
              />
            </div>
            {getNestedError('emergencyContact.phone') && (
              <p className='mt-1 text-sm text-red-600'>
                {getNestedError('emergencyContact.phone')}
              </p>
            )}
            <p className='mt-1 text-xs text-gray-500'>
              10-digit Sri Lankan mobile number (07XXXXXXXX)
            </p>
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Email
            </label>
            <div className='relative'>
              <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                <FiMail size={16} className='text-gray-400' />
              </div>
              <input
                type='email'
                name='emergencyContact.email'
                value={formData.emergencyContact?.email}
                onChange={handleInputChange}
                className='w-full pl-10 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                placeholder='example@gmail.com'
                maxLength={100}
              />
            </div>
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Relationship <span className='text-red-500'>*</span>
            </label>
            <select
              name='emergencyContact.relationship'
              value={formData.emergencyContact?.relationship}
              onChange={handleInputChange}
              required
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                getNestedError('emergencyContact.relationship')
                  ? 'border-red-500'
                  : 'border-gray-300'
              }`}
            >
              <option value=''>உறவு முறையைத் தேர்ந்தெடுக்கவும்</option>
              {relationships.map(rel => (
                <option key={rel.en} value={rel.en}>
                  {rel.en} - {rel.ta}
                </option>
              ))}
            </select>
            {getNestedError('emergencyContact.relationship') && (
              <p className='mt-1 text-sm text-red-600'>
                {getNestedError('emergencyContact.relationship')}
              </p>
            )}
          </div>

          {/* Additional emergency contact */}
          <div className='mt-6 pt-4 border-t border-gray-200'>
            <h4 className='text-md font-medium text-gray-700 mb-3'>
              Additional Contact (Optional)
            </h4>
            <div className='space-y-3'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Additional Phone
                </label>
                <div className='relative'>
                  <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                    <FiPhone size={16} className='text-gray-400' />
                  </div>
                  <input
                    type='tel'
                    name='emergencyContact.additionalPhone'
                    value={formData.emergencyContact?.additionalPhone || ''}
                    onChange={handleInputChange}
                    className='w-full pl-10 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                    placeholder='07X XXX XXXX or Landline'
                    maxLength={15}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tamil Language Note */}
      <div className='mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg'>
        <h4 className='text-sm font-medium text-blue-800 mb-2'>
          முக்கிய தகவல் / Important Information:
        </h4>
        <div className='text-sm text-blue-700 space-y-1'>
          <p>
            • தமிழ் மொழியில் உள்ளீடு செய்யலாம் / You can input in Tamil language
          </p>
          <p>
            • தெரிவுகள் தமிழ் மற்றும் ஆங்கிலத்தில் காண்பிக்கப்படுகின்றன /
            Options are shown in Tamil and English
          </p>
          <p>• முகவரி தமிழில் உள்ளிடலாம் / Address can be entered in Tamil</p>
        </div>
      </div>
    </div>
  );
}

import React from 'react';

interface AvailabilitySectionProps {
  availability: {
    days: string[];
    startTime: string;
    endTime: string;
  };
  formErrors: Record<string, string>;
  daysOfWeek: string[];

  onAvailabilityChange: (
    field: 'days' | 'startTime' | 'endTime',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    value: any
  ) => void;
  onDayToggle: (day: string) => void;
}

const AvailabilitySection: React.FC<AvailabilitySectionProps> = ({
  availability,
  formErrors,
  daysOfWeek,
  onAvailabilityChange,
  onDayToggle,
}) => {
  return (
    <div className='space-y-6'>
      {/* Available Days */}
      <div>
        <label className='block text-sm font-medium text-gray-700 mb-3'>
          Available Days <span className='text-red-500'>*</span>
        </label>
        <div className='grid grid-cols-2 gap-3'>
          {daysOfWeek.map(day => (
            <label
              key={day}
              className='flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50'
            >
              <input
                type='checkbox'
                checked={availability.days.includes(day)}
                onChange={() => onDayToggle(day)}
                className='mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
              />
              <span className='text-sm font-medium text-gray-700'>{day}</span>
            </label>
          ))}
        </div>
        {formErrors.availabilityDays && (
          <p className='mt-2 text-sm text-red-600'>
            {formErrors.availabilityDays}
          </p>
        )}
      </div>

      {/* Start Time */}
      <div>
        <label className='block text-sm font-medium text-gray-700 mb-2'>
          Start Time <span className='text-red-500'>*</span>
        </label>
        <input
          type='time'
          value={availability.startTime}
          onChange={e => onAvailabilityChange('startTime', e.target.value)}
          className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
          required
        />
      </div>

      {/* End Time */}
      <div>
        <label className='block text-sm font-medium text-gray-700 mb-2'>
          End Time <span className='text-red-500'>*</span>
        </label>
        <input
          type='time'
          value={availability.endTime}
          onChange={e => onAvailabilityChange('endTime', e.target.value)}
          className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
          required
        />
      </div>
    </div>
  );
};

export default AvailabilitySection;

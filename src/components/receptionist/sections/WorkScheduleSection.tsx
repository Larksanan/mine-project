import React from 'react';
import { IWorkSchedule, ShiftType, SHIFT_TIMES } from '@/types/Receptionist';

interface WorkScheduleSectionProps {
  workSchedule: IWorkSchedule;
  shift: ShiftType;
  formErrors: Record<string, string>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onWorkScheduleChange: (day: string, field: string, value: any) => void;
}

const WorkScheduleSection: React.FC<WorkScheduleSectionProps> = ({
  workSchedule,
  shift,
  formErrors,
  onWorkScheduleChange,
}) => {
  const days = [
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday',
  ];

  const dayLabels: Record<string, string> = {
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday',
    sunday: 'Sunday',
  };

  const applyShiftTimes = () => {
    if (!shift) return;
    const times = SHIFT_TIMES[shift];
    days.forEach(day => {
      onWorkScheduleChange(day, 'start', times.start);
      onWorkScheduleChange(day, 'end', times.end);
    });
  };

  const toggleAllDays = (active: boolean) => {
    days.forEach(day => {
      onWorkScheduleChange(day, 'active', active);
    });
  };

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h3 className='text-lg font-medium text-gray-900'>Work Schedule</h3>
          <p className='text-sm text-gray-500 mt-1'>
            Configure working hours for each day of the week
          </p>
        </div>
        <div className='flex gap-2'>
          <button
            type='button'
            onClick={() => toggleAllDays(true)}
            className='px-3 py-1.5 text-xs bg-green-50 text-green-600 rounded-lg hover:bg-green-100'
          >
            Enable All
          </button>
          <button
            type='button'
            onClick={() => toggleAllDays(false)}
            className='px-3 py-1.5 text-xs bg-red-50 text-red-600 rounded-lg hover:bg-red-100'
          >
            Disable All
          </button>
          <button
            type='button'
            onClick={applyShiftTimes}
            className='px-3 py-1.5 text-xs bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100'
          >
            Apply Shift Times
          </button>
        </div>
      </div>

      {days.map(day => {
        const schedule = workSchedule[day as keyof IWorkSchedule];
        return (
          <div
            key={day}
            className={`border rounded-lg p-4 transition-colors ${
              schedule.active
                ? 'border-blue-200 bg-blue-50'
                : 'border-gray-200 bg-gray-50'
            }`}
          >
            <div className='flex items-center justify-between mb-3'>
              <label className='flex items-center cursor-pointer'>
                <input
                  type='checkbox'
                  checked={schedule.active}
                  onChange={e =>
                    onWorkScheduleChange(day, 'active', e.target.checked)
                  }
                  className='mr-3 h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
                />
                <span className='text-sm font-medium text-gray-900'>
                  {dayLabels[day]}
                </span>
              </label>
              {schedule.active && (
                <span className='text-xs text-blue-600 font-medium'>
                  Active
                </span>
              )}
            </div>

            {schedule.active && (
              <div className='grid grid-cols-2 gap-4 ml-8'>
                <div>
                  <label className='block text-xs font-medium text-gray-700 mb-1'>
                    Start Time
                  </label>
                  <input
                    type='time'
                    value={schedule.start}
                    onChange={e =>
                      onWorkScheduleChange(day, 'start', e.target.value)
                    }
                    className='w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                  />
                </div>
                <div>
                  <label className='block text-xs font-medium text-gray-700 mb-1'>
                    End Time
                  </label>
                  <input
                    type='time'
                    value={schedule.end}
                    onChange={e =>
                      onWorkScheduleChange(day, 'end', e.target.value)
                    }
                    className='w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                  />
                </div>
              </div>
            )}
          </div>
        );
      })}

      {formErrors.workSchedule && (
        <p className='text-sm text-red-600'>{formErrors.workSchedule}</p>
      )}
    </div>
  );
};

export default WorkScheduleSection;

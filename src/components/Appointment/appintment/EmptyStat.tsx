import React from 'react';
import { FiCalendar, FiSearch, FiPlus, FiUserPlus } from 'react-icons/fi';

interface EmptyStatProps {
  hasFilters: boolean;
  onNewAppointment: () => void;
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  // New props for profile handling
  hasProfile?: boolean;
  onCreateProfile?: () => void;
  profileActionLabel?: string;
}

const EmptyStat: React.FC<EmptyStatProps> = ({
  hasFilters,
  onNewAppointment,
  title,
  description,
  icon,
  actionLabel = 'New Appointment',
  hasProfile = true,
  onCreateProfile,
  profileActionLabel = 'Create Doctor Profile',
}) => {
  const getContent = () => {
    // If user doesn't have a profile
    if (!hasProfile) {
      return {
        title: 'Doctor Profile Required',
        description:
          'You need to create a doctor profile before you can view or create appointments.',
        icon: <FiUserPlus className='h-12 w-12 text-yellow-500' />,
        showAction: true,
        isProfileAction: true,
      };
    }

    // If user has profile but no appointments (with filters)
    if (hasFilters) {
      return {
        title: 'No appointments found',
        description:
          "Try adjusting your search or filters to find what you're looking for",
        icon: <FiSearch className='h-12 w-12 text-gray-400' />,
        showAction: false,
        isProfileAction: false,
      };
    }

    // Default: No appointments yet
    return {
      title: 'No appointments yet',
      description: 'Get started by scheduling your first appointment',
      icon: <FiCalendar className='h-12 w-12 text-gray-400' />,
      showAction: true,
      isProfileAction: false,
    };
  };

  const content = getContent();

  return (
    <div className='text-center py-12'>
      <div className='flex justify-center mb-4'>{icon || content.icon}</div>
      <h3 className='mt-2 text-xl font-semibold text-gray-900'>
        {title || content.title}
      </h3>
      <p className='mt-2 text-gray-600 max-w-md mx-auto'>
        {description || content.description}
      </p>
      {content.showAction && (
        <div className='mt-6 flex justify-center gap-3'>
          {content.isProfileAction && onCreateProfile ? (
            <button
              onClick={onCreateProfile}
              className='inline-flex items-center px-5 py-3 border border-transparent shadow-sm text-base font-medium rounded-lg text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors'
            >
              <FiUserPlus className='w-5 h-5 mr-2' />
              {profileActionLabel}
            </button>
          ) : (
            <button
              onClick={onNewAppointment}
              className='inline-flex items-center px-5 py-3 border border-transparent shadow-sm text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors'
            >
              <FiPlus className='w-5 h-5 mr-2' />
              {actionLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default EmptyStat;

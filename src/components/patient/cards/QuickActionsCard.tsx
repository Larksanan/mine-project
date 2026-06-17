// components/Patient/cards/QuickActionsCard.tsx
import React from 'react';
import {
  FiCalendar,
  FiEdit,
  FiRefreshCw,
  FiFileText,
  FiMessageCircle,
  FiPrinter,
  FiShare2,
  FiBell,
  FiPlus,
} from 'react-icons/fi';
import { Patient } from '@/types/patient';

interface QuickActionsCardProps {
  patient: Patient;
  onCreateAppointment: () => void;
  onEditPatient: () => void;
  onRefresh: () => void;
  onSendMessage?: () => void;
  onGenerateReport?: () => void;
  onPrint?: () => void;
  onShare?: () => void;
  onSetReminder?: () => void;
}

const QuickActionsCard: React.FC<QuickActionsCardProps> = ({
  patient,
  onCreateAppointment,
  onEditPatient,
  onRefresh,
  onSendMessage,
  onGenerateReport,
  onPrint,
  onShare,
  onSetReminder,
}) => {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const quickActions = [
    {
      id: 'appointment',
      label: 'New Appointment',
      icon: FiCalendar,
      onClick: onCreateAppointment,
      color: 'bg-blue-500 hover:bg-blue-600',
      description: 'Schedule a new appointment',
      shortcut: 'A',
    },
    {
      id: 'edit',
      label: 'Edit Patient',
      icon: FiEdit,
      onClick: onEditPatient,
      color: 'bg-green-500 hover:bg-green-600',
      description: 'Edit patient information',
      shortcut: 'E',
    },
    {
      id: 'refresh',
      label: 'Refresh',
      icon: FiRefreshCw,
      onClick: onRefresh,
      color: 'bg-gray-500 hover:bg-gray-600',
      description: 'Refresh patient data',
      shortcut: 'R',
    },
    {
      id: 'message',
      label: 'Send Message',
      icon: FiMessageCircle,
      onClick: onSendMessage,
      color: 'bg-purple-500 hover:bg-purple-600',
      description: 'Send message to patient',
      shortcut: 'M',
      disabled: !onSendMessage,
    },
    {
      id: 'report',
      label: 'Generate Report',
      icon: FiFileText,
      onClick: onGenerateReport,
      color: 'bg-orange-500 hover:bg-orange-600',
      description: 'Generate medical report',
      shortcut: 'G',
      disabled: !onGenerateReport,
    },
    {
      id: 'print',
      label: 'Print Summary',
      icon: FiPrinter,
      onClick: onPrint,
      color: 'bg-indigo-500 hover:bg-indigo-600',
      description: 'Print patient summary',
      shortcut: 'P',
      disabled: !onPrint,
    },
    {
      id: 'share',
      label: 'Share Record',
      icon: FiShare2,
      onClick: onShare,
      color: 'bg-teal-500 hover:bg-teal-600',
      description: 'Share patient record',
      shortcut: 'S',
      disabled: !onShare,
    },
    {
      id: 'reminder',
      label: 'Set Reminder',
      icon: FiBell,
      onClick: onSetReminder,
      color: 'bg-pink-500 hover:bg-pink-600',
      description: 'Set follow-up reminder',
      shortcut: 'F',
      disabled: !onSetReminder,
    },
  ];

  const primaryActions = quickActions.slice(0, 3);
  const secondaryActions = quickActions.slice(3);

  // Handle keyboard shortcuts
  React.useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) return; // Ignore Ctrl/Cmd combinations

      const action = quickActions.find(
        a => a.shortcut.toLowerCase() === event.key.toLowerCase() && !a.disabled
      );
      if (action && action.onClick) {
        event.preventDefault();
        action.onClick();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [quickActions]);

  return (
    <div className='bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden'>
      {/* Card Header */}
      <div className='bg-linear-to-r from-blue-600 to-blue-700 px-4 py-3'>
        <div className='flex items-center justify-between'>
          <h3 className='text-lg font-semibold text-white flex items-center gap-2'>
            <FiPlus className='w-5 h-5' />
            Quick Actions
          </h3>
          <div className='text-blue-100 text-sm'>Press keys for shortcuts</div>
        </div>
      </div>

      {/* Primary Actions */}
      <div className='p-4 border-b border-gray-100'>
        <div className='grid grid-cols-3 gap-3'>
          {primaryActions.map(action => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                onClick={action.onClick}
                className={`
                  flex flex-col items-center justify-center p-3 rounded-lg text-white transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                  ${action.color}
                  ${action.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'}
                `}
                title={action.description}
                disabled={action.disabled}
              >
                <Icon className='w-6 h-6 mb-1' />
                <span className='text-xs font-medium text-center leading-tight'>
                  {action.label}
                </span>
                <span className='text-xs opacity-80 mt-1 bg-white bg-opacity-20 px-1 rounded'>
                  {action.shortcut}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Secondary Actions */}
      <div className='p-4'>
        <h4 className='text-sm font-medium text-gray-700 mb-3 flex items-center gap-2'>
          More Actions
        </h4>
        <div className='grid grid-cols-2 gap-2'>
          {secondaryActions.map(action => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                onClick={action.onClick}
                disabled={action.disabled}
                className={`
                  flex items-center gap-2 p-2 rounded-md text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
                  ${
                    action.disabled
                      ? 'text-gray-400 cursor-not-allowed bg-gray-50'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }
                `}
                title={action.description}
              >
                <Icon
                  className={`w-4 h-4 ${action.disabled ? 'text-gray-400' : action.color.replace('bg-', 'text-').split(' ')[0]}`}
                />
                <span className='flex-1 text-left'>{action.label}</span>
                {!action.disabled && (
                  <span className='text-xs text-gray-400 bg-gray-100 px-1 rounded'>
                    {action.shortcut}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick Stats */}
      <div className='bg-gray-50 px-4 py-3 border-t border-gray-200'>
        <div className='flex items-center justify-between text-xs text-gray-600'>
          <div className='flex items-center gap-4'>
            <span>🔄 Last updated: Just now</span>
            <span>👤 Created by: {patient.createdBy?.name || 'System'}</span>
          </div>
          <button
            onClick={onRefresh}
            className='flex items-center gap-1 text-blue-600 hover:text-blue-700 transition-colors'
          >
            <FiRefreshCw className='w-3 h-3' />
            Refresh
          </button>
        </div>
      </div>

      {/* Keyboard Shortcuts Help */}
      <div className='bg-blue-50 px-4 py-2 border-t border-blue-200'>
        <details className='group'>
          <summary className='text-sm text-blue-700 cursor-pointer hover:text-blue-800 flex items-center justify-between'>
            <span>Keyboard Shortcuts</span>
            <span className='transform group-open:rotate-180 transition-transform'>
              ▼
            </span>
          </summary>
          <div className='mt-2 grid grid-cols-2 gap-1 text-xs text-blue-600'>
            {quickActions
              .filter(action => !action.disabled)
              .map(action => (
                <div
                  key={action.id}
                  className='flex items-center justify-between'
                >
                  <span>{action.label}:</span>
                  <kbd className='px-1 py-0.5 bg-white border border-blue-200 rounded text-blue-700 font-mono'>
                    {action.shortcut}
                  </kbd>
                </div>
              ))}
          </div>
        </details>
      </div>
    </div>
  );
};

export default QuickActionsCard;

import { FcHighPriority } from 'react-icons/fc';
import { FaCheckCircle } from 'react-icons/fa';

interface StatusMessageProps {
  type: 'error' | 'success';
  message: string;
}

export default function StatusMessage({ type, message }: StatusMessageProps) {
  const styles = {
    error: 'bg-red-50 border-red-200 text-red-800',
    success: 'bg-green-50 border-green-200 text-green-800',
  };

  const icons = {
    error: <FcHighPriority className='text-red-500 mt-0.5 shrink-0' />,
    success: <FaCheckCircle className='text-green-500 mt-0.5 shrink-0' />,
  };

  return (
    <div
      className={`rounded-lg p-4 border flex items-start space-x-3 ${styles[type]} ${type === 'error' ? 'animate-pulse' : ''}`}
    >
      {icons[type]}
      <p className='text-sm'>{message}</p>
    </div>
  );
}

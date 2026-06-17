import { FcUnlock, FcOk, FcKey } from 'react-icons/fc';
import { FaSpinner } from 'react-icons/fa';

interface SubmitButtonProps {
  loading: boolean;
  disabled: boolean;
  loadingText?: string;
  defaultText?: string;
  buttonType?: 'signin' | 'signup' | 'forgotPassword' | 'default';
  gradient?: string;
  // eslint-disable-next-line no-undef
  icon?: React.ReactNode;
}

export default function SubmitButton({
  loading,
  disabled,
  loadingText,
  defaultText,
  buttonType = 'default',
  gradient,
  icon,
}: SubmitButtonProps) {
  // Determine button text and icon based on type
  const getButtonContent = () => {
    if (loading) {
      const text =
        loadingText ||
        (buttonType === 'signup'
          ? 'Creating Account...'
          : buttonType === 'forgotPassword'
            ? 'Sending reset link...'
            : 'Signing in...');
      return {
        text,
        icon: <FaSpinner className='animate-spin -ml-1 mr-3 h-4 w-4' />,
      };
    } else {
      const text =
        defaultText ||
        (buttonType === 'signup'
          ? 'Create Account'
          : buttonType === 'forgotPassword'
            ? 'Send reset link'
            : 'Sign in');

      const getDefaultIcon = () => {
        switch (buttonType) {
          case 'signup':
            return <FcOk className='mr-2' />;
          case 'forgotPassword':
            return <FcKey className='mr-2' />;
          default:
            return <FcUnlock className='mr-2' />;
        }
      };

      return {
        text,
        icon: icon || getDefaultIcon(),
      };
    }
  };

  const { text, icon: displayIcon } = getButtonContent();

  // Determine gradient based on button type
  const getGradientClass = () => {
    if (gradient) return gradient;

    switch (buttonType) {
      case 'signup':
        return 'from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700';
      case 'forgotPassword':
        return 'from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700';
      case 'signin':
      default:
        return 'from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700';
    }
  };

  return (
    <button
      type='submit'
      disabled={disabled || loading}
      className={`w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-linear-to-r ${getGradientClass()} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] disabled:hover:scale-100`}
    >
      {displayIcon}
      {text}
    </button>
  );
}

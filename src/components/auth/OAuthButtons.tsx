import { FcGoogle } from 'react-icons/fc';
import { FaGithub } from 'react-icons/fa';

interface OAuthButtonsProps {
  onGoogleSignIn: () => void;
  onGithubSignIn: () => void;
  loading: boolean;
}

export default function OAuthButtons({
  onGoogleSignIn,
  onGithubSignIn,
  loading,
}: OAuthButtonsProps) {
  return (
    <div className='space-y-3'>
      <button
        onClick={onGoogleSignIn}
        disabled={loading}
        className='w-full flex items-center justify-center py-3 px-4 border border-gray-300 rounded-xl shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all duration-200'
      >
        <FcGoogle className='text-lg mr-3' />
        Continue with Google
      </button>

      <button
        onClick={onGithubSignIn}
        disabled={loading}
        className='w-full flex items-center justify-center py-3 px-4 border border-gray-300 rounded-xl shadow-sm text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 transition-all duration-200'
      >
        <FaGithub className='text-lg mr-3' />
        Continue with GitHub
      </button>
    </div>
  );
}

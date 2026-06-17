interface EmptyStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export default function EmptyState({
  title = 'Products',
  message = 'No products found.',
  onRetry,
}: EmptyStateProps) {
  return (
    <div className='text-center p-10'>
      <h1 className='font-bold text-5xl text-gray-800 mb-4'>{title}</h1>
      <p className='text-lg text-gray-500 mt-2'>{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className='mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg'
        >
          Try Again
        </button>
      )}
    </div>
  );
}

export default function LoadingSkeleton() {
  return (
    <div className='min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8'>
      <div className='max-w-md w-full'>
        <div className='animate-pulse mb-6'>
          <div className='h-4 w-20 bg-gray-300 rounded'></div>
        </div>
        <div className='bg-white rounded-2xl shadow-xl p-8 space-y-8 border border-gray-100'>
          <div className='text-center'>
            <div className='mx-auto h-16 w-16 bg-gray-300 rounded-full mb-4'></div>
            <div className='h-8 bg-gray-300 rounded w-3/4 mx-auto mb-2'></div>
            <div className='h-4 bg-gray-200 rounded w-1/2 mx-auto'></div>
          </div>
          <div className='space-y-3'>
            <div className='h-12 bg-gray-200 rounded-xl'></div>
            <div className='h-12 bg-gray-300 rounded-xl'></div>
          </div>
          <div className='space-y-4'>
            <div className='h-4 bg-gray-200 rounded'></div>
            <div className='h-12 bg-gray-200 rounded-xl'></div>
            <div className='h-12 bg-gray-200 rounded-xl'></div>
            <div className='h-12 bg-gray-300 rounded-xl'></div>
          </div>
        </div>
      </div>
    </div>
  );
}

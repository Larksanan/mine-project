import { BiStar } from 'react-icons/bi';

const ProductReviews = () => {
  return (
    <div className='mt-16 bg-white rounded-xl shadow-sm p-6 md:p-8'>
      <h2 className='text-2xl font-bold text-gray-900 mb-6'>
        Customer Reviews
      </h2>

      <div className='flex flex-col md:flex-row gap-8 mb-8'>
        <div className='md:w-1/3 text-center'>
          <div className='text-5xl font-bold text-gray-900 mb-2'>4.8</div>
          <div className='flex justify-center gap-1 text-yellow-500 mb-2'>
            {[...Array(5)].map((_, i) => (
              <BiStar key={i} size={20} className='fill-current' />
            ))}
          </div>
          <div className='text-gray-600 text-sm'>Based on 42 reviews</div>
        </div>

        <div className='md:w-2/3 space-y-3'>
          {[5, 4, 3, 2, 1].map(stars => (
            <div key={stars} className='flex items-center gap-3'>
              <div className='w-10 text-gray-900 font-medium'>{stars} star</div>
              <div className='flex-1 bg-gray-100 h-2 rounded-full overflow-hidden'>
                <div
                  className='bg-yellow-500 h-full'
                  style={{ width: `${(stars / 5) * 100}%` }}
                ></div>
              </div>
              <div className='w-10 text-gray-600 text-sm'>
                {((stars / 5) * 42).toFixed(0)}
              </div>
            </div>
          ))}
        </div>
      </div>

      <button className='px-6 py-3 border border-blue-600 text-blue-600 hover:bg-blue-50 rounded-md font-medium transition'>
        Write a Review
      </button>
    </div>
  );
};

export default ProductReviews;

'use client';

import {
  FiMapPin,
  FiClock,
  FiDollarSign,
  FiHeart,
  FiInfo,
  FiStar,
  FiCalendar,
  FiCheckCircle,
} from 'react-icons/fi';
import { motion } from 'framer-motion';
import { DoctorProfile } from '@/types/booking';
import { cardHoverVariants } from '@/animations/variants';

interface DoctorCardProps {
  doctor: DoctorProfile;
  onSelect: (doctor: DoctorProfile) => void;
  onToggleFavorite: (doctorId: string) => void;
  isFavorite: boolean;
}

export const DoctorCard = ({
  doctor,
  onSelect,
  onToggleFavorite,
  isFavorite,
}: DoctorCardProps) => {
  // Handle different data structures from API
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const doc = doctor as any;
  const ratingAverage =
    typeof doc.rating === 'number' ? doc.rating : doc.rating?.average || 0;
  const ratingCount =
    typeof doc.rating === 'number'
      ? doc.reviewsCount || 0
      : doc.rating?.count || 0;
  const hospitalName =
    doc.hospital || doc.hospitalAffiliation || 'General Hospital';
  const availabilityDays =
    doc.availableHours?.days ||
    (Array.isArray(doc.availability) ? doc.availability : []);

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <FiStar
        key={i}
        className={`w-4 h-4 shrink-0 ${
          i < Math.floor(rating)
            ? 'text-yellow-400 fill-yellow-400'
            : 'text-gray-300'
        }`}
      />
    ));
  };

  return (
    <motion.div
      variants={cardHoverVariants}
      whileHover='hover'
      initial='rest'
      animate='rest'
    >
      <div className='bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300'>
        {/* Doctor Image/Initial */}
        <div className='relative'>
          <div className='h-48 bg-linear-to-r from-blue-500 to-purple-500 relative overflow-hidden'>
            {doctor.image ? (
              <img
                src={doctor.image}
                alt={doctor.name}
                className='w-full h-full object-cover'
              />
            ) : (
              <div className='w-full h-full flex items-center justify-center text-white text-5xl font-bold'>
                {doctor.name.charAt(0)}
              </div>
            )}

            {/* Badges */}
            <div className='absolute top-4 left-4 flex gap-2'>
              {doc.isVerified && (
                <span className='px-3 py-1 bg-white text-blue-600 text-xs font-semibold rounded-full flex items-center gap-1'>
                  <FiCheckCircle className='w-3 h-3' />
                  Verified
                </span>
              )}
              <span className='px-3 py-1 bg-white text-gray-700 text-xs font-semibold rounded-full'>
                {doctor.experience}+ yrs
              </span>
            </div>

            {/* Favorite Button */}
            <button
              onClick={() => onToggleFavorite(doctor._id)}
              className='absolute top-4 right-4 p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors'
            >
              <FiHeart
                className={`w-5 h-5 ${
                  isFavorite ? 'text-red-500 fill-red-500' : 'text-gray-400'
                }`}
              />
            </button>
          </div>

          {/* Rating */}
          {ratingCount > 0 && (
            <div className='absolute -bottom-4 right-6 bg-white px-3 py-2 rounded-lg shadow-lg flex items-center gap-2'>
              <div className='flex'>{renderStars(ratingAverage)}</div>
              <span className='text-sm font-semibold text-gray-900'>
                {ratingAverage.toFixed(1)}
              </span>
            </div>
          )}
        </div>

        {/* Doctor Info */}
        <div className='p-6 pt-8'>
          <div className='mb-4'>
            <h3 className='text-xl font-bold text-gray-900 mb-1'>
              Dr. {doctor.name}
            </h3>
            <p className='text-blue-600 font-medium'>{doctor.specialization}</p>
            <p className='text-sm text-gray-500'>{doctor.department}</p>
          </div>

          {/* Details */}
          <div className='space-y-3 mb-6'>
            <div className='flex items-center gap-3 text-sm text-gray-600'>
              <FiMapPin className='w-4 h-4 shrink-0' />
              <span className='truncate'>{hospitalName}</span>
            </div>

            <div className='flex items-center gap-3 text-sm text-gray-600'>
              <FiClock className='w-4 h-4' />
              <span>
                {availabilityDays.length > 0
                  ? availabilityDays.slice(0, 3).join(', ')
                  : 'Not specified'}
                {availabilityDays.length > 3 && '...'}
              </span>
            </div>

            <div className='flex items-center gap-3 text-sm text-gray-600'>
              <FiDollarSign className='w-4 h-4' />
              <span className='font-semibold text-green-600'>
                LKR {doctor.consultationFee?.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Languages */}
          {doctor.languages.length > 0 && (
            <div className='mb-6'>
              <p className='text-xs font-medium text-gray-500 mb-2'>Speaks</p>
              <div className='flex flex-wrap gap-2'>
                {doctor.languages.slice(0, 3).map((lang, index) => (
                  <span
                    key={index}
                    className='px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded'
                  >
                    {lang}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className='flex gap-3'>
            <button
              onClick={() => onSelect(doctor)}
              className='flex-1 px-4 py-3 bg-linear-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 font-semibold'
            >
              <FiCalendar className='w-4 h-4' />
              Book Now
            </button>

            <button
              onClick={() => {
                /* Add view profile functionality */
              }}
              className='px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors'
            >
              <FiInfo className='w-4 h-4 text-gray-600' />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

/* eslint-disable no-undef */
import { FaArrowUp, FaArrowDown } from 'react-icons/fa';

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-lk', {
    style: 'currency',
    currency: 'LKR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatPercentage = (value: number): string => {
  return `${(value * 100).toFixed(1)}%`;
};

export const getGrowthIcon = (growth: number): React.ReactNode => {
  if (growth > 0) {
    return <FaArrowUp className='text-green-500' />;
  } else if (growth < 0) {
    return <FaArrowDown className='text-red-500' />;
  }
  return null;
};

export const getGrowthColor = (growth: number): string => {
  if (growth > 0) return 'text-green-600';
  if (growth < 0) return 'text-red-600';
  return 'text-gray-600';
};

export const generateRatingStars = (rating: number): React.ReactNode => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;

  return (
    <div className='flex items-center text-yellow-400'>
      {'★'.repeat(fullStars)}
      {hasHalfStar && '★'}
      {'☆'.repeat(5 - fullStars - (hasHalfStar ? 1 : 0))}
    </div>
  );
};

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

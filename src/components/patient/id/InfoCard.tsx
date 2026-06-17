import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cardVariants } from '@/animations/variants';

interface InfoCardProps {
  title: string;
  icon: ReactNode;
  children: ReactNode;
  className?: string;
}

export const InfoCard: React.FC<InfoCardProps> = ({
  title,
  icon,
  children,
  className = '',
}) => {
  return (
    <motion.div
      variants={cardVariants}
      initial='initial'
      animate='animate'
      whileHover='hover'
      className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}
    >
      <h2 className='text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2'>
        {icon}
        {title}
      </h2>
      {children}
    </motion.div>
  );
};

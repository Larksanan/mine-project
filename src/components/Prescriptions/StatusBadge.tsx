import React, { useState } from 'react';
import StatusBadge, {
  AnimatedStatusBadge,
  StatusBadgeWithPresence,
} from '@/components/status/StatusBadge';

const ExampleUsage = () => {
  const [isVisible, setIsVisible] = useState(true);

  return (
    <div className='space-y-6 p-6'>
      {/* Basic Usage */}
      <div className='flex gap-4 flex-wrap'>
        <StatusBadge status='ACTIVE' />
        <StatusBadge status='COMPLETED' />
        <StatusBadge status='PENDING' />
        <StatusBadge status='CANCELLED' />
      </div>

      {/* With Animations */}
      <div className='flex gap-4 flex-wrap'>
        <AnimatedStatusBadge status='ACTIVE' />
        <AnimatedStatusBadge status='IN_PROGRESS' />
        <AnimatedStatusBadge status='ON_HOLD' />
      </div>

      {/* Animated on Scroll */}
      <div className='h-screen flex items-center justify-center'>
        <StatusBadge
          status='APPROVED'
          animateOnScroll
          viewport={{ once: false }}
        />
      </div>

      {/* With AnimatePresence */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className='px-4 py-2 bg-blue-600 text-white rounded-lg'
      >
        Toggle Status
      </button>
      <StatusBadgeWithPresence
        isVisible={isVisible}
        status={isVisible ? 'ACTIVE' : 'INACTIVE'}
      />

      {/* Animated StatusBadge */}
      <AnimatedStatusBadge status='PROCESSING' />

      {/* Custom Styling */}
      <StatusBadge
        status='DRAFT'
        className='shadow-lg'
        onClick={() => console.log('Clicked')}
      />
    </div>
  );
};

export default ExampleUsage;

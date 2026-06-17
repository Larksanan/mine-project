'use client';

import { motion, useAnimation } from 'framer-motion';
import { useEffect } from 'react';
import Logo from '@/components/Logo.static';
import { initializeNotFoundEffects } from './notFoundEffects';
import Link from 'next/link';

export default function NotFound() {
  const ufoControls = useAnimation();
  const textControls = useAnimation();
  const beamControls = useAnimation();

  useEffect(() => {
    const cleanup = initializeNotFoundEffects();

    ufoControls.start({
      y: [0, -20, 0],
      transition: { duration: 6, repeat: Infinity, ease: 'easeInOut' },
    });

    textControls.start({
      opacity: 1,
      y: 0,
      transition: { duration: 1, delay: 0.5 },
    });

    beamControls.start({
      scaleY: [0.8, 1.1, 0.8],
      opacity: [0.3, 0.7, 0.3],
      transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
    });

    return cleanup;
  }, [ufoControls, textControls, beamControls]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <section className='bg-gray-900 min-h-screen flex items-center justify-center p-4 overflow-hidden'>
        {/* Stars Background */}
        <div id='stars' className='fixed inset-0'></div>

        {/* Main Content */}
        <div className='error-container relative z-10 text-center'>
          {/* UFO with Beam */}
          <motion.div className='relative mb-8' animate={ufoControls}>
            <svg className='w-32 h-32 mx-auto' viewBox='0 0 100 100'>
              {/* UFO Body */}
              <ellipse cx='50' cy='40' rx='30' ry='10' fill='#4F46E5' />
              <circle cx='50' cy='35' r='20' fill='#818CF8' />
              <ellipse cx='50' cy='30' rx='10' ry='5' fill='#C7D2FE' />
              {/* Beam */}
              <motion.path
                className='ufo-beam'
                d='M40 40 L30 80 L70 80 L60 40'
                fill='rgba(79, 70, 229, 0.2)'
                animate={beamControls}
              />
            </svg>
          </motion.div>

          {/* 404 Text */}
          <motion.h1
            className='text-8xl font-bold text-white mb-4'
            initial={{ opacity: 0, y: -50 }}
            animate={textControls}
          >
            4<span className='inline-block portal'>0</span>4
          </motion.h1>
          <motion.p
            className='text-xl text-blue-200 mb-8'
            initial={{ opacity: 0, y: -50 }}
            animate={textControls}
          >
            Oops! Looks like you&apos;ve wandered into space!
          </motion.p>

          {/* Interactive Elements */}
          <div className='space-y-4'>
            {/* Hidden Portfolio Link */}
            <motion.a
              href='mailto:jebarsanthatcroos@gmail.com'
              className='hidden-link text-blue-400 hover:text-blue-300 transition block'
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5, duration: 0.5 }}
            >
              ← Find your way back to safety
            </motion.a>

            {/* Astronaut */}
            <motion.div
              className='relative inline-block'
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1, duration: 0.5 }}
            >
              <Logo />
              <span className='absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full border-4 border-white'></span>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              className='flex justify-center space-x-4 mt-8'
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.5, duration: 0.5 }}
            >
              <Link
                href='/'
                className='px-6 py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transform hover:scale-105 transition'
              >
                Home
              </Link>
            </motion.div>
          </div>

          {/* Easter Egg Element */}
          <motion.div
            className='mt-8 text-gray-500 cursor-pointer hover:text-gray-400 transition'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2, duration: 0.5 }}
          >
            <p className='text-sm'>Press &apos;Space&apos; for a surprise!</p>
          </motion.div>
        </div>
      </section>
    </motion.div>
  );
}

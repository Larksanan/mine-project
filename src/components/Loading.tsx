'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCircle, FaAtom } from 'react-icons/fa';
import { GiSpinningBlades } from 'react-icons/gi';
import { IoPlanetOutline } from 'react-icons/io5';

type LoadingStyle = 'holographic' | 'particle' | 'orbital';

export default function Loading() {
  const [style, setStyle] = useState<LoadingStyle>('orbital');

  // Common animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
    exit: { opacity: 0 },
  };

  // Style-specific components
  const LoadingComponents = {
    holographic: (
      <div className='relative h-40 w-40'>
        <motion.div
          className='absolute inset-0 border-2 border-teal-400 rounded-full'
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.6, 1, 0.6],
            rotate: 360,
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
        <motion.div
          className='absolute inset-0 border-2 border-purple-400 rounded-full'
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.8, 0.5, 0.8],
            rotate: -360,
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
        <motion.div
          className='absolute inset-0 flex items-center justify-center'
          animate={{ rotate: 360 }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'linear',
          }}
        >
          <GiSpinningBlades className='text-4xl text-cyan-400' />
        </motion.div>
        <div className='absolute inset-0 bg-linear-to-br from-teal-400/10 to-purple-400/10 rounded-full blur-sm' />
      </div>
    ),

    particle: (
      <div className='relative h-40 w-40'>
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className='absolute text-pink-400'
            initial={{
              x: 0,
              y: 0,
              opacity: 0,
            }}
            animate={{
              x: [0, Math.cos(i * 30 * (Math.PI / 180)) * 60, 0],
              y: [0, Math.sin(i * 30 * (Math.PI / 180)) * 60, 0],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.1,
              ease: 'easeInOut',
            }}
          >
            <FaCircle className='w-3 h-3' />
          </motion.div>
        ))}
        <motion.div
          className='absolute inset-0 flex items-center justify-center'
          animate={{ scale: [1, 1.05, 1] }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <FaAtom className='text-5xl text-pink-500' />
        </motion.div>
      </div>
    ),

    orbital: (
      <div className='relative h-40 w-40'>
        <motion.div
          className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
          animate={{ rotate: 360 }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'linear',
          }}
        >
          <IoPlanetOutline className='text-3xl text-yellow-400' />
        </motion.div>
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className='absolute top-1/2 left-1/2 origin-center'
            animate={{
              rotate: 360,
              x: [-60 + i * 40, -60 + i * 40],
              y: [0, 0],
            }}
            transition={{
              duration: 4 + i * 2,
              repeat: Infinity,
              ease: 'linear',
            }}
          >
            <motion.div
              animate={{ scale: [1, 0.8, 1] }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.5,
              }}
            >
              <FaCircle
                className={`text-sm ${i === 0 ? 'text-blue-400' : i === 1 ? 'text-green-400' : 'text-red-400'}`}
              />
            </motion.div>
          </motion.div>
        ))}
        <div className='absolute inset-0 flex items-center justify-center'>
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <div className='w-6 h-6 bg-orange-400 rounded-full' />
          </motion.div>
        </div>
      </div>
    ),
  };

  return (
    <div className='flex flex-col items-center justify-center h-screen bg-linear-to-br from-gray-900 to-gray-800 text-white'>
      <AnimatePresence mode='wait'>
        <motion.div
          key={style}
          className='flex flex-col items-center'
          variants={containerVariants}
          initial='hidden'
          animate='visible'
          exit='exit'
        >
          {LoadingComponents[style]}

          <motion.p
            className='mt-8 text-xl font-light tracking-wider'
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            Loading System
          </motion.p>

          <motion.div
            className='mt-2 h-1 w-48 bg-gray-700 rounded-full overflow-hidden'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <motion.div
              className='h-full bg-linear-to-r from-cyan-400 to-blue-500'
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatType: 'reverse',
                ease: 'easeInOut',
              }}
            />
          </motion.div>
        </motion.div>
      </AnimatePresence>

      <div className='absolute bottom-8 flex space-x-4'>
        {(['holographic', 'particle', 'orbital'] as LoadingStyle[]).map(s => (
          <button
            key={s}
            onClick={() => setStyle(s)}
            className={`px-4 py-2 rounded-full text-xs font-medium transition-colors ${
              style === s
                ? 'bg-blue-500 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>
    </div>
  );
}

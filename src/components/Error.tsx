/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/purity */
import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaExclamationTriangle } from 'react-icons/fa';

interface ErrorProps {
  message: string;
  show?: boolean;
}

export default function Error({ message, show = true }: ErrorProps) {
  // Use `any` for the variants to avoid strict typing issues from the motion-dom d.ts
  const containerVariants: any = {
    hidden: {
      opacity: 0,
      y: -50,
      scale: 0.95,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.8,
        ease: 'easeInOut',
        when: 'beforeChildren',
        staggerChildren: 0.2,
      },
    },
    exit: {
      opacity: 0,
      y: 50,
      scale: 0.9,
      transition: {
        duration: 0.6,
        ease: 'easeInOut',
      },
    },
  };

  const iconVariants: any = {
    hidden: {
      scale: 0.5,
      rotate: -30,
    },
    visible: {
      scale: [1, 1.2, 1],
      rotate: [0, 10, -10, 0],
      transition: {
        duration: 1.2,
        ease: 'easeInOut',
        repeat: Infinity,
        repeatType: 'reverse' as const,
        repeatDelay: 2,
      },
    },
  };

  const textVariants: any = {
    hidden: {
      opacity: 0,
      y: 20,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: 'easeOut',
      },
    },
  };

  // Precompute particle positions so we don't call Math.random() during render
  const particles = useMemo(() => {
    return Array.from({ length: 8 }).map(() => ({
      initialX: Math.random() * 100 - 50,
      initialY: Math.random() * 100 - 50,
      animateX: Math.random() * 400 - 200,
      animateY: Math.random() * 400 - 200,
      duration: 3 + Math.random() * 4,
    }));
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className='flex flex-col items-center justify-center h-screen text-xl font-bold text-red-500 bg-linear-to-b from-red-50 to-white'
          variants={containerVariants}
          initial='hidden'
          animate='visible'
          exit='exit'
        >
          <motion.div variants={iconVariants} className='relative mb-6'>
            <FaExclamationTriangle className='text-6xl text-red-500' />
            {/* Glow effect */}
            <motion.div
              className='absolute inset-0 rounded-full bg-red-400 blur-xl opacity-0'
              animate={{
                opacity: [0, 0.3, 0],
                scale: [1, 1.5, 2],
              }}
              transition={{
                duration: 2,
                ease: 'easeInOut',
                repeat: Infinity,
                repeatDelay: 1,
              }}
            />
          </motion.div>

          <motion.div
            variants={textVariants}
            className='px-6 py-3 bg-white rounded-lg shadow-lg border border-red-200'
          >
            {message.split(' ').map((word, i) => (
              <motion.span
                key={i}
                className='inline-block'
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: 0.5 + i * 0.1,
                  type: 'spring',
                  stiffness: 300,
                  damping: 10,
                }}
              >
                {word}{' '}
              </motion.span>
            ))}
          </motion.div>

          {/* Floating particles */}
          {particles.map((p, i) => (
            <motion.div
              key={i}
              className='absolute w-2 h-2 rounded-full bg-red-300'
              initial={{
                x: p.initialX,
                y: p.initialY,
                opacity: 0,
              }}
              animate={{
                x: p.animateX,
                y: p.animateY,
                opacity: [0, 0.4, 0],
                scale: [0, 1, 0],
              }}
              transition={{
                duration: p.duration,
                repeat: Infinity,
                repeatType: 'reverse',
                delay: i * 0.3,
              }}
            />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

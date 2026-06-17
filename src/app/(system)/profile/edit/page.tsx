'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { UserRole } from '@/models/User';
import Logo from '@/components/Logo.static';
import { motion, AnimatePresence } from 'framer-motion';
import Loading from '@/components/ui/Loading';

import {
  FiUser,
  FiShield,
  FiActivity,
  FiHeart,
  FiClipboard,
  FiLoader,
} from 'react-icons/fi';
import {
  MdMedicalServices,
  MdScience,
  MdLocalPharmacy,
  MdAdminPanelSettings,
} from 'react-icons/md';

const roleConfig = {
  ADMIN: {
    icon: MdAdminPanelSettings,
    color: 'from-red-500 to-pink-600',
    name: 'Administrator',
    description: 'System administration dashboard',
  },
  DOCTOR: {
    icon: MdMedicalServices,
    color: 'from-blue-500 to-cyan-600',
    name: 'Doctor',
    description: 'Medical practitioner dashboard',
  },
  NURSE: {
    icon: FiHeart,
    color: 'from-green-500 to-emerald-600',
    name: 'Nurse',
    description: 'Nursing care dashboard',
  },
  RECEPTIONIST: {
    icon: FiClipboard,
    color: 'from-purple-500 to-violet-600',
    name: 'Receptionist',
    description: 'Front desk management',
  },
  LABTECH: {
    icon: MdScience,
    color: 'from-amber-500 to-orange-600',
    name: 'Lab Technician',
    description: 'Laboratory management',
  },
  PHARMACIST: {
    icon: MdLocalPharmacy,
    color: 'from-indigo-500 to-blue-600',
    name: 'Pharmacist',
    description: 'Pharmacy management',
  },
  STAFF: {
    icon: FiUser,
    color: 'from-gray-500 to-gray-700',
    name: 'Staff',
    description: 'Staff management portal',
  },
  PATIENT: {
    icon: FiUser,
    color: 'from-teal-500 to-green-600',
    name: 'Patient',
    description: 'Patient portal',
  },
  USER: {
    icon: FiUser,
    color: 'from-slate-500 to-gray-600',
    name: 'User',
    description: 'User dashboard',
  },
} as const;

// Predefined positions to avoid random values during hydration
const BACKGROUND_CIRCLES = [
  { left: '10%', top: '20%' },
  { left: '25%', top: '60%' },
  { left: '40%', top: '15%' },
  { left: '55%', top: '75%' },
  { left: '70%', top: '30%' },
  { left: '85%', top: '50%' },
  { left: '15%', top: '85%' },
  { left: '30%', top: '40%' },
  { left: '45%', top: '90%' },
  { left: '60%', top: '10%' },
  { left: '75%', top: '65%' },
  { left: '90%', top: '25%' },
  { left: '20%', top: '45%' },
  { left: '35%', top: '80%' },
  { left: '50%', top: '35%' },
  { left: '65%', top: '95%' },
  { left: '80%', top: '15%' },
  { left: '95%', top: '70%' },
  { left: '5%', top: '55%' },
  { left: '100%', top: '5%' },
];

export default function DashboardRouter() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [progress, setProgress] = useState(0);
  const [showWelcome, setShowWelcome] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    requestAnimationFrame(() => {
      setIsClient(true);
    });
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!mounted.current) return;

    if (status === 'loading') {
      const interval = setInterval(() => {
        if (mounted.current) {
          setProgress(prev => Math.min(prev + 10, 90));
        }
      }, 200);
      return () => clearInterval(interval);
    }

    if (!session) {
      router.push(
        `/auth/signin?callbackUrl=${encodeURIComponent('/profile/edit')}`
      );
      return;
    }

    const userRole = session.user?.role as UserRole;

    requestAnimationFrame(() => {
      if (mounted.current) setProgress(100);
    });

    requestAnimationFrame(() => {
      if (mounted.current) setShowWelcome(true);
    });

    const roleRoutes: Record<UserRole, string> = {
      ADMIN: '/profile/edit/admin',
      DOCTOR: '/profile/edit/doctor',
      NURSE: '/profile/edit/nurse',
      RECEPTIONIST: '/profile/edit/receptionist',
      LABTECH: '/profile/edit/lab',
      PHARMACIST: '/profile/edit/pharmacy',
      STAFF: '/profile/edit/staff',
      PATIENT: '/profile/edit/patient',
      USER: '/profile/edit/user',
    };

    const targetRoute = roleRoutes[userRole] || '/profile/edit/user';

    // Add a small delay for the animation to complete
    const timer = setTimeout(() => {
      if (mounted.current) {
        router.push(targetRoute);
      }
    }, 1800);

    return () => clearTimeout(timer);
  }, [session, status, router]);

  const userRole = session?.user?.role as UserRole;
  const roleInfo = userRole ? roleConfig[userRole] : null;

  // Don't render background animation on server
  if (!isClient) {
    return <Loading message='Loading your profile...' />;
  }

  return (
    <div className='min-h-screen bg-linear-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex flex-col items-center justify-center p-4 overflow-hidden'>
      <AnimatePresence mode='wait'>
        {showWelcome && roleInfo ? (
          <motion.div
            key='welcome'
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.2 }}
            transition={{ duration: 0.6, type: 'spring' }}
            className='text-center relative z-10'
          >
            <motion.div
              initial={{ rotate: 180, scale: 0 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{
                type: 'spring',
                stiffness: 200,
                damping: 15,
                delay: 0.2,
              }}
              className='mb-8'
            >
              <div
                className={`w-32 h-32 mx-auto rounded-full bg-linear-to-br ${roleInfo.color} flex items-center justify-center shadow-2xl shadow-black/20`}
              >
                <roleInfo.icon className='w-16 h-16 text-white' />
              </div>
            </motion.div>

            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className='text-4xl font-bold bg-linear-to-r bg-clip-text text-transparent from-gray-800 to-gray-600 dark:from-white dark:to-gray-300 mb-2'
            >
              Welcome Back!
            </motion.h1>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <p className='text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-1'>
                {roleInfo.name}
              </p>
              <p className='text-gray-600 dark:text-gray-400 mb-8'>
                {roleInfo.description}
              </p>

              <div className='flex items-center justify-center space-x-2 mb-6'>
                <FiLoader className='animate-spin text-gray-500' />
                <span className='text-gray-600 dark:text-gray-400'>
                  Preparing your profile...
                </span>
              </div>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key='loading'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className='w-full max-w-md relative z-10'
          >
            {/* Logo with Animation */}
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className='mb-12 text-center'
            >
              <div className='inline-block'>
                <Logo className='h-16 w-16 mx-auto mb-4' />
              </div>
              <h1 className='text-3xl font-bold bg-linear-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent'>
                MedCare Pro
              </h1>
            </motion.div>

            {/* Loading Card */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className='bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl p-8 shadow-2xl shadow-blue-500/10 border border-gray-200/50 dark:border-gray-700/50'
            >
              {/* Loading Indicator */}
              <div className='relative mb-8'>
                <div className='flex items-center justify-between mb-2'>
                  <span className='text-sm font-medium text-gray-600 dark:text-gray-400'>
                    Initializing Session
                  </span>
                  <span className='text-sm font-semibold text-blue-600 dark:text-blue-400'>
                    {progress}%
                  </span>
                </div>

                {/* Progress Bar Container */}
                <div className='h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden'>
                  <motion.div
                    className='h-full bg-linear-to-r from-blue-500 to-cyan-400 rounded-full'
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>

                {/* Pulsing Dot */}
                <motion.div
                  className='absolute -top-1 h-5 w-5 rounded-full bg-blue-500 shadow-lg'
                  style={{ left: `${progress}%` }}
                  initial={{ x: '-10px' }}
                  animate={{ x: 0 }}
                  transition={{
                    type: 'spring',
                    stiffness: 100,
                    damping: 15,
                  }}
                />
              </div>

              {/* User Info Section */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className='text-center space-y-6'
              >
                <div className='flex items-center justify-center space-x-3'>
                  <motion.div
                    animate={{
                      rotate: 360,
                      scale: [1, 1.1, 1],
                    }}
                    transition={{
                      rotate: { duration: 2, repeat: Infinity, ease: 'linear' },
                      scale: { duration: 1.5, repeat: Infinity },
                    }}
                    className='relative'
                  >
                    <div className='w-16 h-16 rounded-full bg-linear-to-br from-blue-400 to-cyan-300 flex items-center justify-center shadow-lg'>
                      <FiUser className='w-8 h-8 text-white' />
                    </div>
                    <motion.div
                      className='absolute inset-0 rounded-full border-2 border-blue-400 border-t-transparent'
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: 'linear',
                      }}
                    />
                  </motion.div>

                  <div className='text-left'>
                    <h3 className='font-semibold text-gray-800 dark:text-gray-200'>
                      {session?.user?.name || 'Loading User...'}
                    </h3>
                    <div className='flex items-center space-x-2 mt-1'>
                      <motion.div
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          roleInfo
                            ? `bg-linear-to-r ${roleInfo.color} text-white`
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                        }`}
                        animate={
                          roleInfo
                            ? {
                                scale: [1, 1.05, 1],
                                boxShadow: [
                                  '0 0 0 0 rgba(59, 130, 246, 0)',
                                  '0 0 0 10px rgba(59, 130, 246, 0)',
                                  '0 0 0 0 rgba(59, 130, 246, 0)',
                                ],
                              }
                            : {}
                        }
                        transition={{
                          scale: { duration: 2, repeat: Infinity },
                          boxShadow: { duration: 2, repeat: Infinity },
                        }}
                      >
                        {userRole || 'Loading...'}
                      </motion.div>
                    </div>
                  </div>
                </div>

                {/* Animated Dots */}
                <div className='flex justify-center space-x-2'>
                  {[0, 1, 2].map(i => (
                    <motion.div
                      key={i}
                      className='w-2 h-2 rounded-full bg-blue-500'
                      animate={{ y: [0, -8, 0] }}
                      transition={{
                        duration: 0.6,
                        repeat: Infinity,
                        delay: i * 0.2,
                      }}
                    />
                  ))}
                </div>

                {/* Status Indicators */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className='grid grid-cols-2 gap-4 text-sm'
                >
                  <div className='flex items-center justify-center space-x-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg'>
                    <FiShield className='text-green-500' />
                    <span className='text-gray-600 dark:text-gray-400'>
                      Security
                    </span>
                  </div>
                  <div className='flex items-center justify-center space-x-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg'>
                    <FiActivity className='text-blue-500' />
                    <span className='text-gray-600 dark:text-gray-400'>
                      Session
                    </span>
                  </div>
                </motion.div>
              </motion.div>
            </motion.div>

            {/* Footer Note */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className='mt-8 text-center'
            >
              <p className='text-gray-500 dark:text-gray-400 text-sm'>
                Securely redirecting to your personalized dashboard
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Background Animation - Only rendered on client side */}
      {isClient && (
        <div className='fixed inset-0 -z-10 overflow-hidden'>
          {BACKGROUND_CIRCLES.map((position, i) => (
            <motion.div
              key={i}
              className='absolute w-64 h-64 rounded-full bg-linear-to-br from-blue-500/5 to-cyan-500/5'
              style={{
                left: position.left,
                top: position.top,
              }}
              animate={{
                x: [0, Math.sin(i * 0.5) * 50, 0],
                y: [0, Math.cos(i * 0.5) * 50, 0],
                rotate: 360,
              }}
              transition={{
                duration: 20 + i * 2,
                repeat: Infinity,
                ease: 'linear',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

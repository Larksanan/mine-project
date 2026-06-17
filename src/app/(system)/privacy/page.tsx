'use client';

import { useState, useRef, useEffect } from 'react';

import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  AnimatePresence,
} from 'framer-motion';
import {
  MdSecurity,
  MdDataUsage,
  MdCookie,
  MdShare,
  MdPrivacyTip,
} from 'react-icons/md';
import {
  FaShieldAlt,
  FaUserLock,
  FaDatabase,
  FaRegHandshake,
  FaLock,
  FaUserShield,
} from 'react-icons/fa';
import { HiShieldCheck } from 'react-icons/hi';
import Logo from '@/components/Logo.static';
import Footer from '@/components/Footer';

export default function PrivacyPolicy() {
  const [activeSection, setActiveSection] = useState('introduction');
  const [, setIsScrolled] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  // Scroll animations
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  const { scrollY } = useScroll();
  const headerOpacity = useTransform(scrollY, [0, 100], [1, 0.9]);
  const headerScale = useTransform(scrollY, [0, 100], [1, 0.98]);
  const headerBlur = useTransform(
    scrollY,
    [0, 100],
    ['blur(0px)', 'blur(10px)']
  );

  // Smooth scroll progress
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  const progressWidth = useTransform(smoothProgress, [0, 1], ['0%', '100%']);

  useEffect(() => {
    const unsubscribe = scrollY.on('change', latest => {
      setIsScrolled(latest > 50);
    });
    return () => unsubscribe();
  }, [scrollY]);

  const sections = [
    {
      id: 'introduction',
      title: 'Introduction',
      icon: MdSecurity,
      color: 'from-green-500 to-emerald-600',
    },
    {
      id: 'data-collection',
      title: 'Data Collection',
      icon: FaDatabase,
      color: 'from-blue-500 to-cyan-600',
    },
    {
      id: 'data-usage',
      title: 'Data Usage',
      icon: MdDataUsage,
      color: 'from-purple-500 to-pink-600',
    },
    {
      id: 'data-sharing',
      title: 'Data Sharing',
      icon: MdShare,
      color: 'from-orange-500 to-red-600',
    },
    {
      id: 'cookies',
      title: 'Cookies',
      icon: MdCookie,
      color: 'from-yellow-500 to-amber-600',
    },
    {
      id: 'rights',
      title: 'Your Rights',
      icon: FaUserLock,
      color: 'from-red-500 to-rose-600',
    },
    {
      id: 'security',
      title: 'Security',
      icon: FaShieldAlt,
      color: 'from-gray-600 to-slate-700',
    },
  ];

  const floatingAnimation = {
    y: [-5, 5, -5],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: 'easeInOut' as const,
    },
  };

  const floatingAnimationReverse = {
    y: [5, -5, 5],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: 'easeInOut' as const,
    },
  };

  const floatingAnimationSlow = {
    y: [-3, 3, -3],
    transition: {
      duration: 5,
      repeat: Infinity,
      ease: 'easeInOut' as const,
    },
  };

  // Stagger children animation
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring' as const,
        stiffness: 300,
        damping: 24,
      },
    },
  };

  // Card hover variants
  const cardVariants = {
    initial: { scale: 1, y: 0 },
    hover: {
      scale: 1.02,
      y: -5,
      transition: {
        type: 'spring' as const,
        stiffness: 400,
        damping: 10,
      },
    },
  };

  // Section transition variants
  const sectionVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  };

  return (
    <>
      <div
        ref={containerRef}
        className='min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-emerald-50 relative overflow-hidden'
      >
        {/* Animated Background Elements */}
        <div className='absolute inset-0 overflow-hidden'>
          <motion.div
            animate={floatingAnimation}
            className='absolute top-20 left-10 w-20 h-20 bg-blue-200 rounded-full blur-xl opacity-30'
          />
          <motion.div
            animate={floatingAnimationReverse}
            className='absolute bottom-20 right-10 w-32 h-32 bg-green-200 rounded-full blur-xl opacity-30'
          />
          <motion.div
            animate={floatingAnimationSlow}
            className='absolute top-1/2 left-1/3 w-16 h-16 bg-purple-200 rounded-full blur-xl opacity-30'
          />
        </div>

        {/* Progress Bar */}
        <motion.div
          className='fixed top-0 left-0 w-full h-1 bg-linear-to-r from-blue-500 to-green-500 z-50'
          style={{ width: progressWidth }}
        />

        <div className='max-w-7xl mx-auto relative z-10'>
          {/* Enhanced Header */}
          <motion.div
            ref={headerRef}
            style={{
              opacity: headerOpacity,
              scale: headerScale,
              backdropFilter: headerBlur,
            }}
            className='text-center py-16 px-4'
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                type: 'spring' as const,
                stiffness: 200,
                damping: 20,
              }}
              className='flex justify-center mb-8'
            >
              <Logo />
            </motion.div>

            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <h1 className='text-5xl md:text-6xl font-bold bg-linear-to-r from-gray-900 via-blue-900 to-emerald-800 bg-clip-text text-transparent mb-6'>
                Privacy Policy
              </h1>
              <motion.p
                className='text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed'
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                Your privacy is our priority. Learn how we protect and handle
                your data with transparency and care.
              </motion.p>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className='mt-6 inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full border border-gray-200'
              >
                <div className='w-2 h-2 bg-green-500 rounded-full animate-pulse' />
                <span className='text-sm font-medium text-gray-600'>
                  Last updated:{' '}
                  {new Date().toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </motion.div>
            </motion.div>
          </motion.div>

          <div className='flex flex-col lg:flex-row gap-8 px-4 pb-16'>
            {/* Enhanced Sidebar Navigation */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className='lg:w-1/4'
            >
              <div className='bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-6 sticky top-8'>
                <motion.h3
                  className='font-bold text-gray-900 mb-6 flex items-center text-lg'
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <HiShieldCheck className='mr-3 text-2xl text-green-600' />
                  Policy Sections
                </motion.h3>

                <motion.nav
                  className='space-y-3'
                  variants={containerVariants}
                  initial='hidden'
                  animate='visible'
                >
                  {sections.map(section => {
                    const Icon = section.icon;
                    return (
                      <motion.button
                        key={section.id}
                        variants={itemVariants}
                        onClick={() => setActiveSection(section.id)}
                        className={`w-full text-left p-4 rounded-2xl transition-all duration-300 flex items-center group relative overflow-hidden ${
                          activeSection === section.id
                            ? `bg-linear-to-r ${section.color} text-white shadow-lg`
                            : 'text-gray-600 hover:bg-white hover:shadow-md border border-transparent hover:border-gray-200'
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {/* Animated background */}
                        <motion.div
                          className={`absolute inset-0 bg-linear-to-r ${section.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}
                          whileHover={{ opacity: 0.1 }}
                        />

                        <Icon
                          className={`mr-4 text-xl shrink-0 ${
                            activeSection === section.id
                              ? 'text-white'
                              : 'text-gray-500'
                          }`}
                        />

                        <span className='font-semibold text-sm'>
                          {section.title}
                        </span>

                        {/* Active indicator */}
                        {activeSection === section.id && (
                          <motion.div
                            className='ml-auto w-2 h-2 bg-white rounded-full'
                            layoutId='activeIndicator'
                            transition={{
                              type: 'spring' as const,
                              stiffness: 500,
                              damping: 30,
                            }}
                          />
                        )}
                      </motion.button>
                    );
                  })}
                </motion.nav>

                {/* Trust Badge */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className='mt-8 p-4 bg-linear-to-br from-green-50 to-emerald-100 rounded-2xl border border-green-200'
                >
                  <div className='flex items-center space-x-3'>
                    <FaLock className='text-green-600 text-lg' />
                    <div>
                      <p className='text-sm font-semibold text-green-900'>
                        Your Data is Safe
                      </p>
                      <p className='text-xs text-green-700'>
                        Enterprise-grade security
                      </p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>

            {/* Enhanced Main Content */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className='lg:w-3/4'
            >
              <div className='bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-8'>
                <AnimatePresence mode='wait'>
                  {/* Introduction */}
                  {activeSection === 'introduction' && (
                    <motion.section
                      key='introduction'
                      initial='initial'
                      animate='animate'
                      exit='exit'
                      variants={sectionVariants}
                      transition={{ duration: 0.3 }}
                      className='mb-12'
                    >
                      <motion.h2
                        className='text-3xl font-bold text-gray-900 mb-6 flex items-center'
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                      >
                        <div className='w-12 h-12 bg-linear-to-r from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mr-4'>
                          <MdSecurity className='text-2xl text-white' />
                        </div>
                        1. Introduction
                      </motion.h2>

                      <motion.div
                        className='space-y-6 text-gray-700 leading-relaxed'
                        variants={containerVariants}
                        initial='hidden'
                        animate='visible'
                      >
                        <motion.p variants={itemVariants}>
                          At{' '}
                          <strong className='text-gray-900'>
                            jebarsanthatcroos
                          </strong>
                          , we are committed to protecting your privacy and
                          ensuring the security of your personal information.
                          This Privacy Policy explains how we collect, use,
                          disclose, and safeguard your information when you use
                          our services.
                        </motion.p>

                        <motion.p variants={itemVariants}>
                          By using our services, you consent to the data
                          practices described in this policy. If you do not
                          agree with the terms, please do not access or use our
                          services.
                        </motion.p>

                        <motion.div
                          variants={itemVariants}
                          className='bg-linear-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6 mt-6'
                        >
                          <h3 className='font-bold text-green-900 mb-4 flex items-center text-lg'>
                            <FaRegHandshake className='mr-3 text-green-600 text-xl' />
                            Our Commitment to You
                          </h3>
                          <div className='grid md:grid-cols-2 gap-4'>
                            {[
                              'We only collect necessary information',
                              'We never sell your personal data',
                              'You have control over your information',
                              'We implement strong security measures',
                            ].map((item, index) => (
                              <motion.div
                                key={index}
                                className='flex items-center space-x-3'
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 + index * 0.1 }}
                              >
                                <div className='w-2 h-2 bg-green-500 rounded-full' />
                                <span className='text-green-800 text-sm'>
                                  {item}
                                </span>
                              </motion.div>
                            ))}
                          </div>
                        </motion.div>
                      </motion.div>
                    </motion.section>
                  )}

                  {/* Data Collection */}
                  {activeSection === 'data-collection' && (
                    <motion.section
                      key='data-collection'
                      initial='initial'
                      animate='animate'
                      exit='exit'
                      variants={sectionVariants}
                      transition={{ duration: 0.3 }}
                      className='mb-12'
                    >
                      <motion.h2
                        className='text-3xl font-bold text-gray-900 mb-6 flex items-center'
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                      >
                        <div className='w-12 h-12 bg-linear-to-r from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center mr-4'>
                          <FaDatabase className='text-2xl text-white' />
                        </div>
                        2. Information We Collect
                      </motion.h2>

                      <motion.div
                        className='space-y-8'
                        variants={containerVariants}
                        initial='hidden'
                        animate='visible'
                      >
                        <motion.div variants={itemVariants}>
                          <h3 className='text-xl font-semibold text-gray-900 mb-4 flex items-center'>
                            <FaUserShield className='mr-3 text-blue-600' />
                            Personal Information
                          </h3>
                          <p className='text-gray-700 mb-4'>
                            We collect information you provide directly to us:
                          </p>
                          <div className='grid md:grid-cols-2 gap-4'>
                            {[
                              'Account information (name, email, profile data)',
                              'Contact information when you communicate with us',
                              'Payment information (processed securely)',
                              'Content you create or share through our services',
                            ].map((item, index) => (
                              <motion.div
                                key={index}
                                variants={cardVariants}
                                initial='initial'
                                whileHover='hover'
                                className='bg-blue-50 p-4 rounded-xl border border-blue-200'
                              >
                                <p className='text-blue-900 text-sm'>{item}</p>
                              </motion.div>
                            ))}
                          </div>
                        </motion.div>

                        <motion.div variants={itemVariants}>
                          <h3 className='text-xl font-semibold text-gray-900 mb-4 flex items-center'>
                            <MdPrivacyTip className='mr-3 text-cyan-600' />
                            Automatically Collected Information
                          </h3>
                          <p className='text-gray-700 mb-4'>
                            When you use our services, we automatically collect:
                          </p>
                          <div className='grid md:grid-cols-2 gap-4'>
                            {[
                              'Device information (browser type, operating system)',
                              'Log data (IP address, access times, pages viewed)',
                              'Usage information and preferences',
                              'Cookies and similar tracking technologies',
                            ].map((item, index) => (
                              <motion.div
                                key={index}
                                variants={cardVariants}
                                initial='initial'
                                whileHover='hover'
                                className='bg-cyan-50 p-4 rounded-xl border border-cyan-200'
                              >
                                <p className='text-cyan-900 text-sm'>{item}</p>
                              </motion.div>
                            ))}
                          </div>
                        </motion.div>
                      </motion.div>
                    </motion.section>
                  )}

                  {/* Add other sections following the same pattern... */}
                </AnimatePresence>

                {/* Enhanced Contact Section */}
                <motion.section
                  className='mt-16 pt-8 border-t border-gray-200'
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  <div className='bg-linear-to-br from-slate-50 to-blue-50 rounded-2xl p-8 border border-gray-200'>
                    <h3 className='text-2xl font-bold text-gray-900 mb-4'>
                      Contact Us
                    </h3>
                    <p className='text-gray-700 mb-6'>
                      If you have any questions about this Privacy Policy or our
                      data practices, please contact us:
                    </p>
                    <div className='flex items-center space-x-4'>
                      <div className='w-12 h-12 bg-linear-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center'>
                        <MdSecurity className='text-2xl text-white' />
                      </div>
                      <div>
                        <p className='font-semibold text-gray-900'>
                          Email: jebarsanthatcroos@gmail.com
                        </p>
                        <p className='text-sm text-gray-600 mt-1'>
                          We typically respond within 24 hours
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.section>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

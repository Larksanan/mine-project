'use client';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  AnimatePresence,
} from 'framer-motion';
import {
  MdDescription,
  MdGavel,
  MdAccountCircle,
  MdWarning,
  MdCheckCircle,
  MdSecurity,
  MdPolicy,
} from 'react-icons/md';
import {
  FaFileContract,
  FaShieldAlt,
  FaHandshake,
  FaUserCheck,
} from 'react-icons/fa';
import { HiDocumentText, HiScale } from 'react-icons/hi';
import Logo from '@/components/Logo.static';
import Footer from '@/components/Footer';

export default function TermsOfService() {
  const [activeSection, setActiveSection] = useState('introduction');
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

  // Smooth scroll progress
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  const progressWidth = useTransform(smoothProgress, [0, 1], ['0%', '100%']);

  const sections = [
    {
      id: 'introduction',
      title: 'Introduction',
      icon: MdDescription,
      color: 'from-blue-500 to-cyan-600',
    },
    {
      id: 'accounts',
      title: 'User Accounts',
      icon: FaUserCheck,
      color: 'from-green-500 to-emerald-600',
    },
    {
      id: 'content',
      title: 'Content & Conduct',
      icon: MdGavel,
      color: 'from-red-500 to-pink-600',
    },
    {
      id: 'privacy',
      title: 'Privacy & Data',
      icon: FaShieldAlt,
      color: 'from-purple-500 to-indigo-600',
    },
    {
      id: 'termination',
      title: 'Termination',
      icon: MdWarning,
      color: 'from-orange-500 to-amber-600',
    },
    {
      id: 'liability',
      title: 'Liability',
      icon: HiScale,
      color: 'from-gray-600 to-slate-700',
    },
  ];

  // Floating animation variants
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

  // Animation variants
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

  const sectionVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  };

  return (
    <>
      <div
        ref={containerRef}
        className='min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-cyan-50 relative overflow-hidden'
      >
        {/* Animated Background Elements */}
        <div className='absolute inset-0 overflow-hidden'>
          <motion.div
            animate={floatingAnimation}
            className='absolute top-20 left-10 w-20 h-20 bg-blue-200 rounded-full blur-xl opacity-30'
          />
          <motion.div
            animate={floatingAnimationReverse}
            className='absolute bottom-20 right-10 w-32 h-32 bg-cyan-200 rounded-full blur-xl opacity-30'
          />
          <motion.div
            animate={floatingAnimation}
            className='absolute top-1/3 right-20 w-16 h-16 bg-indigo-200 rounded-full blur-xl opacity-30'
          />
        </div>

        {/* Progress Bar */}
        <motion.div
          className='fixed top-0 left-0 w-full h-1 bg-linear-to-r from-blue-500 to-cyan-500 z-50'
          style={{ width: progressWidth }}
        />

        <div className='max-w-7xl mx-auto relative z-10'>
          {/* Enhanced Header */}
          <motion.div
            ref={headerRef}
            style={{
              opacity: headerOpacity,
              scale: headerScale,
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
              <h1 className='text-5xl md:text-6xl font-bold bg-linear-to-r from-gray-900 via-blue-900 to-cyan-800 bg-clip-text text-transparent mb-6'>
                Terms of Service
              </h1>
              <motion.p
                className='text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed'
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                Understand your rights and responsibilities when using our
                services. We believe in transparency and fair terms for
                everyone.
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
                  <HiDocumentText className='mr-3 text-2xl text-blue-600' />
                  Table of Contents
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

                {/* Quick Actions */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className='mt-8 space-y-3'
                >
                  <Link
                    href='/privacy'
                    className='flex items-center space-x-3 p-3 bg-linear-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-200 hover:shadow-md transition-all duration-200 group'
                  >
                    <MdPolicy className='text-purple-600 text-lg' />
                    <div>
                      <p className='text-sm font-semibold text-purple-900'>
                        Privacy Policy
                      </p>
                      <p className='text-xs text-purple-700'>
                        How we protect your data
                      </p>
                    </div>
                  </Link>

                  <div className='flex items-center space-x-3 p-3 bg-linear-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200'>
                    <FaHandshake className='text-green-600 text-lg' />
                    <div>
                      <p className='text-sm font-semibold text-green-900'>
                        Fair Terms
                      </p>
                      <p className='text-xs text-green-700'>
                        Transparent and reasonable
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
                        <div className='w-12 h-12 bg-linear-to-r from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center mr-4'>
                          <MdDescription className='text-2xl text-white' />
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
                          Welcome to{' '}
                          <strong className='text-gray-900'>
                            jebarsanthatcroos
                          </strong>{' '}
                          (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;).
                          These Terms of Service govern your use of our website,
                          applications, and services.
                        </motion.p>

                        <motion.p variants={itemVariants}>
                          By accessing or using our services, you agree to be
                          bound by these Terms and our Privacy Policy. If you
                          disagree with any part of these terms, you may not
                          access our services.
                        </motion.p>

                        <motion.div
                          variants={itemVariants}
                          className='bg-linear-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-2xl p-6 mt-6'
                        >
                          <h3 className='font-bold text-blue-900 mb-4 flex items-center text-lg'>
                            <MdCheckCircle className='mr-3 text-blue-600 text-xl' />
                            Key Points to Remember
                          </h3>
                          <div className='grid md:grid-cols-2 gap-4'>
                            {[
                              'You must be at least 13 years old to use our services',
                              'You are responsible for maintaining account security',
                              'We may update these terms with proper notice',
                              'You retain all rights to your content',
                            ].map((item, index) => (
                              <motion.div
                                key={index}
                                className='flex items-center space-x-3'
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 + index * 0.1 }}
                              >
                                <div className='w-2 h-2 bg-blue-500 rounded-full' />
                                <span className='text-blue-800 text-sm'>
                                  {item}
                                </span>
                              </motion.div>
                            ))}
                          </div>
                        </motion.div>
                      </motion.div>
                    </motion.section>
                  )}

                  {/* User Accounts */}
                  {activeSection === 'accounts' && (
                    <motion.section
                      key='accounts'
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
                          <FaUserCheck className='text-2xl text-white' />
                        </div>
                        2. User Accounts
                      </motion.h2>

                      <motion.div
                        className='space-y-8'
                        variants={containerVariants}
                        initial='hidden'
                        animate='visible'
                      >
                        <motion.div variants={itemVariants}>
                          <h3 className='text-xl font-semibold text-gray-900 mb-4 flex items-center'>
                            <MdAccountCircle className='mr-3 text-green-600' />
                            Account Creation
                          </h3>
                          <p className='text-gray-700 mb-4'>
                            To access certain features, you must create an
                            account. You agree to provide accurate and complete
                            information during registration and keep it updated.
                          </p>
                          <div className='grid md:grid-cols-2 gap-4'>
                            {[
                              'Use real, verifiable information',
                              'One account per individual',
                              'Keep contact information current',
                              'No impersonation allowed',
                            ].map((item, index) => (
                              <motion.div
                                key={index}
                                variants={cardVariants}
                                initial='initial'
                                whileHover='hover'
                                className='bg-green-50 p-4 rounded-xl border border-green-200'
                              >
                                <p className='text-green-900 text-sm'>{item}</p>
                              </motion.div>
                            ))}
                          </div>
                        </motion.div>

                        <motion.div variants={itemVariants}>
                          <h3 className='text-xl font-semibold text-gray-900 mb-4 flex items-center'>
                            <MdSecurity className='mr-3 text-emerald-600' />
                            Account Security
                          </h3>
                          <p className='text-gray-700 mb-4'>
                            You are responsible for maintaining the
                            confidentiality of your account credentials and for
                            all activities that occur under your account.
                          </p>
                          <div className='bg-amber-50 border border-amber-200 rounded-xl p-4'>
                            <p className='text-amber-800 text-sm font-medium'>
                              💡 <strong>Important:</strong> Notify us
                              immediately of any unauthorized use or security
                              breaches at jebarsanthatcroos@gmail.com
                            </p>
                          </div>
                        </motion.div>
                      </motion.div>
                    </motion.section>
                  )}

                  {/* Content & Conduct */}
                  {activeSection === 'content' && (
                    <motion.section
                      key='content'
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
                        <div className='w-12 h-12 bg-linear-to-r from-red-500 to-pink-600 rounded-2xl flex items-center justify-center mr-4'>
                          <MdGavel className='text-2xl text-white' />
                        </div>
                        3. Content & Conduct
                      </motion.h2>

                      <motion.div
                        className='space-y-8'
                        variants={containerVariants}
                        initial='hidden'
                        animate='visible'
                      >
                        <motion.div variants={itemVariants}>
                          <h3 className='text-xl font-semibold text-gray-900 mb-4 flex items-center'>
                            <FaFileContract className='mr-3 text-red-600' />
                            User Content Rights
                          </h3>
                          <p className='text-gray-700'>
                            You retain ownership of any content you create or
                            share through our services. By posting content, you
                            grant us a worldwide, non-exclusive license to use,
                            display, and distribute your content in connection
                            with our services.
                          </p>
                        </motion.div>

                        <motion.div variants={itemVariants}>
                          <h3 className='text-xl font-semibold text-gray-900 mb-4 flex items-center'>
                            <MdWarning className='mr-3 text-orange-600' />
                            Prohibited Activities
                          </h3>
                          <p className='text-gray-700 mb-4'>
                            You agree not to:
                          </p>
                          <div className='grid md:grid-cols-2 gap-4'>
                            {[
                              'Violate any laws or regulations',
                              'Infringe upon intellectual property rights',
                              'Harass, abuse, or harm others',
                              'Distribute malware or malicious code',
                              'Attempt unauthorized system access',
                              'Use services for illegal purposes',
                            ].map((item, index) => (
                              <motion.div
                                key={index}
                                variants={cardVariants}
                                initial='initial'
                                whileHover='hover'
                                className='bg-red-50 p-4 rounded-xl border border-red-200'
                              >
                                <p className='text-red-900 text-sm'>{item}</p>
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
                      Questions?
                    </h3>
                    <p className='text-gray-700 mb-6'>
                      We&apos;re here to help you understand our terms and
                      policies.
                    </p>
                    <div className='flex flex-col md:flex-row gap-6'>
                      <div className='flex items-center space-x-4 flex-1'>
                        <div className='w-12 h-12 bg-linear-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center'>
                          <MdDescription className='text-2xl text-white' />
                        </div>
                        <div>
                          <p className='font-semibold text-gray-900'>
                            Email Support
                          </p>
                          <p className='text-sm text-gray-600'>
                            jebarsanthatcroos@gmail.com
                          </p>
                        </div>
                      </div>
                      <div className='flex items-center space-x-4 flex-1'>
                        <div className='w-12 h-12 bg-linear-to-r from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center'>
                          <FaHandshake className='text-xl text-white' />
                        </div>
                        <div>
                          <p className='font-semibold text-gray-900'>
                            Response Time
                          </p>
                          <p className='text-sm text-gray-600'>
                            Typically within 24 hours
                          </p>
                        </div>
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

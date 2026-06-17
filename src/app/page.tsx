'use client';

import Link from 'next/link';
import Navbar from '@/components/Navbar/Navbar';
import Footer from '@/components/Footer';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
  FiCalendar,
  FiPackage,
  FiDroplet,
  FiArrowRight,
  FiShield,
  FiClock,
  FiHeart,
  FiUsers,
  FiStar,
} from 'react-icons/fi';
import { useRef } from 'react';

export default function HomePage() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.8]);

  const services = [
    {
      icon: <FiCalendar className='w-8 h-8' />,
      title: 'Appointment Booking',
      description:
        'Book appointments with doctors and healthcare professionals online',
      href: '/booking',
      color: 'bg-blue-50 text-blue-600',
      gradient: 'from-blue-400 to-blue-600',
    },
    {
      icon: <FiPackage className='w-8 h-8' />,
      title: 'Pharmacy',
      description: 'Order medicines and healthcare products with home delivery',
      href: '/pharmacy',
      color: 'bg-green-50 text-green-600',
      gradient: 'from-green-400 to-green-600',
    },
    {
      icon: <FiDroplet className='w-8 h-8' />,
      title: 'Laboratory',
      description: 'Book lab tests and get results online',
      href: '/laboratory',
      color: 'bg-purple-50 text-purple-600',
      gradient: 'from-purple-400 to-purple-600',
    },
    {
      icon: <FiShield className='w-8 h-8' />,
      title: 'Health Records',
      description: 'Access your medical records and history securely',
      href: '/records',
      color: 'bg-orange-50 text-orange-600',
      gradient: 'from-orange-400 to-orange-600',
    },
  ];

  const stats = [
    { number: '50K+', label: 'Happy Patients', icon: <FiHeart /> },
    { number: '200+', label: 'Expert Doctors', icon: <FiUsers /> },
    { number: '24/7', label: 'Support', icon: <FiClock /> },
    { number: '4.9', label: 'Rating', icon: <FiStar /> },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 50, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: 'easeOut' as const,
      },
    },
  };

  // Fixed floating animation variants with correct typing
  const floatingVariants = {
    animate: {
      y: [-10, 10, -10],
      transition: {
        duration: 4,
        repeat: Infinity,
        ease: 'easeInOut' as const,
      },
    },
  };

  const rotateVariants = {
    animate: {
      rotate: 360,
      transition: {
        duration: 20,
        repeat: Infinity,
        ease: 'linear' as const,
      },
    },
  };

  const rotateReverseVariants = {
    animate: {
      rotate: -360,
      transition: {
        duration: 25,
        repeat: Infinity,
        ease: 'linear' as const,
      },
    },
  };

  const gradientTextVariants = {
    animate: {
      backgroundPosition: ['0%', '200%'],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: 'linear' as const,
      },
    },
  };

  return (
    <div
      ref={containerRef}
      className='min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 overflow-hidden'
    >
      <Navbar />

      {/* Enhanced Hero Section */}
      <section className='relative py-20 px-4 min-h-screen flex items-center'>
        {/* Background Elements */}
        <div className='absolute inset-0 overflow-hidden'>
          <motion.div
            variants={floatingVariants}
            animate='animate'
            className='absolute top-20 left-10 w-20 h-20 bg-blue-200 rounded-full blur-xl opacity-30'
          />
          <motion.div
            variants={floatingVariants}
            animate='animate'
            className='absolute bottom-20 right-10 w-32 h-32 bg-cyan-200 rounded-full blur-xl opacity-30'
          />
          <motion.div
            variants={floatingVariants}
            animate='animate'
            className='absolute top-1/2 left-1/3 w-16 h-16 bg-purple-200 rounded-full blur-xl opacity-30'
          />
        </div>

        <div className='max-w-7xl mx-auto w-full'>
          <div className='grid md:grid-cols-2 gap-12 items-center'>
            <motion.div
              initial={{ x: -60, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className='inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full border border-blue-200 mb-6'
              >
                <div className='w-2 h-2 bg-green-500 rounded-full animate-pulse' />
                <span className='text-sm font-medium text-gray-600'>
                  24/7 Healthcare Services Available
                </span>
              </motion.div>

              <h1 className='text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight'>
                Your Health,
                <motion.span
                  variants={gradientTextVariants}
                  animate='animate'
                  className='bg-linear-to-r from-blue-600 via-purple-600 to-blue-600 bg-size-[200%] bg-clip-text text-transparent ml-4'
                >
                  Our Priority
                </motion.span>
              </h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className='text-xl text-gray-600 mb-8 leading-relaxed'
              >
                Comprehensive healthcare services at your fingertips. Book
                appointments, access pharmacy services, lab tests, and manage
                your health records seamlessly.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className='flex flex-col sm:flex-row gap-4 mb-8'
              >
                <Link
                  href='/auth/signin'
                  className='group bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-semibold flex items-center justify-center transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105'
                >
                  Sign In to Your Account
                  <FiArrowRight className='ml-2 group-hover:translate-x-1 transition-transform' />
                </Link>
                <Link
                  href='/auth/signup'
                  className='group border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300 hover:scale-105'
                >
                  Create New Account
                </Link>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className='flex items-center gap-6 text-sm text-gray-500'
              >
                {stats.slice(0, 2).map(stat => (
                  <div key={stat.label} className='flex items-center gap-2'>
                    <div className='text-green-500'>{stat.icon}</div>
                    <span>{stat.label}</span>
                  </div>
                ))}
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ x: 60, opacity: 0, scale: 0.9 }}
              animate={{ x: 0, opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
              className='relative'
            >
              <motion.div
                style={{ opacity, scale }}
                className='bg-white/80 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-white/20'
              >
                <div className='grid grid-cols-2 gap-4'>
                  {services.map(service => (
                    <motion.div
                      key={service.title}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.5 }}
                      whileHover={{
                        scale: 1.05,
                        y: -5,
                      }}
                      whileTap={{ scale: 0.95 }}
                      className='group bg-white rounded-2xl p-6 text-center cursor-pointer shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100'
                    >
                      <motion.div
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.6 }}
                        className={`${service.color} w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-gradient-to-r ${service.gradient} group-hover:text-white transition-all duration-300`}
                      >
                        {service.icon}
                      </motion.div>
                      <h3 className='font-semibold text-gray-800 text-sm group-hover:text-gray-900 transition-colors'>
                        {service.title}
                      </h3>
                    </motion.div>
                  ))}
                </div>

                {/* Floating Stats */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1 }}
                  className='mt-8 grid grid-cols-2 gap-4'
                >
                  {stats.map(stat => (
                    <motion.div
                      key={stat.label}
                      whileHover={{ scale: 1.05 }}
                      className='text-center p-4 bg-linear-to-br from-gray-50 to-white rounded-xl shadow-md'
                    >
                      <div className='text-2xl font-bold text-gray-900 bg-gradient-to-br from-gray-50 to-white'>
                        {stat.number}
                      </div>
                      <div className='text-xs text-gray-600'>{stat.label}</div>
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Enhanced Services Section */}
      <section className='py-20 px-4 bg-gradient-to-b from-white to-blue-50'>
        <div className='max-w-7xl mx-auto'>
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className='text-center mb-20'
          >
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: 100 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className='h-1 bg-gradient-to-r from-blue-600 to-purple-600 mx-auto mb-6 rounded-full'
            />
            <h2 className='text-5xl font-bold text-gray-900 mb-6'>
              Our Healthcare Services
            </h2>
            <p className='text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed'>
              Access a wide range of healthcare services designed to meet your
              needs with cutting-edge technology
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial='hidden'
            whileInView='visible'
            viewport={{ once: true }}
            className='grid md:grid-cols-2 lg:grid-cols-4 gap-8'
          >
            {services.map(service => (
              <motion.div
                key={service.title}
                variants={itemVariants}
                whileHover={{
                  y: -10,
                }}
                className='group relative'
              >
                <div className='absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur opacity-0 group-hover:opacity-20 transition-opacity duration-300' />
                <div className='relative bg-white rounded-2xl p-8 shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-300 h-full flex flex-col'>
                  <motion.div
                    whileHover={{
                      scale: 1.1,
                      rotate: 5,
                    }}
                    className={`${service.color} w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-gradient-to-r ${service.gradient} group-hover:text-white transition-all duration-300`}
                  >
                    {service.icon}
                  </motion.div>
                  <h3 className='text-2xl font-bold text-gray-900 mb-4'>
                    {service.title}
                  </h3>
                  <p className='text-gray-600 mb-6 grow leading-relaxed'>
                    {service.description}
                  </p>
                  <Link
                    href={service.href}
                    className='text-blue-600 font-semibold flex items-center gap-2 group-hover:gap-4 transition-all duration-300 mt-auto'
                  >
                    Learn More
                    <FiArrowRight className='group-hover:translate-x-1 transition-transform' />
                  </Link>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Enhanced CTA Section */}
      <section className='py-20 px-4 relative overflow-hidden'>
        <div className='absolute inset-0 bg-linear-to-br from-blue-600 via-purple-600 to-cyan-600' />
        <div className='absolute inset-0 bg-black/10' />

        {/* Animated background elements */}
        <motion.div
          variants={rotateVariants}
          animate='animate'
          className='absolute -top-32 -right-32 w-64 h-64 border-4 border-white/10 rounded-full'
        />
        <motion.div
          variants={rotateReverseVariants}
          animate='animate'
          className='absolute -bottom-32 -left-32 w-80 h-80 border-4 border-white/10 rounded-full'
        />

        <div className='max-w-4xl mx-auto text-center relative z-10'>
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className='text-5xl font-bold text-white mb-6'
            >
              Ready to Take Control of Your Health?
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className='text-xl text-blue-100 mb-12 leading-relaxed'
            >
              Join thousands of patients who trust our healthcare platform for
              their medical needs
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className='flex flex-col sm:flex-row gap-6 justify-center'
            >
              <Link
                href='/auth/signup'
                className='group bg-white text-blue-600 hover:bg-gray-50 px-12 py-5 rounded-2xl font-semibold text-lg transition-all duration-300 shadow-2xl hover:shadow-3xl hover:scale-105 flex items-center justify-center gap-3'
              >
                Get Started Today
                <FiArrowRight className='group-hover:translate-x-1 transition-transform' />
              </Link>
              <Link
                href='/services'
                className='group border-2 border-white text-white hover:bg-white hover:text-blue-600 px-12 py-5 rounded-2xl font-semibold text-lg transition-all duration-300 hover:scale-105'
              >
                Explore Services
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

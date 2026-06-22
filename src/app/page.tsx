/* eslint-disable @typescript-eslint/no-unused-vars */
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
      color: 'bg-blue-50 text-blue-600',
      gradient: 'from-blue-400 to-blue-600',
      delay: 0.1,
    },
    {
      icon: <FiPackage className='w-8 h-8' />,
      title: 'Pharmacy',
      description: 'Order medicines and healthcare products with home delivery',
      href: '/pharmacy',
      color: 'bg-green-50 text-green-600',
      gradient: 'from-green-400 to-green-600',
      delay: 0.2,
    },
    {
      icon: <FiDroplet className='w-8 h-8' />,
      title: 'Laboratory',
      description: 'Book lab tests and get results online',
      color: 'bg-purple-50 text-purple-600',
      gradient: 'from-purple-400 to-purple-600',
      delay: 0.3,
    },
    {
      icon: <FiShield className='w-8 h-8' />,
      title: 'Health Records',
      description: 'Access your medical records and history securely',
      color: 'bg-orange-50 text-orange-600',
      gradient: 'from-orange-400 to-orange-600',
      delay: 0.4,
    },
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
      className='min-h-screen bg-linear-to-br from-blue-50 via-white to-cyan-50 overflow-hidden'
    >
      <Navbar />

      {/* Enhanced Hero Section */}
      <section className='relative py-20 px-4 min-h-screen flex items-center'>
        {/* Background Elements */}
        <div className='absolute inset-0 overflow-hidden'>
          <motion.div
            variants={floatingVariants}
            animate='animate'
            className='absolute top-20 left-10 w-24 h-24 bg-blue-200 rounded-full blur-2xl opacity-30'
          />
          <motion.div
            variants={floatingVariants}
            animate='animate'
            className='absolute bottom-20 right-10 w-40 h-40 bg-cyan-200 rounded-full blur-2xl opacity-30'
          />
          <motion.div
            variants={floatingVariants}
            animate='animate'
            className='absolute top-1/2 left-1/4 w-32 h-32 bg-purple-200 rounded-full blur-2xl opacity-20'
          />
          <div className='absolute inset-0 bg-linear-to-b from-transparent via-transparent to-blue-50/50' />
        </div>

        <div className='max-w-4xl mx-auto w-full relative z-10'>
          <div className='flex justify-center'>
            {/* Left Column - Centered */}
            <motion.div
              initial={{ x: -60, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className='space-y-8 text-center max-w-3xl'
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className='inline-flex items-center gap-3 bg-white/90 backdrop-blur-sm px-5 py-2.5 rounded-full border border-blue-200 shadow-sm mx-auto'
              >
                <span className='relative flex h-2.5 w-2.5'>
                  <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75'></span>
                  <span className='relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500'></span>
                </span>
                <span className='text-sm font-medium text-gray-700'>
                  24/7 Healthcare Services Available
                </span>
              </motion.div>

              <div>
                <h1 className='text-5xl md:text-7xl font-bold text-gray-900 leading-[1.1]'>
                  Your Health,
                  <br />
                  <motion.span
                    variants={gradientTextVariants}
                    animate='animate'
                    className='bg-linear-to-r from-blue-600 via-purple-600 to-blue-600 bg-size-[200%] bg-clip-text text-transparent'
                  >
                    Our Priority
                  </motion.span>
                </h1>
              </div>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className='text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto'
              >
                Comprehensive healthcare services at your fingertips. Book
                appointments, access pharmacy services, lab tests, and manage
                your health records seamlessly.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className='flex flex-col sm:flex-row gap-4 justify-center'
              >
                <Link
                  href='/auth/signin'
                  className='group bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-4 rounded-2xl font-semibold flex items-center justify-center transition-all duration-300 shadow-lg hover:shadow-2xl hover:scale-[1.02] gap-2'
                >
                  Get Started
                  <FiArrowRight className='group-hover:translate-x-1 transition-transform' />
                </Link>
                <Link
                  href='/auth/signup'
                  className='group bg-white hover:bg-gray-50 text-blue-600 px-8 py-4 rounded-2xl font-semibold transition-all duration-300 shadow-md hover:shadow-xl hover:scale-[1.02] border-2 border-blue-200 hover:border-blue-300'
                >
                  Create Account
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Enhanced Services Section */}
      <section className='py-24 px-4 bg-linear-to-b from-white via-blue-50/30 to-white'>
        <div className='max-w-7xl mx-auto'>
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className='text-center mb-16'
          >
            <span className='inline-block px-4 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold mb-4'>
              Our Services
            </span>
            <h2 className='text-4xl md:text-5xl font-bold text-gray-900 mb-4'>
              Comprehensive Healthcare
              <br />
              <span className='text-transparent bg-clip-text bg-linear-to-r from-blue-600 to-purple-600'>
                Solutions
              </span>
            </h2>
            <p className='text-xl text-gray-600 max-w-2xl mx-auto'>
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
                whileHover={{ y: -12 }}
                className='group relative'
              >
                <div className='absolute inset-0 bg-linear-to-r from-blue-600 to-purple-600 rounded-3xl blur-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-500' />
                <div className='relative bg-white rounded-3xl p-8 shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-500 h-full flex flex-col group-hover:border-blue-200'>
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className={`${service.color} w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-linear-to-r ${service.gradient} group-hover:text-white transition-all duration-300`}
                  >
                    {service.icon}
                  </motion.div>
                  <h3 className='text-xl font-bold text-gray-900 mb-3'>
                    {service.title}
                  </h3>
                  <p className='text-gray-600 grow leading-relaxed'>
                    {service.description}
                  </p>
                  <div className='mt-6 pt-6 border-t border-gray-100'>
                    <span className='text-blue-600 font-semibold text-sm flex items-center gap-2 group-hover:gap-3 transition-all'>
                      Learn More
                      <FiArrowRight className='group-hover:translate-x-1 transition-transform' />
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Enhanced CTA Section */}
      <section className='py-24 px-4 relative overflow-hidden'>
        <div className='absolute inset-0 bg-linear-to-br from-blue-600 via-indigo-600 to-purple-600' />
        <div className='absolute inset-0 bg-[url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.05"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")]' />

        {/* Animated background elements */}
        <motion.div
          variants={rotateVariants}
          animate='animate'
          className='absolute -top-40 -right-40 w-80 h-80 border-4 border-white/10 rounded-full'
        />
        <motion.div
          variants={rotateReverseVariants}
          animate='animate'
          className='absolute -bottom-40 -left-40 w-96 h-96 border-4 border-white/10 rounded-full'
        />

        <div className='max-w-4xl mx-auto text-center relative z-10'>
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className='space-y-8'
          >
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className='text-4xl md:text-5xl font-bold text-white leading-tight'
            >
              Ready to Take Control of <br />
              <span className='text-yellow-300'>Your Health?</span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className='text-xl text-blue-100 max-w-2xl mx-auto'
            >
              Join thousands of patients who trust our healthcare platform for
              their medical needs
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className='flex flex-col sm:flex-row gap-4 justify-center'
            >
              <Link
                href='/auth/signup'
                className='group bg-white text-blue-600 hover:bg-gray-50 px-10 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 shadow-2xl hover:shadow-3xl hover:scale-105 flex items-center justify-center gap-3'
              >
                Get Started Today
                <FiArrowRight className='group-hover:translate-x-1 transition-transform' />
              </Link>
              <a
                href='https://poster-app-ten.vercel.app/team'
                className='group border-2 border-white text-white hover:bg-white hover:text-blue-600 px-10 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 hover:scale-105'
              >
                Explore Services
              </a>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

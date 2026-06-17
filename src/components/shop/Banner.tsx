/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Loading from '@/components/Loading';
import ErrorDisplay from '@/components/Error';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import {
  FiChevronLeft,
  FiChevronRight,
  FiShoppingCart,
  FiArrowRight,
  FiStar,
  FiTruck,
  FiShield,
} from 'react-icons/fi';

interface Banner {
  _id: string;
  image: string;
  title: string;
  description: string;
  isActive?: boolean;
  link?: string;
}

export default function BannerDisplay() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [direction, setDirection] = useState<number>(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(true);

  useEffect(() => {
    fetchBanners();
  }, []);

  useEffect(() => {
    if (banners.length > 1 && isAutoPlaying) {
      const timer = setInterval(() => {
        nextSlide();
      }, 5000);
      return () => clearInterval(timer);
    }
  }, [banners.length, currentIndex, isAutoPlaying]);

  const fetchBanners = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/allproduct/banner');

      if (!response.ok) {
        throw new Error(`Failed to fetch banners: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.data.length > 0) {
        // Filter only active banners
        const activeBanners = data.data.filter(
          (banner: Banner) => banner.isActive !== false
        );
        setBanners(activeBanners);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const nextSlide = (): void => {
    if (banners.length === 0) return;
    setDirection(1);
    setCurrentIndex(prev => (prev + 1) % banners.length);
  };

  const prevSlide = (): void => {
    if (banners.length === 0) return;
    setDirection(-1);
    setCurrentIndex(prev => (prev - 1 + banners.length) % banners.length);
  };

  const goToSlide = (index: number): void => {
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
  };

  const handleMouseEnter = (): void => {
    setIsAutoPlaying(false);
  };

  const handleMouseLeave = (): void => {
    setIsAutoPlaying(true);
  };

  const slideVariants: Variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 500 : -500,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: [0.215, 0.61, 0.355, 1],
      },
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 500 : -500,
      opacity: 0,
      transition: {
        duration: 0.4,
      },
    }),
  };

  if (loading) return <Loading />;
  if (error) return <ErrorDisplay message={error} />;
  if (banners.length === 0) return null;

  const currentBanner = banners[currentIndex];

  return (
    <div
      className='relative group w-full my-2'
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className='relative w-full overflow-hidden rounded-2xl shadow-lg'>
        {/* Background Gradient */}
        <div className='absolute inset-0 bg-linear-to-br from-purple-600 via-pink-500 to-orange-500 z-0' />

        <AnimatePresence mode='wait' custom={direction}>
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={slideVariants}
            initial='enter'
            animate='center'
            exit='exit'
            className='relative z-10 w-full h-full'
          >
            <div className='flex flex-col lg:flex-row items-center justify-between w-full h-full px-4 md:px-8 lg:px-12 py-6 md:py-8'>
              {/* Left Content Section */}
              <div className='flex-1 text-center lg:text-left space-y-3 md:space-y-4 max-w-xl'>
                {/* Badge */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className='inline-flex items-center gap-2 bg-white/20 backdrop-blur-md rounded-full px-3 py-1.5 mx-auto lg:mx-0'
                >
                  <span className='text-white text-xs md:text-sm font-semibold uppercase tracking-wide'>
                    Limited Offer
                  </span>
                </motion.div>

                {/* Title */}
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className='text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight'
                >
                  {currentBanner.title}
                </motion.h1>

                {/* Description */}
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className='text-white/90 text-sm md:text-base lg:text-lg max-w-lg mx-auto lg:mx-0'
                >
                  {currentBanner.description}
                </motion.p>

                {/* Features */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className='flex flex-wrap gap-3 md:gap-4 justify-center lg:justify-start pt-2'
                >
                  <div className='flex items-center gap-1.5 text-white/80'>
                    <FiTruck className='w-3.5 h-3.5 md:w-4 md:h-4' />
                    <span className='text-xs md:text-sm'>Free Shipping</span>
                  </div>
                  <div className='flex items-center gap-1.5 text-white/80'>
                    <FiShield className='w-3.5 h-3.5 md:w-4 md:h-4' />
                    <span className='text-xs md:text-sm'>2 Year Warranty</span>
                  </div>
                  <div className='flex items-center gap-1.5 text-white/80'>
                    <FiStar className='w-3.5 h-3.5 md:w-4 md:h-4' />
                    <span className='text-xs md:text-sm'>30 Day Returns</span>
                  </div>
                </motion.div>

                {/* CTA Button */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className='mt-2'
                >
                  <Link
                    href={currentBanner.link || '/shop/pharmacy'}
                    target={
                      currentBanner.link?.startsWith('http')
                        ? '_blank'
                        : '_self'
                    }
                    rel={
                      currentBanner.link?.startsWith('http')
                        ? 'noopener noreferrer'
                        : ''
                    }
                  >
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className='group bg-white text-gray-900 px-6 md:px-8 py-2.5 md:py-3 rounded-full font-semibold text-sm md:text-base shadow-lg hover:shadow-xl transition-all inline-flex items-center gap-2 mx-auto lg:mx-0'
                    >
                      <FiShoppingCart className='w-4 h-4 md:w-5 md:h-5' />
                      Shop Now
                      <FiArrowRight className='w-4 h-4 md:w-5 md:h-5 group-hover:translate-x-1 transition-transform' />
                    </motion.button>
                  </Link>
                </motion.div>
              </div>

              {/* Right Image Section */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, duration: 0.6, type: 'spring' }}
                className='flex-1 flex justify-center lg:justify-end mt-6 lg:mt-0'
              >
                <div className='relative'>
                  {/* Responsive Image Container */}
                  <div className='relative w-64 h-64 sm:w-72 sm:h-72 md:w-80 md:h-80 lg:w-96 lg:h-96'>
                    <Image
                      className='object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-500'
                      src={currentBanner.image}
                      alt={currentBanner.title}
                      fill
                      sizes='(max-width: 640px) 256px, (max-width: 768px) 288px, (max-width: 1024px) 320px, 384px'
                      priority
                      style={{ objectFit: 'contain' }}
                    />
                  </div>
                  {/* Decorative Circle Behind Image */}
                  <div className='absolute inset-0 -z-10 bg-white/10 rounded-full blur-3xl scale-75' />
                </div>
              </motion.div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation Arrows */}
        {banners.length > 1 && (
          <>
            <motion.button
              onClick={prevSlide}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className='absolute left-2 md:left-4 top-1/2 -translate-y-1/2 bg-black/20 backdrop-blur-md hover:bg-black/30 p-2 rounded-full transition-all duration-300 z-20 opacity-0 group-hover:opacity-100'
              aria-label='Previous slide'
            >
              <FiChevronLeft className='w-5 h-5 md:w-6 md:h-6 text-white' />
            </motion.button>

            <motion.button
              onClick={nextSlide}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className='absolute right-2 md:right-4 top-1/2 -translate-y-1/2 bg-black/20 backdrop-blur-md hover:bg-black/30 p-2 rounded-full transition-all duration-300 z-20 opacity-0 group-hover:opacity-100'
              aria-label='Next slide'
            >
              <FiChevronRight className='w-5 h-5 md:w-6 md:h-6 text-white' />
            </motion.button>
          </>
        )}

        {/* Dots Indicator */}
        {banners.length > 1 && (
          <div className='absolute bottom-3 md:bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20'>
            {banners.map((_, idx) => (
              <motion.button
                key={idx}
                onClick={() => goToSlide(idx)}
                whileHover={{ scale: 1.3 }}
                whileTap={{ scale: 0.9 }}
                className='relative'
                aria-label={`Go to slide ${idx + 1}`}
              >
                <div
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    idx === currentIndex
                      ? 'w-6 bg-white'
                      : 'w-1.5 bg-white/40 hover:bg-white/60'
                  }`}
                />
              </motion.button>
            ))}
          </div>
        )}

        {/* Progress Bar */}
        {banners.length > 1 && isAutoPlaying && (
          <motion.div
            className='absolute bottom-0 left-0 h-0.5 bg-white/60'
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: 5, ease: 'linear' }}
            onAnimationComplete={() => {
              if (banners.length > 1 && isAutoPlaying) {
                nextSlide();
              }
            }}
          />
        )}
      </div>
    </div>
  );
}

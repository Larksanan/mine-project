'use client';

import { motion, AnimatePresence, Variants } from 'framer-motion';
import { FiMenu, FiX } from 'react-icons/fi';
import NavItems from './NavItems';
import MobileUserSection from './MobileUserSection';

interface MobileNavProps {
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
  isAuthenticated: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  user: any;
}

export default function MobileNav({
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  isAuthenticated,
  user,
}: MobileNavProps) {
  const mobileMenuVariants: Variants = {
    closed: {
      opacity: 0,
      height: 0,
      transition: {
        duration: 0.3,
        ease: 'easeIn',
      },
    },
    open: {
      opacity: 1,
      height: 'auto',
      transition: {
        duration: 0.4,
        ease: [0.16, 1, 0.3, 1], // cubic-bezier equivalent of easeOutExpo
      },
    },
  };

  return (
    <>
      {/* Mobile menu button */}
      <div className='lg:hidden'>
        <motion.button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className='inline-flex items-center justify-center p-3 rounded-2xl text-gray-700 hover:text-blue-600 focus:outline-none transition-colors bg-white/50 backdrop-blur-sm'
          aria-label='Toggle menu'
        >
          <AnimatePresence mode='wait'>
            {isMobileMenuOpen ? (
              <motion.div
                key='close'
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <FiX className='h-6 w-6' />
              </motion.div>
            ) : (
              <motion.div
                key='menu'
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <FiMenu className='h-6 w-6' />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      {/* Mobile Navigation Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            variants={mobileMenuVariants}
            initial='closed'
            animate='open'
            exit='closed'
            className='lg:hidden border-t border-white/20 overflow-hidden bg-white/95 backdrop-blur-xl absolute left-0 right-0 top-full'
          >
            <div className='px-2 pt-2 pb-3 space-y-1'>
              <NavItems mobile onItemClick={() => setIsMobileMenuOpen(false)} />
            </div>

            <MobileUserSection
              isAuthenticated={isAuthenticated}
              user={user}
              onItemClick={() => setIsMobileMenuOpen(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

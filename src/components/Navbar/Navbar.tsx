'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import DesktopNav from './DesktopNav';
import MobileNav from './MobileNav';
import Logo from '../Logo.static';

export default function Navbar() {
  const { user, isAuthenticated } = useAuth();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const navRef = useRef<HTMLElement>(null);

  const { scrollY } = useScroll();
  const scrollYSpring = useSpring(scrollY, {
    stiffness: 100,
    damping: 30,
    mass: 0.5,
  });

  const navbarBackground = useTransform(
    scrollYSpring,
    [0, 100],
    ['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.95)']
  );

  const navbarBorder = useTransform(
    scrollYSpring,
    [0, 100],
    ['rgba(255, 255, 255, 0.1)', 'rgba(229, 231, 235, 0.8)']
  );

  const navbarShadow = useTransform(
    scrollYSpring,
    [0, 100],
    ['0 1px 2px rgba(0, 0, 0, 0.02)', '0 8px 25px rgba(0, 0, 0, 0.1)']
  );

  useEffect(() => {
    const unsubscribe = scrollY.on('change', latest => {
      setIsScrolled(latest > 50);
    });

    return () => unsubscribe();
  }, [scrollY]);

  // Don't show navbar on admin routes
  if (pathname?.startsWith('/dashboard/admin')) {
    return null;
  }

  return (
    <motion.nav
      ref={navRef}
      style={{
        background: navbarBackground,
        borderColor: navbarBorder,
        boxShadow: navbarShadow,
        backdropFilter: isScrolled ? 'blur(20px)' : 'blur(10px)',
      }}
      className='sticky top-0 z-50 border-b transition-all duration-300'
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 25 }}
    >
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex justify-between items-center h-16 lg:h-20'>
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className='flex items-center'
          >
            <Logo
              size='lg'
              showImage={false}
              className='my-logo'
              variant='health'
            />
          </motion.div>

          {/* Desktop Navigation */}
          <DesktopNav
            isAuthenticated={isAuthenticated}
            user={user}
            // Removed onMobileMenuToggle prop since it's not used
          />

          {/* Mobile Navigation */}
          <MobileNav
            isMobileMenuOpen={isMobileMenuOpen}
            setIsMobileMenuOpen={setIsMobileMenuOpen}
            isAuthenticated={isAuthenticated}
            user={user}
          />
        </div>
      </div>
    </motion.nav>
  );
}

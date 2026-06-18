/* eslint-disable no-undef */
'use client';

import { FaFacebook, FaInstagram, FaGithub } from 'react-icons/fa';
import { motion, Variants, AnimatePresence } from 'framer-motion';
import Logo from '@/components/Logo.static';

const footerVariants: Variants = {
  hidden: { opacity: 0, y: 60 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut' },
  },
};

const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
};

const iconVariants: Variants = {
  hidden: { opacity: 0, scale: 0.6 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: {
      delay: i * 0.1 + 0.5,
      duration: 0.35,
      type: 'spring',
      stiffness: 200,
    },
  }),
};

const bottomBarVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { delay: 0.8, duration: 0.5 } },
};

interface SocialLink {
  href: string;
  label: string;
  icon: React.ReactNode;
  hoverColor: string;
}

const socialLinks: SocialLink[] = [
  {
    href: 'https://www.facebook.com/jebarsan.thatcroos.7/',
    label: 'Facebook',
    icon: <FaFacebook />,
    hoverColor: 'hover:text-blue-400',
  },
  {
    href: 'https://www.instagram.com/lanka_tamizha/',
    label: 'Instagram',
    icon: <FaInstagram />,
    hoverColor: 'hover:text-pink-400',
  },
  {
    href: 'https://github.com',
    label: 'GitHub',
    icon: <FaGithub />,
    hoverColor: 'hover:text-white',
  },
];

interface AddressItem {
  street: string;
  city: string;
  tel: string;
  telRaw: string;
}

const addresses: AddressItem[] = [
  {
    street: 'Main street batticalo road,',
    city: 'Pandirupu, Kalmunai.',
    tel: 'Tel: 0762397951',
    telRaw: '0762397951',
  },
  {
    street: 'Main street batticalo road,',
    city: 'Kinniya, Trincomalee.',
    tel: 'Tel: +94 754104415',
    telRaw: '+94754104415',
  },
];

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <AnimatePresence mode='wait'>
      <motion.footer
        variants={footerVariants}
        initial='hidden'
        whileInView='visible'
        viewport={{ once: true, amount: 0.1 }}
        className='bg-gray-800 text-white'
      >
        <div className='py-12 text-gray-400'>
          <div className='container mx-auto px-6'>
            <motion.div
              variants={containerVariants}
              initial='hidden'
              whileInView='visible'
              viewport={{ once: true }}
              className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10'
            >
              {/* Logo + tagline */}
              <motion.div
                variants={itemVariants}
                className='flex flex-col items-start'
              >
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className='text-white text-2xl font-bold tracking-wide mb-3'
                >
                  <Logo />
                </motion.div>
                <p className='text-sm text-gray-400 leading-relaxed max-w-xs'>
                  24-Hour Walk-In Clinic and Emergency services for you and your
                  family.
                </p>
              </motion.div>

              {/* Address */}
              <motion.div
                variants={itemVariants}
                className='flex flex-col items-start'
              >
                <motion.h2
                  initial={{ scaleX: 0, originX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                  className='text-xl font-semibold text-white pb-3 mb-4 border-b-4 border-blue-600 w-fit'
                >
                  Address
                </motion.h2>

                <div className='space-y-4'>
                  {addresses.map((addr, i) => (
                    <motion.p
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.35 + i * 0.12, duration: 0.4 }}
                      className='text-sm text-gray-400 leading-relaxed'
                    >
                      {addr.street}
                      <br />
                      {addr.city}
                      <br />
                      <a
                        href={`tel:${addr.telRaw}`}
                        className='text-blue-400 hover:text-blue-300 transition-colors duration-200'
                      >
                        {addr.tel}
                      </a>
                    </motion.p>
                  ))}
                </div>
              </motion.div>

              {/* Social */}
              <motion.div
                variants={itemVariants}
                className='flex flex-col items-start'
              >
                <motion.h2
                  initial={{ scaleX: 0, originX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.4 }}
                  className='text-xl font-semibold text-white pb-3 mb-4 border-b-4 border-blue-600 w-fit'
                >
                  Connect With Us
                </motion.h2>

                <div className='flex items-center gap-5 mt-1'>
                  {socialLinks.map((social, i) => (
                    <motion.a
                      key={social.label}
                      custom={i}
                      variants={iconVariants}
                      initial='hidden'
                      whileInView='visible'
                      viewport={{ once: true }}
                      href={social.href}
                      target='_blank'
                      rel='noopener noreferrer'
                      aria-label={social.label}
                      whileHover={{ scale: 1.25, rotate: 8 }}
                      whileTap={{ scale: 0.9 }}
                      className={`text-2xl text-gray-400 ${social.hoverColor} transition-colors duration-200`}
                    >
                      {social.icon}
                    </motion.a>
                  ))}
                </div>

                {/* Animated divider accent */}
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: '100%' }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.9, duration: 0.6, ease: 'easeOut' }}
                  className='mt-6 h-px bg-linear-to-r from-blue-600 to-transparent max-w-xs'
                />
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* ── Bottom bar ── */}
        <motion.div
          variants={bottomBarVariants}
          initial='hidden'
          whileInView='visible'
          viewport={{ once: true }}
          className='bg-indigo-700 py-4 text-gray-100'
        >
          <div className='container mx-auto px-6'>
            <div className='flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-center sm:text-left'>
              <p>
                &copy; {currentYear} Developed and Designed by |{' '}
                <motion.a
                  href='mailto:gwu-hict-2021-42@gwu.ac.lk'
                  whileHover={{ color: '#93c5fd' }}
                  className='font-semibold text-white transition-colors duration-200'
                >
                  COFFEE CODERS TEAM
                </motion.a>
              </p>
            </div>
          </div>
        </motion.div>
      </motion.footer>
    </AnimatePresence>
  );
};

export default Footer;

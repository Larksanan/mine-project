'use client';
import { FaFacebook, FaInstagram, FaGithub } from 'react-icons/fa';
import { motion } from 'framer-motion';
import Logo from './Logo.static';
import Link from 'next/link';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <motion.footer
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeInOut' }}
      className='bg-gray-800 text-white p-4'
    >
      <div className='bg-gray-800 py-4 text-gray-400'>
        <div className='container px-4 mx-auto'>
          <div className='-mx-4 flex flex-wrap justify-between'>
            {/* Logo and Description */}
            <div className='px-4 my-4 w-full xl:w-1/5 text-left'>
              <Logo
                size='lg'
                showImage={false}
                className='my-logo'
                variant='health'
              />

              <p className=' px-4  text-justify pb-4 mb-4 '>
                24-Hour Walk-In Clinic and Emergency.
              </p>
            </div>

            <div className='px-4 my-4 w-full sm:w-auto text-left'>
              <div>
                <h2 className='inline-block text-2xl pb-4 mb-4 border-b-4 border-blue-600'>
                  Company
                </h2>
              </div>
              <ul className='leading-8'>
                <li>
                  <Link
                    href='/patient/appointments'
                    className='hover:text-blue-400'
                  >
                    Appointments
                  </Link>
                </li>
                <li>
                  <Link href='/my-cart' className='hover:text-blue-400'>
                    My Cart
                  </Link>
                </li>
                <li>
                  <Link href='/shop' className='hover:text-blue-400'>
                    Shop
                  </Link>
                </li>

                <li>
                  <Link
                    href='/patient/laboratory'
                    className='hover:text-blue-400'
                  >
                    Laboratory
                  </Link>
                </li>
                <li>
                  <Link href='/contact-us' className='hover:text-blue-400'>
                    Contact Us
                  </Link>
                </li>
              </ul>
            </div>

            {/* Address */}
            <div className='px-4 my-4 w-full sm:w-auto text-left'>
              <div>
                <h2 className='inline-block text-2xl pb-4 mb-4 border-b-4 border-blue-600'>
                  Address
                </h2>
                <p className='text-lm text-gray-400'>
                  Main street batticalo road, <br />
                  Pandirupu,Kalmunai. <br />
                  Tel: 0762397951
                </p>
                <br />
                <p className='text-lm text-gray-400'>
                  Main street batticalo road, <br />
                  kinniya,trincomalee. <br />
                  Tel: +94 754104415
                </p>
              </div>
            </div>

            <div className='px-4 my-4 w-full sm:w-auto xl:w-1/5 text-left'>
              <div>
                <h2 className='inline-block text-2xl pb-4 mb-4 border-b-4 border-blue-600'>
                  Connect With Us
                </h2>
              </div>
              <div className='flex space-x-4 mt-2'>
                <motion.a
                  href='https://www.facebook.com/jebarsan.thatcroos.7/'
                  target='_blank'
                  rel='noopener noreferrer'
                  aria-label='Facebook'
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <FaFacebook className='text-2xl hover:text-blue-400' />
                </motion.a>
                <motion.a
                  href='https://www.instagram.com/lanka_tamizha/?utm_source=qr&igsh=dzd2cHp3endqemJl#'
                  target='_blank'
                  rel='noopener noreferrer'
                  aria-label='Instagram'
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <FaInstagram className='text-2xl hover:text-blue-400' />
                </motion.a>
                <motion.a
                  href='https://github.com'
                  target='_blank'
                  rel='noopener noreferrer'
                  aria-label='GitHub'
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <FaGithub className='text-2xl hover:text-blue-400' />
                </motion.a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className='bg-indigo-700 py-4 text-gray-100'>
        <div className='container mx-auto px-4'>
          <div className='-mx-4 flex flex-wrap justify-between'>
            <div className='px-4 w-full text-left sm:w-auto'>
              <p>
                &copy; {currentYear} Developed and Designed by |
                <a
                  href='mailto:gwu-hict-2021-42@gwu.ac.lk'
                  className='text-white hover:text-blue-400'
                >
                  {' '}
                  COFFEE CODERS TEAM
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.footer>
  );
};

export default Footer;

import { useEffect, useState } from 'react';
import { useScroll, useSpring, useTransform } from 'framer-motion';

export function useHeaderAnimation() {
  const [isScrolled, setIsScrolled] = useState(false);
  const { scrollY } = useScroll();

  const scrollYSpring = useSpring(scrollY, {
    stiffness: 100,
    damping: 30,
    mass: 1,
  });
  const scrollProgress = useTransform(scrollYSpring, [0, 200], ['0%', '100%']);
  const headerBackground = useTransform(
    scrollYSpring,
    [0, 100],
    ['rgba(255, 255, 255, 1)', 'rgba(255, 255, 255, 0.98)']
  );

  useEffect(() => {
    const unsubscribe = scrollY.on('change', latest => {
      setIsScrolled(latest > 20);
    });

    return () => unsubscribe();
  }, [scrollY]);

  const headerVariants = {
    hidden: {
      y: -100,
      opacity: 0,
    },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 30,
      },
    },
  };

  return {
    scrollProgress,
    headerBackground,
    isScrolled,
    headerVariants,
  };
}

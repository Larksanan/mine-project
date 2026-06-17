/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, Variants } from 'framer-motion';
import { useActivePath } from '@/hooks/useActivePath';
import { navItemVariants } from '@/animations/navItemVariants';

interface SidebarNavItemProps {
  item: {
    name: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
  };
  isCollapsed: boolean;
  index: number;
}

export default function SidebarNavItem({
  item,
  isCollapsed,
  index,
}: SidebarNavItemProps) {
  const isActive = useActivePath(item.href);
  const Icon = item.icon;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // If not mounted yet, render without animations
  if (!mounted) {
    return (
      <li>
        <Link
          href={item.href}
          className={`flex items-center px-3 py-3 rounded-lg transition-colors ${
            isActive
              ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
              : 'text-gray-700 hover:bg-gray-100'
          } ${isCollapsed ? 'justify-center' : 'space-x-3'}`}
        >
          <Icon
            className={`w-5 h-5 ${
              isActive ? 'text-blue-700' : 'text-gray-400'
            }`}
          />
          <span
            className={`font-medium whitespace-nowrap overflow-hidden transition-all duration-200 ${
              isCollapsed ? 'w-0 opacity-0 ml-0' : 'w-auto opacity-100 ml-3'
            }`}
          >
            {item.name}
          </span>
        </Link>
      </li>
    );
  }

  return (
    <motion.li
      variants={navItemVariants as Variants}
      initial='hidden'
      animate='visible'
      exit='hidden'
      custom={index}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Link
        href={item.href}
        className={`flex items-center px-3 py-3 rounded-lg transition-colors ${
          isActive
            ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
            : 'text-gray-700 hover:bg-gray-100'
        } ${isCollapsed ? 'justify-center' : 'space-x-3'}`}
      >
        <Icon
          className={`w-5 h-5 ${isActive ? 'text-blue-700' : 'text-gray-400'}`}
        />

        <span
          className={`font-medium whitespace-nowrap overflow-hidden transition-all duration-200 ${
            isCollapsed ? 'w-0 opacity-0 ml-0' : 'w-auto opacity-100 ml-3'
          }`}
        >
          {item.name}
        </span>
      </Link>
    </motion.li>
  );
}

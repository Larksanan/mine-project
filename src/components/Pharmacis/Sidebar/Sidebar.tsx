'use client';

import { motion } from 'framer-motion';
import SidebarHeader from './SidebarHeader';
import SidebarNav from './SidebarNav';
import QuickActions from './QuickActions';
import { useSidebarState } from '@/hooks/useSidebarState';

export default function PharmacistSidebar() {
  const { isCollapsed, toggleSidebar } = useSidebarState();

  const sidebarVariants = {
    expanded: {
      width: 256,
      transition: {
        type: 'spring' as const,
        stiffness: 300,
        damping: 30,
      },
    },
    collapsed: {
      width: 80,
      transition: {
        type: 'spring' as const,
        stiffness: 300,
        damping: 30,
      },
    },
  };

  return (
    <motion.aside
      variants={sidebarVariants}
      initial={false} // Don't animate from initial state
      animate={isCollapsed ? 'collapsed' : 'expanded'}
      className='bg-white border-r border-gray-200 h-screen flex flex-col'
    >
      <SidebarHeader isCollapsed={isCollapsed} onToggle={toggleSidebar} />
      <div className='flex-1 overflow-y-auto'>
        <SidebarNav isCollapsed={isCollapsed} />
      </div>
      <QuickActions isCollapsed={isCollapsed} />
    </motion.aside>
  );
}

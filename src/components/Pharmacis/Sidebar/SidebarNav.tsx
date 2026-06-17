'use client';

import React from 'react';
import SidebarNavItem from './SidebarNavItem';
import { menuItems } from './navItemsConfig';

interface SidebarNavProps {
  isCollapsed: boolean;
}

export default function SidebarNav({ isCollapsed }: SidebarNavProps) {
  return (
    <nav className='p-4'>
      <ul className='space-y-2'>
        {menuItems.map((item, index) => (
          <SidebarNavItem
            key={item.name}
            item={item}
            isCollapsed={isCollapsed}
            index={index}
          />
        ))}
      </ul>
    </nav>
  );
}

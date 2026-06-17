/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from 'react';

export function useSidebarState() {
  // Always start with false (expanded) to match server render
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Initialize from localStorage only after mount
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebar-collapsed');
      if (saved !== null) {
        setIsCollapsed(JSON.parse(saved));
      }
      setIsInitialized(true);
    }
  }, []);

  const toggleSidebar = () => {
    setIsCollapsed(prev => !prev);
  };

  // Only save to localStorage after initialization
  useEffect(() => {
    if (isInitialized && typeof window !== 'undefined') {
      localStorage.setItem('sidebar-collapsed', JSON.stringify(isCollapsed));
    }
  }, [isCollapsed, isInitialized]);

  return {
    isCollapsed,
    toggleSidebar,
    setIsCollapsed,
  };
}

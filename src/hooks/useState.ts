import { useState, useEffect, useCallback } from 'react';

export function useHeaderState() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = () => {
      if (isNotificationsOpen) setIsNotificationsOpen(false);
      if (isUserMenuOpen) setIsUserMenuOpen(false);
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isNotificationsOpen, isUserMenuOpen]);

  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isSearchOpen) {
        setIsSearchOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => document.removeEventListener('keydown', handleEscapeKey);
  }, [isSearchOpen]);

  const closeAllDropdowns = useCallback(() => {
    setIsNotificationsOpen(false);
    setIsUserMenuOpen(false);
    setIsSearchOpen(false);
  }, []);

  return {
    isSearchOpen,
    setIsSearchOpen,
    isNotificationsOpen,
    setIsNotificationsOpen,
    isUserMenuOpen,
    setIsUserMenuOpen,
    closeAllDropdowns,
  };
}

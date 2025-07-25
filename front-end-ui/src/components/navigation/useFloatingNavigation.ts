import { useState, useCallback } from 'react';

export const useFloatingNavigation = () => {
  const [isFloatingNavVisible, setIsFloatingNavVisible] = useState(false);

  const toggleFloatingNav = useCallback(() => {
    setIsFloatingNavVisible(prev => !prev);
  }, []);

  const openFloatingNav = useCallback(() => {
    setIsFloatingNavVisible(true);
  }, []);

  const closeFloatingNav = useCallback(() => {
    setIsFloatingNavVisible(false);
  }, []);

  return {
    isFloatingNavVisible,
    toggleFloatingNav,
    openFloatingNav,
    closeFloatingNav,
  };
};

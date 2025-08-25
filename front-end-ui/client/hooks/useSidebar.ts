import { useState, useEffect } from 'react';

export function useSidebar() {
  const [isOpen, setIsOpen] = useState(false);

  // Keep sidebar collapsed on desktop by default, closed on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        // Desktop: keep collapsed by default
        setIsOpen(false);
      } else {
        // Mobile: keep closed
        setIsOpen(false);
      }
    };

    // Set initial state
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => setIsOpen(!isOpen);
  const closeSidebar = () => setIsOpen(false);
  const openSidebar = () => setIsOpen(true);

  return {
    isOpen,
    setIsOpen,
    toggleSidebar,
    closeSidebar,
    openSidebar
  };
}

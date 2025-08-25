import { useState, useEffect } from 'react';

export const useGoogleMaps = () => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const checkGoogleMaps = () => {
      if (typeof window !== 'undefined' && window.google?.maps) {
        setIsLoaded(true);
      }
    };

    // Check immediately
    checkGoogleMaps();

    // If not loaded, check once after a delay
    if (!isLoaded) {
      const timeout = setTimeout(checkGoogleMaps, 1000);
      return () => clearTimeout(timeout);
    }
  }, [isLoaded]);

  return isLoaded;
};

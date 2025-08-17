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

    // Set up an interval to check periodically
    const interval = setInterval(checkGoogleMaps, 100);

    // Clean up
    return () => clearInterval(interval);
  }, []);

  return isLoaded;
};

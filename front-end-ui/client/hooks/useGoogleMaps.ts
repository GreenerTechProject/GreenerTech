import { useState, useEffect } from 'react';
import { isGoogleMapsAvailable } from '../utils/googleMapsUtils';

interface UseGoogleMapsReturn {
  isLoaded: boolean;
  hasError: boolean;
  error: string | null;
  retry: () => void;
}

export function useGoogleMaps(): UseGoogleMapsReturn {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const retry = () => {
    setHasError(false);
    setError(null);
    // Force a re-check
    setTimeout(() => {
      if (isGoogleMapsAvailable()) {
        setIsLoaded(true);
      }
    }, 100);
  };

  useEffect(() => {
    // Check if Google Maps is already available
    if (isGoogleMapsAvailable()) {
      setIsLoaded(true);
      return;
    }

    // If not available, set up a polling mechanism to check
    const interval = setInterval(() => {
      if (isGoogleMapsAvailable()) {
        setIsLoaded(true);
        clearInterval(interval);
      }
    }, 100);

    // Cleanup after 10 seconds to avoid infinite polling
    const timeout = setTimeout(() => {
      clearInterval(interval);
      if (!isGoogleMapsAvailable()) {
        setHasError(true);
        setError('Google Maps API failed to load within timeout');
      }
    }, 10000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  return {
    isLoaded,
    hasError,
    error,
    retry
  };
}

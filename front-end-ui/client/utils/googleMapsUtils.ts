/**
 * Utility functions for safely working with Google Maps API
 */

export interface GoogleMapsAvailability {
  isAvailable: boolean;
  hasMaps: boolean;
  hasSize: boolean;
  hasMarker: boolean;
  hasPolygon: boolean;
  hasPolyline: boolean;
  hasCircle: boolean;
  hasDrawing: boolean;
  hasPlaces: boolean;
  hasVisualization: boolean;
}

/**
 * Safely check if Google Maps API is available
 */
export function isGoogleMapsAvailable(): boolean {
  return typeof window !== 'undefined' && 
         (window as any).google && 
         (window as any).google.maps;
}

/**
 * Get detailed information about Google Maps API availability
 */
export function getGoogleMapsAvailability(): GoogleMapsAvailability {
  const isAvailable = isGoogleMapsAvailable();
  
  if (!isAvailable) {
    return {
      isAvailable: false,
      hasMaps: false,
      hasSize: false,
      hasMarker: false,
      hasPolygon: false,
      hasPolyline: false,
      hasCircle: false,
      hasDrawing: false,
      hasPlaces: false,
      hasVisualization: false,
    };
  }

  const google = (window as any).google;
  const maps = google.maps;

  return {
    isAvailable: true,
    hasMaps: !!maps,
    hasSize: !!maps.Size,
    hasMarker: !!maps.Marker,
    hasPolygon: !!maps.Polygon,
    hasPolyline: !!maps.Polyline,
    hasCircle: !!maps.Circle,
    hasDrawing: !!maps.drawing,
    hasPlaces: !!maps.places,
    hasVisualization: !!maps.visualization,
  };
}

/**
 * Safely create a Google Maps Size object
 */
export function createGoogleMapsSize(width: number, height: number): any {
  if (!isGoogleMapsAvailable() || !(window as any).google.maps.Size) {
    console.warn('Google Maps Size not available');
    return undefined;
  }
  
  try {
    return new (window as any).google.maps.Size(width, height);
  } catch (error) {
    console.error('Error creating Google Maps Size:', error);
    return undefined;
  }
}

/**
 * Safely create a Google Maps LatLng object
 */
export function createGoogleMapsLatLng(lat: number, lng: number): any {
  if (!isGoogleMapsAvailable() || !(window as any).google.maps.LatLng) {
    console.warn('Google Maps LatLng not available');
    return undefined;
  }
  
  try {
    return new (window as any).google.maps.LatLng(lat, lng);
  } catch (error) {
    console.error('Error creating Google Maps LatLng:', error);
    return undefined;
  }
}

/**
 * Safely create a Google Maps LatLngBounds object
 */
export function createGoogleMapsLatLngBounds(): any {
  if (!isGoogleMapsAvailable() || !(window as any).google.maps.LatLngBounds) {
    console.warn('Google Maps LatLngBounds not available');
    return undefined;
  }
  
  try {
    return new (window as any).google.maps.LatLngBounds();
  } catch (error) {
    console.error('Error creating Google Maps LatLngBounds:', error);
    return undefined;
  }
}

/**
 * Wait for Google Maps API to be available
 */
export function waitForGoogleMaps(timeout: number = 10000): Promise<boolean> {
  return new Promise((resolve) => {
    if (isGoogleMapsAvailable()) {
      resolve(true);
      return;
    }

    const startTime = Date.now();
    const interval = setInterval(() => {
      if (isGoogleMapsAvailable()) {
        clearInterval(interval);
        resolve(true);
      } else if (Date.now() - startTime > timeout) {
        clearInterval(interval);
        resolve(false);
      }
    }, 100);
  });
}

/**
 * Safely execute a function when Google Maps is available
 */
export function whenGoogleMapsAvailable<T>(
  fn: () => T, 
  fallback?: T
): T | undefined {
  if (isGoogleMapsAvailable()) {
    try {
      return fn();
    } catch (error) {
      console.error('Error executing Google Maps function:', error);
      return fallback;
    }
  }
  return fallback;
}

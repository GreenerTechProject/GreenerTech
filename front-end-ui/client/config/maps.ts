// Google Maps Configuration for @react-google-maps/api
export const GOOGLE_MAPS_CONFIG = {
  API_KEY:
    import.meta.env.VITE_GOOGLE_MAPS_API_KEY ||
    "AIzaSyBP7rf64eUmkYTCuqXGeqOPdJZIyonDmYQ",
  LIBRARIES: ["drawing", "geometry", "places"] as const,
  DEFAULT_CENTER: { lat: 33.9716, lng: -6.8498 }, // Morocco center
  DEFAULT_ZOOM: 15,
  MAP_OPTIONS: {
    zoomControl: true,
    streetViewControl: false,
    mapTypeControl: true,
    fullscreenControl: true,
    mapTypeId: "satellite" as google.maps.MapTypeId,
  },
};

// Validate API key
export const validateGoogleMapsAPIKey = (): boolean => {
  const apiKey = GOOGLE_MAPS_CONFIG.API_KEY;
  return apiKey && apiKey !== "YOUR_GOOGLE_MAPS_API_KEY" && apiKey.length > 0;
};

// Get API key with validation
export const getGoogleMapsAPIKey = (): string => {
  if (!validateGoogleMapsAPIKey()) {
    console.warn(
      "Google Maps API key is not properly configured. Please set VITE_GOOGLE_MAPS_API_KEY in your .env file.",
    );
  }
  return GOOGLE_MAPS_CONFIG.API_KEY;
};

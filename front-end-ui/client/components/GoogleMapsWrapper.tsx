import React from "react";
import { LoadScript } from "@react-google-maps/api";
import { Loader2 } from "lucide-react";

const libraries: ("drawing" | "geometry" | "places" | "visualization")[] = [
  "drawing",
  "geometry",
  "places",
  "visualization",
];

interface GoogleMapsWrapperProps {
  children: React.ReactNode;
  apiKey: string;
}

export default function GoogleMapsWrapper({
  children,
  apiKey,
}: GoogleMapsWrapperProps) {
  console.log("GoogleMapsWrapper: API Key received:", apiKey ? "Present" : "Missing");
  
  // Check if Google Maps API is already loaded and properly initialized
  const isAlreadyLoaded = typeof window !== "undefined" && 
    (window as any).google && 
    (window as any).google.maps && 
    typeof (window as any).google.maps.Map === 'function';
  
  // Check if there was a previous loading error
  const hasLoadError = typeof window !== "undefined" && (window as any).googleMapsLoadError;
  
  if (!apiKey) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-sm text-red-600">Erreur: Clé API Google Maps manquante</p>
        </div>
      </div>
    );
  }

  // If there was a previous loading error, show error message
  if (hasLoadError) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-sm text-red-600">Erreur de chargement de Google Maps</p>
          <p className="text-xs text-gray-500 mt-1">Veuillez rafraîchir la page</p>
        </div>
      </div>
    );
  }

  // If Google Maps API is already properly loaded, use it directly
  if (isAlreadyLoaded) {
    console.log("GoogleMapsWrapper: Using existing Google Maps API");
    return <>{children}</>;
  }

  return (
    <LoadScript
      googleMapsApiKey={apiKey}
      libraries={libraries}
      loadingElement={
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
            <p className="text-sm text-gray-600">Chargement de la carte...</p>
          </div>
        </div>
      }
      onError={(error) => {
        console.error("Error loading Google Maps:", error);
        // Set a flag to prevent multiple load attempts
        if (typeof window !== "undefined") {
          (window as any).googleMapsLoadError = true;
        }
      }}
      onLoad={() => {
        console.log("Google Maps loaded successfully");
        // Clear any previous error flags
        if (typeof window !== "undefined") {
          (window as any).googleMapsLoadError = false;
        }
      }}
    >
      {children}
    </LoadScript>
  );
}

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
  const isAlreadyLoaded = typeof window !== "undefined" && (window as any).google && (window as any).google.maps;
  
  if (!apiKey) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-sm text-red-600">Erreur: Clé API Google Maps manquante</p>
        </div>
      </div>
    );
  }

  // If Google Maps API is already present on the page, avoid re-loading to prevent
  // "google api is already presented" errors from @react-google-maps/api.
  if (isAlreadyLoaded) {
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
      }}
      onLoad={() => {
        console.log("Google Maps loaded successfully");
      }}
    >
      {children}
    </LoadScript>
  );
}

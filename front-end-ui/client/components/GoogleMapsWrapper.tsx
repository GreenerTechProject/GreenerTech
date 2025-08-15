import React, { useState, useEffect } from "react";
import { LoadScript } from "@react-google-maps/api";
import { Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { useGoogleMaps } from "../hooks/useGoogleMaps";

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
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [scriptError, setScriptError] = useState(false);
  const { isLoaded: isGoogleMapsAvailable, hasError, error, retry } = useGoogleMaps();
  
  console.log("GoogleMapsWrapper: API Key received:", apiKey ? "Present" : "Missing");
  const isAlreadyLoaded = typeof window !== "undefined" && (window as any).google && (window as any).google.maps;
  
  useEffect(() => {
    // Check if Google Maps is already loaded
    if (isAlreadyLoaded) {
      setIsScriptLoaded(true);
    }
  }, [isAlreadyLoaded]);
  
  if (!apiKey) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-sm text-red-600">Erreur: Clé API Google Maps manquante</p>
          <p className="text-xs text-gray-500 mt-1">Vérifiez votre configuration</p>
        </div>
      </div>
    );
  }

  if (scriptError) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-sm text-red-600">Erreur lors du chargement du script Google Maps</p>
          <button 
            onClick={() => setScriptError(false)} 
            className="mt-2 px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 flex items-center gap-1 mx-auto"
          >
            <RefreshCw className="h-3 w-3" />
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-sm text-red-600">Erreur lors du chargement de Google Maps</p>
          <p className="text-xs text-gray-500 mt-1">{error}</p>
          <button 
            onClick={retry} 
            className="mt-2 px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 flex items-center gap-1 mx-auto"
          >
            <RefreshCw className="h-3 w-3" />
            Réessayer
          </button>
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
        console.error("Error loading Google Maps script:", error);
        setScriptError(true);
      }}
      onLoad={() => {
        console.log("Google Maps script loaded successfully");
        setIsScriptLoaded(true);
      }}
    >
      {isScriptLoaded && isGoogleMapsAvailable ? children : (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
            <p className="text-sm text-gray-600">
              {isScriptLoaded ? "Initialisation de la carte..." : "Chargement du script..."}
            </p>
          </div>
        </div>
      )}
    </LoadScript>
  );
}

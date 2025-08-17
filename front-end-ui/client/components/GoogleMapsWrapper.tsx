import React, { useState, useEffect } from "react";
import { LoadScript, useLoadScript } from "@react-google-maps/api";
import { GOOGLE_MAPS_CONFIG } from "@/config/maps";

interface GoogleMapsWrapperProps {
  children: React.ReactNode;
}

const libraries: ("drawing" | "geometry" | "places" | "visualization")[] = [
  "drawing",
  "geometry",
  "places",
  "visualization",
];

function GoogleMapsContent({ children }: { children: React.ReactNode }) {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: GOOGLE_MAPS_CONFIG.API_KEY,
    libraries,
  });

  if (loadError) {
    return (
      <div className="flex items-center justify-center h-full min-h-[500px]">
        <div className="text-center">
          <div className="text-red-500 text-lg mb-2">⚠️ Erreur de chargement</div>
          <p className="text-sm text-gray-600">Impossible de charger Google Maps</p>
          <p className="text-xs text-gray-500 mt-1">{loadError.message}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-3 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-full min-h-[500px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-sm text-gray-600">Chargement de Google Maps...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default function GoogleMapsWrapper({ children }: GoogleMapsWrapperProps) {
  return (
    <GoogleMapsContent>
      {children}
    </GoogleMapsContent>
  );
}

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

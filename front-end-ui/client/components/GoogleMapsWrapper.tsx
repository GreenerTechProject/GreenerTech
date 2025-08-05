import React from "react";
import { LoadScript } from "@react-google-maps/api";
import { Loader2 } from "lucide-react";

const libraries: ("drawing" | "geometry" | "places")[] = [
  "drawing",
  "geometry",
  "places",
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
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      }
      onError={(error) => {
        console.error("Error loading Google Maps:", error);
      }}
    >
      {children}
    </LoadScript>
  );
}

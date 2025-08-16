import React from "react";
import { LoadScript } from "@react-google-maps/api";
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

export default function GoogleMapsWrapper({ children }: GoogleMapsWrapperProps) {
  return (
    <LoadScript
      googleMapsApiKey={GOOGLE_MAPS_CONFIG.API_KEY}
      libraries={libraries}
    >
      {children}
    </LoadScript>
  );
}

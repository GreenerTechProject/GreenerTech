import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import GoogleMapsWrapper from "../components/GoogleMapsWrapper";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Plus,
  MapPin,
  Layers,
  Thermometer,
  Droplets,
  Sun,
  Bell,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getGoogleMapsAPIKey } from "@/config/maps";

interface Serre {
  id: string;
  nom: string;
  variety: string;
  surface: number;
  location: {
    lat: number;
    lng: number;
  };
  status: "active" | "inactive" | "maintenance";
  zones: Zone[];
  lastUpdate: Date;
  supervisedBy?: string;
  bilansCount?: number;
  assignedTechnicians?: {
    id: number;
    name: string;
    email?: string;
  }[];
}

interface Zone {
  id: string;
  name: string;
  type: "irrigation" | "temperature" | "lighting" | "ventilation";
  status: "optimal" | "warning" | "critical";
  value: number;
  unit: string;
  lastReading: Date;
}

const GOOGLE_MAPS_API_KEY = getGoogleMapsAPIKey();

const mockSerres: Serre[] = [
  {
    id: "1",
    nom: "Serre Nord A",
    variety: "Tomates",
    surface: 450,
    location: { lat: 46.7111, lng: 1.7191 },
    status: "active",
    lastUpdate: new Date(),
    supervisedBy: "Technicien Jean Dupont",
    zones: [
      {
        id: "z1",
        name: "Zone Irrigation",
        type: "irrigation",
        status: "optimal",
        value: 75,
        unit: "%",
        lastReading: new Date(),
      },
    ],
  },
  {
    id: "2",
    nom: "Serre Sud B",
    variety: "Concombres",
    surface: 320,
    location: { lat: 46.6991, lng: 1.7341 },
    status: "active",
    lastUpdate: new Date(),
    supervisedBy: "Technicien Marie Martin",
    zones: [],
  },
];

export default function TechnicienSupDashboard() {
  const { user, logout } = useAuth();
  const [serres, setSerres] = useState<Serre[]>(mockSerres);
  const [selectedSerre, setSelectedSerre] = useState<Serre | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const [isMobilePanelOpen, setIsMobilePanelOpen] = useState(false);

  // Initialize map
  useEffect(() => {
    if (map || !mapRef.current) return;

    const tryInit = () => {
      if (typeof google === 'undefined' || !google.maps) {
        return false;
      }
      
      const newMap = new google.maps.Map(mapRef.current!, {
        center: { lat: 46.7051, lng: 1.7191 },
        mapTypeId: google.maps.MapTypeId.SATELLITE,
        zoom: 13,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        styles: [
          { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
        ],
      });
      
      setMap(newMap);

      // Add markers for serres
      serres.forEach((serre) => {
        const marker = new google.maps.Marker({
          position: serre.location,
          map: newMap,
          title: serre.nom,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: serre.status === "active" ? "#B4CC5F" : "#ef4444",
            fillOpacity: 1,
            strokeWeight: 2,
            strokeColor: "#ffffff",
          },
        });

        marker.addListener("click", () => {
          setSelectedSerre(serre);
          smoothZoomToLocation(newMap, serre.location, 16);
        });
      });

      return true;
    };

    if (!tryInit()) {
      const id = window.setInterval(() => {
        if (tryInit()) {
          window.clearInterval(id);
        }
      }, 150);
      return () => window.clearInterval(id);
    }
  }, [map, mapRef.current, serres]);

  const smoothZoomToLocation = (
    map: google.maps.Map,
    location: { lat: number; lng: number },
    targetZoom: number,
  ) => {
    map.panTo(location);
    map.setZoom(targetZoom);
  };

  const handleSelectSerre = (serre: Serre) => {
    setSelectedSerre(serre);
    if (map) {
      smoothZoomToLocation(map, serre.location, 16);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 border-green-300";
      case "maintenance":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  return (
    <div className="h-[calc(100vh-73px)] relative">
      {/* Mobile Header */}
      <div className="lg:hidden absolute top-0 left-0 right-0 z-20 bg-white/95 backdrop-blur-sm border-b border-gray-200">
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobilePanelOpen(!isMobilePanelOpen)}
              className="p-2"
            >
              {isMobilePanelOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-red-500" />
              <span className="text-sm font-medium">Technicien Sup</span>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:flex h-full">
        {/* Left Panel: Serres list */}
        <div className="w-1/3 bg-white shadow-lg">
          <div className="h-full flex flex-col">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <MapPin className="h-5 w-5" />
                <span>Serres Supervisées ({serres.length})</span>
              </h3>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-3">
                {serres.map((serre) => (
                  <Card 
                    key={serre.id} 
                    className={cn(
                      "cursor-pointer transition-all duration-200 hover:shadow-md border", 
                      selectedSerre?.id === serre.id 
                        ? "ring-2 ring-[#B4CC5F] border-[#B4CC5F] shadow-md" 
                        : "border-gray-200 hover:border-[#B4CC5F]/50"
                    )} 
                    onClick={() => handleSelectSerre(serre)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-semibold text-gray-900">{serre.nom}</h4>
                          <p className="text-xs text-gray-600">Variété: {serre.variety || "—"}</p>
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs",
                          getStatusColor(serre.status),
                        )}
                      >
                        {serre.status === "active" ? "Actif" : "Inactif"}
                      </Badge>
                      <div className="space-y-2 text-sm text-gray-500 mt-2">
                        <div className="flex items-center justify-between">
                          <span>{serre.surface} m²</span>
                          <span>{serre.zones.length} zones</span>
                        </div>
                        {serre.supervisedBy && (
                          <div className="mt-2 pt-2 border-t border-gray-100">
                            <p className="text-xs text-blue-600">{serre.supervisedBy}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Right Panel: Map */}
        <div className="flex-1 relative">
          <GoogleMapsWrapper apiKey={GOOGLE_MAPS_API_KEY}>
            <div ref={mapRef} className="w-full h-full" />
          </GoogleMapsWrapper>

          {/* Map Overlay Info */}
          {selectedSerre && (
            <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-4 max-w-xs">
              <div className="flex items-center space-x-2 mb-2">
                <div
                  className={cn(
                    "w-3 h-3 rounded-full",
                    selectedSerre.status === "active" ? "bg-green-500" : "bg-red-500",
                  )}
                />
                <h4 className="font-semibold text-gray-900">{selectedSerre.nom}</h4>
              </div>
              <p className="text-sm text-gray-600 mb-1">{selectedSerre.variety}</p>
              <p className="text-xs text-gray-500">
                {selectedSerre.surface} m² • {selectedSerre.zones.length} zones
              </p>
              {selectedSerre.supervisedBy && (
                <p className="text-xs text-blue-600 mt-1">{selectedSerre.supervisedBy}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden h-full relative">
        <GoogleMapsWrapper apiKey={GOOGLE_MAPS_API_KEY}>
          <div ref={mapRef} className="w-full h-full" />
        </GoogleMapsWrapper>

        {/* Mobile Panel */}
        <div className={cn(
          "absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl transition-transform duration-300 ease-in-out z-20",
          isMobilePanelOpen ? "translate-y-0" : "translate-y-full"
        )}>
          <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto">
            {serres.map((serre) => (
              <Card 
                key={serre.id} 
                className="cursor-pointer"
                onClick={() => {
                  handleSelectSerre(serre);
                  setIsMobilePanelOpen(false);
                }}
              >
                <CardContent className="p-4">
                  <h4 className="font-semibold text-gray-900">{serre.nom}</h4>
                  <p className="text-sm text-gray-600">{serre.variety}</p>
                  <p className="text-xs text-gray-500">{serre.surface} m²</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Mobile Floating Button */}
        <div className="absolute bottom-6 right-4 z-10">
          <Button
            size="lg"
            className="h-14 w-14 rounded-full shadow-lg bg-[#B4CC5F] hover:bg-[#9BB84F] text-white"
            onClick={() => setIsMobilePanelOpen(!isMobilePanelOpen)}
          >
            {isMobilePanelOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import GoogleMapsWrapper from "../components/GoogleMapsWrapper";
import { GoogleMap, Marker, InfoWindow } from "@react-google-maps/api";
import PageHeader from "../components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import {
  Plus,
  MapPin,
  Layers,
  Thermometer,
  Droplets,
  Sun,
  Sprout,
  Calendar,
  Bell,
  LogOut,
  FileText,
  AlertCircle,
} from "lucide-react";
import TechnicianSidebar from "../components/TechnicianSidebar";
import InterventionForm from "../components/InterventionForm";
import TechHeader from "../components/TechHeader";
import BilanCreation from "../components/BilanCreation";
import BilanMapComponent from "../components/BilanMapComponent";
import { cn } from "@/lib/utils";
import { getGoogleMapsAPIKey } from "@/config/maps";

import { bilanService, Bilan } from "../services/bilanService";
import { serreService } from "../services/serreService";

interface Serre {
  id: string;
  nom: string;
  variety?: string;
  surface?: number;
  location: {
    lat: number;
    lng: number;
  };
  status: "active" | "inactive" | "maintenance";
  zones: Zone[];
  lastUpdate: Date;
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

interface Intervention {
  id: string;
  type: string;
  serreId: string;
  date: string;
  description: string;
  priority: "basse" | "moyenne" | "haute" | "urgente";
  status: "pending" | "in_progress" | "completed";
}

const GOOGLE_MAPS_API_KEY = getGoogleMapsAPIKey();

export default function TechnicianDashboard() {
  const { user, logout } = useAuth();
  const [serres, setSerres] = useState<Serre[]>([]);
  const [selectedSerre, setSelectedSerre] = useState<Serre | null>(null);
  const [isCreatingBilan, setIsCreatingBilan] = useState(false);
  const [bilans, setBilans] = useState<Bilan[]>([]);
  const [isLoadingBilans, setIsLoadingBilans] = useState(false);
  const [isLoadingSerres, setIsLoadingSerres] = useState(true);
  const [serresError, setSerresError] = useState<string | null>(null);
  const [isCreatingIntervention, setIsCreatingIntervention] = useState(false);
  const [isInterventionFormOpen, setIsInterventionFormOpen] = useState(false);
  const [selectedIntervention, setSelectedIntervention] = useState<Intervention | null>(null);

  // Load serres assigned to the current technician
  useEffect(() => {
    const loadAssignedSerres = async () => {
      if (!user) return;
      
      try {
        setIsLoadingSerres(true);
        setSerresError(null);
        
        console.log('Loading serres for technician:', user.id);
        const assignedSerres = await serreService.getSerresByCurrentUser();
        
        // Transform the backend data to match our Serre interface
        const transformedSerres: Serre[] = assignedSerres.map((serre: any) => ({
          id: serre.id?.toString() || serre.id_serre?.toString() || '',
          nom: serre.nom || 'Serre sans nom',
          variety: serre.variety || serre.variete || 'Variété non spécifiée',
          surface: serre.surface || 0,
          location: {
            lat: serre.center?.lat || serre.latitude || serre.lat || 46.7051,
            lng: serre.center?.lng || serre.longitude || serre.lng || 1.7291,
          },
          status: serre.status || 'active',
          zones: serre.zones || [], // Backend might not have zones data
          lastUpdate: new Date(),
        }));
        
        console.log('Transformed serres:', transformedSerres);
        setSerres(transformedSerres);
        
        // If there are serres, select the first one by default
        if (transformedSerres.length > 0 && !selectedSerre) {
          setSelectedSerre(transformedSerres[0]);
        }
      } catch (error: any) {
        console.error('Error loading assigned serres:', error);
        setSerresError(error.message || 'Erreur lors du chargement des serres assignées');
        setSerres([]);
      } finally {
        setIsLoadingSerres(false);
      }
    };

    loadAssignedSerres();
  }, [user]);

  // Load bilans for selected serre
  useEffect(() => {
    if (selectedSerre) {
      loadBilansForSerre(parseInt(selectedSerre.id));
    } else {
      setBilans([]); // Reset bilans when no serre is selected
    }
  }, [selectedSerre]);

  const loadBilansForSerre = async (serreId: number) => {
    try {
      setIsLoadingBilans(true);
      console.log('Loading bilans for serre:', serreId);
      console.log('Current user:', user);
      console.log('User role:', user?.role);
      
      const serreBilans = await bilanService.getBilansBySerre(serreId);
      console.log('Received bilans:', serreBilans);
      
      // Ensure we always set an array, even if the API returns unexpected data
      if (Array.isArray(serreBilans)) {
        setBilans(serreBilans);
      } else {
        console.warn('Expected array of bilans, got:', serreBilans);
        setBilans([]);
      }
    } catch (error: any) {
      console.error('Error loading bilans:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.status,
        response: error.response
      });
      setBilans([]); // Set empty array on error
    } finally {
      setIsLoadingBilans(false);
    }
  };

  const handleBilanCreated = async () => {
    if (selectedSerre) {
      await loadBilansForSerre(parseInt(selectedSerre.id));
    }
    setIsCreatingBilan(false);
  };



  const smoothZoomToLocation = (
    map: any,
    location: { lat: number; lng: number },
    targetZoom: number,
  ) => {
    map.panTo(location);

    const currentZoom = map.getZoom() || 13;
    let zoom = currentZoom;

    const zoomInterval = setInterval(() => {
      if (zoom < targetZoom) {
        zoom += 1;
        map.setZoom(zoom);
      } else {
        clearInterval(zoomInterval);
      }
    }, 150);
  };

  const handleSelectSerre = (serre: Serre) => {
    setSelectedSerre(serre);
    setIsCreatingBilan(false);
    loadBilansForSerre(parseInt(serre.id));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "optimal":
        return "bg-green-100 text-green-800 border-green-300";
      case "warning":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "critical":
        return "bg-red-100 text-red-800 border-red-300";
      case "active":
        return "bg-green-100 text-green-800 border-green-300";
      case "maintenance":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "planted":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "growing":
        return "bg-green-100 text-green-800 border-green-300";
      case "ready":
        return "bg-purple-100 text-purple-800 border-purple-300";
      case "harvested":
        return "bg-orange-100 text-orange-800 border-orange-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const handleInterventionSubmit = (data: any) => {
    console.log("Intervention submitted:", data);
    // TODO: Send to backend API
    // Here you would typically call an API to save the intervention
  };

  const handleInterventionSaveDraft = (data: any) => {
    console.log("Intervention saved as draft:", data);
    // TODO: Save draft to backend or local storage
  };

  const getZoneIcon = (type: string) => {
    switch (type) {
      case "irrigation":
        return <Droplets className="h-4 w-4" />;
      case "temperature":
        return <Thermometer className="h-4 w-4" />;
      case "lighting":
        return <Sun className="h-4 w-4" />;
      case "ventilation":
        return <Layers className="h-4 w-4" />;
      default:
        return <MapPin className="h-4 w-4" />;
    }
  };

  const totalSerres = serres.length;
  const totalZones = serres.reduce(
    (total, serre) => total + serre.zones.length,
    0,
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <TechHeader role="technicien" />

      <div className="flex flex-col lg:flex-row h-[calc(100vh-73px)]">

        {/* Left Control Panel */}
        <div className="w-full lg:w-96 bg-white shadow-lg max-h-[50vh] lg:max-h-full">
          <ScrollArea className="h-full">
            <div className="p-6 space-y-6">
              {/* Create New Bilan Section - Always Visible */}
              <Card className="border-dashed border-2 border-gray-200 hover:border-blue-500 transition-colors">
                  <CardContent className="p-4">
                  {!isCreatingBilan ? (
                      <Button
                      onClick={() => setIsCreatingBilan(true)}
                        variant="ghost"
                      className="w-full h-16 border-0 text-gray-600 hover:text-blue-500 hover:bg-blue-50"
                      >
                        <div className="flex flex-col items-center space-y-2">
                          <Sprout className="h-6 w-6" />
                          <span className="text-sm font-medium">
                          Créer un nouveau bilan
                          </span>
                          <span className="text-xs text-gray-500">
                          {selectedSerre ? `pour ${selectedSerre.nom}` : "Sélectionnez une serre d'abord"}
                          </span>
                        </div>
                      </Button>
                    ) : (
                      <div className="space-y-3">
                        <h4 className="font-medium text-gray-900">
                        Nouveau bilan - {selectedSerre?.nom || 'Sélectionnez une serre'}
                        </h4>
                      <p className="text-sm text-gray-600">
                        Utilisez le formulaire de création de bilan qui s'affiche à droite.
                      </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

              {/* Bilan Creation Form */}
              {selectedSerre && isCreatingBilan && (
                <BilanCreation
                  serreId={parseInt(selectedSerre.id)}
                  serreName={selectedSerre.nom}
                  serreLocation={selectedSerre.location}
                  onBilanCreated={handleBilanCreated}
                  onCancel={() => setIsCreatingBilan(false)}
                />
              )}

              {/* Serres List */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                  <MapPin className="h-5 w-5" />
                  <span>Mes Serres ({serres.length})</span>
                </h3>

                {isLoadingSerres ? (
                  <div className="text-center py-6 text-gray-500">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                    <p>Chargement des serres...</p>
                  </div>
                ) : serresError ? (
                  <div className="text-center py-6 text-red-500">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                    <p>{serresError}</p>
                    <p className="text-sm">Veuillez réessayer plus tard.</p>
                  </div>
                ) : serres.length === 0 ? (
                  <div className="text-center py-6 text-gray-500">
                    <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Aucune serre assignée à votre compte.</p>
                    <p className="text-sm">Votre administrateur doit vous assigner des serres.</p>
                  </div>
                ) : (
                  serres.map((serre) => (
                    <Card
                      key={serre.id}
                      className={cn(
                        "cursor-pointer transition-all duration-200 hover:shadow-md border",
                        selectedSerre?.id === serre.id
                          ? "ring-2 ring-[#B4CC5F] border-[#B4CC5F] shadow-md"
                          : "border-gray-200 hover:border-[#B4CC5F]/50",
                      )}
                      onClick={() => handleSelectSerre(serre)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-semibold text-gray-900">
                              {serre.nom}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {serre.variety}
                            </p>
                          </div>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-xs",
                              getStatusColor(serre.status),
                            )}
                          >
                            {serre.status === "active"
                              ? "Actif"
                              : serre.status === "maintenance"
                                ? "Maintenance"
                                : "Inactif"}
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <span>{serre.surface} m²</span>
                          <span>Bilans: {serre.zones.length}</span>
                        </div>

                        {serre.zones.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1">
                            {serre.zones.slice(0, 3).map((zone) => (
                              <div
                                key={zone.id}
                                className={cn(
                                  "flex items-center space-x-1 px-2 py-1 rounded-full text-xs border",
                                  getStatusColor(zone.status),
                                )}
                              >
                                {getZoneIcon(zone.type)}
                                <span>{zone.name}</span>
                              </div>
                            ))}
                            {serre.zones.length > 3 && (
                              <div className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                                +{serre.zones.length - 3}
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>

              {/* Serre Details */}
              {selectedSerre && (
                    <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-semibold text-gray-900">
                      {selectedSerre.nom}
                    </h4>
                    <Badge
                      variant="outline"
                      className={cn("text-xs", getStatusColor(selectedSerre.status))}
                    >
                      {selectedSerre.status === "active"
                        ? "Actif"
                        : selectedSerre.status === "maintenance"
                          ? "Maintenance"
                          : "Inactif"}
                    </Badge>
                  </div>

                  <div className="text-sm text-gray-600">
                    {selectedSerre.surface} m² • Zones: {selectedSerre.zones ? selectedSerre.zones.length : 0}
                  </div>

                  {/* Zones List */}
                  {selectedSerre.zones && selectedSerre.zones.length > 0 && (
                    <div className="space-y-2">
                      <h5 className="font-medium text-gray-900">
                        Zones ({selectedSerre.zones.length})
                      </h5>
                      {selectedSerre.zones.map((zone) => (
                        <div
                          key={zone.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center space-x-2">
                            {getZoneIcon(zone.type)}
                        <div>
                              <h6 className="font-medium text-gray-900">
                                {zone.name}
                              </h6>
                              <p className="text-sm text-gray-600">
                                {zone.value} {zone.unit}
                              </p>
                            </div>
                          </div>
                          <Badge
                            variant="outline"
                            className={cn("text-xs", getStatusColor(zone.status))}
                          >
                            {zone.status}
                          </Badge>
                        </div>
                      ))}
                        </div>
                  )}
                      </div>
              )}

            </div>
          </ScrollArea>
        </div>

        {/* Right Map Section */}
        <div className="flex-1 relative min-h-[50vh] lg:min-h-full" data-testid="map-section">
          {isCreatingBilan && selectedSerre ? (
            <BilanMapComponent
              serreLocation={selectedSerre.location}
              selectedPoints={[]}
              currentLocation={null}
              isTracking={false}
              className="h-full"
            />
          ) : selectedSerre ? (
          <GoogleMapsWrapper apiKey={GOOGLE_MAPS_API_KEY}>
              <GoogleMap
                mapContainerStyle={{
                  width: "100%",
                  height: "100%",
                }}
                center={selectedSerre.location}
                zoom={15}
                onLoad={(map) => {
                  if (map) {
                    smoothZoomToLocation(map, selectedSerre.location, 16);
                  }
                }}
                options={{
                  mapTypeId: "satellite",
                  tilt: 0,
                  streetViewControl: false,
                  fullscreenControl: true,
                  mapTypeControl: true,
                  zoomControl: true,
                  scaleControl: true,
                }}
              >
                {/* Serre Marker */}
                <Marker
                  position={selectedSerre.location}
                  title={selectedSerre.nom}
                />

                {/* Serre Info Window */}
                <InfoWindow
                  position={selectedSerre.location}
                >
                  <div className="p-2">
                    <h3 className="font-semibold text-gray-900 text-sm">
                  {selectedSerre.nom}
                    </h3>
                    <p className="text-xs text-gray-600">
                {selectedSerre.variety}
              </p>
              <p className="text-xs text-gray-500">
                      {selectedSerre.surface} m² • Zones: {selectedSerre.zones ? selectedSerre.zones.length : 0}
                    </p>
                  </div>
                </InfoWindow>
              </GoogleMap>
            </GoogleMapsWrapper>
          ) : (
            <div className="flex items-center justify-center h-full bg-gray-100">
              <div className="text-center text-gray-500">
                <MapPin className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">Sélectionnez une serre</p>
                <p className="text-sm">Choisissez une serre dans la liste pour voir sa localisation</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Intervention Form Modal */}
      <InterventionForm
        isOpen={isInterventionFormOpen}
        onClose={() => setIsInterventionFormOpen(false)}
        onSubmit={handleInterventionSubmit}
        onSaveDraft={handleInterventionSaveDraft}
      />
    </div>
  );
}

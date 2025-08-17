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
  BookOpen,
  BarChart3,
} from "lucide-react";
import TechnicianSidebar from "../components/TechnicianSidebar";
import InterventionForm from "../components/InterventionForm";
import TechHeader from "../components/TechHeader";
import BilanCreation from "../components/BilanCreation";
import BilanMapComponent from "../components/BilanMapComponent";
import { cn } from "@/lib/utils";
import { bilanService, Bilan } from "../services/bilanService";
import { serreService } from "../services/serreService";
import { guideService, GuideDeCulture } from "../services/guideService";
import { etatBilanService, EtatBilan } from "../services/etatBilanService";

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



export default function TechnicianMap() {
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

  // New state for enhanced features
  const [guides, setGuides] = useState<GuideDeCulture[]>([]);
  const [selectedBilan, setSelectedBilan] = useState<Bilan | null>(null);
  const [etatBilans, setEtatBilans] = useState<EtatBilan[]>([]);
  const [isLoadingGuides, setIsLoadingGuides] = useState(false);
  const [isLoadingEtatBilans, setIsLoadingEtatBilans] = useState(false);

  // Mobile responsive state
  const [isMobilePanelOpen, setIsMobilePanelOpen] = useState(false);
  const [activeMobileTab, setActiveMobileTab] = useState<'serres' | 'bilan' | 'details' | 'guides' | 'etat'>('serres');

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

  // Load bilans and guides for selected serre
  useEffect(() => {
    if (selectedSerre) {
      loadBilansForSerre(parseInt(selectedSerre.id));
      loadGuidesForSerre(parseInt(selectedSerre.id));
    } else {
      setBilans([]); // Reset bilans when no serre is selected
      setGuides([]); // Reset guides when no serre is selected
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

  // Load guides for selected serre
  const loadGuidesForSerre = async (serreId: number) => {
    try {
      setIsLoadingGuides(true);
      console.log('Loading guides for serre:', serreId);
      
      const serreGuides = await guideService.getGuides();
      // Filter guides for the specific serre
      const filteredGuides = serreGuides.filter(guide => guide.id_serre === serreId.toString());
      console.log('Filtered guides for serre:', filteredGuides);
      
      setGuides(filteredGuides);
    } catch (error: any) {
      console.error('Error loading guides:', error);
      setGuides([]);
    } finally {
      setIsLoadingGuides(false);
    }
  };

  // Load etat de bilan for selected bilan
  const loadEtatBilanForBilan = async (bilanId: number) => {
    try {
      setIsLoadingEtatBilans(true);
      console.log('Loading etat de bilan for bilan:', bilanId);
      
      const etatBilanData = await etatBilanService.getEtatBilanByBilan(bilanId);
      console.log('Received etat de bilan:', etatBilanData);
      
      setEtatBilans(etatBilanData);
    } catch (error: any) {
      console.error('Error loading etat de bilan:', error);
      setEtatBilans([]);
    } finally {
      setIsLoadingEtatBilans(false);
    }
  };

  // Handle bilan selection
  const handleBilanSelect = (bilan: Bilan) => {
    setSelectedBilan(bilan);
    loadEtatBilanForBilan(bilan.id);
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

        {/* Left Control Panel - Hidden on mobile, visible on desktop */}
        <div className="hidden lg:block lg:w-96 bg-white shadow-lg max-h-[50vh] lg:max-h-full">
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

              {/* Culture Guides Section */}
              {selectedSerre && (
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                    <BookOpen className="h-5 w-5" />
                    <span>Guide de Culture</span>
                  </h4>
                  
                  {isLoadingGuides ? (
                    <div className="text-center py-4 text-gray-500">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-2"></div>
                      <p className="text-sm">Chargement des guides...</p>
                    </div>
                  ) : guides.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">
                      <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Aucun guide de culture disponible</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {guides.map((guide) => (
                        <Card key={guide.id} className="border-gray-200">
                          <CardContent className="p-4">
                            <div className="space-y-2">
                              <h5 className="font-medium text-gray-900">{guide.nom}</h5>
                              <p className="text-sm text-gray-600">Variété: {guide.variete}</p>
                              <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                                <span>Rendement: {guide.rendement} kg</span>
                                <span>Plants: {guide.nombre_de_plants}</span>
                                <span>Début: {new Date(guide.date_debut_saison).toLocaleDateString()}</span>
                                <span>Fin: {new Date(guide.date_fin_saison).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Bilans Section */}
              {selectedSerre && (
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                    <FileText className="h-5 w-5" />
                    <span>Bilans ({bilans.length})</span>
                  </h4>
                  
                  {isLoadingBilans ? (
                    <div className="text-center py-4 text-gray-500">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-2"></div>
                      <p className="text-sm">Chargement des bilans...</p>
                    </div>
                  ) : bilans.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">
                      <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Aucun bilan disponible</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {bilans.map((bilan) => (
                        <Card 
                          key={bilan.id} 
                          className={cn(
                            "cursor-pointer transition-all duration-200 hover:shadow-md border",
                            selectedBilan?.id === bilan.id
                              ? "ring-2 ring-[#B4CC5F] border-[#B4CC5F] shadow-md"
                              : "border-gray-200 hover:border-[#B4CC5F]/50",
                          )}
                          onClick={() => handleBilanSelect(bilan)}
                        >
                          <CardContent className="p-4">
                            <div className="space-y-2">
                              <h5 className="font-medium text-gray-900">{bilan.nom}</h5>
                              <p className="text-sm text-gray-600">Surface: {bilan.surface || 'Non calculée'} m²</p>
                              <p className="text-xs text-gray-500">
                                Points GPS: {bilan.position?.length || 0}
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Etat de Bilan Section */}
              {selectedBilan && (
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5" />
                    <span>État du Bilan: {selectedBilan.nom}</span>
                  </h4>
                  
                  {isLoadingEtatBilans ? (
                    <div className="text-center py-4 text-gray-500">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-2"></div>
                      <p className="text-sm">Chargement de l'état...</p>
                    </div>
                  ) : etatBilans.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">
                      <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Aucun état de bilan disponible</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {etatBilans.map((etat) => (
                        <Card key={etat.id} className="border-gray-200">
                          <CardContent className="p-4">
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-900">
                                  {new Date(etat.date).toLocaleDateString()}
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  État
                                </Badge>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-3 text-sm">
                                <div className="space-y-1">
                                  <p className="text-gray-600">Tomates saines: <span className="font-medium text-green-600">{etat.nombre_tomates_non_maladies}</span></p>
                                  <p className="text-gray-600">Tomates malades: <span className="font-medium text-red-600">{etat.nombre_tomates_maladies}</span></p>
                                  <p className="text-gray-600">Maladie type 1: <span className="font-medium text-orange-600">{etat.nombre_malade1}</span></p>
                                  <p className="text-gray-600">Maladie type 2: <span className="font-medium text-orange-600">{etat.nombre_malade2}</span></p>
                                </div>
                                
                                {etat.temperature && (
                                  <div className="space-y-1">
                                    <p className="text-gray-600">Température: <span className="font-medium">{etat.temperature}°C</span></p>
                                    <p className="text-gray-600">Humidité: <span className="font-medium">{etat.humidite || 'N/A'}%</span></p>
                                    <p className="text-gray-600">Luminosité: <span className="font-medium">{etat.luminosite || 'N/A'} lux</span></p>
                                    <p className="text-gray-600">CO2: <span className="font-medium">{etat.co2 || 'N/A'} ppm</span></p>
                                  </div>
                                )}
                              </div>
                              
                              {etat.rendement && (
                                <div className="pt-2 border-t border-gray-200">
                                  <p className="text-sm font-medium text-gray-900">
                                    Rendement estimé: {etat.rendement} kg
                                  </p>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </div>
          </ScrollArea>
        </div>

        {/* Right Map Section - Full screen on mobile */}
        <div className="flex-1 relative min-h-[calc(100vh-73px)] lg:min-h-full" data-testid="map-section">
          {isCreatingBilan && selectedSerre ? (
            <BilanMapComponent
              serreLocation={selectedSerre.location}
              selectedPoints={[]}
              currentLocation={null}
              isTracking={false}
              className="h-full"
            />
          ) : selectedSerre ? (
          <GoogleMapsWrapper>
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
                
                {/* Mobile Serre Selection */}
                <div className="lg:hidden mt-6 space-y-3">
                  <Button
                    onClick={() => setIsMobilePanelOpen(true)}
                    className="bg-[#B4CC5F] hover:bg-[#B4CC5F]/90 text-white px-6 py-3 rounded-lg w-full"
                  >
                    <MapPin className="h-5 w-5 mr-2" />
                    Voir mes serres
                  </Button>
                  <p className="text-xs text-gray-400">
                    Utilisez le bouton flottant en bas à droite pour accéder à vos serres
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Interface */}
      <div className="lg:hidden">
        {/* Mobile Header Overlay */}
        {selectedSerre && (
          <div className="fixed top-20 left-4 right-4 z-40">
            <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-gray-900 truncate">
                    {selectedSerre.nom}
                  </h3>
                  <p className="text-sm text-gray-600 truncate">
                    {selectedSerre.variety} • {selectedSerre.surface} m²
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMobilePanelOpen(!isMobilePanelOpen)}
                  className="ml-3 p-2"
                >
                  {isMobilePanelOpen ? 'Fermer' : 'Ouvrir'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Bottom Panel */}
        <div
          className={cn(
            "fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 transition-transform duration-300 ease-in-out z-30 shadow-2xl",
            isMobilePanelOpen ? "translate-y-0" : "translate-y-full"
          )}
          style={{ maxHeight: "70vh" }}
        >
          <div className="p-6">
            {/* Panel Handle */}
            <div className="flex justify-center mb-6">
              <div className="w-16 h-1.5 bg-gray-400 rounded-full"></div>
            </div>

            {/* Mobile Tabs */}
            <div className="flex space-x-2 mb-6 bg-gray-100 rounded-xl p-2">
              {[
                { key: 'serres', label: 'Serres', icon: MapPin },
                { key: 'bilan', label: 'Bilans', icon: FileText },
                { key: 'guides', label: 'Guides', icon: BookOpen },
                { key: 'etat', label: 'État', icon: BarChart3 },
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveMobileTab(key as any)}
                  className={cn(
                    "flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 min-h-[44px]",
                    activeMobileTab === key
                      ? "bg-white text-[#B4CC5F] shadow-md border border-[#B4CC5F]/20"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>

            {/* Mobile Tab Content */}
            <div className="space-y-4 max-h-[45vh] overflow-y-auto pb-4">
              {activeMobileTab === 'serres' && (
                <div className="space-y-3">
                  {serres.map((serre) => (
                    <Card
                      key={serre.id}
                      className={cn(
                        "cursor-pointer transition-all duration-200",
                        selectedSerre?.id === serre.id
                          ? "ring-2 ring-[#B4CC5F] border-[#B4CC5F]"
                          : "border-gray-200"
                      )}
                      onClick={() => {
                        handleSelectSerre(serre);
                        setIsMobilePanelOpen(false);
                      }}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-sm">{serre.nom}</h4>
                            <p className="text-xs text-gray-600">{serre.variety}</p>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {serre.surface} m²
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {activeMobileTab === 'bilan' && selectedSerre && (
                <div className="space-y-3">
                  {bilans.map((bilan) => (
                    <Card
                      key={bilan.id}
                      className={cn(
                        "cursor-pointer transition-all duration-200",
                        selectedBilan?.id === bilan.id
                          ? "ring-2 ring-[#B4CC5F] border-[#B4CC5F]"
                          : "border-gray-200"
                      )}
                      onClick={() => handleBilanSelect(bilan)}
                    >
                      <CardContent className="p-3">
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm">{bilan.nom}</h4>
                          <p className="text-xs text-gray-600">
                            Surface: {bilan.surface || 'Non calculée'} m²
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {activeMobileTab === 'guides' && selectedSerre && (
                <div className="space-y-3">
                  {guides.map((guide) => (
                    <Card key={guide.id} className="border-gray-200">
                      <CardContent className="p-3">
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm">{guide.nom}</h4>
                          <p className="text-xs text-gray-600">Variété: {guide.variete}</p>
                          <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                            <span>Rendement: {guide.rendement} kg</span>
                            <span>Plants: {guide.nombre_de_plants}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {activeMobileTab === 'etat' && selectedBilan && (
                <div className="space-y-3">
                  {etatBilans.map((etat) => (
                    <Card key={etat.id} className="border-gray-200">
                      <CardContent className="p-3">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium">
                              {new Date(etat.date).toLocaleDateString()}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              État
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <span className="text-green-600">Saines: {etat.nombre_tomates_non_maladies}</span>
                            <span className="text-red-600">Malades: {etat.nombre_tomates_maladies}</span>
                            <span className="text-orange-600">Type 1: {etat.nombre_malade1}</span>
                            <span className="text-orange-600">Type 2: {etat.nombre_malade2}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Floating Action Button */}
        <Button
          onClick={() => setIsMobilePanelOpen(!isMobilePanelOpen)}
          className="fixed bottom-6 right-6 w-16 h-16 rounded-full shadow-2xl bg-[#B4CC5F] hover:bg-[#B4CC5F]/90 text-white z-40 text-2xl font-bold transition-all duration-200 hover:scale-110"
        >
          {isMobilePanelOpen ? '×' : '≡'}
        </Button>

        {/* Mobile Quick Access - Show when serre selected but panel closed */}
        {selectedSerre && !isMobilePanelOpen && (
          <div className="fixed bottom-6 left-6 z-40">
            <Button
              variant="outline"
              onClick={() => setIsMobilePanelOpen(true)}
              className="bg-white/95 backdrop-blur-sm border-gray-200 shadow-lg hover:bg-white px-4 py-2 rounded-lg"
            >
              <FileText className="h-4 w-4 mr-2" />
              Bilans
            </Button>
          </div>
        )}
      </div>

      {/* Intervention Form Modal */}
      <InterventionForm
        isOpen={isInterventionFormOpen}
        onClose={() => setIsInterventionFormOpen(false)}
        onSubmit={handleInterventionSubmit}
      />
    </div>
  );
}

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import GoogleMapsWrapper from "../components/GoogleMapsWrapper";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  Users,
  LogOut,
  Shield,
  Bell,
} from "lucide-react";
import TechnicianSidebar from "../components/TechnicianSidebar";
import InterventionForm from "../components/InterventionForm";
import { cn } from "@/lib/utils";
import { getGoogleMapsAPIKey } from "@/config/maps";

interface Serre {
  id: string;
  name: string;
  variety: string;
  area: number;
  location: {
    lat: number;
    lng: number;
  };
  status: "active" | "inactive" | "maintenance";
  zones: Zone[];
  lastUpdate: Date;
  supervisedBy?: string;
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
    name: "Serre Nord A",
    variety: "Tomates",
    area: 450,
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
      {
        id: "z2",
        name: "Température",
        type: "temperature",
        status: "warning",
        value: 28.5,
        unit: "°C",
        lastReading: new Date(),
      },
      {
        id: "z3",
        name: "Éclairage",
        type: "lighting",
        status: "optimal",
        value: 85,
        unit: "%",
        lastReading: new Date(),
      },
    ],
  },
  {
    id: "2",
    name: "Serre Sud B",
    variety: "Concombres",
    area: 320,
    location: { lat: 46.6991, lng: 1.7341 },
    status: "active",
    lastUpdate: new Date(),
    supervisedBy: "Technicien Marie Martin",
    zones: [
      {
        id: "z4",
        name: "Zone Irrigation",
        type: "irrigation",
        status: "critical",
        value: 45,
        unit: "%",
        lastReading: new Date(),
      },
      {
        id: "z5",
        name: "Ventilation",
        type: "ventilation",
        status: "optimal",
        value: 65,
        unit: "%",
        lastReading: new Date(),
      },
    ],
  },
  {
    id: "3",
    name: "Serre Est C",
    variety: "Laitues",
    area: 280,
    location: { lat: 46.7051, lng: 1.7441 },
    status: "maintenance",
    lastUpdate: new Date(),
    supervisedBy: "Technicien Paul Bernard",
    zones: [
      {
        id: "z6",
        name: "Température",
        type: "temperature",
        status: "optimal",
        value: 22.1,
        unit: "°C",
        lastReading: new Date(),
      },
    ],
  },
  {
    id: "4",
    name: "Serre Ouest D",
    variety: "Poivrons",
    area: 380,
    location: { lat: 46.7121, lng: 1.7141 },
    status: "active",
    lastUpdate: new Date(),
    supervisedBy: "Technicien Sophie Blanc",
    zones: [
      {
        id: "z7",
        name: "Zone Irrigation",
        type: "irrigation",
        status: "optimal",
        value: 82,
        unit: "%",
        lastReading: new Date(),
      },
      {
        id: "z8",
        name: "Température",
        type: "temperature",
        status: "optimal",
        value: 24.2,
        unit: "°C",
        lastReading: new Date(),
      },
    ],
  },
];

export default function TechnicienSupDashboard() {
  const { user, logout } = useAuth();
  const [serres, setSerres] = useState<Serre[]>(mockSerres);
  const [selectedSerre, setSelectedSerre] = useState<Serre | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newSerreName, setNewSerreName] = useState("");
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedTechnician, setSelectedTechnician] = useState("");
  const [isInterventionFormOpen, setIsInterventionFormOpen] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);

  // Mock technicians list
  const mockTechnicians = [
    { id: "tech1", name: "Jean Dupont", email: "jean.dupont@example.com" },
    { id: "tech2", name: "Marie Martin", email: "marie.martin@example.com" },
    { id: "tech3", name: "Paul Bernard", email: "paul.bernard@example.com" },
    { id: "tech4", name: "Sophie Durand", email: "sophie.durand@example.com" },
  ];

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || map) return;

    const newMap = new google.maps.Map(mapRef.current, {
      center: { lat: 46.7051, lng: 1.7291 },
      zoom: 13,
      mapTypeId: google.maps.MapTypeId.SATELLITE,
      styles: [
        {
          featureType: "poi",
          elementType: "labels",
          stylers: [{ visibility: "off" }],
        },
      ],
    });

    setMap(newMap);

    // Add markers for all serres
    serres.forEach((serre) => {
      const marker = new google.maps.Marker({
        position: serre.location,
        map: newMap,
        title: serre.name,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor:
            serre.status === "active"
              ? "#B4CC5F"
              : serre.status === "maintenance"
                ? "#f59e0b"
                : "#ef4444",
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
  }, [mapRef.current]);

  const smoothZoomToLocation = (
    map: google.maps.Map,
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
    if (map) {
      smoothZoomToLocation(map, serre.location, 16);
    }
  };

  const handleCreateNewSerre = () => {
    if (newSerreName.trim()) {
      const newSerre: Serre = {
        id: Date.now().toString(),
        name: newSerreName,
        variety: "Non défini",
        area: 0,
        location: { lat: 46.7051, lng: 1.7291 },
        status: "inactive",
        zones: [],
        lastUpdate: new Date(),
        supervisedBy: "À assigner",
      };

      setSerres([...serres, newSerre]);
      setNewSerreName("");
      setIsCreatingNew(false);
      setSelectedSerre(newSerre);
    }
  };

  const handleAssignTechnician = () => {
    if (selectedTechnician && selectedSerre) {
      const technicianName =
        mockTechnicians.find((t) => t.id === selectedTechnician)?.name ||
        selectedTechnician;

      setSerres((prev) =>
        prev.map((serre) =>
          serre.id === selectedSerre.id
            ? { ...serre, supervisedBy: `Technicien ${technicianName}` }
            : serre,
        ),
      );

      setSelectedSerre((prev) =>
        prev ? { ...prev, supervisedBy: `Technicien ${technicianName}` } : prev,
      );

      setIsAssignDialogOpen(false);
      setSelectedTechnician("");
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
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              {/* Sidebar Button */}
              <TechnicianSidebar
                userRole="technicien_sup"
                onInterventionClick={() => setIsInterventionFormOpen(true)}
              />
              <div className="flex items-center space-x-2 ml-4">
                <Shield className="h-6 w-6 text-[#B4CC5F]" />
                <h1 className="text-xl font-semibold text-gray-900">
                  Tableau de Bord Technicien Supérieur
                </h1>
              </div>
              <Badge
                variant="outline"
                className="bg-blue-50 border-blue-200 text-blue-700"
              >
                {serres.filter((s) => s.status === "active").length} Serres
                Supervisées
              </Badge>
              <Button
                onClick={() => setIsInterventionFormOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                size="sm"
              >
                <Bell className="h-4 w-4 mr-2" />
                Nouvelle Intervention
              </Button>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 hidden sm:block">
                {user?.name || user?.email}
              </span>
              <Badge
                variant="outline"
                className="bg-purple-50 border-purple-200 text-purple-700"
              >
                Technicien Supérieur
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => logout()}
                className="flex items-center space-x-1"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Déconnexion</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-73px)]">
        {/* Left Control Panel */}
        <div className="w-full lg:w-96 bg-white shadow-lg">
          <ScrollArea className="h-full">
            <div className="p-6 space-y-6">
              {/* Create New Serre Section */}
              <Card className="border-dashed border-2 border-gray-200 hover:border-[#B4CC5F] transition-colors">
                <CardContent className="p-4">
                  {!isCreatingNew ? (
                    <Button
                      onClick={() => setIsCreatingNew(true)}
                      variant="ghost"
                      className="w-full h-16 border-0 text-gray-600 hover:text-[#B4CC5F] hover:bg-[#B4CC5F]/5"
                    >
                      <div className="flex flex-col items-center space-y-2">
                        <Plus className="h-6 w-6" />
                        <span className="text-sm font-medium">
                          Créer une nouvelle serre
                        </span>
                      </div>
                    </Button>
                  ) : (
                    <div className="space-y-3">
                      <Label htmlFor="serre-name">Nom de la serre</Label>
                      <Input
                        id="serre-name"
                        value={newSerreName}
                        onChange={(e) => setNewSerreName(e.target.value)}
                        placeholder="Ex: Serre Ouest D"
                        onKeyDown={(e) =>
                          e.key === "Enter" && handleCreateNewSerre()
                        }
                      />
                      <div className="flex space-x-2">
                        <Button
                          onClick={handleCreateNewSerre}
                          className="flex-1 bg-[#B4CC5F] hover:bg-[#A3C247]"
                          disabled={!newSerreName.trim()}
                        >
                          Créer
                        </Button>
                        <Button
                          onClick={() => {
                            setIsCreatingNew(false);
                            setNewSerreName("");
                          }}
                          variant="outline"
                          className="flex-1"
                        >
                          Annuler
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Serres List */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                  <MapPin className="h-5 w-5" />
                  <span>Serres Supervisées ({serres.length})</span>
                </h3>

                {serres.map((serre) => (
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
                            {serre.name}
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

                      <div className="space-y-2 text-sm text-gray-500">
                        <div className="flex items-center justify-between">
                          <span>{serre.area} m²</span>
                          <span>{serre.zones.length} zones</span>
                        </div>
                        {serre.supervisedBy && (
                          <div className="flex items-center space-x-1">
                            <Users className="h-3 w-3" />
                            <span className="text-xs">
                              {serre.supervisedBy}
                            </span>
                          </div>
                        )}
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
                              <span>
                                {zone.value}
                                {zone.unit}
                              </span>
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
                ))}
              </div>

              {/* Selected Serre Details */}
              {selectedSerre && (
                <Card className="border-[#B4CC5F]">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg text-[#B4CC5F] flex items-center space-x-2">
                      <Layers className="h-5 w-5" />
                      <span>{selectedSerre.name} - Supervision</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Variété:</span>
                          <p className="font-medium">{selectedSerre.variety}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Surface:</span>
                          <p className="font-medium">{selectedSerre.area} m²</p>
                        </div>
                      </div>

                      {selectedSerre.supervisedBy && (
                        <div className="text-sm">
                          <span className="text-gray-600">Supervisé par:</span>
                          <p className="font-medium">
                            {selectedSerre.supervisedBy}
                          </p>
                        </div>
                      )}

                      <Separator />

                      {selectedSerre.zones.length > 0 ? (
                        <Accordion
                          type="single"
                          collapsible
                          className="space-y-2"
                        >
                          {selectedSerre.zones.map((zone) => (
                            <AccordionItem
                              key={zone.id}
                              value={zone.id}
                              className="border rounded-lg"
                            >
                              <AccordionTrigger className="px-3 py-2 hover:no-underline">
                                <div className="flex items-center justify-between w-full pr-2">
                                  <div className="flex items-center space-x-2">
                                    {getZoneIcon(zone.type)}
                                    <span className="font-medium">
                                      {zone.name}
                                    </span>
                                  </div>
                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      "text-xs",
                                      getStatusColor(zone.status),
                                    )}
                                  >
                                    {zone.value}
                                    {zone.unit}
                                  </Badge>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent className="px-3 pb-3">
                                <div className="space-y-2 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">
                                      Statut:
                                    </span>
                                    <span
                                      className={cn(
                                        "font-medium",
                                        zone.status === "optimal"
                                          ? "text-green-600"
                                          : zone.status === "warning"
                                            ? "text-yellow-600"
                                            : "text-red-600",
                                      )}
                                    >
                                      {zone.status === "optimal"
                                        ? "Optimal"
                                        : zone.status === "warning"
                                          ? "Attention"
                                          : "Critique"}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">
                                      Dernière lecture:
                                    </span>
                                    <span className="font-medium">
                                      {zone.lastReading.toLocaleTimeString()}
                                    </span>
                                  </div>
                                  <div className="flex space-x-2 mt-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="flex-1 text-[#B4CC5F] border-[#B4CC5F] hover:bg-[#B4CC5F] hover:text-white"
                                    >
                                      Ajuster
                                    </Button>
                                    <Dialog
                                      open={isAssignDialogOpen}
                                      onOpenChange={setIsAssignDialogOpen}
                                    >
                                      <DialogTrigger asChild>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="flex-1 text-blue-600 border-blue-300 hover:bg-blue-50"
                                        >
                                          Assigner Tech.
                                        </Button>
                                      </DialogTrigger>
                                      <DialogContent>
                                        <DialogHeader>
                                          <DialogTitle>
                                            Assigner un technicien
                                          </DialogTitle>
                                        </DialogHeader>
                                        <div className="space-y-4">
                                          <div>
                                            <Label>Serre sélectionnée</Label>
                                            <p className="text-sm text-gray-600">
                                              {selectedSerre?.name}
                                            </p>
                                          </div>
                                          <div>
                                            <Label htmlFor="technician-select">
                                              Technicien
                                            </Label>
                                            <Select
                                              value={selectedTechnician}
                                              onValueChange={
                                                setSelectedTechnician
                                              }
                                            >
                                              <SelectTrigger>
                                                <SelectValue placeholder="Sélectionnez un technicien" />
                                              </SelectTrigger>
                                              <SelectContent>
                                                {mockTechnicians.map((tech) => (
                                                  <SelectItem
                                                    key={tech.id}
                                                    value={tech.id}
                                                  >
                                                    {tech.name} ({tech.email})
                                                  </SelectItem>
                                                ))}
                                              </SelectContent>
                                            </Select>
                                          </div>
                                          <div className="flex space-x-2">
                                            <Button
                                              onClick={handleAssignTechnician}
                                              disabled={!selectedTechnician}
                                              className="flex-1"
                                            >
                                              Assigner
                                            </Button>
                                            <Button
                                              variant="outline"
                                              onClick={() => {
                                                setIsAssignDialogOpen(false);
                                                setSelectedTechnician("");
                                              }}
                                              className="flex-1"
                                            >
                                              Annuler
                                            </Button>
                                          </div>
                                        </div>
                                      </DialogContent>
                                    </Dialog>
                                  </div>
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <Layers className="h-12 w-12 mx-auto mb-3 opacity-50" />
                          <p>Aucune zone configurée</p>
                          <Button
                            size="sm"
                            className="mt-3 bg-[#B4CC5F] hover:bg-[#A3C247]"
                          >
                            Ajouter une zone
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Right Map Section */}
        <div className="flex-1 relative" data-testid="map-section">
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
                    selectedSerre.status === "active"
                      ? "bg-green-500"
                      : selectedSerre.status === "maintenance"
                        ? "bg-yellow-500"
                        : "bg-red-500",
                  )}
                />
                <h4 className="font-semibold text-gray-900">
                  {selectedSerre.name}
                </h4>
              </div>
              <p className="text-sm text-gray-600 mb-1">
                {selectedSerre.variety}
              </p>
              <p className="text-xs text-gray-500">
                {selectedSerre.area} m² • {selectedSerre.zones.length} zones
              </p>
              {selectedSerre.supervisedBy && (
                <p className="text-xs text-blue-600 mt-1">
                  {selectedSerre.supervisedBy}
                </p>
              )}
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

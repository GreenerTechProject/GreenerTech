import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import GoogleMapsWrapper from "../components/GoogleMapsWrapper";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getGoogleMapsAPIKey } from "@/config/maps";
import { Billon } from "@shared/api";

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
  billons: Billon[];
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

const cropVarieties = [
  { value: "tomate", label: "Tomate" },
  { value: "concombre", label: "Concombre" },
  { value: "poivron", label: "Poivron" },
  { value: "aubergine", label: "Aubergine" },
  { value: "courgette", label: "Courgette" },
  { value: "laitue", label: "Laitue" },
  { value: "radis", label: "Radis" },
  { value: "epinard", label: "Épinard" },
  { value: "basilic", label: "Basilic" },
  { value: "persil", label: "Persil" },
  { value: "autre", label: "Autre" },
];

const mockSerres: Serre[] = [
  {
    id: "1",
    name: "Serre Nord A",
    variety: "Tomates",
    area: 450,
    location: { lat: 46.7111, lng: 1.7191 },
    status: "active",
    lastUpdate: new Date(),
    billons: [
      {
        id: "b1",
        name: "Billon 1A",
        serreId: "1",
        technicienId: "user-123",
        variety: "tomate",
        area: 25,
        status: "growing",
        plantingDate: "2024-01-15",
        expectedHarvestDate: "2024-04-15",
        position: { row: 1, section: "A" },
        notes: "Variété cherry, irrigation goutte à goutte",
      },
      {
        id: "b2",
        name: "Billon 1B",
        serreId: "1",
        technicienId: "user-123",
        variety: "basilic",
        area: 15,
        status: "ready",
        plantingDate: "2024-01-10",
        expectedHarvestDate: "2024-03-10",
        position: { row: 1, section: "B" },
      },
    ],
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
    billons: [],
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
    ],
  },
];

export default function TechnicianDashboard() {
  const { user, logout } = useAuth();
  const [serres, setSerres] = useState<Serre[]>(mockSerres);
  const [selectedSerre, setSelectedSerre] = useState<Serre | null>(null);
  const [isCreatingBillon, setIsCreatingBillon] = useState(false);
  const [billonForm, setBillonForm] = useState({
    name: "",
    variety: "",
    area: "",
    row: "",
    section: "",
    notes: "",
  });
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);

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

  const handleCreateBillon = () => {
    if (
      !billonForm.name.trim() ||
      !billonForm.variety ||
      !billonForm.area ||
      !selectedSerre
    ) {
      return;
    }

    const newBillon: Billon = {
      id: `b-${Date.now()}`,
      name: billonForm.name.trim(),
      serreId: selectedSerre.id,
      technicienId: user?.id || "user-123",
      variety: billonForm.variety,
      area: parseFloat(billonForm.area),
      status: "planted",
      plantingDate: new Date().toISOString().split("T")[0],
      position: {
        row: parseInt(billonForm.row) || 1,
        section: billonForm.section || "A",
      },
      notes: billonForm.notes,
    };

    setSerres((prev) =>
      prev.map((serre) =>
        serre.id === selectedSerre.id
          ? { ...serre, billons: [...serre.billons, newBillon] }
          : serre,
      ),
    );

    // Reset form
    setBillonForm({
      name: "",
      variety: "",
      area: "",
      row: "",
      section: "",
      notes: "",
    });
    setIsCreatingBillon(false);

    // Update selected serre to show new billon
    setSelectedSerre((prev) =>
      prev ? { ...prev, billons: [...prev.billons, newBillon] } : null,
    );
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

  const getBillonStatusLabel = (status: string) => {
    switch (status) {
      case "planted":
        return "Planté";
      case "growing":
        return "En croissance";
      case "ready":
        return "Prêt à récolter";
      case "harvested":
        return "Récolté";
      case "maintenance":
        return "Maintenance";
      default:
        return status;
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

  const totalBillons = serres.reduce(
    (total, serre) => total + serre.billons.length,
    0,
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              {/* Sidebar Button */}
              <TechnicianSidebar userRole="technicien" />
              <h1 className="text-xl font-semibold text-gray-900 ml-4">
                Tableau de Bord Technicien
              </h1>
              <Badge
                variant="outline"
                className="bg-green-50 border-green-200 text-green-700"
              >
                {totalBillons} Billons gérés
              </Badge>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 hidden sm:block">
                {user?.name || user?.email}
              </span>
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
              {/* Create New Billon Section */}
              {selectedSerre && (
                <Card className="border-dashed border-2 border-gray-200 hover:border-[#B4CC5F] transition-colors">
                  <CardContent className="p-4">
                    {!isCreatingBillon ? (
                      <Button
                        onClick={() => setIsCreatingBillon(true)}
                        variant="ghost"
                        className="w-full h-16 border-0 text-gray-600 hover:text-[#B4CC5F] hover:bg-[#B4CC5F]/5"
                      >
                        <div className="flex flex-col items-center space-y-2">
                          <Sprout className="h-6 w-6" />
                          <span className="text-sm font-medium">
                            Créer un nouveau billon
                          </span>
                          <span className="text-xs text-gray-500">
                            dans {selectedSerre.name}
                          </span>
                        </div>
                      </Button>
                    ) : (
                      <div className="space-y-3">
                        <h4 className="font-medium text-gray-900">
                          Nouveau billon - {selectedSerre.name}
                        </h4>

                        <div>
                          <Label htmlFor="billon-name">Nom du billon *</Label>
                          <Input
                            id="billon-name"
                            value={billonForm.name}
                            onChange={(e) =>
                              setBillonForm((prev) => ({
                                ...prev,
                                name: e.target.value,
                              }))
                            }
                            placeholder="Ex: Billon 1A"
                          />
                        </div>

                        <div>
                          <Label htmlFor="billon-variety">Variété *</Label>
                          <Select
                            value={billonForm.variety}
                            onValueChange={(value) =>
                              setBillonForm((prev) => ({
                                ...prev,
                                variety: value,
                              }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionnez une variété" />
                            </SelectTrigger>
                            <SelectContent>
                              {cropVarieties.map((variety) => (
                                <SelectItem
                                  key={variety.value}
                                  value={variety.value}
                                >
                                  {variety.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="billon-area">Surface (m²) *</Label>
                          <Input
                            id="billon-area"
                            type="number"
                            step="0.1"
                            value={billonForm.area}
                            onChange={(e) =>
                              setBillonForm((prev) => ({
                                ...prev,
                                area: e.target.value,
                              }))
                            }
                            placeholder="Ex: 25.5"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label htmlFor="billon-row">Rangée</Label>
                            <Input
                              id="billon-row"
                              type="number"
                              value={billonForm.row}
                              onChange={(e) =>
                                setBillonForm((prev) => ({
                                  ...prev,
                                  row: e.target.value,
                                }))
                              }
                              placeholder="1"
                            />
                          </div>
                          <div>
                            <Label htmlFor="billon-section">Section</Label>
                            <Input
                              id="billon-section"
                              value={billonForm.section}
                              onChange={(e) =>
                                setBillonForm((prev) => ({
                                  ...prev,
                                  section: e.target.value,
                                }))
                              }
                              placeholder="A"
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="billon-notes">Notes</Label>
                          <Textarea
                            id="billon-notes"
                            value={billonForm.notes}
                            onChange={(e) =>
                              setBillonForm((prev) => ({
                                ...prev,
                                notes: e.target.value,
                              }))
                            }
                            placeholder="Notes sur ce billon..."
                            rows={2}
                          />
                        </div>

                        <div className="flex space-x-2">
                          <Button
                            onClick={handleCreateBillon}
                            className="flex-1 bg-[#B4CC5F] hover:bg-[#A3C247]"
                            disabled={
                              !billonForm.name.trim() ||
                              !billonForm.variety ||
                              !billonForm.area
                            }
                          >
                            Créer
                          </Button>
                          <Button
                            onClick={() => {
                              setIsCreatingBillon(false);
                              setBillonForm({
                                name: "",
                                variety: "",
                                area: "",
                                row: "",
                                section: "",
                                notes: "",
                              });
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
              )}

              {/* Serres List */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                  <MapPin className="h-5 w-5" />
                  <span>Mes Serres ({serres.length})</span>
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

                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>{serre.area} m²</span>
                        <span>{serre.billons.length} billons</span>
                      </div>

                      {serre.billons.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1">
                          {serre.billons.slice(0, 3).map((billon) => (
                            <div
                              key={billon.id}
                              className={cn(
                                "flex items-center space-x-1 px-2 py-1 rounded-full text-xs border",
                                getStatusColor(billon.status),
                              )}
                            >
                              <Sprout className="h-3 w-3" />
                              <span>{billon.name}</span>
                            </div>
                          ))}
                          {serre.billons.length > 3 && (
                            <div className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                              +{serre.billons.length - 3}
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
                      <span>{selectedSerre.name} - Détails</span>
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

                      <Separator />

                      {/* Billons Section */}
                      {selectedSerre.billons.length > 0 && (
                        <>
                          <div>
                            <h4 className="font-medium text-gray-900 flex items-center space-x-2 mb-3">
                              <Sprout className="h-4 w-4" />
                              <span>
                                Mes billons ({selectedSerre.billons.length})
                              </span>
                            </h4>
                            <div className="space-y-2">
                              {selectedSerre.billons.map((billon) => (
                                <div
                                  key={billon.id}
                                  className="p-3 border rounded-lg bg-gray-50"
                                >
                                  <div className="flex items-start justify-between mb-2">
                                    <div>
                                      <h5 className="font-medium text-gray-900">
                                        {billon.name}
                                      </h5>
                                      <p className="text-sm text-gray-600">
                                        {cropVarieties.find(
                                          (v) => v.value === billon.variety,
                                        )?.label || billon.variety}
                                      </p>
                                    </div>
                                    <Badge
                                      variant="outline"
                                      className={cn(
                                        "text-xs",
                                        getStatusColor(billon.status),
                                      )}
                                    >
                                      {getBillonStatusLabel(billon.status)}
                                    </Badge>
                                  </div>
                                  <div className="text-xs text-gray-500 space-y-1">
                                    <div className="flex justify-between">
                                      <span>Surface:</span>
                                      <span>{billon.area} m²</span>
                                    </div>
                                    {billon.position && (
                                      <div className="flex justify-between">
                                        <span>Position:</span>
                                        <span>
                                          Rangée {billon.position.row}, Section{" "}
                                          {billon.position.section}
                                        </span>
                                      </div>
                                    )}
                                    {billon.plantingDate && (
                                      <div className="flex justify-between">
                                        <span>Planté le:</span>
                                        <span>
                                          {new Date(
                                            billon.plantingDate,
                                          ).toLocaleDateString("fr-FR")}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                          <Separator />
                        </>
                      )}

                      {/* Zones Section */}
                      {selectedSerre.zones.length > 0 ? (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-3">
                            Zones de contrôle
                          </h4>
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
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="w-full mt-2 text-[#B4CC5F] border-[#B4CC5F] hover:bg-[#B4CC5F] hover:text-white"
                                    >
                                      Ajuster les paramètres
                                    </Button>
                                  </div>
                                </AccordionContent>
                              </AccordionItem>
                            ))}
                          </Accordion>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <Layers className="h-12 w-12 mx-auto mb-3 opacity-50" />
                          <p>Aucune zone configurée</p>
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
                {selectedSerre.area} m² • {selectedSerre.billons.length} billons
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

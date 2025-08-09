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
import { useToast } from "@/hooks/use-toast";
import { serreService } from "../services/serreService";
import { guideService } from "../services/guideService";
import { domainService, Domain as BackendDomain } from "../services/domainService";

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
    nom: "Serre Sud B",
    variety: "Concombres",
    surface: 320,
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
    nom: "Serre Est C",
    variety: "Laitues",
    surface: 280,
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
    nom: "Serre Ouest D",
    variety: "Poivrons",
    surface: 380,
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

export default function TechnicienSupDashboard(): JSX.Element {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [serres, setSerres] = useState<Serre[]>([]);
  const [selectedSerre, setSelectedSerre] = useState<Serre | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newSerreName, setNewSerreName] = useState("");
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const drawingManagerRef = useRef<google.maps.drawing.DrawingManager | null>(null);
  const drawnPolygonRef = useRef<google.maps.Polygon | null>(null);
  const [pendingSerrePath, setPendingSerrePath] = useState<google.maps.LatLng[]>([]);
  const [pendingSerreArea, setPendingSerreArea] = useState<number>(0);
  const [serreNom, setSerreNom] = useState("");
  const [serreDomaineId, setSerreDomaineId] = useState<string>("");
  const [selectedGuideId, setSelectedGuideId] = useState<string>("");
  const [guides, setGuides] = useState<any[]>([]);
  const [showCreateGuide, setShowCreateGuide] = useState(false);
  const [createGuideForm, setCreateGuideForm] = useState({
    nom: "",
    variete: "",
    rendement: "",
    nombre_de_plants: "",
    date_debut_saison: "",
    date_fin_saison: "",
  });
  const [assignToSelf, setAssignToSelf] = useState(true);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedTechnician, setSelectedTechnician] = useState("");
  const [isInterventionFormOpen, setIsInterventionFormOpen] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const [assignedSerresRaw, setAssignedSerresRaw] = useState<any[]>([]);
  const [domainsRaw, setDomainsRaw] = useState<BackendDomain[]>([]);

  // Floating panel state
  const [isPanelFloating, setIsPanelFloating] = useState<boolean>(false);
  const [panelPos, setPanelPos] = useState<{ x: number; y: number }>({ x: 16, y: 80 });
  const [isDraggingPanel, setIsDraggingPanel] = useState<boolean>(false);
  const dragStartRef = useRef<{ offsetX: number; offsetY: number }>({ offsetX: 0, offsetY: 0 });

  // Render create serre card (uses captured state)
  const renderCreateSerreCard = () => (
    <Card className="border-dashed border-2 border-gray-200 hover:border-[#B4CC5F] transition-colors">
      <CardContent className="p-4 space-y-3">
        {!isCreatingNew ? (
          <Button
            onClick={() => setIsCreatingNew(true)}
            variant="ghost"
            className="w-full h-16 border-0 text-gray-600 hover:text-[#B4CC5F] hover:bg-[#B4CC5F]/5"
          >
            <div className="flex flex-col items-center space-y-2">
              <Plus className="h-6 w-6" />
              <span className="text-sm font-medium">Créer une nouvelle serre</span>
            </div>
          </Button>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="serre-nom">Nom de la serre</Label>
                <Input id="serre-nom" value={serreNom} onChange={(e) => setSerreNom(e.target.value)} placeholder="Ex: Serre Ouest D" />
              </div>
              <div>
                <Label htmlFor="serre-domaine">ID Domaine</Label>
                <Input id="serre-domaine" value={serreDomaineId} onChange={(e) => setSerreDomaineId(e.target.value)} placeholder="ex: 1" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center justify-between border rounded-md px-3 py-2">
                <span className="text-sm text-gray-600">M'assigner automatiquement</span>
                <input type="checkbox" checked={assignToSelf} onChange={(e) => setAssignToSelf(e.target.checked)} />
              </div>
              <div>
                <Label>Assigner un technicien (optionnel)</Label>
                <Select value={selectedTechnician} onValueChange={setSelectedTechnician}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockTechnicians.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.name} ({t.email})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Guides */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label>Guide de culture (optionnel)</Label>
                <Select value={selectedGuideId} onValueChange={setSelectedGuideId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir un guide" />
                  </SelectTrigger>
                  <SelectContent>
                    {guides.map((g: any) => (
                      <SelectItem key={g.id} value={g.id}>{g.nom}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button variant="outline" className="w-full" onClick={() => setShowCreateGuide((v) => !v)}>
                  {showCreateGuide ? "Annuler guide" : "Créer un guide"}
                </Button>
              </div>
            </div>

            {showCreateGuide && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label>Nom du guide</Label>
                  <Input value={createGuideForm.nom} onChange={(e) => setCreateGuideForm({ ...createGuideForm, nom: e.target.value })} />
                </div>
                <div>
                  <Label>Variété</Label>
                  <Input value={createGuideForm.variete} onChange={(e) => setCreateGuideForm({ ...createGuideForm, variete: e.target.value })} />
                </div>
                <div>
                  <Label>Rendement</Label>
                  <Input type="number" value={createGuideForm.rendement} onChange={(e) => setCreateGuideForm({ ...createGuideForm, rendement: e.target.value })} />
                </div>
                <div>
                  <Label>Nombre de plants</Label>
                  <Input type="number" value={createGuideForm.nombre_de_plants} onChange={(e) => setCreateGuideForm({ ...createGuideForm, nombre_de_plants: e.target.value })} />
                </div>
                <div>
                  <Label>Début saison (YYYY-MM-DD)</Label>
                  <Input value={createGuideForm.date_debut_saison} onChange={(e) => setCreateGuideForm({ ...createGuideForm, date_debut_saison: e.target.value })} />
                </div>
                <div>
                  <Label>Fin saison (YYYY-MM-DD)</Label>
                  <Input value={createGuideForm.date_fin_saison} onChange={(e) => setCreateGuideForm({ ...createGuideForm, date_fin_saison: e.target.value })} />
                </div>
              </div>
            )}

            {/* Drawing controls */}
            <div className="space-y-2">
              <div className="flex gap-2">
                <Button onClick={handleCreateNewSerre} className="flex-1" variant="default">
                  Dessiner la serre
                </Button>
                {pendingSerrePath.length > 0 && (
                  <Button onClick={cancelPendingSerre} variant="outline">Effacer</Button>
                )}
              </div>
              {pendingSerrePath.length > 0 && (
                <div className="text-xs text-gray-600">Points: {pendingSerrePath.length} • Surface estimée: {Math.round(pendingSerreArea)} m²</div>
              )}
            </div>

            <div className="flex space-x-2">
              <Button
                onClick={handleSaveSerreToBackend}
                className="flex-1 bg-[#B4CC5F] hover:bg-[#A3C247]"
                disabled={!serreNom.trim() || !serreDomaineId || pendingSerrePath.length === 0}
              >
                Sauvegarder la serre
              </Button>
              <Button
                onClick={() => {
                  setIsCreatingNew(false);
                  setSerreNom("");
                  setSerreDomaineId("");
                  setSelectedGuideId("");
                  setShowCreateGuide(false);
                  cancelPendingSerre();
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
  );
  

  // Mock technicians list
  const mockTechnicians = [
    { id: "tech1", name: "Jean Dupont", email: "jean.dupont@example.com" },
    { id: "tech2", name: "Marie Martin", email: "marie.martin@example.com" },
    { id: "tech3", name: "Paul Bernard", email: "paul.bernard@example.com" },
    { id: "tech4", name: "Sophie Durand", email: "sophie.durand@example.com" },
  ];

  // Initialize map (wait until Google Maps script is loaded)
  useEffect(() => {
    if (map || !mapRef.current) return;

    const tryInit = () => {
      // @ts-ignore
      if (typeof google === 'undefined' || !google.maps) {
        return false;
      }
      // @ts-ignore
      const newMap = new google.maps.Map(mapRef.current!, {
        center: { lat: 46.7051, lng: 1.7291 },
        // @ts-ignore
        mapTypeId: google.maps.MapTypeId.SATELLITE,
        zoom: 13,
        styles: [
          { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
        ],
      });
      setMap(newMap);
      // eslint-disable-next-line no-console
      console.debug('[TechSup] Map initialized');
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
  }, [map, mapRef.current]);

  // Fetch assigned serres as soon as user is known
  useEffect(() => {
    if (!user?.id) return;
    console.log('[TechSup] Fetching assigned serres for user', user.id);
    (async () => {
      try {
        const userIdNum = typeof user.id === 'string' ? parseInt(user.id, 10) : (user.id as unknown as number);
        const list: any[] = await serreService.getSerresAssignedToUser(userIdNum);
        console.log('[TechSup] Assigned serres count', list.length);
        setAssignedSerresRaw(list);
      } catch (e) {
        console.error('[TechSup] Failed to fetch assigned serres', e);
      }
    })();
    (async () => {
      try {
        const domains = await domainService.getMyCompanyDomains();
        console.log('[TechSup] Domains count', domains.length);
        setDomainsRaw(domains);
      } catch (e) {
        console.error('[TechSup] Failed to fetch domains', e);
      }
    })();
  }, [user?.id]);

  // When map is ready, draw polygons from assignedSerresRaw and populate UI list
  useEffect(() => {
    if (!map) return;
    // Draw domains first
    domainsRaw.forEach((d) => {
      const pts = (d.path || []).map((p) => ({ lat: p.lat, lng: p.lng }));
      if (pts.length === 0) return;
      const poly = new google.maps.Polygon({
        paths: pts,
        strokeColor: '#8FA53A',
        strokeOpacity: 1,
        strokeWeight: 2,
        fillColor: '#B4CC5F',
        fillOpacity: 0.22,
      });
      poly.setMap(map);
    });

    if (domainsRaw[0]?.center) {
      smoothZoomToLocation(map, domainsRaw[0].center, 14);
    }

    if (assignedSerresRaw.length === 0) return;
    const uiSerres: Serre[] = [];
    assignedSerresRaw.forEach((s: any) => {
      const points = (s.position || []).map((p: any) => ({ lat: p.lat, lng: p.lng }));
      if (points.length === 0) return;
      const polygon = new google.maps.Polygon({
        paths: points,
        strokeColor: '#FF6B6B',
        strokeOpacity: 1,
        strokeWeight: 2,
        fillColor: '#FF6B6B',
        fillOpacity: 0.25,
      });
      polygon.setMap(map);
      const center = points[0];
      uiSerres.push({
        id: String(s.id),
        nom: s.nom,
        variety: '',
        surface: 0,
        location: center,
        status: 'inactive',
        zones: [],
        lastUpdate: new Date(),
      });
    });
    setSerres(uiSerres);
    if (!domainsRaw[0] && uiSerres[0]) {
      smoothZoomToLocation(map, uiSerres[0].location, 15);
    }
  }, [map, assignedSerresRaw, domainsRaw]);

  // Setup DrawingManager and load guides
  useEffect(() => {
    if (!map) return;
    // Initialize DrawingManager
    const drawingManager = new google.maps.drawing.DrawingManager({
      drawingMode: null,
      drawingControl: false,
      polygonOptions: {
        fillColor: "#FF6B6B",
        fillOpacity: 0.3,
        strokeColor: "#FF6B6B",
        strokeWeight: 2,
        editable: true,
      },
    });
    drawingManager.setMap(map);
    drawingManagerRef.current = drawingManager;

    const overlayListener = google.maps.event.addListener(
      drawingManager,
      "overlaycomplete",
      (event: google.maps.drawing.OverlayCompleteEvent) => {
        if (event.type === google.maps.drawing.OverlayType.POLYGON) {
          const polygon = event.overlay as google.maps.Polygon;
          if (drawnPolygonRef.current) {
            drawnPolygonRef.current.setMap(null);
          }
          drawnPolygonRef.current = polygon;
          const path = polygon.getPath().getArray();
          setPendingSerrePath(path);
          try {
            const area = google.maps.geometry.spherical.computeArea(path);
            setPendingSerreArea(area);
          } catch (_) {
            setPendingSerreArea(0);
          }
          drawingManager.setDrawingMode(null);
        }
      }
    );

    // Load available guides for selection
    (async () => {
      try {
        const list = await guideService.getGuides();
        setGuides(list);
      } catch (e) {
        // non-blocking
      }
    })();

    return () => {
      google.maps.event.removeListener(overlayListener);
      drawingManager.setMap(null);
      drawingManagerRef.current = null;
    };
  }, [map]);

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
    // Start drawing mode
    if (!drawingManagerRef.current) return;
    drawingManagerRef.current.setDrawingMode(google.maps.drawing.OverlayType.POLYGON);
    setPendingSerrePath([]);
    setPendingSerreArea(0);
  };

  const cancelPendingSerre = () => {
    if (drawnPolygonRef.current) {
      drawnPolygonRef.current.setMap(null);
      drawnPolygonRef.current = null;
    }
    setPendingSerrePath([]);
    setPendingSerreArea(0);
  };

  const handleSaveSerreToBackend = async () => {
    if (!user) return;
    if (!serreNom.trim() || !serreDomaineId || pendingSerrePath.length === 0) {
      toast({ title: "Champs manquants", description: "Nom, domaine et dessin requis", variant: "destructive" });
      return;
    }
    try {
      const positionPayload = pendingSerrePath.map((p, idx) => ({
        latitude: p.lat(),
        longitude: p.lng(),
        ordre: idx + 1,
      }));
      const created = await serreService.createSerre({
        nom: serreNom.trim(),
        id_domaine: parseInt(serreDomaineId, 10),
        position: positionPayload,
        surface: pendingSerreArea,
      });
      const serreId = (typeof created.id === "number"
        ? created.id
        : typeof created.serreId === "string"
          ? parseInt(created.serreId, 10)
          : undefined) as number;

      // Assign to self if requested
      if (assignToSelf && serreId) {
        try {
          const userIdNum = typeof user.id === "string" ? parseInt(user.id, 10) : (user.id as unknown as number);
          await serreService.createAutorisationSerre({ id_user: userIdNum, id_serre: serreId });
        } catch (_) {}
      }

      // Create guide if selected or requested to create new
      if (selectedGuideId) {
        // nothing to do now; selecting an existing guide association would be backend-specific
      } else if (showCreateGuide && serreId) {
        try {
          const req = {
            nom: createGuideForm.nom,
            variete: createGuideForm.variete,
            rendement: parseFloat(createGuideForm.rendement),
            nombre_de_plants: parseInt(createGuideForm.nombre_de_plants),
            date_debut_saison: createGuideForm.date_debut_saison,
            date_fin_saison: createGuideForm.date_fin_saison,
            id_serre: serreId.toString(),
          } as any;
          await guideService.createGuide(req);
        } catch (_) {}
      }

      toast({ title: "Serre créée", description: `La serre "${serreNom}" a été créée.` });
      // Update local UI
      const center = pendingSerrePath[0];
      const newSerre: Serre = {
        id: serreId?.toString() || Date.now().toString(),
        nom: serreNom.trim(),
        variety: createGuideForm.variete || "",
        surface: Math.round(pendingSerreArea),
        location: { lat: center.lat(), lng: center.lng() },
        status: "inactive",
        zones: [],
        lastUpdate: new Date(),
        supervisedBy: assignToSelf ? (user.name || user.email || "Moi") : undefined,
      };
      setSerres((prev) => [newSerre, ...prev]);
      setSelectedSerre(newSerre);
      // reset form
      setSerreNom("");
      setSerreDomaineId("");
      setSelectedGuideId("");
      setShowCreateGuide(false);
      setCreateGuideForm({ nom: "", variete: "", rendement: "", nombre_de_plants: "", date_debut_saison: "", date_fin_saison: "" });
      cancelPendingSerre();
      setIsCreatingNew(false);
    } catch (e: any) {
      toast({ title: "Erreur", description: e?.message || "Impossible de créer la serre", variant: "destructive" });
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
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center py-4 gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <div className="flex items-center gap-4">
                {/* Sidebar Button */}
                <TechnicianSidebar
                  userRole="technicien_sup"
                  onInterventionClick={() => setIsInterventionFormOpen(true)}
                />
                <div className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-[#B4CC5F]" />
                  <h1 className="text-lg sm:text-xl font-semibold text-gray-900">
                    <span className="hidden sm:inline">Tableau de Bord </span>Technicien Supérieur
                  </h1>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <Badge
                  variant="outline"
                  className="bg-blue-50 border-blue-200 text-blue-700 w-fit"
                >
                  {serres.filter((s) => s.status === "active").length} Serres
                  Supervisées
                </Badge>
                <Button
                  onClick={() => setIsInterventionFormOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white w-fit"
                  size="sm"
                >
                  <Bell className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Nouvelle </span>Intervention
                </Button>
                <Button
                  onClick={() => setIsPanelFloating((v) => !v)}
                  variant="outline"
                  size="sm"
                >
                  {isPanelFloating ? "Ancrer le panneau" : "Déplacer le panneau"}
                </Button>
              </div>
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

      <div className="flex flex-col lg:flex-row h-[calc(100vh-73px)]">
        {/* Left Control Panel (docked) */}
        {!isPanelFloating && (
          <div className="w-full lg:w-96 bg-white shadow-lg max-h-[50vh] lg:max-h-full">
            <ScrollArea className="h-full">
              <div className="p-6 space-y-6">
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

                      <div className="space-y-2 text-sm text-gray-500">
                        <div className="flex items-center justify-between">
                          <span>{serre.surface} m²</span>
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
                      <span>{selectedSerre.nom} - Supervision</span>
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
                          <p className="font-medium">{selectedSerre.surface} m²</p>
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
                                              {selectedSerre?.nom}
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
        )}

        {/* Right Map Section */}
        <div className="flex-1 relative min-h-[50vh] lg:min-h-full" data-testid="map-section">
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
                  {selectedSerre.nom}
                </h4>
              </div>
              <p className="text-sm text-gray-600 mb-1">
                {selectedSerre.variety}
              </p>
              <p className="text-xs text-gray-500">
                {selectedSerre.surface} m² • {selectedSerre.zones.length} zones
              </p>
              {selectedSerre.supervisedBy && (
                <p className="text-xs text-blue-600 mt-1">
                  {selectedSerre.supervisedBy}
                </p>
              )}
            </div>
          )}

          {/* Floating Control Panel */}
          {isPanelFloating && (
            <div
              className="absolute z-20 w-80 max-w-[90vw] bg-white shadow-xl rounded-lg border"
              style={{ left: panelPos.x, top: panelPos.y }}
            >
              <div
                className="cursor-move px-3 py-2 border-b bg-gray-50 rounded-t-lg text-sm text-gray-600"
                onPointerDown={(e) => {
                  setIsDraggingPanel(true);
                  const rect = (e.currentTarget.parentElement as HTMLDivElement).getBoundingClientRect();
                  dragStartRef.current = { offsetX: e.clientX - rect.left, offsetY: e.clientY - rect.top };
                }}
                onPointerUp={() => setIsDraggingPanel(false)}
                onPointerMove={(e) => {
                  if (!isDraggingPanel) return;
                  const parent = (e.currentTarget.parentElement?.parentElement as HTMLDivElement);
                  const bounds = parent.getBoundingClientRect();
                  const newX = e.clientX - dragStartRef.current.offsetX - bounds.left;
                  const newY = e.clientY - dragStartRef.current.offsetY - bounds.top;
                  setPanelPos({ x: Math.max(8, Math.min(newX, bounds.width - 8 - 320)), y: Math.max(8, Math.min(newY, bounds.height - 8 - 400)) });
                }}
              >
                Panneau de contrôle
              </div>
              <div className="max-h-[70vh] overflow-y-auto">
                <div className="p-4 space-y-4">{renderCreateSerreCard()}</div>
                <div className="p-4 pt-0">
                  {/* Serres list condensed when floating */}
                  <h3 className="text-sm font-semibold text-gray-900 flex items-center space-x-2">
                    <MapPin className="h-4 w-4" />
                    <span>Serres ({serres.length})</span>
                  </h3>
                </div>
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

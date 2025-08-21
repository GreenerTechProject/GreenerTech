import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import GoogleMapsWrapper from "../components/GoogleMapsWrapper";
import { GoogleMap, Marker, InfoWindow, Polygon } from "@react-google-maps/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetClose } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
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
  Menu,
  X,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import TechnicianSidebar from "../components/TechnicianSidebar";
import InterventionForm from "../components/InterventionForm";
import { cn } from "@/lib/utils";

import { useToast } from "@/hooks/use-toast";
import { serreService } from "../services/serreService";
import { technicianService } from "../services/technicianService";
import type { Technician as ApiTechnician } from "../services/technicianService";
import { guideService } from "../services/guideService";
import { domainService, Domain as BackendDomain } from "../services/domainService";
import { AlertService } from "@/services/alertService";
import axios from "axios";

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
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
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
  const [companyTechnicians, setCompanyTechnicians] = useState<ApiTechnician[]>([]);
  const [isLoadingTechnicians, setIsLoadingTechnicians] = useState(false);
  const [isInterventionFormOpen, setIsInterventionFormOpen] = useState(false);

  const [assignedSerresRaw, setAssignedSerresRaw] = useState<any[]>([]);
  const [domainsRaw, setDomainsRaw] = useState<BackendDomain[]>([]);

  // Mobile responsive state
  const [isMobilePanelOpen, setIsMobilePanelOpen] = useState(false);
  const [activeMobileTab, setActiveMobileTab] = useState<'serres' | 'alerts'>('serres');

  // Alerts / heatmap state
  const [showHeatmap, setShowHeatmap] = useState<boolean>(true);
  const heatmapRef = useRef<google.maps.visualization.HeatmapLayer | null>(null);
  const [alertsSummary, setAlertsSummary] = useState<{ low: number; medium: number; high: number }>({ low: 0, medium: 0, high: 0 });
  const alertMarkersRef = useRef<google.maps.Marker[]>([]);

  // Helpers for alerts severity mapping
  const getAlertLevelFromInt = (n: number): "low" | "medium" | "high" => {
    if (n === 2) return "high";
    if (n === 1) return "medium";
    return "low";
  };
  const getWeightFromLevel = (lvl: "low" | "medium" | "high"): number => {
    if (lvl === "high") return 6;
    if (lvl === "medium") return 3;
    return 1;
  };
  

  // Initialize map when Google Maps script is loaded
  useEffect(() => {
    if (map) return;

    const tryInit = () => {
      // @ts-ignore
      if (typeof google === 'undefined' || !google.maps) {
        return false;
      }
      // eslint-disable-next-line no-console
      console.debug('[TechSup] Google Maps script loaded');
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
  }, [map]);

  // Fetch assigned serres as soon as user is known
  useEffect(() => {
    if (!user?.id) return;
    console.log('[TechSup] Fetching assigned serres for user', user.id);
    (async () => {
      try {
        const userIdNum = typeof user.id === 'string' ? parseInt(user.id, 10) : (user.id as unknown as number);
        const list: any[] = await serreService.getSerresWithTechnicians();
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

  // Fetch technicians from the same company
  useEffect(() => {
    (async () => {
      try {
        console.log('[TechSup] useEffect triggered for technicians fetch');
        console.log('[TechSup] Current user:', user);
        console.log('[TechSup] User ID:', user?.id);
        console.log('[TechSup] User company ID:', user?.id_entreprise);
        
        const companyId = user?.id_entreprise;
        console.log('[TechSup] Company ID extracted:', companyId);
        
        if (companyId) {
          console.log('[TechSup] Fetching technicians for company:', companyId);
          setIsLoadingTechnicians(true);
          try {
            const list = await technicianService.getTechniciansByCompany(companyId);
            console.log('[TechSup] Technicians fetched successfully:', list);
            console.log('[TechSup] Technicians count:', list.length);
            console.log('[TechSup] Technicians type:', typeof list);
            console.log('[TechSup] Technicians is array:', Array.isArray(list));
            if (list && list.length > 0) {
              console.log('[TechSup] First technician sample:', list[0]);
              console.log('[TechSup] First technician keys:', Object.keys(list[0]));
            }
            // Ensure we have an array and normalize the data
            const normalizedList = Array.isArray(list) ? list : [];
            // Filter: only regular technicians assigned to the current supervisor
            const supervisorId = user?.id;
            const filteredList = normalizedList.filter((t: any) => {
              const isRegularTechnician = t.role === 'technicien';
              const isAssignedToSupervisor = t.id_assigned != null && String(t.id_assigned) === String(supervisorId);
              return isRegularTechnician && isAssignedToSupervisor;
            });
            console.log('[TechSup] Setting filtered technicians list (assigned to current supervisor):', filteredList);
            setCompanyTechnicians(filteredList);
          } catch (error) {
            console.error('[TechSup] Error fetching technicians:', error);
            setCompanyTechnicians([]);
          } finally {
            setIsLoadingTechnicians(false);
          }
        } else {
          console.log('[TechSup] No company ID found, cannot fetch technicians');
          setCompanyTechnicians([]);
          setIsLoadingTechnicians(false);
        }
      } catch (e) {
        console.error('[TechSup] Failed to fetch technicians from same company', e);
      }
    })();
  }, [user?.id]);

  // When map is ready, draw domain polygons and populate UI list for serres
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
      const center = s.center && s.center.lat != null && s.center.lng != null ? s.center : points[0];
      uiSerres.push({
        id: String(s.id),
        nom: s.nom,
        variety: '',
        surface: Math.round(s.surface || 0),
        location: center,
        status: 'inactive',
        zones: [],
        lastUpdate: new Date(),
        supervisedBy: user?.name || user?.email || undefined,
        bilansCount: 0,
        assignedTechnicians: s.assignedTechnicians,
      });
    });
    setSerres(uiSerres);

    // Fetch bilans count per serre
    (async () => {
      try {
        const withCounts = await Promise.all(uiSerres.map(async (sr) => {
          try {
            const bilans = await serreService.getBilansBySerre(parseInt(sr.id, 10));
            return { ...sr, bilansCount: Array.isArray(bilans) ? bilans.length : 0 };
          } catch {
            return { ...sr, bilansCount: 0 };
          }
        }));
        // Fetch guide variete per serre
        const withVarieties = await Promise.all(withCounts.map(async (sr) => {
          try {
            const guides = await serreService.getGuidesBySerre(parseInt(sr.id, 10));
            const first = Array.isArray(guides) && guides.length > 0 ? guides[0] : null;
            return { ...sr, variety: first?.variete || '' };
          } catch {
            return sr;
          }
        }));
        setSerres(withVarieties);
      } catch {}
    })();
    if (!domainsRaw[0] && uiSerres[0]) {
      smoothZoomToLocation(map, uiSerres[0].location, 15);
    }
  }, [map, assignedSerresRaw, domainsRaw]);

  // Update supervisedBy based on assignedTechnicians if available
  useEffect(() => {
    if (serres.length === 0) return;
    
    const updated = serres.map((s) => {
      if (s.assignedTechnicians && s.assignedTechnicians.length > 0) {
        if (s.assignedTechnicians.length === 1) {
          return { ...s, supervisedBy: `Technicien ${s.assignedTechnicians[0].name}` };
        } else {
          const technicianNames = s.assignedTechnicians.map(t => t.name).join(', ');
          return { ...s, supervisedBy: `Techniciens: ${technicianNames}` };
        }
      }
      return s;
    });
    
    // Only update if there are changes
    if (JSON.stringify(updated) !== JSON.stringify(serres)) {
      setSerres(updated);
    }
  }, [serres]);

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
    setIsInfoWindowOpen(true);
    if (map) {
      smoothZoomToLocation(map, serre.location, 16);
    }
    setIsDetailsOpen(true);
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
    (async () => {
      if (selectedTechnician && selectedSerre) {
        try {
          await serreService.createAutorisationSerre({
            id_user: parseInt(selectedTechnician, 10),
            id_serre: parseInt(selectedSerre.id, 10),
          });
          const tech = companyTechnicians.find((t) => String(t.id) === String(selectedTechnician));
          const technicianName = (tech as any)?.fullName || tech?.email || selectedTechnician;

          const technicianData = {
            id: parseInt(selectedTechnician, 10),
            name: technicianName,
            email: tech?.email
          };

          setSerres((prev) =>
            prev.map((serre) =>
              serre.id === selectedSerre.id
                ? { 
                    ...serre, 
                    assignedTechnicians: [...(serre.assignedTechnicians || []), technicianData]
                  }
                : serre,
            ),
          );
  
          setSelectedSerre((prev) =>
            prev ? { 
              ...prev, 
              assignedTechnicians: [...(prev.assignedTechnicians || []), technicianData]
            } : prev,
          );
        } catch (_e) {
          // ignore UI failure
        } finally {
          setIsAssignDialogOpen(false);
          setSelectedTechnician("");
        }
      }
    })();
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

  const loadAlertsAndHeatmap = useCallback(async (mapInstance: google.maps.Map) => {
    try {
      setIsMapLoading(true);
      // Use alerts scoped to assigned serres
      const alerts = await AlertService.getAlertsByAssignedSerres();
      // Build weighted points from alerts. We need coordinates: try alerte.x1/y1 (if represent lat/lng); fallback to related serre center by bilan
      const weights: google.maps.visualization.WeightedLocation[] = [];
      let low = 0, med = 0, high = 0;
      const createdMarkers: google.maps.Marker[] = [];
      const filterSerreId = selectedSerre ? parseInt(selectedSerre.id, 10) : undefined;
      for (const a of alerts as any[]) {
        const lvl = getAlertLevelFromInt(a.status_alert);
        if (lvl === 'low') low++; else if (lvl === 'medium') med++; else high++;
        let lat = a.x1; // assuming y1 ~ lat
        let lng = a.y1; // assuming x1 ~ lng
        let alertSerreId: number | undefined = a.id_serre ? parseInt(a.id_serre, 10) : undefined;
        if (typeof lat !== 'number' || typeof lng !== 'number') {
          // Try fetch bilan -> serre center
          try {
            const bilanResp = await axios.get(`${window.location.protocol}//${window.location.hostname}:5000/api/bilan/${a.id_bilan}`);
            const id_serre = bilanResp.data?.id_serre;
            if (typeof id_serre === 'number') alertSerreId = id_serre;
            if (id_serre) {
              const serreResp = await axios.get(`${window.location.protocol}//${window.location.hostname}:5000/api/serre/${id_serre}`);
              lat = serreResp.data?.center?.lat;
              lng = serreResp.data?.center?.lng;
              if ((typeof lat !== 'number' || typeof lng !== 'number') && Array.isArray(serreResp.data?.position) && serreResp.data.position.length > 0) {
                lat = serreResp.data.position[0]?.lat;
                lng = serreResp.data.position[0]?.lng;
              }
            }
          } catch {}
        }
        // If a serre is selected, only render alerts for that serre
        if (filterSerreId != null && alertSerreId != null && alertSerreId !== filterSerreId) {
          continue;
        }
        if (typeof lat === 'number' && typeof lng === 'number') {
          weights.push({ location: new google.maps.LatLng(lat, lng), weight: getWeightFromLevel(lvl) });
          // Create alert marker with severity color
          const color = lvl === 'high' ? '#ef4444' : lvl === 'medium' ? '#f59e0b' : '#22c55e';
          const marker = new google.maps.Marker({
            position: { lat, lng },
            map: mapInstance,
            title: `${a.maladie} (${lvl})`,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: color,
              fillOpacity: 0.9,
              strokeWeight: 1,
              strokeColor: '#ffffff',
            },
          });
          createdMarkers.push(marker);
        }
      }
      setAlertsSummary({ low, medium: med, high });
      // Create or update heatmap (clear if none)
      if ((google.maps.visualization as any)?.HeatmapLayer) {
        if (!heatmapRef.current) {
          heatmapRef.current = new google.maps.visualization.HeatmapLayer({ data: [], dissipating: true, radius: 35 });
        }
        heatmapRef.current.setData(weights as any);
        heatmapRef.current.setMap(showHeatmap ? mapInstance : null);
      }
      // Place markers and adjust viewport
      if (createdMarkers.length > 0) {
        alertMarkersRef.current.forEach((m) => m.setMap(null));
        alertMarkersRef.current = createdMarkers;
        if (createdMarkers.length === 1) {
          const pos = createdMarkers[0].getPosition();
          if (pos) {
            mapInstance.panTo(pos);
            mapInstance.setZoom(16);
          }
        } else {
          const bounds = new google.maps.LatLngBounds();
          createdMarkers.forEach((m) => {
            const p = m.getPosition();
            if (p) bounds.extend(p);
          });
          mapInstance.fitBounds(bounds);
        }
      }
    } catch (e) {
      // non-blocking if alerts fail
      console.error('Failed to load alerts:', e);
    } finally {
      setIsMapLoading(false);
    }
  }, [showHeatmap, selectedSerre]);

  const [isMapLoading, setIsMapLoading] = useState(true);
  const [selectedSerreGuides, setSelectedSerreGuides] = useState<any[]>([]);
  const [selectedSerreBilans, setSelectedSerreBilans] = useState<any[]>([]);

  // Load guide(s) and bilans for selected serre (read-only)
  useEffect(() => {
    if (!selectedSerre) {
      setSelectedSerreGuides([]);
      setSelectedSerreBilans([]);
      return;
    }
    (async () => {
      try {
        const sid = parseInt(selectedSerre.id, 10);
        const guides = await serreService.getGuidesBySerre(sid);
        setSelectedSerreGuides(Array.isArray(guides) ? guides : []);
      } catch (_) {
        setSelectedSerreGuides([]);
      }
    })();
    (async () => {
      try {
        const sid = parseInt(selectedSerre.id, 10);
        const bilans = await serreService.getBilansBySerre(sid);
        setSelectedSerreBilans(Array.isArray(bilans) ? bilans : []);
      } catch (_) {
        setSelectedSerreBilans([]);
      }
    })();
    // Update heatmap to reflect selected serre filter
    if (map) {
      loadAlertsAndHeatmap(map);
    }
  }, [selectedSerre]);
  const [isInfoWindowOpen, setIsInfoWindowOpen] = useState(true);

  return (
    <div className="h-[calc(100vh-73px)] relative">
      {/* Mobile Header Overlay */}
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
              <div className="relative group">
                <Bell className="h-4 w-4 text-red-500 cursor-pointer" />
                {/* Tooltip below the Bell icon */}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                  <div className="text-center">
                    <div className="font-medium mb-1">Notifications</div>
                    <div className="space-y-1 text-gray-300">
                      <div>🔴 {alertsSummary.high} alertes élevées</div>
                      <div>🟡 {alertsSummary.medium} alertes moyennes</div>
                      <div>🟢 {alertsSummary.low} alertes faibles</div>
                    </div>
                  </div>
                  {/* Arrow pointing up to the Bell icon */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                </div>
              </div>
              <span className="text-sm font-medium">Technicien Sup</span>
            </div>
          </div>
          
          {/* Mobile Alerts Summary */}
          <div className="flex items-center gap-1 text-xs">
            <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-700 font-medium">
              {alertsSummary.high}
            </span>
            <span className="px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-700 font-medium">
              {alertsSummary.medium}
            </span>
            <span className="px-1.5 py-0.5 rounded bg-green-100 text-green-700 font-medium">
              {alertsSummary.low}
            </span>
          </div>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:block h-full">
        <ResizablePanelGroup direction="horizontal">
          {/* Left Panel: Serres list */}
          <ResizablePanel defaultSize={28} minSize={20} maxSize={45} className="bg-white shadow-lg">
            <div className="h-full flex flex-col">
              <div className="p-4 border-b flex items-center justify-between">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center space-x-2">
                  <MapPin className="h-5 w-5" />
                  <span>Serres Supervisées ({serres.length})</span>
                </h3>
              </div>
              <ScrollArea className="flex-1">
                <div className="p-4 space-y-3">
                  {serres.map((serre) => (
                    <Card key={serre.id} className={cn("cursor-pointer transition-all duration-200 hover:shadow-md border", selectedSerre?.id === serre.id ? "ring-2 ring-[#B4CC5F] border-[#B4CC5F] shadow-md" : "border-gray-200 hover:border-[#B4CC5F]/50")} onClick={() => handleSelectSerre(serre)}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-semibold text-gray-900">{serre.nom}</h4>
                            <p className="text-xs text-gray-600">Variété: {serre.variety || "—"}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>{serre.surface} m²</span>
                          <span>Billons: {serre.bilansCount ?? 0}</span>
                        </div>
                        {serre.assignedTechnicians && serre.assignedTechnicians.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-gray-100">
                            <p className="text-xs text-blue-600">
                              {serre.assignedTechnicians.length === 1 ? (
                                `Technicien: ${serre.assignedTechnicians[0].name}`
                              ) : (
                                `Techniciens: ${serre.assignedTechnicians.map(t => t.name).join(', ')}`
                              )}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          {/* Right Panel: Map */}
          <ResizablePanel defaultSize={72} minSize={55} className="min-w-0">
            <div className="h-full relative min-h-[500px] w-full flex-1" data-testid="map-section">
              <GoogleMapsWrapper>
                <GoogleMap
                  mapContainerStyle={{
                    width: "100%",
                    height: "100%",
                  }}
                  center={{ lat: 46.7051, lng: 1.7191 }}
                  zoom={10}
                  onLoad={(mapInstance) => {
                    if (mapInstance) {
                      setMap(mapInstance);
                      // Load alerts and create heatmap when map loads
                      loadAlertsAndHeatmap(mapInstance);
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
                  {/* Render polygons for all assigned serres */}
                  {assignedSerresRaw.map((serre) => {
                    const polygonPath = (serre.position || []).map((p: any) => ({ lat: p.lat, lng: p.lng }));
                    if (!polygonPath || polygonPath.length === 0) return null;
                    return (
                      <Polygon
                        key={`poly-${serre.id}`}
                        path={polygonPath as google.maps.LatLngLiteral[]}
                        options={{
                          strokeColor: '#FF6B6B',
                          strokeOpacity: 1,
                          strokeWeight: 2,
                          fillColor: '#FF6B6B',
                          fillOpacity: 0.25,
                        }}
                        onClick={() => setSelectedSerre({
                          id: serre.id.toString(),
                          nom: serre.nom,
                          variety: serre.variete || 'Non spécifiée',
                          surface: serre.surface || 0,
                          location: (serre.center && serre.center.lat != null && serre.center.lng != null) ? serre.center : polygonPath[0],
                          status: serre.statut || 'active',
                          zones: [],
                          lastUpdate: new Date(),
                          supervisedBy: serre.superviseur,
                          bilansCount: serre.nombre_billons || 0,
                          assignedTechnicians: serre.techniciens_associes || [],
                        })}
                      />
                    );
                  })}

                  {/* Render markers for all assigned serres */}
                  {assignedSerresRaw.map((serre) => {
                    // Get the correct position from serre data
                    const position = serre.center && serre.center.lat != null && serre.center.lng != null 
                      ? serre.center 
                      : serre.position && serre.position.length > 0 
                        ? serre.position[0] 
                        : { lat: 46.7051, lng: 1.7191 }; // fallback coordinates
                    
                    return (
                      <Marker
                        key={serre.id}
                        position={position}
                        title={serre.nom}
                        onClick={() => setSelectedSerre({
                          id: serre.id.toString(),
                          nom: serre.nom,
                          variety: serre.variete || 'Non spécifiée',
                          surface: serre.surface || 0,
                          location: position,
                          status: serre.statut || 'active',
                          zones: [],
                          lastUpdate: new Date(),
                          supervisedBy: serre.superviseur,
                          bilansCount: serre.nombre_billons || 0,
                          assignedTechnicians: serre.techniciens_associes || []
                        })}
                      />
                    );
                  })}

                  {/* Info Window for selected serre */}
                  {selectedSerre && isInfoWindowOpen && (
                    <InfoWindow
                      position={selectedSerre.location}
                      onCloseClick={() => setIsInfoWindowOpen(false)}
                    >
                      <div className="p-4 bg-white rounded-lg shadow-lg border border-gray-200 min-w-[280px]">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <div className={cn(
                              "w-3 h-3 rounded-full",
                              selectedSerre.status === "active" ? "bg-green-500" :
                              selectedSerre.status === "maintenance" ? "bg-yellow-500" : "bg-red-500"
                            )}></div>
                            <h3 className="font-bold text-gray-900 text-lg">
                              {selectedSerre.nom}
                            </h3>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <MapPin className="h-4 w-4 text-green-600" />
                            <div>
                              <p className="text-sm font-medium text-gray-700">Variété</p>
                              <p className="text-sm text-gray-600">{selectedSerre.variety}</p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Layers className="h-4 w-4 text-blue-600" />
                            <div>
                              <p className="text-sm font-medium text-gray-700">Surface</p>
                              <p className="text-sm text-gray-600">{selectedSerre.surface} m²</p>
                            </div>
                          </div>

                          {selectedSerre.bilansCount > 0 && (
                            <div className="flex items-center space-x-2">
                              <Layers className="h-4 w-4 text-purple-600" />
                              <div>
                                <p className="text-sm font-medium text-gray-700">Billons</p>
                                <p className="text-sm text-gray-600">{selectedSerre.bilansCount} billon{selectedSerre.bilansCount !== 1 ? 's' : ''}</p>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="mt-4 pt-3 border-t border-gray-100">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">
                              Dernière mise à jour: {selectedSerre.lastUpdate.toLocaleDateString('fr-FR')}
                            </span>
                            <div className={cn(
                              "px-2 py-1 rounded-full text-xs font-medium",
                              selectedSerre.status === 'active' ? 'bg-green-100 text-green-800' :
                              selectedSerre.status === 'maintenance' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            )}>
                              {selectedSerre.status === 'active' ? 'Active' :
                               selectedSerre.status === 'maintenance' ? 'Maintenance' : 'Inactive'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </InfoWindow>
                  )}
                </GoogleMap>
              </GoogleMapsWrapper>

              {/* Map Overlay Info: Selected Serre Details (read-only) */}
              {selectedSerre && (
                <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-4 max-w-sm w-[360px]">
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
                  <div className="text-sm text-gray-700 mb-1">
                    Variété: <span className="text-gray-900">{selectedSerre.variety || '—'}</span>
                  </div>
                  <div className="text-xs text-gray-500 mb-3">
                    {selectedSerre.surface} m² • {selectedSerre.zones.length} zones
                  </div>
                  {/* Guides (culture) */}
                  <div className="mt-2">
                    <div className="text-sm font-semibold text-gray-900 mb-1">Guides de culture</div>
                    {selectedSerreGuides.length === 0 ? (
                      <div className="text-xs text-gray-500">Aucun guide associé</div>
                    ) : (
                      <ul className="text-xs text-gray-700 list-disc pl-4 space-y-1 max-h-28 overflow-auto">
                        {selectedSerreGuides.map((g: any) => (
                          <li key={g.id}>{g.nom} {g.variete ? `(Variété: ${g.variete})` : ''}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                  {/* Bilans (billons) */}
                  <div className="mt-3">
                    <div className="text-sm font-semibold text-gray-900 mb-1">Billons</div>
                    {selectedSerreBilans.length === 0 ? (
                      <div className="text-xs text-gray-500">Aucun billon</div>
                    ) : (
                      <ul className="text-xs text-gray-700 list-disc pl-4 space-y-1 max-h-28 overflow-auto">
                        {selectedSerreBilans.map((b: any) => (
                          <li key={b.id}>
                            {b.nom || `Bilan #${b.id}`} {b.trimestre ? `• T${b.trimestre}` : ''} {b.annee ? `• ${b.annee}` : ''}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  {selectedSerre.assignedTechnicians && selectedSerre.assignedTechnicians.length > 0 && (
                    <p className="text-xs text-blue-600 mt-1">
                      {selectedSerre.assignedTechnicians.length === 1 ? (
                        `Technicien: ${selectedSerre.assignedTechnicians[0].name}`
                      ) : (
                        `Techniciens: ${selectedSerre.assignedTechnicians.map(t => t.name).join(', ')}`
                      )}
                    </p>
                  )}
                  {selectedSerre.supervisedBy && (!selectedSerre.assignedTechnicians || selectedSerre.assignedTechnicians.length === 0) && (
                    <p className="text-xs text-blue-600 mt-1">
                      {selectedSerre.supervisedBy}
                    </p>
                  )}

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="w-full"
                      onClick={() => setIsAssignDialogOpen(true)}
                    >
                      Assigner un technicien
                    </Button>
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => setIsDetailsOpen(true)}
                    >
                      Voir détails
                    </Button>
                  </div>
                </div>
              )}

            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Details Sheet for selected serre */}
      <Sheet open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <SheetContent side="right" className="w-full sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>Détails de la serre</SheetTitle>
            <SheetDescription>
              Informations détaillées et lecture seule
            </SheetDescription>
          </SheetHeader>
          <div className="mt-4 space-y-6">
            {/* Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Résumé</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Nom</span>
                  <span className="font-medium">{selectedSerre?.nom}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Variété</span>
                  <span className="font-medium">{selectedSerre?.variety || '—'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Surface</span>
                  <span className="font-medium">{selectedSerre?.surface ?? 0} m²</span>
                </div>
              </CardContent>
            </Card>

            {/* Guides */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Guides de culture</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedSerreGuides.length === 0 ? (
                  <div className="text-sm text-gray-500">Aucun guide associé</div>
                ) : (
                  <div className="space-y-3">
                    {selectedSerreGuides.map((g: any) => (
                      <div key={g.id} className="border rounded-md p-3">
                        <div className="font-medium text-gray-900">{g.nom || 'Guide'}</div>
                        <div className="text-xs text-gray-600">Variété: {g.variete || '—'}</div>
                        {g.rendement && (
                          <div className="text-xs text-gray-600">Rendement: {g.rendement}</div>
                        )}
                        {(g.date_debut_saison || g.date_fin_saison) && (
                          <div className="text-xs text-gray-600">
                            Saison: {g.date_debut_saison || '—'} → {g.date_fin_saison || '—'}
                          </div>
                        )}
                        {g.nombre_de_plants && (
                          <div className="text-xs text-gray-600">Nombre de plants: {g.nombre_de_plants}</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Billons */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Billons</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedSerreBilans.length === 0 ? (
                  <div className="text-sm text-gray-500">Aucun billon</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedSerreBilans.map((b: any) => {
                      const etat = b.etat || b.status || b.statut || '—';
                      const createdBy = b.created_by_name || b.created_by || b.auteur || b.id_user || 'Inconnu';
                      return (
                        <div key={b.id} className="border rounded-md p-3 text-sm">
                          <div className="font-medium text-gray-900 mb-1">{b.nom || `Bilan #${b.id}`}</div>
                          <div className="text-xs text-gray-600 mb-1">
                            Période: {b.trimestre ? `T${b.trimestre}` : '—'} {b.annee || ''}
                          </div>
                          <div className="text-xs text-gray-600 mb-1">État: {etat}</div>
                          <div className="text-xs text-gray-600">Créé par: {createdBy}</div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          <div className="p-4">
            <SheetClose asChild>
              <Button variant="outline" className="w-full">Fermer</Button>
            </SheetClose>
          </div>
        </SheetContent>
      </Sheet>

      {/* Mobile Layout - Full Screen Map */}
      <div className="lg:hidden h-full relative">
        {/* Loading overlay for mobile */}
        {isMapLoading && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#B4CC5F] mx-auto mb-4"></div>
              <p className="text-sm text-gray-600">Chargement de la carte et des alertes...</p>
            </div>
          </div>
        )}
        
        {/* Mobile Map Container - Full screen */}
        <div className="w-full h-full relative">
          <GoogleMapsWrapper>
            <GoogleMap
              mapContainerStyle={{
                width: "100%",
                height: "100%",
              }}
              center={{ lat: 46.7051, lng: 1.7191 }}
              zoom={10}
              onLoad={(mapInstance) => {
                if (mapInstance) {
                  setMap(mapInstance);
                  // Load alerts and create heatmap when map loads
                  loadAlertsAndHeatmap(mapInstance);
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
              {/* Render polygons for all assigned serres (mobile) */}
              {assignedSerresRaw.map((serre) => {
                const polygonPath = (serre.position || []).map((p: any) => ({ lat: p.lat, lng: p.lng }));
                if (!polygonPath || polygonPath.length === 0) return null;
                return (
                  <Polygon
                    key={`m-poly-${serre.id}`}
                    path={polygonPath as google.maps.LatLngLiteral[]}
                    options={{
                      strokeColor: '#FF6B6B',
                      strokeOpacity: 1,
                      strokeWeight: 2,
                      fillColor: '#FF6B6B',
                      fillOpacity: 0.25,
                    }}
                    onClick={() => setSelectedSerre({
                      id: serre.id.toString(),
                      nom: serre.nom,
                      variety: serre.variete || 'Non spécifiée',
                      surface: serre.surface || 0,
                      location: (serre.center && serre.center.lat != null && serre.center.lng != null) ? serre.center : polygonPath[0],
                      status: serre.statut || 'active',
                      zones: [],
                      lastUpdate: new Date(),
                      supervisedBy: serre.superviseur,
                      bilansCount: serre.nombre_billons || 0,
                      assignedTechnicians: serre.techniciens_associes || [],
                    })}
                  />
                );
              })}
              {/* Render markers for all assigned serres */}
              {assignedSerresRaw.map((serre) => {
                // Get the correct position from serre data
                const position = serre.center && serre.center.lat != null && serre.center.lng != null 
                  ? serre.center 
                  : serre.position && serre.position.length > 0 
                    ? serre.position[0] 
                    : { lat: 46.7051, lng: 1.7191 }; // fallback coordinates
                
                return (
                  <Marker
                    key={serre.id}
                    position={position}
                    title={serre.nom}
                    onClick={() => setSelectedSerre({
                      id: serre.id.toString(),
                      nom: serre.nom,
                      variety: serre.variete || 'Non spécifiée',
                      surface: serre.surface || 0,
                      location: position,
                      status: serre.statut || 'active',
                      zones: [],
                      lastUpdate: new Date(),
                      supervisedBy: serre.superviseur,
                      bilansCount: serre.nombre_billons || 0,
                      assignedTechnicians: serre.techniciens_associes || []
                    })}
                  />
                );
              })}

              {/* Info Window for selected serre */}
              {selectedSerre && isInfoWindowOpen && (
                <InfoWindow
                  position={selectedSerre.location}
                  onCloseClick={() => setIsInfoWindowOpen(false)}
                >
                  <div className="p-4 bg-white rounded-lg shadow-lg border border-gray-200 min-w-[280px]">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <div className={cn(
                          "w-3 h-3 rounded-full",
                          selectedSerre.status === "active" ? "bg-green-500" :
                          selectedSerre.status === "maintenance" ? "bg-yellow-500" : "bg-red-500"
                        )}></div>
                        <h3 className="font-bold text-gray-900 text-lg">
                          {selectedSerre.nom}
                        </h3>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-green-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-700">Variété</p>
                          <p className="text-sm text-gray-600">{selectedSerre.variety}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Layers className="h-4 w-4 text-blue-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-700">Surface</p>
                          <p className="text-sm text-gray-600">{selectedSerre.surface} m²</p>
                        </div>
                      </div>

                      {selectedSerre.bilansCount > 0 && (
                        <div className="flex items-center space-x-2">
                          <Layers className="h-4 w-4 text-purple-600" />
                          <div>
                            <p className="text-sm font-medium text-gray-700">Billons</p>
                            <p className="text-sm text-gray-600">{selectedSerre.bilansCount} billon{selectedSerre.bilansCount !== 1 ? 's' : ''}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-100">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          Dernière mise à jour: {selectedSerre.lastUpdate.toLocaleDateString('fr-FR')}
                        </span>
                        <div className={cn(
                          "px-2 py-1 rounded-full text-xs font-medium",
                          selectedSerre.status === 'active' ? 'bg-green-100 text-green-800' :
                          selectedSerre.status === 'maintenance' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        )}>
                          {selectedSerre.status === 'active' ? 'Active' :
                           selectedSerre.status === 'maintenance' ? 'Maintenance' : 'Inactive'}
                        </div>
                      </div>
                    </div>
                  </div>
                </InfoWindow>
              )}
            </GoogleMap>
          </GoogleMapsWrapper>

          {/* Mobile Map Overlay Info */}
          {selectedSerre && (
            <div className="absolute top-20 left-4 right-4 z-10 bg-white rounded-xl shadow-lg p-4 border border-gray-200">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
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
                    <h4 className="font-semibold text-gray-900 text-base">
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
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedSerre(null)}
                  className="p-2 h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setIsAssignDialogOpen(true)}
                >
                  Assigner un technicien
                </Button>
              </div>
            </div>
          )}

          {/* Mobile Alerts Overlay Panel on Map */}
          <div className="absolute top-4 left-4 z-10 bg-white/95 backdrop-blur rounded-lg shadow p-3 border">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-red-500" />
                <span className="font-semibold text-sm">Alertes</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="px-1.5 py-0.5 rounded bg-green-100 text-green-700">Faible: {alertsSummary.low}</span>
                <span className="px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-700">Moyen: {alertsSummary.medium}</span>
                <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-700">Élevé: {alertsSummary.high}</span>
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between gap-3">
              <label className="text-xs text-gray-600">Heatmap</label>
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={showHeatmap} onChange={(e) => {
                  setShowHeatmap(e.target.checked);
                  if (heatmapRef.current) {
                    heatmapRef.current.setMap(e.target.checked ? map : null);
                  }
                }} />
                {map && (
                  <button
                    onClick={() => loadAlertsAndHeatmap(map)}
                    disabled={isMapLoading}
                    className="p-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors disabled:opacity-50"
                    title="Actualiser les alertes"
                  >
                    🔄
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Floating Action Button */}
        <div className="absolute bottom-6 right-4 z-10">
          <Button
            size="lg"
            className="h-14 w-14 rounded-full shadow-lg bg-[#B4CC5F] hover:bg-[#9BB84F] text-white"
            onClick={() => setIsMobilePanelOpen(!isMobilePanelOpen)}
          >
            {isMobilePanelOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>

        {/* Mobile Bottom Panel */}
        <div className={cn(
          "absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl transition-transform duration-300 ease-in-out z-20",
          isMobilePanelOpen ? "translate-y-0" : "translate-y-full"
        )}>
          {/* Panel Handle */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
          </div>

          {/* Panel Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveMobileTab('serres')}
              className={cn(
                "flex-1 py-3 text-sm font-medium transition-colors",
                activeMobileTab === 'serres'
                  ? "text-[#B4CC5F] border-b-2 border-[#B4CC5F]"
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              Serres ({serres.length})
            </button>
            <button
              onClick={() => setActiveMobileTab('alerts')}
              className={cn(
                "flex-1 py-3 text-sm font-medium transition-colors",
                activeMobileTab === 'alerts'
                  ? "text-[#B4CC5F] border-b-2 border-[#B4CC5F]"
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              Alertes ({alertsSummary.low + alertsSummary.medium + alertsSummary.high})
            </button>
          </div>

          {/* Panel Content */}
          <div className="max-h-[60vh] overflow-y-auto scrollbar-mobile">
            {activeMobileTab === 'serres' && (
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
                    onClick={() => {
                      handleSelectSerre(serre);
                      setIsMobilePanelOpen(false);
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 text-base">{serre.nom}</h4>
                          <p className="text-sm text-gray-600">Variété: {serre.variety || "—"}</p>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline" className="text-xs">
                            {serre.surface} m²
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Billons: {serre.bilansCount ?? 0}</span>
                        {serre.supervisedBy && (
                          <span className="text-blue-600 truncate max-w-[120px]">
                            {serre.supervisedBy}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {activeMobileTab === 'alerts' && (
              <div className="p-4 space-y-4">
                {/* Alerts Summary Cards */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-red-600">{alertsSummary.high}</div>
                    <div className="text-xs text-red-700 font-medium">Élevé</div>
                  </div>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-yellow-600">{alertsSummary.medium}</div>
                    <div className="text-xs text-yellow-700 font-medium">Moyen</div>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-green-600">{alertsSummary.low}</div>
                    <div className="text-xs text-green-700 font-medium">Faible</div>
                  </div>
                </div>

                {/* Heatmap Toggle */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">Heatmap des alertes</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showHeatmap}
                      onChange={(e) => {
                        setShowHeatmap(e.target.checked);
                        if (heatmapRef.current) {
                          heatmapRef.current.setMap(e.target.checked ? map! : null);
                        }
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#B4CC5F]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#B4CC5F]"></div>
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Serre Info Overlay */}
        {selectedSerre && (
          <div className="absolute top-20 left-4 right-4 z-10 bg-white rounded-xl shadow-lg p-4 border border-gray-200">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
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
                  <h4 className="font-semibold text-gray-900 text-base">
                    {selectedSerre.nom}
                  </h4>
                </div>
                <p className="text-sm text-gray-600 mb-1">
                  {selectedSerre.variety}
                </p>
                <p className="text-xs text-gray-500">
                  {selectedSerre.surface} m² • {selectedSerre.bilansCount} billons
                </p>
                {selectedSerre.supervisedBy && (
                  <p className="text-xs text-blue-600 mt-1">
                    {selectedSerre.supervisedBy}
                  </p>
                )}
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelectedSerre(null)}
                className="p-2 h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline" 
                className="flex-1"
                onClick={() => setIsAssignDialogOpen(true)}
              >
                Assigner un technicien
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Global Assign Technician Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Assigner un technicien</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Serre sélectionnée</Label>
              <p className="text-sm text-gray-600">{selectedSerre?.nom}</p>
            </div>
            <div>
              <Label htmlFor="technician-select">Technicien</Label>
              <select 
                id="technician-select"
                className="w-full p-3 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={selectedTechnician}
                onChange={(e) => setSelectedTechnician(e.target.value)}
              >
                <option value="">Sélectionnez un technicien</option>
                {companyTechnicians.map((tech) => (
                  <option key={tech.id} value={String(tech.id)}>
                    {tech.fullName || tech.email} ({tech.email})
                  </option>
                ))}
              </select>
              {isLoadingTechnicians ? (
                <p className="text-xs text-gray-500 mt-1">
                  Chargement des techniciens...
                </p>
              ) : companyTechnicians.length > 0 ? (
                <p className="text-xs text-gray-500 mt-1">
                  {companyTechnicians.length} technicien(s) trouvé(s) dans votre entreprise
                </p>
              ) : (
                <p className="text-xs text-gray-500 mt-1">
                  Aucun technicien trouvé dans votre entreprise
                </p>
              )}
            </div>
            <div className="flex space-x-2">
              <Button onClick={handleAssignTechnician} disabled={!selectedTechnician || companyTechnicians.length === 0} className="flex-1">Assigner</Button>
              <Button variant="outline" onClick={() => { setIsAssignDialogOpen(false); setSelectedTechnician(""); }} className="flex-1">Annuler</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Intervention Form Modal */}
      <InterventionForm
        isOpen={isInterventionFormOpen}
        onClose={() => setIsInterventionFormOpen(false)}
        onSubmit={handleInterventionSubmit}
      />
    </div>
  );
}

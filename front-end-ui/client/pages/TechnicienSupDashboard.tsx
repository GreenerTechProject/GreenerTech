import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import GoogleMapsWrapper from "../components/GoogleMapsWrapper";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
} from "lucide-react";
import TechnicianSidebar from "../components/TechnicianSidebar";
import InterventionForm from "../components/InterventionForm";
import { cn } from "@/lib/utils";
import { getGoogleMapsAPIKey } from "@/config/maps";
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
  const [companyTechnicians, setCompanyTechnicians] = useState<ApiTechnician[]>([]);
  const [isInterventionFormOpen, setIsInterventionFormOpen] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const [assignedSerresRaw, setAssignedSerresRaw] = useState<any[]>([]);
  const [domainsRaw, setDomainsRaw] = useState<BackendDomain[]>([]);

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
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        styles: [
          { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
        ],
      });
      setMap(newMap);
      // eslint-disable-next-line no-console
      console.debug('[TechSup] Map initialized');
      // Once map exists, load alerts and build heatmap
      (async () => {
        try {
          const { alerts } = await AlertService.getAllAlerts(1, 1000);
          // Build weighted points from alerts. We need coordinates: try alerte.x1/y1 (if represent lat/lng); fallback to related serre center by bilan
          const weights: google.maps.visualization.WeightedLocation[] = [];
          let low = 0, med = 0, high = 0;
          const createdMarkers: google.maps.Marker[] = [];
          for (const a of alerts as any[]) {
            const lvl = getAlertLevelFromInt(a.status_alert);
            if (lvl === 'low') low++; else if (lvl === 'medium') med++; else high++;
            let lat = a.x1; // assuming y1 ~ lat
            let lng = a.y1; // assuming x1 ~ lng
            if (typeof lat !== 'number' || typeof lng !== 'number') {
              // Try fetch bilan -> serre center
              try {
                const bilanResp = await axios.get(`${window.location.protocol}//${window.location.hostname}:5000/api/bilan/${a.id_bilan}`);
                const id_serre = bilanResp.data?.id_serre;
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
            if (typeof lat === 'number' && typeof lng === 'number') {
              weights.push({ location: new google.maps.LatLng(lat, lng), weight: getWeightFromLevel(lvl) });
              // Create alert marker with severity color
              const color = lvl === 'high' ? '#ef4444' : lvl === 'medium' ? '#f59e0b' : '#22c55e';
              const marker = new google.maps.Marker({
                position: { lat, lng },
                map: newMap,
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
          // Create or update heatmap
          if (weights.length > 0) {
            if (heatmapRef.current) {
              heatmapRef.current.setData(weights as any);
            } else if ((google.maps.visualization as any)?.HeatmapLayer) {
              const hm = new google.maps.visualization.HeatmapLayer({ data: weights as any, dissipating: true, radius: 35 });
              hm.setMap(newMap);
              heatmapRef.current = hm;
            }
          }
          // Place markers and adjust viewport
          if (createdMarkers.length > 0) {
            alertMarkersRef.current.forEach((m) => m.setMap(null));
            alertMarkersRef.current = createdMarkers;
            if (createdMarkers.length === 1) {
              const pos = createdMarkers[0].getPosition();
              if (pos) {
                newMap.panTo(pos);
                newMap.setZoom(16);
              }
            } else {
              const bounds = new google.maps.LatLngBounds();
              createdMarkers.forEach((m) => {
                const p = m.getPosition();
                if (p) bounds.extend(p);
              });
              newMap.fitBounds(bounds);
            }
          }
        } catch (e) {
          // non-blocking if alerts fail
        }
      })();
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
    (async () => {
      try {
        // Load technicians of same entreprise for assignment
        const companyId = (user as any)?.id_entreprise?.toString();
        if (companyId) {
          const list = await technicianService.getTechniciansByCompany(companyId);
          setCompanyTechnicians(list);
        }
      } catch (e) {
        // non-blocking
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

  // Resolve assigned technician names for displayed serres
  useEffect(() => {
    (async () => {
      if (serres.length === 0 || companyTechnicians.length === 0) return;
      try {
        const updated = await Promise.all(
          serres.map(async (s) => {
            try {
              const auths = await serreService.getAutorisationSerre({ id_serre: parseInt(s.id, 10) });
              if (auths.length > 0) {
                const techId = String(auths[0].id_user);
                const tech = companyTechnicians.find((t) => String(t.id) === techId);
                return { ...s, supervisedBy: tech ? (tech as any).fullName || tech?.email : `Technicien #${techId}` };
              }
            } catch (_e) {}
            return s;
          })
        );
        setSerres(updated);
      } catch (_e) {
        // ignore
      }
    })();
  }, [serres.length, companyTechnicians]);

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
    (async () => {
      if (selectedTechnician && selectedSerre) {
        try {
          await serreService.createAutorisationSerre({
            id_user: parseInt(selectedTechnician, 10),
            id_serre: parseInt(selectedSerre.id, 10),
          });
          const tech = companyTechnicians.find((t) => String(t.id) === String(selectedTechnician));
          const technicianName = (tech as any)?.fullName || tech?.email || selectedTechnician;

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

  return (
    <div className="h-[calc(100vh-73px)]">
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
              {/* Ajout de serre désactivé pour le moment */}
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
                          <span>Bilans: {serre.bilansCount ?? 0}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          {/* Right Panel: Map */}
          <ResizablePanel defaultSize={72} minSize={55}>
            <div className="h-full relative" data-testid="map-section">
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

                  <div className="mt-3">
                    <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline" className="w-full">
                          Assigner un technicien
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
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
                            <Select value={selectedTechnician} onValueChange={setSelectedTechnician}>
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionnez un technicien" />
                              </SelectTrigger>
                              <SelectContent>
                                {companyTechnicians.length === 0 ? (
                                  <SelectItem value="no-tech" disabled>Aucun technicien trouvé</SelectItem>
                                ) : (
                                  companyTechnicians.map((tech) => (
                                    <SelectItem key={tech.id} value={tech.id}>
                                      {(tech as any).fullName || tech.email} ({tech.email})
                                    </SelectItem>
                                  ))
                                )}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex space-x-2">
                            <Button onClick={handleAssignTechnician} disabled={!selectedTechnician || companyTechnicians.length === 0} className="flex-1">Assigner</Button>
                            <Button variant="outline" onClick={() => { setIsAssignDialogOpen(false); setSelectedTechnician(""); }} className="flex-1">Annuler</Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              )}

              {/* Alerts Overlay Panel on Map */}
              <div className="absolute top-4 left-4 z-10 bg-white/95 backdrop-blur rounded-lg shadow p-3 sm:p-4 border">
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
                  <input type="checkbox" checked={showHeatmap} onChange={(e) => {
                    setShowHeatmap(e.target.checked);
                    if (heatmapRef.current) {
                      heatmapRef.current.setMap(e.target.checked ? map! : null);
                    }
                  }} />
                </div>
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>

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

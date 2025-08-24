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
  BookOpen,
  FileText,
  BarChart3,
  Eye,
  Activity,
  Flame,
} from "lucide-react";
import TechnicianSidebar from "../components/TechnicianSidebar";
import InterventionForm from "../components/InterventionForm";
import AlertHeatmapOverlay from "../components/AlertHeatmapOverlay";
import { cn } from "@/lib/utils";

import { useToast } from "@/hooks/use-toast";
import { serreService } from "../services/serreService";
import { technicianService } from "../services/technicianService";
import type { Technician as ApiTechnician } from "../services/technicianService";
import { guideService } from "../services/guideService";
import { domainService, Domain as BackendDomain } from "../services/domainService";
import { AlertService } from "@/services/alertService";
import { etatBilanService, EtatBilan } from "@/services/etatBilanService";
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
  lastUpdate: Date;
  supervisedBy?: string;
  bilansCount?: number;
  assignedTechnicians?: {
    id: number;
    name: string;
    email?: string;
  }[];
}



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
  const [selectedBilan, setSelectedBilan] = useState<any>(null);
  const [isBilanDetailsOpen, setIsBilanDetailsOpen] = useState(false);
  const [selectedMobileBilan, setSelectedMobileBilan] = useState<any>(null);

  const [assignedSerresRaw, setAssignedSerresRaw] = useState<any[]>([]);
  const [domainsRaw, setDomainsRaw] = useState<BackendDomain[]>([]);

  // Mobile responsive state
  const [isMobilePanelOpen, setIsMobilePanelOpen] = useState(false);
  const [activeMobileTab, setActiveMobileTab] = useState<'serres' | 'guides' | 'billons' | 'etat' | 'heatmap'>('serres');
  const [mobilePanelHeight, setMobilePanelHeight] = useState(60); // Height in viewport height units
  const [isResizing, setIsResizing] = useState(false);

  // Alerts state
  const [alertsSummary, setAlertsSummary] = useState<{ low: number; medium: number; high: number }>({ low: 0, medium: 0, high: 0 });
  const alertMarkersRef = useRef<google.maps.Marker[]>([]);

  // Helpers for alerts severity mapping
  const getAlertLevelFromInt = (n: number): "low" | "medium" | "high" => {
    if (n === 2) return "high";
    if (n === 1) return "medium";
    return "low";
  };
  

  // Initialize map when Google Maps script is loaded
  useEffect(() => {
    if (map) return;

    const tryInit = () => {
      // @ts-ignore
      if (typeof google === 'undefined' || !google.maps) {
        return false;
      }

      return true;
    };

    if (!tryInit()) {
      // Only check once after a delay, not continuously
      const timeoutId = window.setTimeout(() => {
        if (tryInit()) {
          // Google Maps loaded successfully
        }
      }, 1000); // Check once after 1 second instead of polling every 150ms
      return () => window.clearTimeout(timeoutId);
    }
  }, [map]);

  // Fetch assigned serres as soon as user is known
  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      try {
        const userIdNum = typeof user.id === 'string' ? parseInt(user.id, 10) : (user.id as unknown as number);
        const list: any[] = await serreService.getSerresWithTechnicians();
        setAssignedSerresRaw(list);
      } catch (e) {
        // Failed to fetch assigned serres
      }
    })();
    (async () => {
      try {
        const domains = await domainService.getMyCompanyDomains();
        setDomainsRaw(domains);
      } catch (e) {
        // Failed to fetch domains
      }
    })();
  }, [user?.id]);

  // Fetch technicians from the same company
  useEffect(() => {
    (async () => {
      try {
        const companyId = user?.id_entreprise;
        
        if (companyId) {
          setIsLoadingTechnicians(true);
          try {
            const list = await technicianService.getTechniciansByCompany(companyId);
            if (list && list.length > 0) {
              // Technicians fetched successfully
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
            setCompanyTechnicians(filteredList);
          } catch (error) {
            setCompanyTechnicians([]);
          } finally {
            setIsLoadingTechnicians(false);
          }
        } else {
          setCompanyTechnicians([]);
          setIsLoadingTechnicians(false);
        }
      } catch (e) {
        // Failed to fetch technicians from same company
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
    map.setZoom(targetZoom); // Set zoom directly instead of using interval
  };

  const handleSelectSerre = (serre: Serre) => {
    setSelectedSerre(serre);
    setIsInfoWindowOpen(true);
    // Automatically enable heatmap when a serre is selected
    setShowHeatmap(true);
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
    // Here you would typically call an API to save the intervention
  };

  const handleInterventionSaveDraft = (data: any) => {
    // Save draft to backend or local storage
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

  const loadAlerts = useCallback(async (mapInstance: google.maps.Map) => {
    try {
      setIsMapLoading(true);
      // Use alerts scoped to assigned serres
      const alerts = await AlertService.getAlertsByAssignedSerres();
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
    } finally {
      setIsMapLoading(false);
    }
  }, [selectedSerre]);

  const [isMapLoading, setIsMapLoading] = useState(true);
  const [selectedSerreGuides, setSelectedSerreGuides] = useState<any[]>([]);
  const [selectedSerreBilans, setSelectedSerreBilans] = useState<any[]>([]);
  const [selectedSerreBilanEtats, setSelectedSerreBilanEtats] = useState<Record<number, EtatBilan | undefined>>({});
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    summary: true,
    guides: true,
    billons: true
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Load guide(s) and bilans for selected serre (read-only)
  useEffect(() => {
    if (!selectedSerre) {
      setSelectedSerreGuides([]);
      setSelectedSerreBilans([]);
      setSelectedSerreBilanEtats({});
      setHeatmapAlertCount(0);
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
        const list = Array.isArray(bilans) ? bilans : [];
        setSelectedSerreBilans(list);
        // Fetch etat for each bilan and keep the latest by date
        const etatsEntries = await Promise.all(
          list.map(async (b: any) => {
            try {
              const etats = await etatBilanService.getEtatBilanByBilan(Number(b.id));
              if (Array.isArray(etats) && etats.length > 0) {
                const latest = etats
                  .slice()
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
                return [Number(b.id), latest] as [number, EtatBilan];
              }
            } catch (_) {}
            return [Number(b.id), undefined] as [number, EtatBilan | undefined];
          })
        );
        const etatsMap: Record<number, EtatBilan | undefined> = {};
        for (const [bid, etat] of etatsEntries) {
          etatsMap[bid] = etat;
        }
        setSelectedSerreBilanEtats(etatsMap);
      } catch (_) {
        setSelectedSerreBilans([]);
        setSelectedSerreBilanEtats({});
      }
    })();
    // Update alerts to reflect selected serre filter
    if (map) {
      loadAlerts(map);
    }
  }, [selectedSerre]);



  // Handle mobile panel resizing
  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newHeight = Math.max(30, Math.min(80, ((window.innerHeight - e.clientY) / window.innerHeight) * 100));
      setMobilePanelHeight(newHeight);
    };

    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      const newHeight = Math.max(30, Math.min(80, ((window.innerHeight - touch.clientY) / window.innerHeight) * 100));
      setMobilePanelHeight(newHeight);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    const handleTouchEnd = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isResizing]);
  const [isInfoWindowOpen, setIsInfoWindowOpen] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Add state for sidebar toggle
  const [showHeatmap, setShowHeatmap] = useState(true); // Heatmap visible by default, same as TechnicianMap
  
  // Heatmap-related state for better UX
  const [heatmapLoading, setHeatmapLoading] = useState(false);
  const [heatmapAlertCount, setHeatmapAlertCount] = useState(0);

  // Fetch alerts for selected serre when heatmap is enabled
  const fetchSerreAlerts = useCallback(async (serreId: number) => {
    if (!showHeatmap) return;
    
    try {
      setHeatmapLoading(true);
      // Get bilans for the serre first
      const serreBilans = await serreService.getBilansBySerre(serreId);
      
      // Get all alerts and filter by bilan IDs that belong to this serre
      const allAlerts = await AlertService.getAllAlerts(1, 1000);
      const serreAlerts = allAlerts.alerts.filter(alert => 
        serreBilans.some(bilan => bilan.id === alert.id_bilan)
      );
      
      setHeatmapAlertCount(serreAlerts.length);
    } catch (error) {
      console.error('Error fetching serre alerts:', error);
      setHeatmapAlertCount(0);
    } finally {
      setHeatmapLoading(false);
    }
  }, [showHeatmap]);

  // Fetch serre alerts when heatmap is enabled
  useEffect(() => {
    if (selectedSerre && showHeatmap) {
      fetchSerreAlerts(parseInt(selectedSerre.id, 10));
    } else {
      setHeatmapAlertCount(0);
    }
  }, [selectedSerre, showHeatmap, fetchSerreAlerts]);

  return (
    <div className="h-[calc(100vh-73px)] relative">

      {/* Desktop Layout - Map First */}
      <div className="hidden lg:block h-full">
        <ResizablePanelGroup direction="horizontal">

          {/* Sidebar - Always visible with serres cards */}
          <ResizablePanel 
            defaultSize={20} 
            minSize={15} 
            maxSize={30} 
            className="bg-white shadow-lg"
          >
            <div className="h-full flex flex-col">
              <div className="p-4 border-b flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">Serres et Informations</h3>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="p-2 h-8 w-8"
                  >
                    {isSidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
                  </Button>
              </div>
              <ScrollArea className="flex-1">
                {selectedSerre ? (
                  // Show detailed information for selected serre
                  <div className="p-4 space-y-4">
                    {/* Serre Header */}
                    <div className="bg-[#B4CC5F]/10 border border-[#B4CC5F]/30 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <div className={cn(
                            "w-3 h-3 rounded-full",
                            selectedSerre.status === "active" ? "bg-green-500" :
                            selectedSerre.status === "maintenance" ? "bg-yellow-500" : "bg-red-500"
                          )}></div>
                          <h4 className="font-semibold text-gray-900 text-lg">{selectedSerre.nom}</h4>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedSerre(null);
                            // Disable heatmap when no serre is selected
                            setShowHeatmap(false);
                          }}
                          className="p-2 h-8 w-8"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4 text-green-600" />
                          <span>{selectedSerre.variety}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Layers className="h-4 w-4 text-blue-600" />
                          <span>{selectedSerre.surface} m²</span>
                        </div>
                      </div>
                        
                        {/* Heatmap Toggle for Sidebar */}
                        <div className="mt-3 pt-3 border-t border-[#B4CC5F]/20">
                          <Button
                            size="sm"
                            variant={showHeatmap ? "default" : "outline"}
                            className={cn(
                              "w-full transition-all duration-200",
                              showHeatmap && "bg-orange-500 text-white border-orange-500 hover:bg-orange-600"
                            )}
                            onClick={() => setShowHeatmap(!showHeatmap)}
                          >
                            <Flame className="h-4 w-4 mr-2" />
                            {showHeatmap ? "Masquer la carte de chaleur" : "Afficher la carte de chaleur"}
                            {showHeatmap && heatmapAlertCount > 0 && (
                              <Badge variant="secondary" className="ml-2 bg-orange-100 text-orange-800">
                                {heatmapAlertCount} alerte{heatmapAlertCount !== 1 ? 's' : ''}
                              </Badge>
                            )}
                          </Button>
                          {showHeatmap && (
                            <div className="mt-2 text-xs text-gray-600">
                              {heatmapLoading ? (
                                <span className="text-orange-600">Chargement des alertes...</span>
                              ) : heatmapAlertCount > 0 ? (
                                <span className="text-orange-600">{heatmapAlertCount} alerte{heatmapAlertCount !== 1 ? 's' : ''} détectée{heatmapAlertCount !== 1 ? 's' : ''}</span>
                              ) : (
                                <span className="text-gray-500">Aucune alerte détectée</span>
                              )}
                            </div>
                          )}
                        </div>
                    </div>

                    {/* Guides de Culture Section */}
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                        <Layers className="h-4 w-4 text-green-600" />
                        Guides de Culture ({selectedSerreGuides.length})
                      </h5>
                      {selectedSerreGuides.length === 0 ? (
                        <div className="text-center py-4 text-gray-500 bg-gray-50 rounded-lg">
                          <div className="text-2xl mb-2">🌱</div>
                          <div className="text-xs">Aucun guide de culture associé</div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {selectedSerreGuides.map((guide: any) => (
                            <Card key={guide.id} className="border border-gray-200 hover:shadow-md transition-shadow">
                              <CardContent className="p-3">
                                <div className="flex items-start justify-between mb-2">
                                  <h6 className="font-semibold text-gray-900 text-sm">{guide.nom || 'Guide de culture'}</h6>
                                  <Badge variant="outline" className="text-xs">{guide.variete || '—'}</Badge>
                                </div>
                                <div className="space-y-2 text-xs text-gray-600">
                                  {guide.rendement && (
                                    <div className="flex items-center justify-between p-2 bg-green-50 rounded-md">
                                      <span className="font-medium text-green-700">Rendement:</span>
                                      <span className="font-semibold text-green-900">
                                        {typeof guide.rendement === 'number' ? Number(guide.rendement).toFixed(2) : guide.rendement} kg/m²
                                      </span>
                                    </div>
                                  )}
                                  {guide.nombre_de_plants && (
                                    <div className="flex items-center justify-between p-2 bg-green-50 rounded-md">
                                      <span className="font-medium text-green-700">Plants:</span>
                                      <span className="font-semibold text-green-900">{guide.nombre_de_plants}</span>
                                    </div>
                                  )}
                                  {guide.date_debut_saison && guide.date_fin_saison && (
                                    <div className="flex items-center justify-between p-2 bg-green-50 rounded-md">
                                      <span className="font-medium text-green-700">Période:</span>
                                      <span className="font-semibold text-green-900 text-xs">
                                        {new Date(guide.date_debut_saison).toLocaleDateString('fr-FR')} → {new Date(guide.date_fin_saison).toLocaleDateString('fr-FR')}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Billons Section */}
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                        <Layers className="h-4 w-4 text-green-600" />
                        Billons ({selectedSerreBilans.length})
                      </h5>
                      {selectedSerreBilans.length === 0 ? (
                        <div className="text-center py-4 text-gray-500 bg-gray-50 rounded-lg">
                          <div className="text-2xl mb-2">🌾</div>
                          <div className="text-xs">Aucun billon associé</div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {selectedSerreBilans.map((bilan: any) => {
                            const etat = selectedSerreBilanEtats[bilan.id];
                            return (
                              <Card 
                                key={bilan.id} 
                                className="border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                                onClick={() => {
                                  setSelectedBilan({ ...bilan, etat });
                                  setIsBilanDetailsOpen(true);
                                }}
                              >
                                <CardContent className="p-3">
                                  <div className="flex items-start justify-between mb-2">
                                    <div>
                                      <h6 className="font-semibold text-gray-900 text-sm">{bilan.nom || `Bilan #${bilan.id}`}</h6>
                                      <div className="flex items-center gap-2 mt-1">
                                        <Badge variant="outline" className="text-xs">
                                          {bilan.trimestre ? `T${bilan.trimestre}` : '—'} {bilan.annee || ''}
                                        </Badge>
                                        {etat && (
                                          <Badge variant="secondary" className="text-xs">
                                            État disponible
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mb-3">
                                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                                      <span className="font-medium">Surface:</span>
                                      <span className="font-semibold">{Number(bilan.surface).toFixed(2)} m²</span>
                                    </div>
                                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                                      <span className="font-medium">Type:</span>
                                      <span className="font-semibold">{bilan.type || '—'}</span>
                                    </div>
                                  </div>

                                  {/* État Bilan Details */}
                                  {etat && (
                                    <div className="border-t border-gray-100 pt-3">
                                      <h6 className="text-xs font-medium text-gray-700 mb-2 flex items-center gap-2">
                                        <Thermometer className="h-3 w-3 text-purple-500" />
                                        État du Bilan
                                      </h6>
                                      <div className="grid grid-cols-2 gap-2 text-xs">
                                        {typeof etat.temperature === 'number' && (
                                          <div className="flex items-center justify-between p-2 bg-purple-50 rounded-md">
                                            <span className="text-purple-700">🌡️</span>
                                            <span className="font-semibold text-purple-900">{Number(etat.temperature).toFixed(1)}°C</span>
                                          </div>
                                        )}
                                        {typeof etat.humidite === 'number' && (
                                          <div className="flex items-center justify-between p-2 bg-purple-50 rounded-md">
                                            <span className="text-purple-700">💧</span>
                                            <span className="font-semibold text-purple-900">{Number(etat.humidite).toFixed(1)}%</span>
                                          </div>
                                        )}
                                        {typeof etat.luminosite === 'number' && (
                                          <div className="flex items-center justify-between p-2 bg-purple-50 rounded-md">
                                            <span className="text-purple-700">☀️</span>
                                            <span className="font-semibold text-purple-900">{Number(etat.luminosite).toFixed(0)} lux</span>
                                          </div>
                                        )}
                                        {typeof etat.co2 === 'number' && (
                                          <div className="flex items-center justify-between p-2 bg-purple-50 rounded-md">
                                            <span className="text-purple-700">🌬️</span>
                                            <span className="font-semibold text-purple-900">{Number(etat.co2).toFixed(0)} ppm</span>
                                          </div>
                                        )}
                                        {etat.date && (
                                          <div className="col-span-2 flex items-center justify-between p-2 bg-blue-50 rounded-md">
                                            <span className="text-blue-700">📅</span>
                                            <span className="font-semibold text-blue-900 text-xs">
                                              {new Date(etat.date).toLocaleDateString('fr-FR')}
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  // Show serres list when no serre is selected
                  <div className="p-4 space-y-3">
                      {/* Heatmap Status Header */}
                      <Card className="border-2 border-gray-200 bg-gray-50">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3 mb-3">
                            <Flame className="h-5 w-5 text-gray-600" />
                            <div>
                              <h4 className="font-semibold text-gray-900">Carte de chaleur</h4>
                              <p className="text-sm text-gray-700">
                                Sélectionnez une serre pour activer la carte de chaleur
                              </p>
                            </div>
                          </div>
                          
                          <div className="text-center">
                            <span className="text-sm text-gray-600">
                              La carte de chaleur sera disponible une fois qu'une serre sera sélectionnée
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                      
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
                )}
              </ScrollArea>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Map Panel - Larger and primary */}
          <ResizablePanel defaultSize={80} minSize={70} maxSize={85} className="min-w-0">
            <div className="h-full relative min-h-[500px] w-full flex-1" data-testid="map-section">
              {/* Map Control Buttons */}
              <div className="absolute top-4 right-4 z-20 flex gap-2">
                {/* Map controls can be added here if needed */}
              </div>

              {/* Standalone Map Legend */}
              <div className="absolute top-4 left-4 z-10 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-3 border border-gray-200">
                <div className="text-xs font-medium text-gray-700 mb-2">Légende de la carte</div>
                <div className="space-y-1.5 text-xs text-gray-600">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span>Serres</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#FFD700]"></div>
                    <span>Billons (cliquez pour voir l'état)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span>Domaines</span>
                  </div>
                  {showHeatmap && (
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                      <span>Alertes (Carte de chaleur)</span>
                    </div>
                  )}
                </div>
              </div>

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
                       // Load alerts when map loads
                       loadAlerts(mapInstance);
                     }
                   }}
                  options={{
                    mapTypeId: "satellite",
                    tilt: 0,
                    streetViewControl: false,
                    fullscreenControl: false,
                    mapTypeControl: false,
                    zoomControl: true,
                    scaleControl: false,
                  }}
                >
  
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
                          lastUpdate: new Date(),
                          supervisedBy: serre.superviseur,
                          bilansCount: serre.nombre_billons || 0,
                          assignedTechnicians: serre.techniciens_associes || [],
                        })}
                      />
                    );
                  })}

  
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
                        onClick={() => {
                          const selectedSerreData = {
                          id: serre.id.toString(),
                          nom: serre.nom,
                          variety: serre.variete || 'Non spécifiée',
                          surface: serre.surface || 0,
                          location: position,
                          status: serre.statut || 'active',
                          lastUpdate: new Date(),
                          supervisedBy: serre.superviseur,
                          bilansCount: serre.nombre_billons || 0,
                          assignedTechnicians: serre.techniciens_associes || []
                          };
                          setSelectedSerre(selectedSerreData);
                          
                          // Zoom to the selected serre
                          if (map) {
                            map.panTo(position);
                            map.setZoom(16);
                          }
                        }}
                      />
                    );
                  })}

                  {/* Billon Polygons */}
                  {selectedSerre && selectedSerreBilans.map((bilan: any) => {
                    if (!bilan.position || !Array.isArray(bilan.position) || bilan.position.length < 3) {
                      return null;
                    }
                    
                    const polygonPath = bilan.position.map((p: any) => ({
                      lat: p.point_x || p.lat || p.latitude,
                      lng: p.point_y || p.lng || p.longitude
                    }));
                    
                    return (
                      <Polygon
                        key={`bilan-${bilan.id}`}
                        path={polygonPath as google.maps.LatLngLiteral[]}
                        options={{
                          strokeColor: '#FFD700',
                          strokeOpacity: 1,
                          strokeWeight: 2,
                          fillColor: '#FFD700',
                          fillOpacity: 0.2,
                          clickable: true,
                        }}
                        onClick={() => {
                          setSelectedBilan({ ...bilan, etat: selectedSerreBilanEtats[bilan.id] });
                          setIsBilanDetailsOpen(true);
                          
                          // Zoom to the billon location on the map
                          if (map && bilan.position && Array.isArray(bilan.position) && bilan.position.length > 0) {
                            const center = bilan.position[0];
                            const position = {
                              lat: center.point_x || center.lat || center.latitude,
                              lng: center.point_y || center.lng || center.longitude
                            };
                            map.panTo(position);
                            map.setZoom(18);
                          }
                        }}
                        onMouseOver={() => {
                          // Show tooltip on hover
                          if (map) {
                            map.setOptions({ draggableCursor: 'pointer' });
                          }
                        }}
                        onMouseOut={() => {
                          // Reset cursor on mouse out
                          if (map) {
                            map.setOptions({ draggableCursor: 'grab' });
                          }
                        }}
                      />
                    );
                  })}

                  {/* Alert Heatmap Overlay for Selected Serre */}
                  {selectedSerre && showHeatmap && (
                    <AlertHeatmapOverlay
                      serreId={parseInt(selectedSerre.id, 10)}
                      serreName={selectedSerre.nom}
                      serreLocation={selectedSerre.location}
                      map={map}
                      onAlertClick={(alert) => {
                        // Handle alert click - could open detailed view
                        console.log("Alert clicked:", alert);
                      }}
                      onInterventionClick={(alert) => {
                        // Handle intervention click - could open intervention form
                        console.log("Intervention requested for alert:", alert);
                        setIsInterventionFormOpen(true);
                      }}
                    />
                  )}

  
                                    {selectedSerre && isInfoWindowOpen && (
                    <InfoWindow
                      position={selectedSerre.location}
                      onCloseClick={() => setIsInfoWindowOpen(false)}
                      options={{
                        pixelOffset: new window.google.maps.Size(0, -10),
                        maxWidth: 200,
                        disableAutoPan: false
                      }}
                    >
                      <div className="p-2 bg-white rounded-lg shadow-lg border border-gray-200 min-w-[180px] max-w-[200px]">
                        {/* Header */}
                        <div className="flex items-center space-x-2 mb-1">
                          <div className={cn(
                            "w-2 h-2 rounded-full",
                            selectedSerre.status === "active" ? "bg-green-500" :
                            selectedSerre.status === "maintenance" ? "bg-yellow-500" : "bg-red-500"
                          )}></div>
                          <h3 className="font-bold text-gray-900 text-sm">
                            {selectedSerre.nom}
                          </h3>
                        </div>
                        
                        {/* Main content - compact */}
                        <div className="space-y-1">
                          {/* Variety */}
                          <div className="flex items-center space-x-2">
                            <MapPin className="h-3 w-3 text-green-600" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-gray-500">Variété</p>
                              <p className="text-xs text-gray-700 font-medium truncate">
                                {selectedSerre.variety}
                              </p>
                            </div>
                          </div>
                          
                          {/* Surface area */}
                          <div className="flex items-center space-x-2">
                            <Layers className="h-3 w-3 text-blue-600" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-gray-500">Surface</p>
                              <p className="text-xs text-gray-700 font-medium">
                                {selectedSerre.surface} m²
                              </p>
                            </div>
                          </div>
                          
                          {/* Billon count */}
                          <div className="flex items-center space-x-2">
                            <BarChart3 className="h-3 w-3 text-purple-600" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-gray-500">Billons</p>
                              <p className="text-xs text-gray-700 font-medium">
                                {selectedSerre.bilansCount || 0}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        {/* Status indicator - compact */}
                        <div className="mt-1 pt-1 border-t border-gray-100">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">
                              {selectedSerre.lastUpdate.toLocaleDateString('fr-FR')}
                            </span>
                            <div className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${
                              selectedSerre.status === 'active' 
                                ? 'bg-green-100 text-green-800' 
                                : selectedSerre.status === 'maintenance' 
                                ? 'bg-yellow-100 text-yellow-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {selectedSerre.status === 'active' ? 'Active' : 
                               selectedSerre.status === 'maintenance' ? 'Maint.' : 'Inactive'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </InfoWindow>
                  )}
                </GoogleMap>
              </GoogleMapsWrapper>

              {/* Floating Assignment Panel for Desktop/Tablet */}
              {selectedSerre && (
                <div className="absolute top-4 right-4 z-10 bg-white rounded-xl shadow-lg p-4 border border-gray-200 max-w-sm">
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
                  
                  {/* Heatmap Toggle for Floating Panel */}
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <Button
                      size="sm"
                      variant={showHeatmap ? "default" : "outline"}
                      className={cn(
                        "w-full transition-all duration-200",
                        showHeatmap && "bg-orange-500 text-white border-orange-500 hover:bg-orange-600"
                      )}
                      onClick={() => setShowHeatmap(!showHeatmap)}
                    >
                      <Flame className="h-4 w-4 mr-2" />
                      {showHeatmap ? "Masquer la carte de chaleur" : "Afficher la carte de chaleur"}
                      {showHeatmap && heatmapAlertCount > 0 && (
                        <Badge variant="secondary" className="ml-2 bg-orange-100 text-orange-800">
                          {heatmapAlertCount} alerte{heatmapAlertCount !== 1 ? 's' : ''}
                        </Badge>
                      )}
                    </Button>
                    {showHeatmap && (
                      <div className="mt-2 text-xs text-center">
                        {heatmapLoading ? (
                          <span className="text-orange-600">Chargement des alertes...</span>
                        ) : heatmapAlertCount > 0 ? (
                          <span className="text-orange-600">{heatmapAlertCount} alerte{heatmapAlertCount !== 1 ? 's' : ''} détectée{heatmapAlertCount !== 1 ? 's' : ''}</span>
                        ) : (
                          <span className="text-gray-500">Aucune alerte détectée</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      
      <Sheet open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <SheetContent 
          side="right" 
          className="w-full sm:w-[400px] md:w-[500px] lg:w-[600px] xl:w-[700px] max-h-screen"
        >
          <SheetHeader className="sticky top-0 bg-white z-10 pb-4 border-b">
            <SheetTitle className="text-lg md:text-xl">Détails de la serre</SheetTitle>
            <SheetDescription className="text-sm md:text-base">
              Informations détaillées et lecture seule
            </SheetDescription>
          </SheetHeader>
          <div className="mt-4 space-y-6 overflow-y-auto max-h-[calc(100vh-140px)] pr-2">
  
            <Card className="shadow-sm border-gray-200">
              <CardHeader className="pb-3 cursor-pointer hover:bg-gray-50 transition-colors rounded-t-lg" onClick={() => toggleSection('summary')}>
                <CardTitle className="text-base md:text-lg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    Informations générales
                  </div>
                  <div className="text-gray-400 text-lg font-bold">
                    {expandedSections.summary ? '−' : '+'}
                  </div>
                </CardTitle>
              </CardHeader>
              {expandedSections.summary && (
                <CardContent className="pt-0">
                  <div className="grid grid-cols-1 gap-3 text-sm">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <span className="text-gray-600 font-medium">Nom</span>
                      <span className="font-semibold text-gray-900">{selectedSerre?.nom}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <span className="text-gray-600 font-medium">Variété</span>
                      <span className="font-semibold text-gray-900">{selectedSerre?.variety || '—'}</span>
                    </div>
                                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                              <span className="text-gray-600 font-medium">Surface</span>
                              <span className="font-semibold text-gray-900">{Number(selectedSerre?.surface ?? 0).toFixed(2)} m²</span>
                            </div>

                  </div>
                </CardContent>
              )}
            </Card>

  
            <Card className="shadow-sm border-gray-200">
              <CardHeader className="pb-3 cursor-pointer hover:bg-gray-50 transition-colors rounded-t-lg" onClick={() => toggleSection('guides')}>
                <CardTitle className="text-base md:text-lg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    Guides de culture ({selectedSerreGuides.length})
                  </div>
                  <div className="text-gray-400 text-lg font-bold">
                    {expandedSections.guides ? '−' : '+'}
                  </div>
                </CardTitle>
              </CardHeader>
              {expandedSections.guides && (
                <CardContent className="pt-0">
                {selectedSerreGuides.length === 0 ? (
                  <div className="text-center py-6 text-gray-500">
                    <div className="text-4xl mb-2">🌱</div>
                    <div className="text-sm">Aucun guide associé</div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedSerreGuides.map((g: any) => (
                      <div key={g.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-gray-900 text-sm md:text-base">{g.nom || 'Guide'}</h4>
                          <Badge variant="outline" className="text-xs">{g.variete || '—'}</Badge>
                        </div>
                        <div className="grid grid-cols-1 gap-2 text-xs text-gray-600">
                          {g.rendement && (
                            <div className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                              <span className="font-medium text-gray-700">Rendement:</span>
                              <span className="font-semibold text-gray-900">
                                {typeof g.rendement === 'number' ? Number(g.rendement).toFixed(2) : g.rendement} {g.rendement && 'kg/m²'}
                              </span>
                            </div>
                          )}
                          {g.nombre_de_plants && (
                            <div className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                              <span className="font-medium text-gray-700">Nombre de plants:</span>
                              <span className="font-semibold text-gray-900">{g.nombre_de_plants}</span>
                            </div>
                          )}
                          {g.date_debut_saison && g.date_fin_saison && (
                            <div className="flex items-center justify-between p-2 bg-green-50 rounded-md">
                              <span className="font-medium text-green-800">Période de culture:</span>
                              <span className="font-semibold text-green-900">
                                {new Date(g.date_debut_saison).toLocaleDateString('fr-FR')} → {new Date(g.date_fin_saison).toLocaleDateString('fr-FR')}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                </CardContent>
              )}
            </Card>

  
            <Card className="shadow-sm border-gray-200">
              <CardHeader className="pb-3 cursor-pointer hover:bg-gray-50 transition-colors rounded-t-lg" onClick={() => toggleSection('billons')}>
                <CardTitle className="text-base md:text-lg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                    Billons ({selectedSerreBilans.length})
                  </div>
                  <div className="text-gray-400 text-lg font-bold">
                    {expandedSections.billons ? '−' : '+'}
                  </div>
                </CardTitle>
              </CardHeader>
              {expandedSections.billons && (
                <CardContent className="pt-0">
                {selectedSerreBilans.length === 0 ? (
                  <div className="text-center py-6 text-gray-500">
                    <div className="text-4xl mb-2">📊</div>
                    <div className="text-sm">Aucun billon</div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedSerreBilans.map((b: any) => {
                      const etat = selectedSerreBilanEtats[b.id];
                      const etatLabel = b.etat || b.status || b.statut || '—';
                      const createdBy = b.created_by_name || b.created_by || b.auteur || b.id_user || 'Inconnu';
                      return (
                        <div key={b.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h4 className="font-semibold text-gray-900 text-sm md:text-base mb-1">
                                {b.nom || `Bilan #${b.id}`}
                              </h4>
                              <div className="flex items-center gap-2 text-xs text-gray-600">
                                <Badge variant="outline" className="text-xs">
                                  {b.trimestre ? `T${b.trimestre}` : '—'} {b.annee || ''}
                                </Badge>
                                <Badge variant="secondary" className="text-xs">
                                  {etatLabel}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          
                          {etat && (
                            <div className="mb-3 p-3 bg-purple-50 rounded-md">
                              <div className="text-xs font-medium text-purple-800 mb-2">Métriques environnementales</div>
                              <div className="grid grid-cols-1 gap-2 text-xs">
                                {typeof etat.temperature === 'number' && (
                                  <div className="flex items-center justify-between p-2 bg-white rounded-md border border-gray-200">
                                    <div className="flex items-center gap-2">
                                      <span className="text-purple-600">🌡️</span>
                                      <span className="font-medium text-gray-700">Température:</span>
                                    </div>
                                    <span className="font-semibold text-gray-900">{Number(etat.temperature).toFixed(2)}°C</span>
                                  </div>
                                )}
                                {typeof etat.humidite === 'number' && (
                                  <div className="flex items-center justify-between p-2 bg-white rounded-md border border-gray-200">
                                    <div className="flex items-center gap-2">
                                      <span className="text-purple-600">💧</span>
                                      <span className="font-medium text-gray-700">Humidité:</span>
                                    </div>
                                    <span className="font-semibold text-gray-900">{Number(etat.humidite).toFixed(2)}%</span>
                                  </div>
                                )}
                                {typeof etat.luminosite === 'number' && (
                                  <div className="flex items-center justify-between p-2 bg-white rounded-md border border-gray-200">
                                    <div className="flex items-center gap-2">
                                      <span className="text-purple-600">☀️</span>
                                      <span className="font-medium text-gray-700">Luminosité:</span>
                                    </div>
                                    <span className="font-semibold text-gray-900">{Number(etat.luminosite).toFixed(2)} lux</span>
                                  </div>
                                )}
                                {typeof etat.co2 === 'number' && (
                                  <div className="flex items-center justify-between p-2 bg-white rounded-md border border-gray-200">
                                    <div className="flex items-center gap-2">
                                      <span className="text-purple-600">🌬️</span>
                                      <span className="font-medium text-gray-700">CO₂:</span>
                                    </div>
                                    <span className="font-semibold text-gray-900">{Number(etat.co2).toFixed(2)} ppm</span>
                                  </div>
                                )}
                                {typeof etat.rendement === 'number' && (
                                  <div className="flex items-center justify-between p-2 bg-white rounded-md border border-gray-200">
                                    <div className="flex items-center gap-2">
                                      <span className="text-purple-600">📈</span>
                                      <span className="font-medium text-gray-700">Rendement:</span>
                                    </div>
                                    <span className="font-semibold text-gray-900">{Number(etat.rendement).toFixed(2)} kg/m²</span>
                                  </div>
                                )}
                                {etat.date && (
                                  <div className="flex items-center justify-between p-2 bg-blue-50 rounded-md border border-blue-200">
                                    <div className="flex items-center gap-2">
                                      <span className="text-blue-600">📅</span>
                                      <span className="font-medium text-blue-800">Date d'évaluation:</span>
                                    </div>
                                    <span className="font-semibold text-blue-900">
                                      {new Date(etat.date).toLocaleDateString('fr-FR', {
                                        day: '2-digit',
                                        month: '2-digit',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between text-xs text-gray-600">
                            <span className="flex items-center gap-1">
                              <span>👤</span>
                              <span className="font-medium">Créé par:</span>
                              <span>{createdBy}</span>
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                </CardContent>
              )}
            </Card>
          </div>
          <div className="sticky bottom-0 bg-white border-t p-4">
            <SheetClose asChild>
              <Button variant="outline" className="w-full">Fermer</Button>
            </SheetClose>
          </div>
        </SheetContent>
      </Sheet>

      
      <div className="lg:hidden h-full relative">
        
        {isMapLoading && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#B4CC5F] mx-auto mb-4"></div>
              <p className="text-sm text-gray-600">Chargement de la carte et des alertes...</p>
            </div>
          </div>
        )}
        
        
        <div className="w-full h-full relative">
                        {/* Mobile Map Controls and Legend */}
              <div className="absolute top-4 left-4 z-10 flex gap-2">
                {/* Mobile Map Legend */}
                <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-3 border border-gray-200">
            <div className="text-xs font-medium text-gray-700 mb-2">Légende</div>
            <div className="space-y-1.5 text-xs text-gray-600">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span>Serres</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#FFD700]"></div>
                <span>Billons</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span>Domaines</span>
              </div>
                    {showHeatmap && (
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                        <span>Alertes (Carte de chaleur)</span>
                      </div>
                    )}
                  </div>
            </div>
          </div>

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
                }
              }}
              options={{
                mapTypeId: "satellite",
                tilt: 0,
                streetViewControl: false,
                fullscreenControl: false,
                mapTypeControl: false,
                zoomControl: true,
                scaleControl: false,
              }}
            >
  
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
                      lastUpdate: new Date(),
                      supervisedBy: serre.superviseur,
                      bilansCount: serre.nombre_billons || 0,
                      assignedTechnicians: serre.techniciens_associes || [],
                    })}
                  />
                );
              })}
  
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
                    onClick={() => {
                      const selectedSerreData = {
                      id: serre.id.toString(),
                      nom: serre.nom,
                      variety: serre.variete || 'Non spécifiée',
                      surface: serre.surface || 0,
                      location: position,
                      status: serre.statut || 'active',
                      lastUpdate: new Date(),
                      supervisedBy: serre.superviseur,
                      bilansCount: serre.nombre_billons || 0,
                      assignedTechnicians: serre.techniciens_associes || []
                      };
                      setSelectedSerre(selectedSerreData);
                      
                      // Zoom to the selected serre
                      if (map) {
                        map.panTo(position);
                        map.setZoom(16);
                      }
                    }}
                  />
                );
              })}

              {/* Billon Polygons for Mobile */}
              {selectedSerre && selectedSerreBilans.map((bilan: any) => {
                if (!bilan.position || !Array.isArray(bilan.position) || bilan.position.length < 3) {
                  return null;
                }
                
                const polygonPath = bilan.position.map((p: any) => ({
                  lat: p.point_x || p.lat || p.latitude,
                  lng: p.point_y || p.lng || p.longitude
                }));
                
                return (
                  <Polygon
                    key={`mobile-bilan-${bilan.id}`}
                    path={polygonPath as google.maps.LatLngLiteral[]}
                    options={{
                      strokeColor: '#FFD700',
                      strokeOpacity: 1,
                      strokeWeight: 2,
                      fillColor: '#FFD700',
                      fillOpacity: 0.2,
                      clickable: true,
                    }}
                    onClick={() => {
                      setSelectedBilan({ ...bilan, etat: selectedSerreBilanEtats[bilan.id] });
                      setIsBilanDetailsOpen(true);
                    }}
                  />
                );
              })}

              {/* Alert Heatmap Overlay for Mobile */}
              {selectedSerre && showHeatmap && (
                <AlertHeatmapOverlay
                  serreId={parseInt(selectedSerre.id, 10)}
                  serreName={selectedSerre.nom}
                  serreLocation={selectedSerre.location}
                  map={map}
                  onAlertClick={(alert) => {
                    console.log("Alert clicked:", alert);
                  }}
                  onInterventionClick={(alert) => {
                    console.log("Intervention requested for alert:", alert);
                    setIsInterventionFormOpen(true);
                  }}
                />
              )}

  
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






        </div>

        
        <div className="absolute bottom-6 left-4 z-10">
          <Button
            size="lg"
            className="h-14 w-14 rounded-full shadow-lg bg-[#B4CC5F] hover:bg-[#9BB84F] text-white"
            onClick={() => setIsMobilePanelOpen(!isMobilePanelOpen)}
          >
            {isMobilePanelOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>

        
        <div className={cn(
          "absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl transition-transform duration-300 ease-in-out z-20",
          isMobilePanelOpen ? "translate-y-0" : "translate-y-full"
        )}
        style={{
          height: isMobilePanelOpen ? `${mobilePanelHeight}vh` : '0vh',
          minHeight: isMobilePanelOpen ? '30vh' : '0vh',
          maxHeight: isMobilePanelOpen ? '80vh' : '0vh'
        }}>
          
          <div className="flex items-center justify-between px-4 pt-3 pb-2">
            {/* Close Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobilePanelOpen(false)}
              className="p-1 h-6 w-6 text-gray-500 hover:text-gray-700"
            >
              <X className="h-4 w-4" />
            </Button>
            
            {/* Resize Handle */}
            <div 
              className="flex-1 flex justify-center cursor-ns-resize"
              onMouseDown={(e) => {
                if (e.button === 0) { // Left mouse button only
                  setIsResizing(true);
                  e.preventDefault();
                }
              }}
              onTouchStart={(e) => {
                setIsResizing(true);
                e.preventDefault();
              }}
            >
            <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
            </div>
            
            {/* Panel Height Indicator */}
            <div className="text-xs text-gray-500 px-2">
              {Math.round(mobilePanelHeight)}%
            </div>
          </div>

          
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
              onClick={() => setActiveMobileTab('guides')}
              className={cn(
                "flex-1 py-3 text-sm font-medium transition-colors",
                activeMobileTab === 'guides'
                  ? "text-[#B4CC5F] border-b-2 border-[#B4CC5F]"
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              Guides ({selectedSerreGuides.length})
            </button>
            <button
              onClick={() => setActiveMobileTab('billons')}
              className={cn(
                "flex-1 py-3 text-sm font-medium transition-colors",
                activeMobileTab === 'billons'
                  ? "text-[#B4CC5F] border-b-2 border-[#B4CC5F]"
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              Billons ({selectedSerreBilans.length})
            </button>
            <button
              onClick={() => setActiveMobileTab('etat')}
              className={cn(
                "flex-1 py-3 text-sm font-medium transition-colors",
                activeMobileTab === 'etat'
                  ? "text-[#B4CC5F] border-b-2 border-[#B4CC5F]"
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              État
            </button>
            <button
              onClick={() => selectedSerre && setShowHeatmap(!showHeatmap)}
              className={cn(
                "flex-1 py-3 text-sm font-medium transition-colors",
                !selectedSerre 
                  ? "text-gray-400 cursor-not-allowed" 
                  : showHeatmap
                    ? "text-orange-500 border-b-2 border-orange-500"
                    : "text-gray-500 hover:text-gray-700"
              )}
              disabled={!selectedSerre}
            >
              <Flame className="h-4 w-4 mx-auto mb-1" />
              <span className="text-xs">Carte de chaleur</span>
            </button>

          </div>

          
          <div className="h-full overflow-y-auto scrollbar-mobile" style={{ height: `calc(${mobilePanelHeight}vh - 120px)` }}>
            {activeMobileTab === 'serres' && (
              <div className="p-4 space-y-3">
                {serres.map((serre) => (
                  <Card 
                    key={serre.id} 
                    className={cn(
                      "cursor-pointer transition-all duration-200 hover:shadow-md border",
                      selectedSerre?.id === serre.id 
                        ? "ring-2 ring-[#B4CC5F] border-[#B4CC5F] shadow-lg scale-[1.02]" 
                        : "border-gray-200 hover:border-[#B4CC5F]/50 hover:scale-[1.01]"
                    )} 
                    onClick={() => {
                      handleSelectSerre(serre);
                      setIsMobilePanelOpen(false);
                      // Automatically enable heatmap when a serre is selected
                      setShowHeatmap(true);
                    }}
                  >
                    <CardContent className="p-4">
                      {/* Enhanced Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <div className={cn(
                              "w-2.5 h-2.5 rounded-full shadow-sm",
                              serre.status === "active" ? "bg-green-500" :
                              serre.status === "maintenance" ? "bg-yellow-500" : "bg-red-500"
                            )}></div>
                            <h4 className="font-bold text-gray-900 text-base">{serre.nom}</h4>
                        </div>
                          <p className="text-sm text-gray-600 font-medium">Variété: {serre.variety || "—"}</p>
                        </div>
                        <div className="text-right space-y-1">
                          <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                            {serre.surface} m²
                          </Badge>
                          <div className="text-xs text-gray-500">
                            {serre.lastUpdate.toLocaleDateString('fr-FR')}
                        </div>
                      </div>
                      </div>

                      {/* Enhanced Info Grid */}
                      <div className="grid grid-cols-1 gap-2 mb-3">
                        <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-md border border-blue-100">
                          <Layers className="h-3 w-3 text-blue-600" />
                          <div className="text-xs">
                            <div className="font-medium text-blue-700">Billons</div>
                            <div className="font-bold text-blue-900">{serre.bilansCount ?? 0}</div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Enhanced Assigned Technicians */}
                      {serre.assignedTechnicians && serre.assignedTechnicians.length > 0 && (
                        <div className="mb-3 p-2.5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                          <div className="flex items-center gap-2 mb-2">
                            <Users className="h-3.5 w-3.5 text-blue-600" />
                            <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
                              Technicien{serre.assignedTechnicians.length > 1 ? 's' : ''} assigné{serre.assignedTechnicians.length > 1 ? 's' : ''}
                          </span>
                          </div>
                          <div className="space-y-1">
                            {serre.assignedTechnicians.map((tech, index) => (
                              <div key={tech.id} className="flex items-center justify-between text-xs">
                                <span className="font-medium text-blue-800">{tech.name}</span>
                                <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                                  {tech.email ? tech.email.split('@')[0] : 'Tech'}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Enhanced Action Buttons */}
                      <div className="pt-3 border-t border-gray-100 space-y-2">
                        <Button
                          size="sm"
                          className="w-full bg-[#B4CC5F] hover:bg-[#9BB54A] text-white font-medium"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSerre(serre);
                            setIsAssignDialogOpen(true);
                          }}
                        >
                          <Users className="h-3.5 w-3.5 mr-1.5" />
                          Assigner un technicien
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Could open detailed serre view here
                          }}
                        >
                          <Eye className="h-3.5 w-3.5 mr-1.5" />
                          Voir détails
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {activeMobileTab === 'guides' && (
              <div className="p-4 space-y-3">
                {!selectedSerre ? (
                  <Card className="border-dashed border-2 border-gray-300 bg-gray-50">
                    <CardContent className="p-4 text-center">
                      <BookOpen className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm text-gray-600 mb-3">
                        Sélectionnez d'abord une serre pour voir ses guides de culture
                      </p>
                      <Button
                        onClick={() => setActiveMobileTab('serres')}
                        variant="outline"
                        size="sm"
                      >
                        Choisir une serre
                      </Button>
                    </CardContent>
                  </Card>
                ) : selectedSerreGuides.length === 0 ? (
                  <Card className="border-dashed border-2 border-[#B4CC5F] bg-[#B4CC5F]/5">
                    <CardContent className="p-4 text-center">
                      <BookOpen className="h-8 w-8 mx-auto mb-2 text-[#B4CC5F]" />
                      <h4 className="font-medium text-[#B4CC5F] mb-2">
                        Aucun guide pour {selectedSerre.nom}
                      </h4>
                      <p className="text-xs text-gray-600">
                        Aucun guide de culture n'est associé à cette serre
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {selectedSerreGuides.map((guide: any) => (
                      <Card key={guide.id} className="border border-gray-200 hover:shadow-md transition-shadow">
                        <CardContent className="p-3">
                          <div className="flex items-start justify-between mb-2">
                            <h6 className="font-semibold text-gray-900 text-sm">{guide.nom || 'Guide de culture'}</h6>
                            <Badge variant="outline" className="text-xs">{guide.variete || '—'}</Badge>
                          </div>
                          <div className="space-y-2 text-xs text-gray-600">
                            {guide.rendement && (
                              <div className="flex items-center justify-between p-2 bg-green-50 rounded-md">
                                <span className="font-medium text-green-700">Rendement:</span>
                                <span className="font-semibold text-green-900">
                                  {typeof guide.rendement === 'number' ? Number(guide.rendement).toFixed(2) : guide.rendement} kg/m²
                                </span>
                              </div>
                            )}
                            {guide.nombre_de_plants && (
                              <div className="flex items-center justify-between p-2 bg-green-50 rounded-md">
                                <span className="font-medium text-green-700">Plants:</span>
                                <span className="font-semibold text-green-900">{guide.nombre_de_plants}</span>
                              </div>
                            )}
                            {guide.date_debut_saison && guide.date_fin_saison && (
                              <div className="flex items-center justify-between p-2 bg-green-50 rounded-md">
                                <span className="font-medium text-green-800">Période:</span>
                                <span className="font-semibold text-green-900 text-xs">
                                  {new Date(guide.date_debut_saison).toLocaleDateString('fr-FR')} → {new Date(guide.date_fin_saison).toLocaleDateString('fr-FR')}
                                </span>
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

            {activeMobileTab === 'billons' && (
              <div className="p-4 space-y-3">
                {!selectedSerre ? (
                  <Card className="border-dashed border-2 border-gray-300 bg-gray-50">
                    <CardContent className="p-4 text-center">
                      <FileText className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm text-gray-600 mb-3">
                        Sélectionnez d'abord une serre pour voir ses billons
                      </p>
                      <Button
                        onClick={() => setActiveMobileTab('serres')}
                        variant="outline"
                        size="sm"
                      >
                        Choisir une serre
                      </Button>
                    </CardContent>
                  </Card>
                ) : selectedSerreBilans.length === 0 ? (
                  <Card className="border-dashed border-2 border-[#B4CC5F] bg-[#B4CC5F]/5">
                    <CardContent className="p-4 text-center">
                      <FileText className="h-8 w-8 mx-auto mb-2 text-[#B4CC5F]" />
                      <h4 className="font-medium text-[#B4CC5F] mb-2">
                        Aucun billon pour {selectedSerre.nom}
                      </h4>
                      <p className="text-xs text-gray-600">
                        Aucun billon n'est associé à cette serre
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {selectedSerreBilans.map((bilan: any) => {
                      const etat = selectedSerreBilanEtats[bilan.id];
                      return (
                        <Card 
                          key={bilan.id} 
                          className={cn(
                            "border border-gray-200 hover:shadow-md transition-shadow cursor-pointer",
                            selectedMobileBilan?.id === bilan.id ? "ring-2 ring-[#B4CC5F] border-[#B4CC5F]" : ""
                          )}
                          onClick={() => {
                            setSelectedMobileBilan({ ...bilan, etat });
                            setActiveMobileTab('etat');
                            
                            // Zoom to the billon location on the map
                            if (map && bilan.position && Array.isArray(bilan.position) && bilan.position.length > 0) {
                              const center = bilan.position[0];
                              const position = {
                                lat: center.point_x || center.lat || center.latitude,
                                lng: center.point_y || center.lng || center.longitude
                              };
                              map.panTo(position);
                              map.setZoom(18);
                            }
                          }}
                        >
                          <CardContent className="p-3">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h6 className="font-semibold text-gray-900 text-sm">{bilan.nom || `Bilan #${bilan.id}`}</h6>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant="outline" className="text-xs">
                                    {bilan.trimestre ? `T${bilan.trimestre}` : '—'} {bilan.annee || ''}
                                  </Badge>
                                  {etat && (
                                    <Badge variant="secondary" className="text-xs">
                                      État disponible
                                    </Badge>
                                  )}
                  </div>
                  </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mb-3">
                              <div className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                                <span className="font-medium">Surface:</span>
                                <span className="font-semibold">{Number(bilan.surface).toFixed(2)} m²</span>
                              </div>
                              <div className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                                <span className="font-medium">Type:</span>
                                <span className="font-semibold">{bilan.type || '—'}</span>
                  </div>
                </div>

                            {/* État Bilan Preview */}
                            {etat && (
                              <div className="border-t border-gray-100 pt-3">
                                <h6 className="text-xs font-medium text-gray-700 mb-2 flex items-center gap-2">
                                  <Thermometer className="h-3 w-3 text-purple-500" />
                                  État du Bilan
                                </h6>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  {typeof etat.temperature === 'number' && (
                                    <div className="flex items-center justify-between p-2 bg-purple-50 rounded-md">
                                      <span className="text-purple-700">🌡️</span>
                                      <span className="font-semibold text-purple-900">{Number(etat.temperature).toFixed(1)}°C</span>
                                    </div>
                                  )}
                                  {typeof etat.humidite === 'number' && (
                                    <div className="flex items-center justify-between p-2 bg-purple-50 rounded-md">
                                      <span className="text-purple-700">💧</span>
                                      <span className="font-semibold text-purple-900">{Number(etat.humidite).toFixed(1)}%</span>
                                    </div>
                                  )}
                                  {typeof etat.luminosite === 'number' && (
                                    <div className="flex items-center justify-between p-2 bg-purple-50 rounded-md">
                                      <span className="text-purple-700">☀️</span>
                                      <span className="font-semibold text-purple-900">{Number(etat.luminosite).toFixed(0)} lux</span>
                                    </div>
                                  )}
                                  {typeof etat.co2 === 'number' && (
                                    <div className="flex items-center justify-between p-2 bg-purple-50 rounded-md">
                                      <span className="text-purple-700">🌬️</span>
                                      <span className="font-semibold text-purple-900">{Number(etat.co2).toFixed(0)} ppm</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
                            </div>
            )}

            {/* Heatmap Status Tab */}
            {activeMobileTab === 'heatmap' && (
              <div className="p-4 space-y-3">
                {!selectedSerre ? (
                  <Card className="border-dashed border-2 border-gray-300 bg-gray-50">
                    <CardContent className="p-4 text-center">
                      <Flame className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm text-gray-600 mb-3">
                        Sélectionnez d'abord une serre pour voir sa carte de chaleur
                      </p>
                      <Button
                        onClick={() => setActiveMobileTab('serres')}
                        variant="outline"
                        size="sm"
                      >
                        Choisir une serre
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    <Card className={cn(
                      "border-2 transition-all duration-200",
                      showHeatmap 
                        ? "border-orange-200 bg-orange-50" 
                        : "border-gray-200 bg-gray-50"
                    )}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <Flame className={cn(
                            "h-6 w-6",
                            showHeatmap ? "text-orange-600" : "text-gray-400"
                          )} />
                          <div>
                            <h4 className={cn(
                              "font-semibold",
                              showHeatmap ? "text-orange-900" : "text-gray-700"
                            )}>
                              {showHeatmap ? "Carte de chaleur activée" : "Carte de chaleur inactive"}
                            </h4>
                            <p className={cn(
                              "text-sm",
                              showHeatmap ? "text-orange-700" : "text-gray-500"
                            )}>
                              {showHeatmap 
                                ? `Visualisation des alertes pour ${selectedSerre.nom}`
                                : "Activez la carte de chaleur pour voir les alertes"
                              }
                            </p>
                          </div>
                        </div>
                        
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center justify-between p-2 bg-white rounded-md border border-gray-200">
                            <span className="font-medium text-gray-700">Statut:</span>
                            <Badge variant="secondary" className={cn(
                              showHeatmap 
                                ? "bg-orange-100 text-orange-800" 
                                : "bg-gray-100 text-gray-700"
                            )}>
                              {showHeatmap ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center justify-between p-2 bg-white rounded-md border border-gray-200">
                            <span className="font-medium text-gray-700">Alertes:</span>
                            <span className="font-semibold text-gray-900">
                              {heatmapLoading ? (
                                <span className="text-orange-600">Chargement...</span>
                              ) : heatmapAlertCount > 0 ? (
                                <span className="text-orange-600">{heatmapAlertCount} alerte{heatmapAlertCount !== 1 ? 's' : ''}</span>
                              ) : (
                                <span className="text-gray-500">0 alerte</span>
                              )}
                            </span>
                          </div>
                          
                          <div className="flex items-center justify-between p-2 bg-white rounded-md border border-gray-200">
                            <span className="font-medium text-gray-700">Serre:</span>
                            <span className="font-semibold text-gray-900">{selectedSerre.nom}</span>
                          </div>
                          
                          <div className="flex items-center justify-between p-2 bg-white rounded-md border border-gray-200">
                            <span className="font-medium text-gray-700">Surface:</span>
                            <span className="font-semibold text-gray-900">{selectedSerre.surface} m²</span>
                          </div>
                        </div>
                        
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <Button
                            size="sm"
                            variant={showHeatmap ? "outline" : "default"}
                            className={cn(
                              "w-full transition-all duration-200",
                              showHeatmap 
                                ? "border-orange-500 text-orange-600 hover:bg-orange-50" 
                                : "bg-orange-500 text-white hover:bg-orange-600"
                            )}
                            onClick={() => setShowHeatmap(!showHeatmap)}
                          >
                            <Flame className="h-4 w-4 mr-2" />
                            {showHeatmap ? "Désactiver la carte de chaleur" : "Activer la carte de chaleur"}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="border border-gray-200">
                      <CardContent className="p-4">
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <Activity className="h-5 w-5 text-blue-600" />
                          Informations sur la carte de chaleur
                        </h4>
                        <div className="space-y-2 text-sm text-gray-600">
                          <p>La carte de chaleur affiche les alertes détectées dans cette serre avec un système de couleurs intuitif :</p>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-green-500"></div>
                              <span>Vert : Alertes faibles</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                              <span>Orange : Alertes moyennes</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-red-500"></div>
                              <span>Rouge : Alertes élevées</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            )}

            {activeMobileTab === 'etat' && (
              <div className="p-4 space-y-3">
                {!selectedSerre ? (
                  <Card className="border-dashed border-2 border-gray-300 bg-gray-50">
                    <CardContent className="p-4 text-center">
                      <BarChart3 className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm text-gray-600 mb-3">
                        Sélectionnez d'abord une serre pour voir ses billons
                      </p>
                      <Button
                        onClick={() => setActiveMobileTab('serres')}
                        variant="outline"
                        size="sm"
                      >
                        Choisir une serre
                      </Button>
                    </CardContent>
                  </Card>
                ) : !selectedMobileBilan ? (
                  <Card className="border-dashed border-2 border-[#B4CC5F] bg-[#B4CC5F]/5">
                    <CardContent className="p-4 text-center">
                      <BarChart3 className="h-8 w-8 mx-auto mb-2 text-[#B4CC5F]" />
                      <h4 className="font-medium text-[#B4CC5F] mb-2">
                        Sélectionnez un billon
                      </h4>
                      <p className="text-xs text-gray-600 mb-3">
                        Choisissez un billon dans l'onglet Billons pour voir son état détaillé
                      </p>
                      <Button
                        onClick={() => setActiveMobileTab('billons')}
                        variant="outline"
                        size="sm"
                      >
                        Voir les billons
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {/* Bilan Header */}
                    <Card className="bg-gray-50 border border-gray-200">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{selectedMobileBilan.nom || `Bilan #${selectedMobileBilan.id}`}</h3>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline">
                                {selectedMobileBilan.trimestre ? `T${selectedMobileBilan.trimestre}` : '—'} {selectedMobileBilan.annee || ''}
                              </Badge>
                              <Badge variant="secondary">{selectedMobileBilan.type || '—'}</Badge>
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="bg-white p-3 rounded-md border">
                            <span className="text-gray-600 font-medium">Surface:</span>
                            <span className="ml-2 font-semibold text-gray-900">{Number(selectedMobileBilan.surface).toFixed(2)} m²</span>
                          </div>
                          <div className="bg-white p-3 rounded-md border">
                            <span className="text-gray-600 font-medium">Type:</span>
                            <span className="ml-2 font-semibold text-gray-900">{selectedMobileBilan.type || '—'}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* État du Bilan */}
                    {selectedMobileBilan.etat ? (
                      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200">
                        <CardContent className="p-4">
                          <h4 className="text-lg font-semibold text-purple-900 mb-4 flex items-center gap-2">
                            <Thermometer className="h-5 w-5" />
                            État du Bilan - {selectedMobileBilan.etat.date && new Date(selectedMobileBilan.etat.date).toLocaleDateString('fr-FR')}
                          </h4>
                          
                          <div className="grid grid-cols-2 gap-3">
                            {typeof selectedMobileBilan.etat.temperature === 'number' && (
                              <div className="bg-white p-3 rounded-lg border border-purple-200 shadow-sm">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                                    <span className="text-lg">🌡️</span>
                                  </div>
                                  <div>
                                    <p className="text-xs font-medium text-gray-600">Température</p>
                                    <p className="text-lg font-bold text-red-600">{Number(selectedMobileBilan.etat.temperature).toFixed(1)}°C</p>
                                  </div>
                                </div>
              </div>
            )}
                            
                            {typeof selectedMobileBilan.etat.humidite === 'number' && (
                              <div className="bg-white p-3 rounded-lg border border-purple-200 shadow-sm">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                    <span className="text-lg">💧</span>
          </div>
                                  <div>
                                    <p className="text-xs font-medium text-gray-600">Humidité</p>
                                    <p className="text-lg font-bold text-blue-600">{Number(selectedMobileBilan.etat.humidite).toFixed(1)}%</p>
        </div>
                                </div>
                              </div>
                            )}
                            
                            {typeof selectedMobileBilan.etat.luminosite === 'number' && (
                              <div className="bg-white p-3 rounded-lg border border-purple-200 shadow-sm">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                                    <span className="text-lg">☀️</span>
                                  </div>
                                  <div>
                                    <p className="text-xs font-medium text-gray-600">Luminosité</p>
                                    <p className="text-lg font-bold text-yellow-600">{Number(selectedMobileBilan.etat.luminosite).toFixed(0)} lux</p>
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            {typeof selectedMobileBilan.etat.co2 === 'number' && (
                              <div className="bg-white p-3 rounded-lg border border-purple-200 shadow-sm">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                    <span className="text-lg">🌬️</span>
                                    </div>
                                  <div>
                                    <p className="text-xs font-medium text-gray-600">CO₂</p>
                                    <p className="text-lg font-bold text-green-600">{Number(selectedMobileBilan.etat.co2).toFixed(0)} ppm</p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                          
                          {typeof selectedMobileBilan.etat.rendement === 'number' && (
                            <div className="mt-4 bg-white p-3 rounded-lg border border-purple-200 shadow-sm">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                                  <span className="text-lg">📈</span>
      </div>
                                <div>
                                  <p className="text-xs font-medium text-gray-600">Rendement</p>
                                  <p className="text-lg font-bold text-emerald-600">{Number(selectedMobileBilan.etat.rendement).toFixed(2)} kg/m²</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ) : (
                      <Card className="border-dashed border-2 border-gray-300 bg-gray-50">
                        <CardContent className="p-4 text-center">
                          <BarChart3 className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                          <h4 className="font-medium text-gray-600 mb-2">
                            Aucun état disponible
                          </h4>
                          <p className="text-xs text-gray-500">
                            Les métriques environnementales n'ont pas encore été enregistrées pour ce bilan.
                          </p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeMobileTab === 'etat' && (
              <div className="p-4 space-y-3">
                {!selectedSerre ? (
                  <Card className="border-dashed border-2 border-gray-300 bg-gray-50">
                    <CardContent className="p-4 text-center">
                      <BarChart3 className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm text-gray-600 mb-3">
                        Sélectionnez d'abord une serre pour voir ses billons
                      </p>
                      <Button
                        onClick={() => setActiveMobileTab('serres')}
                        variant="outline"
                        size="sm"
                      >
                        Choisir une serre
                      </Button>
                    </CardContent>
                  </Card>
                ) : !selectedMobileBilan ? (
                  <Card className="border-dashed border-2 border-[#B4CC5F] bg-[#B4CC5F]/5">
                    <CardContent className="p-4 text-center">
                      <BarChart3 className="h-8 w-8 mx-auto mb-2 text-[#B4CC5F]" />
                      <h4 className="font-medium text-[#B4CC5F] mb-2">
                        Sélectionnez un billon
                      </h4>
                      <p className="text-xs text-gray-600 mb-3">
                        Choisissez un billon dans l'onglet Billons pour voir son état détaillé
                      </p>
                      <Button
                        onClick={() => setActiveMobileTab('billons')}
                        variant="outline"
                        size="sm"
                      >
                        Voir les billons
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {/* Bilan Header */}
                    <Card className="bg-gray-50 border border-gray-200">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{selectedMobileBilan.nom || `Bilan #${selectedMobileBilan.id}`}</h3>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline">
                                {selectedMobileBilan.trimestre ? `T${selectedMobileBilan.trimestre}` : '—'} {selectedMobileBilan.annee || ''}
                              </Badge>
                              <Badge variant="secondary">{selectedMobileBilan.type || '—'}</Badge>
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="bg-white p-3 rounded-md border">
                            <span className="text-gray-600 font-medium">Surface:</span>
                            <span className="ml-2 font-semibold text-gray-900">{Number(selectedMobileBilan.surface).toFixed(2)} m²</span>
                          </div>
                          <div className="bg-white p-3 rounded-md border">
                            <span className="text-gray-600 font-medium">Type:</span>
                            <span className="ml-2 font-semibold text-gray-900">{selectedMobileBilan.type || '—'}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* État du Bilan */}
                    {selectedMobileBilan.etat ? (
                      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200">
                        <CardContent className="p-4">
                          <h4 className="text-lg font-semibold text-purple-900 mb-4 flex items-center gap-2">
                            <Thermometer className="h-5 w-5" />
                            État du Bilan - {selectedMobileBilan.etat.date && new Date(selectedMobileBilan.etat.date).toLocaleDateString('fr-FR')}
                          </h4>
                          
                          <div className="grid grid-cols-2 gap-3">
                            {typeof selectedMobileBilan.etat.temperature === 'number' && (
                              <div className="bg-white p-3 rounded-lg border border-purple-200 shadow-sm">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                                    <span className="text-lg">🌡️</span>
                                  </div>
                                  <div>
                                    <p className="text-xs font-medium text-gray-600">Température</p>
                                    <p className="text-lg font-bold text-red-600">{Number(selectedMobileBilan.etat.temperature).toFixed(1)}°C</p>
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            {typeof selectedMobileBilan.etat.humidite === 'number' && (
                              <div className="bg-white p-3 rounded-lg border border-purple-200 shadow-sm">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                    <span className="text-lg">💧</span>
                                  </div>
                                  <div>
                                    <p className="text-xs font-medium text-gray-600">Humidité</p>
                                    <p className="text-lg font-bold text-blue-600">{Number(selectedMobileBilan.etat.humidite).toFixed(1)}%</p>
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            {typeof selectedMobileBilan.etat.luminosite === 'number' && (
                              <div className="bg-white p-3 rounded-lg border border-purple-200 shadow-sm">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                                    <span className="text-lg">☀️</span>
                                  </div>
                                  <div>
                                    <p className="text-xs font-medium text-gray-600">Luminosité</p>
                                    <p className="text-lg font-bold text-yellow-600">{Number(selectedMobileBilan.etat.luminosite).toFixed(0)} lux</p>
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            {typeof selectedMobileBilan.etat.co2 === 'number' && (
                              <div className="bg-white p-3 rounded-lg border border-purple-200 shadow-sm">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                    <span className="text-lg">🌬️</span>
                                  </div>
                                  <div>
                                    <p className="text-xs font-medium text-gray-600">CO₂</p>
                                    <p className="text-lg font-bold text-green-600">{Number(selectedMobileBilan.etat.co2).toFixed(0)} ppm</p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                          
                          {typeof selectedMobileBilan.etat.rendement === 'number' && (
                            <div className="mt-4 bg-white p-3 rounded-lg border border-purple-200 shadow-sm">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                                  <span className="text-lg">📈</span>
                                </div>
                                <div>
                                  <p className="text-xs font-medium text-gray-600">Rendement</p>
                                  <p className="text-lg font-bold text-emerald-600">{Number(selectedMobileBilan.etat.rendement).toFixed(2)} kg/m²</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ) : (
                      <Card className="border-dashed border-2 border-gray-300 bg-gray-50">
                        <CardContent className="p-4 text-center">
                          <BarChart3 className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                          <h4 className="font-medium text-gray-600 mb-2">
                            Aucun état disponible
                          </h4>
                          <p className="text-xs text-gray-500">
                            Les métriques environnementales n'ont pas encore été enregistrées pour ce bilan.
                          </p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}
              </div>
            )}

            
          </div>
        </div>

        
        
      </div>

      
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

      
      {/* Bilan Details Modal */}
      <Dialog open={isBilanDetailsOpen} onOpenChange={setIsBilanDetailsOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg">Détails du Bilan</DialogTitle>
          </DialogHeader>
          {selectedBilan && (
            <div className="space-y-6">
              {/* Bilan Header */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">{selectedBilan.nom || `Bilan #${selectedBilan.id}`}</h3>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline">
                        {selectedBilan.trimestre ? `T${selectedBilan.trimestre}` : '—'} {selectedBilan.annee || ''}
                      </Badge>
                      <Badge variant="secondary">{selectedBilan.type || '—'}</Badge>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-white p-3 rounded-md border">
                    <span className="text-gray-600 font-medium">Surface:</span>
                    <span className="ml-2 font-semibold text-gray-900">{Number(selectedBilan.surface).toFixed(2)} m²</span>
                  </div>
                  <div className="bg-white p-3 rounded-md border">
                    <span className="text-gray-600 font-medium">Type:</span>
                    <span className="ml-2 font-semibold text-gray-900">{selectedBilan.type || '—'}</span>
                  </div>
                </div>
              </div>

              {/* État du Bilan */}
              {selectedBilan.etat && (
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6 border border-purple-200">
                  <h4 className="text-lg font-semibold text-purple-900 mb-4 flex items-center gap-2">
                    <Thermometer className="h-5 w-5" />
                    État du Bilan - {selectedBilan.etat.date && new Date(selectedBilan.etat.date).toLocaleDateString('fr-FR')}
                  </h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {typeof selectedBilan.etat.temperature === 'number' && (
                      <div className="bg-white p-4 rounded-lg border border-purple-200 shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                            <span className="text-2xl">🌡️</span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-600">Température</p>
                            <p className="text-xl font-bold text-red-600">{Number(selectedBilan.etat.temperature).toFixed(1)}°C</p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {typeof selectedBilan.etat.humidite === 'number' && (
                      <div className="bg-white p-4 rounded-lg border border-purple-200 shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-2xl">💧</span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-600">Humidité</p>
                            <p className="text-xl font-bold text-blue-600">{Number(selectedBilan.etat.humidite).toFixed(1)}%</p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {typeof selectedBilan.etat.luminosite === 'number' && (
                      <div className="bg-white p-4 rounded-lg border border-purple-200 shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                            <span className="text-2xl">☀️</span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-600">Luminosité</p>
                            <p className="text-xl font-bold text-yellow-600">{Number(selectedBilan.etat.luminosite).toFixed(0)} lux</p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {typeof selectedBilan.etat.co2 === 'number' && (
                      <div className="bg-white p-4 rounded-lg border border-purple-200 shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                            <span className="text-2xl">🌬️</span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-600">CO₂</p>
                            <p className="text-xl font-bold text-green-600">{Number(selectedBilan.etat.co2).toFixed(0)} ppm</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {typeof selectedBilan.etat.rendement === 'number' && (
                    <div className="mt-4 bg-white p-4 rounded-lg border border-purple-200 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                          <span className="text-2xl">📈</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">Rendement</p>
                          <p className="text-xl font-bold text-emerald-600">{Number(selectedBilan.etat.rendement).toFixed(2)} kg/m²</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* No État Available */}
              {!selectedBilan.etat && (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">📊</div>
                  <div className="text-lg font-medium">Aucun état disponible</div>
                  <div className="text-sm">Les métriques environnementales n'ont pas encore été enregistrées pour ce bilan.</div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      <InterventionForm
        isOpen={isInterventionFormOpen}
        onClose={() => setIsInterventionFormOpen(false)}
        onSubmit={handleInterventionSubmit}
      />
    </div>
  );
}

import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import GoogleMapsWrapper from "../components/GoogleMapsWrapper";
import { GoogleMap, Marker, InfoWindow, Polygon, useLoadScript } from "@react-google-maps/api";
import { GOOGLE_MAPS_CONFIG } from "../config/maps";
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
  TrendingUp,
  AlertTriangle,
  Search,
  Building,
} from "lucide-react";
import TechnicianSidebar from "../components/TechnicianSidebar";
import InterventionForm from "../components/InterventionForm";
import BilanCreation from "../components/BilanCreation";
import BilanMapComponent from "../components/BilanMapComponent";
import AlertHeatmapOverlay from "../components/AlertHeatmapOverlay";
import { cn } from "@/lib/utils";
import { bilanService, Bilan } from "../services/bilanService";
import { serreService } from "../services/serreService";
import { guideService, GuideDeCulture } from "../services/guideService";
import { etatBilanService, EtatBilan } from "../services/etatBilanService";
import { Alert } from "@/types/alert";

// Custom hook for mobile detection
const useMediaQuery = (query: string) => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [matches, query]);

  return matches;
};

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
  billonCount?: number; // Add billon count
  cultureGuide?: {      // Add culture guide info
    variete: string;
    rendement: number;
  };
  position?: Array<{
    point_x?: number;
    point_y?: number;
    lat?: number;
    lng?: number;
    latitude?: number;
    longitude?: number;
  }>;
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
  const isMobile = useMediaQuery('(max-width: 1024px)');
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
  const [bilanQRCodes, setBilanQRCodes] = useState<{ [bilanId: number]: Blob | 'loading' }>({});

  // Billon visualization state
  const [isBilanDetailsOpen, setIsBilanDetailsOpen] = useState(false);
  const [selectedBilanDetails, setSelectedBilanDetails] = useState<{ bilan: Bilan, etat?: EtatBilan } | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);

  // Mobile responsive state
  const [isMobilePanelOpen, setIsMobilePanelOpen] = useState(false);
  const [activeMobileTab, setActiveMobileTab] = useState<'serres' | 'bilan' | 'details' | 'guides' | 'etat' | 'alerts'>('serres');
  
  // Mobile panel resizing state - simplified
  const [mobilePanelHeight, setMobilePanelHeight] = useState(() => {
    // Set better default height based on screen size
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768 ? 60 : 70; // Smaller default on very small screens
    }
    return 70;
  });
  const [isMobilePanelResizing, setIsMobilePanelResizing] = useState(false);
  const [mobilePanelStartY, setMobilePanelStartY] = useState(0);
  const [mobilePanelStartHeight, setMobilePanelStartHeight] = useState(0);

  // Legend expansion state for mobile
  const [isLegendExpanded, setIsLegendExpanded] = useState(false);

  // Google Maps loading hook
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: GOOGLE_MAPS_CONFIG.API_KEY,
    libraries: GOOGLE_MAPS_CONFIG.LIBRARIES as ("drawing" | "geometry" | "places" | "visualization")[],
  });

  // Alert heatmap state
  const [showAlertHeatmap, setShowAlertHeatmap] = useState(true);
  const [showBillons, setShowBillons] = useState(true);
  const [showSerreBoundaries, setShowSerreBoundaries] = useState(true);

  // Left panel resizing and search state
  const [leftPanelWidth, setLeftPanelWidth] = useState(() => {
    const saved = localStorage.getItem('technicianMapPanelWidth');
    return saved ? parseInt(saved) : 384; // Default 384px (lg:w-96)
  });
  const [isResizing, setIsResizing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{
    serres: Serre[];
    guides: GuideDeCulture[];
    bilans: Bilan[];
    etatBilans: EtatBilan[];
  }>({ serres: [], guides: [], bilans: [], etatBilans: [] });

  // Load serres assigned to the current technician
  useEffect(() => {
    const loadAssignedSerres = async () => {
      if (!user) return;
      
      try {
        setIsLoadingSerres(true);
        setSerresError(null);
        

        const assignedSerres = await serreService.getSerresByCurrentUser();
        
        // Transform the backend data to match our Serre interface
        const transformedSerres: Serre[] = await Promise.all(assignedSerres.map(async (serre: any) => {
          // Get billons count for this serre
          let billonCount = 0;
          try {
            const serreBilans = await bilanService.getBilansBySerre(parseInt(serre.id || serre.id_serre));
            billonCount = Array.isArray(serreBilans) ? serreBilans.length : 0;
          } catch (error) {
            // Could not load billons for serre
          }

          // Get culture guide for this serre
          let cultureGuide = undefined;
          try {
            const serreGuides = await guideService.getGuidesBySerre(parseInt(serre.id || serre.id_serre));
            if (serreGuides && serreGuides.length > 0) {
              const guide = serreGuides[0]; // Take the first guide
              cultureGuide = {
                variete: guide.variete || 'Non spécifiée',
                rendement: guide.rendement || 0
              };
            }
          } catch (error) {
            // Could not load culture guide for serre
          }

          return {
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
            billonCount,
            cultureGuide,
            position: serre.position || [], // Add serre boundary coordinates
          };
        }));
        

        setSerres(transformedSerres);
        
        // If there are serres, select the first one by default
        if (transformedSerres.length > 0 && !selectedSerre) {
          setSelectedSerre(transformedSerres[0]);
        }
      } catch (error: any) {
        setSerresError(error.message || 'Erreur lors du chargement des serres assignées');
        setSerres([]);
      } finally {
        setIsLoadingSerres(false);
      }
    };

    loadAssignedSerres();
  }, [user]);

  // Load billons and guides for selected serre
  useEffect(() => {
    if (selectedSerre) {
      loadBilansForSerre(parseInt(selectedSerre.id));
      loadGuidesForSerre(parseInt(selectedSerre.id));
    } else {
      setBilans([]); // Reset billons when no serre is selected
      setGuides([]); // Reset guides when no serre is selected
    }
  }, [selectedSerre]);

  const loadBilansForSerre = async (serreId: number) => {
    try {
      setIsLoadingBilans(true);
      
      
      const serreBilans = await bilanService.getBilansBySerre(serreId);
      
      
      // Ensure we always set an array, even if the API returns unexpected data
      if (Array.isArray(serreBilans)) {
        setBilans(serreBilans);
      } else {
        setBilans([]);
      }
    } catch (error: any) {
      setBilans([]); // Set empty array on error
    } finally {
      setIsLoadingBilans(false);
    }
  };

  const handleBilanCreated = async () => {
    if (selectedSerre) {
      await loadBilansForSerre(parseInt(selectedSerre.id));
      // Also refresh guides when a new billon is created
      await loadGuidesForSerre(parseInt(selectedSerre.id));
      // Refresh serre data to update billon count
      await refreshSerreData();
    }
    setIsCreatingBilan(false);
  };

  // Function to refresh serre data (including billon count and culture guide)
  const refreshSerreData = async () => {
    if (!user) return;
    
    try {
      const assignedSerres = await serreService.getSerresByCurrentUser();
      
      // Transform the backend data to match our Serre interface
      const transformedSerres: Serre[] = await Promise.all(assignedSerres.map(async (serre: any) => {
        // Get billons count for this serre
        let billonCount = 0;
        try {
          const serreBilans = await bilanService.getBilansBySerre(parseInt(serre.id || serre.id_serre));
          billonCount = Array.isArray(serreBilans) ? serreBilans.length : 0;
        } catch (error) {
          // Could not load billons for serre
        }

        // Get culture guide for this serre
        let cultureGuide = undefined;
        try {
          const serreGuides = await guideService.getGuidesBySerre(parseInt(serre.id || serre.id_serre));
          if (serreGuides && serreGuides.length > 0) {
            const guide = serreGuides[0]; // Take the first guide
            cultureGuide = {
              variete: guide.variete || 'Non spécifiée',
              rendement: guide.rendement || 0
            };
          }
        } catch (error) {
          // Could not load culture guide for serre
        }

        return {
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
          billonCount,
          cultureGuide,
        };
      }));

      setSerres(transformedSerres);
      
      // Update selected serre if it exists
      if (selectedSerre) {
        const updatedSelectedSerre = transformedSerres.find(s => s.id === selectedSerre.id);
        if (updatedSelectedSerre) {
          setSelectedSerre(updatedSelectedSerre);
        }
      }
    } catch (error: any) {
      // Error refreshing serre data
    }
  };

  const handleAlertClick = (alert: Alert) => {
    
    // You can implement navigation to alert details or open a modal
  };

  const toggleAlertHeatmap = () => {
    const newState = !showAlertHeatmap;
    setShowAlertHeatmap(newState);
    if (!showAlertHeatmap) {
      setActiveMobileTab('alerts');
    }
  };

  const toggleBillons = () => {
    setShowBillons(!showBillons);
  };

  const toggleSerreBoundaries = () => {
    setShowSerreBoundaries(!showSerreBoundaries);
  };

  // Load guides for selected serre
  const loadGuidesForSerre = async (serreId: number) => {
    try {
      setIsLoadingGuides(true);
      
      
      // Try to use the new method first, fallback to filtering if it doesn't exist
      try {
        const serreGuides = await guideService.getGuidesBySerre(serreId);
        
        setGuides(serreGuides);
      } catch (apiError: any) {
        // Fallback to fetching all guides and filtering
        
        const allGuides = await guideService.getGuides();
        
        
        const filteredGuides = allGuides.filter(guide => {
          const guideSerreId = parseInt(guide.id_serre);
          const matches = guideSerreId === serreId;
          
          return matches;
        });
        
      setGuides(filteredGuides);
      }
    } catch (error: any) {
      setGuides([]);
    } finally {
      setIsLoadingGuides(false);
    }
  };

  // Load etat de billon for selected billon
  const loadEtatBilanForBilan = async (bilanId: number) => {
    try {
      setIsLoadingEtatBilans(true);
      
      
      const etatBilanData = await etatBilanService.getEtatBilanByBilan(bilanId);
      
      
      // Ensure we always set an array
      if (Array.isArray(etatBilanData)) {
      setEtatBilans(etatBilanData);
      } else {
        setEtatBilans([]);
      }
    } catch (error: any) {
      setEtatBilans([]);
    } finally {
      setIsLoadingEtatBilans(false);
    }
  };

  // Handle billon selection
  const handleBilanSelect = (bilan: Bilan) => {
    setSelectedBilan(bilan);
    loadEtatBilanForBilan(bilan.id);
  };

  // Handle QR code generation for specific billon - simplified
  const handleGenerateQRCodeForBilan = async (bilan: Bilan) => {
    try {
      // Show loading state
      setBilanQRCodes(prev => ({
        ...prev,
        [bilan.id]: 'loading' as any
      }));

      // Generate QR code using the billon service
      const qrCodeBlob = await bilanService.generateBilanQRCode(bilan.id);

      // Store the QR code in state
      setBilanQRCodes(prev => ({
        ...prev,
        [bilan.id]: qrCodeBlob
      }));

      // Auto-expand mobile panel to show QR code if on mobile
      if (isMobile) {
        setIsMobilePanelOpen(true);
        setMobilePanelHeight(85); // Simple height for QR viewing
        setActiveMobileTab('bilan');
      }

    } catch (error) {
      // Remove loading state on error
      setBilanQRCodes(prev => {
        const newState = { ...prev };
        delete newState[bilan.id];
        return newState;
      });
      alert(`Erreur lors de la génération du QR Code: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  };

  // Handle checking etat billon for specific billon with transition
  const handleCheckEtatBilanForBilan = (bilan: Bilan) => {
    // First select the bilan
    handleBilanSelect(bilan);
    
    // Set active mobile tab to 'etat' for mobile users
    if (window.innerWidth <= 768) {
      setActiveMobileTab('etat');
      // Add a smooth transition effect
      setTimeout(() => {
        // Scroll to the etat section smoothly
        const etatSection = document.querySelector('[data-tab="etat"]');
        if (etatSection) {
          etatSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
    
    // For desktop, add a smooth visual highlight effect to the etat section
    setTimeout(() => {
      const etatSection = document.querySelector('[data-section="etat-bilan"]');
      if (etatSection) {
        // Add smooth transition classes
        etatSection.classList.add('ring-2', 'ring-green-500', 'ring-opacity-50', 'scale-105', 'transition-all', 'duration-500', 'ease-in-out');
        
        // Smoothly scroll to the etat section
        etatSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        
        // Remove highlight effect after animation
        setTimeout(() => {
          etatSection.classList.remove('ring-2', 'ring-green-500', 'ring-opacity-50', 'scale-105');
        }, 2000);
      }
    }, 300);
    
    // The etat bilan section will automatically show when the bilan is selected
  };

  // Refresh guides for current serre
  const refreshGuides = async () => {
    if (selectedSerre) {
      await loadGuidesForSerre(parseInt(selectedSerre.id));
    }
  };

  // Search functionality
  const performSearch = (query: string) => {
    if (!query.trim()) {
      setSearchResults({ serres: [], guides: [], bilans: [], etatBilans: [] });
      return;
    }

    const lowerQuery = query.toLowerCase();
    
    // Search in serres
    const matchingSerres = serres.filter(serre => 
      serre.nom.toLowerCase().includes(lowerQuery) ||
      serre.variety?.toLowerCase().includes(lowerQuery) ||
      serre.cultureGuide?.variete?.toLowerCase().includes(lowerQuery)
    );

    // Search in guides
    const matchingGuides = guides.filter(guide => 
      guide.nom.toLowerCase().includes(lowerQuery) ||
      guide.variete.toLowerCase().includes(lowerQuery)
    );

    // Search in billons
    const matchingBilans = bilans.filter(bilan => 
      bilan.nom.toLowerCase().includes(lowerQuery)
    );

    // Search in etat billons
    const matchingEtatBilans = etatBilans.filter(etat => 
      etat.rendement?.toString().includes(lowerQuery) ||
      etat.temperature?.toString().includes(lowerQuery)
    );

    setSearchResults({
      serres: matchingSerres,
      guides: matchingGuides,
      bilans: matchingBilans,
      etatBilans: matchingEtatBilans
    });
  };

  // Handle search input changes
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    performSearch(query);
  };

  // Panel resizing handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsResizing(true);
    e.preventDefault();
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing) return;
    
    const newWidth = e.clientX;
    if (newWidth >= 320 && newWidth <= 600) {
      setLeftPanelWidth(newWidth);
      localStorage.setItem('technicianMapPanelWidth', newWidth.toString());
    }
  };

  const handleMouseUp = () => {
    setIsResizing(false);
  };

  // Add and remove mouse event listeners
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K to focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.querySelector('input[placeholder*="Rechercher"]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
      }
      // Escape to clear search
      if (e.key === 'Escape' && searchQuery) {
        setSearchQuery('');
        setSearchResults({ serres: [], guides: [], bilans: [], etatBilans: [] });
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [searchQuery]);



  const smoothZoomToLocation = (
    map: any,
    location: { lat: number; lng: number },
    targetZoom: number,
  ) => {
    map.panTo(location);

    // Set zoom directly without interval to avoid constant re-renders
    map.setZoom(targetZoom);
  };

  const handleSelectSerre = (serre: Serre) => {
    setSelectedSerre(serre);
    setIsCreatingBilan(false);
    loadBilansForSerre(parseInt(serre.id));
    loadGuidesForSerre(parseInt(serre.id));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "optimal":
        return "bg-greener-100 text-greener-800 border-greener-300";
      case "warning":
        return "bg-orange-100 text-orange-800 border-orange-300";
      case "critical":
        return "bg-red-100 text-red-800 border-red-300";
      case "active":
        return "bg-greener-100 text-greener-800 border-greener-300";
      case "maintenance":
        return "bg-orange-100 text-orange-800 border-orange-300";
      case "planted":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "growing":
        return "bg-greener-100 text-greener-800 border-greener-300";
      case "ready":
        return "bg-purple-100 text-purple-800 border-purple-300";
      case "harvested":
        return "bg-orange-100 text-orange-800 border-orange-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const handleInterventionSubmit = (data: any) => {
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
            (total, serre) => total + (serre.billonCount || 0),
    0,
  );

  // Handle viewing QR code for specific billon
  const handleViewQRCodeForBilan = (bilan: Bilan) => {
    const qrCodeBlob = bilanQRCodes[bilan.id];
    if (qrCodeBlob && qrCodeBlob !== 'loading') {
      const url = URL.createObjectURL(qrCodeBlob);
      window.open(url, '_blank');
      URL.revokeObjectURL(url);
    }
  };

  // Handle downloading QR code for specific billon
  const handleDownloadQRCodeForBilan = (bilan: Bilan) => {
    const qrCodeBlob = bilanQRCodes[bilan.id];
    if (qrCodeBlob && qrCodeBlob !== 'loading') {
      const url = URL.createObjectURL(qrCodeBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `billon_${bilan.nom}_qrcode.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  // Handle QR code view and download for mobile - simplified
  const handleViewQRCode = (bilanId: number) => {
    const qrCode = bilanQRCodes[bilanId];
    if (qrCode && qrCode !== 'loading') {
      if (isMobile) {
        // On mobile, expand the panel and switch to bilan tab for better viewing
        setIsMobilePanelOpen(true);
        setMobilePanelHeight(85); // Simple height for QR viewing
        setActiveMobileTab('bilan');
      } else {
        // Desktop behavior - open in new tab
        const url = URL.createObjectURL(qrCode);
        window.open(url, '_blank');
        URL.revokeObjectURL(url);
      }
    }
  };

  const handleDownloadQRCode = (bilanId: number, bilanNom: string) => {
    const qrCode = bilanQRCodes[bilanId];
    if (qrCode && qrCode !== 'loading') {
      const url = URL.createObjectURL(qrCode);
      const link = document.createElement('a');
      link.href = url;
      link.download = `QR_${bilanNom}_${bilanId}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  // Simplified Mobile panel resizing handlers - no complex snapping
  const handleMobilePanelMouseDown = (e: React.TouchEvent | React.MouseEvent) => {
    setIsMobilePanelResizing(true);
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setMobilePanelStartY(clientY);
    setMobilePanelStartHeight(mobilePanelHeight);
    
    // Add visual feedback
    document.body.style.cursor = 'ns-resize';
    document.body.style.userSelect = 'none';
  };

  const handleMobilePanelMouseMove = (e: TouchEvent | MouseEvent) => {
    if (!isMobilePanelResizing) return;
    
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const deltaY = mobilePanelStartY - clientY;
    
    // Calculate new height based on screen size
    const screenHeight = window.innerHeight;
    const maxHeight = Math.min(95, (screenHeight - 100) / screenHeight * 100); // Account for safe areas
    const minHeight = screenHeight < 600 ? 25 : 20; // Smaller minimum on very small screens
    
    // Simple linear resizing with better bounds
    const newHeight = Math.max(minHeight, Math.min(maxHeight, mobilePanelStartHeight + (deltaY / screenHeight) * 100));
    setMobilePanelHeight(newHeight);
  };

  const handleMobilePanelMouseUp = () => {
    setIsMobilePanelResizing(false);
    
    // Remove visual feedback
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    
    // Snap to reasonable heights for better UX
    if (mobilePanelHeight < 35) {
      setMobilePanelHeight(30); // Compact view
    } else if (mobilePanelHeight < 55) {
      setMobilePanelHeight(50); // Medium view
    } else if (mobilePanelHeight < 75) {
      setMobilePanelHeight(70); // Normal view
    } else {
      setMobilePanelHeight(85); // Extended view
    }
  };

  // Add touch and mouse event listeners for mobile panel resizing
  useEffect(() => {
    if (isMobilePanelResizing) {
      document.addEventListener('mousemove', handleMobilePanelMouseMove);
      document.addEventListener('mouseup', handleMobilePanelMouseUp);
      document.addEventListener('touchmove', handleMobilePanelMouseMove);
      document.addEventListener('touchend', handleMobilePanelMouseUp);
    } else {
      document.removeEventListener('mousemove', handleMobilePanelMouseMove);
      document.removeEventListener('mouseup', handleMobilePanelMouseUp);
      document.removeEventListener('touchmove', handleMobilePanelMouseMove);
      document.removeEventListener('touchend', handleMobilePanelMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMobilePanelMouseMove);
      document.removeEventListener('mouseup', handleMobilePanelMouseUp);
      document.removeEventListener('touchmove', handleMobilePanelMouseMove);
      document.removeEventListener('touchend', handleMobilePanelMouseUp);
    };
  }, [isMobilePanelResizing]);

  // Handle mobile panel height adjustments for different screen sizes
  useEffect(() => {
    const handleResize = () => {
      if (isMobile) {
        // Adjust panel height based on screen size
        if (window.innerWidth < 480) {
          // Very small screens
          if (mobilePanelHeight > 80) {
            setMobilePanelHeight(60);
          }
        } else if (window.innerWidth < 768) {
          // Small screens
          if (mobilePanelHeight > 85) {
            setMobilePanelHeight(70);
          }
        }
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobile, mobilePanelHeight]);

  // Smart panel height adjustment for content viewing - simplified
  const adjustPanelForContent = (contentType: 'qr' | 'default') => {
    if (isMobile && contentType === 'qr' && mobilePanelHeight < 80) {
      setMobilePanelHeight(85); // Simple adjustment for QR viewing
    }
  };

  // Remove keyboard shortcuts for mobile panel resizing - simplified approach

  // Handle Google Maps loading states
  if (loadError) {
    return (
      <div className="flex items-center justify-center h-full min-h-[500px]">
        <div className="text-center">
          <div className="text-red-500 text-lg mb-2">Erreur de chargement</div>
          <p className="text-sm text-gray-600">Impossible de charger Google Maps</p>
          <p className="text-xs text-gray-500 mt-1">{loadError.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-3 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-full min-h-[500px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-sm text-gray-600">Chargement de Google Maps...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "min-h-screen bg-gray-50 transition-all duration-500 ease-in-out",
      showAlertHeatmap && "bg-gradient-to-br from-gray-50 via-red-50/30 to-red-50/50"
    )}>
      {/* Header */}
      {/* Header removed: provided by TechnicianLayout */}

      <div className={cn(
        "flex flex-col lg:flex-row overflow-hidden",
        // Mobile: full height, Desktop: account for header height
        isMobile ? "h-screen mobile-full-height" : "h-[calc(100vh-73px)]"
      )}>

        {/* Left Control Panel - Hidden on mobile, visible on desktop */}
        <div className="hidden lg:block bg-white shadow-lg h-full overflow-hidden flex flex-col transition-all duration-300 relative" 
             style={{ width: `${leftPanelWidth}px`, minWidth: '320px', maxWidth: '600px' }}>
          
          {/* Resize Handle */}
          <div 
            className={cn(
              "absolute right-0 top-0 bottom-0 w-1 cursor-col-resize transition-all duration-200 z-10",
              isResizing 
                ? "bg-blue-500 w-2" 
                : "bg-gray-300 hover:bg-blue-400 hover:w-2"
            )}
            onMouseDown={handleMouseDown}
            onDoubleClick={() => {
              setLeftPanelWidth(384);
              localStorage.setItem('technicianMapPanelWidth', '384');
            }}
            title="Double-click to reset width"
          />
          {isResizing && (
            <div className="absolute right-0 top-0 bottom-0 w-1 bg-blue-500 opacity-50" />
          )}
          
          {/* Search Bar */}
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div className="relative">
              <input
                type="text"
                placeholder="Rechercher serres, guides, billons..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full px-3 py-2 pl-10 pr-20 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
              {/* Keyboard shortcut indicator */}
              <div className="absolute inset-y-0 right-0 pr-12 flex items-center">
                <kbd className="px-2 py-1 text-xs font-semibold text-gray-500 bg-gray-100 border border-gray-300 rounded">
                  ⌘K
                </kbd>
              </div>
            </div>
          </div>

          {/* Search Results */}
          {searchQuery && (
            <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-blue-900">
                    Résultats de recherche pour "{searchQuery}"
                  </h3>
                  <Badge variant="secondary" className="text-xs">
                    {searchResults.serres.length + searchResults.guides.length + searchResults.bilans.length} résultats
                  </Badge>
                </div>
                
                {/* Serres Results */}
                {searchResults.serres.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-medium text-blue-800">Serres ({searchResults.serres.length})</h4>
                    {searchResults.serres.map(serre => (
                      <div 
                        key={serre.id}
                        className="p-2 bg-white rounded border border-blue-200 cursor-pointer hover:bg-blue-50 transition-colors"
                        onClick={() => {
                          handleSelectSerre(serre);
                          setSearchQuery('');
                        }}
                      >
                        <div className="text-sm font-medium text-blue-900">{serre.nom}</div>
                        <div className="text-xs text-blue-600">{serre.cultureGuide?.variete || serre.variety || 'Non spécifiée'}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Guides Results */}
                {searchResults.guides.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-medium text-blue-800">Guides ({searchResults.guides.length})</h4>
                    {searchResults.guides.map(guide => (
                      <div 
                        key={guide.id}
                        className="p-2 bg-white rounded border border-blue-200 cursor-pointer hover:bg-blue-50 transition-colors"
                        onClick={() => {
                          setSearchQuery('');
                          // Find and select the serre for this guide
                          const guideSerre = serres.find(s => parseInt(s.id) === parseInt(guide.id_serre));
                          if (guideSerre) {
                            handleSelectSerre(guideSerre);
                          }
                        }}
                      >
                        <div className="text-sm font-medium text-blue-900">{guide.nom}</div>
                        <div className="text-xs text-blue-600">{guide.variete}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Bilans Results */}
                {searchResults.bilans.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-medium text-blue-800">Billons ({searchResults.bilans.length})</h4>
                    {searchResults.bilans.map(bilan => (
                      <div 
                        key={bilan.id}
                        className="p-2 bg-white rounded border border-blue-200 cursor-pointer hover:bg-blue-50 transition-colors"
                        onClick={() => {
                          setSearchQuery('');
                          handleBilanSelect(bilan);
                        }}
                      >
                        <div className="text-sm font-medium text-blue-900">{bilan.nom}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* No Results */}
                {searchResults.serres.length === 0 && 
                 searchResults.guides.length === 0 && 
                 searchResults.bilans.length === 0 && (
                  <div className="text-center py-2 text-blue-600">
                    <p className="text-sm">Aucun résultat trouvé</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <ScrollArea className="flex-1 h-full w-full" style={{ height: '100%', maxHeight: '100%' }}>
            <div className="p-6 space-y-6 min-h-full pb-8">
              {/* Create New Bilan Section - Always Visible */}
              <Card className="border-dashed border-2 border-gray-200 hover:border-greener-600 transition-colors">
                  <CardContent className="p-4">
                  {!isCreatingBilan ? (
                      <Button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsCreatingBilan(true);
                      }}
                        variant="ghost"
                      className="w-full h-16 border-0 text-gray-600 hover:text-greener-700 hover:bg-greener-100"
                      >
                        <div className="flex flex-col items-center space-y-2">
                          <Sprout className="h-6 w-6" />
                          <span className="text-sm font-medium">
                          Créer un nouveau billon
                          </span>
                          <span className="text-xs text-gray-500">
                          {selectedSerre ? `pour ${selectedSerre.nom}` : "Sélectionnez une serre d'abord"}
                          </span>
                        </div>
                      </Button>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <Sprout className="h-5 w-5 text-greener-700" />
                          <h4 className="font-medium text-greener-700">
                            Nouveau bilan - {selectedSerre?.nom || 'Sélectionnez une serre'}
                          </h4>
                        </div>
                        <p className="text-sm text-gray-600">
                          Utilisez le formulaire de création de billon qui s'affiche à droite.
                        </p>
                        <Button
                          onClick={() => setIsCreatingBilan(false)}
                          variant="outline"
                          size="sm"
                          className="w-full"
                        >
                          Annuler
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

              {/* Bilan Creation Form */}
              {selectedSerre && isCreatingBilan && (
                <Card className={cn(
                  "border-2 border-greener-600 bg-greener-100",
                  isMobile ? "h-full min-h-screen" : ""
                )}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg text-greener-700 flex items-center space-x-2">
                      <MapPin className="h-5 w-5" />
                      <span>Création de billon</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className={isMobile ? "p-0 h-full" : ""}>
                    <BilanCreation
                      serreId={parseInt(selectedSerre.id)}
                      serreName={selectedSerre.nom}
                      serreLocation={selectedSerre.location}
                      onBilanCreated={handleBilanCreated}
                      onCancel={() => setIsCreatingBilan(false)}
                      isMobile={isMobile}
                    />
                  </CardContent>
                </Card>
              )}

              {/* Serres List */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                  <MapPin className="h-5 w-5" />
                  <span>Mes Serres ({serres.length})</span>
                </h3>

                {isLoadingSerres ? (
                  <div className="text-center py-6 text-gray-500">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-greener-600 mx-auto mb-2"></div>
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
                          ? "ring-2 ring-[#B4CC5F] border-[#B4CC5F] shadow-md bg-[#B4CC5F]/5"
                          : "border-gray-200 hover:border-[#B4CC5F]/50",
                      )}
                      onClick={() => handleSelectSerre(serre)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">
                              {serre.nom}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {serre.cultureGuide?.variete || serre.variety || 'Non spécifiée'}
                            </p>
                            <div className="flex items-center space-x-2 mt-2">
                              <Badge variant="outline" className="text-xs">
                                {serre.surface} m²
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {serre.billonCount || 0} billon{serre.billonCount !== 1 ? 's' : ''}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex flex-col items-end space-y-2">
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
                            {selectedSerre?.id === serre.id && (
                              <div className="w-3 h-3 bg-[#B4CC5F] rounded-full"></div>
                            )}
                          </div>
                        </div>

                        {/* Quick Actions for Selected Serre */}
                        {selectedSerre?.id === serre.id && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <div className="flex space-x-2">
                              <Button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setIsCreatingBilan(true);
                                }}
                                size="sm"
                                className="flex-1 bg-[#B4CC5F] hover:bg-[#B4CC5F]/90 text-white"
                              >
                                <Sprout className="h-4 w-4 mr-2" />
                                Créer billon
                              </Button>
                              <Button
                                onClick={() => setIsInterventionFormOpen(true)}
                                size="sm"
                                variant="outline"
                                className="flex-1"
                              >
                                <AlertCircle className="h-4 w-4 mr-2" />
                                Intervention
                              </Button>
                            </div>
                            <div className="flex space-x-2 mt-2">
                              <Button
                                onClick={toggleAlertHeatmap}
                                size="sm"
                                className={cn(
                                  "flex-1 transition-all duration-300 ease-in-out relative overflow-hidden group",
                                  showAlertHeatmap
                                    ? "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg shadow-red-500/25 border-0"
                                    : "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg shadow-emerald-500/25 border-0"
                                )}
                              >
                                {/* Animated background effect */}
                                <div className={cn(
                                  "absolute inset-0 bg-gradient-to-r from-white/20 to-transparent transform transition-transform duration-500",
                                  showAlertHeatmap ? "translate-x-full" : "-translate-x-full"
                                )} />
                                
                                {/* Icon with animation */}
                                <div className={cn(
                                  "flex items-center justify-center transition-all duration-300",
                                  showAlertHeatmap ? "scale-110" : "scale-100"
                                )}>
                                  <Thermometer className={cn(
                                    "h-4 w-4 mr-2 transition-all duration-300",
                                    showAlertHeatmap ? "text-red-100" : "text-emerald-100"
                                  )} />
                                  <span className="font-medium">
                                    {showAlertHeatmap ? 'Masquer Alertes' : 'Voir Carte des Alertes'}
                                  </span>
                                </div>
                                
                                {/* Status indicator */}
                                <div className={cn(
                                  "absolute top-1 right-1 w-2 h-2 rounded-full transition-all duration-300",
                                  showAlertHeatmap 
                                    ? "bg-red-200 animate-pulse" 
                                    : "bg-emerald-200"
                                )} />
                              </Button>
                            </div>
                            
                            <div className="flex space-x-2 mt-2">
                              <Button
                                onClick={toggleBillons}
                                size="sm"
                                className={cn(
                                  "flex-1 transition-all duration-300 ease-in-out relative overflow-hidden group",
                                  showBillons
                                    ? "bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white shadow-lg shadow-yellow-500/25 border-0"
                                    : "bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white shadow-lg shadow-yellow-500/25 border-0"
                                )}
                              >
                                {/* Animated background effect */}
                                <div className={cn(
                                  "absolute inset-0 bg-gradient-to-r from-white/20 to-transparent transform transition-transform duration-500",
                                  showBillons ? "translate-x-full" : "-translate-x-full"
                                )} />
                                
                                {/* Icon with animation */}
                                <div className={cn(
                                  "flex items-center justify-center transition-all duration-300",
                                  showBillons ? "scale-110" : "scale-100"
                                )}>
                                  <BarChart3 className={cn(
                                    "h-4 w-4 mr-2 transition-all duration-300",
                                    showBillons ? "text-yellow-100" : "text-gray-100"
                                  )} />
                                  <span className="font-medium">
                                    {showBillons ? 'Masquer Billons' : 'Voir Billons'}
                                  </span>
                                </div>
                                
                                {/* Status indicator */}
                                <div className={cn(
                                  "absolute top-1 right-1 w-2 h-2 rounded-full transition-all duration-300",
                                  showBillons 
                                    ? "bg-yellow-200 animate-pulse" 
                                    : "bg-gray-200"
                                )} />
                              </Button>
                            </div>
                            
                            <div className="flex space-x-2 mt-2">
                              <Button
                                onClick={toggleSerreBoundaries}
                                size="sm"
                                className={cn(
                                  "flex-1 transition-all duration-300 ease-in-out relative overflow-hidden group",
                                  showSerreBoundaries
                                    ? "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg shadow-blue-500/25 border-0"
                                    : "bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white shadow-lg shadow-blue-500/25 border-0"
                                )}
                              >
                                {/* Animated background effect */}
                                <div className={cn(
                                  "absolute inset-0 bg-gradient-to-r from-white/20 to-transparent transform transition-transform duration-500",
                                  showSerreBoundaries ? "translate-x-full" : "-translate-x-full"
                                )} />
                                
                                {/* Icon with animation */}
                                <div className={cn(
                                  "flex items-center justify-center transition-all duration-300",
                                  showSerreBoundaries ? "scale-110" : "scale-100"
                                )}>
                                  <MapPin className={cn(
                                    "h-4 w-4 mr-2 transition-all duration-300",
                                    showSerreBoundaries ? "text-blue-100" : "text-gray-100"
                                  )} />
                                  <span className="font-medium">
                                    {showSerreBoundaries ? 'Masquer Limites' : 'Voir Limites'}
                                  </span>
                                </div>
                                
                                {/* Status indicator */}
                                <div className={cn(
                                  "absolute top-1 right-1 w-2 h-2 rounded-full transition-all duration-300",
                                  showSerreBoundaries 
                                    ? "bg-blue-200 animate-pulse" 
                                    : "bg-gray-200"
                                )} />
                              </Button>
                            </div>
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
                    {selectedSerre.surface} m² • Billons: {selectedSerre.billonCount || 0}
                  </div>
                  
                  {/* Main Alert Heatmap Toggle */}
                  <div className="mt-4 space-y-3">
                    <Button
                      onClick={toggleAlertHeatmap}
                      className={cn(
                        "w-full transition-all duration-300 ease-in-out relative overflow-hidden group shadow-lg py-3",
                        showAlertHeatmap
                          ? "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-red-500/25 border-0"
                          : "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-emerald-500/25 border-0"
                      )}
                    >
                      {/* Animated background effect */}
                      <div className={cn(
                        "absolute inset-0 bg-gradient-to-r from-white/20 to-transparent transform transition-transform duration-500",
                        showAlertHeatmap ? "translate-x-full" : "-translate-x-full"
                      )} />
                      
                      {/* Icon with animation */}
                      <div className={cn(
                        "flex items-center justify-center transition-all duration-300",
                        showAlertHeatmap ? "scale-110" : "scale-100"
                      )}>
                        <Thermometer className={cn(
                          "h-5 w-5 mr-3 transition-all duration-300",
                          showAlertHeatmap ? "text-red-100" : "text-emerald-100"
                        )} />
                        <span className="font-semibold text-base">
                          {showAlertHeatmap ? ' Alertes Actives - Cliquer pour Masquer' : 'Activer la Carte des Alertes'}
                        </span>
                      </div>
                      
                      {/* Status indicator */}
                      <div className={cn(
                        "absolute top-2 right-2 w-3 h-3 rounded-full transition-all duration-300",
                        showAlertHeatmap 
                          ? "bg-red-200 animate-pulse" 
                          : "bg-emerald-200"
                      )} />
                    </Button>

                    {/* Billon Toggle Button */}
                    <Button
                      onClick={toggleBillons}
                      className={cn(
                        "w-full transition-all duration-300 ease-in-out relative overflow-hidden group shadow-lg py-3",
                        showBillons
                          ? "bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white shadow-yellow-500/25 border-0"
                          : "bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white shadow-gray-500/25 border-0"
                      )}
                    >
                      {/* Animated background effect */}
                      <div className={cn(
                        "absolute inset-0 bg-gradient-to-r from-white/20 to-transparent transform transition-transform duration-500",
                        showBillons ? "translate-x-full" : "-translate-x-full"
                      )} />
                      
                      {/* Icon with animation */}
                      <div className={cn(
                        "flex items-center justify-center transition-all duration-300",
                        showBillons ? "scale-110" : "scale-100"
                      )}>
                        <BarChart3 className={cn(
                          "h-5 w-5 mr-3 transition-all duration-300",
                          showBillons ? "text-yellow-100" : "text-gray-100"
                        )} />
                        <span className="font-semibold text-base">
                          {showBillons ? ' Billons Visibles - Cliquer pour Masquer' : 'Afficher les Billons'}
                        </span>
                      </div>
                      
                      {/* Status indicator */}
                      <div className={cn(
                        "absolute top-2 right-2 w-3 h-3 rounded-full transition-all duration-300",
                        showBillons 
                          ? "bg-yellow-200 animate-pulse" 
                          : "bg-gray-200"
                      )} />
                    </Button>

                    {/* Serre Boundary Toggle Button */}
                    <Button
                      onClick={toggleSerreBoundaries}
                      className={cn(
                        "w-full transition-all duration-300 ease-in-out relative overflow-hidden group shadow-lg py-3",
                        showSerreBoundaries
                          ? "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-blue-500/25 border-0"
                          : "bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white shadow-gray-500/25 border-0"
                      )}
                    >
                      {/* Animated background effect */}
                      <div className={cn(
                        "absolute inset-0 bg-gradient-to-r from-white/20 to-transparent transform transition-transform duration-500",
                        showSerreBoundaries ? "translate-x-full" : "-translate-x-full"
                      )} />
                      
                      {/* Icon with animation */}
                      <div className={cn(
                        "flex items-center justify-center transition-all duration-300",
                        showSerreBoundaries ? "scale-110" : "scale-100"
                      )}>
                        <MapPin className={cn(
                          "h-5 w-5 mr-3 transition-all duration-300",
                          showSerreBoundaries ? "text-blue-100" : "text-gray-100"
                        )} />
                        <span className="font-semibold text-base">
                          {showSerreBoundaries ? ' Serre Visible - Cliquer pour Masquer' : 'Afficher les Limites'}
                        </span>
                      </div>
                      
                      {/* Status indicator */}
                      <div className={cn(
                        "absolute top-2 right-2 w-3 h-3 rounded-full transition-all duration-300",
                        showSerreBoundaries 
                          ? "bg-blue-200 animate-pulse" 
                          : "bg-gray-200"
                      )} />
                    </Button>
                  </div>

                  {/* Billons List */}
                  {selectedSerre.billonCount && selectedSerre.billonCount > 0 && (
                    <div className="space-y-2">
                      <h5 className="font-medium text-gray-900">
                        Billons ({selectedSerre.billonCount})
                      </h5>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <BarChart3 className="h-5 w-5 text-purple-600" />
                          <div>
                            <h6 className="font-medium text-gray-900">
                              Billons de culture
                            </h6>
                            <p className="text-sm text-gray-600">
                              {selectedSerre.billonCount} billon{selectedSerre.billonCount !== 1 ? 's' : ''} actif{selectedSerre.billonCount !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                      </div>
              )}

              {/* Culture Guides Section */}
              {selectedSerre && (
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between">
                  <h4 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                    <BookOpen className="h-5 w-5" />
                    <span>Guide de Culture</span>
                      {guides.length > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {guides.length}
                        </Badge>
                      )}
                  </h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={refreshGuides}
                      disabled={isLoadingGuides}
                      className="p-2 h-8 w-8"
                    >
                      <div className={cn(
                        "h-4 w-4",
                        isLoadingGuides ? "animate-spin" : ""
                      )}>
                        {isLoadingGuides ? (
                          <div className="rounded-full border-2 border-gray-300 border-t-blue-500 h-4 w-4" />
                        ) : (
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        )}
                      </div>
                    </Button>
                  </div>
                  
                  {isLoadingGuides ? (
                    <div className="text-center py-4 text-gray-500">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-2"></div>
                      <p className="text-sm">Chargement des guides...</p>
                    </div>
                  ) : guides.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">
                      <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Aucun guide de culture disponible pour cette serre</p>
                      <p className="text-xs text-gray-400 mt-1">Les guides apparaîtront ici une fois créés</p>
                      <div className="mt-3 space-y-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={refreshGuides}
                          className="text-xs"
                        >
                          Actualiser
                        </Button>
                        <div className="text-xs text-gray-400">
                          Serre ID: {selectedSerre.id}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {guides.map((guide) => (
                        <Card key={guide.id} className="border-gray-200 hover:border-blue-300 transition-colors">
                          <CardContent className="p-4">
                            <div className="space-y-3">
                              <div className="flex items-start justify-between">
                              <h5 className="font-medium text-gray-900">{guide.nom}</h5>
                                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                  Guide
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600">Variété: <span className="font-medium">{guide.variete}</span></p>
                              
                              <div className="grid grid-cols-2 gap-3 text-xs">
                                <div className="space-y-1">
                                  <p className="text-gray-500">Rendement estimé:</p>
                                  <p className="font-medium text-greener-600">{guide.rendement} kg</p>
                                </div>
                                <div className="space-y-1">
                                  <p className="text-gray-500">Nombre de plants:</p>
                                  <p className="font-medium text-blue-600">{guide.nombre_de_plants}</p>
                                </div>
                              </div>
                              
                              <div className="pt-2 border-t border-gray-100">
                              <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                                  <div>
                                    <p className="text-gray-400">Début saison:</p>
                                    <p className="font-medium">{new Date(guide.date_debut_saison).toLocaleDateString()}</p>
                                  </div>
                                  <div>
                                    <p className="text-gray-400">Fin saison:</p>
                                    <p className="font-medium">{new Date(guide.date_fin_saison).toLocaleDateString()}</p>
                                  </div>
                                </div>
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
                <div className="space-y-4 pt-2">
                  <h4 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                    <FileText className="h-5 w-5" />
                    <span>Billons ({bilans.length})</span>
                  </h4>
                  
               
                  {isLoadingBilans ? (
                    <div className="text-center py-4 text-gray-500">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-2"></div>
                      <p className="text-sm">Chargement des billons...</p>
                    </div>
                  ) : bilans.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">
                      <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Aucun billon disponible pour cette serre</p>
                      <p className="text-xs text-gray-400 mt-1">Créez un nouveau billon pour commencer</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {bilans.map((bilan) => (
                        <Card 
                          key={bilan.id} 
                          className={cn(
                            "transition-all duration-200 hover:shadow-md border",
                            selectedBilan?.id === bilan.id
                              ? "ring-2 ring-[#B4CC5F] border-[#B4CC5F] shadow-md"
                              : "border-gray-200 hover:border-[#B4CC5F]/50",
                          )}
                        >
                          <CardContent className="p-4">
                            <div className="space-y-3">
                              {/* Bilan Header - Clickable */}
                              <div 
                                className="cursor-pointer"
                                onClick={() => handleBilanSelect(bilan)}
                              >
                                <h5 className="font-medium text-gray-900">{bilan.nom}</h5>
                                <p className="text-sm text-gray-600">Surface: {bilan.surface || 'Non calculée'} m²</p>
                                <p className="text-xs text-gray-500">
                                  Points GPS: {bilan.position?.length || 0}
                                </p>
                              </div>
                              
                              {/* Action Buttons */}
                              <div className="flex space-x-2 pt-2 border-t border-gray-100">
                                {!bilanQRCodes[bilan.id] ? (
                                  <Button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleGenerateQRCodeForBilan(bilan);
                                    }}
                                    size="sm"
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs transition-all duration-300 ease-in-out hover:scale-105"
                                  >
                                    <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V6a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1zm12 0h2a1 1 0 001-1V6a1 1 0 00-1-1h-2a1 1 0 00-1 1v1a1 1 0 001 1zM5 20h2a1 1 0 001-1v-1a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1z" />
                                    </svg>
                                    Générer QR
                                  </Button>
                                ) : (
                                  <div className="flex gap-1 flex-1 animate-in slide-in-from-bottom-2 duration-300">
                                    <Button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleViewQRCodeForBilan(bilan);
                                      }}
                                      size="sm"
                                      variant="outline"
                                      className="flex-1 border-greener-600 text-greener-600 hover:bg-greener-50 hover:border-greener-700 text-xs transition-all duration-200 hover:scale-105 hover:shadow-md"
                                    >
                                      <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                      </svg>
                                      Voir
                                    </Button>
                                    <Button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDownloadQRCodeForBilan(bilan);
                                      }}
                                      size="sm"
                                      variant="outline"
                                      className="flex-1 border-greener-600 text-greener-600 hover:bg-greener-50 hover:border-greener-700 text-xs transition-all duration-200 hover:scale-105 hover:shadow-md"
                                    >
                                      <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                      </svg>
                                      Télécharger
                                    </Button>
                                  </div>
                                )}
                                <Button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCheckEtatBilanForBilan(bilan);
                                  }}
                                  size="sm"
                                  variant="outline"
                                  className="flex-1 border-green-600 text-green-600 hover:bg-green-50 hover:border-green-700 text-xs transition-all duration-200 hover:scale-105 hover:shadow-md"
                                >
                                  <BarChart3 className="h-3 w-3 mr-1" />
                                  État
                                </Button>
                              </div>

                              {/* Enhanced QR Code Display for Desktop */}
                              {bilanQRCodes[bilan.id] && (
                                <div className="pt-3 border-t border-gray-100">
                                  <div className="text-center space-y-3">
                                    <div className="flex items-center justify-center space-x-2">
                                      <svg className="h-4 w-4 text-greener-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                      <p className="text-sm font-medium text-greener-700">QR Code généré avec succès</p>
                                    </div>
                                    <div className="flex justify-center">
                                      <div className="relative">
                                        <img
                                          src={bilanQRCodes[bilan.id] instanceof Blob ? URL.createObjectURL(bilanQRCodes[bilan.id] as Blob) : ''}
                                          alt={`QR Code pour ${bilan.nom}`}
                                          className="w-32 h-32 border-2 border-greener-200 rounded-lg shadow-md"
                                        />
                                        {/* Success indicator overlay */}
                                        <div className="absolute -top-1 -right-1 w-7 h-7 bg-greener-500 rounded-full flex items-center justify-center">
                                          <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                          </svg>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="space-y-1">
                                      <p className="text-sm text-gray-600">
                                        Scannez ce QR code pour accéder aux informations du bilan
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        Bilan: {bilan.nom} • {bilan.surface || 'Surface non calculée'} m²
                                      </p>
                                    </div>
                                  </div>
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

              {/* Etat de Bilan Section */}
              {selectedBilan && (
                <div 
                  className="space-y-4 pt-2 transition-all duration-500 ease-in-out transform animate-in slide-in-from-bottom-2" 
                  data-section="etat-bilan"
                  style={{
                    animation: 'slideInFromBottom 0.5s ease-out forwards'
                  }}
                >
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
                      <p className="text-xs text-gray-400 mt-1">Les états apparaîtront ici une fois créés</p>
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
        <div className={cn(
          "flex-1 relative overflow-hidden",
          // Mobile: full height, Desktop: full height
          isMobile ? "h-screen w-full mobile-full-height mobile-map-container" : "h-full"
        )} data-testid="map-section">

          {/* Mobile Map Instructions - Only show when no serre is selected */}
          {isMobile && !selectedSerre && (
            <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-10">
              <div className="text-center text-gray-500 p-6">
                <MapPin className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">Sélectionnez une serre</p>
                <p className="text-sm mb-6">Choisissez une serre dans la liste pour voir sa localisation</p>
                
                <Button
                  onClick={() => setIsMobilePanelOpen(true)}
                  className="bg-[#B4CC5F] hover:bg-[#B4CC5F]/90 text-white px-6 py-3 rounded-lg w-full"
                >
                  <MapPin className="h-5 w-5 mr-2" />
                  Voir mes serres
                </Button>
                
                <p className="text-xs text-gray-400 mt-3">
                  Utilisez le bouton flottant en bas à droite pour accéder à vos serres
                </p>
              </div>
            </div>
          )}
          
          {isCreatingBilan && selectedSerre ? (
            <BilanMapComponent
              serreLocation={selectedSerre.location}
              selectedPoints={[]}
              currentLocation={null}
              isTracking={false}
              className="h-full"
            />
          ) : selectedSerre ? (
          <div className={cn(
            "relative h-full transition-all duration-500 ease-in-out",
            showAlertHeatmap && "ring-4 ring-red-500/20 ring-opacity-50"
          )}>
            {/* Alert Heatmap Active Indicator - Only show when showAlertHeatmap is true */}
            {showAlertHeatmap && (
              <>
                <div className="absolute top-4 right-4 z-20 bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg shadow-red-500/25 border-2 border-red-300 animate-pulse">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-red-200 rounded-full animate-ping" />
                    <span> Alertes Actives</span>
                  </div>
                </div>

              </>
            )}
            
                        {/* Map Legend - Collapsible and Responsive for mobile */}
            <div className={cn(
              "absolute z-10 bg-white/90 backdrop-blur-sm rounded-md shadow-md border border-gray-200 transition-all duration-300",
              // Mobile: positioned to avoid zoom controls and map elements
              isMobile ? "top-16 left-2" : "top-2 left-2"
            )}>
              {/* Legend Content */}
              <div className={cn(
                "transition-all duration-300 overflow-hidden",
                isMobile && !isLegendExpanded ? "max-h-0 opacity-0" : "max-h-32 opacity-100"
              )}>
                <div className={cn(
                  "text-xs",
                  isMobile ? "p-1.5 space-y-0.5" : "p-2 space-y-1"
                )}>
                  <div className="flex items-center space-x-1">
                  <button
                    onClick={toggleSerreBoundaries}
                      className={`flex items-center space-x-1 transition-colors ${
                      showSerreBoundaries ? 'opacity-100' : 'opacity-50'
                    }`}
                  >
                      <div className={cn(
                        "rounded-full",
                        isMobile ? "w-2.5 h-2.5" : "w-3 h-3",
                      showSerreBoundaries ? 'bg-blue-500' : 'bg-gray-400'
                      )}></div>
                      <span className={cn(
                        isMobile ? "text-[10px]" : "text-xs",
                      showSerreBoundaries ? 'text-gray-700' : 'text-gray-500'
                      )}>Serre</span>
                  </button>
                </div>
                  <div className="flex items-center space-x-1">
                  <button
                    onClick={toggleBillons}
                      className={`flex items-center space-x-1 transition-colors ${
                      showBillons ? 'opacity-100' : 'opacity-50'
                    }`}
                  >
                      <div className={cn(
                        "rounded-full",
                        isMobile ? "w-2.5 h-2.5" : "w-3 h-3",
                      showBillons ? 'bg-yellow-500' : 'bg-gray-400'
                      )}></div>
                      <span className={cn(
                        isMobile ? "text-[10px]" : "text-xs",
                      showBillons ? 'text-gray-700' : 'text-gray-500'
                      )}>Billons</span>
                  </button>
                </div>
                  <div className="flex items-center space-x-1">
                  <button
                    onClick={toggleAlertHeatmap}
                      className={`flex items-center space-x-1 transition-colors ${
                      showAlertHeatmap ? 'opacity-100' : 'opacity-50'
                    }`}
                  >
                      <div className={cn(
                        "rounded-full",
                        isMobile ? "w-2.5 h-2.5" : "w-3 h-3",
                      showAlertHeatmap ? 'bg-red-500' : 'bg-gray-400'
                      )}></div>
                      <span className={cn(
                        isMobile ? "text-[10px]" : "text-xs",
                      showAlertHeatmap ? 'text-gray-700' : 'text-gray-500'
                      )}>Alertes</span>
                  </button>
                </div>
              </div>
            </div>
              
              {/* Collapsed Legend Indicator - Mobile Only */}
              {isMobile && !isLegendExpanded && (
                <div className="p-2 bg-white/80 backdrop-blur-sm rounded border border-gray-200">
                  <div className="flex items-center space-x-1.5">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-[10px] text-gray-600 ml-1">Légende</span>
                  </div>
                </div>
              )}
            </div>
            
            {/* Legend Toggle Button - Mobile Only - Positioned at top-left corner of map */}
            {isMobile && (
              <button
                onClick={() => setIsLegendExpanded(!isLegendExpanded)}
                className="absolute top-2 left-2 z-20 w-8 h-8 bg-white/95 backdrop-blur-sm rounded-full border-2 border-gray-300 shadow-lg flex items-center justify-center text-gray-700 hover:text-gray-900 hover:bg-white transition-all duration-200 hover:scale-110"
                title={isLegendExpanded ? "Réduire la légende" : "Développer la légende"}
              >
                <svg 
                  className={cn(
                    "w-4 h-4 transition-transform duration-200",
                    isLegendExpanded ? "rotate-180" : "rotate-0"
                  )} 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            )}

            <GoogleMapsWrapper>
              <GoogleMap
                mapContainerStyle={{
                  width: "100%",
                  height: "100%",
                  // Ensure mobile responsiveness
                  ...(isMobile && {
                    width: "100vw",
                    height: "100dvh"
                  })
                }}
                center={selectedSerre.location}
                zoom={15}
                onLoad={(map) => {
                  if (map) {
                    setMap(map);
                    smoothZoomToLocation(map, selectedSerre.location, 16);
                  }
                }}
                options={{
                  mapTypeId: "satellite", // Keep satellite view for heatmap
                  tilt: 0,
                  streetViewControl: false,
                  fullscreenControl: false,
                  mapTypeControl: false,
                  zoomControl: false,
                  scaleControl: false,
                  rotateControl: false,
                  clickableIcons: false,
                  gestureHandling: "cooperative",
                  disableDefaultUI: true,
                  // Mobile-specific options - only zoom control
                  ...(isMobile && {
                    gestureHandling: "greedy", // Better mobile gesture handling
                    zoomControl: true, // Show only zoom controls on mobile
                    zoomControlOptions: {
                      position: window.google?.maps?.ControlPosition?.RIGHT_BOTTOM || 6
                    }
                  })
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
                  <div className="p-2 bg-white rounded-lg shadow-lg border border-gray-200 min-w-[180px] max-w-[200px]">
                    {/* Header */}
                    <div className="flex items-center space-x-2 mb-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <h3 className="font-bold text-gray-900 text-sm">
                        {selectedSerre.nom}
                      </h3>
                    </div>
                    
                    {/* Main content - more compact */}
                    <div className="space-y-1">
                      {/* Variete from culture guide */}
                      <div className="flex items-center space-x-2">
                        <Sprout className="h-3 w-3 text-green-600" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-500">Variété</p>
                          <p className="text-xs text-gray-700 font-medium truncate">
                            {selectedSerre.cultureGuide?.variete || 'Non spécifiée'}
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
                            {selectedSerre.billonCount || 0}
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

                {/* Alert Heatmap Overlay - Only show when showAlertHeatmap is true */}
                {showAlertHeatmap && (
                  <AlertHeatmapOverlay
                    serreId={parseInt(selectedSerre.id)}
                    serreName={selectedSerre.nom}
                    serreLocation={selectedSerre.location}
                    map={map}
                    onAlertClick={handleAlertClick}
                    onInterventionClick={(alert) => {
                      setIsInterventionFormOpen(true);
                      // You can pass the alert data to the intervention form if needed
                    }}
                  />
                )}

                {/* Serre Boundary Polygons */}
                {showSerreBoundaries && selectedSerre && selectedSerre.position && Array.isArray(selectedSerre.position) && selectedSerre.position.length >= 3 && (
                  <Polygon
                    key={`serre-${selectedSerre.id}`}
                    path={selectedSerre.position.map((p: any) => ({
                      lat: p.point_x || p.lat || p.latitude,
                      lng: p.point_y || p.lng || p.longitude
                    })) as google.maps.LatLngLiteral[]}
                    options={{
                      strokeColor: '#3B82F6',
                      strokeOpacity: 1,
                      strokeWeight: 3,
                      fillColor: '#3B82F6',
                      fillOpacity: 0.1,
                      clickable: true,
                    }}
                    onClick={() => {
                      // Show serre info when clicking on boundary
                      if (map) {
                        map.panTo(selectedSerre.location);
                        map.setZoom(16);
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
                )}

                {/* Billon Polygons */}
                {showBillons && bilans.map((bilan) => {
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
                        setSelectedBilanDetails({ 
                          bilan, 
                          etat: etatBilans.find(etat => etat.id_bilan === bilan.id) 
                        });
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

              </GoogleMap>
            </GoogleMapsWrapper>
          </div>
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
        {/* Mobile Bilan Creation - Fullscreen when creating bilan */}
        {isCreatingBilan && selectedSerre ? (
          <div className="fixed inset-0 z-50 bg-white">
            <BilanCreation
              serreId={parseInt(selectedSerre.id)}
              serreName={selectedSerre.nom}
              serreLocation={selectedSerre.location}
              onBilanCreated={handleBilanCreated}
              onCancel={() => setIsCreatingBilan(false)}
              isMobile={true}
            />
          </div>
        ) : (
          /* Mobile Bottom Panel - Only show when not creating bilan */
          <div
            className={cn(
              "fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 transition-transform duration-300 ease-in-out z-30 shadow-2xl mobile-safe-area mobile-panel-overlay",
              isMobilePanelOpen ? "translate-y-0" : "translate-y-full",
              isMobilePanelResizing && "transition-none" // Disable transition during resize for smooth dragging
            )}
            style={{ 
              height: `${mobilePanelHeight}vh`,
              maxHeight: "95vh",
              minHeight: "25vh" // Increased minimum height for better usability
            }}
          >
            {/* Simple Resizable Panel Handle */}
            <div 
              className={cn(
                "flex justify-center mb-3 cursor-ns-resize touch-none transition-all duration-200",
                isMobilePanelResizing && "scale-110"
              )}
              onTouchStart={handleMobilePanelMouseDown}
              onMouseDown={handleMobilePanelMouseDown}
            >
              <div className={cn(
                "w-16 h-1.5 rounded-full shadow-sm transition-all duration-200",
                isMobilePanelResizing 
                  ? "bg-blue-500 shadow-lg shadow-blue-500/50" 
                  : "bg-gray-400 hover:bg-gray-500"
              )}></div>
            </div>

            {/* Simple Panel Height Indicator */}
            <div className="text-center mb-4">
              <div className={cn(
                "inline-flex items-center space-x-2 px-3 py-1.5 rounded-full transition-all duration-200",
                isMobilePanelResizing
                  ? "bg-blue-100 text-blue-700 border border-blue-200"
                  : "bg-gray-100 text-gray-600"
              )}>
                <span className="text-xs font-medium">
                  Glissez pour redimensionner
                </span>
                <div className={cn(
                  "w-2 h-2 rounded-full transition-colors",
                  isMobilePanelResizing ? "bg-blue-400" : "bg-gray-400"
                )}></div>
              </div>

            </div>

            {/* Mobile Tabs */}
            <div className="flex space-x-2 mb-6 bg-gray-100 rounded-xl p-2">
              {[
                { key: 'serres', label: 'Serres', icon: MapPin },
                { key: 'bilan', label: 'Billons', icon: FileText },
                { key: 'guides', label: 'Guides', icon: BookOpen },
                { key: 'etat', label: 'État', icon: BarChart3 },
                { key: 'alerts', label: 'Alertes', icon: Thermometer },
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
            <div className="space-y-4 overflow-y-auto pb-4 px-4 mobile-compact scrollbar-mobile mobile-panel-content">
              {activeMobileTab === 'serres' && (
                <div className="space-y-3">
                  {/* Quick Bilan Creation for Selected Serre */}
                  {selectedSerre && (
                    <Card className="border-2 border-dashed border-[#B4CC5F] bg-[#B4CC5F]/5">
                      <CardContent className="p-4">
                        <div className="text-center space-y-3">
                          <div className="flex items-center justify-center space-x-2">
                            <Sprout className="h-5 w-5 text-[#B4CC5F]" />
                            <h4 className="font-semibold text-[#B4CC5F]">
                              Créer un billon pour {selectedSerre.nom}
                            </h4>
                          </div>
                          <p className="text-xs text-gray-600">
                            Commencez le suivi GPS et collectez les points du billon
                          </p>
                          <Button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setIsCreatingBilan(true);
                              setIsMobilePanelOpen(false);
                            }}
                            className="w-full bg-[#B4CC5F] hover:bg-[#B4CC5F]/90 text-white"
                            size="sm"
                          >
                            <MapPin className="h-4 w-4 mr-2" />
                            Commencer le bilan
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  
                  {/* Quick Map Controls for Mobile */}
                  {selectedSerre && (
                    <Card className="border border-gray-200 bg-gray-50">
                      <CardContent className="p-3">
                        <div className="space-y-2">
                          <h5 className="text-sm font-medium text-gray-700 text-center">
                            Contrôles rapides de la carte
                          </h5>
                          
                          <div className="grid grid-cols-3 gap-2">
                            {/* Alertes Toggle */}
                            <Button
                              onClick={() => {
                                toggleAlertHeatmap();
                                setIsMobilePanelOpen(false);
                              }}
                              className={cn(
                                "text-xs py-2 transition-all duration-200",
                                showAlertHeatmap
                                  ? "bg-red-500 hover:bg-red-600 text-white"
                                  : "bg-gray-500 hover:bg-gray-600 text-white"
                              )}
                              size="sm"
                            >
                              <Thermometer className="h-3 w-3 mx-auto mb-1" />
                              <span className="block text-[10px]">
                                {showAlertHeatmap ? 'Masquer' : 'Voir'} Alertes
                              </span>
                            </Button>
                            
                            {/* Serre Boundaries Toggle */}
                            <Button
                              onClick={() => {
                                toggleSerreBoundaries();
                                setIsMobilePanelOpen(false);
                              }}
                              className={cn(
                                "text-xs py-2 transition-all duration-200",
                                showSerreBoundaries
                                  ? "bg-blue-500 hover:bg-blue-600 text-white"
                                  : "bg-gray-500 hover:bg-gray-600 text-white"
                              )}
                              size="sm"
                            >
                              <MapPin className="h-3 w-3 mx-auto mb-1" />
                              <span className="block text-[10px]">
                                {showSerreBoundaries ? 'Masquer' : 'Voir'} Limites
                              </span>
                            </Button>
                            
                            {/* Billons Toggle */}
                            <Button
                              onClick={() => {
                                toggleBillons();
                                setIsMobilePanelOpen(false);
                              }}
                              className={cn(
                                "text-xs py-2 transition-all duration-200",
                                showBillons
                                  ? "bg-yellow-500 hover:bg-yellow-600 text-white"
                                  : "bg-gray-500 hover:bg-gray-600 text-white"
                              )}
                              size="sm"
                            >
                              <BarChart3 className="h-3 w-3 mx-auto mb-1" />
                              <span className="block text-[10px]">
                                {showBillons ? 'Masquer' : 'Voir'} Billons
                              </span>
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Serres List */}
                  {serres.map((serre) => (
                    <Card
                      key={serre.id}
                      className={cn(
                        "cursor-pointer transition-all duration-200",
                        selectedSerre?.id === serre.id
                          ? "ring-2 ring-[#B4CC5F] border-[#B4CC5F] bg-[#B4CC5F]/5"
                          : "border-gray-200 hover:border-[#B4CC5F]/50"
                      )}
                      onClick={() => {
                        handleSelectSerre(serre);
                        // Don't close panel on mobile, let user see the quick bilan creation
                      }}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-sm text-gray-900">{serre.nom}</h4>
                            <p className="text-xs text-gray-600">{serre.cultureGuide?.variete || serre.variety || 'Non spécifiée'}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {serre.surface} m²
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {serre.billonCount || 0} billon{serre.billonCount !== 1 ? 's' : ''}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex flex-col items-end space-y-1">
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-xs",
                                getStatusColor(serre.status)
                              )}
                            >
                              {serre.status === "active"
                                ? "Actif"
                                : serre.status === "maintenance"
                                  ? "Maintenance"
                                  : "Inactif"}
                            </Badge>
                            {selectedSerre?.id === serre.id && (
                              <div className="w-2 h-2 bg-[#B4CC5F] rounded-full"></div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {activeMobileTab === 'bilan' && (
                <div className="space-y-3">
                  {!selectedSerre ? (
                    <Card className="border-dashed border-2 border-gray-300 bg-gray-50">
                      <CardContent className="p-4 text-center">
                        <MapPin className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm text-gray-600 mb-3">
                          Sélectionnez d'abord une serre pour voir ses bilans
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
                  ) : bilans.length === 0 ? (
                    <Card className="border-dashed border-2 border-[#B4CC5F] bg-[#B4CC5F]/5">
                      <CardContent className="p-4 text-center">
                        <FileText className="h-8 w-8 mx-auto mb-2 text-[#B4CC5F]" />
                        <h4 className="font-medium text-[#B4CC5F] mb-2">
                          Aucun bilan pour {selectedSerre.nom}
                        </h4>
                        <p className="text-xs text-gray-600 mb-3">
                          Créez votre premier bilan en utilisant le GPS
                        </p>
                        <Button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsCreatingBilan(true);
                            setIsMobilePanelOpen(false);
                          }}
                          className="bg-[#B4CC5F] hover:bg-[#B4CC5F]/90 text-white"
                          size="sm"
                        >
                          <Sprout className="h-4 w-4 mr-2" />
                          Créer un billon
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    <>
                      {/* Bilan Creation Quick Access */}
                      <Card className="border-2 border-dashed border-[#B4CC5F] bg-[#B4CC5F]/5">
                        <CardContent className="p-3">
                          <Button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setIsCreatingBilan(true);
                              setIsMobilePanelOpen(false);
                            }}
                            className="w-full bg-[#B4CC5F] hover:bg-[#B4CC5F]/90 text-white"
                            size="sm"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Nouveau bilan pour {selectedSerre.nom}
                          </Button>
                        </CardContent>
                      </Card>

                      {/* Existing Bilans */}
                      <div className="space-y-2">
                        <h5 className="text-sm font-medium text-gray-700 px-1">
                          Bilans existants ({bilans.length})
                        </h5>
                        {bilans.map((bilan) => (
                          <Card
                            key={bilan.id}
                            className={cn(
                              "transition-all duration-200",
                              selectedBilan?.id === bilan.id
                                ? "ring-2 ring-[#B4CC5F] border-[#B4CC5F]"
                                : "border-gray-200"
                            )}
                          >
                            <CardContent className="p-3">
                              <div className="space-y-3">
                                {/* Bilan Header - Clickable */}
                                <div 
                                  className="cursor-pointer"
                                  onClick={() => handleBilanSelect(bilan)}
                                >
                                  <h4 className="font-medium text-sm">{bilan.nom}</h4>
                                  <p className="text-xs text-gray-600">
                                    Surface: {bilan.surface || 'Non calculée'} m²
                                  </p>
                                  <div className="flex items-center justify-between text-xs text-gray-500">
                                    <span>Points: {bilan.position?.length || 0}/4</span>
                                    <span>Créé le {new Date().toLocaleDateString()}</span>
                                  </div>
                                </div>
                                
                                {/* Action Buttons - Enhanced QR Code Handling */}
                                <div className="flex space-x-2 pt-2 border-t border-gray-100">
                                  {!bilanQRCodes[bilan.id] ? (
                                    <Button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleGenerateQRCodeForBilan(bilan);
                                      }}
                                      size="sm"
                                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs transition-all duration-300 ease-in-out hover:scale-105"
                                    >
                                      <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V6a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1zm12 0h2a1 1 0 001-1V6a1 1 0 00-1-1h-2a1 1 0 00-1 1v1a1 1 0 001 1zM5 20h2a1 1 0 001-1v-1a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1z" />
                                      </svg>
                                      Générer QR
                                    </Button>
                                  ) : bilanQRCodes[bilan.id] === 'loading' ? (
                                    <div className="flex-1 flex items-center justify-center py-2">
                                      <div className="flex items-center space-x-2">
                                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                                        <span className="text-xs text-blue-600 font-medium">Génération...</span>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex gap-1 flex-1 animate-in slide-in-from-bottom-2 duration-300">
                                      <Button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleViewQRCode(bilan.id);
                                        }}
                                        size="sm"
                                        variant="outline"
                                        className="flex-1 border-greener-600 text-greener-600 hover:bg-greener-50 hover:border-greener-700 text-xs transition-all duration-200 hover:scale-105 hover:shadow-md"
                                      >
                                        <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                        Voir
                                      </Button>
                                      <Button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDownloadQRCode(bilan.id, bilan.nom);
                                        }}
                                        size="sm"
                                        variant="outline"
                                        className="flex-1 border-greener-600 text-greener-600 hover:bg-greener-50 hover:border-greener-700 text-xs transition-all duration-200 hover:scale-105 hover:shadow-md"
                                      >
                                        <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                        </svg>
                                        Télécharger
                                      </Button>
                                    </div>
                                  )}
                                  <Button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleCheckEtatBilanForBilan(bilan);
                                    }}
                                    size="sm"
                                    variant="outline"
                                    className="flex-1 border-green-600 text-green-600 hover:bg-green-50 hover:border-green-700 text-xs transition-all duration-200 hover:scale-105 hover:shadow-md"
                                  >
                                    <BarChart3 className="h-3 w-3 mr-1" />
                                    État
                                  </Button>
                                </div>

                                {/* Enhanced QR Code Display for Mobile */}
                                {bilanQRCodes[bilan.id] && bilanQRCodes[bilan.id] !== 'loading' && (
                                  <div className="pt-3 border-t border-gray-100 animate-in slide-in-from-bottom-2 duration-500">
                                    <div className="text-center space-y-3">
                                      <div className="flex items-center justify-center space-x-2">
                                        <svg className="h-4 w-4 text-greener-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <p className="text-xs font-medium text-greener-700">QR Code généré avec succès</p>
                                      </div>
                                      <div className="flex justify-center">
                                        <div className="relative animate-in zoom-in-95 duration-500">
                                          <img
                                            src={bilanQRCodes[bilan.id] instanceof Blob ? URL.createObjectURL(bilanQRCodes[bilan.id] as Blob) : ''}
                                            alt={`QR Code pour ${bilan.nom}`}
                                            className="w-32 h-32 border-2 border-greener-200 rounded-lg shadow-md transition-all duration-300 hover:scale-105 hover:shadow-lg"
                                          />
                                          {/* Success indicator overlay */}
                                          <div className="absolute -top-1 -right-1 w-6 h-6 bg-greener-500 rounded-full flex items-center justify-center animate-in zoom-in-95 duration-700 delay-300">
                                            <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                          </div>
                                        </div>
                                      </div>
                                      <div className="space-y-1">
                                        <p className="text-xs text-gray-600">
                                          Scannez ce QR code pour accéder aux informations du bilan
                                        </p>
                                        <p className="text-xs text-gray-500">
                                          Bilan: {bilan.nom} • {bilan.surface || 'Surface non calculée'} m²
                                        </p>
                                        <div className="flex justify-center space-x-2 pt-2">
                                          <Button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleViewQRCode(bilan.id);
                                            }}
                                            size="sm"
                                            variant="outline"
                                            className="text-xs border-greener-600 text-greener-600 hover:bg-greener-50"
                                          >
                                            <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                            </svg>
                                            Agrandir
                                          </Button>
                                          <Button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleDownloadQRCode(bilan.id, bilan.nom);
                                            }}
                                            size="sm"
                                            variant="outline"
                                            className="text-xs border-blue-600 text-blue-600 hover:bg-blue-50"
                                          >
                                            <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                            </svg>
                                            Télécharger
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </>
                  )}
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
                <div className="space-y-3 transition-all duration-500 ease-in-out" data-tab="etat">
                  {etatBilans.map((etat, index) => (
                    <Card 
                      key={etat.id} 
                      className="border-gray-200 transition-all duration-300 ease-in-out transform animate-in slide-in-from-bottom-2"
                      style={{
                        animationDelay: `${index * 100}ms`,
                        animation: 'slideInFromBottom 0.5s ease-out forwards'
                      }}
                    >
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

              {activeMobileTab === 'alerts' && selectedSerre && (
                <div className="space-y-3">
                  <Card className="border-2 border-dashed border-red-300 bg-red-50">
                    <CardContent className="p-4">
                      <div className="text-center space-y-3">
                        <div className="flex items-center justify-center space-x-2">
                          <Thermometer className="h-5 w-5 text-red-500" />
                          <h4 className="font-semibold text-red-700">
                            Carte des Alertes pour {selectedSerre.nom}
                          </h4>
                        </div>
                        <p className="text-xs text-red-600">
                          Activez la visualisation des alertes sur la carte existante
                        </p>
                        <Button
                          onClick={() => {
                            toggleAlertHeatmap();
                            setIsMobilePanelOpen(false);
                          }}
                          className={cn(
                            "w-full transition-all duration-300 ease-in-out relative overflow-hidden group shadow-lg",
                            showAlertHeatmap
                              ? "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-red-500/25"
                              : "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-emerald-500/25"
                          )}
                          size="sm"
                        >
                          {/* Animated background effect */}
                          <div className={cn(
                            "absolute inset-0 bg-gradient-to-r from-white/20 to-transparent transform transition-transform duration-500",
                            showAlertHeatmap ? "translate-x-full" : "-translate-x-full"
                          )} />
                          
                          {/* Icon with animation */}
                          <div className={cn(
                            "flex items-center justify-center transition-all duration-300",
                            showAlertHeatmap ? "scale-110" : "scale-100"
                          )}>
                            <Thermometer className={cn(
                              "h-4 w-4 mr-2 transition-all duration-300",
                              showAlertHeatmap ? "text-red-100" : "text-emerald-100"
                            )} />
                            <span className="font-medium">
                              {showAlertHeatmap ? 'Masquer' : 'Activer'} les Alertes
                            </span>
                          </div>
                          
                          {/* Status indicator */}
                          <div className={cn(
                            "absolute top-2 right-2 w-2 h-2 rounded-full transition-all duration-300",
                            showAlertHeatmap 
                              ? "bg-red-200 animate-pulse" 
                              : "bg-emerald-200"
                          )} />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Additional Map Controls for Mobile */}
                  <div className="space-y-2">
                    <h5 className="text-sm font-medium text-gray-700 text-center">
                      Contrôles de la carte
                    </h5>
                    
                    {/* Serre Boundaries Toggle */}
                    <Button
                      onClick={() => {
                        toggleSerreBoundaries();
                        setIsMobilePanelOpen(false);
                      }}
                      className={cn(
                        "w-full transition-all duration-300 ease-in-out relative overflow-hidden group shadow-lg",
                        showSerreBoundaries
                          ? "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-blue-500/25"
                          : "bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white shadow-gray-500/25"
                      )}
                      size="sm"
                    >
                      <div className={cn(
                        "absolute inset-0 bg-gradient-to-r from-white/20 to-transparent transform transition-transform duration-500",
                        showSerreBoundaries ? "translate-x-full" : "-translate-x-full"
                      )} />
                      
                      <div className={cn(
                        "flex items-center justify-center transition-all duration-300",
                        showSerreBoundaries ? "scale-110" : "scale-100"
                      )}>
                        <MapPin className={cn(
                          "h-4 w-4 mr-2 transition-all duration-300",
                          showSerreBoundaries ? "text-blue-100" : "text-gray-100"
                        )} />
                        <span className="font-medium">
                          {showSerreBoundaries ? 'Masquer' : 'Voir'} les Limites de Serre
                        </span>
                </div>
                      
                      <div className={cn(
                        "absolute top-2 right-2 w-2 h-2 rounded-full transition-all duration-300",
                        showSerreBoundaries 
                          ? "bg-blue-200 animate-pulse" 
                          : "bg-gray-200"
                      )} />
                    </Button>
                    
                    {/* Billons Toggle */}
                    <Button
                      onClick={() => {
                        toggleBillons();
                        setIsMobilePanelOpen(false);
                      }}
                      className={cn(
                        "w-full transition-all duration-300 ease-in-out relative overflow-hidden group shadow-lg",
                        showBillons
                          ? "bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white shadow-yellow-500/25"
                          : "bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white shadow-gray-500/25"
                      )}
                      size="sm"
                    >
                      <div className={cn(
                        "absolute inset-0 bg-gradient-to-r from-white/20 to-transparent transform transition-transform duration-500",
                        showBillons ? "translate-x-full" : "-translate-x-full"
                      )} />
                      
                      <div className={cn(
                        "flex items-center justify-center transition-all duration-300",
                        showBillons ? "scale-110" : "scale-100"
                      )}>
                        <BarChart3 className={cn(
                          "h-4 w-4 mr-2 transition-all duration-300",
                          showBillons ? "text-yellow-100" : "text-gray-100"
                        )} />
                        <span className="font-medium">
                          {showBillons ? 'Masquer' : 'Voir'} les Billons
                        </span>
                      </div>
                      
                      <div className={cn(
                        "absolute top-2 right-2 w-2 h-2 rounded-full transition-all duration-300",
                        showBillons 
                          ? "bg-yellow-200 animate-pulse" 
                          : "bg-gray-200"
                      )} />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Mobile Floating Action Button - Enhanced */}
        <Button
          onClick={() => setIsMobilePanelOpen(!isMobilePanelOpen)}
          className="fixed bottom-6 left-6 w-16 h-16 rounded-full shadow-2xl bg-[#B4CC5F] hover:bg-[#B4CC5F]/90 text-white z-40 lg:z-30 text-2xl font-bold transition-all duration-200 hover:scale-110 active:scale-95 mobile-safe-area"
          style={{
            // Ensure proper positioning on mobile
            ...(isMobile && {
              bottom: 'calc(1.5rem + env(safe-area-inset-bottom))',
              left: 'calc(1.5rem + env(safe-area-inset-left))'
            })
          }}
        >
          {isMobilePanelOpen ? '×' : '≡'}
        </Button>



        {/* Mobile Panel Quick Actions */}
        {isMobilePanelOpen && (
          <div className="fixed bottom-24 right-6 z-20 lg:hidden mobile-safe-area" style={{
            bottom: isMobile ? 'calc(6rem + env(safe-area-inset-bottom))' : '6rem',
            right: isMobile ? 'calc(1.5rem + env(safe-area-inset-right))' : '1.5rem'
          }}>
            <div className="flex flex-col space-y-2">
              {/* Quick Resize Buttons */}
              <Button
                onClick={() => setMobilePanelHeight(30)}
                size="sm"
                variant="outline"
                className="w-10 h-10 p-0 bg-white/90 backdrop-blur-sm border-gray-200 shadow-lg"
                title="Vue compacte"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                </svg>
              </Button>
              <Button
                onClick={() => setMobilePanelHeight(50)}
                size="sm"
                variant="outline"
                className="w-10 h-10 p-0 bg-white/90 backdrop-blur-sm border-gray-200 shadow-lg"
                title="Vue moyenne"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </Button>
              <Button
                onClick={() => setMobilePanelHeight(70)}
                size="sm"
                variant="outline"
                className="w-10 h-10 p-0 bg-white/90 backdrop-blur-sm border-gray-200 shadow-lg"
                title="Vue normale"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </Button>
              <Button
                onClick={() => setMobilePanelHeight(85)}
                size="sm"
                variant="outline"
                className="w-10 h-10 p-0 bg-white/90 backdrop-blur-sm border-gray-200 shadow-lg"
                title="Vue étendue"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7H7" />
                </svg>
              </Button>
            </div>
          </div>
        )}

        {/* Mobile Panel Status Indicator */}
        {isMobilePanelOpen && (
          <div className="fixed bottom-6 right-6 z-20 lg:hidden mobile-safe-area" style={{
            bottom: isMobile ? 'calc(1.5rem + env(safe-area-inset-bottom))' : '1.5rem',
            right: isMobile ? 'calc(1.5rem + env(safe-area-inset-right))' : '1.5rem'
          }}>
            <div className="bg-white/90 backdrop-blur-sm border border-gray-200 rounded-lg px-3 py-2 shadow-lg">
              <div className="flex items-center space-x-2">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  mobilePanelHeight < 35 ? "bg-green-500" : 
                  mobilePanelHeight < 55 ? "bg-yellow-500" : 
                  mobilePanelHeight < 75 ? "bg-blue-500" : "bg-purple-500"
                )}></div>
                <span className="text-xs font-medium text-gray-700">
                  {mobilePanelHeight < 35 ? "Compact" : 
                   mobilePanelHeight < 55 ? "Moyen" : 
                   mobilePanelHeight < 75 ? "Normal" : "Étendu"}
                </span>
              </div>
            </div>
          </div>
        )}




      </div>

      {/* Intervention Form Modal */}
      <InterventionForm
        isOpen={isInterventionFormOpen}
        onClose={() => setIsInterventionFormOpen(false)}
        onSubmit={handleInterventionSubmit}
      />

      {/* Billon Details Modal */}
      {isBilanDetailsOpen && selectedBilanDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-green-100 rounded-t-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">
                  Détails du Billon
                </h3>
                <button
                  onClick={() => setIsBilanDetailsOpen(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="px-6 py-4 space-y-4">
              {/* Billon Info */}
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900">{selectedBilanDetails.bilan.nom}</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-500">Surface</p>
                    <p className="font-medium text-gray-900">
                      {selectedBilanDetails.bilan.surface || 'Non calculée'} m²
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Points GPS</p>
                    <p className="font-medium text-gray-900">
                      {selectedBilanDetails.bilan.position?.length || 0}/4
                    </p>
                  </div>
                </div>
              </div>

              {/* Etat Bilan Info */}
              {selectedBilanDetails.etat && (
                <div className="space-y-3 pt-3 border-t border-gray-100">
                  <h5 className="font-medium text-gray-900">État du Billon</h5>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-500">Tomates saines</p>
                      <p className="font-medium text-green-600">
                        {selectedBilanDetails.etat.nombre_tomates_non_maladies}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Tomates malades</p>
                      <p className="font-medium text-red-600">
                        {selectedBilanDetails.etat.nombre_tomates_maladies}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Température</p>
                      <p className="font-medium text-gray-900">
                        {selectedBilanDetails.etat.temperature}°C
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Humidité</p>
                      <p className="font-medium text-gray-900">
                        {selectedBilanDetails.etat.humidite}%
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex space-x-3 pt-4 border-t border-gray-100">
                <Button
                  onClick={() => {
                    setIsBilanDetailsOpen(false);
                    // You can add navigation to bilan details page here
                  }}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  Voir plus de détails
                </Button>
                <Button
                  onClick={() => setIsBilanDetailsOpen(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Fermer
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

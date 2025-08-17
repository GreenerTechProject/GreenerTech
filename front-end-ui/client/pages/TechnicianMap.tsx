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
      // Also refresh guides when a new bilan is created
      await loadGuidesForSerre(parseInt(selectedSerre.id));
    }
    setIsCreatingBilan(false);
  };

  // Load guides for selected serre
  const loadGuidesForSerre = async (serreId: number) => {
    try {
      setIsLoadingGuides(true);
      console.log('Loading guides for serre:', serreId);
      
      // Try to use the new method first, fallback to filtering if it doesn't exist
      try {
        const serreGuides = await guideService.getGuidesBySerre(serreId);
        console.log('Received guides for serre via API:', serreGuides);
        setGuides(serreGuides);
      } catch (apiError: any) {
        // Fallback to fetching all guides and filtering
        console.log('Falling back to filtering guides:', apiError.message);
        const allGuides = await guideService.getGuides();
        console.log('All guides received:', allGuides);
        
        const filteredGuides = allGuides.filter(guide => {
          const guideSerreId = parseInt(guide.id_serre);
          const matches = guideSerreId === serreId;
          console.log(`Guide ${guide.id}: serre ID ${guideSerreId} matches ${serreId}? ${matches}`);
          return matches;
        });
        console.log('Filtered guides for serre:', filteredGuides);
      setGuides(filteredGuides);
      }
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
      
      // Ensure we always set an array
      if (Array.isArray(etatBilanData)) {
      setEtatBilans(etatBilanData);
      } else {
        console.warn('Expected array of etat bilans, got:', etatBilanData);
        setEtatBilans([]);
      }
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
      serre.variety?.toLowerCase().includes(lowerQuery)
    );

    // Search in guides
    const matchingGuides = guides.filter(guide => 
      guide.nom.toLowerCase().includes(lowerQuery) ||
      guide.variete.toLowerCase().includes(lowerQuery)
    );

    // Search in bilans
    const matchingBilans = bilans.filter(bilan => 
      bilan.nom.toLowerCase().includes(lowerQuery)
    );

    // Search in etat bilans
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

      <div className="flex flex-col lg:flex-row h-[calc(100vh-73px)] overflow-hidden">

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
                placeholder="Rechercher serres, guides, bilans..."
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
                        <div className="text-xs text-blue-600">{serre.variety}</div>
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
                    <h4 className="text-xs font-medium text-blue-800">Bilans ({searchResults.bilans.length})</h4>
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
                          <span>Billons: {serre.zones.length}</span>
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
                                  <p className="font-medium text-green-600">{guide.rendement} kg</p>
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
                      <p className="text-sm">Chargement des bilans...</p>
                    </div>
                  ) : bilans.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">
                      <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Aucun bilan disponible pour cette serre</p>
                      <p className="text-xs text-gray-400 mt-1">Créez un nouveau bilan pour commencer</p>
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
                <div className="space-y-4 pt-2">
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
        <div className="flex-1 relative h-full overflow-hidden" data-testid="map-section">
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
          className="fixed bottom-6 left-6 w-16 h-16 rounded-full shadow-2xl bg-[#B4CC5F] hover:bg-[#B4CC5F]/90 text-white z-40 text-2xl font-bold transition-all duration-200 hover:scale-110"
        >
          {isMobilePanelOpen ? '×' : '≡'}
        </Button>

  
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

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useSidebar } from "@/hooks/useSidebar";
import DirectorHeader from "@/components/DirectorHeader";
import DirectorSidebar from "@/components/DirectorSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MapPin, Plus, Trash2, Home, Loader2, Info, X, Building2, Leaf, BarChart3, Eye, EyeOff, BookOpen, GripVertical, Move, Maximize2, Minimize2, Menu, AlertTriangle, Edit3, Save, RotateCcw } from "lucide-react";
import { useLoadScript } from "@react-google-maps/api";
import MapComponent, { DrawnShape } from "@/components/MapComponent";
import { getGoogleMapsAPIKey } from "@/config/maps";
import { companyMapService, CompanyMapData, DomainWithSerresAndBilans } from "@/services/companyMapService";
import { domainService } from "@/services/domainService";
import { serreService } from "@/services/serreService";
import { guideService, CreateGuideRequest } from "@/services/guideService";
import { DomainSetup, SerreSetup, GuideData } from "@/types/setup";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ExtendedSerre {
  id: string;
  nom: string;
  surface: number;
  domainId: string;
  position: google.maps.LatLng[];
  center: google.maps.LatLng;
  bilans: any[];
  guideId: string; // Add missing guideId property
  guideData?: any; // Guide culture data fetched from API
}

interface DomainWithSerres extends DomainWithSerresAndBilans {
  serres: ExtendedSerre[];
}

// Interface for enriched company data with guide culture information
interface EnrichedCompanyData extends CompanyMapData {
  domains: (DomainWithSerresAndBilans & {
    serres: (any & {
      guideData?: any;
    })[];
  })[];
}

const GOOGLE_MAPS_API_KEY = getGoogleMapsAPIKey();

export default function DirectorMapConfig() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { isOpen, setIsOpen, toggleSidebar } = useSidebar();
  const [companyData, setCompanyData] = useState<EnrichedCompanyData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingDomain, setIsCreatingDomain] = useState(false);
  const [isCreatingSerre, setIsCreatingSerre] = useState(false);
  const [isCreatingGuide, setIsCreatingGuide] = useState(false);
  const [newDomainName, setNewDomainName] = useState("");
  const [newSerreName, setNewSerreName] = useState("");
  const [pendingShape, setPendingShape] = useState<DrawnShape | null>(null);
  const [selectedDomainId, setSelectedDomainId] = useState<string | null>(null);
  const [selectedSerreId, setSelectedSerreId] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [activeTab, setActiveTab] = useState<"domains" | "serres" | "guides">("domains");
  const [showSerres, setShowSerres] = useState(true);
  
  // New state for editing
  const [editingDomainId, setEditingDomainId] = useState<string | null>(null);
  const [editingSerreId, setEditingSerreId] = useState<string | null>(null);
  const [editingDomainName, setEditingDomainName] = useState("");
  const [editingSerreName, setEditingSerreName] = useState("");
  const [isUpdatingDomain, setIsUpdatingDomain] = useState(false);
  const [isUpdatingSerre, setIsUpdatingSerre] = useState(false);
  const [isRedrawingDomain, setIsRedrawingDomain] = useState(false);
  const [isRedrawingSerre, setIsRedrawingSerre] = useState(false);
  const [redrawTargetId, setRedrawTargetId] = useState<string | null>(null);
  const [redrawTargetType, setRedrawTargetType] = useState<"domain" | "serre" | null>(null);
  
  // Guide culture form state
  const [guideFormData, setGuideFormData] = useState<CreateGuideRequest>({
    nom: "",
    variete: "",
    rendement: 0,
    nombre_de_plants: 0,
    date_debut_saison: "",
    date_fin_saison: "",
    id_serre: ""
  });
  const [newlyCreatedSerreId, setNewlyCreatedSerreId] = useState<string | null>(null);
  const [showGuideSuccess, setShowGuideSuccess] = useState(false);
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(true);
  const [detailsPosition, setDetailsPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [domainNameSize, setDomainNameSize] = useState<'small' | 'medium' | 'large'>('medium');
  
  // Enhanced dragging and resizing state
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStart, setResizeStart] = useState<{ x: number; y: number; width: number; height: number }>({ x: 0, y: 0, width: 0, height: 0 });
  const [detailsDimensions, setDetailsDimensions] = useState<{ width: number; height: number | 'auto' }>({ width: 400, height: 'auto' });
  const [dragHandleHover, setDragHandleHover] = useState(false);
  const [resizeHandleHover, setResizeHandleHover] = useState(false);
  const [mobilePanelHeight, setMobilePanelHeight] = useState(300);
  const [isMobilePanelResizing, setIsMobilePanelResizing] = useState(false);
  const [mobileResizeStart, setMobileResizeStart] = useState<{ y: number; height: number }>({ y: 0, height: 0 });
  
  // Left panel resize state
  const [leftPanelWidth, setLeftPanelWidth] = useState(480); // Default width
  const [isLeftPanelResizing, setIsLeftPanelResizing] = useState(false);
  const [leftPanelResizeStart, setLeftPanelResizeStart] = useState<{ x: number; width: number }>({ x: 0, width: 0 });
  
  const detailsRef = useRef<HTMLDivElement>(null);
  const dragHandleRef = useRef<HTMLDivElement>(null);
  const resizeHandleRef = useRef<HTMLDivElement>(null);
  const mobilePanelRef = useRef<HTMLDivElement>(null);

  // Use the proper Google Maps loading hook
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: ["drawing", "geometry", "places", "visualization"]
  });

  // Fetch all company data in one optimized call
  const fetchCompanyData = useCallback(async () => {
    if (!user?.id_entreprise) return;

    try {
      setIsLoading(true);
      
      const data = await companyMapService.getCompanyMapData(user.id_entreprise.toString());
      console.log("[DEBUG] Company data received:", data);
      
      // Test guide service connection
      try {
        console.log("[DEBUG] Testing guide service connection...");
        const testGuides = await guideService.getGuides();
        console.log("[DEBUG] Test guides response:", testGuides);
      } catch (error) {
        console.error("[DEBUG] Guide service test failed:", error);
      }
      
      // Fetch guide culture data for all serres that have guides
      const domainsWithGuides = await Promise.all(
        data.domains.map(async (domain) => {
          const serresWithGuides = await Promise.all(
            domain.serres.map(async (serre) => {
              if (serre.guideId) {
                try {
                  console.log(`[DEBUG] Fetching guide ${serre.guideId} for serre ${serre.id}`);
                  const guide = await guideService.getGuideById(serre.guideId);
                  console.log(`[DEBUG] Received guide for serre ${serre.id}:`, guide);
                  return {
                    ...serre,
                    guideData: guide
                  };
                } catch (error) {
                  console.warn(`Failed to fetch guide ${serre.guideId} for serre ${serre.id}:`, error);
                  return serre;
                }
              }
              return serre;
            })
          );
          
          return {
            ...domain,
            serres: serresWithGuides
          };
        })
      );
      
      const enrichedData = {
        ...data,
        domains: domainsWithGuides
      };
      
      console.log("[DEBUG] Enriched data:", enrichedData);
      setCompanyData(enrichedData);
      
    } catch (error: any) {
      console.error("Error fetching company data:", error);
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la récupération des données",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [user?.id_entreprise, toast]);

  // Function to refresh only guide culture data
  const refreshGuideData = useCallback(async () => {
    if (!companyData || !user?.id_entreprise) return;

    try {
      setIsLoading(true);
      
      // Only refresh guide data for existing serres
      const domainsWithUpdatedGuides = await Promise.all(
        companyData.domains.map(async (domain) => {
          const serresWithUpdatedGuides = await Promise.all(
            domain.serres.map(async (serre) => {
              if (serre.guideId) {
                try {
                  console.log(`[DEBUG] Refreshing guide ${serre.guideId} for serre ${serre.id}`);
                  const guide = await guideService.getGuideById(serre.guideId);
                  console.log(`[DEBUG] Refresh received guide for serre ${serre.id}:`, guide);
                  
                  return {
                    ...serre,
                    guideData: guide
                  };
                } catch (error) {
                  console.warn(`Failed to fetch guide ${serre.guideId} for serre ${serre.id}:`, error);
                  return serre;
                }
              }
              return serre;
            })
          );
          
          return {
            ...domain,
            serres: serresWithUpdatedGuides
          };
        })
      );
      
      setCompanyData({
        ...companyData,
        domains: domainsWithUpdatedGuides
      });
      
      toast({
        title: "Données mises à jour",
        description: "Les guides de culture ont été actualisés",
      });
      
    } catch (error: any) {
      console.error("Error refreshing guide data:", error);
      toast({
        title: "Erreur",
        description: "Erreur lors de l'actualisation des guides de culture",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [companyData, user?.id_entreprise, toast]);

  useEffect(() => {
    fetchCompanyData();
  }, [fetchCompanyData]);

  // Google Maps loading is now handled by useLoadScript hook

  const handleShapeComplete = (shape: DrawnShape) => {
    // Check if this is a redraw operation
    if (redrawTargetId && redrawTargetType) {
      handleRedrawComplete(shape);
      return;
    }

    // Keep the form visible and store the shape to render it until Save/Cancel
    setPendingShape(shape);
    if (shape.type === "domain") {
      setIsCreatingDomain(true);
      setIsCreatingSerre(false);
    } else if (shape.type === "serre") {
      setIsCreatingSerre(true);
      setIsCreatingDomain(false);
    }
  };

  const handleSaveDomain = async () => {
    if (!pendingShape || !newDomainName.trim() || !user?.id_entreprise) return;

    try {
      setIsLoading(true);
      
      const domainRequest = {
        name: newDomainName.trim(),
        area: pendingShape.area,
        center: {
          lat: pendingShape.center.lat(),
          lng: pendingShape.center.lng(),
        },
        path: pendingShape.path.map(point => ({
          lat: point.lat(),
          lng: point.lng(),
          ordre: 0
        })),
        companyId: user.id_entreprise.toString(),
      };

      const response = await companyMapService.createDomain(domainRequest);
      
      if (response.id || response.domainId) {
        const newDomain: DomainWithSerres = {
          id: response.id || response.domainId || `domain-${Date.now()}`,
          name: newDomainName.trim(),
          area: pendingShape.area,
          center: {
            lat: pendingShape.center.lat(),
            lng: pendingShape.center.lng(),
          },
          path: pendingShape.path.map(point => ({
            lat: point.lat(),
            lng: point.lng(),
            ordre: 0
          })),
          companyId: user.id_entreprise.toString(),
          serres: []
        };

        setCompanyData(prev => prev ? {
          ...prev,
          domains: [...prev.domains, newDomain as DomainWithSerresAndBilans]
        } : null);
        
        setNewDomainName("");
        setPendingShape(null);
        
        toast({
          title: "Domaine créé",
          description: `Le domaine "${newDomainName.trim()}" a été créé avec succès`,
        });
        // Close the creation form after successful save
        setIsCreatingDomain(false);
        setIsRedrawingDomain(false);
        setIsRedrawingSerre(false);
        setRedrawTargetId(null);
        setRedrawTargetType(null);
      }
    } catch (error: any) {
      console.error("Error creating domain:", error);
      toast({
        title: "Erreur",
        description: error.message || "Échec de la création du domaine",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Enhanced dragging and resizing functions
  const handleDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - detailsPosition.x,
      y: e.clientY - detailsPosition.y
    });
  }, [detailsPosition]);

  const handleDragMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    
    // Smooth animation with requestAnimationFrame
    requestAnimationFrame(() => {
      setDetailsPosition({ x: newX, y: newY });
    });
  }, [isDragging, dragStart]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: detailsDimensions.width,
      height: typeof detailsDimensions.height === 'number' ? detailsDimensions.height : 400
    });
  }, [detailsDimensions]);

  const handleResizeMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;
    
    const deltaX = e.clientX - resizeStart.x;
    const deltaY = e.clientY - resizeStart.y;
    
    const newWidth = Math.max(300, Math.min(800, resizeStart.width + deltaX));
    const newHeight = Math.max(200, Math.min(600, resizeStart.height + deltaY));
    
    // Smooth animation with requestAnimationFrame
    requestAnimationFrame(() => {
      setDetailsDimensions({
        width: newWidth,
        height: newHeight
      });
    });
  }, [isResizing, resizeStart]);

  const handleResizeEnd = useCallback(() => {
    setIsResizing(false);
  }, []);

  const handleMobileResizeStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsMobilePanelResizing(true);
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setMobileResizeStart({
      y: clientY,
      height: mobilePanelHeight
    });
  }, [mobilePanelHeight]);

  const handleMobileResizeMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isMobilePanelResizing) return;
    
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const deltaY = mobileResizeStart.y - clientY;
    
    const newHeight = Math.max(150, Math.min(400, mobileResizeStart.height + deltaY));
    
    requestAnimationFrame(() => {
      setMobilePanelHeight(newHeight);
    });
  }, [isMobilePanelResizing, mobileResizeStart]);

  const handleMobileResizeEnd = useCallback(() => {
    setIsMobilePanelResizing(false);
  }, []);

  // Left panel resize handlers
  const handleLeftPanelResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsLeftPanelResizing(true);
    setLeftPanelResizeStart({
      x: e.clientX,
      width: leftPanelWidth
    });
  }, [leftPanelWidth]);

  const handleLeftPanelResizeMove = useCallback((e: MouseEvent) => {
    if (!isLeftPanelResizing) return;
    
    const deltaX = e.clientX - leftPanelResizeStart.x;
    const newWidth = Math.max(320, Math.min(800, leftPanelResizeStart.width + deltaX));
    
    requestAnimationFrame(() => {
      setLeftPanelWidth(newWidth);
    });
  }, [isLeftPanelResizing, leftPanelResizeStart]);

  const handleLeftPanelResizeEnd = useCallback(() => {
    setIsLeftPanelResizing(false);
  }, []);

  // Add and remove global event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleDragMove);
      document.addEventListener('mouseup', handleDragEnd);
      document.body.style.cursor = 'grabbing';
      document.body.style.userSelect = 'none';
      return () => {
        document.removeEventListener('mousemove', handleDragMove);
        document.removeEventListener('mouseup', handleDragEnd);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [isDragging, handleDragMove, handleDragEnd]);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleResizeMove);
      document.addEventListener('mouseup', handleResizeEnd);
      document.body.style.cursor = 'se-resize';
      document.body.style.userSelect = 'none';
      return () => {
        document.removeEventListener('mousemove', handleResizeMove);
        document.removeEventListener('mouseup', handleResizeEnd);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [isResizing, handleResizeMove, handleResizeEnd]);

  useEffect(() => {
    if (isMobilePanelResizing) {
      document.addEventListener('mousemove', handleMobileResizeMove);
      document.addEventListener('mouseup', handleMobileResizeEnd);
      document.addEventListener('touchmove', handleMobileResizeMove);
      document.addEventListener('touchend', handleMobileResizeEnd);
      document.body.style.cursor = 'ns-resize';
      document.body.style.userSelect = 'none';
      return () => {
        document.removeEventListener('mousemove', handleMobileResizeMove);
        document.removeEventListener('mouseup', handleMobileResizeEnd);
        document.removeEventListener('touchmove', handleMobileResizeMove);
        document.removeEventListener('touchend', handleMobileResizeEnd);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [isMobilePanelResizing, handleMobileResizeMove, handleMobileResizeEnd]);

  // Left panel resize event listeners
  useEffect(() => {
    if (isLeftPanelResizing) {
      document.addEventListener('mousemove', handleLeftPanelResizeMove);
      document.addEventListener('mouseup', handleLeftPanelResizeEnd);
      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';
      return () => {
        document.removeEventListener('mousemove', handleLeftPanelResizeMove);
        document.removeEventListener('mouseup', handleLeftPanelResizeEnd);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [isLeftPanelResizing, handleLeftPanelResizeMove, handleLeftPanelResizeEnd]);

  // Reset position and size function
  const resetDetailsPanel = useCallback(() => {
    // Add a smooth reset animation
    const resetAnimation = () => {
      setDetailsPosition({ x: 0, y: 0 });
      setDetailsDimensions({ width: 400, height: 'auto' });
      setDomainNameSize('medium');
    };

    // Use a small delay for smooth transition
    setTimeout(resetAnimation, 50);
    
    // Show feedback to user
    toast({
      title: "Panneau réinitialisé",
      description: "Position et taille remises à zéro",
      duration: 2000,
    });
  }, [toast]);

  const handleSaveSerre = async () => {
    if (!pendingShape || !newSerreName.trim() || !selectedDomainId || !user?.id_entreprise) return;

    // Validate guide culture data before creating serre
    if (!guideFormData.nom.trim() || !guideFormData.variete.trim() || !guideFormData.date_debut_saison || !guideFormData.date_fin_saison) {
      toast({
        title: "Données manquantes",
        description: "Veuillez remplir toutes les informations du guide de culture avant de créer la serre.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      
      // Create serre first
      const serreRequest = {
        nom: newSerreName.trim(),
        id_domaine: parseInt(selectedDomainId),
        position: pendingShape.path.map(point => ({
          latitude: point.lat(),
          longitude: point.lng(),
          ordre: 0
        })),
        surface: pendingShape.area,
        center: {
          lat: pendingShape.center.lat(),
          lng: pendingShape.center.lng(),
        }
      };

      const serreResponse = await serreService.createSerre(serreRequest);
      
      // Debug: Log the serre response
      console.log("Serre creation response:", serreResponse);
      console.log("Serre response type:", typeof serreResponse);
      console.log("Serre response keys:", Object.keys(serreResponse));
      
      if (serreResponse.id || serreResponse.serreId) {
        const serreId = serreResponse.id?.toString() || serreResponse.serreId?.toString() || "";
        
        // Update guide form with the serre ID
        const guideDataWithSerreId = {
          ...guideFormData,
          id_serre: serreId
        };

        // Create guide culture immediately after serre creation
        const guideResponse = await guideService.createGuide(guideDataWithSerreId);
        
        // Debug: Log the guide response to see what we're actually getting
        console.log("Guide creation response:", guideResponse);
        console.log("Guide response type:", typeof guideResponse);
        console.log("Guide response keys:", Object.keys(guideResponse));
        
        // Check for guideId in different possible response structures
        const guideId = (guideResponse as any).guideId || (guideResponse as any).id || (guideResponse as any).guide?.id || (guideResponse as any).data?.guideId || (guideResponse as any).data?.id;
        
        if (guideId) {
          // Create the complete serre object with guide information
          const newSerre: ExtendedSerre = {
            id: serreId,
            nom: newSerreName.trim(),
            surface: pendingShape.area,
            domainId: selectedDomainId,
            position: pendingShape.path,
            center: pendingShape.center,
            bilans: [],
            guideId: guideId
          };

          // Add the new serre with guide to the selected domain
          setCompanyData(prev => {
            console.log("[DEBUG] Previous company data:", prev);
            const updated = prev ? {
              ...prev,
              domains: prev.domains.map(domain => 
                domain.id === selectedDomainId 
                  ? { ...domain, serres: [...domain.serres, newSerre as any] }
                  : domain
              )
            } : null;
            console.log("[DEBUG] Updated company data:", updated);
            return updated;
          });

          toast({
            title: "Serre et guide créés",
            description: `La serre "${newSerreName.trim()}" et son guide de culture ont été créés avec succès.`,
          });

          // Reset all forms and states
          setGuideFormData({
            nom: "",
            variete: "",
            rendement: 0,
            nombre_de_plants: 0,
            date_debut_saison: "",
            date_fin_saison: "",
            id_serre: ""
          });
          setNewSerreName("");
          setPendingShape(null);
          setNewlyCreatedSerreId(null);
          setIsCreatingSerre(false);
          setIsCreatingGuide(false);
          setIsRedrawingDomain(false);
          setIsRedrawingSerre(false);
          setRedrawTargetId(null);
          setRedrawTargetType(null);
          
          // Transition to guides tab to show the newly created guide
          setActiveTab("guides");
          setShowGuideSuccess(true);
          
          // Auto-hide success message after 5 seconds
          setTimeout(() => setShowGuideSuccess(false), 5000);
          
          // Refresh guide data to show the newly created guide details
          setTimeout(() => {
            refreshGuideData();
          }, 1000);
        } else {
          // Debug: Log why the condition failed
          console.log("Guide creation condition failed:");
          console.log("guideResponse:", guideResponse);
          console.log("guideResponse.guideId:", guideResponse.guideId);
          console.log("guideResponse.guideId type:", typeof guideResponse.guideId);
          console.log("guideResponse.guideId truthy check:", !!guideResponse.guideId);
          
          // If guide creation failed, delete the serre and show error
          toast({
            title: "Erreur",
            description: "La serre a été créée mais le guide de culture n'a pas pu être créé. La serre sera supprimée.",
            variant: "destructive",
          });
          
          // TODO: Add API call to delete the serre if guide creation fails
          // For now, just reset the state
          setNewSerreName("");
          setPendingShape(null);
          setIsCreatingSerre(false);
          setIsRedrawingDomain(false);
          setIsRedrawingSerre(false);
          setRedrawTargetId(null);
          setRedrawTargetType(null);
        }
      }
    } catch (error: any) {
      console.error("Error creating serre or guide:", error);
      toast({
        title: "Erreur",
        description: error.message || "Échec de la création de la serre ou du guide de culture",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };



  const handleDeleteDomain = async (domainId: string) => {
    try {
      setIsLoading(true);
      // Call backend to delete the domain
      await domainService.deleteDomain(domainId);

      // Update local state to remove the domain
      setCompanyData(prev => prev ? {
        ...prev,
        domains: prev.domains.filter(d => d.id !== domainId)
      } : null);

      if (selectedDomainId === domainId) {
        setSelectedDomainId(null);
      }
      
      // Reset redrawing states if the deleted domain was being redrawn
      if (redrawTargetId === domainId) {
        setIsRedrawingDomain(false);
        setRedrawTargetId(null);
        setRedrawTargetType(null);
      }

      toast({
        title: "Domaine supprimé",
        description: "Le domaine a été supprimé avec succès",
      });
    } catch (error: any) {
      console.error('Erreur suppression domaine:', error);
      toast({
        title: "Erreur",
        description: error?.message || "Impossible de supprimer le domaine",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSerre = async (serreId: string, domainId: string) => {
    try {
      setIsLoading(true);
      await serreService.deleteSerre(serreId, domainId);

      // Update local state after successful deletion
      setCompanyData(prev => prev ? {
        ...prev,
        domains: prev.domains.map(domain => 
          domain.id === domainId 
            ? { ...domain, serres: domain.serres.filter(s => s.id !== serreId) }
            : domain
        )
      } : null);

      toast({
        title: "Serre supprimée",
        description: "La serre a été supprimée avec succès",
      });
      
      // Reset redrawing states if the deleted serre was being redrawn
      if (redrawTargetId === serreId) {
        setIsRedrawingSerre(false);
        setRedrawTargetId(null);
        setRedrawTargetType(null);
      }
    } catch (error: any) {
      console.error('Erreur suppression serre:', error);
      toast({
        title: "Erreur",
        description: error?.message || "Impossible de supprimer la serre",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDomainSelect = (domainId: string) => {
    setSelectedDomainId(domainId === selectedDomainId ? null : domainId);
    // When selecting a domain, switch to serres tab to show serres from that domain
    if (domainId !== selectedDomainId) {
      setActiveTab("serres");
      // Clear any previously selected serre when switching domains
      setSelectedSerreId(null);
    }
    
    // Reset redrawing states when switching domain selection
    if (isRedrawingDomain || isRedrawingSerre) {
      setIsRedrawingDomain(false);
      setIsRedrawingSerre(false);
      setRedrawTargetId(null);
      setRedrawTargetType(null);
      setPendingShape(null);
    }
  };

  const handleSerreSelect = (serreId: string) => {
    setSelectedSerreId(serreId === selectedSerreId ? null : serreId);
    // When selecting a serre, switch to guides tab to show its guide culture
    if (serreId !== selectedSerreId) {
      setActiveTab("guides");
    }
    
    // Reset redrawing states when switching serre selection
    if (isRedrawingDomain || isRedrawingSerre) {
      setIsRedrawingDomain(false);
      setIsRedrawingSerre(false);
      setRedrawTargetId(null);
      setRedrawTargetType(null);
      setPendingShape(null);
    }
  };

  const startDrawingDomain = () => {
    setIsCreatingDomain(true);
    setIsCreatingSerre(false);
    setIsRedrawingDomain(false);
    setIsRedrawingSerre(false);
    setRedrawTargetId(null);
    setRedrawTargetType(null);
    setPendingShape(null);
    setNewDomainName("");
  };

  const startDrawingSerre = () => {
    if (!selectedDomainId) {
      toast({
        title: "Sélection requise",
        description: "Veuillez d'abord sélectionner un domaine pour y ajouter une serre",
        variant: "destructive",
      });
      return;
    }
    setIsCreatingSerre(true);
    setIsCreatingDomain(false);
    setIsRedrawingDomain(false);
    setIsRedrawingSerre(false);
    setRedrawTargetId(null);
    setRedrawTargetType(null);
    setPendingShape(null);
    setNewSerreName("");
  };

  const cancelDrawing = () => {
    setIsCreatingDomain(false);
    setIsCreatingSerre(false);
    setIsCreatingGuide(false);
    setIsRedrawingDomain(false);
    setIsRedrawingSerre(false);
    setRedrawTargetId(null);
    setRedrawTargetType(null);
    setPendingShape(null);
    setNewDomainName("");
    setNewSerreName("");
  };

  const allShapes = useMemo((): DrawnShape[] => {
    if (!companyData || !isLoaded || typeof google === 'undefined' || !google.maps) {
      console.log('[DirectorMapConfig] Skipping shape generation:', {
        hasCompanyData: !!companyData,
        isLoaded,
        googleAvailable: typeof google !== 'undefined',
        googleMapsAvailable: typeof google !== 'undefined' && !!google.maps
      });
      return [];
    }
    
    console.log('[DirectorMapConfig] Generating shapes with Google Maps available');
    console.log('[DirectorMapConfig] Company data:', companyData);
    let shapes: DrawnShape[] = [];
    
    // Build polygon shapes for each domain
    if (companyData && companyData.domains) {
      console.log('[DirectorMapConfig] Found domains:', companyData.domains.length);
      const palette = [
        '#4CAF50', '#8BC34A', '#CDDC39', '#FFEB3B', '#FFC107',
        '#FF9800', '#FF5722', '#795548', '#9C27B0', '#673AB7',
        '#3F51B5', '#2196F3', '#03A9F4', '#00BCD4', '#009688'
      ];

      companyData.domains.forEach((domain, index) => {
        if (!domain.path || domain.path.length === 0) return;

        const pathLatLng: google.maps.LatLng[] = domain.path.map((p: any) =>
          new google.maps.LatLng(p.lat, p.lng)
        );

        const centerLatLng = domain.center
          ? new google.maps.LatLng(domain.center.lat, domain.center.lng)
          : pathLatLng[0];

        shapes.push({
          id: String(domain.id),
          type: 'domain',
          name: (domain as any).name || (domain as any).nom || 'Domaine',
          path: pathLatLng,
          area: (domain as any).area || 0,
          center: centerLatLng,
          color: palette[index % palette.length],
          metadata: { domainName: (domain as any).name || (domain as any).nom }
        });

        // Render serres inside domains when toggled on
        console.log(`[DEBUG] showSerres state:`, showSerres);
        console.log(`[DEBUG] Domain ${domain.id} has serres:`, (domain as any).serres);
        if (showSerres && (domain as any).serres && (domain as any).serres.length > 0) {
          console.log(`[DEBUG] Processing serres for domain ${domain.id}:`, (domain as any).serres);
          (domain as any).serres.forEach((serre: any) => {
            console.log(`[DEBUG] Processing serre ${serre.id}:`, serre);
            if (!serre.position || serre.position.length === 0) {
              console.log(`[DEBUG] Serre ${serre.id} has no position data:`, serre.position);
              return;
            }
            const serrePath: google.maps.LatLng[] = serre.position.map((p: any) =>
              new google.maps.LatLng(p.lat ?? p.latitude, p.lng ?? p.longitude)
            );
            const serreCenter = serre.center
              ? new google.maps.LatLng(serre.center.lat, serre.center.lng)
              : serrePath[0];

            console.log(`[DEBUG] Creating serre shape for ${serre.id}:`, {
              id: String(serre.id),
              type: 'serre',
              name: serre.nom,
              path: serrePath,
              center: serreCenter,
              domainId: String(domain.id)
            });

            shapes.push({
              id: String(serre.id),
              type: 'serre',
              name: serre.nom || 'Serre',
              path: serrePath,
              area: serre.surface || 0,
              center: serreCenter,
              color: '#FF5722',
              domainId: String(domain.id),
              metadata: {
                domainName: (domain as any).name || (domain as any).nom,
                serreName: serre.nom,
                // Optional extra info for hover tooltip
                variety: serre?.guide?.variete ?? (serre as any)?.variete,
                surfaceHa: serre?.surface ? (serre.surface / 10000).toFixed(2) : undefined,
              } as any
            });
          });
        }
      });
    }
    
    // Show the in-progress shape (pending) like in setup flows
    if (pendingShape) {
      shapes.push(pendingShape);
    }
    
    // If redrawing, hide the original shape being redrawn
    if (redrawTargetId && redrawTargetType) {
      shapes = shapes.filter(shape => shape.id !== redrawTargetId);
    }

    console.log('[DirectorMapConfig] Generated shapes:', shapes.length);
    console.log('[DEBUG] Final shapes array:', shapes);
    return shapes;
  }, [companyData, isLoaded, showSerres, pendingShape]);

  const selectedDomain = companyData?.domains.find(d => d.id === selectedDomainId);
  const currentDrawingMode = isCreatingDomain ? "domain" : isCreatingSerre ? "serre" : 
    isRedrawingDomain ? "domain" : isRedrawingSerre ? "serre" : null;

  // New functions for editing domains and serres
  const startEditingDomain = (domainId: string, currentName: string) => {
    setEditingDomainId(domainId);
    setEditingDomainName(currentName);
  };

  const startEditingSerre = (serreId: string, currentName: string) => {
    setEditingSerreId(serreId);
    setEditingSerreName(currentName);
  };

  const cancelEditing = () => {
    setEditingDomainId(null);
    setEditingSerreId(null);
    setEditingDomainName("");
    setEditingSerreName("");
  };

  const handleUpdateDomain = async (domainId: string) => {
    if (!editingDomainName.trim()) {
      toast({
        title: "Nom requis",
        description: "Le nom du domaine ne peut pas être vide",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsUpdatingDomain(true);
      
      const domain = companyData?.domains.find(d => d.id === domainId);
      if (!domain) {
        throw new Error("Domaine introuvable");
      }

      const updateData = {
        name: editingDomainName.trim()
      };

      await domainService.updateDomain(domainId, updateData);

      // Update local state
      setCompanyData(prev => prev ? {
        ...prev,
        domains: prev.domains.map(d => 
          d.id === domainId 
            ? { ...d, name: editingDomainName.trim() }
            : d
        )
      } : null);

      toast({
        title: "Domaine mis à jour",
        description: `Le nom du domaine a été mis à jour avec succès`,
      });

      cancelEditing();
    } catch (error: any) {
      console.error("Error updating domain:", error);
      toast({
        title: "Erreur",
        description: error.message || "Échec de la mise à jour du domaine",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingDomain(false);
    }
  };

  const handleUpdateSerre = async (serreId: string) => {
    if (!editingSerreName.trim()) {
      toast({
        title: "Nom requis",
        description: "Le nom de la serre ne peut pas être vide",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsUpdatingSerre(true);
      
      // Find the serre and its domain
      let domainId: string | null = null;
      const serre = companyData?.domains
        .find(d => {
          const foundSerre = d.serres.find(s => s.id === serreId);
          if (foundSerre) {
            domainId = d.id;
            return true;
          }
          return false;
        })?.serres.find(s => s.id === serreId);
      
      if (!serre || !domainId) {
        throw new Error("Serre introuvable");
      }

      const updateData = {
        nom: editingSerreName.trim()
      };

      await serreService.updateSerre(serreId, updateData, domainId);

      // Update local state
      setCompanyData(prev => prev ? {
        ...prev,
        domains: prev.domains.map(domain => ({
          ...domain,
          serres: domain.serres.map(s => 
            s.id === serreId 
              ? { ...s, nom: editingSerreName.trim() }
              : s
          )
        }))
      } : null);

      toast({
        title: "Serre mise à jour",
        description: `Le nom de la serre a été mis à jour avec succès`,
      });

      cancelEditing();
    } catch (error: any) {
      console.error("Error updating serre:", error);
      toast({
        title: "Erreur",
        description: error.message || "Échec de la mise à jour de la serre",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingSerre(false);
    }
  };

  const startRedrawingDomain = (domainId: string) => {
    setIsRedrawingDomain(true);
    setRedrawTargetId(domainId);
    setRedrawTargetType("domain");
    setIsCreatingDomain(false);
    setIsCreatingSerre(false);
    setIsCreatingGuide(false);
    setPendingShape(null);
    setNewDomainName("");
    setNewSerreName("");
  };

  const startRedrawingSerre = (serreId: string) => {
    setIsRedrawingSerre(true);
    setRedrawTargetId(serreId);
    setRedrawTargetType("serre");
    setIsCreatingDomain(false);
    setIsCreatingSerre(false);
    setIsCreatingGuide(false);
    setPendingShape(null);
    setNewDomainName("");
    setNewSerreName("");
  };

  const cancelRedrawing = () => {
    setIsRedrawingDomain(false);
    setIsRedrawingSerre(false);
    setRedrawTargetId(null);
    setRedrawTargetType(null);
    setPendingShape(null);
    // Reset to normal drawing mode
    setIsCreatingDomain(false);
    setIsCreatingSerre(false);
  };

  const handleRedrawComplete = async (shape: DrawnShape) => {
    if (!redrawTargetId || !redrawTargetType) return;

    try {
      setIsLoading(true);

      if (redrawTargetType === "domain") {
        const domain = companyData?.domains.find(d => d.id === redrawTargetId);
        if (!domain) throw new Error("Domaine introuvable");

        const updateData = {
          area: shape.area,
          center: {
            lat: shape.center.lat(),
            lng: shape.center.lng(),
          },
          path: shape.path.map(point => ({
            lat: point.lat(),
            lng: point.lng(),
            ordre: 0
          }))
        };

        await domainService.updateDomain(redrawTargetId, updateData);

        // Update local state
        setCompanyData(prev => prev ? {
          ...prev,
          domains: prev.domains.map(d => 
            d.id === redrawTargetId 
              ? { ...d, area: shape.area, center: { lat: shape.center.lat(), lng: shape.center.lng() }, path: shape.path.map(point => ({ lat: point.lat(), lng: point.lng(), ordre: 0 })) }
              : d
          )
        } : null);

        toast({
          title: "Domaine mis à jour",
          description: "La position et la forme du domaine ont été mises à jour",
        });

      } else if (redrawTargetType === "serre") {
        // Find the serre and its domain
        let domainId: string | null = null;
        const serre = companyData?.domains
          .find(d => {
            const foundSerre = d.serres.find(s => s.id === redrawTargetId);
            if (foundSerre) {
              domainId = d.id;
              return true;
            }
            return false;
          })?.serres.find(s => s.id === redrawTargetId);
        
        if (!serre || !domainId) throw new Error("Serre introuvable");

        const updateData = {
          surface: shape.area,
          center: {
            lat: shape.center.lat(),
            lng: shape.center.lng(),
          },
          position: shape.path.map(point => ({
            latitude: point.lat(),
            longitude: point.lng(),
            ordre: 0
          }))
        };

        await serreService.updateSerre(redrawTargetId, updateData, domainId);

        // Update local state
        setCompanyData(prev => prev ? {
          ...prev,
          domains: prev.domains.map(domain => ({
            ...domain,
            serres: domain.serres.map(s => 
              s.id === redrawTargetId 
                ? { ...s, surface: shape.area, center: { lat: shape.center.lat(), lng: shape.center.lng() }, position: shape.path } as any
                : s
            )
          }))
        } : null);

        toast({
          title: "Serre mise à jour",
          description: "La position et la forme de la serre ont été mises à jour",
        });
      }

      cancelRedrawing();
      setPendingShape(null);
      setNewDomainName("");
      setNewSerreName("");

    } catch (error: any) {
      console.error("Error updating position:", error);
      toast({
        title: "Erreur",
        description: error.message || "Échec de la mise à jour de la position",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // New state for guide operations
  const [isEditingGuide, setIsEditingGuide] = useState(false);
  const [editingGuideId, setEditingGuideId] = useState<string | null>(null);
  const [editingGuideData, setEditingGuideData] = useState<CreateGuideRequest>({
    nom: "",
    variete: "",
    rendement: 0,
    nombre_de_plants: 0,
    date_debut_saison: "",
    date_fin_saison: "",
    id_serre: ""
  });
  const [isCreatingGuideForExistingSerre, setIsCreatingGuideForExistingSerre] = useState(false);
  const [serreForNewGuide, setSerreForNewGuide] = useState<any>(null);
  const [isUpdatingGuide, setIsUpdatingGuide] = useState(false);
  const [isDeletingGuide, setIsDeletingGuide] = useState(false);
  const [deletingGuideId, setDeletingGuideId] = useState<string | null>(null);

  // New functions for guide operations
  const startEditingGuide = (serre: any) => {
    if (!serre.guideData) return;
    
    setEditingGuideId(serre.guideId);
    setEditingGuideData({
      nom: serre.guideData.nom || "",
      variete: serre.guideData.variete || "",
      rendement: serre.guideData.rendement || 0,
      nombre_de_plants: serre.guideData.nombre_de_plants || 0,
      date_debut_saison: serre.guideData.date_debut_saison || "",
      date_fin_saison: serre.guideData.date_fin_saison || "",
      id_serre: serre.id
    });
    setIsEditingGuide(true);
  };

  const startCreatingGuideForExistingSerre = (serre: any) => {
    setSerreForNewGuide(serre);
    setGuideFormData({
      nom: "",
      variete: "",
      rendement: 0,
      nombre_de_plants: 0,
      date_debut_saison: "",
      date_fin_saison: "",
      id_serre: serre.id
    });
    setIsCreatingGuideForExistingSerre(true);
  };

  const cancelGuideOperations = () => {
    setIsEditingGuide(false);
    setIsCreatingGuideForExistingSerre(false);
    setEditingGuideId(null);
    setEditingGuideData({
      nom: "",
      variete: "",
      rendement: 0,
      nombre_de_plants: 0,
      date_debut_saison: "",
      date_fin_saison: "",
      id_serre: ""
    });
    setSerreForNewGuide(null);
  };

  const handleUpdateGuide = async () => {
    if (!editingGuideId || !editingGuideData.nom.trim() || !editingGuideData.variete.trim() || !editingGuideData.date_debut_saison || !editingGuideData.date_fin_saison) {
      toast({
        title: "Données manquantes",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsUpdatingGuide(true);
      
      const updateData = {
        nom: editingGuideData.nom.trim(),
        variete: editingGuideData.variete.trim(),
        rendement: editingGuideData.rendement,
        nombre_de_plants: editingGuideData.nombre_de_plants,
        date_debut_saison: editingGuideData.date_debut_saison,
        date_fin_saison: editingGuideData.date_fin_saison
      };

      await guideService.updateGuide(editingGuideId, updateData);

      // Update local state
      setCompanyData(prev => prev ? {
        ...prev,
        domains: prev.domains.map(domain => ({
          ...domain,
          serres: domain.serres.map(serre => 
            serre.guideId === editingGuideId 
              ? { ...serre, guideData: { ...serre.guideData, ...updateData } }
              : serre
          )
        }))
      } : null);

      toast({
        title: "Guide mis à jour",
        description: "Le guide de culture a été mis à jour avec succès",
      });

      cancelGuideOperations();
    } catch (error: any) {
      console.error("Error updating guide:", error);
      toast({
        title: "Erreur",
        description: error.message || "Échec de la mise à jour du guide",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingGuide(false);
    }
  };

  const handleDeleteGuide = async (guideId: string, serreId: string) => {
    try {
      setIsDeletingGuide(true);
      setDeletingGuideId(guideId);
      
      await guideService.deleteGuide(guideId);

      // Update local state to remove guideId from serre
      setCompanyData(prev => prev ? {
        ...prev,
        domains: prev.domains.map(domain => ({
          ...domain,
          serres: domain.serres.map(serre => 
            serre.id === serreId 
              ? { ...serre, guideId: undefined, guideData: undefined }
              : serre
          )
        }))
      } : null);

      toast({
        title: "Guide supprimé",
        description: "Le guide de culture a été supprimé avec succès",
      });

      // Clear selection if the deleted guide was selected
      if (selectedSerreId === serreId) {
        setSelectedSerreId(null);
      }
    } catch (error: any) {
      console.error("Error deleting guide:", error);
      toast({
        title: "Erreur",
        description: error.message || "Échec de la suppression du guide",
        variant: "destructive",
      });
    } finally {
      setIsDeletingGuide(false);
      setDeletingGuideId(null);
    }
  };

  const handleCreateGuideForExistingSerre = async () => {
    if (!serreForNewGuide || !guideFormData.nom.trim() || !guideFormData.variete.trim() || !guideFormData.date_debut_saison || !guideFormData.date_fin_saison) {
      toast({
        title: "Données manquantes",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      
      const guideResponse = await guideService.createGuide(guideFormData);
      
      const guideId = (guideResponse as any).guideId || (guideResponse as any).id || (guideResponse as any).guide?.id || (guideResponse as any).data?.guideId || (guideResponse as any).data?.id;
      
      if (guideId) {
        // Update local state to add guideId to serre
        setCompanyData(prev => prev ? {
          ...prev,
          domains: prev.domains.map(domain => ({
            ...domain,
            serres: domain.serres.map(serre => 
              serre.id === serreForNewGuide.id 
                ? { ...serre, guideId: guideId }
                : serre
            )
          }))
        } : null);

        toast({
          title: "Guide créé",
          description: "Le guide de culture a été créé avec succès pour cette serre",
        });

        cancelGuideOperations();
        
        // Refresh guide data to show the newly created guide
        setTimeout(() => {
          refreshGuideData();
        }, 1000);
      } else {
        toast({
          title: "Erreur",
          description: "Le guide a été créé mais l'ID n'a pas pu être récupéré",
          variant: "destructive",
      });
      }
    } catch (error: any) {
      console.error("Error creating guide for existing serre:", error);
      toast({
        title: "Erreur",
        description: error.message || "Échec de la création du guide",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !companyData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DirectorHeader isSidebarOpen={isOpen} onMenuClick={() => setIsOpen(!isOpen)} />
        <div className="flex">
          <DirectorSidebar isOpen={isOpen} setIsOpen={setIsOpen} />
          <div className="flex-1 flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
              <p className="text-sm text-gray-600">Chargement de la carte...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DirectorHeader isSidebarOpen={isOpen} onMenuClick={() => setIsOpen(!isOpen)} />
      
      <div className="flex flex-col lg:flex-row h-[calc(100vh-80px)]">
        {/* Sidebar */}
        <DirectorSidebar isOpen={isOpen} setIsOpen={setIsOpen} />
        
        {/* Left Panel - Controls and Info */}
        <div 
          data-panel="left-controls"
          className="w-full lg:bg-white lg:border-r lg:border-gray-200 flex flex-col order-2 lg:order-1 hidden lg:flex relative"
          style={{ width: `${leftPanelWidth}px` }}
        >
          {/* Resize Handle */}
          <div 
            className="absolute right-0 top-0 bottom-0 w-1 bg-gray-300 hover:bg-gray-400 cursor-ew-resize z-10"
            onMouseDown={handleLeftPanelResizeStart}
            title="Redimensionner le panneau"
          />
          
          {/* Header */}
          <div className="p-2 lg:p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-2 lg:mb-4">
              <h1 className="text-base lg:text-2xl font-bold text-gray-900 truncate">
                <span className="hidden xl:inline">Configuration de la Carte</span>
                <span className="xl:hidden">Config</span>
              </h1>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowHelp(!showHelp)}
                className="p-1 lg:p-2 h-7 w-7 lg:h-8 lg:w-8 flex-shrink-0"
              >
                <Info className="h-3 w-3 lg:h-4 lg:w-4" />
              </Button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 lg:flex lg:space-x-2 mb-2 lg:mb-4">
              <Button
                onClick={startDrawingDomain}
                disabled={isCreatingDomain || isCreatingSerre || isCreatingGuide || isRedrawingDomain || isRedrawingSerre}
                className="w-full lg:flex-1 text-xs lg:text-sm h-8 lg:h-9"
                variant="default"
                size="sm"
              >
                <Building2 className="h-3 w-3 lg:h-4 lg:w-4 mr-1 lg:mr-2 flex-shrink-0" />
                <span className="hidden sm:inline">Nouveau Domaine</span>
                <span className="sm:hidden lg:hidden">Domaine</span>
                <span className="hidden xl:inline">Nouveau Domaine</span>
              </Button>
              <Button
                onClick={startDrawingSerre}
                disabled={isCreatingDomain || isCreatingSerre || isCreatingGuide || isRedrawingDomain || isRedrawingSerre || !selectedDomainId}
                className="w-full lg:flex-1 text-xs lg:text-sm h-8 lg:h-9"
                variant="outline"
                size="sm"
              >
                <Leaf className="h-3 w-3 lg:h-4 lg:w-4 mr-1 lg:mr-2 flex-shrink-0" />
                <span className="hidden sm:inline">Nouvelle Serre</span>
                <span className="sm:hidden lg:hidden">Serre</span>
                <span className="hidden xl:inline">Nouvelle Serre</span>
              </Button>
            </div>

            {/* Visibility Toggles */}
            <div className="grid grid-cols-1 gap-2 lg:flex lg:space-x-2">
              <Button
                variant={showSerres ? "default" : "outline"}
                size="sm"
                onClick={() => setShowSerres(!showSerres)}
                className="w-full lg:flex-1 text-xs lg:text-sm h-8 lg:h-9"
              >
                <div className="flex items-center space-x-1 lg:space-x-2">
                  {showSerres ? (
                    <Eye className="h-3 w-3 lg:h-4 lg:w-4 flex-shrink-0" />
                  ) : (
                    <EyeOff className="h-3 w-3 lg:h-4 lg:w-4 flex-shrink-0" />
                  )}
                  <span className="hidden sm:inline">Serres</span>
                  <span className="sm:hidden lg:hidden">Serres</span>
                  <span className="hidden xl:inline">Serres</span>
                </div>
              </Button>
            </div>
          </div>

          {/* Help Section */}
          {showHelp && (
            <div className="p-2 lg:p-4 bg-blue-50 border-b border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm lg:text-base font-medium text-blue-900">Aide</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowHelp(false)}
                  className="h-6 w-6 lg:h-8 lg:w-8 p-0 flex-shrink-0"
                >
                  <X className="h-3 w-3 lg:h-4 lg:w-4" />
                </Button>
              </div>
              <p className="text-xs lg:text-sm text-blue-700 leading-relaxed">
                <strong>Domaines:</strong> Cliquez sur "Nouveau Domaine" pour dessiner un nouveau domaine sur la carte. Utilisez l'icône crayon pour modifier le nom et l'icône de rotation pour redessiner la position.<br/>
                <strong>Serres:</strong> Sélectionnez d'abord un domaine, puis cliquez sur "Nouvelle Serre" pour dessiner une serre à l'intérieur du domaine sélectionné. Utilisez l'icône crayon pour modifier le nom et l'icône de rotation pour redessiner la position.<br/>
                <strong>Guide de Culture:</strong> Lors de la création d'une serre, vous devez obligatoirement fournir les informations du guide de culture (nom, variété, rendement, etc.) avant que la serre soit créée.<br/>
                <strong>Navigation:</strong> Sélectionnez un domaine pour voir ses serres, puis sélectionnez une serre pour voir son guide de culture.<br/>
                <strong>Onglets:</strong> Utilisez les onglets pour naviguer entre Domaines, Serres et Guides de culture.<br/>
                <strong>Édition:</strong> Cliquez sur les icônes d'édition pour modifier les noms et redessiner les positions des domaines et serres existants.
              </p>
            </div>
          )}

          {/* Domain Creation Form */}
          {isCreatingDomain && (
            <div className="p-4 border-b border-gray-200 bg-green-50">
              <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                <Building2 className="h-4 w-4 mr-2 text-green-600" />
                Créer un nouveau domaine
              </h3>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="domainName">Nom du domaine</Label>
                  <Input
                    id="domainName"
                    value={newDomainName}
                    onChange={(e) => setNewDomainName(e.target.value)}
                    placeholder="Entrez le nom du domaine"
                  />
                </div>
                <div className="flex space-x-2">
                  <Button
                    onClick={handleSaveDomain}
                    disabled={!pendingShape || !newDomainName.trim()}
                    className="flex-1"
                  >
                    Sauvegarder
                  </Button>
                  <Button
                    variant="outline"
                    onClick={cancelDrawing}
                  >
                    Annuler
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Domain Redrawing Form */}
          {isRedrawingDomain && (
            <div className="p-4 border-b border-gray-200 bg-orange-50">
              <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                <RotateCcw className="h-4 w-4 mr-2 text-orange-600" />
                Redessiner le domaine
              </h3>
              <div className="space-y-3">
                <div className="text-sm text-gray-600 bg-white p-2 rounded border">
                  <strong>Instructions:</strong> Dessinez la nouvelle forme du domaine sur la carte. L'ancienne forme sera temporairement masquée pendant le redessinage.
                </div>
                <div className="flex space-x-2">
                  <Button
                    onClick={cancelRedrawing}
                    variant="outline"
                    className="flex-1"
                  >
                    Annuler
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Serre Creation Form with Guide Culture */}
          {isCreatingSerre && (
            <div className="p-4 border-b border-gray-200 bg-red-50">
              <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                <Leaf className="h-4 w-4 mr-2 text-red-600" />
                Créer une nouvelle serre avec guide de culture
              </h3>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="serreName">Nom de la serre</Label>
                  <Input
                    id="serreName"
                    value={newSerreName}
                    onChange={(e) => setNewSerreName(e.target.value)}
                    placeholder="Entrez le nom de la serre"
                  />
                </div>
                <div className="text-sm text-gray-600 bg-white p-2 rounded border">
                  <strong>Domaine sélectionné:</strong> {selectedDomain?.name}
                </div>
                
                {/* Guide Culture Fields */}
                <div className="border-t border-red-200 pt-3">
                  <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                    <BookOpen className="h-4 w-4 mr-2 text-blue-600" />
                    Guide de culture
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="guideNom">Nom du guide</Label>
                      <Input
                        id="guideNom"
                        value={guideFormData.nom}
                        onChange={(e) => setGuideFormData(prev => ({ ...prev, nom: e.target.value }))}
                        placeholder="Nom du guide de culture"
                      />
                    </div>
                    <div>
                      <Label htmlFor="guideVariete">Variété de culture</Label>
                      <Input
                        id="guideVariete"
                        value={guideFormData.variete}
                        onChange={(e) => setGuideFormData(prev => ({ ...prev, variete: e.target.value }))}
                        placeholder="Ex: Tomates, Salades, etc."
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div>
                      <Label htmlFor="guideRendement">Rendement (kg/m²)</Label>
                      <Input
                        id="guideRendement"
                        type="number"
                        step="0.1"
                        min="0"
                        value={guideFormData.rendement}
                        onChange={(e) => setGuideFormData(prev => ({ ...prev, rendement: parseFloat(e.target.value) || 0 }))}
                        placeholder="0.0"
                      />
                    </div>
                    <div>
                      <Label htmlFor="guidePlants">Nombre de plants</Label>
                      <Input
                        id="guidePlants"
                        type="number"
                        min="0"
                        value={guideFormData.nombre_de_plants}
                        onChange={(e) => setGuideFormData(prev => ({ ...prev, nombre_de_plants: parseInt(e.target.value) || 0 }))}
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div>
                      <Label htmlFor="guideDebut">Date début saison</Label>
                      <Input
                        id="guideDebut"
                        type="date"
                        value={guideFormData.date_debut_saison}
                        onChange={(e) => setGuideFormData(prev => ({ ...prev, date_debut_saison: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="guideFin">Date fin saison</Label>
                      <Input
                        id="guideFin"
                        type="date"
                        value={guideFormData.date_fin_saison}
                        onChange={(e) => setGuideFormData(prev => ({ ...prev, date_fin_saison: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button
                    onClick={handleSaveSerre}
                    disabled={!pendingShape || !newSerreName.trim() || !guideFormData.nom.trim() || !guideFormData.variete.trim() || !guideFormData.date_debut_saison || !guideFormData.date_fin_saison}
                    className="flex-1"
                  >
                    Créer Serre et Guide
                  </Button>
                  <Button
                    variant="outline"
                    onClick={cancelDrawing}
                  >
                    Annuler
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Serre Redrawing Form */}
          {isRedrawingSerre && (
            <div className="p-4 border-b border-gray-200 bg-orange-50">
              <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                <RotateCcw className="h-4 w-4 mr-2 text-orange-600" />
                Redessiner la serre
              </h3>
              <div className="space-y-3">
                <div className="text-sm text-gray-600 bg-white p-2 rounded border">
                  <strong>Instructions:</strong> Dessinez la nouvelle forme de la serre sur la carte. L'ancienne forme sera temporairement masquée pendant le redessinage.
                </div>
                <div className="flex space-x-2">
                  <Button
                    onClick={cancelRedrawing}
                    variant="outline"
                    className="flex-1"
                  >
                    Annuler
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Guide Editing Form */}
          {isEditingGuide && (
            <div className="p-4 border-b border-gray-200 bg-purple-50">
              <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                <Edit3 className="h-4 w-4 mr-2 text-purple-600" />
                Modifier le guide de culture
              </h3>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="editGuideNom">Nom du guide</Label>
                    <Input
                      id="editGuideNom"
                      value={editingGuideData.nom}
                      onChange={(e) => setEditingGuideData(prev => ({ ...prev, nom: e.target.value }))}
                      placeholder="Nom du guide de culture"
                    />
                  </div>
                  <div>
                    <Label htmlFor="editGuideVariete">Variété de culture</Label>
                    <Input
                      id="editGuideVariete"
                      value={editingGuideData.variete}
                      onChange={(e) => setEditingGuideData(prev => ({ ...prev, variete: e.target.value }))}
                      placeholder="Ex: Tomates, Salades, etc."
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="editGuideRendement">Rendement (kg/m²)</Label>
                    <Input
                      id="editGuideRendement"
                      type="number"
                      step="0.1"
                      min="0"
                      value={editingGuideData.rendement}
                      onChange={(e) => setEditingGuideData(prev => ({ ...prev, rendement: parseFloat(e.target.value) || 0 }))}
                      placeholder="0.0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="editGuidePlants">Nombre de plants</Label>
                    <Input
                      id="editGuidePlants"
                      type="number"
                      min="0"
                      value={editingGuideData.nombre_de_plants}
                      onChange={(e) => setEditingGuideData(prev => ({ ...prev, nombre_de_plants: parseInt(e.target.value) || 0 }))}
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="editGuideDebut">Date début saison</Label>
                    <Input
                      id="editGuideDebut"
                      type="date"
                      value={editingGuideData.date_debut_saison}
                      onChange={(e) => setEditingGuideData(prev => ({ ...prev, date_debut_saison: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="editGuideFin">Date fin saison</Label>
                    <Input
                      id="editGuideFin"
                      type="date"
                      value={editingGuideData.date_fin_saison}
                      onChange={(e) => setEditingGuideData(prev => ({ ...prev, date_fin_saison: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button
                    onClick={handleUpdateGuide}
                    disabled={isUpdatingGuide}
                    className="flex-1"
                  >
                    {isUpdatingGuide ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Mettre à jour
                  </Button>
                  <Button
                    variant="outline"
                    onClick={cancelGuideOperations}
                  >
                    Annuler
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Guide Creation Form for Existing Serre */}
          {isCreatingGuideForExistingSerre && serreForNewGuide && (
            <div className="p-4 border-b border-gray-200 bg-blue-50">
              <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                <Plus className="h-4 w-4 mr-2 text-blue-600" />
                Créer un guide de culture pour {serreForNewGuide.nom}
              </h3>
              <div className="space-y-3">
                <div className="text-sm text-gray-600 bg-white p-2 rounded border">
                  <strong>Serre:</strong> {serreForNewGuide.nom} • <strong>Domaine:</strong> {companyData?.domains.find(d => d.serres.some(s => s.id === serreForNewGuide.id))?.name}
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="newGuideNom">Nom du guide</Label>
                    <Input
                      id="newGuideNom"
                      value={guideFormData.nom}
                      onChange={(e) => setGuideFormData(prev => ({ ...prev, nom: e.target.value }))}
                      placeholder="Nom du guide de culture"
                    />
                  </div>
                  <div>
                    <Label htmlFor="newGuideVariete">Variété de culture</Label>
                    <Input
                      id="newGuideVariete"
                      value={guideFormData.variete}
                      onChange={(e) => setGuideFormData(prev => ({ ...prev, variete: e.target.value }))}
                      placeholder="Ex: Tomates, Salades, etc."
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="newGuideRendement">Rendement (kg/m²)</Label>
                    <Input
                      id="newGuideRendement"
                      type="number"
                      step="0.1"
                      min="0"
                      value={guideFormData.rendement}
                      onChange={(e) => setGuideFormData(prev => ({ ...prev, rendement: parseFloat(e.target.value) || 0 }))}
                      placeholder="0.0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="newGuidePlants">Nombre de plants</Label>
                    <Input
                      id="newGuidePlants"
                      type="number"
                      min="0"
                      value={guideFormData.nombre_de_plants}
                      onChange={(e) => setGuideFormData(prev => ({ ...prev, nombre_de_plants: parseInt(e.target.value) || 0 }))}
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="newGuideDebut">Date début saison</Label>
                    <Input
                      id="newGuideDebut"
                      type="date"
                      value={guideFormData.date_debut_saison}
                      onChange={(e) => setGuideFormData(prev => ({ ...prev, date_debut_saison: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="newGuideFin">Date fin saison</Label>
                    <Input
                      id="newGuideFin"
                      type="date"
                      value={guideFormData.date_fin_saison}
                      onChange={(e) => setGuideFormData(prev => ({ ...prev, date_fin_saison: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button
                    onClick={handleCreateGuideForExistingSerre}
                    disabled={!guideFormData.nom.trim() || !guideFormData.variete.trim() || !guideFormData.date_debut_saison || !guideFormData.date_fin_saison}
                    className="flex-1"
                  >
                    Créer le guide
                  </Button>
                  <Button
                    variant="outline"
                    onClick={cancelGuideOperations}
                  >
                    Annuler
                  </Button>
                </div>
              </div>
            </div>
          )}

                         {/* Success Banner for newly created guide */}
            {showGuideSuccess && (
              <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-green-700 font-medium">
                    ✅ Guide de culture créé avec succès !
                  </span>
                </div>
              </div>
            )}

            {/* Mobile Success Banner for newly created guide */}
            {showGuideSuccess && (
              <div className="lg:hidden mb-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-green-700 font-medium">
                    ✅ Guide de culture créé avec succès !
                  </span>
                </div>
              </div>
            )}

             {/* Tab Navigation */}
          <div className="grid grid-cols-3 border-b border-gray-200">
            <button
              onClick={() => {
                setActiveTab("domains");
                setShowGuideSuccess(false);
              }}
              className={`px-1 lg:px-4 py-2 text-xs lg:text-sm font-medium border-b-2 transition-colors ${
                activeTab === "domains"
                  ? "border-[#B4CC5F] text-[#B4CC5F]"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <Building2 className="h-3 w-3 lg:h-4 lg:w-4 inline mr-1 lg:mr-2" />
              <span className="hidden sm:inline">Domaines</span>
              <span className="sm:hidden lg:hidden">Dom</span>
              <span className="hidden xl:inline">Domaines ({companyData?.domains.length || 0})</span>
            </button>
            <button
              onClick={() => {
                setActiveTab("serres");
                setShowGuideSuccess(false);
              }}
              className={`px-1 lg:px-4 py-2 text-xs lg:text-sm font-medium border-b-2 transition-colors ${
                activeTab === "serres"
                  ? "border-[#FF6B6B] text-[#FF6B6B]"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <Leaf className="h-3 w-3 lg:h-4 lg:w-4 inline mr-1 lg:mr-2" />
              <span className="hidden sm:inline">Serres</span>
              <span className="sm:hidden lg:hidden">Ser</span>
              <span className="hidden xl:inline">Serres ({selectedDomainId ? selectedDomain?.serres.length || 0 : companyData?.domains.reduce((acc, d) => acc + d.serres.length, 0) || 0})</span>
            </button>

            <button
              onClick={() => {
                setActiveTab("guides");
                setShowGuideSuccess(false);
              }}
              className={`px-1 lg:px-4 py-2 text-xs lg:text-sm font-medium border-b-2 transition-colors ${
                activeTab === "guides"
                  ? "border-[#9C27B0] text-[#9C27B0]"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <BookOpen className="h-3 w-3 lg:h-4 lg:w-4 inline mr-1 lg:mr-2" />
              <span className="hidden sm:inline">Guides</span>
              <span className="sm:hidden lg:hidden">Gui</span>
              <span className="hidden xl:inline">Guides ({selectedSerreId ? 1 : companyData?.domains.reduce((acc, d) => acc + d.serres.filter(s => s.guideId).length, 0) || 0})</span>
            </button>
          </div>

          {/* Content based on active tab */}
          <div className="flex-1 overflow-y-auto max-h-[50vh] lg:max-h-none">
            {activeTab === "domains" ? (
              <div className="p-2 lg:p-4">
                {!companyData || companyData.domains.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-8">
                    Aucun domaine créé. Commencez par dessiner un nouveau domaine sur la carte.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {companyData.domains.map((domain) => (
                      <Card
                        key={domain.id}
                        className={`cursor-pointer transition-colors ${
                          selectedDomainId === domain.id
                            ? "ring-2 ring-[#B4CC5F] bg-green-50"
                            : "hover:bg-gray-50"
                        }`}
                        onClick={() => handleDomainSelect(domain.id)}
                      >
                        <CardContent className="p-3 lg:p-4">
                          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-2">
                                <Building2 className="h-4 w-4 text-[#B4CC5F] flex-shrink-0" />
                                {editingDomainId === domain.id ? (
                                  <div className="flex items-center space-x-2 min-w-0 flex-1">
                                    <Input
                                      value={editingDomainName}
                                      onChange={(e) => setEditingDomainName(e.target.value)}
                                      className="h-8 text-sm min-w-0 flex-1"
                                      autoFocus
                                    />
                                    <Button
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleUpdateDomain(domain.id);
                                      }}
                                      disabled={isUpdatingDomain}
                                      className="h-8 px-2 flex-shrink-0"
                                    >
                                      {isUpdatingDomain ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        cancelEditing();
                                      }}
                                      className="h-8 px-2 flex-shrink-0"
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </div>
                                ) : (
                                  <h4 className="font-medium text-gray-900 truncate">{domain.name}</h4>
                                )}
                              </div>
                              <div className="text-sm text-gray-600 space-y-1">
                                <div className="truncate">Surface: {(domain.area / 10000).toFixed(2)} hectares</div>
                                <div className="flex items-center space-x-2">
                                  <Leaf className="h-3 w-3 text-red-500 flex-shrink-0" />
                                  <span className="truncate">{domain.serres.length} serre{domain.serres.length > 1 ? 's' : ''}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-1 lg:gap-2 lg:flex-shrink-0">
                              {editingDomainId !== domain.id && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      startEditingDomain(domain.id, domain.name);
                                    }}
                                    className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 h-7 lg:h-8 w-7 lg:w-8 p-0 flex-shrink-0"
                                    title="Modifier le nom"
                                  >
                                    <Edit3 className="h-3 w-3 lg:h-4 lg:w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      startRedrawingDomain(domain.id);
                                    }}
                                    className="text-orange-500 hover:text-orange-700 hover:bg-orange-50 h-7 lg:h-8 w-7 lg:w-8 p-0 flex-shrink-0"
                                    title="Redessiner la position"
                                  >
                                    <RotateCcw className="h-3 w-3 lg:h-4 lg:w-4" />
                                  </Button>
                                </>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteDomain(domain.id);
                                }}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 h-7 lg:h-8 w-7 lg:w-8 p-0 flex-shrink-0"
                                title="Supprimer le domaine"
                              >
                                <Trash2 className="h-3 w-3 lg:h-4 lg:w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            ) : activeTab === "serres" ? (
              <div className="p-2 lg:p-4">
                {!companyData || companyData.domains.reduce((acc, d) => acc + d.serres.length, 0) === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-8">
                    Aucune serre créée. Sélectionnez un domaine et créez une nouvelle serre.
                  </p>
                ) : !selectedDomainId ? (
                  <div className="text-center py-8">
                    <div className="mb-4">
                      <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500 mb-2">Sélectionnez un domaine pour voir ses serres</p>
                      <p className="text-xs text-gray-400">Cliquez sur un domaine dans l'onglet "Domaines" pour filtrer les serres</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Show domain filter info */}
                    <div className="p-2 lg:p-3 bg-blue-50 border border-blue-200 rounded-lg mb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 min-w-0 flex-1">
                          <Building2 className="h-4 w-4 text-blue-600 flex-shrink-0" />
                          <span className="text-xs lg:text-sm font-medium text-blue-900 truncate">
                            Serres du domaine: {companyData.domains.find(d => d.id === selectedDomainId)?.name}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedDomainId(null)}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-100 h-6 w-6 lg:h-8 lg:w-8 p-0 flex-shrink-0 ml-2"
                        >
                          <X className="h-3 w-3 lg:h-4 lg:w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Show serres from selected domain only */}
                    {companyData.domains
                      .find(domain => domain.id === selectedDomainId)
                      ?.serres.map((serre) => (
                        <Card
                          key={serre.id}
                          className={`cursor-pointer transition-colors hover:bg-gray-50 ${
                            selectedSerreId === serre.id ? 'ring-2 ring-[#FF6B6B] bg-red-50' : ''
                          }`}
                          onClick={() => handleSerreSelect(serre.id)}
                        >
                          <CardContent className="p-3 lg:p-4">
                            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2 mb-2">
                                  <Leaf className="h-4 w-4 text-[#FF6B6B] flex-shrink-0" />
                                  {editingSerreId === serre.id ? (
                                    <div className="flex items-center space-x-2 min-w-0 flex-1">
                                      <Input
                                        value={editingSerreName}
                                        onChange={(e) => setEditingSerreName(e.target.value)}
                                        className="h-8 text-sm min-w-0 flex-1"
                                        autoFocus
                                      />
                                      <Button
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleUpdateSerre(serre.id);
                                        }}
                                        disabled={isUpdatingSerre}
                                        className="h-8 px-2 flex-shrink-0"
                                      >
                                        {isUpdatingSerre ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          cancelEditing();
                                        }}
                                        className="h-8 px-2 flex-shrink-0"
                                      >
                                        <X className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  ) : (
                                    <h4 className="font-medium text-gray-900 truncate">{serre.nom}</h4>
                                  )}
                                </div>
                                <div className="text-sm text-gray-600 space-y-1">
                                  <div className="truncate">
                                    Surface: {(serre.surface / 10000).toFixed(2)} hectares
                                    {serre.guideId && (
                                      <span className="ml-2 text-green-600 text-xs">• Guide configuré</span>
                                    )}
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Building2 className="h-3 w-3 text-green-500 flex-shrink-0" />
                                    <span className="text-xs text-gray-500 truncate">{companyData.domains.find(d => d.id === selectedDomainId)?.name}</span>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <BookOpen className="h-3 w-3 text-purple-500 flex-shrink-0" />
                                    <span className="text-xs text-gray-500 truncate">
                                      {serre.guideId ? 'Guide de culture configuré' : 'Aucun guide de culture'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex flex-wrap items-center gap-1 lg:gap-2 lg:flex-shrink-0">
                                {editingSerreId !== serre.id && (
                                  <>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        startEditingSerre(serre.id, serre.nom);
                                      }}
                                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 text-xs lg:text-sm px-2 lg:px-3 h-7 lg:h-8"
                                      title="Modifier le nom"
                                    >
                                      <Edit3 className="h-3 w-3 lg:h-4 lg:w-4 mr-1 flex-shrink-0" />
                                      <span className="hidden sm:inline">Modifier</span>
                                      <span className="sm:hidden lg:hidden">Mod</span>
                                      <span className="hidden xl:inline">Modifier</span>
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        startRedrawingSerre(serre.id);
                                      }}
                                      className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 text-xs lg:text-sm px-2 lg:px-3 h-7 lg:h-8"
                                      title="Redessiner la position"
                                    >
                                      <RotateCcw className="h-3 w-3 lg:h-4 lg:w-4 mr-1 flex-shrink-0" />
                                      <span className="hidden sm:inline">Redessiner</span>
                                      <span className="sm:hidden lg:hidden">Red</span>
                                      <span className="hidden xl:inline">Redessiner</span>
                                    </Button>
                                  </>
                                )}
                                {serre.guideId ? (
                                  <>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleSerreSelect(serre.id);
                                      }}
                                      className="text-green-600 hover:text-green-700 hover:bg-green-50 text-xs lg:text-sm px-2 lg:px-3 h-7 lg:h-8"
                                    >
                                      <BookOpen className="h-3 w-3 lg:h-4 lg:w-4 mr-1 flex-shrink-0" />
                                      <span className="hidden sm:inline">Voir Guide</span>
                                      <span className="sm:hidden lg:hidden">Guide</span>
                                      <span className="hidden xl:inline">Voir Guide</span>
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        startEditingGuide(serre);
                                      }}
                                      className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 text-xs lg:text-sm px-2 lg:px-3 h-7 lg:h-8"
                                      title="Modifier le guide de culture"
                                    >
                                      <Edit3 className="h-3 w-3 lg:h-4 lg:w-4 mr-1 flex-shrink-0" />
                                      <span className="hidden sm:inline">Modifier Guide</span>
                                      <span className="sm:hidden lg:hidden">Mod Guide</span>
                                      <span className="hidden xl:inline">Modifier Guide</span>
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (confirm(`Êtes-vous sûr de vouloir supprimer le guide de culture de la serre "${serre.nom}" ?`)) {
                                          handleDeleteGuide(serre.guideId, serre.id);
                                        }
                                      }}
                                      disabled={isDeletingGuide && deletingGuideId === serre.guideId}
                                      className="text-red-600 hover:text-red-700 hover:bg-red-50 text-xs lg:text-sm px-2 lg:px-3 h-7 lg:h-8"
                                      title="Supprimer le guide de culture"
                                    >
                                      {isDeletingGuide && deletingGuideId === serre.guideId ? (
                                        <Loader2 className="h-3 w-3 lg:h-4 lg:w-4 mr-1 animate-spin flex-shrink-0" />
                                      ) : (
                                        <Trash2 className="h-3 w-3 lg:h-4 lg:w-4 mr-1 flex-shrink-0" />
                                      )}
                                      <span className="hidden sm:inline">Supprimer Guide</span>
                                      <span className="sm:hidden lg:hidden">Supp Guide</span>
                                      <span className="hidden xl:inline">Supprimer Guide</span>
                                    </Button>
                                  </>
                                ) : (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      startCreatingGuideForExistingSerre(serre);
                                    }}
                                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 text-xs lg:text-sm px-2 lg:px-3 h-7 lg:h-8"
                                    title="Créer un guide de culture"
                                  >
                                    <Plus className="h-3 w-3 lg:h-4 lg:w-4 mr-1 flex-shrink-0" />
                                    <span className="hidden sm:inline">Créer Guide</span>
                                    <span className="sm:hidden lg:hidden">Créer</span>
                                    <span className="hidden xl:inline">Créer Guide</span>
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                )}
              </div>
            ) : activeTab === "guides" ? (
              <div className="p-2 lg:p-4">
                {/* Header with refresh button */}
                <div className="flex items-center justify-between mb-3 lg:mb-4">
                  <h3 className="text-base lg:text-lg font-medium text-gray-900">Guides de Culture</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={refreshGuideData}
                    disabled={isLoading}
                    className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 text-xs lg:text-sm h-7 lg:h-8"
                  >
                    <Loader2 className={`h-3 w-3 lg:h-4 lg:w-4 mr-1 lg:mr-2 flex-shrink-0 ${isLoading ? 'animate-spin' : ''}`} />
                    <span className="hidden sm:inline">Actualiser Guides</span>
                    <span className="sm:hidden lg:hidden">Actualiser</span>
                    <span className="hidden xl:inline">Actualiser Guides</span>
                  </Button>
                </div>
                
                {/* Success Banner for newly created guide */}
                {showGuideSuccess && (
                  <div className="mb-3 lg:mb-4 p-2 lg:p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse flex-shrink-0"></div>
                      <span className="text-xs lg:text-sm text-green-700 font-medium">
                        ✅ Guide de culture créé avec succès ! Il est maintenant visible dans la liste ci-dessous.
                      </span>
                    </div>
                  </div>
                )}
                
                {/* Show guide for selected serre if one is selected */}
                {selectedSerreId ? (
                  <div className="mb-3 lg:mb-4">
                    {(() => {
                      const selectedSerre = companyData?.domains
                        .flatMap(d => d.serres)
                        .find(s => s.id === selectedSerreId);
                      
                      if (!selectedSerre) {
                        return (
                          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-600">Serre sélectionnée introuvable</p>
                          </div>
                        );
                      }
                      
                      const domain = companyData?.domains.find(d => d.serres.some(s => s.id === selectedSerreId));
                      
                      return (
                        <div className="p-3 lg:p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-2 min-w-0 flex-1">
                              <Leaf className="h-4 w-4 text-blue-600 flex-shrink-0" />
                              <span className="text-sm font-medium text-blue-900 truncate">
                                Guide de culture pour: {selectedSerre.nom}
                              </span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedSerreId(null)}
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-100 h-6 w-6 lg:h-8 lg:w-8 p-0 flex-shrink-0 ml-2"
                            >
                              <X className="h-3 w-3 lg:h-4 lg:w-4" />
                            </Button>
                          </div>
                          <div className="text-xs text-blue-700 mb-2 truncate">
                            Domaine: {domain?.name} • Surface: {(selectedSerre.surface / 10000).toFixed(2)} hectares
                          </div>
                          
                          {selectedSerre.guideData ? (
                            <div className="bg-white p-2 lg:p-3 rounded border border-blue-200">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 lg:gap-3 text-sm">
                                <div className="truncate">
                                  <strong className="text-blue-700">Nom du guide:</strong>
                                  <span className="ml-2 text-gray-700 truncate">{selectedSerre.guideData.nom}</span>
                                </div>
                                <div className="truncate">
                                  <strong className="text-blue-700">Variété:</strong>
                                  <span className="ml-2 text-gray-700 truncate">{selectedSerre.guideData.variete}</span>
                                </div>
                                <div className="truncate">
                                  <strong className="text-blue-700">Rendement:</strong>
                                  <span className="ml-2 text-gray-700 truncate">{selectedSerre.guideData.rendement} kg/m²</span>
                                </div>
                                <div className="truncate">
                                  <strong className="text-blue-700">Nombre de plants:</strong>
                                  <span className="ml-2 text-gray-700 truncate">{selectedSerre.guideData.nombre_de_plants}</span>
                                </div>
                                <div className="truncate">
                                  <strong className="text-blue-700">Début saison:</strong>
                                  <span className="ml-2 text-gray-700 truncate">
                                    {selectedSerre.guideData.date_debut_saison ? new Date(selectedSerre.guideData.date_debut_saison).toLocaleDateString('fr-FR') : 'Non spécifiée'}
                                  </span>
                                </div>
                                <div className="truncate">
                                  <strong className="text-blue-700">Fin saison:</strong>
                                  <span className="ml-2 text-gray-700 truncate">
                                    {selectedSerre.guideData.date_fin_saison ? new Date(selectedSerre.guideData.date_fin_saison).toLocaleDateString('fr-FR') : 'Non spécifiée'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="bg-yellow-50 p-2 lg:p-3 rounded border border-yellow-200">
                              <p className="text-sm text-yellow-700">
                                ⚠️ Aucun guide de culture configuré pour cette serre
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="mb-4">
                      <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500 mb-2">Sélectionnez une serre pour voir son guide de culture</p>
                      <p className="text-xs text-gray-400">Cliquez sur une serre dans l'onglet "Serres" pour afficher son guide</p>
                    </div>
                  </div>
                )}
                
                {/* Show all guides if no specific serre is selected */}
                {!selectedSerreId && (
                  <>
                    {!companyData || companyData.domains.reduce((acc, d) => acc + d.serres.filter(s => s.guideId).length, 0) === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-8">
                        Aucun guide de culture configuré. Créez des serres et configurez leurs guides de culture.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {companyData.domains.map((domain) => 
                          (domain.serres as (any & { guideData?: any })[])
                            .filter(serre => serre.guideId)
                            .map((serre) => (
                              <Card
                                key={`guide-${serre.id}`}
                                className={`cursor-pointer transition-colors hover:bg-gray-50 ${
                                  serre.guideId === newlyCreatedSerreId ? 'ring-2 ring-purple-400 bg-purple-50' : ''
                                }`}
                                onClick={() => handleSerreSelect(serre.id)}
                              >
                                <CardContent className="p-3 lg:p-4">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center space-x-2 mb-2">
                                        <BookOpen className="h-4 w-4 text-[#9C27B0] flex-shrink-0" />
                                        <h4 className="font-medium text-gray-900 truncate">Guide de culture - {serre.nom}</h4>
                                      </div>
                                      <div className="text-sm text-gray-600 space-y-1">
                                        <div className="flex items-center space-x-2">
                                          <Leaf className="h-3 w-3 text-red-500 flex-shrink-0" />
                                          <span className="text-xs text-gray-500 truncate">{serre.nom}</span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                          <Building2 className="h-3 w-3 text-green-500 flex-shrink-0" />
                                          <span className="text-xs text-gray-500 truncate">{domain.name}</span>
                                        </div>
                                        
                                        {/* Display actual guide culture data */}
                                        {serre.guideData ? (
                                          <div className="space-y-2 mt-2 p-2 lg:p-3 bg-purple-50 rounded border border-purple-200">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 lg:gap-2 text-xs">
                                              <div className="truncate">
                                                <strong className="text-purple-700">Variété:</strong>
                                                <span className="ml-1 text-gray-600 truncate">{serre.guideData.variete || 'Non spécifiée'}</span>
                                              </div>
                                              <div className="truncate">
                                                <strong className="text-purple-700">Rendement:</strong>
                                                <span className="ml-1 text-gray-600 truncate">{serre.guideData.rendement || 0} kg/m²</span>
                                              </div>
                                              <div className="truncate">
                                                <strong className="text-purple-700">Plants:</strong>
                                                <span className="ml-1 text-gray-600 truncate">{serre.guideData.nombre_de_plants || 0}</span>
                                              </div>
                                              <div className="truncate">
                                                <strong className="text-purple-700">Début saison:</strong>
                                                <span className="ml-1 text-gray-600 truncate">
                                                  {serre.guideData.date_debut_saison ? new Date(serre.guideData.date_debut_saison).toLocaleDateString('fr-FR') : 'Non spécifiée'}
                                                </span>
                                              </div>
                                              <div className="truncate">
                                                <strong className="text-purple-700">Fin saison:</strong>
                                                <span className="ml-1 text-gray-600 truncate">
                                                  {serre.guideData.date_fin_saison ? new Date(serre.guideData.date_fin_saison).toLocaleDateString('fr-FR') : 'Non spécifiée'}
                                                </span>
                                              </div>
                                            </div>
                                          </div>
                                        ) : (
                                          <div className="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-200">
                                            <strong>⚠️ Guide introuvable</strong> - Les données du guide ne sont pas disponibles
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            ) : null}
          </div>
          
          {/* Domain Details Panel - Removed from desktop view */}
        </div>

        {/* Mobile Bottom Panel - Always visible on mobile */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40">
          {/* Resize Handle */}
          <div 
            className="h-2 bg-gradient-to-r from-gray-300 to-gray-400 cursor-ns-resize flex items-center justify-center"
            onMouseDown={handleMobileResizeStart}
            onTouchStart={handleMobileResizeStart}
          >
            <div className="w-8 h-1 bg-gray-500 rounded-full"></div>
          </div>
          
          {/* Panel Content */}
          <div 
            ref={mobilePanelRef}
            className="overflow-y-auto"
            style={{ height: `${mobilePanelHeight}px` }}
          >
            {/* Mobile Header - No big title */}
            <div className="p-3 border-b border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowHelp(!showHelp)}
                    className="p-2"
                  >
                    <Info className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-medium text-gray-700">Configuration</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setMobilePanelHeight(prev => prev === 300 ? 200 : 300)}
                    className="p-2"
                    title="Toggle panel size"
                  >
                    {mobilePanelHeight === 300 ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <Button
                  onClick={startDrawingDomain}
                  disabled={isCreatingDomain || isCreatingSerre || isCreatingGuide || isRedrawingDomain || isRedrawingSerre}
                  className="w-full"
                  variant="default"
                  size="sm"
                >
                  <Building2 className="h-4 w-4 mr-1" />
                  <span className="text-xs">Domaine</span>
                </Button>
                <Button
                  onClick={startDrawingSerre}
                  disabled={isCreatingDomain || isCreatingSerre || isCreatingGuide || isRedrawingDomain || isRedrawingSerre || !selectedDomainId}
                  className="w-full"
                  variant="outline"
                  size="sm"
                >
                  <Leaf className="h-4 w-4 mr-1" />
                  <span className="text-xs">Serre</span>
                </Button>
              </div>

              {/* Visibility Toggle */}
              <div className="flex space-x-2">
                <Button
                  variant={showSerres ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowSerres(!showSerres)}
                  className="flex-1"
                >
                  <div className="flex items-center space-x-1">
                    {showSerres ? (
                      <Eye className="h-4 w-4" />
                    ) : (
                      <EyeOff className="h-4 w-4" />
                    )}
                    <span className="text-xs">Serres</span>
                  </div>
                </Button>
              </div>
            </div>

            {/* Help Section */}
            {showHelp && (
              <div className="p-3 bg-blue-50 border-b border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-blue-900">Aide</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowHelp(false)}
                    className="p-1 h-6 w-6"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                <p className="text-xs text-blue-700">
                  <strong>Domaines:</strong> Dessinez un nouveau domaine sur la carte. Utilisez les icônes d'édition pour modifier les noms et redessiner les positions.<br/>
                  <strong>Serres:</strong> Sélectionnez un domaine, puis créez une serre. Utilisez les icônes d'édition pour modifier les noms et redessiner les positions.<br/>
                  <strong>Guide:</strong> Configurez le guide de culture avant la création de la serre.<br/>
                  <strong>Navigation:</strong> Sélectionnez un domaine pour voir ses serres, puis une serre pour voir son guide.<br/>
                  <strong>Édition:</strong> Cliquez sur les icônes d'édition pour modifier les noms et redessiner les positions.
                </p>
              </div>
            )}

            {/* Forms */}
            {isCreatingDomain && (
              <div className="p-3 border-b border-gray-200 bg-green-50">
                <h3 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                  <Building2 className="h-4 w-4 mr-2 text-green-600" />
                  Nouveau domaine
                </h3>
                <div className="space-y-2">
                  <Input
                    value={newDomainName}
                    onChange={(e) => setNewDomainName(e.target.value)}
                    placeholder="Nom du domaine"
                    className="text-sm"
                  />
                  <div className="flex space-x-2">
                    <Button
                      onClick={handleSaveDomain}
                      disabled={!pendingShape || !newDomainName.trim()}
                      className="flex-1 text-xs"
                      size="sm"
                    >
                      Sauvegarder
                    </Button>
                    <Button
                      variant="outline"
                      onClick={cancelDrawing}
                      className="text-xs"
                      size="sm"
                    >
                      Annuler
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {isCreatingSerre && (
              <div className="p-3 border-b border-gray-200 bg-red-50">
                <h3 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                  <Leaf className="h-4 w-4 mr-2 text-red-600" />
                  Nouvelle serre avec guide
                </h3>
                <div className="space-y-2">
                  <Input
                    value={newSerreName}
                    onChange={(e) => setNewSerreName(e.target.value)}
                    placeholder="Nom de la serre"
                    className="text-sm"
                  />
                  <div className="text-xs text-gray-600 bg-white p-2 rounded border">
                    <strong>Domaine:</strong> {selectedDomain?.name}
                  </div>
                  
                  {/* Guide Culture Fields */}
                  <div className="border-t border-red-200 pt-2">
                    <h4 className="text-xs font-medium text-gray-900 mb-2 flex items-center">
                      <BookOpen className="h-3 w-3 mr-1 text-blue-600" />
                      Guide de culture
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        value={guideFormData.nom}
                        onChange={(e) => setGuideFormData(prev => ({ ...prev, nom: e.target.value }))}
                        placeholder="Nom du guide"
                        className="text-xs"
                      />
                      <Input
                        value={guideFormData.variete}
                        onChange={(e) => setGuideFormData(prev => ({ ...prev, variete: e.target.value }))}
                        placeholder="Variété"
                        className="text-xs"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        value={guideFormData.rendement}
                        onChange={(e) => setGuideFormData(prev => ({ ...prev, rendement: parseFloat(e.target.value) || 0 }))}
                        placeholder="Rendement kg/m²"
                        className="text-xs"
                      />
                      <Input
                        type="number"
                        min="0"
                        value={guideFormData.nombre_de_plants}
                        onChange={(e) => setGuideFormData(prev => ({ ...prev, nombre_de_plants: parseInt(e.target.value) || 0 }))}
                        placeholder="Nombre plants"
                        className="text-xs"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <Input
                        type="date"
                        value={guideFormData.date_debut_saison}
                        onChange={(e) => setGuideFormData(prev => ({ ...prev, date_debut_saison: e.target.value }))}
                        placeholder="Début saison"
                        className="text-xs"
                      />
                      <Input
                        type="date"
                        value={guideFormData.date_fin_saison}
                        onChange={(e) => setGuideFormData(prev => ({ ...prev, date_fin_saison: e.target.value }))}
                        placeholder="Fin saison"
                        className="text-xs"
                      />
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button
                      onClick={handleSaveSerre}
                      disabled={!pendingShape || !newSerreName.trim() || !guideFormData.nom.trim() || !guideFormData.variete.trim() || !guideFormData.date_debut_saison || !guideFormData.date_fin_saison}
                      className="flex-1 text-xs"
                      size="sm"
                    >
                      Créer Serre et Guide
                    </Button>
                    <Button
                      variant="outline"
                      onClick={cancelDrawing}
                      className="text-xs"
                      size="sm"
                    >
                      Annuler
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Mobile Domain Redrawing Form */}
            {isRedrawingDomain && (
              <div className="p-3 border-b border-gray-200 bg-orange-50">
                <h3 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                  <RotateCcw className="h-4 w-4 mr-2 text-orange-600" />
                  Redessiner le domaine
                </h3>
                <div className="space-y-2">
                  <div className="text-xs text-gray-600 bg-white p-2 rounded border">
                    <strong>Instructions:</strong> Dessinez la nouvelle forme du domaine sur la carte. L'ancienne forme sera masquée.
                  </div>
                  <Button
                    onClick={cancelRedrawing}
                    variant="outline"
                    className="w-full text-xs"
                    size="sm"
                  >
                    Annuler
                  </Button>
                </div>
              </div>
            )}

            {/* Mobile Serre Redrawing Form */}
            {isRedrawingSerre && (
              <div className="p-3 border-b border-gray-200 bg-orange-50">
                <h3 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                  <RotateCcw className="h-4 w-4 mr-2 text-orange-600" />
                  Redessiner la serre
                </h3>
                <div className="space-y-2">
                  <div className="text-xs text-gray-600 bg-white p-2 rounded border">
                    <strong>Instructions:</strong> Dessinez la nouvelle forme de la serre sur la carte. L'ancienne forme sera masquée.
                  </div>
                  <Button
                    onClick={cancelRedrawing}
                    variant="outline"
                    className="w-full text-xs"
                    size="sm"
                  >
                    Annuler
                  </Button>
                </div>
              </div>
            )}

            {/* Mobile Guide Editing Form */}
            {isEditingGuide && (
              <div className="p-3 border-b border-gray-200 bg-purple-50">
                <h3 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                  <Edit3 className="h-4 w-4 mr-2 text-purple-600" />
                  Modifier le guide de culture
                </h3>
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      value={editingGuideData.nom}
                      onChange={(e) => setEditingGuideData(prev => ({ ...prev, nom: e.target.value }))}
                      placeholder="Nom du guide"
                      className="text-xs"
                    />
                    <Input
                      value={editingGuideData.variete}
                      onChange={(e) => setEditingGuideData(prev => ({ ...prev, variete: e.target.value }))}
                      placeholder="Variété"
                      className="text-xs"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      value={editingGuideData.rendement}
                      onChange={(e) => setEditingGuideData(prev => ({ ...prev, rendement: parseFloat(e.target.value) || 0 }))}
                      placeholder="Rendement kg/m²"
                      className="text-xs"
                    />
                    <Input
                      type="number"
                      min="0"
                      value={editingGuideData.nombre_de_plants}
                      onChange={(e) => setEditingGuideData(prev => ({ ...prev, nombre_de_plants: parseInt(e.target.value) || 0 }))}
                      placeholder="Nombre plants"
                      className="text-xs"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="date"
                      value={editingGuideData.date_debut_saison}
                      onChange={(e) => setEditingGuideData(prev => ({ ...prev, date_debut_saison: e.target.value }))}
                      placeholder="Début saison"
                      className="text-xs"
                    />
                    <Input
                      type="date"
                      value={editingGuideData.date_fin_saison}
                      onChange={(e) => setEditingGuideData(prev => ({ ...prev, date_fin_saison: e.target.value }))}
                      placeholder="Fin saison"
                      className="text-xs"
                    />
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      onClick={handleUpdateGuide}
                      disabled={isUpdatingGuide}
                      className="flex-1 text-xs"
                      size="sm"
                    >
                      {isUpdatingGuide ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                      Mettre à jour
                    </Button>
                    <Button
                      variant="outline"
                      onClick={cancelGuideOperations}
                      className="text-xs"
                      size="sm"
                    >
                      Annuler
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Mobile Guide Creation Form for Existing Serre */}
            {isCreatingGuideForExistingSerre && serreForNewGuide && (
              <div className="p-3 border-b border-gray-200 bg-blue-50">
                <h3 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                  <Plus className="h-4 w-4 mr-2 text-blue-600" />
                  Créer un guide de culture pour {serreForNewGuide.nom}
                </h3>
                <div className="space-y-2">
                  <div className="text-xs text-gray-600 bg-white p-2 rounded border">
                    <strong>Serre:</strong> {serreForNewGuide.nom} • <strong>Domaine:</strong> {companyData?.domains.find(d => d.serres.some(s => s.id === serreForNewGuide.id))?.name}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      value={guideFormData.nom}
                      onChange={(e) => setGuideFormData(prev => ({ ...prev, nom: e.target.value }))}
                      placeholder="Nom du guide"
                      className="text-xs"
                    />
                    <Input
                      value={guideFormData.variete}
                      onChange={(e) => setGuideFormData(prev => ({ ...prev, variete: e.target.value }))}
                      placeholder="Variété"
                      className="text-xs"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      value={guideFormData.rendement}
                      onChange={(e) => setGuideFormData(prev => ({ ...prev, rendement: parseFloat(e.target.value) || 0 }))}
                      placeholder="Rendement kg/m²"
                      className="text-xs"
                    />
                    <Input
                      type="number"
                      min="0"
                      value={guideFormData.nombre_de_plants}
                      onChange={(e) => setGuideFormData(prev => ({ ...prev, nombre_de_plants: parseInt(e.target.value) || 0 }))}
                      placeholder="Nombre plants"
                      className="text-xs"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="date"
                      value={guideFormData.date_debut_saison}
                      onChange={(e) => setGuideFormData(prev => ({ ...prev, date_debut_saison: e.target.value }))}
                      placeholder="Début saison"
                      className="text-xs"
                    />
                    <Input
                      type="date"
                      value={guideFormData.date_fin_saison}
                      onChange={(e) => setGuideFormData(prev => ({ ...prev, date_fin_saison: e.target.value }))}
                      placeholder="Fin saison"
                      className="text-xs"
                    />
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      onClick={handleCreateGuideForExistingSerre}
                      disabled={!guideFormData.nom.trim() || !guideFormData.variete.trim() || !guideFormData.date_debut_saison || !guideFormData.date_fin_saison}
                      className="flex-1 text-xs"
                      size="sm"
                    >
                      Créer le guide
                    </Button>
                    <Button
                      variant="outline"
                      onClick={cancelGuideOperations}
                      className="text-xs"
                      size="sm"
                    >
                      Annuler
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Success Banner for newly created guide */}
            {showGuideSuccess && (
              <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-green-700 font-medium">
                    ✅ Guide de culture créé avec succès !
                  </span>
                </div>
              </div>
            )}

            {/* Tab Navigation */}
            <div className="grid grid-cols-3 border-b border-gray-200">
              <button
                onClick={() => {
                  setActiveTab("domains");
                  setShowGuideSuccess(false);
                }}
                className={`px-2 py-2 text-xs font-medium border-b-2 transition-colors ${
                  activeTab === "domains"
                    ? "border-[#B4CC5F] text-[#B4CC5F]"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <Building2 className="h-3 w-3 inline mr-1" />
                <span className="hidden xs:inline">Dom</span>
              </button>
              <button
                onClick={() => {
                  setActiveTab("serres");
                  setShowGuideSuccess(false);
                }}
                className={`px-2 py-2 text-xs font-medium border-b-2 transition-colors ${
                  activeTab === "serres"
                    ? "border-[#FF6B6B] text-[#FF6B6B]"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <Leaf className="h-3 w-3 inline mr-1" />
                <span className="hidden xs:inline">Ser</span>
              </button>
              <button
                onClick={() => {
                  setActiveTab("guides");
                  setShowGuideSuccess(false);
                }}
                className={`px-2 py-2 text-xs font-medium border-b-2 transition-colors ${
                  activeTab === "guides"
                    ? "border-[#9C27B0] text-[#9C27B0]"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <BookOpen className="h-3 w-3 inline mr-1" />
                <span className="hidden xs:inline">Gui</span>
              </button>
            </div>

            {/* Content based on active tab */}
            <div className="flex-1 overflow-y-auto">
              {activeTab === "domains" ? (
                <div className="p-3">
                  {!companyData || companyData.domains.length === 0 ? (
                    <p className="text-xs text-gray-500 text-center py-4">
                      Aucun domaine créé. Dessinez un nouveau domaine sur la carte.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {companyData.domains.slice(0, 3).map((domain) => (
                        <div
                          key={domain.id}
                          className={`p-2 rounded border transition-colors ${
                            selectedDomainId === domain.id
                              ? "ring-2 ring-[#B4CC5F] bg-green-50"
                              : "hover:bg-gray-50"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div 
                              className="flex items-center space-x-2 cursor-pointer flex-1"
                              onClick={() => handleDomainSelect(domain.id)}
                            >
                              <Building2 className="h-3 w-3 text-[#B4CC5F]" />
                              {editingDomainId === domain.id ? (
                                <div className="flex items-center space-x-1">
                                  <Input
                                    value={editingDomainName}
                                    onChange={(e) => setEditingDomainName(e.target.value)}
                                    className="h-6 text-xs w-20"
                                    autoFocus
                                  />
                                  <Button
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleUpdateDomain(domain.id);
                                    }}
                                    disabled={isUpdatingDomain}
                                    className="h-6 px-1 text-xs"
                                  >
                                    {isUpdatingDomain ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      cancelEditing();
                                    }}
                                    className="h-6 px-1 text-xs"
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              ) : (
                                <span className="text-xs font-medium">{domain.name}</span>
                              )}
                            </div>
                            <div className="flex items-center space-x-1">
                              <div className="text-xs text-gray-500 mr-2">
                                {(domain.area / 10000).toFixed(1)} ha
                              </div>
                              {editingDomainId !== domain.id && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      startEditingDomain(domain.id, domain.name);
                                    }}
                                    className="h-6 w-6 p-0 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                                    title="Modifier le nom"
                                  >
                                    <Edit3 className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      startRedrawingDomain(domain.id);
                                    }}
                                    className="h-6 w-6 p-0 text-orange-500 hover:text-orange-700 hover:bg-orange-50"
                                    title="Redessiner la position"
                                  >
                                    <RotateCcw className="h-3 w-3" />
                                  </Button>
                                </>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteDomain(domain.id);
                                }}
                                className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                title="Supprimer le domaine"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                      {companyData.domains.length > 3 && (
                        <p className="text-xs text-gray-500 text-center py-2">
                          +{companyData.domains.length - 3} autres domaines
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ) : activeTab === "serres" ? (
                <div className="p-3">
                  {!companyData || companyData.domains.reduce((acc, d) => acc + d.serres.length, 0) === 0 ? (
                    <p className="text-xs text-gray-500 text-center py-4">
                      Aucune serre créée. Sélectionnez un domaine et créez une serre.
                    </p>
                  ) : !selectedDomainId ? (
                    <div className="text-center py-4">
                      <p className="text-xs text-gray-500">Sélectionnez un domaine pour voir ses serres</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {companyData.domains
                        .find(domain => domain.id === selectedDomainId)
                        ?.serres.slice(0, 3).map((serre) => (
                          <div
                            key={serre.id}
                            className={`p-2 rounded border transition-colors ${
                              selectedSerreId === serre.id ? 'ring-2 ring-[#FF6B6B] bg-red-50' : 'hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div 
                                className="flex items-center space-x-2 cursor-pointer flex-1"
                                onClick={() => handleSerreSelect(serre.id)}
                              >
                                <Leaf className="h-3 w-3 text-[#FF6B6B]" />
                                {editingSerreId === serre.id ? (
                                  <div className="flex items-center space-x-1">
                                    <Input
                                      value={editingSerreName}
                                      onChange={(e) => setEditingSerreName(e.target.value)}
                                      className="h-6 text-xs w-20"
                                      autoFocus
                                    />
                                    <Button
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleUpdateSerre(serre.id);
                                      }}
                                      disabled={isUpdatingSerre}
                                      className="h-6 px-1 text-xs"
                                    >
                                      {isUpdatingSerre ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        cancelEditing();
                                      }}
                                      className="h-6 px-1 text-xs"
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </div>
                                ) : (
                                  <span className="text-xs font-medium">{serre.nom}</span>
                                )}
                              </div>
                              <div className="flex items-center space-x-1">
                                <div className="text-xs text-gray-500 mr-2">
                                  {(serre.surface / 10000).toFixed(1)} ha
                                  {serre.guideId && (
                                    <span className="ml-1 text-green-600">• Guide</span>
                                  )}
                                </div>
                                {editingSerreId !== serre.id && (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        startEditingSerre(serre.id, serre.nom);
                                      }}
                                      className="h-6 w-6 p-0 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                                      title="Modifier le nom"
                                    >
                                      <Edit3 className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        startRedrawingSerre(serre.id);
                                      }}
                                      className="h-6 w-6 p-0 text-orange-500 hover:text-orange-700 hover:bg-orange-50"
                                      title="Redessiner la position"
                                    >
                                      <RotateCcw className="h-3 w-3" />
                                    </Button>
                                    {serre.guideId ? (
                                      <>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleSerreSelect(serre.id);
                                            setActiveTab("guides");
                                          }}
                                          className="h-6 w-6 p-0 text-green-500 hover:text-green-700 hover:bg-green-50"
                                          title="Voir le guide de culture"
                                        >
                                          <BookOpen className="h-3 w-3" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            startEditingGuide(serre);
                                          }}
                                          className="h-6 w-6 p-0 text-purple-500 hover:text-purple-700 hover:bg-purple-50"
                                          title="Modifier le guide de culture"
                                        >
                                          <Edit3 className="h-3 w-3" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            if (confirm(`Êtes-vous sûr de vouloir supprimer le guide de culture de la serre "${serre.nom}" ?`)) {
                                              handleDeleteGuide(serre.guideId, serre.id);
                                            }
                                          }}
                                          disabled={isDeletingGuide && deletingGuideId === serre.guideId}
                                          className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                          title="Supprimer le guide de culture"
                                        >
                                          {isDeletingGuide && deletingGuideId === serre.guideId ? (
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                          ) : (
                                            <Trash2 className="h-3 w-3" />
                                          )}
                                        </Button>
                                      </>
                                    ) : (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          startCreatingGuideForExistingSerre(serre);
                                        }}
                                        className="h-6 w-6 p-0 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                                        title="Créer un guide de culture"
                                      >
                                        <Plus className="h-3 w-3" />
                                      </Button>
                                    )}
                                  </>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteSerre(serre.id, selectedDomainId);
                                  }}
                                  className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                  title="Supprimer la serre"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              ) : activeTab === "guides" ? (
                <div className="p-3">
                  {/* Header with refresh button */}
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-gray-900">Guides de Culture</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={refreshGuideData}
                      disabled={isLoading}
                      className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 text-xs"
                    >
                      <Loader2 className={`h-3 w-3 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                      Actualiser
                    </Button>
                  </div>
                  
                  {/* Success Banner for newly created guide */}
                  {showGuideSuccess && (
                    <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-xs text-green-700 font-medium">
                          ✅ Guide de culture créé avec succès !
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {/* Show guide for selected serre if one is selected */}
                  {selectedSerreId ? (
                    <div className="mb-3">
                      {(() => {
                        const selectedSerre = companyData?.domains
                          .flatMap(d => d.serres)
                          .find(s => s.id === selectedSerreId);
                        
                        if (!selectedSerre) {
                          return (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                              <p className="text-xs text-red-600">Serre sélectionnée introuvable</p>
                            </div>
                          );
                        }
                        
                        const domain = companyData?.domains.find(d => d.serres.some(s => s.id === selectedSerreId));
                        
                        return (
                          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2 min-w-0 flex-1">
                                <Leaf className="h-3 w-3 text-blue-600 flex-shrink-0" />
                                <span className="text-xs font-medium text-blue-900 truncate">
                                  Guide pour: {selectedSerre.nom}
                                </span>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedSerreId(null)}
                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-100 h-5 w-5 p-0 flex-shrink-0 ml-2"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                            <div className="text-xs text-blue-700 mb-2 truncate">
                              Domaine: {domain?.name} • Surface: {(selectedSerre.surface / 10000).toFixed(2)} ha
                            </div>
                            
                            {selectedSerre.guideData ? (
                              <div className="bg-white p-2 rounded border border-blue-200">
                                <div className="grid grid-cols-1 gap-1 text-xs">
                                  <div className="truncate">
                                    <strong className="text-blue-700">Nom:</strong>
                                    <span className="ml-1 text-gray-700 truncate">{selectedSerre.guideData.nom}</span>
                                  </div>
                                  <div className="truncate">
                                    <strong className="text-blue-700">Variété:</strong>
                                    <span className="ml-1 text-gray-700 truncate">{selectedSerre.guideData.variete}</span>
                                  </div>
                                  <div className="truncate">
                                    <strong className="text-blue-700">Rendement:</strong>
                                    <span className="ml-1 text-gray-700 truncate">{selectedSerre.guideData.rendement} kg/m²</span>
                                  </div>
                                  <div className="truncate">
                                    <strong className="text-blue-700">Plants:</strong>
                                    <span className="ml-1 text-gray-700 truncate">{selectedSerre.guideData.nombre_de_plants}</span>
                                  </div>
                                  <div className="truncate">
                                    <strong className="text-blue-700">Début saison:</strong>
                                    <span className="ml-1 text-gray-700 truncate">
                                      {selectedSerre.guideData.date_debut_saison ? new Date(selectedSerre.guideData.date_debut_saison).toLocaleDateString('fr-FR') : 'Non spécifiée'}
                                    </span>
                                  </div>
                                  <div className="truncate">
                                    <strong className="text-blue-700">Fin saison:</strong>
                                    <span className="ml-1 text-gray-700 truncate">
                                      {selectedSerre.guideData.date_fin_saison ? new Date(selectedSerre.guideData.date_fin_saison).toLocaleDateString('fr-FR') : 'Non spécifiée'}
                                    </span>
                                  </div>
                                </div>
                                
                                {/* Guide Management Buttons for Mobile */}
                                <div className="flex flex-wrap gap-2 mt-3">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      startEditingGuide(selectedSerre);
                                    }}
                                    className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 text-xs flex-1"
                                    title="Modifier le guide de culture"
                                  >
                                    <Edit3 className="h-3 w-3 mr-1 flex-shrink-0" />
                                    Modifier
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (confirm(`Êtes-vous sûr de vouloir supprimer le guide de culture de la serre "${selectedSerre.nom}" ?`)) {
                                        handleDeleteGuide(selectedSerre.guideId, selectedSerre.id);
                                      }
                                    }}
                                    disabled={isDeletingGuide && deletingGuideId === selectedSerre.guideId}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50 text-xs flex-1"
                                    title="Supprimer le guide de culture"
                                  >
                                    {isDeletingGuide && deletingGuideId === selectedSerre.guideId ? (
                                      <Loader2 className="h-3 w-3 mr-1 animate-spin flex-shrink-0" />
                                    ) : (
                                      <Trash2 className="h-3 w-3 mr-1 flex-shrink-0" />
                                    )}
                                    Supprimer
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="bg-yellow-50 p-2 rounded border border-yellow-200">
                                <p className="text-xs text-yellow-700 mb-2">
                                  ⚠️ Aucun guide de culture configuré pour cette serre
                                </p>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    startCreatingGuideForExistingSerre(selectedSerre);
                                  }}
                                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 text-xs w-full"
                                  title="Créer un guide de culture"
                                >
                                  <Plus className="h-3 w-3 mr-1 flex-shrink-0" />
                                  Créer Guide
                                </Button>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <div className="mb-3">
                        <BookOpen className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-xs text-gray-500 mb-1">Sélectionnez une serre pour voir son guide de culture</p>
                        <p className="text-xs text-gray-400">Cliquez sur une serre dans l'onglet "Serres"</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Show all guides if no specific serre is selected */}
                  {!selectedSerreId && (
                    <>
                      {!companyData || companyData.domains.reduce((acc, d) => acc + d.serres.filter(s => s.guideId).length, 0) === 0 ? (
                        <p className="text-xs text-gray-500 text-center py-4">
                          Aucun guide de culture configuré. Créez des serres et configurez leurs guides.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {companyData.domains.map((domain) => 
                            (domain.serres as (any & { guideData?: any })[])
                              .filter(serre => serre.guideId)
                              .slice(0, 3)
                              .map((serre) => (
                                <div
                                  key={`guide-${serre.id}`}
                                  className={`p-2 rounded border transition-colors hover:bg-gray-50 cursor-pointer ${
                                    serre.guideId === newlyCreatedSerreId ? 'ring-2 ring-purple-400 bg-purple-50' : ''
                                  }`}
                                  onClick={() => handleSerreSelect(serre.id)}
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center space-x-2 mb-1">
                                        <BookOpen className="h-3 w-3 text-[#9C27B0] flex-shrink-0" />
                                        <h4 className="text-xs font-medium text-gray-900 truncate">Guide - {serre.nom}</h4>
                                      </div>
                                      <div className="text-xs text-gray-600 space-y-1">
                                        <div className="flex items-center space-x-2">
                                          <Leaf className="h-2 w-2 text-red-500 flex-shrink-0" />
                                          <span className="text-xs text-gray-500 truncate">{serre.nom}</span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                          <Building2 className="h-2 w-2 text-green-500 flex-shrink-0" />
                                          <span className="text-xs text-gray-500 truncate">{domain.name}</span>
                                        </div>
                                        
                                        {/* Display actual guide culture data */}
                                        {serre.guideData ? (
                                          <div className="space-y-1 mt-2 p-2 bg-purple-50 rounded border border-purple-200">
                                            <div className="grid grid-cols-1 gap-1 text-xs">
                                              <div className="truncate">
                                                <strong className="text-purple-700">Variété:</strong>
                                                <span className="ml-1 text-gray-600 truncate">{serre.guideData.variete || 'Non spécifiée'}</span>
                                              </div>
                                              <div className="truncate">
                                                <strong className="text-purple-700">Rendement:</strong>
                                                <span className="ml-1 text-gray-600 truncate">{serre.guideData.rendement || 0} kg/m²</span>
                                              </div>
                                              <div className="truncate">
                                                <strong className="text-purple-700">Plants:</strong>
                                                <span className="ml-1 text-gray-600 truncate">{serre.guideData.nombre_de_plants || 0}</span>
                                              </div>
                                              <div className="truncate">
                                                <strong className="text-purple-700">Début saison:</strong>
                                                <span className="ml-1 text-gray-600 truncate">
                                                  {serre.guideData.date_debut_saison ? new Date(serre.guideData.date_debut_saison).toLocaleDateString('fr-FR') : 'Non spécifiée'}
                                                </span>
                                              </div>
                                              <div className="truncate">
                                                <strong className="text-purple-700">Fin saison:</strong>
                                                <span className="ml-1 text-gray-600 truncate">
                                                  {serre.guideData.date_fin_saison ? new Date(serre.guideData.date_fin_saison).toLocaleDateString('fr-FR') : 'Non spécifiée'}
                                                </span>
                                              </div>
                                            </div>
                                          </div>
                                        ) : (
                                          <div className="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-200">
                                            <strong>⚠️ Guide introuvable</strong> - Données non disponibles
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))
                          )}
                          {companyData.domains.reduce((acc, d) => acc + d.serres.filter(s => s.guideId).length, 0) > 3 && (
                            <p className="text-xs text-gray-500 text-center py-2">
                              +{companyData.domains.reduce((acc, d) => acc + d.serres.filter(s => s.guideId).length, 0) - 3} autres guides
                            </p>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* Right Panel - Map */}
        <div className="flex-1 relative order-1 lg:order-2 h-full">

          
          {isLoaded ? (
            <MapComponent
              onShapeComplete={handleShapeComplete}
              existingShapes={allShapes}
              drawingMode={currentDrawingMode}
              selectedDomainId={selectedDomainId}
              className="w-full h-full"
              onShapeClick={(shape) => {
                console.log('Shape clicked:', shape);
                // You can add additional logic here if needed
              }}
              hideZoomControls
              hideInfoPanel
              focusPath={selectedDomain ? (selectedDomain.path?.map(p => ({ lat: p.lat, lng: p.lng })) || []) : null}
              focusCenter={selectedDomain?.center || null}
              focusZoom={16}
            />
          ) : loadError ? (
            <div className="w-full h-full flex items-center justify-center bg-red-50">
              <div className="text-center">
                <h3 className="text-lg font-medium text-red-900 mb-2">Erreur de chargement de Google Maps</h3>
                <p className="text-sm text-red-600 mb-4">Impossible de charger la carte</p>
                <p className="text-xs text-red-500">{loadError.message}</p>
              </div>
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Chargement de Google Maps</h3>
                <p className="text-sm text-gray-600 mb-4">Veuillez patienter pendant l'initialisation...</p>
                <div className="flex items-center justify-center space-x-2">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                  <span className="text-sm text-gray-500">Initialisation en cours</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


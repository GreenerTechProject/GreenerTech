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
import { MapPin, Plus, Trash2, Home, Loader2, Info, X, Building2, Leaf, BarChart3, Eye, EyeOff, BookOpen, GripVertical, Move, Maximize2, Minimize2 } from "lucide-react";
import { useLoadScript } from "@react-google-maps/api";
import MapComponent, { DrawnShape } from "@/components/MapComponent";
import { getGoogleMapsAPIKey } from "@/config/maps";
import { companyMapService, CompanyMapData, DomainWithSerresAndBilans } from "@/services/companyMapService";
import { domainService } from "@/services/domainService";
import { serreService } from "@/services/serreService";
import { guideService, CreateGuideRequest } from "@/services/guideService";

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
  const [activeTab, setActiveTab] = useState<"domains" | "serres" | "bilans" | "guides">("domains");
  const [showBilans, setShowBilans] = useState(true);
  const [showSerres, setShowSerres] = useState(true);
  
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
  const detailsRef = useRef<HTMLDivElement>(null);
  const dragHandleRef = useRef<HTMLDivElement>(null);
  const resizeHandleRef = useRef<HTMLDivElement>(null);

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
        
        // Alternative approach: fetch all guides and match by serre ID
        if (testGuides && testGuides.length > 0) {
          console.log("[DEBUG] Using alternative approach with all guides");
          console.log("[DEBUG] All guides:", testGuides);
          const allGuides = testGuides;
          
          const domainsWithGuides = data.domains.map((domain) => {
            const serresWithGuides = domain.serres.map((serre) => {
              if (serre.guideId) {
                console.log(`[DEBUG] Looking for guide with ID: ${serre.guideId} (type: ${typeof serre.guideId})`);
                console.log(`[DEBUG] Available guide IDs:`, allGuides.map(g => ({ id: g.id, type: typeof g.id, nom: g.nom })));
                
                // Try different matching strategies
                let guide = allGuides.find(g => String(g.id) === String(serre.guideId));
                if (!guide) {
                  guide = allGuides.find(g => g.id == serre.guideId); // Loose comparison
                }
                if (!guide) {
                  guide = allGuides.find(g => String(g.id) === serre.guideId);
                }
                if (!guide) {
                  guide = allGuides.find(g => g.id === String(serre.guideId));
                }
                
                console.log(`[DEBUG] Alternative: Found guide for serre ${serre.id}:`, guide);
                return {
                  ...serre,
                  guideData: guide || null
                };
              }
              return serre;
            });
            
            return {
              ...domain,
              serres: serresWithGuides
            };
          });
          
          const enrichedData = {
            ...data,
            domains: domainsWithGuides
          };
          
          console.log("[DEBUG] Alternative enriched data:", enrichedData);
          setCompanyData(enrichedData);
          return; // Exit early if alternative approach worked
        }
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
                  console.log(`[DEBUG] Fetching guide for serre ${serre.id} with guideId ${serre.guideId}`);
                  const guides = await guideService.getGuidesBySerre(parseInt(serre.id));
                  console.log(`[DEBUG] Received guides for serre ${serre.id}:`, guides);
                  const guide = guides.find(g => g.id === serre.guideId);
                  console.log(`[DEBUG] Found guide:`, guide);
                  return {
                    ...serre,
                    guideData: guide || null
                  };
                } catch (error) {
                  console.warn(`Failed to fetch guide for serre ${serre.id}:`, error);
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
                  console.log(`[DEBUG] Refreshing guide for serre ${serre.id} with guideId ${serre.guideId}`);
                  const guides = await guideService.getGuidesBySerre(parseInt(serre.id));
                  console.log(`[DEBUG] Refresh received guides for serre ${serre.id}:`, guides);
                  
                  // Try different matching strategies
                  let guide = guides.find(g => String(g.id) === String(serre.guideId));
                  if (!guide) {
                    guide = guides.find(g => g.id == serre.guideId); // Loose comparison
                  }
                  if (!guide) {
                    guide = guides.find(g => String(g.id) === serre.guideId);
                  }
                  if (!guide) {
                    guide = guides.find(g => g.id === String(serre.guideId));
                  }
                  
                  console.log(`[DEBUG] Refresh found guide:`, guide);
                  return {
                    ...serre,
                    guideData: guide || null
                  };
                } catch (error) {
                  console.warn(`Failed to fetch guide for serre ${serre.id}:`, error);
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

    try {
      setIsLoading(true);
      
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

      const response = await serreService.createSerre(serreRequest);
      
      if (response.id || response.serreId) {
        const newSerre: ExtendedSerre = {
          id: response.id?.toString() || response.serreId?.toString() || `serre-${Date.now()}`,
          nom: newSerreName.trim(),
          surface: pendingShape.area,
          domainId: selectedDomainId,
          position: pendingShape.path,
          center: pendingShape.center,
          bilans: [],
          guideId: "" // Add default guideId
        };

        // Add the new serre to the selected domain
        setCompanyData(prev => prev ? {
          ...prev,
          domains: prev.domains.map(domain => 
          domain.id === selectedDomainId 
            ? { ...domain, serres: [...domain.serres, newSerre as any] }
            : domain
          )
        } : null);

        setNewlyCreatedSerreId(response.id?.toString() || response.serreId?.toString() || "");
        setGuideFormData(prev => ({
          ...prev,
          nom: newSerreName.trim(),
          id_serre: response.id?.toString() || response.serreId?.toString() || ""
        }));
        
        toast({
          title: "Serre créée",
          description: `La serre "${newSerreName.trim()}" a été créée avec succès. Maintenant, créez le guide de culture.`,
        });
        
        // Transition to guide culture creation
        setIsCreatingSerre(false);
        setIsCreatingGuide(true);
      }
    } catch (error: any) {
      console.error("Error creating serre:", error);
      toast({
        title: "Erreur",
        description: error.message || "Échec de la création de la serre",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveGuide = async () => {
    if (!guideFormData.nom.trim() || !guideFormData.variete.trim() || !guideFormData.id_serre) return;

    try {
      setIsLoading(true);
      
      const response = await guideService.createGuide(guideFormData);
      
      if (response.guideId) {
        // Update the serre with the guide ID
        setCompanyData(prev => prev ? {
          ...prev,
          domains: prev.domains.map(domain => 
            domain.serres.some(serre => serre.id === guideFormData.id_serre)
              ? {
                  ...domain,
                  serres: domain.serres.map(serre => 
                    serre.id === guideFormData.id_serre
                      ? { 
                          ...serre, 
                          guideId: response.guideId,
                          guideData: {
                            id: response.guideId,
                            nom: guideFormData.nom,
                            variete: guideFormData.variete,
                            rendement: guideFormData.rendement,
                            nombre_de_plants: guideFormData.nombre_de_plants,
                            date_debut_saison: guideFormData.date_debut_saison,
                            date_fin_saison: guideFormData.date_fin_saison,
                            id_serre: guideFormData.id_serre
                          }
                        }
                      : serre
                  )
                }
              : domain
          )
        } : null);
        
        toast({
          title: "Guide de culture créé",
          description: `Le guide de culture pour "${guideFormData.nom}" a été créé avec succès. Transition vers l'onglet Guides.`,
        });
        
        // Reset form and close
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
        setIsCreatingGuide(false);
        
        // Transition to guides tab to show the newly created guide
        setActiveTab("guides");
        setShowGuideSuccess(true);
        
        // Auto-hide success message after 5 seconds
        setTimeout(() => setShowGuideSuccess(false), 5000);
        
        // Refresh guide data to show the newly created guide details
        setTimeout(() => {
          refreshGuideData();
        }, 1000);
      }
    } catch (error: any) {
      console.error("Error creating guide:", error);
      toast({
        title: "Erreur",
        description: error.message || "Échec de la création du guide de culture",
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
  };

  const startDrawingDomain = () => {
    setIsCreatingDomain(true);
    setIsCreatingSerre(false);
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
    setPendingShape(null);
    setNewSerreName("");
  };

  const cancelDrawing = () => {
    setIsCreatingDomain(false);
    setIsCreatingSerre(false);
    setIsCreatingGuide(false);
    setPendingShape(null);
    setNewDomainName("");
    setNewSerreName("");
    setGuideFormData({
      nom: "",
      variete: "",
      rendement: 0,
      nombre_de_plants: 0,
      date_debut_saison: "",
      date_fin_saison: "",
      id_serre: ""
    });
    setNewlyCreatedSerreId(null);
    setShowGuideSuccess(false);
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
    const shapes: DrawnShape[] = [];
    
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
        if (showSerres && (domain as any).serres && (domain as any).serres.length > 0) {
          (domain as any).serres.forEach((serre: any) => {
            if (!serre.position || serre.position.length === 0) return;
            const serrePath: google.maps.LatLng[] = serre.position.map((p: any) =>
              new google.maps.LatLng(p.lat ?? p.latitude, p.lng ?? p.longitude)
            );
            const serreCenter = serre.center
              ? new google.maps.LatLng(serre.center.lat, serre.center.lng)
              : serrePath[0];

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

    console.log('[DirectorMapConfig] Generated shapes:', shapes.length);
    return shapes;
  }, [companyData, isLoaded, showSerres, showBilans, pendingShape]);

  const selectedDomain = companyData?.domains.find(d => d.id === selectedDomainId);
  const currentDrawingMode = isCreatingDomain ? "domain" : isCreatingSerre ? "serre" : null;

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
      
      <div className="flex h-[calc(100vh-80px)]">
        {/* Sidebar */}
        <DirectorSidebar isOpen={isOpen} setIsOpen={setIsOpen} />
        
        {/* Left Panel - Controls and Info */}
        <div className="w-120 bg-white border-r border-gray-200 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-gray-900">Configuration de la Carte</h1>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowHelp(!showHelp)}
              >
                <Info className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex space-x-2 mb-4">
              <Button
                onClick={startDrawingDomain}
                disabled={isCreatingDomain || isCreatingSerre || isCreatingGuide}
                className="flex-1"
                variant="default"
              >
                <Building2 className="h-4 w-4 mr-2" />
                Nouveau Domaine
              </Button>
              <Button
                onClick={startDrawingSerre}
                disabled={isCreatingDomain || isCreatingSerre || isCreatingGuide || !selectedDomainId}
                className="flex-1"
                variant="outline"
              >
                <Leaf className="h-4 w-4 mr-2" />
                Nouvelle Serre
              </Button>
            </div>

            <div className="flex space-x-2 mb-4">
              <Button
                variant="outline"
                onClick={fetchCompanyData}
                disabled={isLoading}
                className="flex-1"
              >
                <Loader2 className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Actualiser
              </Button>
            </div>

            {/* Visibility Toggles */}
            <div className="flex space-x-2">
              <Button
                variant={showSerres ? "default" : "outline"}
                size="sm"
                onClick={() => setShowSerres(!showSerres)}
                className="flex-1"
              >
                <Leaf className="h-4 w-4 mr-2" />
                {showSerres ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                Serres
              </Button>
              <Button
                variant={showBilans ? "default" : "outline"}
                size="sm"
                onClick={() => setShowBilans(!showBilans)}
                className="flex-1"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                {showBilans ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                Billons
              </Button>
            </div>
          </div>

          {/* Help Section */}
          {showHelp && (
            <div className="p-4 bg-blue-50 border-b border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-blue-900">Aide</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowHelp(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-blue-700">
                <strong>Domaines:</strong> Cliquez sur "Nouveau Domaine" pour dessiner un nouveau domaine sur la carte.<br/>
                <strong>Serres:</strong> Sélectionnez d'abord un domaine, puis cliquez sur "Nouvelle Serre" pour dessiner une serre à l'intérieur du domaine sélectionné.<br/>
                <strong>Guide de Culture:</strong> Après avoir créé une serre, vous devrez créer un guide de culture avec les informations de plantation.<br/>
                <strong>Billons:</strong> Les billons de culture sont automatiquement affichés sur la carte pour chaque serre.<br/>
                <strong>Onglets:</strong> Utilisez les onglets pour naviguer entre Domaines, Serres, Billons et Guides de culture.
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

          {/* Serre Creation Form */}
          {isCreatingSerre && (
            <div className="p-4 border-b border-gray-200 bg-red-50">
              <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                <Leaf className="h-4 w-4 mr-2 text-red-600" />
                Créer une nouvelle serre
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
                <div className="flex space-x-2">
                  <Button
                    onClick={handleSaveSerre}
                    disabled={!pendingShape || !newSerreName.trim()}
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

          {/* Guide Culture Creation Form */}
          {isCreatingGuide && (
            <div className="p-4 border-b border-gray-200 bg-blue-50">
              <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                <BookOpen className="h-4 w-4 mr-2 text-blue-600" />
                Créer le guide de culture pour {guideFormData.nom}
              </h3>
              <div className="space-y-3">
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
                    <Label htmlFor="guideVariete">Variété</Label>
                    <Input
                      id="guideVariete"
                      value={guideFormData.variete}
                      onChange={(e) => setGuideFormData(prev => ({ ...prev, variete: e.target.value }))}
                      placeholder="Variété de culture"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
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

                <div className="grid grid-cols-2 gap-3">
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

                <div className="text-sm text-gray-600 bg-white p-2 rounded border">
                  <strong>Serre:</strong> {guideFormData.nom} | <strong>Domaine:</strong> {selectedDomain?.name}
                </div>

                <div className="flex space-x-2">
                  <Button
                    onClick={handleSaveGuide}
                    disabled={!guideFormData.nom.trim() || !guideFormData.variete.trim() || !guideFormData.date_debut_saison || !guideFormData.date_fin_saison}
                    className="flex-1"
                  >
                    Créer le guide
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      // Skip guide creation but keep the serre
                      setIsCreatingGuide(false);
                      setNewSerreName("");
                      setPendingShape(null);
                      setNewlyCreatedSerreId(null);
                      setGuideFormData({
                        nom: "",
                        variete: "",
                        rendement: 0,
                        nombre_de_plants: 0,
                        date_debut_saison: "",
                        date_fin_saison: "",
                        id_serre: ""
                      });
                      setShowGuideSuccess(false);
                      toast({
                        title: "Guide ignoré",
                        description: "La serre a été créée sans guide de culture. Vous pourrez l'ajouter plus tard.",
                      });
                    }}
                  >
                    Ignorer pour l'instant
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

          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => {
                setActiveTab("domains");
                setShowGuideSuccess(false);
              }}
              className={`flex-1 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "domains"
                  ? "border-[#B4CC5F] text-[#B4CC5F]"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <Building2 className="h-4 w-4 inline mr-2" />
              Domaines ({companyData?.domains.length || 0})
            </button>
            <button
              onClick={() => {
                setActiveTab("serres");
                setShowGuideSuccess(false);
              }}
              className={`flex-1 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "serres"
                  ? "border-[#FF6B6B] text-[#FF6B6B]"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <Leaf className="h-4 w-4 inline mr-2" />
              Serres ({companyData?.domains.reduce((acc, d) => acc + d.serres.length, 0) || 0})
            </button>
            <button
              onClick={() => {
                setActiveTab("bilans");
                setShowGuideSuccess(false);
              }}
              className={`flex-1 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "bilans"
                  ? "border-[#3498DB] text-[#3498DB]"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <BarChart3 className="h-4 w-4 inline mr-2" />
              Billon ({companyData?.domains.reduce((acc, d) => acc + d.serres.reduce((sacc, s) => sacc + s.bilans.length, 0), 0) || 0})
            </button>
            <button
              onClick={() => {
                setActiveTab("guides");
                setShowGuideSuccess(false);
              }}
              className={`flex-1 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "guides"
                  ? "border-[#9C27B0] text-[#9C27B0]"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <BookOpen className="h-4 w-4 inline mr-2" />
              Guides ({companyData?.domains.reduce((acc, d) => acc + d.serres.filter(s => s.guideId).length, 0) || 0})
            </button>
          </div>

          {/* Content based on active tab */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === "domains" ? (
              <div className="p-4">
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
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <Building2 className="h-4 w-4 text-[#B4CC5F]" />
                                <h4 className="font-medium text-gray-900">{domain.name}</h4>
                              </div>
                              <div className="text-sm text-gray-600 space-y-1">
                                <div>Surface: {(domain.area / 10000).toFixed(2)} hectares</div>
                                <div className="flex items-center space-x-2">
                                  <Leaf className="h-3 w-3 text-red-500" />
                                  <span>{domain.serres.length} serre{domain.serres.length > 1 ? 's' : ''}</span>
                                </div>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteDomain(domain.id);
                              }}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            ) : activeTab === "serres" ? (
              <div className="p-4">
                {!companyData || companyData.domains.reduce((acc, d) => acc + d.serres.length, 0) === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-8">
                    Aucune serre créée. Sélectionnez un domaine et créez une nouvelle serre.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {companyData.domains.map((domain) => 
                      domain.serres.map((serre) => (
                        <Card
                          key={serre.id}
                          className="cursor-pointer transition-colors hover:bg-gray-50"
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2">
                                  <Leaf className="h-4 w-4 text-[#FF6B6B]" />
                                  <h4 className="font-medium text-gray-900">{serre.nom}</h4>
                                </div>
                                <div className="text-sm text-gray-600 space-y-1">
                                  <div>Surface: {(serre.surface / 10000).toFixed(2)} hectares</div>
                                  <div className="flex items-center space-x-2">
                                    <Building2 className="h-3 w-3 text-green-500" />
                                    <span className="text-xs text-gray-500">{domain.name}</span>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <BarChart3 className="h-3 w-3 text-blue-500" />
                                    <span className="text-xs text-gray-500">{serre.bilans.length} billon{serre.bilans.length > 1 ? 's' : ''}</span>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <BookOpen className="h-3 w-3 text-purple-500" />
                                    <span className="text-xs text-gray-500">
                                      {serre.guideId ? 'Guide de culture configuré' : 'Aucun guide de culture'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                {!serre.guideId ? (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setGuideFormData({
                                        nom: serre.nom,
                                        variete: "",
                                        rendement: 0,
                                        nombre_de_plants: 0,
                                        date_debut_saison: "",
                                        date_fin_saison: "",
                                        id_serre: serre.id
                                      });
                                      setNewlyCreatedSerreId(serre.id);
                                      setIsCreatingGuide(true);
                                    }}
                                    className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                                  >
                                    <BookOpen className="h-4 w-4 mr-1" />
                                    Ajouter Guide
                                  </Button>
                                ) : (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      // TODO: Implement guide editing functionality
                                      toast({
                                        title: "Fonctionnalité à venir",
                                        description: "L'édition des guides de culture sera bientôt disponible.",
                                      });
                                    }}
                                    className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                  >
                                    <BookOpen className="h-4 w-4 mr-1" />
                                    Modifier Guide
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteSerre(serre.id, domain.id);
                                  }}
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                )}
              </div>
            ) : activeTab === "guides" ? (
              <div className="p-4">
                {/* Header with refresh button */}
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Guides de Culture</h3>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        try {
                          console.log("[DEBUG] Manual test of guide service...");
                          const guides = await guideService.getGuides();
                          console.log("[DEBUG] Manual test result:", guides);
                          toast({
                            title: "Test Guide Service",
                            description: `Found ${guides.length} guides. Check console for details.`,
                          });
                        } catch (error) {
                          console.error("[DEBUG] Manual test failed:", error);
                          toast({
                            title: "Test Failed",
                            description: "Guide service test failed. Check console for details.",
                            variant: "destructive",
                          });
                        }
                      }}
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    >
                      Test API
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        console.log("[DEBUG] Current company data state:", companyData);
                        console.log("[DEBUG] Current company data domains:", companyData?.domains);
                        if (companyData?.domains) {
                          companyData.domains.forEach((domain, domainIndex) => {
                            console.log(`[DEBUG] Domain ${domainIndex}:`, domain.name);
                            (domain.serres as (any & { guideData?: any })[]).forEach((serre, serreIndex) => {
                              console.log(`[DEBUG] Serre ${serreIndex}:`, {
                                id: serre.id,
                                nom: serre.nom,
                                guideId: serre.guideId,
                                hasGuideData: !!serre.guideData,
                                guideData: serre.guideData
                              });
                            });
                          });
                        }
                        toast({
                          title: "State Check",
                          description: "Company data state logged to console. Check console for details.",
                        });
                      }}
                      className="text-green-600 hover:text-green-700 hover:bg-green-50"
                    >
                      Check State
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={refreshGuideData}
                      disabled={isLoading}
                      className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                    >
                      <Loader2 className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                      Actualiser Guides
                    </Button>
                  </div>
                </div>
                
                {/* Success Banner for newly created guide */}
                {showGuideSuccess && (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm text-green-700 font-medium">
                        ✅ Guide de culture créé avec succès ! Il est maintenant visible dans la liste ci-dessous.
                      </span>
                    </div>
                  </div>
                )}
                
                {/* Debug Information */}
                <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Debug Info</h4>
                  <div className="text-xs text-gray-600 space-y-1">
                    <div>Total domains: {companyData?.domains.length || 0}</div>
                    <div>Total serres: {companyData?.domains.reduce((acc, d) => acc + d.serres.length, 0) || 0}</div>
                    <div>Serres with guides: {companyData?.domains.reduce((acc, d) => acc + d.serres.filter(s => s.guideId).length, 0) || 0}</div>
                    <div>Serres with guideData: {companyData?.domains.reduce((acc, d) => acc + (d.serres as (any & { guideData?: any })[]).filter(s => s.guideData).length, 0) || 0}</div>
                    {companyData?.domains.map((domain, domainIndex) => 
                      (domain.serres as (any & { guideData?: any })[]).filter(s => s.guideId).map((serre, serreIndex) => (
                        <div key={`debug-${domainIndex}-${serreIndex}`} className="ml-4 text-xs">
                          <div>Domain: {domain.name} - Serre: {serre.nom}</div>
                          <div>Serre ID: {serre.id}, Guide ID: {serre.guideId}</div>
                          <div>Has guideData: {serre.guideData ? 'Yes' : 'No'}</div>
                          {serre.guideData && (
                            <div className="ml-2">
                              <div>Guide Nom: {serre.guideData.nom}</div>
                              <div>Guide Variété: {serre.guideData.variete}</div>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
                
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
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2 mb-2">
                                    <BookOpen className="h-4 w-4 text-[#9C27B0]" />
                                    <h4 className="font-medium text-gray-900">Guide de culture - {serre.nom}</h4>
                                  </div>
                                  <div className="text-sm text-gray-600 space-y-1">
                                    <div className="flex items-center space-x-2">
                                      <Leaf className="h-3 w-3 text-red-500" />
                                      <span className="text-xs text-gray-500">{serre.nom}</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <Building2 className="h-3 w-3 text-green-500" />
                                      <span className="text-xs text-gray-500">{domain.name}</span>
                                    </div>
                                    
                                    {/* Display actual guide culture data */}
                                    {serre.guideData ? (
                                      <div className="space-y-2 mt-2 p-3 bg-purple-50 rounded border border-purple-200">
                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                          <div>
                                            <strong className="text-purple-700">Variété:</strong>
                                            <span className="ml-1 text-gray-600">{serre.guideData.variete || 'Non spécifiée'}</span>
                                          </div>
                                          <div>
                                            <strong className="text-purple-700">Rendement:</strong>
                                            <span className="ml-1 text-gray-600">{serre.guideData.rendement || 0} kg/m²</span>
                                          </div>
                                          <div>
                                            <strong className="text-purple-700">Plants:</strong>
                                            <span className="ml-1 text-gray-600">{serre.guideData.nombre_de_plants || 0}</span>
                                          </div>
                                          <div>
                                            <strong className="text-purple-700">Début saison:</strong>
                                            <span className="ml-1 text-gray-600">
                                              {serre.guideData.date_debut_saison ? new Date(serre.guideData.date_debut_saison).toLocaleDateString('fr-FR') : 'Non spécifiée'}
                                            </span>
                                          </div>
                                          <div>
                                            <strong className="text-purple-700">Fin saison:</strong>
                                            <span className="ml-1 text-gray-600">
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
              </div>
            ) : (
              <div className="p-4">
                {!companyData || companyData.domains.reduce((acc, d) => acc + d.serres.reduce((sacc, s) => sacc + s.bilans.length, 0), 0) === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-8">
                    Aucun billon disponible. Les billons apparaîtront automatiquement pour chaque serre.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {companyData.domains.map((domain) => 
                      domain.serres.map((serre) => 
                        serre.bilans.map((bilan) => (
                          <Card
                            key={`bilan-${bilan.id}`}
                            className="cursor-pointer transition-colors hover:bg-gray-50"
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2 mb-2">
                                    <BarChart3 className="h-4 w-4 text-[#3498DB]" />
                                    <h4 className="font-medium text-gray-900">{bilan.nom}</h4>
                                  </div>
                                  <div className="text-sm text-gray-600 space-y-1">
                                    <div>Surface: {((bilan.surface || 0) / 10000).toFixed(2)} hectares</div>
                                    <div className="flex items-center space-x-2">
                                      <Leaf className="h-3 w-3 text-red-500" />
                                      <span className="text-xs text-gray-500">{serre.nom}</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <Building2 className="h-3 w-3 text-green-500" />
                                      <span className="text-xs text-gray-500">{domain.name}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      )
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Selected Domain Details */}
          {selectedDomain && (
            <div 
              ref={detailsRef}
              className={`border-t border-gray-200 bg-gray-50 transition-all duration-300 ease-in-out ${
                isDetailsExpanded ? 'h-auto' : 'h-12 overflow-hidden'
              }`}
              style={{
                transform: `translate(${detailsPosition.x}px, ${detailsPosition.y}px)`,
                width: detailsDimensions.width,
                height: detailsDimensions.height === 'auto' ? 'auto' : detailsDimensions.height,
                cursor: isDragging ? 'grabbing' : 'default',
                position: 'relative',
                zIndex: 50,
                boxShadow: isDragging || isResizing 
                  ? '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' 
                  : '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
                transition: isDragging || isResizing ? 'none' : 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              {/* Drag Handle - Top Bar */}
              <div 
                ref={dragHandleRef}
                className={`h-8 bg-gradient-to-r from-gray-100 to-gray-200 border-b border-gray-300 cursor-grab active:cursor-grabbing select-none transition-all duration-200 ${
                  dragHandleHover ? 'from-gray-200 to-gray-300' : ''
                } ${isDragging ? 'from-blue-100 to-blue-200 border-blue-300' : ''}`}
                onMouseDown={handleDragStart}
                onMouseEnter={() => setDragHandleHover(true)}
                onMouseLeave={() => setDragHandleHover(false)}
                style={{
                  cursor: isDragging ? 'grabbing' : 'grab'
                }}
              >
                <div className="flex items-center justify-between h-full px-3">
                  <div className="flex items-center space-x-2">
                    <Move className={`h-4 w-4 transition-all duration-200 ${
                      isDragging ? 'text-blue-600 scale-110' : 'text-gray-500'
                    }`} />
                    <span className={`text-xs font-medium transition-all duration-200 ${
                      isDragging ? 'text-blue-700' : 'text-gray-600'
                    }`}>
                      {isDragging ? 'Déplacement en cours...' : 'Déplacer le panneau'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <span>{detailsDimensions.width}px</span>
                    <span>×</span>
                    <span>{detailsDimensions.height === 'auto' ? 'auto' : `${detailsDimensions.height}px`}</span>
                    {detailsPosition.x !== 0 || detailsPosition.y !== 0 ? (
                      <>
                        <span>•</span>
                        <span>{Math.round(detailsPosition.x)}, {Math.round(detailsPosition.y)}</span>
                      </>
                    ) : null}
                  </div>
                </div>
              </div>

              {/* Resize Handle - Bottom Right Corner */}
              <div 
                ref={resizeHandleRef}
                className={`absolute bottom-0 right-0 w-6 h-6 cursor-se-resize transition-all duration-200 ${
                  resizeHandleHover ? 'bg-blue-100' : 'bg-transparent'
                } ${isResizing ? 'bg-blue-200 scale-110' : ''}`}
                onMouseDown={handleResizeStart}
                onMouseEnter={() => setResizeHandleHover(true)}
                onMouseLeave={() => setResizeHandleHover(false)}
                style={{
                  cursor: isResizing ? 'se-resize' : 'se-resize'
                }}
              >
                <div className={`absolute bottom-1 right-1 w-4 h-4 border-r-2 border-b-2 transition-all duration-200 ${
                  isResizing ? 'border-blue-500 scale-110' : 'border-gray-400'
                } rounded-sm`}></div>
                {resizeHandleHover && !isResizing && (
                  <div className="absolute -top-8 -left-8 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-90 z-50">
                    Redimensionner
                  </div>
                )}
                {/* Additional visual indicator for better visibility */}
                <div className={`absolute inset-0 border-2 border-dashed transition-all duration-200 ${
                  resizeHandleHover ? 'border-blue-300 opacity-50' : 'border-transparent'
                }`}></div>
              </div>

              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Building2 className="h-4 w-4 text-[#B4CC5F]" />
                    <div className="flex items-center space-x-1">
                      <span className="text-sm text-gray-600">Détails:</span>
                      <div className="relative group">
                        <h4 
                          className={`font-medium text-gray-900 transition-all duration-300 ease-in-out hover:text-[#B4CC5F] select-none ${
                            domainNameSize === 'small' ? 'text-sm' :
                            domainNameSize === 'medium' ? 'text-base' :
                            'text-xl'
                          }`}
                          onDoubleClick={() => {
                            setDomainNameSize(prev => 
                              prev === 'small' ? 'medium' : 
                              prev === 'medium' ? 'large' : 'small'
                            );
                          }}
                          title="Double-cliquez pour changer la taille"
                        >
                          {selectedDomain.name}
                        </h4>
                        <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#B4CC5F] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-[#B4CC5F] rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-75 group-hover:scale-100"></div>
                        <div className="absolute -bottom-6 left-0 right-0 text-xs text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-center">
                          {domainNameSize === 'small' ? 'Petit' : domainNameSize === 'medium' ? 'Moyen' : 'Grand'}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsDetailsExpanded(!isDetailsExpanded)}
                      className={`h-6 w-6 p-0 transition-all duration-200 ${
                        isDetailsExpanded 
                          ? 'hover:bg-green-100 text-green-600' 
                          : 'hover:bg-blue-100 text-blue-600'
                      }`}
                      title={isDetailsExpanded ? "Réduire" : "Agrandir"}
                    >
                      {isDetailsExpanded ? (
                        <span className="text-xs transform transition-transform duration-200 rotate-0">−</span>
                      ) : (
                        <span className="text-xs transform transition-transform duration-200 rotate-0">+</span>
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setDomainNameSize(prev => 
                          prev === 'small' ? 'medium' : 
                          prev === 'medium' ? 'large' : 'small'
                        );
                      }}
                      className={`h-6 w-6 p-0 transition-all duration-200 ${
                        domainNameSize === 'small' ? 'hover:bg-blue-100 text-blue-600' :
                        domainNameSize === 'medium' ? 'hover:bg-green-100 text-green-600' :
                        'hover:bg-purple-100 text-purple-600'
                      }`}
                      title={`Taille: ${domainNameSize === 'small' ? 'Petit' : domainNameSize === 'medium' ? 'Moyen' : 'Grand'}`}
                    >
                      <span className="text-xs font-bold">
                        {domainNameSize === 'small' ? 'S' : domainNameSize === 'medium' ? 'M' : 'L'}
                      </span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={resetDetailsPanel}
                      className="h-6 w-6 p-0 hover:bg-gray-200 text-xs transition-all duration-200"
                      title="Reset position et taille"
                    >
                      ↺
                    </Button>
                  </div>
                </div>
              
              {selectedDomain.serres.length > 0 ? (
                <div className="space-y-2">
                  <h5 className="text-sm font-medium text-gray-700 flex items-center">
                    <Leaf className="h-3 w-3 mr-1 text-[#FF6B6B]" />
                    Serres ({selectedDomain.serres.length}):
                  </h5>
                  {selectedDomain.serres.map((serre) => (
                    <div
                      key={serre.id}
                      className="flex items-center justify-between p-2 bg-white rounded border transition-all duration-200 hover:bg-gray-50 hover:shadow-sm"
                    >
                      <div className="flex items-center space-x-2">
                        <Leaf className="h-3 w-3 text-[#FF6B6B]" />
                        <span className="text-sm">{serre.nom}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs">
                          {(serre.surface / 10000).toFixed(2)} ha
                        </Badge>
                        <Badge variant="outline" className="text-xs text-blue-600">
                          {serre.bilans.length} billon{serre.bilans.length > 1 ? 's' : ''}
                        </Badge>
                        <Badge 
                          variant={serre.guideId ? "default" : "outline"} 
                          className={`text-xs ${serre.guideId ? 'bg-green-100 text-green-700 border-green-200' : 'text-gray-500'}`}
                        >
                          <BookOpen className="h-3 w-3 mr-1" />
                          {serre.guideId ? 'Guide' : 'Sans guide'}
                        </Badge>
                        {!serre.guideId ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setGuideFormData({
                                nom: serre.nom,
                                variete: "",
                                rendement: 0,
                                nombre_de_plants: 0,
                                date_debut_saison: "",
                                date_fin_saison: "",
                                id_serre: serre.id
                              });
                              setNewlyCreatedSerreId(serre.id);
                              setIsCreatingGuide(true);
                            }}
                            className="text-xs text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                          >
                            <BookOpen className="h-3 w-3 mr-1" />
                            Ajouter Guide
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              // TODO: Implement guide editing functionality
                              toast({
                                title: "Fonctionnalité à venir",
                                description: "L'édition des guides de culture sera bientôt disponible.",
                              });
                            }}
                            className="text-xs text-green-600 hover:text-green-700 hover:bg-green-50"
                          >
                            <BookOpen className="h-3 w-3 mr-1" />
                            Modifier Guide
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  Aucune serre dans ce domaine
                </p>
              )}
              </div>
            </div>
          )}
        </div>

        {/* Right Panel - Map */}
        <div className="flex-1 relative">
          
          {isLoaded ? (
            <>
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
        
        {companyData && (
              <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-40 text-sm">
                <div className="font-medium mb-3 text-gray-900">Légende de la Carte</div>
                <div className="space-y-1">
                  {companyData.domains.map((domain, index) => (
                    <div key={domain.id} className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded border border-gray-300" 
                        style={{ 
                          backgroundColor: [
                            "#4CAF50", "#8BC34A", "#CDDC39", "#FFEB3B", "#FFC107",
                            "#FF9800", "#FF5722", "#795548", "#9C27B0", "#673AB7",
                            "#3F51B5", "#2196F3", "#03A9F4", "#00BCD4", "#009688"
                          ][index % 15] 
                        }}
                      ></div>
                      <span className="text-xs text-gray-600">{domain.name}</span>
                    </div>
                  ))}
                  {/* Serres legend entry */}
                  <div className="pt-1 mt-1 border-gray-100" />
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded bg-[#FF5722] border border-gray-300"></div>
                    <span className="text-xs text-gray-600">Serres</span>
                  </div>
                </div>
              </div>
            )}
            </>
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

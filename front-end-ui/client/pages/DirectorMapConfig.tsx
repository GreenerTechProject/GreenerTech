import React, { useState, useEffect, useCallback, useMemo } from "react";
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
import { MapPin, Plus, Trash2, Home, Loader2, Info, X, Building2, Leaf, BarChart3, Eye, EyeOff, BookOpen } from "lucide-react";
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
}

interface DomainWithSerres extends DomainWithSerresAndBilans {
  serres: ExtendedSerre[];
}

const GOOGLE_MAPS_API_KEY = getGoogleMapsAPIKey();

export default function DirectorMapConfig() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { isOpen, setIsOpen, toggleSidebar } = useSidebar();
  const [companyData, setCompanyData] = useState<CompanyMapData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingDomain, setIsCreatingDomain] = useState(false);
  const [isCreatingSerre, setIsCreatingSerre] = useState(false);
  const [isCreatingGuide, setIsCreatingGuide] = useState(false);
  const [newDomainName, setNewDomainName] = useState("");
  const [newSerreName, setNewSerreName] = useState("");
  const [pendingShape, setPendingShape] = useState<DrawnShape | null>(null);
  const [selectedDomainId, setSelectedDomainId] = useState<string | null>(null);
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
      setCompanyData(data);
      
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
                      ? { ...serre, guideId: response.guideId }
                      : serre
                  )
                }
              : domain
          )
        } : null);
        
        toast({
          title: "Guide de culture créé",
          description: `Le guide de culture pour "${guideFormData.nom}" a été créé avec succès`,
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
              onClick={() => setActiveTab("domains")}
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
              onClick={() => setActiveTab("serres")}
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
              onClick={() => setActiveTab("bilans")}
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
              onClick={() => setActiveTab("guides")}
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
                {!companyData || companyData.domains.reduce((acc, d) => acc + d.serres.filter(s => s.guideId).length, 0) === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-8">
                    Aucun guide de culture configuré. Créez des serres et configurez leurs guides de culture.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {companyData.domains.map((domain) => 
                      domain.serres
                        .filter(serre => serre.guideId)
                        .map((serre) => (
                          <Card
                            key={`guide-${serre.id}`}
                            className="cursor-pointer transition-colors hover:bg-gray-50"
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
                                    <div className="text-xs text-purple-600 bg-purple-50 p-2 rounded">
                                      <strong>Guide ID:</strong> {serre.guideId}
                                    </div>
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
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                <Building2 className="h-4 w-4 mr-2 text-[#B4CC5F]" />
                Détails: {selectedDomain.name}
              </h4>
              
              {selectedDomain.serres.length > 0 ? (
                <div className="space-y-2">
                  <h5 className="text-sm font-medium text-gray-700 flex items-center">
                    <Leaf className="h-3 w-3 mr-1 text-[#FF6B6B]" />
                    Serres ({selectedDomain.serres.length}):
                  </h5>
                  {selectedDomain.serres.map((serre) => (
                    <div
                      key={serre.id}
                      className="flex items-center justify-between p-2 bg-white rounded border"
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

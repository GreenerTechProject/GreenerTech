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
import { MapPin, Plus, Trash2, Home, Loader2, Info, X, Building2, Leaf, BarChart3, Eye, EyeOff } from "lucide-react";
import { useLoadScript } from "@react-google-maps/api";
import MapComponent, { DrawnShape } from "@/components/MapComponent";
import { getGoogleMapsAPIKey } from "@/config/maps";
import { companyMapService, CompanyMapData, DomainWithSerresAndBilans } from "@/services/companyMapService";

interface ExtendedSerre {
  id: string;
  nom: string;
  surface: number;
  domainId: string;
  position: google.maps.LatLng[];
  center: google.maps.LatLng;
  bilans: any[];
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
  const [newDomainName, setNewDomainName] = useState("");
  const [newSerreName, setNewSerreName] = useState("");
  const [pendingShape, setPendingShape] = useState<DrawnShape | null>(null);
  const [selectedDomainId, setSelectedDomainId] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [activeTab, setActiveTab] = useState<"domains" | "serres" | "bilans">("domains");
  const [showBilans, setShowBilans] = useState(true);
  const [showSerres, setShowSerres] = useState(true);

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
      
      // Use the optimized service to fetch all data at once
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
    setPendingShape(shape);
    if (shape.type === "domain") {
      setIsCreatingDomain(false);
    } else if (shape.type === "serre") {
      setIsCreatingSerre(false);
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
          domains: [...prev.domains, newDomain]
        } : null);
        
        setNewDomainName("");
        setPendingShape(null);
        
        toast({
          title: "Domaine créé",
          description: `Le domaine "${newDomainName.trim()}" a été créé avec succès`,
        });
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

      const response = await companyMapService.createSerre(serreRequest);
      
      if (response.id || response.serreId) {
        const newSerre: ExtendedSerre = {
          id: response.id?.toString() || response.serreId?.toString() || `serre-${Date.now()}`,
          nom: newSerreName.trim(),
          surface: pendingShape.area,
          domainId: selectedDomainId,
          position: pendingShape.path,
          center: pendingShape.center,
          bilans: []
        };

        // Add the new serre to the selected domain
        setCompanyData(prev => prev ? {
          ...prev,
          domains: prev.domains.map(domain => 
          domain.id === selectedDomainId 
            ? { ...domain, serres: [...domain.serres, newSerre] }
            : domain
          )
        } : null);

        setNewSerreName("");
        setPendingShape(null);
        
        toast({
          title: "Serre créée",
          description: `La serre "${newSerreName.trim()}" a été créée avec succès`,
        });
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

  const handleDeleteDomain = async (domainId: string) => {
    // Note: This would require a delete endpoint in the backend
    // For now, we'll just remove it from the local state
    setCompanyData(prev => prev ? {
      ...prev,
      domains: prev.domains.filter(d => d.id !== domainId)
    } : null);
    
    if (selectedDomainId === domainId) {
      setSelectedDomainId(null);
    }
    toast({
      title: "Domaine supprimé",
      description: "Le domaine a été supprimé de la liste",
    });
  };

  const handleDeleteSerre = async (serreId: string, domainId: string) => {
    // Note: This would require a delete endpoint in the backend
    // For now, we'll just remove it from the local state
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
      description: "La serre a été supprimée de la liste",
    });
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
    const shapes: DrawnShape[] = [];
    
    // Generate domain shapes with actual polygon data
    if (companyData && companyData.domains) {
      companyData.domains.forEach((domain, domainIndex) => {
        if (domain.path && domain.path.length > 0) {
          try {
            // Create polygon path from domain coordinates
            const path = domain.path.map(point => 
              new google.maps.LatLng(point.lat, point.lng)
            );
            
            // Calculate center if not provided
            let center: google.maps.LatLng;
            if (domain.center && domain.center.lat && domain.center.lng) {
              center = new google.maps.LatLng(domain.center.lat, domain.center.lng);
            } else {
              // Calculate center from path points
              const bounds = new google.maps.LatLngBounds();
              path.forEach(point => bounds.extend(point));
              center = bounds.getCenter()!;
            }
            
            // Generate unique color for each domain
            const domainColors = [
              "#4CAF50", "#8BC34A", "#CDDC39", "#FFEB3B", "#FFC107",
              "#FF9800", "#FF5722", "#795548", "#9C27B0", "#673AB7",
              "#3F51B5", "#2196F3", "#03A9F4", "#00BCD4", "#009688"
            ];
            const color = domainColors[domainIndex % domainColors.length];
            
            shapes.push({
              id: domain.id,
              type: "domain",
              name: domain.name,
              path: path,
              area: domain.area || 10000,
              center: center,
              color: color,
              metadata: { domainName: domain.name }
            });
            
            // Generate serre shapes within the domain if showSerres is true
            if (showSerres && domain.serres) {
              domain.serres.forEach((serre, serreIndex) => {
                if (serre.position && serre.position.length > 0) {
                  try {
                    // Create polygon path from serre coordinates
                    const serrePath = serre.position.map(point => 
                      new google.maps.LatLng(point.lat(), point.lng())
                    );
                    
                    // Calculate serre center if not provided
                    let serreCenter: google.maps.LatLng;
                    if (serre.center && serre.center.lat && serre.center.lng) {
                      serreCenter = new google.maps.LatLng(serre.center.lat, serre.center.lng);
                    } else {
                      // Calculate center from path points
                      const serreBounds = new google.maps.LatLngBounds();
                      serrePath.forEach(point => serreBounds.extend(point));
                      serreCenter = serreBounds.getCenter();
                    }
                    
                    // Generate unique color for each serre (different from domain colors)
                    const serreColors = [
                      "#FF6B6B", "#FF8E8E", "#FFB3B3", "#FFD8D8", "#FF6B9A",
                      "#FF8EBC", "#FFB3D9", "#FFD8F0", "#9A6BFF", "#BC8EFF",
                      "#D9B3FF", "#F0D8FF", "#6B9AFF", "#8EBCFF", "#B3D9FF"
                    ];
                    const serreColor = serreColors[serreIndex % serreColors.length];
                    
                    shapes.push({
                      id: serre.id,
                      type: "serre",
                      name: serre.nom,
                      path: serrePath,
                      area: serre.surface || 1000,
                      center: serreCenter,
                      color: serreColor,
                      metadata: { 
                        serreName: serre.nom,
                        domainName: domain.name
                      }
                    });
                  } catch (error) {
                    console.warn('[DirectorMapConfig] Error creating serre shape:', error);
                  }
                }
              });
            }
            
          } catch (error) {
            console.warn('[DirectorMapConfig] Error creating domain shape:', error);
          }
        }
      });
    }
    
    console.log('[DirectorMapConfig] Generated shapes:', shapes.length);
    return shapes;
  }, [companyData, isLoaded, showSerres, showBilans]);

  const selectedDomain = companyData?.domains.find(d => d.id === selectedDomainId);
  const currentDrawingMode = isCreatingDomain ? "domain" : isCreatingSerre ? "serre" : null;

  if (isLoading && !companyData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DirectorHeader />
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
      <DirectorHeader />
      
      <div className="flex h-[calc(100vh-80px)]">
        {/* Sidebar */}
        <DirectorSidebar isOpen={isOpen} setIsOpen={setIsOpen} />
        
        {/* Left Panel - Controls and Info */}
        <div className="w-96 bg-white border-r border-gray-200 flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
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
                disabled={isCreatingDomain || isCreatingSerre}
                className="flex-1"
                variant="default"
              >
                <Building2 className="h-4 w-4 mr-2" />
                Nouveau Domaine
              </Button>
              <Button
                onClick={startDrawingSerre}
                disabled={isCreatingDomain || isCreatingSerre || !selectedDomainId}
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
                Bilans
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
                <strong>Bilans:</strong> Les bilans de culture sont automatiquement affichés sur la carte pour chaque serre.
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
              Bilans ({companyData?.domains.reduce((acc, d) => acc + d.serres.reduce((sacc, s) => sacc + s.bilans.length, 0), 0) || 0})
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
                                    <span className="text-xs text-gray-500">{serre.bilans.length} bilan{serre.bilans.length > 1 ? 's' : ''}</span>
                                  </div>
                                </div>
                              </div>
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
                    Aucun bilan disponible. Les bilans apparaîtront automatiquement pour chaque serre.
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
                          {serre.bilans.length} bilan{serre.bilans.length > 1 ? 's' : ''}
                        </Badge>
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
            />
        
            {companyData && (
              <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-40 text-sm">
                <div className="font-medium mb-3 text-gray-900">Légende de la Carte</div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 rounded border-2 border-gray-300" style={{ backgroundColor: '#4CAF50' }}></div>
                    <span className="text-gray-700">Domaines</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 rounded border-2 border-gray-300" style={{ backgroundColor: '#FF6B6B' }}></div>
                    <span className="text-gray-700">Serres</span>
                  </div>
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
                </div>
              </div>
            )}

            {/* Debug Info */}
            <div className="absolute bottom-20 left-4 bg-white rounded-lg shadow-lg border border-gray-200 p-3 z-40 text-xs">
              <div className="font-medium mb-1">Debug Info:</div>
              <div>Shapes: {allShapes.length}</div>
              <div>Domains: {companyData?.domains.length || 0}</div>
              <div>Serres: {companyData?.domains.reduce((acc, d) => acc + d.serres.length, 0) || 0}</div>
              <div>Bilans: {companyData?.domains.reduce((acc, d) => acc + d.serres.reduce((sacc, s) => sacc + s.bilans.length, 0), 0) || 0}</div>
            </div>
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

import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useSidebar } from "@/hooks/useSidebar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import DirectorSidebar from "../components/DirectorSidebar";
import MapComponent from "../components/MapComponent";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { domainService } from "../services/domainService";
import { serreService } from "../services/serreService";
import { guideService } from "../services/guideService";
import {
  Home,
  Map,
  ChevronDown,
  User,
  LogOut,
  Menu,
  Plus,
  Trash2,
  Edit,
  Save,
  X,
  Layers,
  MapPin,
  Settings,
  Globe
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Domain {
  id: string;
  name: string;
  area: number;
  center: google.maps.LatLng;
  path: google.maps.LatLng[];
  serres: Serre[];
}

interface Serre {
  id: string;
  nom: string;
  surface: number;
  domainId: string;
  guideId: string;
  position: google.maps.LatLng[];
  center: google.maps.LatLng;
  guide?: {
    id: string;
    nom: string;
    variete: string;
    rendement: number;
    date_debut_saison: Date | string;
    date_fin_saison: Date | string;
    irrigationType?: string;
    notes?: string;
  };
}

interface DrawnShape {
  id: string;
  type: "domain" | "serre";
  name: string;
  path: google.maps.LatLng[];
  area: number;
  center: google.maps.LatLng;
  color?: string;
  domainId?: string;
}

export default function DirectorMapConfig() {
  const { user, logout } = useAuth();
  const { isOpen, setIsOpen, toggleSidebar } = useSidebar();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [drawingMode, setDrawingMode] = useState<"domain" | "serre" | null>(null);
  const [selectedDomainId, setSelectedDomainId] = useState<string | undefined>();
  const [existingShapes, setExistingShapes] = useState<DrawnShape[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("map");
  const [newDomainName, setNewDomainName] = useState("");
  const [newSerreName, setNewSerreName] = useState("");
  const [newSerreSurface, setNewSerreSurface] = useState("");
  const [newGuideName, setNewGuideName] = useState("");
  const [newGuideVariete, setNewGuideVariete] = useState("");
  const [newGuideRendement, setNewGuideRendement] = useState("");
  const [newGuideDateDebut, setNewGuideDateDebut] = useState("");
  const [newGuideDateFin, setNewGuideDateFin] = useState("");
  const [newGuideIrrigationType, setNewGuideIrrigationType] = useState("");
  const [newGuideNotes, setNewGuideNotes] = useState("");

  useEffect(() => {
    if (user && user.role !== "directeur") {
      navigate("/dashboard");
      return;
    }
    loadExistingData();
  }, [user, navigate]);

  const loadExistingData = async () => {
    try {
      // Load existing domains and serres from backend
      // This would typically call your API endpoints
      // For now, we'll use placeholder data
      setExistingShapes([]);
    } catch (error) {
      console.error("Error loading existing data:", error);
    }
  };

  const handleShapeComplete = (shape: DrawnShape) => {
    if (shape.type === "domain") {
      setNewDomainName(shape.name);
      setActiveTab("domain-form");
    } else if (shape.type === "serre") {
      setNewSerreName(shape.name);
      setNewSerreSurface(shape.area.toString());
      setActiveTab("serre-form");
    }
    
    setExistingShapes(prev => [...prev, shape]);
    setDrawingMode(null);
  };

  const handleCreateDomain = async () => {
    if (!newDomainName.trim()) {
      toast({
        title: "Erreur",
        description: "Le nom du domaine est requis",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Find the drawn domain shape
      const domainShape = existingShapes.find(s => s.type === "domain" && s.name === newDomainName);
      if (!domainShape) {
        throw new Error("Forme du domaine non trouvée");
      }

      const domainRequest = {
        name: newDomainName,
        area: domainShape.area,
        center: {
          lat: domainShape.center.lat(),
          lng: domainShape.center.lng(),
        },
        path: domainShape.path.map((point) => ({
          lat: point.lat(),
          lng: point.lng(),
        })),
        companyId: user?.id_entreprise,
      };

      const response = await domainService.createDomains([domainRequest]);
      const domainId = response[0]?.domainId || response[0]?.id;
      
      if (domainId) {
        // Update the shape with the backend ID
        setExistingShapes(prev => prev.map(s => 
          s.id === domainShape.id ? { ...s, id: domainId.toString() } : s
        ));
        
        toast({
          title: "Succès",
          description: "Domaine créé avec succès",
        });
        
        setNewDomainName("");
        setActiveTab("map");
      }
    } catch (error) {
      console.error("Error creating domain:", error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la création du domaine",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateSerre = async () => {
    if (!newSerreName.trim() || !newSerreSurface.trim()) {
      toast({
        title: "Erreur",
        description: "Le nom et la surface de la serre sont requis",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Find the drawn serre shape
      const serreShape = existingShapes.find(s => s.type === "serre" && s.name === newSerreName);
      if (!serreShape) {
        throw new Error("Forme de la serre non trouvée");
      }

      // Find the selected domain
      const domainShape = existingShapes.find(s => s.id === selectedDomainId);
      if (!domainShape) {
        throw new Error("Domaine sélectionné non trouvé");
      }

      const serreRequest = {
        nom: newSerreName,
        id_domaine: parseInt(domainShape.id),
        position: serreShape.path.map((point, index) => ({
          latitude: point.lat(),
          longitude: point.lng(),
          ordre: index + 1,
        })),
        surface: parseFloat(newSerreSurface),
        center: {
          lat: serreShape.center.lat(),
          lng: serreShape.center.lng(),
        },
      };

      const createdSerre = await serreService.createSerre(serreRequest);
      const serreId = createdSerre.id || createdSerre.serreId;
      
      if (serreId) {
        // Update the shape with the backend ID
        setExistingShapes(prev => prev.map(s => 
          s.id === serreShape.id ? { ...s, id: serreId.toString() } : s
        ));
        
        // Create guide if provided
        if (newGuideName.trim() && newGuideVariete.trim()) {
          const guideRequest = {
            nom: newGuideName,
            variete: newGuideVariete,
            rendement: parseFloat(newGuideRendement) || 0,
            nombre_de_plants: 0, // Default value
            date_debut_saison: newGuideDateDebut || new Date().toISOString().split('T')[0],
            date_fin_saison: newGuideDateFin || new Date().toISOString().split('T')[0],
            id_serre: serreId.toString(),
          };

          await guideService.createGuide(guideRequest);
        }
        
        toast({
          title: "Succès",
          description: "Serre créée avec succès",
        });
        
        // Reset form
        setNewSerreName("");
        setNewSerreSurface("");
        setNewGuideName("");
        setNewGuideVariete("");
        setNewGuideRendement("");
        setNewGuideDateDebut("");
        setNewGuideDateFin("");
        setNewGuideIrrigationType("");
        setNewGuideNotes("");
        setActiveTab("map");
      }
    } catch (error) {
      console.error("Error creating serre:", error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la création de la serre",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProfile = () => {
    navigate("/directeur/profile");
  };

  const handleLogout = async () => {
    await logout();
  };

  const handleDeleteShape = (shapeId: string) => {
    setExistingShapes(prev => prev.filter(s => s.id !== shapeId));
  };

  const handleEditShape = (shape: DrawnShape) => {
    if (shape.type === "domain") {
      setNewDomainName(shape.name);
      setActiveTab("domain-form");
    } else if (shape.type === "serre") {
      setNewSerreName(shape.name);
      setNewSerreSurface(shape.area.toString());
      setActiveTab("serre-form");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <DirectorSidebar isOpen={isOpen} setIsOpen={setIsOpen} />
      
      <div className="flex-1 transition-all duration-300">
        {/* Header - Matching TechHeader style */}
        <header className="bg-white border-b sticky top-0 z-10">
          <div className="max-w-full px-3 sm:px-4 lg:px-6">
            <div className="grid grid-cols-3 items-center py-2 sm:py-3">
              {/* Left: Hamburger / Navigation */}
              <div className="justify-self-start">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleSidebar}
                  className="lg:hidden"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </div>

              {/* Center: Logo + Map icon */}
              <div className="justify-self-center flex items-center gap-2 sm:gap-3">
                <div 
                  className="h-8 w-8 sm:h-9 sm:w-9 lg:h-10 lg:w-10 rounded-xl bg-[#B4CC5F] flex items-center justify-center shadow-sm cursor-pointer hover:bg-[#9BB84F] transition-colors duration-200 active:scale-95"
                  onClick={() => navigate("/directeur")}
                  title="Retour au tableau de bord"
                >
                  <Home className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-white" />
                </div>
                <div className="h-8 w-8 sm:h-9 sm:w-9 lg:h-10 lg:w-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-sm">
                  <Map className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-white" />
                </div>
              </div>

              {/* Right: User dropdown */}
              <div className="justify-self-end flex items-center gap-2 sm:gap-3">
                <Badge variant="outline" className="hidden xs:inline bg-gray-50 border-gray-200 text-gray-700 text-xs">
                  Directeur
                </Badge>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="px-2 sm:px-3 h-8 sm:h-9 lg:h-10">
                      <div className="flex items-center gap-1 sm:gap-2">
                        <Avatar className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8">
                          <AvatarFallback className="bg-green-100 text-green-700 text-xs sm:text-sm">
                            {(user?.name || user?.email || "U")
                              .split(" ")
                              .map((p) => p[0])
                              .join("")
                              .slice(0, 2)
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="hidden sm:block text-left">
                          <div className="text-sm font-medium text-gray-900 leading-none">
                            {user?.name || "Utilisateur"}
                          </div>
                          <div className="text-xs text-gray-500 leading-none truncate max-w-[12rem]">
                            {user?.email}
                          </div>
                        </div>
                        <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-2 py-1.5">
                      <div className="text-sm font-medium text-gray-900">{user?.name || "Utilisateur"}</div>
                      <div className="text-xs text-gray-500">{user?.email}</div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleProfile} className="cursor-pointer">
                      <User className="h-4 w-4 mr-2" /> Profile
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 focus:text-red-600">
                      <LogOut className="h-4 w-4 mr-2" /> Déconnexion
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="p-4 sm:p-6 lg:p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Configuration de la Carte
            </h1>
            <p className="text-gray-600">
              Créez et gérez vos domaines et serres sur la carte interactive
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="map" className="flex items-center gap-2">
                <Map className="h-4 w-4" />
                Carte
              </TabsTrigger>
              <TabsTrigger value="domain-form" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Domaine
              </TabsTrigger>
              <TabsTrigger value="serre-form" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Serre
              </TabsTrigger>
              <TabsTrigger value="management" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Gestion
              </TabsTrigger>
            </TabsList>

            {/* Map Tab */}
            <TabsContent value="map" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Carte Interactive</span>
                    <div className="flex gap-2">
                      <Button
                        variant={drawingMode === "domain" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setDrawingMode("domain")}
                        className="flex items-center gap-2"
                      >
                        <Globe className="h-4 w-4" />
                        Dessiner Domaine
                      </Button>
                      <Button
                        variant={drawingMode === "serre" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setDrawingMode("serre")}
                        className="flex items-center gap-2"
                        disabled={!existingShapes.some(s => s.type === "domain")}
                      >
                        <MapPin className="h-4 w-4" />
                        Dessiner Serre
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDrawingMode(null)}
                        className="flex items-center gap-2"
                      >
                        <X className="h-4 w-4" />
                        Annuler
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[600px] w-full rounded-lg overflow-hidden border">
                    <MapComponent
                      onShapeComplete={handleShapeComplete}
                      existingShapes={existingShapes}
                      drawingMode={drawingMode}
                      selectedDomainId={selectedDomainId}
                      className="w-full h-full"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Domain Form Tab */}
            <TabsContent value="domain-form" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Créer un Domaine</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="domain-name">Nom du Domaine</Label>
                    <Input
                      id="domain-name"
                      value={newDomainName}
                      onChange={(e) => setNewDomainName(e.target.value)}
                      placeholder="Entrez le nom du domaine"
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <Button onClick={handleCreateDomain} disabled={isSubmitting}>
                      {isSubmitting ? "Création..." : "Créer le Domaine"}
                    </Button>
                    <Button variant="outline" onClick={() => setActiveTab("map")}>
                      Annuler
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Serre Form Tab */}
            <TabsContent value="serre-form" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Créer une Serre</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="serre-name">Nom de la Serre</Label>
                      <Input
                        id="serre-name"
                        value={newSerreName}
                        onChange={(e) => setNewSerreName(e.target.value)}
                        placeholder="Entrez le nom de la serre"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="serre-surface">Surface (m²)</Label>
                      <Input
                        id="serre-surface"
                        type="number"
                        value={newSerreSurface}
                        onChange={(e) => setNewSerreSurface(e.target.value)}
                        placeholder="Surface en m²"
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">Guide de Culture (Optionnel)</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="guide-name">Nom du Guide</Label>
                        <Input
                          id="guide-name"
                          value={newGuideName}
                          onChange={(e) => setNewGuideName(e.target.value)}
                          placeholder="Nom du guide de culture"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="guide-variete">Variété</Label>
                        <Input
                          id="guide-variete"
                          value={newGuideVariete}
                          onChange={(e) => setNewGuideVariete(e.target.value)}
                          placeholder="Variété de culture"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="guide-rendement">Rendement</Label>
                        <Input
                          id="guide-rendement"
                          type="number"
                          value={newGuideRendement}
                          onChange={(e) => setNewGuideRendement(e.target.value)}
                          placeholder="Rendement attendu"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="guide-date-debut">Date de Début</Label>
                        <Input
                          id="guide-date-debut"
                          type="date"
                          value={newGuideDateDebut}
                          onChange={(e) => setNewGuideDateDebut(e.target.value)}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="guide-date-fin">Date de Fin</Label>
                        <Input
                          id="guide-date-fin"
                          type="date"
                          value={newGuideDateFin}
                          onChange={(e) => setNewGuideDateFin(e.target.value)}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="guide-notes">Notes</Label>
                      <Input
                        id="guide-notes"
                        value={newGuideNotes}
                        onChange={(e) => setNewGuideNotes(e.target.value)}
                        placeholder="Notes additionnelles"
                      />
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button onClick={handleCreateSerre} disabled={isSubmitting}>
                      {isSubmitting ? "Création..." : "Créer la Serre"}
                    </Button>
                    <Button variant="outline" onClick={() => setActiveTab("map")}>
                      Annuler
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Management Tab */}
            <TabsContent value="management" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Gestion des Éléments</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Domaines</h4>
                      <div className="space-y-2">
                        {existingShapes
                          .filter(s => s.type === "domain")
                          .map((domain) => (
                            <div key={domain.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center gap-3">
                                <Globe className="h-5 w-5 text-blue-600" />
                                <div>
                                  <p className="font-medium">{domain.name}</p>
                                  <p className="text-sm text-gray-600">{domain.area.toFixed(2)} m²</p>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditShape(domain)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteShape(domain.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        {existingShapes.filter(s => s.type === "domain").length === 0 && (
                          <p className="text-gray-500 text-center py-4">Aucun domaine créé</p>
                        )}
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Serres</h4>
                      <div className="space-y-2">
                        {existingShapes
                          .filter(s => s.type === "serre")
                          .map((serre) => (
                            <div key={serre.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center gap-3">
                                <MapPin className="h-5 w-5 text-green-600" />
                                <div>
                                  <p className="font-medium">{serre.name}</p>
                                  <p className="text-sm text-gray-600">{serre.area.toFixed(2)} m²</p>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditShape(serre)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteShape(serre.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        {existingShapes.filter(s => s.type === "serre").length === 0 && (
                          <p className="text-gray-500 text-center py-4">Aucune serre créée</p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}

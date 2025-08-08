import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Plus, Trash2, ArrowLeft, BookOpen, Loader2 } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import GoogleMapsWrapper from "./GoogleMapsWrapper";
import MapComponent, { DrawnShape } from "./MapComponent";
import { getGoogleMapsAPIKey } from "@/config/maps";
import { ExtendedSerre, ExtendedGuideDeCulture } from "@shared/api";
import { guideService } from "@/services/guideService";
import { useToast } from "@/hooks/use-toast";
import {serreService} from "@/services/serreService"

interface Domain {
  id: string;
  name: string;
  area: number;
  center: google.maps.LatLng;
  path: google.maps.LatLng[];
  serres: ExtendedSerre[];
}

interface SerreCreationProps {
  domains: Domain[];
  onComplete: (domains: Domain[]) => void;
  onBack: () => void;
  selectedDomainId?: string;
}

const GOOGLE_MAPS_API_KEY = getGoogleMapsAPIKey();

const cropVarieties = [
  { value: "tomate", label: "Tomate" },
  { value: "concombre", label: "Concombre" },
  { value: "poivron", label: "Poivron" },
  { value: "aubergine", label: "Aubergine" },
  { value: "courgette", label: "Courgette" },
  { value: "laitue", label: "Laitue" },
  { value: "radis", label: "Radis" },
  { value: "epinard", label: "Épinard" },
  { value: "basilic", label: "Basilic" },
  { value: "persil", label: "Persil" },
  { value: "autre", label: "Autre" },
];

export default function SerreCreation({
  domains,
  onComplete,
  onBack,
  selectedDomainId,
}: SerreCreationProps) {
  const [currentDomains, setCurrentDomains] = useState<Domain[]>(domains);
  const [activeDomainId, setActiveDomainId] = useState<string>(
    selectedDomainId || domains[0]?.id || "",
  );
  const [isDrawing, setIsDrawing] = useState(false);
  const [pendingSerre, setPendingSerre] = useState<DrawnShape | null>(null);
  const [serreForm, setSerreForm] = useState({
    nom: "",
    selectedGuideId: "",
  });
  const [guideForm, setGuideForm] = useState({
    nom: "",
    variete: "",
    rendement: "",
    nombre_de_plants: "",
    date_debut_saison: undefined as Date | undefined,
    date_fin_saison: undefined as Date | undefined,
  });
  const [guides, setGuides] = useState<ExtendedGuideDeCulture[]>([]);
  const [showCreateGuide, setShowCreateGuide] = useState(false);
  const [isCreatingGuide, setIsCreatingGuide] = useState(false);
  const [isSavingSerre, setIsSavingSerre] = useState(false);
  const { toast } = useToast();

  const activeDomain = currentDomains.find((d) => d.id === activeDomainId);

  // Load existing guides on component mount
  useEffect(() => {
    const loadGuides = async () => {
      try {
        const existingGuides = await guideService.getGuides();
        // Convert backend guides to ExtendedGuideDeCulture format
        const convertedGuides: ExtendedGuideDeCulture[] = existingGuides.map(guide => ({
          id: guide.id,
          nom: guide.nom,
          variete: guide.variete,
          rendement: guide.rendement,
          nombre_de_plants: guide.nombre_de_plants,
          date_debut_saison: new Date(guide.date_debut_saison),
          date_fin_saison: new Date(guide.date_fin_saison),
          id_serre: guide.id_serre,
        }));
        setGuides(convertedGuides);
      } catch (error) {
        console.error("Error loading guides:", error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les guides de culture",
          variant: "destructive",
        });
      }
    };

    loadGuides();
  }, [toast]);

  const handleShapeComplete = (shape: DrawnShape) => {
    setPendingSerre(shape);
    setIsDrawing(false);
  };

  const handleCreateGuide = async () => {
    if (
      !guideForm.nom ||
      !guideForm.variete ||
      !guideForm.rendement ||
      !guideForm.nombre_de_plants ||
      !guideForm.date_debut_saison ||
      !guideForm.date_fin_saison
    ) {
      return;
    }y

    setIsCreatingGuide(true);

      const guideRequest = {
        nom: guideForm.nom,
        variete: guideForm.variete,
        rendement: parseFloat(guideForm.rendement),
        nombre_de_plants: parseInt(guideForm.nombre_de_plants),
        date_debut_saison: guideForm.date_debut_saison.toISOString(),
        date_fin_saison: guideForm.date_fin_saison.toISOString(),
      };

      // const response = await guideService.createGuide(guideRequest);

      // const newGuide: ExtendedGuideDeCulture = {
      //   id: response.guideId,
      //   nom: guideForm.nom,
      //   variete: guideForm.variete,
      //   rendement: parseFloat(guideForm.rendement),
      //   nombre_de_plants: parseInt(guideForm.nombre_de_plants),
      //   date_debut_saison: guideForm.date_debut_saison,
      //   date_fin_saison: guideForm.date_fin_saison,
      //   id_serre: "",
      
      // };

      setGuides((prev) => [...prev, newGuide]);
      setSerreForm((prev) => ({ ...prev, selectedGuideId: newGuide.id }));

      // Reset guide form
      setGuideForm({
        nom: "",
        variete: "",
        rendement: "",
        nombre_de_plants: "",
        date_debut_saison: undefined,
        date_fin_saison: undefined,
        notes: "",
      });
      setShowCreateGuide(false);

      toast({
        title: "Guide créé",
        description: `Le guide "${guideForm.nom}" a été créé avec succès`,
      });
   
  };


  const handleSaveSerre = async () => {
    if (
      !pendingSerre ||
      !serreForm.nom.trim() ||
      !serreForm.selectedGuideId ||
      !activeDomainId
    )
      return;

    const selectedGuide = guides.find(
      (g) => g.id === serreForm.selectedGuideId,
    );
    if (!selectedGuide) return;

    setIsSavingSerre(true);
    
      const newSerre: ExtendedSerre = {
        nom: serreForm.nom.trim(),
        surface: pendingSerre.area,
        domainId: activeDomainId,
        guideId: serreForm.selectedGuideId,
        position: pendingSerre.path,
        center: pendingSerre.center,
        guide: selectedGuide,
      };

      setCurrentDomains((prev) =>
        prev.map((domain) =>
          domain.id === activeDomainId
            ? { ...domain, serres: [...domain.serres, newSerre] }
            : domain,
        ),
      );

      // Reset form
      setSerreForm({
        nom: "",
        selectedGuideId: "",
      });
      setPendingSerre(null);

      toast({
        title: "Serre créée",
        description: `La serre "${serreForm.nom}" a été créée avec succès`,
      });
   
  };

  const handleDeleteSerre = (serreId: string) => {
    setCurrentDomains((prev) =>
      prev.map((domain) => ({
        ...domain,
        serres: domain.serres.filter((s) => s.id !== serreId),
      })),
    );
  };

  const startDrawing = () => {
    setIsDrawing(true);
    setPendingSerre(null);
  };

  const cancelDrawing = () => {
    setIsDrawing(false);
    setPendingSerre(null);
    setSerreForm({
      nom: "",
      selectedGuideId: "",
    });
  };

  const getAllShapes = (): DrawnShape[] => {
    const shapes: DrawnShape[] = [];

    // Add current active domain
    if (activeDomain) {
      shapes.push({
        id: activeDomain.id,
        type: "domain",
        name: activeDomain.name,
        path: activeDomain.path,
        area: activeDomain.area,
        center: activeDomain.center,
        color: "#B4CC5F",
      });

      // Add all serres in this domain
      activeDomain.serres.forEach((serre) => {
        shapes.push({
          id: serre.id,
          type: "serre",
          name: serre.nom,
          path: serre.position,
          area: serre.surface,
          center: serre.center,
          color: "#FF6B6B",
          domainId: activeDomain.id,
        });
      });
    }

    // Add pending serre
    if (pendingSerre) {
      shapes.push(pendingSerre);
    }

    return shapes;
  };

  const totalSerres = currentDomains.reduce(
    (total, domain) => total + domain.serres.length,
    0,
  );

  return (
    <div className="h-screen flex">
      {/* Left Panel */}
      <div className="w-1/3 bg-white border-r flex flex-col">
        <div className="p-6 border-b">
          <div className="flex items-center mb-4">
            <Button variant="ghost" size="sm" onClick={onBack} className="mr-2">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Créer vos serres
              </h2>
              <p className="text-gray-600 text-sm">
                Ajoutez des serres à vos domaines et configurez les guides de
                culture.
              </p>
            </div>
          </div>

          {/* Domain Selector */}
          <div className="space-y-2">
            <Label>Domaine actuel</Label>
            <Select value={activeDomainId} onValueChange={setActiveDomainId}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez un domaine" />
              </SelectTrigger>
              <SelectContent>
                {currentDomains.map((domain) => (
                  <SelectItem key={domain.id} value={domain.id}>
                    {domain.name} ({domain.serres.length} serre
                    {domain.serres.length > 1 ? "s" : ""})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* Culture Guide Management */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <BookOpen className="mr-2 h-5 w-5" />
                Guides de culture
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {guides.length > 0 ? (
                <div className="space-y-2">
                  {guides.map((guide) => (
                    <div key={guide.id} className="p-3 border rounded-lg">
                      <div className="font-medium">{guide.nom}</div>
                      <div className="text-sm text-gray-600">
                        Variété: {guide.variete}
                      </div>
                      <div className="text-sm text-gray-600">
                        Rendement: {guide.rendement} kg/m²
                      </div>
                      <div className="text-sm text-gray-600">
                        Plants: {guide.nombre_de_plants}
                      </div>
                      <div className="text-sm text-gray-600">
                        Saison:{" "}
                        {guide.date_debut_saison instanceof Date
                          ? format(guide.date_debut_saison, "dd/MM/yyyy", {
                              locale: fr,
                            })
                          : guide.date_debut_saison}{" "}
                        →{" "}
                        {guide.date_fin_saison instanceof Date
                          ? format(guide.date_fin_saison, "dd/MM/yyyy", {
                              locale: fr,
                            })
                          : guide.date_fin_saison}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  Aucun guide de culture créé
                </p>
              )}

              {!showCreateGuide ? (
                <Button
                  onClick={() => setShowCreateGuide(true)}
                  variant="outline"
                  className="w-full"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Créer un guide de culture
                </Button>
              ) : (
                <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
                  <h4 className="font-medium">Nouveau guide de culture</h4>

                  <div>
                    <Label htmlFor="guideName">Nom du guide *</Label>
                    <Input
                      id="guideName"
                      value={guideForm.nom}
                      onChange={(e) =>
                        setGuideForm((prev) => ({ ...prev, nom: e.target.value }))
                      }
                      placeholder="Ex: Guide Tomates Printemps 2024"
                    />
                  </div>

                  <div>
                    <Label htmlFor="guideVariety">Variété *</Label>
                    <Select
                      value={guideForm.variete}
                      onValueChange={(value) =>
                        setGuideForm((prev) => ({ ...prev, variete: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez une variété" />
                      </SelectTrigger>
                      <SelectContent>
                        {cropVarieties.map((variety) => (
                          <SelectItem key={variety.value} value={variety.value}>
                            {variety.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="guideYield">
                      Rendement prévu (kg/m²) *
                    </Label>
                    <Input
                      id="guideYield"
                      type="number"
                      step="0.1"
                      value={guideForm.rendement}
                      onChange={(e) =>
                        setGuideForm((prev) => ({
                          ...prev,
                          rendement: e.target.value,
                        }))
                      }
                      placeholder="Ex: 25.5"
                    />
                  </div>

                  <div>
                    <Label htmlFor="guidePlants">
                      Nombre de plants *
                    </Label>
                    <Input
                      id="guidePlants"
                      type="number"
                      value={guideForm.nombre_de_plants}
                      onChange={(e) =>
                        setGuideForm((prev) => ({
                          ...prev,
                          nombre_de_plants: e.target.value,
                        }))
                      }
                      placeholder="Ex: 100"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Date de début de saison *</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {guideForm.date_debut_saison ? (
                              format(guideForm.date_debut_saison, "dd/MM/yyyy", {
                                locale: fr,
                              })
                            ) : (
                              <span>Choisir</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={guideForm.date_debut_saison}
                            onSelect={(date) =>
                              setGuideForm((prev) => ({
                                ...prev,
                                date_debut_saison: date,
                              }))
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div>
                      <Label>Date de fin de saison *</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {guideForm.date_fin_saison ? (
                              format(guideForm.date_fin_saison, "dd/MM/yyyy", {
                                locale: fr,
                              })
                            ) : (
                              <span>Choisir</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={guideForm.harvestDate}
                            onSelect={(date) =>
                              setGuideForm((prev) => ({
                                ...prev,
                                date_fin_saison: date,
                              }))
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="guideNotes">Notes additionnelles</Label>
                    <Textarea
                      id="guideNotes"
                      value={guideForm.notes}
                      onChange={(e) =>
                        setGuideForm((prev) => ({
                          ...prev,
                          notes: e.target.value,
                        }))
                      }
                      placeholder="Informations supplémentaires..."
                      rows={3}
                    />
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      onClick={handleCreateGuide}
                      disabled={
                        isCreatingGuide ||
                        !guideForm.nom ||
                        !guideForm.variete ||
                        !guideForm.rendement ||
                        !guideForm.nombre_de_plants ||
                        !guideForm.date_debut_saison ||
                        !guideForm.date_fin_saison
                      }
                      className="flex-1"
                    >
                      {isCreatingGuide ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Création...
                        </>
                      ) : (
                        "Créer le guide"
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowCreateGuide(false)}
                    >
                      Annuler
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Drawing Controls */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Nouvelle serre</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isDrawing && !pendingSerre && (
                <Button
                  onClick={startDrawing}
                  className="w-full"
                  disabled={!activeDomainId}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Dessiner une serre
                </Button>
              )}

              {isDrawing && (
                <div className="space-y-3">
                  <div className="text-sm text-blue-600 bg-blue-50 p-3 rounded-md">
                    Dessinez la serre dans le domaine{" "}
                    <strong>{activeDomain?.name}</strong>
                  </div>
                  <Button
                    variant="outline"
                    onClick={cancelDrawing}
                    className="w-full"
                  >
                    Annuler
                  </Button>
                </div>
              )}

              {pendingSerre && (
                <div className="space-y-4">
                  <div className="text-xs text-gray-500">
                    Surface: {pendingSerre.area.toFixed(0)} m²
                  </div>

                  <div>
                    <Label htmlFor="serreName">Nom de la serre *</Label>
                    <Input
                      id="serreName"
                      value={serreForm.nom}
                      onChange={(e) =>
                        setSerreForm((prev) => ({
                          ...prev,
                          nom: e.target.value,
                        }))
                      }
                      placeholder="Ex: Serre Tomates A1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="guideSelect">Guide de culture *</Label>
                    <Select
                      value={serreForm.selectedGuideId}
                      onValueChange={(value) =>
                        setSerreForm((prev) => ({
                          ...prev,
                          selectedGuideId: value,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez un guide de culture" />
                      </SelectTrigger>
                      <SelectContent>
                        {guides.map((guide) => (
                          <SelectItem key={guide.id} value={guide.id}>
                            {guide.nom} - {guide.variete} ({guide.rendement} kg/m²)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {guides.length === 0 && (
                      <p className="text-sm text-gray-500 mt-1">
                        Créez d'abord un guide de culture
                      </p>
                    )}
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      onClick={handleSaveSerre}
                      disabled={
                        isSavingSerre ||
                        !serreForm.nom.trim() ||
                        !serreForm.selectedGuideId
                      }
                      className="flex-1"
                    >
                      {isSavingSerre ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Enregistrement...
                        </>
                      ) : (
                        "Enregistrer"
                      )}
                    </Button>
                    <Button variant="outline" onClick={cancelDrawing}>
                      Annuler
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Serres List for Active Domain */}
          {activeDomain && activeDomain.serres.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Serres de {activeDomain.name} ({activeDomain.serres.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {activeDomain.serres.map((serre) => (
                    <div key={serre.id} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">
                            {serre.nom}
                          </h4>
                          <div className="text-sm text-gray-600 space-y-1">
                            {serre.guide && (
                              <>
                                <div>Guide: {serre.guide.nom}</div>
                                <div>Variété: {serre.guide.variete}</div>
                                <div>Rendement: {serre.guide.rendement} kg/m²</div>
                                <div>Plants: {serre.guide.nombre_de_plants}</div>
                                <div>Surface: {serre.surface.toFixed(0)} m²</div>
                              </>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteSerre(serre.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="p-6 border-t bg-gray-50">
          <div className="mb-3 text-sm text-gray-600">
            Total: {totalSerres} serre{totalSerres > 1 ? "s" : ""} créée
            {totalSerres > 1 ? "s" : ""}
            dans {currentDomains.length} domaine
            {currentDomains.length > 1 ? "s" : ""}
          </div>
          <div className="flex space-x-3">
            <Button variant="outline" onClick={onBack}>
              Retour aux domaines
            </Button>
            <Button
              onClick={() => onComplete(currentDomains)}
              className="flex-1"
            >
              Terminer la configuration
            </Button>
          </div>
        </div>
      </div>

      {/* Right Panel - Map */}
      <div className="flex-1">
        <GoogleMapsWrapper apiKey={GOOGLE_MAPS_API_KEY}>
          <MapComponent
            onShapeComplete={handleShapeComplete}
            existingShapes={getAllShapes()}
            drawingMode={isDrawing ? "serre" : null}
            selectedDomainId={activeDomainId}
            className="w-full h-full"
          />
        </GoogleMapsWrapper>
      </div>
    </div>
  );
}

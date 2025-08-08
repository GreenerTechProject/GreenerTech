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
import { serreService } from "@/services/serreService";

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
  setupMode?: boolean;
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
  setupMode = false,
}: SerreCreationProps) {
  const [currentDomains, setCurrentDomains] = useState<Domain[]>(domains);
  const [activeDomainId, setActiveDomainId] = useState<string>(
    selectedDomainId || domains[0]?.id || ""
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
    notes: "",
  });
  const [guides, setGuides] = useState<ExtendedGuideDeCulture[]>([]);
  const [showCreateGuide, setShowCreateGuide] = useState(false);
  const [isCreatingGuide, setIsCreatingGuide] = useState(false);
  const [isSavingSerre, setIsSavingSerre] = useState(false);
  const { toast } = useToast();

  const activeDomain = currentDomains.find((d) => d.id === activeDomainId);

  useEffect(() => {
    const loadGuides = async () => {
      try {
        const existingGuides = await guideService.getGuides();
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
    }

    setIsCreatingGuide(true);

    try {
      let newGuide: ExtendedGuideDeCulture;

      if (setupMode) {
        newGuide = {
          id: `temp-guide-${Date.now()}`,
          nom: guideForm.nom,
          variete: guideForm.variete,
          rendement: parseFloat(guideForm.rendement),
          nombre_de_plants: parseInt(guideForm.nombre_de_plants),
          date_debut_saison: guideForm.date_debut_saison,
          date_fin_saison: guideForm.date_fin_saison,
          id_serre: "",
        };
      } else {
        const guideRequest = {
          nom: guideForm.nom,
          variete: guideForm.variete,
          rendement: parseFloat(guideForm.rendement),
          nombre_de_plants: parseInt(guideForm.nombre_de_plants),
          date_debut_saison: guideForm.date_debut_saison.toISOString(),
          date_fin_saison: guideForm.date_fin_saison.toISOString(),
          id_serre: "temp",
        };

        const response = await guideService.createGuide(guideRequest);

        newGuide = {
          id: response.guideId,
          nom: guideForm.nom,
          variete: guideForm.variete,
          rendement: parseFloat(guideForm.rendement),
          nombre_de_plants: parseInt(guideForm.nombre_de_plants),
          date_debut_saison: guideForm.date_debut_saison,
          date_fin_saison: guideForm.date_fin_saison,
          id_serre: "",
        };
      }

      setGuides((prev) => [...prev, newGuide]);
      setSerreForm((prev) => ({ ...prev, selectedGuideId: newGuide.id }));
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
    } catch (error) {
      console.error("Error creating guide:", error);
      toast({
        title: "Erreur",
        description: "Échec de la création du guide",
        variant: "destructive",
      });
    } finally {
      setIsCreatingGuide(false);
    }
  };

  const handleSaveSerre = async () => {
    if (
      !pendingSerre ||
      !serreForm.nom.trim() ||
      !serreForm.selectedGuideId ||
      !activeDomainId
    ) {
      return;
    }

    const selectedGuide = guides.find((g) => g.id === serreForm.selectedGuideId);
    if (!selectedGuide) return;

    setIsSavingSerre(true);

    try {
      let newSerre: ExtendedSerre;

      if (setupMode) {
        newSerre = {
          id: `temp-serre-${Date.now()}`,
          nom: serreForm.nom.trim(),
          surface: pendingSerre.area,
          domainId: activeDomainId,
          guideId: serreForm.selectedGuideId,
          position: pendingSerre.path,
          center: pendingSerre.center,
          guide: selectedGuide,
        };
      } else {
        const serreRequest = {
          nom: serreForm.nom.trim(),
          id_domaine: parseInt(activeDomainId),
          position: pendingSerre.path.map((point, index) => ({
            latitude: point.lat(),
            longitude: point.lng(),
            ordre: index + 1,
          })),
        };

        const createdSerre = await serreService.createSerre(serreRequest);

        newSerre = {
          id: createdSerre.id.toString(),
          nom: serreForm.nom.trim(),
          surface: pendingSerre.area,
          domainId: activeDomainId,
          guideId: serreForm.selectedGuideId,
          position: pendingSerre.path,
          center: pendingSerre.center,
          guide: selectedGuide,
        };
      }

      setCurrentDomains((prev) =>
        prev.map((domain) =>
          domain.id === activeDomainId
            ? { ...domain, serres: [...domain.serres, newSerre] }
            : domain
        )
      );
      setSerreForm({ nom: "", selectedGuideId: "" });
      setPendingSerre(null);

      toast({
        title: "Serre créée",
        description: `La serre "${serreForm.nom}" a été créée avec succès`,
      });
    } catch (error) {
      console.error("Error saving serre:", error);
      toast({
        title: "Erreur",
        description: "Échec de la création de la serre",
        variant: "destructive",
      });
    } finally {
      setIsSavingSerre(false);
    }
  };

  const handleDeleteSerre = (serreId: string) => {
    setCurrentDomains((prev) =>
      prev.map((domain) => ({
        ...domain,
        serres: domain.serres.filter((s) => s.id !== serreId),
      }))
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

    if (pendingSerre) {
      shapes.push(pendingSerre);
    }

    return shapes;
  };

  const totalSerres = currentDomains.reduce(
    (total, domain) => total + domain.serres.length,
    0
  );

  return (
    <div className="h-screen flex">
      {/* Left Panel */}
      <div className="w-1/3 bg-white border-r flex flex-col">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Création de Serres</h2>
              <p className="text-sm text-gray-600">
                Créez des serres pour vos domaines
              </p>
            </div>
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
          </div>
        </div>

        {/* Domain Selection */}
        <div className="p-6 border-b">
          <Label htmlFor="domain-select">Sélectionner un domaine</Label>
          <Select value={activeDomainId} onValueChange={setActiveDomainId}>
            <SelectTrigger>
              <SelectValue placeholder="Choisir un domaine" />
            </SelectTrigger>
            <SelectContent>
              {currentDomains.map((domain) => (
                <SelectItem key={domain.id} value={domain.id}>
                  {domain.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Serre Creation Form */}
        <div className="flex-1 p-6 overflow-y-auto">
          {activeDomain && (
            <div className="space-y-6">
              {/* Serre Form */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    Nouvelle Serre
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="serre-name">Nom de la serre</Label>
                    <Input
                      id="serre-name"
                      value={serreForm.nom}
                      onChange={(e) =>
                        setSerreForm((prev) => ({ ...prev, nom: e.target.value }))
                      }
                      placeholder="Ex: Serre A-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="guide-select">Guide de culture</Label>
                    <Select
                      value={serreForm.selectedGuideId}
                      onValueChange={(value) =>
                        setSerreForm((prev) => ({ ...prev, selectedGuideId: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choisir un guide" />
                      </SelectTrigger>
                      <SelectContent>
                        {guides.map((guide) => (
                          <SelectItem key={guide.id} value={guide.id}>
                            {guide.nom} - {guide.variete}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {!serreForm.selectedGuideId && (
                    <div className="text-center">
                      <Button
                        variant="outline"
                        onClick={() => setShowCreateGuide(true)}
                        className="w-full"
                      >
                        <BookOpen className="h-4 w-4 mr-2" />
                        Créer un nouveau guide
                      </Button>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      onClick={startDrawing}
                      disabled={!serreForm.nom.trim() || !serreForm.selectedGuideId}
                      className="flex-1"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Dessiner la serre
                    </Button>
                    {pendingSerre && (
                      <Button
                        onClick={cancelDrawing}
                        variant="outline"
                        size="icon"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  {pendingSerre && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Surface:</span>
                        <span className="font-medium">
                          {pendingSerre.area.toFixed(2)} m²
                        </span>
                      </div>
                      <Button
                        onClick={handleSaveSerre}
                        disabled={isSavingSerre}
                        className="w-full"
                      >
                        {isSavingSerre && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Sauvegarder la serre
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Existing Serres */}
              {activeDomain.serres.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Serres existantes ({activeDomain.serres.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {activeDomain.serres.map((serre) => (
                        <div
                          key={serre.id}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div>
                            <p className="font-medium">{serre.nom}</p>
                            <p className="text-sm text-gray-600">
                              {serre.surface.toFixed(2)} m²
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteSerre(serre.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Total: {totalSerres} serre(s) créée(s)
            </div>
            <Button
              onClick={() => onComplete(currentDomains)}
              disabled={totalSerres === 0}
            >
              Continuer
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

      {/* Create Guide Modal */}
      {showCreateGuide && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Créer un guide de culture</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="guide-name">Nom du guide</Label>
                <Input
                  id="guide-name"
                  value={guideForm.nom}
                  onChange={(e) =>
                    setGuideForm((prev) => ({ ...prev, nom: e.target.value }))
                  }
                  placeholder="Ex: Guide Tomates"
                />
              </div>

              <div>
                <Label htmlFor="guide-variete">Variété</Label>
                <Select
                  value={guideForm.variete}
                  onValueChange={(value) =>
                    setGuideForm((prev) => ({ ...prev, variete: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir une variété" />
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="guide-rendement">Rendement (kg/m²)</Label>
                  <Input
                    id="guide-rendement"
                    type="number"
                    value={guideForm.rendement}
                    onChange={(e) =>
                      setGuideForm((prev) => ({ ...prev, rendement: e.target.value }))
                    }
                    placeholder="0.0"
                  />
                </div>

                <div>
                  <Label htmlFor="guide-plants">Nombre de plants</Label>
                  <Input
                    id="guide-plants"
                    type="number"
                    value={guideForm.nombre_de_plants}
                    onChange={(e) =>
                      setGuideForm((prev) => ({ ...prev, nombre_de_plants: e.target.value }))
                    }
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Date de début</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {guideForm.date_debut_saison ? (
                          format(guideForm.date_debut_saison, "PPP", { locale: fr })
                        ) : (
                          <span>Choisir une date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={guideForm.date_debut_saison}
                        onSelect={(date) =>
                          setGuideForm((prev) => ({ ...prev, date_debut_saison: date }))
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label>Date de fin</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {guideForm.date_fin_saison ? (
                          format(guideForm.date_fin_saison, "PPP", { locale: fr })
                        ) : (
                          <span>Choisir une date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={guideForm.date_fin_saison}
                        onSelect={(date) =>
                          setGuideForm((prev) => ({ ...prev, date_fin_saison: date }))
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div>
                <Label htmlFor="guide-notes">Notes</Label>
                <Textarea
                  id="guide-notes"
                  value={guideForm.notes}
                  onChange={(e) =>
                    setGuideForm((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  placeholder="Notes supplémentaires..."
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleCreateGuide}
                  disabled={isCreatingGuide}
                  className="flex-1"
                >
                  {isCreatingGuide && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Créer le guide
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowCreateGuide(false)}
                >
                  Annuler
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
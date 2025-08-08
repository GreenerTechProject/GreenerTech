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
        {/* ... (rest of your JSX remains exactly the same) ... */}
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
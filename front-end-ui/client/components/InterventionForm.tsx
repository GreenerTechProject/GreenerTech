import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Send, ArrowLeft, ChevronDown, X, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import { InterventionService, CreateInterventionRequest } from "@/services/interventionService";
import { serreService } from "@/services/serreService";
import { typeTacheService } from "@/services/typeTacheService";

interface InterventionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (data: InterventionData) => void;
}

interface InterventionData {
  interventionType: string;  // Will be converted to number (id_type_tache)
  serreId: string;          // Will be converted to number (id_serre)
  interventionDate: string; // Will be used as date_debut
  dateFin: string;          // Date de fin
  estimatedCharges: string; // Charges estimées en MAD
  description: string;      // Direct mapping
}

export default function InterventionForm({
  isOpen,
  onClose,
  onSubmit,
}: InterventionFormProps) {
  console.log("InterventionForm rendered, isOpen:", isOpen);
  const [formData, setFormData] = useState<InterventionData>({
    interventionType: "",
    serreId: "",
    interventionDate: "",
    dateFin: "",
    estimatedCharges: "",
    description: "",
  });

  const [errors, setErrors] = useState<Partial<InterventionData>>({});
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serres, setSerres] = useState<Array<{id: number, nom: string}>>([]);
  const [loadingSerres, setLoadingSerres] = useState(false);
  const [typeTaches, setTypeTaches] = useState<Array<{id: number, nom: string}>>([]);
  const [loadingTypeTaches, setLoadingTypeTaches] = useState(false);

  useEffect(() => {
    console.log("🔍 useEffect triggered, isOpen:", isOpen);
    if (isOpen) {
      console.log("🚀 Form opening, fetching data...");
      fetchSerres();
      fetchTypeTaches();
      setTimeout(() => {
        const firstField = document.querySelector('#intervention-type-trigger');
        if (firstField) {
          (firstField as HTMLElement).focus();
        }
      }, 300);
    }
  }, [isOpen]);

  const fetchSerres = async () => {
    try {
      console.log("🔄 Starting to fetch serres...");
      setLoadingSerres(true);
      
      // Try the primary method first
      let userSerres;
      try {
        userSerres = await serreService.getSerresByCurrentUser();
        console.log("📦 Serres fetched via getSerresByCurrentUser:", userSerres);
      } catch (primaryError) {
        console.warn("⚠️ Primary method failed, trying fallback:", primaryError);
        // Fallback to getSerresByUser method
        userSerres = await serreService.getSerresByUser();
        console.log("📦 Serres fetched via fallback getSerresByUser:", userSerres);
      }
      
      if (userSerres && userSerres.length > 0) {
        setSerres(userSerres.map(serre => ({ id: serre.id, nom: serre.nom })));
        console.log("✅ Serres state updated:", userSerres.map(serre => ({ id: serre.id, nom: serre.nom })));
      } else {
        console.warn("⚠️ No serres found for user");
        setSerres([]);
      }
    } catch (error) {
      console.error("❌ Error fetching serres:", error);
      toast({
        title: "❌ Erreur",
        description: "Impossible de charger la liste des serres.",
        variant: "destructive",
      });
      setSerres([]);
    } finally {
      setLoadingSerres(false);
      console.log("🔓 Loading state set to false");
    }
  };

  const fetchTypeTaches = async () => {
    try {
      setLoadingTypeTaches(true);
      const allTypeTaches = await typeTacheService.getAllTypeTaches();
      setTypeTaches(allTypeTaches.map(typeTache => ({ id: typeTache.id, nom: typeTache.nom })));
    } catch (error) {
      console.error("Error fetching type taches:", error);
      toast({
        title: "❌ Erreur",
        description: "Impossible de charger la liste des types de tâches.",
        variant: "destructive",
      });
    } finally {
      setLoadingTypeTaches(false);
    }
  };

  const validateForm = () => {
    const newErrors: Partial<InterventionData> = {};

    if (!formData.interventionType) {
      newErrors.interventionType = "Type d'intervention requis";
    }
    if (!formData.serreId) {
      newErrors.serreId = "Sélectionner une serre";
    }
    if (!formData.interventionDate) {
      newErrors.interventionDate = "Date d'intervention requise";
    }
    
    // Ensure description is not empty (backend requirement)
    if (!formData.description || formData.description.trim() === "") {
      newErrors.description = "Description requise";
    }

    console.log("🔍 Form validation errors:", newErrors);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (validateForm()) {
      setIsSubmitting(true);
      try {
        console.log("📝 Form data before mapping:", formData);
        
        // Map form data to backend format with proper validation
        const createRequest: CreateInterventionRequest = {
          description: formData.description || "Intervention créée par le technicien", // Ensure description is never empty
          id_serre: parseInt(formData.serreId),
          id_type_tache: parseInt(formData.interventionType),
          date_debut: formData.interventionDate,
          total_charges: 0.0, // Default value as per backend model
          // date_fin is optional and not set initially
        };

        console.log("🔄 Backend request data:", createRequest);

        // Validate the mapped data
        if (isNaN(createRequest.id_serre) || isNaN(createRequest.id_type_tache)) {
          throw new Error("Invalid serre or type tache ID");
        }

        if (!createRequest.date_debut) {
          throw new Error("Date de début is required");
        }

        // Additional validation for data integrity
        if (createRequest.id_serre <= 0 || createRequest.id_type_tache <= 0) {
          throw new Error("Invalid serre or type tache ID (must be positive)");
        }

        // Validate date format (should be YYYY-MM-DD)
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(createRequest.date_debut)) {
          throw new Error("Invalid date format. Expected YYYY-MM-DD");
        }

        // Create intervention using the service
        const createdIntervention = await InterventionService.createIntervention(createRequest);
        
        console.log("✅ Intervention created successfully:", createdIntervention);
        console.log("📊 Backend response data:", createdIntervention);
        
        // Call parent callback if provided
        onSubmit?.(formData);
        
        toast({
          title: "✅ Intervention créée",
          description: "Votre demande d'intervention a été envoyée avec succès.",
          duration: 3000,
        });
        
        setTimeout(() => {
          handleClose();
        }, 1500);
      } catch (error) {
        console.error("❌ Error creating intervention:", error);
        let errorMessage = "Une erreur est survenue lors de l'envoi de l'intervention.";
        
        if (error instanceof Error) {
          errorMessage = error.message;
        } else if (typeof error === 'object' && error !== null && 'message' in error) {
          errorMessage = (error as any).message;
        }
        
        toast({
          title: "❌ Erreur",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleClose = () => {
    setIsSubmitting(false);
    setTimeout(() => {
      setFormData({
        interventionType: "",
        serreId: "",
        interventionDate: "",
        dateFin: "",
        estimatedCharges: "",
        description: "",
      });
      setErrors({});
      onClose();
    }, 150);
  };

  const updateFormData = (field: keyof InterventionData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-[95vw] w-full max-h-[95vh] overflow-y-auto p-0 rounded-xl border border-border shadow-2xl mx-auto z-[9998] fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-card">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 z-[9999] p-2 hover:bg-muted rounded-full transition-colors"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
        
        <div className="flex min-h-[400px] p-4 sm:p-6 items-center bg-card rounded-xl relative z-[9997]">
          <form className="flex w-full min-h-[350px] flex-col justify-center items-start gap-3 sm:gap-4 relative z-[9996]">
            {/* Row 1: Type d'intervention & ID Serre */}
            <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
              <div className="flex w-full flex-col justify-center items-start gap-2">
                <Label htmlFor="intervention-type" className="flex items-start gap-0 text-xs sm:text-sm font-semibold text-foreground">
                  Type d'intervention demandée
                  <span className="text-red-500 ml-1">*</span>
                </Label>
                <Select
                  value={formData.interventionType}
                  onValueChange={(value) => updateFormData("interventionType", value)}
                  onOpenChange={(open) => console.log("🔽 Type tache dropdown open:", open)}
                >
                  <SelectTrigger
                    id="intervention-type-trigger"
                    className={cn(
                      "flex h-10 sm:h-11 w-full px-3 py-0 justify-between items-center rounded-lg border border-border bg-card text-sm",
                      errors.interventionType && "border-red-500 focus:border-red-500 focus:ring-red-500"
                    )}
                    disabled={loadingTypeTaches}
                  >
                    <SelectValue
                      placeholder={loadingTypeTaches ? "Chargement..." : "Sélectionner un type d'intervention"}
                      className="text-foreground font-normal text-sm"
                    />
                  </SelectTrigger>
                  <SelectContent 
                    className="z-[9999] relative min-w-[200px]" 
                    position="popper" 
                    side="bottom" 
                    align="start"
                    sideOffset={4}
                    avoidCollisions={true}
                  >
                    {typeTaches.map((type) => (
                      <SelectItem key={type.id} value={type.id.toString()}>
                        {type.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.interventionType && (
                  <p className="text-xs text-red-500">{errors.interventionType}</p>
                )}
              </div>

              <div className="flex w-full flex-col justify-center items-start gap-2">
                <Label htmlFor="serre-id" className="flex items-start gap-0 text-xs sm:text-sm font-semibold text-foreground">
                  Sélectionner une serre
                  <span className="text-red-500 ml-1">*</span>
                </Label>
                <Select
                  value={formData.serreId}
                  onValueChange={(value) => updateFormData("serreId", value)}
                  onOpenChange={(open) => console.log("🔽 Serre dropdown open:", open)}
                >
                  <SelectTrigger
                    id="serre-id"
                    className={cn(
                      "flex h-10 sm:h-11 px-3 py-0 items-center rounded-lg border border-border bg-card text-sm text-foreground",
                      errors.serreId && "border-red-500 focus:border-red-500 focus:ring-red-500",
                      loadingSerres && "opacity-50 cursor-not-allowed"
                    )}
                    disabled={loadingSerres}
                  >
                    <SelectValue
                      placeholder={loadingSerres ? "Chargement..." : "Sélectionner une serre"}
                      className="text-foreground font-normal text-sm"
                    />
                  </SelectTrigger>
                  <SelectContent 
                    className="z-[9999] relative min-w-[200px]" 
                    position="popper" 
                    side="bottom" 
                    align="start"
                    sideOffset={4}
                    avoidCollisions={true}
                  >
                    {serres.length > 0 ? (
                      serres.map((serre) => (
                        <SelectItem key={serre.id} value={serre.id.toString()}>
                          {serre.nom}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-sm text-muted-foreground">
                        {loadingSerres ? "Chargement des serres..." : "Aucune serre assignée"}
                      </div>
                    )}
                  </SelectContent>
                </Select>
                {errors.serreId && (
                  <p className="text-xs text-red-500">{errors.serreId}</p>
                )}
              </div>
            </div>

            {/* Row 2: Date d'intervention & Date de fin */}
            <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
              <div className="flex w-full flex-col justify-center items-start gap-2">
                <Label htmlFor="intervention-date" className="flex items-start gap-0 text-xs sm:text-sm font-semibold text-foreground">
                  Date de l'intervention
                  <span className="text-red-500 ml-1">*</span>
                </Label>
                <div className="relative w-full h-10 sm:h-11">
                  <Input
                    id="intervention-date"
                    type="date"
                    value={formData.interventionDate}
                    onChange={(e) => updateFormData("interventionDate", e.target.value)}
                    className={cn(
                      "w-full h-full rounded-lg border border-border bg-card px-3 text-foreground text-sm font-normal focus:border-[#B4CC5F] focus:ring-[#B4CC5F] focus:ring-2",
                      errors.interventionDate && "border-red-500 focus:border-red-500 focus:ring-red-500"
                    )}
                    placeholder="mm/dd/yyyy"
                  />
                  <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
                {errors.interventionDate && (
                  <p className="text-xs text-red-500">{errors.interventionDate}</p>
                )}
              </div>

              <div className="flex w-full flex-col justify-center items-start gap-2">
                <Label htmlFor="date-fin" className="flex items-start gap-0 text-xs sm:text-sm font-semibold text-foreground">
                  Date de fin
                  <span className="text-muted-foreground text-xs ml-1">(optionnel)</span>
                </Label>
                <div className="relative w-full h-10 sm:h-11">
                  <Input
                    id="date-fin"
                    type="date"
                    value={formData.dateFin}
                    onChange={(e) => updateFormData("dateFin", e.target.value)}
                    className="w-full h-full rounded-lg border border-border bg-card px-3 text-foreground text-sm font-normal focus:border-[#B4CC5F] focus:ring-[#B4CC5F] focus:ring-2"
                    placeholder="mm/dd/yyyy"
                  />
                  <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </div>

            {/* Row 3: Charges estimées */}
            <div className="w-full">
              <div className="flex flex-col gap-2">
                <Label htmlFor="estimated-charges" className="flex items-start gap-1 text-xs sm:text-sm font-semibold text-foreground">
                  Charges estimées (MAD)
                  <span className="text-muted-foreground text-xs">(optionnel)</span>
                </Label>
                <div className="relative">
                  <Input
                    id="estimated-charges"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.estimatedCharges}
                    onChange={(e) => updateFormData("estimatedCharges", e.target.value)}
                    className="h-10 sm:h-11 px-3 pl-10 rounded-lg border border-border bg-card hover:border-[#B4CC5F] focus:border-[#B4CC5F] focus:ring-[#B4CC5F] focus:ring-2 transition-colors text-foreground font-medium text-sm"
                    placeholder="0.00"
                  />
                  <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#B4CC5F]" />
                </div>
              </div>
            </div>

            {/* Row 4: Description */}
            <div className="w-full">
              <div className="flex flex-col gap-2">
                <Label htmlFor="description" className="text-xs sm:text-sm font-semibold text-foreground">
                  Description de l'intervention
                  <span className="text-muted-foreground text-xs ml-1">(optionnel)</span>
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => updateFormData("description", e.target.value)}
                  placeholder="Détails supplémentaires sur l'intervention..."
                  rows={3}
                  className="w-full p-3 rounded-lg border border-border bg-card resize-none text-sm text-foreground focus:border-[#B4CC5F] focus:ring-[#B4CC5F] focus:ring-2"
                />
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 sm:pt-6 justify-center items-center w-full border-t border-border">
              <Button
                type="button"
                onClick={handleClose}
                className="flex h-10 sm:h-11 px-4 sm:px-6 justify-center items-center gap-2 rounded-lg bg-muted hover:bg-muted/80 border-0 w-full sm:w-auto text-sm"
              >
                <ArrowLeft className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground text-center font-medium">Annuler</span>
              </Button>

              <Button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex h-10 sm:h-11 px-4 sm:px-6 justify-center items-center gap-2 rounded-lg bg-[#B4CC5F] hover:bg-[#9BB84F] text-white shadow-md border-0 w-full sm:w-auto text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="h-4 w-4 text-white" />
                <span className="text-white text-center font-medium">
                  {isSubmitting ? "Envoi en cours..." : "Envoyer la demande"}
                </span>
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

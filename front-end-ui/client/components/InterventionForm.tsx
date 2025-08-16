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
import { Calendar, Save, Send, ArrowLeft, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { InterventionService, CreateInterventionRequest } from "@/services/interventionService";
import { serreService } from "@/services/serreService";
import { typeTacheService } from "@/services/typeTacheService";

interface InterventionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (data: InterventionData) => void;
  onSaveDraft?: (data: InterventionData) => void;
}

interface InterventionData {
  interventionType: string;  // Will be converted to number (id_type_tache)
  serreId: string;          // Will be converted to number (id_serre)
  interventionDate: string; // Will be used as date_debut
  description: string;      // Direct mapping
}





export default function InterventionForm({
  isOpen,
  onClose,
  onSubmit,
  onSaveDraft,
}: InterventionFormProps) {
  console.log("InterventionForm rendered, isOpen:", isOpen);
  const [formData, setFormData] = useState<InterventionData>({
    interventionType: "",
    serreId: "",
    interventionDate: "",
    description: "",
  });

  const [errors, setErrors] = useState<Partial<InterventionData>>({});
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDrafting, setIsDrafting] = useState(false);
  const [formStep, setFormStep] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [serres, setSerres] = useState<Array<{id: number, nom: string}>>([]);
  const [loadingSerres, setLoadingSerres] = useState(false);
  const [typeTaches, setTypeTaches] = useState<Array<{id: number, nom: string}>>([]);
  const [loadingTypeTaches, setLoadingTypeTaches] = useState(false);

  useEffect(() => {
    console.log("🔍 useEffect triggered, isOpen:", isOpen);
    if (isOpen) {
      console.log("🚀 Form opening, fetching data...");
      setFormStep(0);
      setShowSuccess(false);
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
        
        setShowSuccess(true);
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

  const handleSaveDraft = async () => {
    setIsDrafting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      onSaveDraft?.(formData);
      toast({
        title: "💾 Brouillon sauvegardé",
        description: "Votre intervention a été sauvegardée en brouillon.",
        duration: 2000,
      });
      setTimeout(() => {
        handleClose();
      }, 500);
    } catch (error) {
      toast({
        title: "❌ Erreur",
        description: "Erreur lors de la sauvegarde.",
        variant: "destructive",
      });
    } finally {
      setIsDrafting(false);
    }
  };

  const handleClose = () => {
    setFormStep(0);
    setShowSuccess(false);
    setIsSubmitting(false);
    setIsDrafting(false);
          setTimeout(() => {
        setFormData({
          interventionType: "",
          serreId: "",
          interventionDate: "",
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
      <DialogContent className="max-w-[1396px] w-[98vw] sm:w-[95vw] max-h-[95vh] sm:max-h-[90vh] overflow-y-auto p-0 rounded-xl border border-gray-200 shadow-2xl mx-auto z-[9998] fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white">
        <div className="flex min-h-[500px] sm:min-h-[580px] lg:min-h-[644px] p-3 sm:p-4 md:p-6 lg:p-8 items-center bg-white rounded-xl relative z-[9997]">
          <form className="flex w-full min-h-[450px] sm:min-h-[520px] lg:min-h-[580px] flex-col justify-center items-start gap-3 sm:gap-4 md:gap-6 lg:gap-8 relative z-[9996]">
            {/* Row 1: Type d'intervention & ID Serre */}
            <div className="w-full flex flex-col md:flex-row justify-between gap-3 sm:gap-4 md:gap-0">
              <div className="flex w-full md:w-[48%] lg:w-[567px] flex-col justify-center items-start gap-2 sm:gap-3">
                <Label htmlFor="intervention-type" className="flex items-start gap-0 text-xs sm:text-sm font-semibold text-gray-900">
                  Type d'intervention demandée
                  <span className="text-red-500 ml-1">*</span>
                </Label>
                <Select
                  value={formData.interventionType}
                  onValueChange={(value) => updateFormData("interventionType", value)}
                  onOpenChange={(open) => console.log("🔽 Type tache dropdown open:", open)}
                >
                  <SelectTrigger
                    className={cn(
                      "flex h-[45px] sm:h-[47px] w-full px-3 py-0 justify-between items-center rounded-lg border border-gray-300 bg-white",
                      errors.interventionType && "border-red-500 focus:border-red-500"
                    )}
                    disabled={loadingTypeTaches}
                  >
                    <SelectValue
                      placeholder={loadingTypeTaches ? "Chargement..." : "Sélectionner un type d'intervention"}
                      className="text-gray-900 font-normal text-base"
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
                  <p className="text-sm text-red-500">{errors.interventionType}</p>
                )}
              </div>

              <div className="flex w-full md:w-[48%] lg:w-[567px] flex-col justify-center items-start gap-2 sm:gap-3">
                <Label htmlFor="serre-id" className="flex items-start gap-0 text-xs sm:text-sm font-semibold text-gray-900">
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
                      "flex h-[45px] sm:h-[50px] px-3 sm:px-4 py-0 items-center rounded-lg border border-gray-300 bg-white text-sm sm:text-base text-gray-600",
                      errors.serreId && "border-red-500 focus:border-red-500",
                      loadingSerres && "opacity-50 cursor-not-allowed"
                    )}
                    disabled={loadingSerres}
                  >
                    <SelectValue
                      placeholder={loadingSerres ? "Chargement..." : "Sélectionner une serre"}
                      className="text-gray-900 font-normal text-base"
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
                      <div className="px-3 py-2 text-sm text-gray-500">
                        {loadingSerres ? "Chargement des serres..." : "Aucune serre assignée"}
                      </div>
                    )}
                  </SelectContent>
                </Select>
                {errors.serreId && (
                  <p className="text-sm text-red-500">{errors.serreId}</p>
                )}
              </div>
            </div>

            {/* Row 2: Date d'intervention & Fonctionnaire */}
            <div className="w-full flex flex-col md:flex-row justify-between gap-3 sm:gap-4 md:gap-0">
              <div className="flex w-full md:w-[48%] lg:w-[567px] flex-col justify-center items-start gap-2 sm:gap-3">
                <Label htmlFor="intervention-date" className="flex items-start gap-0 text-xs sm:text-sm font-semibold text-gray-900">
                  Date de l'intervention
                  <span className="text-red-500 ml-1">*</span>
                </Label>
                <div className="relative w-full h-[45px] sm:h-[52px] z-[9997]">
                  <Input
                    id="intervention-date"
                    type="date"
                    value={formData.interventionDate}
                    onChange={(e) => updateFormData("interventionDate", e.target.value)}
                    className={cn(
                      "w-full h-full rounded-lg border border-gray-300 bg-white px-4 sm:px-6 text-black text-base sm:text-lg font-normal focus:z-[9999]",
                      errors.interventionDate && "border-red-500 focus:border-red-500"
                    )}
                    placeholder="mm/dd/yyyy"
                    style={{ 
                      zIndex: 9997,
                      position: 'relative'
                    }}
                  />
                  <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 h-6 w-6" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6.75 3V5.25M17.25 3V5.25M3 18.75V7.5C3 6.90326 3.23705 6.33097 3.65901 5.90901C4.08097 5.48705 4.65326 5.25 5.25 5.25H18.75C19.3467 5.25 19.919 5.48705 20.341 5.90901C20.7629 6.33097 21 6.90326 21 7.5V18.75M3 18.75C3 19.3467 3.23705 19.919 3.65901 20.341C4.08097 20.7629 4.65326 21 5.25 21H18.75C19.3467 21 19.919 20.7629 20.341 20.341C20.7629 19.919 21 19.3467 21 18.75M3 18.75V11.25C3 10.6533 3.23705 10.081 3.65901 9.65901C4.08097 9.23705 4.65326 9 5.25 9H18.75C19.3467 9 19.919 9.23705 20.341 9.65901C20.7629 10.081 21 10.6533 21 11.25V18.75" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                {errors.interventionDate && (
                  <p className="text-sm text-red-500">{errors.interventionDate}</p>
                )}
              </div>


            </div>

            {/* Row 3: Description */}
            <div className="flex w-full flex-col items-start gap-2 sm:gap-3">
              <Label htmlFor="description" className="text-xs sm:text-sm font-semibold text-gray-900">
                Description de l'intervention (optionnel)
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => updateFormData("description", e.target.value)}
                placeholder="Détails supplémentaires sur l'intervention..."
                rows={4}
                className="flex h-[100px] sm:h-[122px] w-full p-3 sm:p-4 items-start rounded-lg border border-gray-300 bg-white resize-none text-sm sm:text-base text-gray-600"
              />
            </div>



            {/* Footer Actions */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4 sm:pt-6 justify-between items-start w-full border-t border-gray-200">
              <Button
                type="button"
                onClick={handleClose}
                className="flex h-10 sm:h-12 px-4 sm:px-6 justify-center items-center gap-2 rounded-lg bg-gray-100 hover:bg-gray-200 border-0 w-full sm:w-auto"
              >
                <ArrowLeft className="h-4 w-4 text-gray-600" />
                <span className="text-gray-600 text-center font-medium text-sm sm:text-base">Annuler</span>
              </Button>

              <div className="flex flex-col sm:flex-row justify-center items-start gap-2 sm:gap-3 md:gap-4 w-full sm:w-auto">
                <Button
                  type="button"
                  onClick={handleSaveDraft}
                  className="flex h-10 sm:h-12 px-4 sm:px-6 justify-center items-center gap-2 rounded-lg bg-[#B4CC5F]/10 hover:bg-[#B4CC5F]/20 border-0 w-full sm:w-auto"
                >
                  <Save className="h-4 w-4 text-[#B4CC5F]" />
                  <span className="text-[#B4CC5F] text-center font-medium text-sm sm:text-base">
                    <span className="hidden sm:inline">Sauvegarder en brouillon</span>
                    <span className="sm:hidden">Sauvegarder</span>
                  </span>
                </Button>

                <Button
                  type="button"
                  onClick={handleSubmit}
                  className="flex h-10 sm:h-12 px-4 sm:px-6 justify-center items-center gap-2 rounded-lg bg-[#B4CC5F] hover:bg-[#9BB84F] text-white shadow-md border-0 w-full sm:w-auto"
                >
                  <Send className="h-4 w-4 text-white" />
                  <span className="text-white text-center font-medium text-sm sm:text-base">
                    <span className="hidden sm:inline">Envoyer la demande</span>
                    <span className="sm:hidden">Envoyer</span>
                  </span>
                </Button>
              </div>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

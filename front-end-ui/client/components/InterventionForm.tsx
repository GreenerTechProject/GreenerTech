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
import { Calendar, Save, Send, ArrowLeft, Plus, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface InterventionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (data: InterventionData) => void;
  onSaveDraft?: (data: InterventionData) => void;
}

interface InterventionData {
  interventionType: string;
  serreId: string;
  interventionDate: string;
  functionary: string;
  description: string;
  priority: "basse" | "moyenne" | "haute" | "urgente";
}

const interventionTypes = [
  { value: "maintenance", label: "Maintenance préventive" },
  { value: "reparation", label: "Réparation" },
  { value: "inspection", label: "Inspection" },
  { value: "recolte", label: "Récolte" },
  { value: "plantation", label: "Plantation" },
  { value: "irrigation", label: "Système d'irrigation" },
  { value: "temperature", label: "Contrôle température" },
  { value: "nettoyage", label: "Nettoyage" },
];

const functionaries = [
  { value: "jean.dupont", label: "Jean Dupont - Technicien Senior" },
  { value: "marie.martin", label: "Marie Martin - Spécialiste Irrigation" },
  { value: "pierre.bernard", label: "Pierre Bernard - Expert Cultures" },
  { value: "sophie.morel", label: "Sophie Morel - Technicien Junior" },
  { value: "paul.durand", label: "Paul Durand - Responsable Maintenance" },
];

const priorityOptions = [
  { value: "basse", label: "Basse" },
  { value: "moyenne", label: "Moyenne" },
  { value: "haute", label: "Haute" },
  { value: "urgente", label: "Urgente" },
];

export default function InterventionForm({
  isOpen,
  onClose,
  onSubmit,
  onSaveDraft,
}: InterventionFormProps) {
  const [formData, setFormData] = useState<InterventionData>({
    interventionType: "",
    serreId: "",
    interventionDate: "",
    functionary: "",
    description: "",
    priority: "moyenne",
  });

  const [errors, setErrors] = useState<Partial<InterventionData>>({});
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDrafting, setIsDrafting] = useState(false);
  const [formStep, setFormStep] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);

  // Auto-focus first field when form opens
  useEffect(() => {
    if (isOpen) {
      setFormStep(0);
      setShowSuccess(false);
      // Focus first field after animation
      setTimeout(() => {
        const firstField = document.querySelector('#intervention-type-trigger');
        if (firstField) {
          (firstField as HTMLElement).focus();
        }
      }, 300);
    }
  }, [isOpen]);

  const validateForm = () => {
    const newErrors: Partial<InterventionData> = {};
    
    if (!formData.interventionType) {
      newErrors.interventionType = "Type d'intervention requis";
    }
    if (!formData.serreId) {
      newErrors.serreId = "ID Serre requis";
    }
    if (!formData.interventionDate) {
      newErrors.interventionDate = "Date d'intervention requise";
    }
    if (!formData.functionary) {
      newErrors.functionary = "Fonctionnaire requis";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (validateForm()) {
      setIsSubmitting(true);
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));

        onSubmit?.(formData);
        setShowSuccess(true);

        toast({
          title: "✅ Intervention créée",
          description: "Votre demande d'intervention a été envoyée avec succès.",
          duration: 3000,
        });

        // Close after showing success
        setTimeout(() => {
          handleClose();
        }, 1500);
      } catch (error) {
        toast({
          title: "❌ Erreur",
          description: "Une erreur est survenue lors de l'envoi.",
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
      // Simulate API call
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
    // Reset form with animation
    setFormStep(0);
    setShowSuccess(false);
    setIsSubmitting(false);
    setIsDrafting(false);

    setTimeout(() => {
      setFormData({
        interventionType: "",
        serreId: "",
        interventionDate: "",
        functionary: "",
        description: "",
        priority: "moyenne",
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

  if (showSuccess) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-md w-[90vw] p-0 bg-white rounded-xl border border-gray-200 shadow-lg">
          <div className="flex flex-col items-center justify-center py-12 px-8 text-center">
            <div className="mb-6 relative">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center animate-pulse">
                <CheckCircle className="w-10 h-10 text-green-600 animate-bounce" />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Intervention créée !</h3>
            <p className="text-gray-600 mb-6">Votre demande a été envoyée avec succès.</p>
            <div className="w-full bg-gray-200 rounded-full h-1">
              <div className="bg-green-600 h-1 rounded-full animate-pulse" style={{width: '100%'}}></div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-[1396px] w-[95vw] max-h-[90vh] overflow-y-auto p-0 bg-white rounded-xl border border-gray-200 shadow-lg transform transition-all duration-300 ease-out">
        <div className="flex h-[644px] px-8 py-8 items-center relative overflow-hidden">
          {/* Animated Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 to-green-50/30 animate-pulse opacity-50"></div>

          <div className="w-full max-w-[1166px] mx-auto relative z-10">
            <div className="mb-6 flex items-center gap-3 animate-fade-in">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Plus className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">Nouvelle Intervention</h2>
                <p className="text-gray-600">Créez une demande d'intervention personnalisée</p>
              </div>
            </div>

            <form className="space-y-8 animate-slide-up">
              {/* Row 1: Type d'intervention & ID Serre */}
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-900 font-roboto">
                    Type d'intervention demandée
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <Select
                    value={formData.interventionType}
                    onValueChange={(value) => updateFormData("interventionType", value)}
                  >
                    <SelectTrigger
                      id="intervention-type-trigger"
                      className={cn(
                        "h-[47px] w-[567px] border border-gray-300 rounded-lg bg-white px-3 font-roboto text-base transition-all duration-200 hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200",
                        errors.interventionType && "border-red-500 focus:border-red-500 focus:ring-red-200"
                      )}
                    >
                      <SelectValue placeholder="Sélectionner un type d'intervention" className="text-gray-900" />
                    </SelectTrigger>
                    <SelectContent>
                      {interventionTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.interventionType && (
                    <p className="text-sm text-red-500">{errors.interventionType}</p>
                  )}
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-900 font-roboto">
                    ID Serre
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <Input
                    type="text"
                    value={formData.serreId}
                    onChange={(e) => updateFormData("serreId", e.target.value)}
                    placeholder="Serre / Domaine / Bilan"
                    className={cn(
                      "h-[50px] w-[567px] border border-gray-300 rounded-lg bg-white px-4 font-roboto text-base placeholder-gray-400 transition-all duration-200 hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200",
                      errors.serreId && "border-red-500 focus:border-red-500 focus:ring-red-200"
                    )}
                  />
                  {errors.serreId && (
                    <p className="text-sm text-red-500">{errors.serreId}</p>
                  )}
                </div>
              </div>

              {/* Row 2: Date d'intervention & Fonctionnaire */}
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-900 font-roboto">
                    Date de l'intervention
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <div className="relative">
                    <Input
                      type="date"
                      value={formData.interventionDate}
                      onChange={(e) => updateFormData("interventionDate", e.target.value)}
                      className={cn(
                        "h-[52px] w-[567px] border border-gray-300 rounded-lg bg-white px-7 font-inter text-lg text-black transition-all duration-200 hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200",
                        errors.interventionDate && "border-red-500 focus:border-red-500 focus:ring-red-200"
                      )}
                    />
                    <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-6 w-6 text-black pointer-events-none" />
                  </div>
                  {errors.interventionDate && (
                    <p className="text-sm text-red-500">{errors.interventionDate}</p>
                  )}
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-900 font-roboto">
                    Fonctionnaire demandé
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <Select
                    value={formData.functionary}
                    onValueChange={(value) => updateFormData("functionary", value)}
                  >
                    <SelectTrigger className={cn(
                      "h-[47px] w-[567px] border border-gray-300 rounded-lg bg-white px-3 font-roboto text-base transition-all duration-200 hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200",
                      errors.functionary && "border-red-500 focus:border-red-500 focus:ring-red-200"
                    )}>
                      <SelectValue placeholder="Sélectionner un fonctionnaire" className="text-gray-900" />
                    </SelectTrigger>
                    <SelectContent>
                      {functionaries.map((functionary) => (
                        <SelectItem key={functionary.value} value={functionary.value}>
                          {functionary.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.functionary && (
                    <p className="text-sm text-red-500">{errors.functionary}</p>
                  )}
                </div>
              </div>

              {/* Row 3: Description */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-900 font-roboto">
                  Description de l'intervention (optionnel)
                </label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => updateFormData("description", e.target.value)}
                  placeholder="Détails supplémentaires sur l'intervention..."
                  className="h-[122px] w-full border border-gray-300 rounded-lg bg-white p-4 font-roboto text-base placeholder-gray-400 resize-none transition-all duration-200 hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </div>

              {/* Row 4: Priority */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-900 font-roboto">
                  Priorité
                </label>
                <RadioGroup
                  value={formData.priority}
                  onValueChange={(value: any) => updateFormData("priority", value)}
                  className="flex gap-6 pt-2"
                >
                  {priorityOptions.map((option) => (
                    <div key={option.value} className="flex items-center gap-2">
                      <RadioGroupItem
                        value={option.value}
                        id={option.value}
                        className={cn(
                          "w-4 h-4 border border-black rounded-full",
                          formData.priority === option.value && "border-blue-500 bg-blue-500"
                        )}
                      />
                      <label 
                        htmlFor={option.value} 
                        className="text-sm text-gray-700 font-roboto cursor-pointer"
                      >
                        {option.label}
                      </label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {/* Footer Actions */}
              <div className="border-t border-gray-200 pt-6 flex justify-between items-center">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={isSubmitting || isDrafting}
                  className="h-12 px-6 bg-gray-100 border-0 text-gray-600 font-roboto text-base font-medium rounded-lg hover:bg-gray-200 transition-all duration-200 flex items-center gap-2 disabled:opacity-50"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Annuler
                </Button>

                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSaveDraft}
                    disabled={isSubmitting || isDrafting}
                    className="h-12 px-6 bg-blue-50 border-0 text-blue-700 font-roboto text-base font-medium rounded-lg hover:bg-blue-100 transition-all duration-200 transform hover:scale-105 flex items-center gap-2 disabled:opacity-50 disabled:transform-none"
                  >
                    {isDrafting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                        Sauvegarde...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Sauvegarder en brouillon
                      </>
                    )}
                  </Button>

                  <Button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting || isDrafting}
                    className="h-12 px-9 bg-blue-700 text-white font-roboto text-base font-medium rounded-lg hover:bg-blue-800 shadow-lg transition-all duration-200 transform hover:scale-105 flex items-center gap-2 disabled:opacity-50 disabled:transform-none"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Envoi en cours...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Envoyer la demande
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

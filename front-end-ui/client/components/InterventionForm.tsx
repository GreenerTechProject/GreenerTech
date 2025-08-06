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
      <DialogContent className="max-w-4xl w-[95vw] max-h-[95vh] overflow-y-auto p-0 rounded-xl shadow-2xl border-0">
        <div className="flex flex-col h-full bg-white">
          {/* Header */}
          <DialogHeader className="px-8 pt-8 pb-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Calendar className="w-4 h-4 text-white" />
              </div>
              Nouvelle Intervention
            </DialogTitle>
          </DialogHeader>

          {/* Form Content */}
          <div className="flex-1 px-8 py-8 space-y-1">
            <form className="space-y-8 max-w-none">
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
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">3</span>
                  </div>
                  Détails
                </h3>
                <div className="space-y-4">
                  <div className="space-y-3">
                    <Label htmlFor="description" className="text-sm font-semibold text-gray-900">
                      Description de l'intervention (optionnel)
                    </Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => updateFormData("description", e.target.value)}
                      placeholder="Détails supplémentaires sur l'intervention..."
                      rows={4}
                      className="border-gray-300 rounded-lg resize-none"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label className="text-sm font-semibold text-gray-900">
                      Priorité
                    </Label>
                    <RadioGroup
                      value={formData.priority}
                      onValueChange={(value: any) => updateFormData("priority", value)}
                      className="flex flex-wrap gap-6 pt-2"
                    >
                      {priorityOptions.map((option) => (
                        <div key={option.value} className="flex items-center space-x-2">
                          <RadioGroupItem
                            value={option.value}
                            id={option.value}
                            className={cn(
                              "border-gray-400",
                              formData.priority === option.value && "border-blue-500"
                            )}
                          />
                          <Label
                            htmlFor={option.value}
                            className={cn(
                              "text-sm font-normal cursor-pointer",
                              option.color
                            )}
                          >
                            {option.label}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                </div>
              </div>

          {/* Footer Actions */}
          <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 px-8 py-6 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50">
            <Button
              variant="outline"
              onClick={handleClose}
              className="order-3 lg:order-1 w-full lg:w-auto px-6 py-3 border-gray-300 text-gray-600 hover:bg-gray-100"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Annuler
            </Button>

            <div className="order-1 lg:order-2 flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              <Button
                variant="outline"
                onClick={handleSaveDraft}
                className="w-full sm:w-auto px-6 py-3 border-blue-300 text-blue-600 bg-blue-50 hover:bg-blue-100 flex items-center justify-center"
              >
                <Save className="h-4 w-4 mr-2" />
                Sauvegarder en brouillon
              </Button>

              <Button
                onClick={handleSubmit}
                className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white shadow-lg flex items-center justify-center"
              >
                <Send className="h-4 w-4 mr-2" />
                Envoyer la demande
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

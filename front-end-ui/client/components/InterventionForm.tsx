import React, { useState } from "react";
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
import { Calendar, Save, Send, ArrowLeft } from "lucide-react";
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
  { value: "basse", label: "Basse", color: "text-gray-600" },
  { value: "moyenne", label: "Moyenne", color: "text-blue-600" },
  { value: "haute", label: "Haute", color: "text-orange-600" },
  { value: "urgente", label: "Urgente", color: "text-red-600" },
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

  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit?.(formData);
      handleClose();
    }
  };

  const handleSaveDraft = () => {
    onSaveDraft?.(formData);
    handleClose();
  };

  const handleClose = () => {
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
  };

  const updateFormData = (field: keyof InterventionData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl w-[95vw] max-h-[90vh] overflow-y-auto p-0 rounded-xl">
        <div className="flex flex-col h-full">
          {/* Header */}
          <DialogHeader className="px-8 pt-8 pb-6 border-b border-gray-200">
            <DialogTitle className="text-xl font-semibold text-gray-900">
              Nouvelle Intervention
            </DialogTitle>
          </DialogHeader>

          {/* Form Content */}
          <div className="flex-1 px-8 py-6">
            <form className="space-y-8">
              {/* Row 1: Type d'intervention & ID Serre */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="intervention-type" className="text-sm font-semibold text-gray-900">
                    Type d'intervention demandée
                    <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Select
                    value={formData.interventionType}
                    onValueChange={(value) => updateFormData("interventionType", value)}
                  >
                    <SelectTrigger 
                      className={cn(
                        "h-12 border-gray-300 rounded-lg",
                        errors.interventionType && "border-red-500 focus:border-red-500"
                      )}
                    >
                      <SelectValue placeholder="Sélectionner un type d'intervention" />
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
                  <Label htmlFor="serre-id" className="text-sm font-semibold text-gray-900">
                    ID Serre
                    <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Input
                    id="serre-id"
                    type="text"
                    value={formData.serreId}
                    onChange={(e) => updateFormData("serreId", e.target.value)}
                    placeholder="Serre / Domaine / Bilan"
                    className={cn(
                      "h-12 border-gray-300 rounded-lg",
                      errors.serreId && "border-red-500 focus:border-red-500"
                    )}
                  />
                  {errors.serreId && (
                    <p className="text-sm text-red-500">{errors.serreId}</p>
                  )}
                </div>
              </div>

              {/* Row 2: Date d'intervention & Fonctionnaire */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="intervention-date" className="text-sm font-semibold text-gray-900">
                    Date de l'intervention
                    <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="intervention-date"
                      type="date"
                      value={formData.interventionDate}
                      onChange={(e) => updateFormData("interventionDate", e.target.value)}
                      className={cn(
                        "h-12 border-gray-300 rounded-lg pl-4 pr-12",
                        errors.interventionDate && "border-red-500 focus:border-red-500"
                      )}
                    />
                    <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                  </div>
                  {errors.interventionDate && (
                    <p className="text-sm text-red-500">{errors.interventionDate}</p>
                  )}
                </div>

                <div className="space-y-3">
                  <Label htmlFor="functionary" className="text-sm font-semibold text-gray-900">
                    Fonctionnaire demandé
                    <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Select
                    value={formData.functionary}
                    onValueChange={(value) => updateFormData("functionary", value)}
                  >
                    <SelectTrigger 
                      className={cn(
                        "h-12 border-gray-300 rounded-lg",
                        errors.functionary && "border-red-500 focus:border-red-500"
                      )}
                    >
                      <SelectValue placeholder="Sélectionner un fonctionnaire" />
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

              {/* Row 4: Priority */}
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
            </form>
          </div>

          {/* Footer Actions */}
          <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 px-4 sm:px-8 py-6 border-t border-gray-200 bg-gray-50">
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

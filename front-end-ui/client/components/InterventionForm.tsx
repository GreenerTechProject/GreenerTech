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
      toast({
        title: "Intervention créée",
        description: "Votre demande d'intervention a été envoyée avec succès.",
      });
      handleClose();
    }
  };

  const handleSaveDraft = () => {
    onSaveDraft?.(formData);
    toast({
      title: "Brouillon sauvegardé",
      description: "Votre intervention a été sauvegardée en brouillon.",
    });
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
      <DialogContent className="max-w-[1396px] w-[95vw] max-h-[90vh] overflow-y-auto p-0 bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="flex h-[644px] px-8 py-8 items-center">
          <div className="w-full max-w-[1166px] mx-auto">
            <form className="space-y-8">
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
                    <SelectTrigger className="h-[47px] w-[567px] border border-gray-300 rounded-lg bg-white px-3 font-roboto text-base">
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
                    className="h-[50px] w-[567px] border border-gray-300 rounded-lg bg-white px-4 font-roboto text-base placeholder-gray-400"
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
                      className="h-[52px] w-[567px] border border-gray-300 rounded-lg bg-white px-7 font-inter text-lg text-black"
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
                    <SelectTrigger className="h-[47px] w-[567px] border border-gray-300 rounded-lg bg-white px-3 font-roboto text-base">
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
                  className="h-[122px] w-full border border-gray-300 rounded-lg bg-white p-4 font-roboto text-base placeholder-gray-400 resize-none"
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
                  className="h-12 px-6 bg-gray-100 border-0 text-gray-600 font-roboto text-base font-medium rounded-lg hover:bg-gray-200 flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Annuler
                </Button>

                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSaveDraft}
                    className="h-12 px-6 bg-blue-50 border-0 text-blue-700 font-roboto text-base font-medium rounded-lg hover:bg-blue-100 flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    Sauvegarder en brouillon
                  </Button>

                  <Button
                    type="button"
                    onClick={handleSubmit}
                    className="h-12 px-9 bg-blue-700 text-white font-roboto text-base font-medium rounded-lg hover:bg-blue-800 shadow-lg flex items-center gap-2"
                  >
                    <Send className="h-4 w-4" />
                    Envoyer la demande
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

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, ArrowLeft, Save, Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface InterventionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (data: InterventionFormData) => void;
}

export interface InterventionFormData {
  typeIntervention: string;
  idSerre: string;
  dateIntervention: string;
  fonctionnaireId: string;
  description: string;
  priorite: "basse" | "moyenne" | "haute" | "urgente";
}

const interventionTypes = [
  { value: "maintenance", label: "Maintenance préventive" },
  { value: "reparation", label: "Réparation" },
  { value: "controle", label: "Contrôle qualité" },
  { value: "nettoyage", label: "Nettoyage" },
  { value: "installation", label: "Installation équipement" },
  { value: "inspection", label: "Inspection" },
];

const fonctionnaires = [
  { value: "tech1", label: "Jean Dupont - Technicien Senior" },
  { value: "tech2", label: "Marie Martin - Technicienne" },
  { value: "tech3", label: "Pierre Durand - Spécialiste irrigation" },
  { value: "tech4", label: "Sophie Bernard - Technicienne maintenance" },
];

const priorityOptions = [
  { value: "basse", label: "Basse", color: "text-gray-600" },
  { value: "moyenne", label: "Moyenne", color: "text-blue-600" },
  { value: "haute", label: "Haute", color: "text-orange-600" },
  { value: "urgente", label: "Urgente", color: "text-red-600" },
];

export default function InterventionForm({ isOpen, onClose, onSubmit }: InterventionFormProps) {
  const [formData, setFormData] = useState<InterventionFormData>({
    typeIntervention: "",
    idSerre: "",
    dateIntervention: "",
    fonctionnaireId: "",
    description: "",
    priorite: "moyenne",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (asDraft: boolean = false) => {
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (onSubmit) {
      onSubmit(formData);
    }
    
    console.log(asDraft ? "Sauvegardé en brouillon" : "Demande envoyée", formData);
    
    setIsSubmitting(false);
    onClose();
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      typeIntervention: "",
      idSerre: "",
      dateIntervention: "",
      fonctionnaireId: "",
      description: "",
      priorite: "moyenne",
    });
  };

  const isFormValid = formData.typeIntervention && formData.idSerre && formData.dateIntervention && formData.fonctionnaireId;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-2xl font-semibold text-gray-900">
            Demande d'intervention
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto">
          <div className="space-y-8 p-1">
            {/* Row 1: Type d'intervention & ID Serre */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label htmlFor="type-intervention" className="text-sm font-semibold text-gray-700">
                  Type d'intervention demandée <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.typeIntervention}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, typeIntervention: value }))}
                >
                  <SelectTrigger 
                    id="type-intervention" 
                    className="h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
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
              </div>

              <div className="space-y-3">
                <Label htmlFor="id-serre" className="text-sm font-semibold text-gray-700">
                  ID Serre <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="id-serre"
                  value={formData.idSerre}
                  onChange={(e) => setFormData(prev => ({ ...prev, idSerre: e.target.value }))}
                  placeholder="Serre / Domaine / Bilan"
                  className="h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Row 2: Date & Fonctionnaire */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label htmlFor="date-intervention" className="text-sm font-semibold text-gray-700">
                  Date de l'intervention <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="date-intervention"
                    type="date"
                    value={formData.dateIntervention}
                    onChange={(e) => setFormData(prev => ({ ...prev, dateIntervention: e.target.value }))}
                    className="h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500 pr-10"
                  />
                  <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="fonctionnaire" className="text-sm font-semibold text-gray-700">
                  Fonctionnaire demandé <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.fonctionnaireId}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, fonctionnaireId: value }))}
                >
                  <SelectTrigger 
                    id="fonctionnaire" 
                    className="h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  >
                    <SelectValue placeholder="Sélectionner un fonctionnaire" />
                  </SelectTrigger>
                  <SelectContent>
                    {fonctionnaires.map((fonctionnaire) => (
                      <SelectItem key={fonctionnaire.value} value={fonctionnaire.value}>
                        {fonctionnaire.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-3">
              <Label htmlFor="description" className="text-sm font-semibold text-gray-700">
                Description de l'intervention (optionnel)
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Détails supplémentaires sur l'intervention..."
                rows={5}
                className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 resize-none"
              />
            </div>

            {/* Priority */}
            <div className="space-y-4">
              <Label className="text-sm font-semibold text-gray-700">Priorité</Label>
              <RadioGroup
                value={formData.priorite}
                onValueChange={(value) => setFormData(prev => ({ ...prev, priorite: value as any }))}
                className="flex flex-wrap gap-6"
              >
                {priorityOptions.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <RadioGroupItem 
                      value={option.value} 
                      id={option.value}
                      className="border-2 data-[state=checked]:border-blue-500 data-[state=checked]:bg-blue-500"
                    />
                    <Label 
                      htmlFor={option.value} 
                      className={cn("cursor-pointer font-medium", option.color)}
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
        <div className="border-t border-gray-200 pt-6 mt-6">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex items-center space-x-2 h-12 px-6 border-gray-300 hover:bg-gray-50"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Annuler</span>
            </Button>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                onClick={() => handleSubmit(true)}
                disabled={isSubmitting}
                className="flex items-center space-x-2 h-12 px-6 bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100"
              >
                <Save className="h-4 w-4" />
                <span>Sauvegarder en brouillon</span>
              </Button>
              
              <Button
                onClick={() => handleSubmit(false)}
                disabled={!isFormValid || isSubmitting}
                className="flex items-center space-x-2 h-12 px-8 bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
              >
                <Send className="h-4 w-4" />
                <span>{isSubmitting ? "Envoi..." : "Envoyer la demande"}</span>
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
